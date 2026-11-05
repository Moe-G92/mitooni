"""Actual PG, isolated test owner; never resets browser/account fixture owners."""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
import pytest
from app.contracts.study import (
    ResolveIn,
    DraftIn,
    SubmitIn,
    AssistanceIn,
    TurnIn,
    ChildAttemptIn,
)
from app.repositories.postgres_study import PostgresStudyRepository
from app.repositories.account import LocalPostgresConfig, AccountError
from app.dependencies import CurrentUser
from app.providers.synthetic_runner import SyntheticRunner
from app.workers.tutor_turns import TutorWorker
from local.seed import admin_connection
from local.upgrade_study import upgrade


@pytest.fixture
def study(request):
    if not request.config.getoption("--local-postgres"):
        pytest.skip("Explicit isolated PostgreSQL opt-in required")
    u = CurrentUser(str(uuid4()), "study@example.invalid")
    config = LocalPostgresConfig()
    with admin_connection() as c:
        c.execute(
            "INSERT INTO mitooni_app.memberships(product_id,issuer,subject_id,status,roles,entitlements) VALUES('mitooni',%s,%s,'active',ARRAY['learner'],ARRAY['study:use','tutor:use','study:independent'])",
            (config.issuer, u.id),
        )
    r = PostgresStudyRepository(config, runner_kind="synthetic")
    yield r, u
    with admin_connection() as c:
        for table in ["study_queue", "study_operations", "study_states"]:
            c.execute(
                f"DELETE FROM mitooni_app.{table} WHERE issuer=%s AND subject_id=%s",
                (config.issuer, u.id),
            )
        c.execute(
            "DELETE FROM mitooni_app.memberships WHERE issuer=%s AND subject_id=%s",
            (config.issuer, u.id),
        )


def open_ws(r, u, mode="supported", step="reading-evidence", key=None):
    return r.call(
        u,
        "resolve",
        ResolveIn(stepId=step, conditionPreset=mode, expectedJourneyRevision=1),
        key or uuid4(),
    )


def save(r, u, w, text="B", key=None):
    return r.call(
        u,
        "draft",
        DraftIn(
            expectedDraftRevision=w["draft"]["revision"],
            taskId=w["draft"]["taskId"],
            changes={"text": text},
        ),
        key or uuid4(),
        w["id"],
    )


def reload(r, u, w):
    return r.call(u, "workspace", target=w["id"])


def submit(r, u, w):
    w = reload(r, u, w)
    return r.call(
        u,
        "submit",
        SubmitIn(
            expectedWorkspaceRevision=w["revision"],
            expectedDraftRevision=w["draft"]["revision"],
            expectedConditionsRevision=w["attempt"]["conditionsRevision"],
        ),
        uuid4(),
        w["currentAttemptId"],
    )


def turn(r, u, w, intent="explain", key=None, message="Please help"):
    w = reload(r, u, w)
    a = w["attempt"]
    ref = (
        {"kind": "attempt", "id": a["id"], "revision": a["draftRevision"]}
        if a["status"] == "submitted"
        else {
            "kind": "draft",
            "id": w["draft"]["id"],
            "revision": w["draft"]["revision"],
        }
    )
    return r.call(
        u,
        "turn",
        TurnIn(
            expectedWorkspaceRevision=w["revision"],
            workRef=ref,
            intent=intent,
            message=message,
        ),
        key or uuid4(),
        w["id"],
    )


def finish(r, u):
    worker = TutorWorker(r, SyntheticRunner())
    for row in r.queue():
        if str(row["subject_id"]) == u.id:
            asyncio.run(worker.process(row))


def test_open_pin_and_resume_concurrency(study):
    r, u = study
    with ThreadPoolExecutor(max_workers=4) as p:
        ws = list(p.map(lambda _: open_ws(r, u), range(4)))
    assert len({w["id"] for w in ws}) == 1
    assert len({w["draft"]["id"] for w in ws}) == 1
    assert ws[0]["bundleRef"] == ws[-1]["bundleRef"]


