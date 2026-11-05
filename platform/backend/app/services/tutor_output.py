"""Bounded terminal release validation, never a semantic correctness claim."""

import json
import re
from app.contracts.tutor_runtime import TutorCandidate
from app.services import study_state as s

# Detect common prohibited claims; evaluation must measure missed/false matches.
SCORE = re.compile(
    r"\b(?:band\s*(?:score\s*)?(?:is\s*)?[:=]?\s*\d|(?:your|overall)\s+(?:score|band)\s*(?:is|:)\s*\d|mastery\s*[:=]\s*\d)",
    re.I,
)


def validate_output(candidate, t, ws, state):
    try:
        c = TutorCandidate.model_validate(candidate).model_dump()
    except Exception:
        s.error("invalid_output", 422)
    if len(json.dumps(c, ensure_ascii=False).encode()) > 32768:
        s.error("invalid_output", 422)
    if SCORE.search(c["text"]) or any(
        SCORE.search(o["text"]) for o in c["observations"]
    ):
        s.error("policy_violation", 422)
    if t["intent"] == "feedback":
        if (
            c["kind"] != "feedback"
            or t["workRef"]["kind"] != "attempt"
            or not c["workSpans"]
            or not c["observations"]
        ):
            s.error("invalid_output", 422)
    elif c["kind"] not in {"explanation", "question"}:
        s.error("invalid_output", 422)
    if not c["citations"]:
        s.error("invalid_reference", 422)
    allowed = {a["id"]: a for a in ws["pack"]["anchors"]}
    if any(x["anchorId"] not in allowed for x in c["citations"]):
        s.error("invalid_reference", 422)
    for span in c["workSpans"]:
        if (
            span["end"] <= span["start"]
            or t["workText"][span["start"] : span["end"]] != span["quote"]
            or span["end"] > len(t["workText"])
        ):
            s.error("invalid_reference", 422)
    for o in c["observations"]:
        if o["criterionId"] not in ws["pack"]["criteria"] or any(
            i < 0 or i >= len(c["workSpans"]) for i in o["workSpanIndexes"]
        ):
            s.error("invalid_reference", 422)
    proposal = None
    if c["proposal"]:
        p = c["proposal"]
        ids = {x["id"] for x in state["evidence"] if x["attemptId"] in ws["attempts"]}
        if p["targetStepId"] != ws["pack"]["nextStepId"] or not set(
            p["evidenceIds"]
        ).issubset(ids):
            s.error("proposal_rejected", 422)
        if not ids:
            s.error("submission_required", 422)
        proposal = dict(
            id=s.uid(),
            turnId=t["id"],
            workspaceId=ws["id"],
            expectedJourneyRevision=state["journey"]["revision"],
            targetStepId=p["targetStepId"],
            evidenceIds=p["evidenceIds"] or sorted(ids),
            status="proposed",
            decisionReasons=["teacher_policy_next_step"],
        )
    msg = dict(
        id=s.uid(),
        requestText=t.get("message", ""),
        turnId=t["id"],
        workspaceId=ws["id"],
        kind=c["kind"],
        text=c["text"],
        citations=[
            dict(anchorId=x["anchorId"], label=allowed[x["anchorId"]]["label"])
            for x in c["citations"]
        ],
        workSpans=c["workSpans"],
        observations=c["observations"],
        proposalId=proposal["id"] if proposal else None,
        provenance=dict(
            actorKind="ai_formative",
            runnerKind=t["runnerKind"],
            bundleRef=t["bundleRef"],
            contextManifestId=t["contextId"],
            workRef=t["workRef"],
        ),
        createdAt=s.now(),
    )
    if len(json.dumps(msg, ensure_ascii=False).encode()) > 32768:
        s.error("invalid_output", 422)
    return msg, proposal
