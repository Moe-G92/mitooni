"""Bounded Reading/Task2 lifecycle. Persistence/authority live in repository.

BarEx source af57036: guided_learning workspace pin/reuse and dependency-
injected execution/replan mechanics adapted to explicit receiving conditions.
No source prompts, legal domain models or domain data are admitted.
"""

from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import json
from uuid import uuid4, uuid5, NAMESPACE_URL
from app.repositories.account import AccountError
from app.contracts.study import WorkspaceResponse
from app.services.study_editions import projection_revision


def uid():
    return str(uuid4())


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(x):
    return sha256(
        json.dumps(
            x, sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode()
    ).hexdigest()


def error(code, status=409):
    raise AccountError(
        code, status, "Study action is unavailable; reload and try again"
    )


def expect(actual, wanted):
    if actual != wanted:
        error("revision_conflict")


def empty_state(issuer, subject):
    return dict(
        version=1,
        journey=dict(
            id=str(uuid5(NAMESPACE_URL, issuer + subject)),
            revision=1,
            policyVersion=1,
            completed=[],
        ),
        workspaces={},
        exposure=[],
        turns={},
        proposals={},
        budget=dict(limit=64, reserved=0, settled=0),
        evidence=[],
    )


def journey(state, packs):
    j = state["journey"]
    steps = []
    for latest in packs:
        workspace = next(
            (
                w
                for w in state["workspaces"].values()
                if w["stepId"] == latest["stepId"]
            ),
            None,
        )
        if workspace:
            # Resolving an existing run resumes its exact conditions and edition;
            # its own admitted stimulus is not a fresh-unseen eligibility request.
            pack = workspace["pack"]
            presets = [
                workspace["attempts"][workspace["currentAttemptId"]][
                    "currentConditions"
                ]
            ]
        else:
            pack = latest
            exposed = any(
                event["familyId"] == pack["familyId"] for event in state["exposure"]
            )
            presets = ["supported"] if exposed else ["supported", "independent"]
        steps.append(
            dict(
                stepId=pack["stepId"],
                title=pack["title"],
                skill=pack["skill"],
                state="completed" if pack["stepId"] in j["completed"] else "available",
                bundleRef=pack["bundleRef"],
                conditionPresets=presets,
                reasonEvidenceIds=[],
            )
        )
    return dict(
        id=j["id"],
        revision=j["revision"],
        policyVersion=j["policyVersion"],
        steps=steps,
    )


def expose(state, ws, kind, attempt_id=None):
    if len(state["exposure"]) >= 512:
        error("exposure_limit", 429)
    state["exposure"].append(
        dict(
            sequence=len(state["exposure"]) + 1,
            familyId=ws["pack"]["familyId"],
            workspaceId=ws["id"],
            attemptId=attempt_id or ws["currentAttemptId"],
            kind=kind,
            at=now(),
        )
    )


def task_projection(pack):
    result = {
        key: pack[key] for key in ["taskId", "kind", "title", "stimulus", "prompt"]
    }
    result["objectiveDescription"] = (
        pack.get("objectiveDescription") or pack["anchors"][0]["text"]
    )
    return result


def context(ws, attempt, mode):
    anchors = (
        ws["pack"]["anchors"] if mode in {"supported", "post_submit_review"} else []
    )
    from app.services.study_editions import manifest_hash

    return dict(
        id=uid(),
        threadId=uid(),
        attemptId=attempt["id"],
        mode=mode,
        bundleRef=ws["bundleRef"],
        protocolVersion=2,
        anchorHash=projection_revision({"ordered_anchors": anchors}),
        taskHash=digest(task_projection(ws["pack"])),
        manifestHash=manifest_hash(ws["pack"]),
        historyPolicy="same_manifest_last_six_committed",
    )


def new_attempt(ws, mode, parent=None):
    aid, did = uid(), uid()
    a = dict(
        id=aid,
        status="open",
        bundleRef=ws["bundleRef"],
        taskId=ws["pack"]["taskId"],
        familyId=ws["pack"]["familyId"],
        originalConditions=mode,
        currentConditions=mode,
        conditionsRevision=1,
        draftId=did,
        draftRevision=1,
        responseSnapshot=None,
        responseSnapshotHash=None,
        eligibility=dict(decision="pending", reasons=[]),
        startedAt=now(),
        submittedAt=None,
        parentAttemptId=parent,
    )
    ws["attempts"][aid] = a
    ws["drafts"][did] = dict(
        id=did,
        workspaceId=ws["id"],
        attemptId=aid,
        revision=1,
        taskId=a["taskId"],
        kind=ws["pack"]["kind"],
        text="",
        updatedAt=now(),
    )
    ws["currentAttemptId"] = aid
    c = context(ws, a, mode)
    ws["contexts"][c["id"]] = c
    ws["contextManifestId"] = c["id"]
    ws["threadId"] = c["threadId"]
    return a


def owned_workspace(state, wid):
    ws = state["workspaces"].get(wid)
    if ws is None:
        error("workspace_unavailable", 403)
    return ws


def current(ws):
    a = ws["attempts"][ws["currentAttemptId"]]
    return a, ws["drafts"][a["draftId"]]


def workspace_view(ws, entitlements, state):
    a, d = current(ws)
    p = ws["pack"]
    supported = a["currentConditions"] == "supported"
    capabilities = []
    if a["status"] == "open":
        capabilities += ["draft:write", "attempt:submit"]
        if not supported:
            capabilities += ["support:switch"]
    else:
        capabilities += ["attempt:revise"]
    if "tutor:use" in entitlements and (supported or a["status"] == "submitted"):
        capabilities += ["tutor:use"]
    anchors = p["anchors"] if supported or a["status"] == "submitted" else []
    # No stored private fields are projected through a model dump.
    out = dict(
        id=ws["id"],
        revision=ws["revision"],
        journeyId=ws["journeyId"],
        stepId=ws["stepId"],
        bundleRef=ws["bundleRef"],
        threadId=ws["threadId"],
        contextManifestId=ws["contextManifestId"],
        stage=ws["stage"],
        currentAttemptId=a["id"],
        activeTurnId=ws["activeTurnId"],
        capabilities=capabilities,
        task=dict(
            taskId=p["taskId"],
            kind=p["kind"],
            title=p["title"],
            stimulus=p["stimulus"],
            prompt=p["prompt"],
            anchors=anchors,
        ),
        draft=d,
        attempt=a,
        messages=[
            dict(
                m,
                requestText=state["turns"]
                .get(m["turnId"], {})
                .get("message", m.get("requestText", "")),
            )
            for m in ws["messages"]
        ],
        proposals=[
            x for x in state["proposals"].values() if x["workspaceId"] == ws["id"]
        ],
        rawCheck=ws.get("rawChecks", {}).get(a["id"]),
        latestTurnId=ws.get("latestTurnId"),
    )
    out["proposals"] = [
        {
            k: v
            for k, v in x.items()
            if k not in {"workspaceId", "targetManifestHash", "targetBundleRef"}
        }
        for x in out["proposals"]
    ]
    return WorkspaceResponse.model_validate(out).model_dump()


def resolve(state, packs, b, ent):
    expect(state["journey"]["revision"], b["expectedJourneyRevision"])
    p = next((p for p in packs if p["stepId"] == b["stepId"]), None)
    if p is None:
        error("content_unavailable", 503)
    for ws in state["workspaces"].values():
        if ws["stepId"] == p["stepId"]:
            a, _ = current(ws)
            if a["currentConditions"] != b["conditionPreset"]:
                error("condition_switch_required")
            return workspace_view(ws, ent, state)
    mode = b["conditionPreset"]
    if mode == "independent":
        if "study:independent" not in ent:
            error("permission_denied", 403)
        if any(x["familyId"] == p["familyId"] for x in state["exposure"]):
            error("assessment_ineligible")
    if len(state["workspaces"]) >= 8:
        error("workspace_limit", 429)
    ws = dict(
        id=uid(),
        revision=1,
        journeyId=state["journey"]["id"],
        stepId=p["stepId"],
        bundleRef=deepcopy(p["bundleRef"]),
        pack=deepcopy(p),
        stage="working",
        activeTurnId=None,
        attempts={},
        drafts={},
        contexts={},
        messages=[],
        rawChecks={},
    )
    a = new_attempt(ws, mode)
    a["admissionExposureSequence"] = len(state["exposure"])
    # Internal admission baseline is stored separately from public Attempt DTO.
    a.pop("admissionExposureSequence")
    ws["admissionBaselines"] = {a["id"]: len(state["exposure"])}
    state["workspaces"][ws["id"]] = ws
    expose(state, ws, "stimulus")
    if mode == "supported":
        expose(state, ws, "teaching_anchor")
    return workspace_view(ws, ent, state)


def modify_workspace(state, ws, action, b, ent):
    a, d = current(ws)
    if action == "draft":
        expect(d["revision"], b["expectedDraftRevision"])
        if b["taskId"] != a["taskId"] or a["status"] != "open":
            error("draft_closed")
        d["text"] = b["changes"]["text"]
        d["revision"] += 1
        d["updatedAt"] = now()
        a["draftRevision"] = d["revision"]
        return deepcopy(d)
    expect(ws["revision"], b["expectedWorkspaceRevision"])
    if action == "submit":
        expect(d["revision"], b["expectedDraftRevision"])
        expect(a["conditionsRevision"], b["expectedConditionsRevision"])
        if a["status"] != "open":
            error("attempt_submitted")
        if not d["text"].strip():
            error("response_required", 422)
        contaminated = any(
            x["familyId"] == a["familyId"] and x["kind"] not in {"stimulus"}
            for x in state["exposure"][ws["admissionBaselines"][a["id"]] :]
        )
        independent = a["currentConditions"] == "independent" and not contaminated
        a.update(
            status="submitted",
            responseSnapshot=d["text"],
            responseSnapshotHash=digest(d["text"]),
            submittedAt=now(),
            eligibility=dict(
                decision="independent" if independent else "supported",
                reasons=[] if independent else ["assistance_or_exposure"],
            ),
        )
        if ws["pack"]["kind"] == "reading":
            ws["rawChecks"][a["id"]] = dict(
                actorKind="deterministic_check",
                itemCount=1,
                correctCount=int(d["text"].strip().upper() == ws["pack"]["privateKey"]),
                workRef=dict(kind="attempt", id=a["id"], revision=d["revision"]),
            )
        # Post-submit review is a distinct supported context; frozen attempt stays.
        c = context(ws, a, "post_submit_review")
        ws["contexts"][c["id"]] = c
        ws["contextManifestId"] = c["id"]
        ws["threadId"] = c["threadId"]
        expose(state, ws, "post_submit_review")
        ws["stage"] = "submitted"
        eid = uid()
        state["evidence"].append(
            dict(
                id=eid,
                attemptId=a["id"],
                responseHash=a["responseSnapshotHash"],
                actorKind="deterministic_check"
                if ws["pack"]["kind"] == "reading"
                else "learner_submission",
            )
        )
    elif action == "assistance":
        expect(a["conditionsRevision"], b["expectedConditionsRevision"])
        if a["status"] != "open" or a["currentConditions"] != "independent":
            error("condition_switch_unavailable")
        a["currentConditions"] = "supported"
        a["conditionsRevision"] += 1
        c = context(ws, a, "supported")
        ws["contexts"][c["id"]] = c
        ws["contextManifestId"] = c["id"]
        ws["threadId"] = c["threadId"]
        expose(state, ws, "explicit_support_switch")
    elif action == "child":
        if a["status"] != "submitted" or a["id"] != b["parentAttemptId"]:
            error("revision_unavailable")
        old = d["text"]
        new = new_attempt(ws, "supported", a["id"])
        ws["admissionBaselines"][new["id"]] = len(state["exposure"])
        ws["drafts"][new["draftId"]]["text"] = old
        expose(state, ws, "supported_revision")
        ws["stage"] = "working"
    else:
        error("invalid_request", 422)
    ws["revision"] += 1
    return workspace_view(ws, ent, state)