def test_draft_cas_replay_and_restart(study):
    r, u = study
    w = open_ws(r, u)
    key = uuid4()
    d = save(r, u, w, key=key)
    assert save(r, u, w, key=key) == d
    with pytest.raises(AccountError, match="revision_conflict"):
        save(r, u, w, "A")
    r2 = PostgresStudyRepository(r.config, runner_kind="synthetic")
    w2 = reload(r2, u, w)
    assert (
        w2["draft"]["text"] == "B"
        and w2["draft"]["revision"] == 2
        and w2["revision"] == 1
    )


def test_independent_no_model_then_explicit_switch(study):
    r, u = study
    w = open_ws(r, u, "independent")
    assert w["task"]["anchors"] == []
    with pytest.raises(AccountError, match="condition_switch_required"):
        turn(r, u, w)
    w = r.call(
        u,
        "assistance",
        AssistanceIn(
            expectedWorkspaceRevision=w["revision"],
            expectedConditionsRevision=1,
            action="switch_to_supported",
        ),
        uuid4(),
        w["id"],
    )
    assert (
        w["attempt"]["originalConditions"] == "independent"
        and w["attempt"]["currentConditions"] == "supported"
    )
    t = turn(r, u, w)
    finish(r, u)
    assert r.poll(u, t["id"])["turn"]["status"] == "completed"


def test_frozen_independent_then_review_and_child(study):
    r, u = study
    w = open_ws(r, u, "independent")
    save(r, u, w)
    w = submit(r, u, w)
    assert w["attempt"]["eligibility"]["decision"] == "independent"
    assert w["rawCheck"]["correctCount"] == 1
    aid = w["attempt"]["id"]
    t = turn(r, u, w, "feedback")
    finish(r, u)
    assert (
        r.poll(u, t["id"])["terminalMessage"]["provenance"]["actorKind"]
        == "ai_formative"
    )
    w = reload(r, u, w)
    assert w["attempt"]["eligibility"]["decision"] == "independent"
    child = r.call(
        u,
        "child",
        ChildAttemptIn(
            expectedWorkspaceRevision=w["revision"],
            parentAttemptId=aid,
            conditionPreset="supported",
        ),
        uuid4(),
        w["id"],
    )
    assert (
        child["attempt"]["id"] != aid
        and child["attempt"]["parentAttemptId"] == aid
        and child["attempt"]["currentConditions"] == "supported"
    )


def test_durable_turn_no_raw_stream_and_followup(study):
    r, u = study
    w = open_ws(r, u)
    save(r, u, w)
    t = turn(r, u, w)
    finish(r, u)
    p = r.poll(u, t["id"])
    assert p["turn"]["status"] == "completed" and p["terminalMessage"]["text"]
    assert "PRIVATE CANDIDATE" not in str(p)
    assert p["events"] == []
    assert reload(r, u, w)["latestTurnId"] == t["id"]
    t2 = turn(r, u, w)
    finish(r, u)
    assert r.poll(u, t2["id"])["turn"]["status"] == "completed"
    assert len(reload(r, u, w)["messages"]) == 2
    with pytest.raises(AccountError, match="snapshot_required"):
        r.poll(u, t["id"], 999)


def test_owner_membership_and_spoofed_reference(study):
    r, u = study
    w = open_ws(r, u)
    other = CurrentUser(str(uuid4()))
    with pytest.raises(AccountError) as e:
        r.call(other, "workspace", target=w["id"])
    assert e.value.status == 403
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.memberships SET status='inactive' WHERE issuer=%s AND subject_id=%s",
            (r.config.issuer, u.id),
        )
    with pytest.raises(AccountError) as e:
        r.call(u, "workspace", target=w["id"])
    assert e.value.status == 403


def test_stale_fence_and_dispatch_unknown_no_retry(study):
    r, u = study
    w = open_ws(r, u)
    t = turn(r, u, w)
    bound = r.worker(u, t["id"], "claim")
    r.worker(u, t["id"], "dispatch", fence=bound.fence, candidate=bound.dispatch_id)
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.study_states SET data=jsonb_set(data,ARRAY['turns',%s,'leaseUntil'],'0'::jsonb) WHERE issuer=%s AND subject_id=%s",
            (t["id"], r.config.issuer, u.id),
        )
    assert r.worker(u, t["id"], "claim") is None
    p = r.poll(u, t["id"])
    assert p["turn"]["status"] == "dispatch-unknown" and p["terminalMessage"] is None
    assert not any(str(x["turn_id"]) == t["id"] for x in r.queue())


