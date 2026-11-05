"""Receiving durable state with explicit scope, member lock and bounded replay.

Owner aggregate is intentionally bounded for two-task pilot; not a shared
cross-product platform. Source first-winning-pin semantics adapted from
study_editions; explicit CAS replaces source blind upserts/fail-open paths.
"""

from copy import deepcopy
from uuid import UUID
import json
import time
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from pydantic import ValidationError
from app.repositories.account import AccountError
from app.services import study_state as s
from app.contracts.tutor_runtime import BoundTurnInput, RunnerLimits

OWNER = "product_id='mitooni' AND issuer=%s AND subject_id=%s"


class PostgresStudyRepository:
    def __init__(
        self, config, *, runner_kind="provider", limits=None, call_budget=None
    ):
        if config.environment == "production" and (
            not isinstance(call_budget, int) or call_budget <= 0
        ):
            raise ValueError("Explicit receiving provider-call budget required")
        self.config = config
        self.runner_kind = runner_kind
        self.limits = limits or RunnerLimits()
        self.call_budget = call_budget or 64

    def connect(self):
        conn = None
        try:
            conn = psycopg.connect(
                **self.config.connection_options(), row_factory=dict_row
            )
            if hasattr(self.config, "verify_connection"):
                self.config.verify_connection(conn)
            return conn
        except Exception:
            if conn is not None:
                conn.close()
            raise AccountError(
                "store_unavailable",
                503,
                "Receiving database configuration is unavailable",
            ) from None

    def scope(self, c, user):
        try:
            subject = str(UUID(user.id))
        except ValueError:
            raise AccountError(
                "unauthenticated", 401, "Invalid authenticated identity"
            ) from None
        c.execute(
            "SELECT set_config('mitooni.issuer',%s,true),set_config('mitooni.subject',%s,true)",
            (self.config.issuer, subject),
        )
        return self.config.issuer, subject

    def authority(self, c, owner, tutor=False):
        m = c.execute(
            f"SELECT * FROM mitooni_app.memberships WHERE {OWNER} FOR UPDATE", owner
        ).fetchone()
        if not m or m["status"] != "active":
            s.error("membership_required", 403)
        if "study:use" not in m["entitlements"] or (
            tutor and "tutor:use" not in m["entitlements"]
        ):
            s.error("permission_denied", 403)
        return m["entitlements"]

    def load(self, c, owner):
        row = c.execute(
            f"SELECT * FROM mitooni_app.study_states WHERE {OWNER} FOR UPDATE", owner
        ).fetchone()
        state = row["data"] if row else s.empty_state(*owner)
        if row is None:
            state["budget"]["limit"] = self.call_budget
        if not isinstance(state, dict) or state.get("version") != 1:
            s.error("store_unavailable", 503)
        return state

    def save(self, c, owner, state):
        c.execute(
            "INSERT INTO mitooni_app.study_states(product_id,issuer,subject_id,data,revision) VALUES('mitooni',%s,%s,%s,1) ON CONFLICT(product_id,issuer,subject_id) DO UPDATE SET data=excluded.data,revision=mitooni_app.study_states.revision+1",
            (*owner, Jsonb(state)),
        )

    def pack_valid(self, row, use=None):
        from app.services.study_editions import manifest_hash, public_content_hash

        p = row["data"]
        if (
            row["manifest_hash"] != manifest_hash(p)
            or p["bundleRef"]["packId"] != row["id"]
            or p["bundleRef"]["packVersion"] != row["version"]
            or p["bundleRef"]["contentHash"] != row["content_hash"]
        ):
            s.error("content_unavailable", 503)
        if self.config.environment == "production" and row["fixture"]:
            s.error("fixture_forbidden", 503)
        if not row["fixture"] and p["bundleRef"]["contentHash"] != public_content_hash(
            p
        ):
            s.error("content_unavailable", 503)
        if use and (row["status"] != "approved" or use not in row["allowed_uses"]):
            s.error("publication_unavailable", 409)
        return p

    def packs(self, c):
        rows = c.execute(
            "SELECT DISTINCT ON(id) * FROM mitooni_app.study_packs ORDER BY id,version DESC"
        ).fetchall()
        result = []
        for row in rows:
            if (
                row["status"] != "approved"
                or "learner_delivery" not in row["allowed_uses"]
            ):
                continue
            if self.config.environment == "production" and row["fixture"]:
                continue
            result.append(self.pack_valid(row, "learner_delivery"))
        return result

    def publication(self, c, ws, use):
        ref = ws["bundleRef"]
        row = c.execute(
            "SELECT * FROM mitooni_app.study_packs WHERE id=%s AND version=%s FOR SHARE",
            (ref["packId"], ref["packVersion"]),
        ).fetchone()
        if row is None:
            s.error("publication_unavailable", 409)
        from app.services.study_editions import manifest_hash

        self.pack_valid(row, use)
        if (
            manifest_hash(ws["pack"]) != row["manifest_hash"]
            or ws["bundleRef"] != row["data"]["bundleRef"]
        ):
            s.error("content_unavailable", 503)
        return row

    def call(self, user, action, body=None, key=None, target=None):
        try:
            with self.connect() as c:
                owner = self.scope(c, user)
                ent = self.authority(c, owner, action in {"turn", "cancel", "accept"})
                state = self.load(c, owner)
                packs = self.packs(c)
                route = action + ":" + (target or "")
                payload = body.model_dump() if body is not None else {}
                bound_ws = state["workspaces"].get(target)
                if bound_ws is None and action == "resolve":
                    bound_ws = next(
                        (
                            w
                            for w in state["workspaces"].values()
                            if w["stepId"] == payload["stepId"]
                        ),
                        None,
                    )
                if bound_ws is None and action == "submit":
                    bound_ws = next(
                        (
                            w
                            for w in state["workspaces"].values()
                            if target in w["attempts"]
                        ),
                        None,
                    )
                if bound_ws is None and target in state["turns"]:
                    bound_ws = state["workspaces"][
                        state["turns"][target]["workspaceId"]
                    ]
                if bound_ws is None and target in state["proposals"]:
                    bound_ws = state["workspaces"][
                        state["proposals"][target]["workspaceId"]
                    ]
                if bound_ws and action not in {
                    "workspace",
                    "draft",
                    "cancel",
                    "journey",
                }:
                    self.publication(
                        c,
                        bound_ws,
                        "model_context"
                        if action in {"turn", "accept"}
                        else "learner_delivery",
                    )
                bundle = (
                    bound_ws["bundleRef"]
                    if bound_ws
                    else next(
                        (
                            p["bundleRef"]
                            for p in packs
                            if p["stepId"] == payload.get("stepId")
                        ),
                        None,
                    )
                )
                from app.services.study_editions import manifest_hash

                selected_pack = (
                    bound_ws["pack"]
                    if bound_ws
                    else next(
                        (p for p in packs if p["stepId"] == payload.get("stepId")), None
                    )
                )
                request_hash = s.digest(
                    dict(
                        route=route,
                        body=payload,
                        bundle=bundle,
                        manifestHash=manifest_hash(selected_pack)
                        if selected_pack
                        else None,
                    )
                )
                if key is not None:
                    previous = c.execute(
                        f"SELECT request_hash,outcome FROM mitooni_app.study_operations WHERE {OWNER} AND route=%s AND operation_id=%s AND created_at>now()-interval '24 hours'",
                        (*owner, route, key),
                    ).fetchone()
                    if previous:
                        if previous["request_hash"] != request_hash:
                            s.error("idempotency_conflict")
                        # Frozen historical outcome; UI must reject revision regression.
                        return self.projection(action, previous["outcome"])
                    c.execute(
                        f"DELETE FROM mitooni_app.study_operations WHERE {OWNER} AND created_at<=now()-interval '24 hours'",
                        owner,
                    )
                    if (
                        c.execute(
                            f"SELECT count(*) AS n FROM mitooni_app.study_operations WHERE {OWNER}",
                            owner,
                        ).fetchone()["n"]
                        >= 256
                    ):
                        s.error("operation_limit", 429)
                if action == "journey":
                    out = s.journey(state, packs)
                elif action == "workspace":
                    ws = s.owned_workspace(state, target)
                    out = s.workspace_view(ws, ent, state)
                    try:
                        self.publication(c, ws, "learner_delivery")
                    except AccountError as exc:
                        if exc.code != "publication_unavailable":
                            raise
                        # Owned old edition remains recoverable, but no new
                        # teaching/start action is advertised for withdrawn work.
                        out["capabilities"] = []
                        out["task"]["anchors"] = []
                elif action == "resolve":
                    selected = (
                        packs
                        if bound_ws is None
                        else [p for p in packs if p["stepId"] != bound_ws["stepId"]]
                        + [bound_ws["pack"]]
                    )
                    out = s.resolve(state, selected, payload, ent)
                elif action in {"draft", "submit", "assistance", "child"}:
                    if action == "submit":
                        ws = next(
                            (
                                w
                                for w in state["workspaces"].values()
                                if target in w["attempts"]
                            ),
                            None,
                        )
                        if not ws:
                            s.error("attempt_unavailable", 403)
                        if ws["currentAttemptId"] != target:
                            s.error("attempt_closed")
                    else:
                        ws = s.owned_workspace(state, target)
                    if ws["activeTurnId"] and action in {"assistance", "child"}:
                        s.error("turn_active")
                    out = s.modify_workspace(state, ws, action, payload, ent)
                elif action == "turn":
                    out = self.admit_turn(c, owner, state, target, payload)
                elif action == "cancel":
                    t = self.turn(state, target)
                    s.expect(t["revision"], payload["expectedTurnRevision"])
                    if t["status"] in {"queued", "running"}:
                        t["revision"] += 1
                        t["status"] = (
                            "canceled"
                            if t["status"] == "queued"
                            else "cancel-requested"
                        )
                        self.event(
                            t,
                            "canceled" if t["status"] == "canceled" else "tool_status",
                        )
                        if t["status"] == "canceled":
                            self.finish_terminal(c, owner, state, t)
                    out = self.public_turn(t)
                elif action == "accept":
                    out = self.accept(state, packs, target, payload)
                else:
                    s.error("invalid_request", 422)
                out = self.projection(action, out)
                if key is not None:
                    self.save(c, owner, state)
                    c.execute(
                        "INSERT INTO mitooni_app.study_operations(product_id,issuer,subject_id,route,operation_id,request_hash,outcome) VALUES('mitooni',%s,%s,%s,%s,%s,%s)",
                        (*owner, route, key, request_hash, Jsonb(out)),
                    )
                return out
        except (
            psycopg.Error,
            ValidationError,
            KeyError,
            TypeError,
            IndexError,
            AttributeError,
        ):
            raise AccountError(
                "store_unavailable", 503, "Study storage is unavailable"
            ) from None

    def projection(self, action, out):
        from app.contracts.study import (
            JourneyResponse,
            WorkspaceResponse,
            DraftOut,
            TurnOut,
            ProposalAcceptOut,
        )

        model = (
            JourneyResponse
            if action == "journey"
            else DraftOut
            if action == "draft"
            else TurnOut
            if action in {"turn", "cancel"}
            else ProposalAcceptOut
            if action == "accept"
            else WorkspaceResponse
        )
        return model.model_validate(out).model_dump()

    def turn(self, state, tid):
        t = state["turns"].get(tid)
        if not t:
            s.error("turn_unavailable", 403)
        return t

    def event(self, t, kind):
        t["lastEventSequence"] += 1
        t["events"].append(dict(sequence=t["lastEventSequence"], kind=kind))
        t["events"] = t["events"][-32:]

    def public_turn(self, t):
        fields = [
            "id",
            "revision",
            "workspaceId",
            "sequence",
            "inputWorkRevision",
            "bundleRef",
            "intent",
            "runnerKind",
            "status",
            "lastEventSequence",
            "error",
            "retryAction",
        ]
        return {k: deepcopy(t[k]) for k in fields}

    def admit_turn(self, c, owner, state, wid, b):
        ws = s.owned_workspace(state, wid)
        s.expect(ws["revision"], b["expectedWorkspaceRevision"])
        a, d = s.current(ws)
        if ws["activeTurnId"]:
            s.error("turn_active")
        context = ws["contexts"][ws["contextManifestId"]]
        if context.get("protocolVersion") != 2:
            context = s.context(ws, a, context["mode"])
            ws["contexts"][context["id"]] = context
            ws["contextManifestId"] = context["id"]
            ws["threadId"] = context["threadId"]
        if context["mode"] == "independent":
            s.error("condition_switch_required")
        ref = b["workRef"]
        if ref["kind"] == "draft":
            if a["status"] != "open" or ref["id"] != d["id"]:
                s.error("work_unavailable")
            s.expect(d["revision"], ref["revision"])
            text = d["text"]
        else:
            source = ws["attempts"].get(ref["id"])
            if not source or source["status"] != "submitted":
                s.error("work_unavailable")
            s.expect(source["draftRevision"], ref["revision"])
            text = source["responseSnapshot"]
        if b["intent"] == "feedback" and ref["kind"] != "attempt":
            s.error("submission_required")
        reserve = self.limits.sdk_turns
        budget = state["budget"]
        if budget["reserved"] + budget["settled"] + reserve > min(
            budget["limit"], self.call_budget
        ):
            s.error("budget_exhausted", 429)
        if len(state["turns"]) >= 32:
            s.error("turn_limit", 429)
        budget["reserved"] += reserve
        t = dict(
            id=s.uid(),
            revision=1,
            workspaceId=wid,
            sequence=len(state["turns"]) + 1,
            inputWorkRevision=ref["revision"],
            bundleRef=ws["bundleRef"],
            intent=b["intent"],
            runnerKind=self.runner_kind,
            status="queued",
            lastEventSequence=0,
            error=None,
            retryAction=None,
            events=[],
            fence=0,
            leaseUntil=0,
            dispatchId=None,
            reserved=reserve,
            settled=False,
            workRef=ref,
            workText=text,
            message=b["message"],
            attemptId=a["id"],
            contextId=context["id"],
            terminalMessage=None,
        )
        self.event(t, "accepted")
        state["turns"][t["id"]] = t
        ws["activeTurnId"] = t["id"]
        ws["latestTurnId"] = t["id"]
        ws["revision"] += 1
        c.execute(
            "INSERT INTO mitooni_app.study_queue(turn_id,issuer,subject_id) VALUES(%s,%s,%s)",
            (t["id"], *owner),
        )
        return self.public_turn(t)

    def poll(self, user, tid, after=None):
        try:
            with self.connect() as c:
                owner = self.scope(c, user)
                self.authority(c, owner, True)
                state = self.load(c, owner)
                t = self.turn(state, tid)
                if after is not None and (
                    after < 0
                    or after > t["lastEventSequence"]
                    or (t["events"] and after < t["events"][0]["sequence"] - 1)
                ):
                    raise AccountError(
                        "snapshot_required", 409, "Reload this turn without a cursor"
                    )
                from app.contracts.study import TurnResponse

                ws = s.owned_workspace(state, t["workspaceId"])
                if (
                    t["id"] != tid
                    or t["bundleRef"] != ws["bundleRef"]
                    or t["inputWorkRevision"] != t["workRef"]["revision"]
                ):
                    s.error("store_unavailable", 503)
                message = t["terminalMessage"]
                if message is not None:
                    provenance = message["provenance"]
                    if (
                        provenance["workRef"] != t["workRef"]
                        or provenance["contextManifestId"] != t["contextId"]
                        or message not in ws["messages"]
                    ):
                        s.error("store_unavailable", 503)
                    from app.services.tutor_output import validate_output

                    candidate = {
                        key: message[key]
                        for key in ["kind", "text", "workSpans", "observations"]
                    }
                    candidate["citations"] = [
                        {"anchorId": item["anchorId"]} for item in message["citations"]
                    ]
                    candidate["proposal"] = None
                    try:
                        validate_output(candidate, t, ws, state)
                    except AccountError:
                        s.error("store_unavailable", 503)
                return TurnResponse.model_validate(
                    dict(
                        turn=self.public_turn(t),
                        events=[]
                        if after is None
                        else [x for x in t["events"] if x["sequence"] > after],
                        cursor=t["lastEventSequence"],
                        workspaceRevision=state["workspaces"][t["workspaceId"]][
                            "revision"
                        ],
                        terminalMessage=t["terminalMessage"],
                    )
                ).model_dump()
        except (psycopg.Error, ValidationError, KeyError, TypeError):
            raise AccountError(
                "store_unavailable", 503, "Study storage is unavailable"
            ) from None

    def accept(self, state, packs, pid, b):
        p = state["proposals"].get(pid)
        if not p:
            s.error("proposal_unavailable", 403)
        s.expect(state["journey"]["revision"], b["expectedJourneyRevision"])
        s.expect(p["expectedJourneyRevision"], b["expectedJourneyRevision"])
        if p["status"] != "proposed":
            s.error("proposal_closed")
        ws = s.owned_workspace(state, p["workspaceId"])
        if p["targetStepId"] != ws["pack"]["nextStepId"] or not any(
            x["stepId"] == p["targetStepId"] for x in packs
        ):
            s.error("proposal_rejected")
        from app.services.study_editions import manifest_hash

        target = next(
            (pack for pack in packs if pack["stepId"] == p["targetStepId"]), None
        )
        if (
            target is None
            or p.get("targetManifestHash") != manifest_hash(target)
            or p.get("targetBundleRef") != target["bundleRef"]
        ):
            s.error("proposal_rejected", 409)
        ids = {x["id"] for x in state["evidence"] if x["attemptId"] in ws["attempts"]}
        if not set(p["evidenceIds"]).issubset(ids):
            s.error("proposal_rejected")
        p["status"] = "accepted"
        state["journey"]["revision"] += 1
        if ws["stepId"] not in state["journey"]["completed"]:
            state["journey"]["completed"].append(ws["stepId"])
        return dict(
            journey=s.journey(state, packs),
            proposal={
                k: v
                for k, v in p.items()
                if k not in {"workspaceId", "targetManifestHash", "targetBundleRef"}
            },
        )

    def finish_terminal(self, c, owner, state, t):
        ws = state["workspaces"][t["workspaceId"]]
        if ws["activeTurnId"] == t["id"]:
            ws["activeTurnId"] = None
            ws["revision"] += 1
        if not t["settled"]:
            state["budget"]["reserved"] -= t["reserved"]
            # Conservative charging: unknown dispatch consumes entire reserved ceiling.
            state["budget"]["settled"] += t["reserved"] if t["dispatchId"] else 0
            t["settled"] = True
        c.execute("DELETE FROM mitooni_app.study_queue WHERE turn_id=%s", (t["id"],))

    def queue(self):
        try:
            with self.connect() as c:
                return c.execute(
                    "SELECT turn_id,issuer,subject_id FROM mitooni_app.study_queue WHERE issuer=%s ORDER BY created_at LIMIT 16",
                    (self.config.issuer,),
                ).fetchall()
        except psycopg.Error:
            raise AccountError(
                "store_unavailable", 503, "Study storage is unavailable"
            ) from None

    def worker(self, user, tid, action, *, fence=None, candidate=None, error=None):
        """Atomic claimed-state operations. No network while holding DB locks."""
        try:
            with self.connect() as c:
                owner = self.scope(c, user)
                # Match API lock order even when quarantining a revoked owner.
                c.execute(
                    f"SELECT subject_id FROM mitooni_app.memberships WHERE {OWNER} FOR UPDATE",
                    owner,
                )
                state = self.load(c, owner)
                t = state["turns"].get(tid)
                if (
                    action == "claim"
                    and t is not None
                    and t["status"]
                    in {"completed", "failed", "canceled", "dispatch-unknown"}
                ):
                    c.execute(
                        "DELETE FROM mitooni_app.study_queue WHERE turn_id=%s", (tid,)
                    )
                    return None
                try:
                    self.authority(c, owner, True)
                    if t is None:
                        s.error("orphaned_turn", 403)
                    ws = s.owned_workspace(state, t["workspaceId"])
                    self.publication(c, ws, "model_context")
                except AccountError:
                    if action != "claim":
                        raise
                    if t is not None:
                        t["fence"] += 1
                        t["status"] = (
                            "canceled"
                            if t["status"] == "cancel-requested"
                            else "failed"
                        )
                        t["revision"] += 1
                        t["terminalMessage"] = None
                        t["error"] = {"code": "authority_unavailable"}
                        self.event(t, t["status"])
                        self.finish_terminal(c, owner, state, t)
                        self.save(c, owner, state)
                    else:
                        c.execute(
                            "DELETE FROM mitooni_app.study_queue WHERE turn_id=%s",
                            (tid,),
                        )
                    return None
                if action == "claim":
                    if (
                        t["status"] == "cancel-requested"
                        and t["leaseUntil"] < time.time()
                    ):
                        t["status"] = "canceled"
                        t["revision"] += 1
                        t["fence"] += 1
                        t["error"] = {"code": "turn_canceled"}
                        t["terminalMessage"] = None
                        self.event(t, "canceled")
                        self.finish_terminal(c, owner, state, t)
                        self.save(c, owner, state)
                        return None
                    if t["status"] in {
                        "completed",
                        "failed",
                        "canceled",
                        "dispatch-unknown",
                    }:
                        c.execute(
                            "DELETE FROM mitooni_app.study_queue WHERE turn_id=%s",
                            (tid,),
                        )
                        return None
                    if t["status"] == "running" and t["leaseUntil"] < time.time():
                        t["status"] = (
                            "dispatch-unknown" if t["dispatchId"] else "queued"
                        )
                        t["revision"] += 1
                        if t["status"] == "dispatch-unknown":
                            t["error"] = {"code": "dispatch_unknown"}
                            t["retryAction"] = "explicit_new_turn"
                            self.event(t, "dispatch_unknown")
                            self.finish_terminal(c, owner, state, t)
                            self.save(c, owner, state)
                            return None
                    if t["status"] != "queued":
                        return None
                    t["fence"] += 1
                    t["leaseUntil"] = time.time() + self.limits.timeout_seconds + 10
                    t["status"] = "running"
                    t["revision"] += 1
                    self.event(t, "started")
                    self.save(c, owner, state)
                    context = ws["contexts"][t["contextId"]]
                    if context["mode"] == "independent":
                        s.error("condition_switch_required")
                    expected = s.context(
                        ws, ws["attempts"][t["attemptId"]], context["mode"]
                    )
                    for field in [
                        "anchorHash",
                        "taskHash",
                        "manifestHash",
                        "protocolVersion",
                        "historyPolicy",
                        "bundleRef",
                    ]:
                        if context.get(field) != expected[field]:
                            s.error("context_mismatch", 409)
                    profile = c.execute(
                        f"SELECT data FROM mitooni_app.profiles WHERE {OWNER}", owner
                    ).fetchone()
                    preferences = profile["data"] if profile else {}
                    task_context = s.task_projection(ws["pack"])
                    learning_control = dict(
                        stage=ws["stage"],
                        assistanceMode=context["mode"],
                        locale=preferences.get("locale", "fa"),
                        selfReportedCurrentLevel=str(preferences["currentLevel"])
                        if preferences.get("currentLevel") is not None
                        else None,
                        permittedFeedbackKinds=["feedback"]
                        if t["intent"] == "feedback"
                        else ["explanation", "question"],
                        nextStepIds=[ws["pack"]["nextStepId"]],
                    )
                    prior = sorted(
                        (
                            previous
                            for previous in state["turns"].values()
                            if previous["workspaceId"] == ws["id"]
                            and previous["contextId"] == context["id"]
                            and previous["status"] == "completed"
                            and previous["terminalMessage"]
                        ),
                        key=lambda previous: previous["sequence"],
                    )[-3:]
                    history = tuple(
                        item
                        for previous in prior
                        for item in (
                            dict(
                                role="user",
                                text=json.dumps(
                                    dict(
                                        scope="historical_exchange_not_current_work",
                                        message=previous["message"],
                                        workRef=previous["workRef"],
                                        bundleRef=previous["bundleRef"],
                                        contextManifestId=previous["contextId"],
                                    ),
                                    ensure_ascii=False,
                                    separators=(",", ":"),
                                ),
                            ),
                            dict(
                                role="assistant",
                                text=previous["terminalMessage"]["text"],
                            ),
                        )
                    )
                    input_hash = s.digest(
                        dict(
                            manifest=context,
                            task=task_context,
                            anchors=ws["pack"]["anchors"],
                            history=history,
                            workRef=t["workRef"],
                            workHash=s.digest(t["workText"]),
                            learningControl=learning_control,
                        )
                    )
                    t["contextPayloadHash"] = input_hash
                    self.save(c, owner, state)
                    return BoundTurnInput(
                        actor_id=user.id,
                        issuer=self.config.issuer,
                        workspace_id=ws["id"],
                        attempt_id=t["attemptId"],
                        turn_id=t["id"],
                        dispatch_id=s.uid(),
                        fence=t["fence"],
                        bundle=ws["bundleRef"],
                        context_manifest_id=context["id"],
                        context_hash=input_hash,
                        work_ref=t["workRef"],
                        work_text=t["workText"],
                        intent=t["intent"],
                        message=t["message"],
                        anchors=tuple(ws["pack"]["anchors"]),
                        criterion_ids=tuple(ws["pack"]["criteria"]),
                        allowed_history=history,
                        assistance_mode=context["mode"],
                        task_context=task_context,
                        learning_control=learning_control,
                        limits=self.limits,
                    )
                if t["fence"] != fence or t["status"] not in {
                    "running",
                    "cancel-requested",
                }:
                    s.error("turn_fenced")
                if (
                    action in {"check", "dispatch", "complete", "tool"}
                    and t["leaseUntil"] <= time.time()
                ):
                    s.error("turn_lease_expired", 409)
                if action == "check":
                    return t["status"]
                if action == "dispatch":
                    if t["status"] == "cancel-requested":
                        s.error("turn_canceled")
                    t["dispatchId"] = candidate
                    s.expose(state, ws, "model_context", t["attemptId"])
                elif action == "complete":
                    if t["status"] == "cancel-requested":
                        s.error("turn_canceled")
                    from app.services.tutor_output import validate_output

                    msg, proposal = validate_output(candidate, t, ws, state)
                    ws["messages"].append(msg)
                    t["terminalMessage"] = msg
                    if proposal:
                        from app.services.study_editions import manifest_hash

                        target_pack = next(
                            (
                                pack
                                for pack in self.packs(c)
                                if pack["stepId"] == proposal["targetStepId"]
                            ),
                            None,
                        )
                        if target_pack is None:
                            s.error("proposal_rejected", 409)
                        proposal["targetManifestHash"] = manifest_hash(target_pack)
                        proposal["targetBundleRef"] = target_pack["bundleRef"]
                        state["proposals"][proposal["id"]] = proposal
                    s.expose(state, ws, "ai_feedback", t["attemptId"])
                    t["status"] = "completed"
                    t["revision"] += 1
                    self.event(t, "completed")
                    self.finish_terminal(c, owner, state, t)
                elif action == "fail":
                    t["status"] = (
                        "canceled"
                        if t["status"] == "cancel-requested" or error == "turn_canceled"
                        else "dispatch-unknown"
                        if error == "dispatch_unknown"
                        else "failed"
                    )
                    t["revision"] += 1
                    t["error"] = {"code": error or "provider_unavailable"}
                    t["retryAction"] = "explicit_new_turn"
                    self.event(
                        t,
                        "dispatch_unknown"
                        if t["status"] == "dispatch-unknown"
                        else t["status"],
                    )
                    self.finish_terminal(c, owner, state, t)
                elif action == "tool":
                    name = candidate["name"]
                    context = ws["contexts"][t["contextId"]]
                    if (
                        context["mode"] == "independent"
                        or t["status"] == "cancel-requested"
                    ):
                        s.error("tool_denied", 403)
                    if name == "approved_anchor":
                        anchor = next(
                            (
                                a
                                for a in ws["pack"]["anchors"]
                                if a["id"] == candidate["arguments"]["anchorId"]
                            ),
                            None,
                        )
                        if not anchor:
                            s.error("tool_denied", 403)
                        s.expose(state, ws, "tool_anchor", t["attemptId"])
                        result = {"anchor": anchor}
                    elif name == "learning_snapshot":
                        profile = c.execute(
                            f"SELECT data FROM mitooni_app.profiles WHERE {OWNER}",
                            owner,
                        ).fetchone()
                        preferences = profile["data"] if profile else {}
                        result = dict(
                            workRef=t["workRef"],
                            assistanceMode=context["mode"],
                            stage=ws["stage"],
                            locale=preferences.get("locale", "fa"),
                            selfReportedCurrentLevel=str(preferences["currentLevel"])
                            if preferences.get("currentLevel") is not None
                            else None,
                            criterionIds=ws["pack"]["criteria"],
                            permittedFeedbackKinds=["feedback"]
                            if t["intent"] == "feedback"
                            else ["explanation", "question"],
                        )
                    elif name == "next_options":
                        ids = [
                            e["id"]
                            for e in state["evidence"]
                            if e["attemptId"] in ws["attempts"]
                        ]
                        result = dict(
                            options=[
                                dict(
                                    targetStepId=ws["pack"]["nextStepId"],
                                    evidenceIds=ids,
                                )
                            ]
                            if ids
                            else []
                        )
                    else:
                        s.error("tool_denied", 403)
                    self.save(c, owner, state)
                    return result
                self.save(c, owner, state)
                return self.public_turn(t)
        except (psycopg.Error, ValidationError, KeyError, TypeError, AttributeError):
            raise AccountError(
                "store_unavailable", 503, "Study storage is unavailable"
            ) from None