def test_failed_output_never_released(study):
    r, u = study
    w = open_ws(r, u)
    t = turn(r, u, w)
    b = r.worker(u, t["id"], "claim")
    r.worker(u, t["id"], "dispatch", fence=b.fence, candidate=b.dispatch_id)
    with pytest.raises(AccountError):
        r.worker(
            u,
            t["id"],
            "complete",
            fence=b.fence,
            candidate={
                "kind": "explanation",
                "text": "Your band score is 8",
                "citations": [{"anchorId": "foreign"}],
            },
        )
    assert r.poll(u, t["id"])["terminalMessage"] is None


def test_http_real_datastore_strict_auth_and_profile_independent(study):
    from fastapi.testclient import TestClient
    from app.main import create_app
    from app.config import BackendConfig
    from app.repositories.postgres_account import PostgresAccountRepository

    r, u = study

    class Verifier:
        def verify(self, token):
            if token != "synthetic-test":
                raise ValueError()
            return u

    app = create_app(
        BackendConfig(
            "http://127.0.0.1:54321", "local", "synthetic", environment="test"
        ),
        verifier=Verifier(),
        account_repository=PostgresAccountRepository(r.config),
        study_repository=r,
        tutor_runner=SyntheticRunner(),
    )
    h = {
        "Authorization": "Bearer synthetic-test",
        "X-Expected-User-Id": u.id,
        "Idempotency-Key": str(uuid4()),
    }
    with TestClient(app) as client:
        assert client.get("/api/study/journey").status_code == 401
        response = client.get("/api/study/journey", headers=h)
        assert response.status_code == 200
        assert response.headers["cache-control"] == "private, no-store"
        body = {
            "stepId": "reading-evidence",
            "conditionPreset": "supported",
            "expectedJourneyRevision": 1,
        }
        assert (
            client.post(
                "/api/study/workspaces/resolve",
                json=body | {"roles": ["admin"]},
                headers=h,
            ).status_code
            == 422
        )
        assert (
            client.post(
                "/api/study/workspaces/resolve",
                json=body,
                headers=h | {"X-Expected-User-Id": str(uuid4())},
            ).status_code
            == 409
        )
        response = client.post("/api/study/workspaces/resolve", json=body, headers=h)
        assert response.status_code == 200
        w = response.json()
        h["Idempotency-Key"] = str(uuid4())
        t = client.post(
            f"/api/study/workspaces/{w['id']}/turns",
            headers=h,
            json={
                "expectedWorkspaceRevision": 1,
                "workRef": {"kind": "draft", "id": w["draft"]["id"], "revision": 1},
                "intent": "explain",
                "message": "Help me understand the evidence.",
            },
        )
        assert t.status_code == 202
        finish(r, u)
        p = client.get(f"/api/study/turns/{t.json()['id']}", headers=h)
        assert p.status_code == 200 and p.json()["terminalMessage"]["text"]
        bad = client.get(
            f"/api/study/turns/{t.json()['id']}?afterSequence=999", headers=h
        )
        assert (
            bad.status_code == 409 and bad.json()["detail"]["snapshotRequired"] is True
        )


def test_real_state_to_sdk_request_includes_task_and_followup(study):
    import httpx, json
    from app.providers.agents_runner import AgentsRunner
    from app.workers.tutor_turns import AuthorizedTools

    r, u = study
    r.runner_kind = "provider"
    w = open_ws(r, u)
    save(r, u, w)
    t = turn(r, u, w, message="Clarify evidence and cause.")
    requests = []
    candidate = dict(
        kind="explanation",
        text="The survey reports walking; it does not establish the cause.",
        citations=[{"anchorId": "reading-causation"}],
        workSpans=[],
        observations=[],
        proposal=None,
    )

    def sse():
        item = {
            "id": "msg_test",
            "type": "message",
            "role": "assistant",
            "status": "completed",
            "content": [
                {
                    "type": "output_text",
                    "text": json.dumps(candidate),
                    "annotations": [],
                }
            ],
        }
        response = {
            "id": "resp_test",
            "object": "response",
            "created_at": 0,
            "status": "completed",
            "error": None,
            "incomplete_details": None,
            "instructions": None,
            "metadata": {},
            "model": "test-model",
            "output": [item],
            "parallel_tool_calls": False,
            "temperature": 1,
            "tool_choice": "auto",
            "tools": [],
            "top_p": 1,
            "usage": {"input_tokens": 5, "output_tokens": 8, "total_tokens": 13},
        }
        return (
            "data: "
            + json.dumps(
                {
                    "type": "response.completed",
                    "sequence_number": 0,
                    "response": response,
                }
            )
            + "\n\n"
        ).encode()

    async def once(tid):
        async def handler(request):
            requests.append(json.loads(request.content))
            return httpx.Response(
                200, headers={"content-type": "text/event-stream"}, content=sse()
            )

        # Runner owns/closes injected client after each stream, use one per turn.
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        runner = AgentsRunner(
            api_key="synthetic-no-provider", model="test-model", http_client=client
        )
        worker = TutorWorker(r, runner)
        await worker.process(
            next(row for row in r.queue() if str(row["turn_id"]) == tid)
        )

    asyncio.run(once(t["id"]))
    assert r.poll(u, t["id"])["turn"]["status"] == "completed"
    t2 = turn(r, u, w, message="A later increase alone does not establish the cause.")
    asyncio.run(once(t2["id"]))
    assert r.poll(u, t2["id"])["turn"]["status"] == "completed"
    t3 = turn(r, u, w, message="What would strengthen the causal evidence?")
    asyncio.run(once(t3["id"]))
    assert r.poll(u, t3["id"])["turn"]["status"] == "completed"
    restored = reload(r, u, w)
    assert [m["requestText"] for m in restored["messages"]] == [
        "Clarify evidence and cause.",
        "A later increase alone does not establish the cause.",
        "What would strengthen the causal evidence?",
    ]
    raw = json.dumps(requests)
    assert "shaded walking path" in raw and "Choose the supported claim" in raw
    assert "objectiveDescription" in raw and "learningControl" in raw
    assert "privateKey" not in raw and u.id not in raw
    assert any(item.get("role") == "assistant" for item in requests[1]["input"])
    previous_users = [
        item["content"] for item in requests[2]["input"] if item.get("role") == "user"
    ]
    historical = [json.loads(item) for item in previous_users[:2]]
    assert [item["message"] for item in historical] == [
        "Clarify evidence and cause.",
        "A later increase alone does not establish the cause.",
    ]
    assert all(
        item["scope"] == "historical_exchange_not_current_work"
        and item["workRef"]["revision"] == 2
        for item in historical
    )


def test_concurrent_cas_one_writer_and_cancel_queued(study):
    r, u = study
    w = open_ws(r, u)

    def attempt(text):
        try:
            return save(r, u, w, text)["revision"]
        except AccountError as e:
            return e.code

    with ThreadPoolExecutor(max_workers=2) as p:
        results = list(p.map(attempt, ["A", "B"]))
    assert sorted(map(str, results)) == ["2", "revision_conflict"]
    from app.contracts.study import CancelIn

    t = turn(r, u, w)
    out = r.call(
        u, "cancel", CancelIn(expectedTurnRevision=t["revision"]), uuid4(), t["id"]
    )
    assert out["status"] == "canceled" and r.poll(u, t["id"])["terminalMessage"] is None
    assert reload(r, u, w)["activeTurnId"] is None


def test_budget_authority_fails_before_queue(study):
    r, u = study
    w = open_ws(r, u)
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.study_states SET data=jsonb_set(data,'{budget,limit}','1'::jsonb) WHERE issuer=%s AND subject_id=%s",
            (r.config.issuer, u.id),
        )
    with pytest.raises(AccountError) as e:
        turn(r, u, w)
    assert e.value.status == 429
    assert not [x for x in r.queue() if str(x["subject_id"]) == u.id]


def test_real_worker_provider_timeout_is_unknown(study):
    from app.contracts.tutor_runtime import RunnerFailure

    class TimedOut(SyntheticRunner):
        async def stream(self, prepared):
            raise RunnerFailure("provider_timeout")
            yield

    r, u = study
    w = open_ws(r, u)
    t = turn(r, u, w)
    worker = TutorWorker(r, TimedOut())
    row = next(x for x in r.queue() if str(x["turn_id"]) == t["id"])
    asyncio.run(worker.process(row))
    p = r.poll(u, t["id"])
    assert p["turn"]["status"] == "dispatch-unknown" and p["terminalMessage"] is None


def test_corrupt_operation_and_snapshot_sanitized(study):
    r, u = study
    key = uuid4()
    w = open_ws(r, u, key=key)
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.study_operations SET outcome='null'::jsonb WHERE issuer=%s AND subject_id=%s",
            (r.config.issuer, u.id),
        )
    with pytest.raises(AccountError) as e:
        open_ws(r, u, key=key)
    assert e.value.code == "store_unavailable"
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.study_states SET data=jsonb_set(data,ARRAY['workspaces',%s,'drafts',%s,'revision'],'\"PRIVATE_CORRUPT\"'::jsonb) WHERE issuer=%s AND subject_id=%s",
            (w["id"], w["draft"]["id"], r.config.issuer, u.id),
        )
    with pytest.raises(AccountError) as e:
        reload(r, u, w)
    assert e.value.code == "store_unavailable" and "PRIVATE" not in str(e.value)


def test_rls_browser_and_cross_owner_denied(study):
    import psycopg

    r, u = study
    open_ws(r, u)
    with r.connect() as c:
        r.scope(c, CurrentUser(str(uuid4())))
        assert (
            c.execute("SELECT count(*) AS n FROM mitooni_app.study_states").fetchone()[
                "n"
            ]
            == 0
        )
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            c.execute("UPDATE mitooni_app.study_packs SET version=99")
    with admin_connection() as c:
        c.execute("SET LOCAL ROLE mitooni_browser")
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            c.execute("SELECT * FROM mitooni_app.study_states")


def test_tool_choices_and_current_revocation(study):
    from app.workers.tutor_turns import AuthorizedTools

    r, u = study
    w = open_ws(r, u)
    save(r, u, w)
    w = submit(r, u, w)
    t = turn(r, u, w, "propose_next")
    b = r.worker(u, t["id"], "claim")
    r.worker(u, t["id"], "dispatch", fence=b.fence, candidate=b.dispatch_id)
    tools = AuthorizedTools(r, u, b)
    result = asyncio.run(tools.call("next_options", {}))
    assert (
        result["options"][0]["targetStepId"] == "writing-reasons"
        and result["options"][0]["evidenceIds"]
    )
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.memberships SET status='inactive' WHERE issuer=%s AND subject_id=%s",
            (r.config.issuer, u.id),
        )
    with pytest.raises(AccountError):
        asyncio.run(tools.call("learning_snapshot", {}))


def test_later_publication_cannot_repin_existing_workspace(study):
    from psycopg.types.json import Jsonb
    from copy import deepcopy
    import hashlib, json

    r, u = study
    w = open_ws(r, u)
    original = w["bundleRef"]
    with admin_connection() as c:
        row = c.execute(
            "SELECT data FROM mitooni_app.study_packs WHERE id='reading-evidence' AND version=1"
        ).fetchone()[0]
        p = deepcopy(row)
        p["stimulus"] = "New original synthetic edition."
        p["bundleRef"]["packVersion"] = 2
        raw = {
            k: v
            for k, v in p.items()
            if k not in {"bundleRef", "nextStepId", "publication"}
        }
        p["bundleRef"]["contentHash"] = hashlib.sha256(
            json.dumps(raw, sort_keys=True).encode()
        ).hexdigest()
        c.execute(
            "INSERT INTO mitooni_app.study_packs(id,version,content_hash,data,manifest_hash,status,fixture,allowed_uses) VALUES('reading-evidence',2,%s,%s,%s,'approved',true,ARRAY['learner_delivery','model_context'])",
            (
                p["bundleRef"]["contentHash"],
                Jsonb(p),
                __import__(
                    "app.services.study_editions", fromlist=["manifest_hash"]
                ).manifest_hash(p),
            ),
        )
    try:
        assert reload(r, u, w)["bundleRef"] == original
        assert open_ws(r, u)["id"] == w["id"]
    finally:
        with admin_connection() as c:
            c.execute(
                "DELETE FROM mitooni_app.study_packs WHERE id='reading-evidence' AND version=2"
            )


def test_next_proposal_validated_and_accept_replay(study):
    from app.contracts.study import AcceptProposalIn

    r, u = study
    w = open_ws(r, u)
    save(r, u, w)
    w = submit(r, u, w)
    t = turn(r, u, w, "propose_next")
    finish(r, u)
    msg = r.poll(u, t["id"])["terminalMessage"]
    assert msg["proposalId"]
    key = uuid4()
    body = AcceptProposalIn(expectedJourneyRevision=1)
    out = r.call(u, "accept", body, key, msg["proposalId"])
    assert out["journey"]["revision"] == 2
    assert out["proposal"]["targetStepId"] == "writing-reasons"
    assert r.call(u, "accept", body, key, msg["proposalId"]) == out
    with pytest.raises(AccountError):
        r.call(u, "accept", body, uuid4(), msg["proposalId"])


def test_cancel_stalled_actual_sdk_without_waiting_for_delta(study):
    import httpx
    from app.providers.agents_runner import AgentsRunner
    from app.contracts.study import CancelIn

    r, u = study
    r.runner_kind = "provider"
    w = open_ws(r, u)
    t = turn(r, u, w)

    async def scenario():
        started = asyncio.Event()
        interrupted = asyncio.Event()

        async def handler(request):
            started.set()
            try:
                await asyncio.Event().wait()
            except asyncio.CancelledError:
                interrupted.set()
                raise

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner = AgentsRunner(
                api_key="synthetic-no-provider", model="test-model", http_client=client
            )
            worker = TutorWorker(r, runner)
            row = next(row for row in r.queue() if str(row["turn_id"]) == t["id"])
            task = asyncio.create_task(worker.process(row))
            await asyncio.wait_for(started.wait(), timeout=2)
            current = r.poll(u, t["id"])["turn"]
            r.call(
                u,
                "cancel",
                CancelIn(expectedTurnRevision=current["revision"]),
                uuid4(),
                t["id"],
            )
            await asyncio.wait_for(task, timeout=2)
            assert interrupted.is_set()

    asyncio.run(scenario())
    p = r.poll(u, t["id"])
    assert p["turn"]["status"] == "canceled"
    assert p["terminalMessage"] is None


def test_ambient_hostaddr_cannot_redirect_and_service_is_rejected(study, monkeypatch):
    r, u = study
    monkeypatch.setenv("PGHOSTADDR", "192.0.2.99")
    assert r.config.connection_options()["hostaddr"] == "127.0.0.1"
    assert r.call(u, "journey")["steps"]
    monkeypatch.setenv("PGSERVICE", "synthetic_untrusted_service")
    with pytest.raises(AccountError) as e:
        r.call(u, "journey")
    assert e.value.code == "store_unavailable"
    monkeypatch.delenv("PGSERVICE")
    monkeypatch.delenv("PGHOSTADDR")


def test_publication_revocation_blocks_calls_preserves_old_work(study):
    r, u = study
    w = open_ws(r, u)
    save(r, u, w)
    t = turn(r, u, w)
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.study_packs SET status='withdrawn' WHERE id='reading-evidence' AND version=1"
        )
    try:
        old = reload(r, u, w)
        assert (
            old["draft"]["text"] == "B"
            and old["capabilities"] == []
            and old["task"]["anchors"] == []
        )
        with pytest.raises(AccountError):
            turn(r, u, w)
        row = next(x for x in r.queue() if str(x["turn_id"]) == t["id"])
        asyncio.run(TutorWorker(r, SyntheticRunner()).process(row))
        assert r.poll(u, t["id"])["turn"]["status"] == "failed"
        assert r.poll(u, t["id"])["terminalMessage"] is None
    finally:
        with admin_connection() as c:
            c.execute(
                "UPDATE mitooni_app.study_packs SET status='approved' WHERE id='reading-evidence' AND version=1"
            )


def test_model_use_revocation_rechecked_after_claim(study):
    r, u = study
    w = open_ws(r, u)
    t = turn(r, u, w)
    b = r.worker(u, t["id"], "claim")
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.study_packs SET allowed_uses=ARRAY['learner_delivery'] WHERE id='reading-evidence' AND version=1"
        )
    try:
        with pytest.raises(AccountError):
            r.worker(u, t["id"], "dispatch", fence=b.fence, candidate=b.dispatch_id)
        with pytest.raises(AccountError):
            r.worker(
                u,
                t["id"],
                "tool",
                fence=b.fence,
                candidate={"name": "learning_snapshot", "arguments": {}},
            )
        with pytest.raises(AccountError):
            r.worker(u, t["id"], "complete", fence=b.fence, candidate={})
    finally:
        with admin_connection() as c:
            c.execute(
                "UPDATE mitooni_app.study_packs SET allowed_uses=ARRAY['learner_delivery','model_context'] WHERE id='reading-evidence' AND version=1"
            )


def test_manifest_covers_graph_and_bundle(study):
    from psycopg.types.json import Jsonb
    from copy import deepcopy

    r, u = study
    with admin_connection() as c:
        original = c.execute(
            "SELECT data FROM mitooni_app.study_packs WHERE id='reading-evidence' AND version=1"
        ).fetchone()[0]
    try:
        for change in ["nextStepId", "bundleRef"]:
            p = deepcopy(original)
            if change == "nextStepId":
                p[change] = "foreign"
            else:
                p[change]["policyVersion"] = 999
            with admin_connection() as c:
                c.execute(
                    "UPDATE mitooni_app.study_packs SET data=%s WHERE id='reading-evidence' AND version=1",
                    (Jsonb(p),),
                )
            with pytest.raises(AccountError) as e:
                r.call(u, "journey")
            assert e.value.code == "content_unavailable"
    finally:
        with admin_connection() as c:
            c.execute(
                "UPDATE mitooni_app.study_packs SET data=%s WHERE id='reading-evidence' AND version=1",
                (Jsonb(original),),
            )


def test_fixture_published_still_not_production_eligible(study):
    from types import SimpleNamespace

    r, u = study
    local = r.config
    # Injected driver seam tests production filtering without a remote connection.
    r.config = SimpleNamespace(
        environment="production",
        issuer=local.issuer,
        connection_options=local.connection_options,
    )
    assert r.call(u, "journey")["steps"] == []
    with pytest.raises(AccountError):
        open_ws(r, u)
    r.config = local


def test_quarantine_invalid_head_jobs_and_crashed_cancel(study):
    from app.contracts.study import CancelIn

    r, u = study
    w = open_ws(r, u)
    t = turn(r, u, w)
    orphan_ids = [str(uuid4()) for _ in range(18)]
    with admin_connection() as c:
        for tid in orphan_ids:
            c.execute(
                "INSERT INTO mitooni_app.study_queue(turn_id,issuer,subject_id,created_at) VALUES(%s,%s,%s,now()-interval '1 hour')",
                (tid, r.config.issuer, str(uuid4())),
            )
    try:
        worker = TutorWorker(r, SyntheticRunner())
        for _ in range(3):
            for row in r.queue():
                if str(row["turn_id"]) in orphan_ids + [t["id"]]:
                    asyncio.run(worker.process(row))
        assert r.poll(u, t["id"])["turn"]["status"] == "completed"
        assert not any(str(row["turn_id"]) in orphan_ids for row in r.queue())
        nextturn = turn(r, u, w)
        b = r.worker(u, nextturn["id"], "claim")
        r.worker(u, nextturn["id"], "dispatch", fence=b.fence, candidate=b.dispatch_id)
        current = r.poll(u, nextturn["id"])["turn"]
        r.call(
            u,
            "cancel",
            CancelIn(expectedTurnRevision=current["revision"]),
            uuid4(),
            nextturn["id"],
        )
        with admin_connection() as c:
            c.execute(
                "UPDATE mitooni_app.study_states SET data=jsonb_set(data,ARRAY['turns',%s,'leaseUntil'],'0'::jsonb) WHERE issuer=%s AND subject_id=%s",
                (nextturn["id"], r.config.issuer, u.id),
            )
        assert r.worker(u, nextturn["id"], "claim") is None
        assert r.poll(u, nextturn["id"])["turn"]["status"] == "canceled"
        assert r.poll(u, nextturn["id"])["terminalMessage"] is None
    finally:
        with admin_connection() as c:
            c.execute(
                "DELETE FROM mitooni_app.study_queue WHERE turn_id=ANY(%s::uuid[])",
                (orphan_ids,),
            )


def test_postsubmit_context_hash_matches_anchors_and_task(study):
    from app.services.study_editions import projection_revision
    from app.services.study_state import task_projection, digest

    r, u = study
    w = open_ws(r, u, "independent")
    save(r, u, w)
    w = submit(r, u, w)
    t = turn(r, u, w, "feedback")
    b = r.worker(u, t["id"], "claim")
    assert b.assistance_mode == "post_submit_review" and b.anchors
    with r.connect() as c:
        owner = r.scope(c, u)
        state = r.load(c, owner)
        ws = state["workspaces"][w["id"]]
        manifest = ws["contexts"][b.context_manifest_id]
        assert manifest["anchorHash"] == projection_revision(
            {"ordered_anchors": list(b.anchors)}
        )
        assert manifest["taskHash"] == digest(task_projection(ws["pack"]))
        assert state["turns"][t["id"]]["contextPayloadHash"] == b.context_hash


def test_receiving_target_role_verification_keeps_account_read_transaction_valid(study):
    from app.repositories.postgres_target import ReceivingPostgresTarget
    from app.repositories.postgres_account import PostgresAccountRepository

    r, u = study
    target = ReceivingPostgresTarget(
        host="127.0.0.1",
        database=r.config.database,
        issuer=r.config.issuer,
        user="mitooni_api",
        password="",
        port=r.config.port,
        environment="test",
    )
    assert target.connection_options()["hostaddr"] == "127.0.0.1"
    account = PostgresAccountRepository(target).get(u)
    assert account["membership"]["status"] == "active" and account["profile"] is None
    assert PostgresStudyRepository(target, runner_kind="synthetic").call(u, "journey")[
        "steps"
    ]


def test_expired_same_fence_cannot_tool_dispatch_or_complete(study):
    r, u = study
    w = open_ws(r, u)
    t = turn(r, u, w)
    b = r.worker(u, t["id"], "claim")
    with admin_connection() as c:
        c.execute(
            "UPDATE mitooni_app.study_states SET data=jsonb_set(data,ARRAY['turns',%s,'leaseUntil'],'0'::jsonb) WHERE issuer=%s AND subject_id=%s",
            (t["id"], r.config.issuer, u.id),
        )
    for action in ["dispatch", "tool", "complete"]:
        with pytest.raises(AccountError) as e:
            r.worker(u, t["id"], action, fence=b.fence, candidate={})
        assert e.value.code == "turn_lease_expired"
    assert r.poll(u, t["id"])["terminalMessage"] is None


@pytest.mark.parametrize(
    "corruption", ["terminal_noncompleted", "other_turn", "other_work", "event_private"]
)
def test_corrupt_terminal_linkage_safe503(study, corruption):
    from psycopg.types.json import Jsonb

    r, u = study
    w = open_ws(r, u)
    t = turn(r, u, w)
    finish(r, u)
    with admin_connection() as c:
        state = c.execute(
            "SELECT data FROM mitooni_app.study_states WHERE issuer=%s AND subject_id=%s",
            (r.config.issuer, u.id),
        ).fetchone()[0]
        stored = state["turns"][t["id"]]
        if corruption == "terminal_noncompleted":
            stored["status"] = "failed"
        elif corruption == "other_turn":
            stored["terminalMessage"]["turnId"] = "PRIVATE_CORRUPT"
        elif corruption == "other_work":
            stored["terminalMessage"]["provenance"]["workRef"]["id"] = "PRIVATE_CORRUPT"
        else:
            stored["events"][0]["raw"] = "PRIVATE_CORRUPT"
        c.execute(
            "UPDATE mitooni_app.study_states SET data=%s WHERE issuer=%s AND subject_id=%s",
            (Jsonb(state), r.config.issuer, u.id),
        )
    with pytest.raises(AccountError) as e:
        r.poll(u, t["id"], 0 if corruption == "event_private" else None)
    assert e.value.code == "store_unavailable" and "PRIVATE" not in str(e.value)
