"""Strict Mo-facing request DTOs; authority is never a writable field."""

from typing import Literal
from pydantic import Field, model_validator
from app.contracts.tutor_runtime import StrictModel, WorkSpan, Observation


class ResolveIn(StrictModel):
    stepId: str = Field(min_length=1, max_length=120)
    conditionPreset: Literal["supported", "independent"]
    expectedJourneyRevision: int = Field(ge=1)


class DraftChanges(StrictModel):
    text: str = Field(max_length=20000)


class DraftIn(StrictModel):
    expectedDraftRevision: int = Field(ge=1)
    taskId: str = Field(min_length=1, max_length=120)
    changes: DraftChanges


class SubmitIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)
    expectedDraftRevision: int = Field(ge=1)
    expectedConditionsRevision: int = Field(ge=1)


class AssistanceIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)
    expectedConditionsRevision: int = Field(ge=1)
    action: Literal["switch_to_supported"]


class ChildAttemptIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)
    parentAttemptId: str
    conditionPreset: Literal["supported"]


class WorkRef(StrictModel):
    kind: Literal["draft", "attempt"]
    id: str
    revision: int = Field(ge=1)


class TurnIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)
    workRef: WorkRef
    intent: Literal["explain", "hint", "feedback", "propose_next"]
    message: str = Field(max_length=3000)


class CancelIn(StrictModel):
    expectedTurnRevision: int = Field(ge=1)


class AcceptProposalIn(StrictModel):
    expectedJourneyRevision: int = Field(ge=1)


class DraftOut(StrictModel):
    id: str
    workspaceId: str
    attemptId: str
    revision: int
    taskId: str
    kind: Literal["reading", "task2"]
    text: str
    updatedAt: str


class BundleRef(StrictModel):
    packId: str
    packVersion: int
    contentHash: str
    objectiveId: str
    objectiveVersion: int
    rubricVersion: int
    policyVersion: int
    familyRegistryVersion: int


class AttemptOut(StrictModel):
    id: str
    status: Literal["open", "submitted"]
    bundleRef: BundleRef
    taskId: str
    familyId: str
    originalConditions: Literal["supported", "independent"]
    currentConditions: Literal["supported", "independent"]
    conditionsRevision: int
    draftId: str
    draftRevision: int
    responseSnapshot: str | None = None
    responseSnapshotHash: str | None = None
    eligibility: dict
    startedAt: str
    submittedAt: str | None = None
    parentAttemptId: str | None = None


class WorkspaceOut(StrictModel):
    id: str
    revision: int
    journeyId: str
    stepId: str
    bundleRef: BundleRef
    threadId: str
    contextManifestId: str
    stage: Literal["working", "submitted", "reviewing"]
    currentAttemptId: str
    activeTurnId: str | None
    capabilities: list[str]
    task: dict
    draft: DraftOut
    attempt: AttemptOut
    messages: list[dict]


class JourneyOut(StrictModel):
    id: str
    revision: int
    policyVersion: int
    steps: list[dict]


class TurnOut(StrictModel):
    id: str
    revision: int
    workspaceId: str
    sequence: int
    inputWorkRevision: int
    bundleRef: BundleRef
    intent: str
    runnerKind: Literal["provider", "synthetic"]
    status: Literal[
        "queued",
        "running",
        "cancel-requested",
        "canceled",
        "completed",
        "failed",
        "dispatch-unknown",
    ]
    lastEventSequence: int
    error: dict | None
    retryAction: str | None


class TurnPollOut(StrictModel):
    turn: TurnOut
    events: list[dict]
    cursor: int
    workspaceRevision: int
    terminalMessage: dict | None


# Exact nested wire shapes for the UI; schema export includes these directly.
class StepOut(StrictModel):
    stepId: str
    title: str
    skill: Literal["reading", "writing"]
    state: Literal["available", "completed", "locked"]
    bundleRef: BundleRef
    conditionPresets: list[Literal["supported", "independent"]]
    reasonEvidenceIds: list[str]


class AnchorOut(StrictModel):
    id: str
    label: str
    text: str


class TaskOut(StrictModel):
    taskId: str
    kind: Literal["reading", "task2"]
    title: str
    stimulus: str
    prompt: str
    anchors: list[AnchorOut]


class ProposalOut(StrictModel):
    id: str
    turnId: str
    expectedJourneyRevision: int
    targetStepId: str
    evidenceIds: list[str]
    status: Literal["proposed", "accepted", "rejected"]
    decisionReasons: list[str]


class PublicProvenance(StrictModel):
    actorKind: Literal["ai_formative"]
    runnerKind: Literal["provider", "synthetic"]
    bundleRef: BundleRef
    contextManifestId: str
    workRef: WorkRef


class PublicCitation(StrictModel):
    anchorId: str
    label: str


class MessageOut(StrictModel):
    requestText: str = Field(default="", max_length=3000)
    id: str
    turnId: str
    workspaceId: str
    kind: Literal["explanation", "question", "feedback"]
    text: str = Field(min_length=1, max_length=6000)
    citations: list[PublicCitation] = Field(max_length=8)
    workSpans: list[WorkSpan] = Field(max_length=8)
    observations: list[Observation] = Field(max_length=8)
    proposalId: str | None
    provenance: PublicProvenance
    createdAt: str


class JourneyResponse(JourneyOut):
    steps: list[StepOut]


class RawCheck(StrictModel):
    actorKind: Literal["deterministic_check"]
    itemCount: Literal[1]
    correctCount: Literal[0, 1]
    workRef: WorkRef


class WorkspaceResponse(WorkspaceOut):
    task: TaskOut
    messages: list[MessageOut]
    capabilities: list[
        Literal[
            "draft:write",
            "attempt:submit",
            "support:switch",
            "tutor:use",
            "attempt:revise",
        ]
    ]
    latestTurnId: str | None = None
    proposals: list[ProposalOut] = Field(default_factory=list)
    rawCheck: RawCheck | None = None

    @model_validator(mode="after")
    def coherent_workspace(self):
        if (
            self.draft.workspaceId != self.id
            or self.draft.attemptId != self.attempt.id
            or self.currentAttemptId != self.attempt.id
            or self.attempt.draftId != self.draft.id
            or self.draft.revision != self.attempt.draftRevision
            or self.draft.taskId != self.task.taskId
            or self.task.taskId != self.attempt.taskId
            or self.attempt.bundleRef != self.bundleRef
        ):
            raise ValueError("Incoherent workspace binding")
        if (
            self.attempt.status == "submitted"
            and self.attempt.responseSnapshot != self.draft.text
        ):
            raise ValueError("Incoherent frozen work")
        if any(
            message.workspaceId != self.id
            or message.provenance.bundleRef != self.bundleRef
            for message in self.messages
        ):
            raise ValueError("Incoherent message binding")
        if self.rawCheck and (
            self.attempt.status != "submitted"
            or self.rawCheck.workRef.kind != "attempt"
            or self.rawCheck.workRef.id != self.attempt.id
            or self.rawCheck.workRef.revision != self.attempt.draftRevision
        ):
            raise ValueError("Incoherent raw check binding")
        return self


class PublicTurnEvent(StrictModel):
    sequence: int = Field(ge=1)
    kind: Literal[
        "accepted",
        "started",
        "tool_status",
        "completed",
        "failed",
        "canceled",
        "dispatch_unknown",
    ]


class TurnResponse(TurnPollOut):
    terminalMessage: MessageOut | None
    events: list[PublicTurnEvent] = Field(max_length=32)

    @model_validator(mode="after")
    def coherent_terminal(self):
        message = self.terminalMessage
        if (self.turn.status == "completed") != (message is not None):
            raise ValueError("Incoherent terminal state")
        if message is not None and (
            message.turnId != self.turn.id
            or message.workspaceId != self.turn.workspaceId
            or message.provenance.bundleRef != self.turn.bundleRef
            or message.provenance.runnerKind != self.turn.runnerKind
            or message.provenance.workRef.revision != self.turn.inputWorkRevision
        ):
            raise ValueError("Incoherent terminal binding")
        sequences = [event.sequence for event in self.events]
        if (
            self.cursor != self.turn.lastEventSequence
            or sequences != sorted(set(sequences))
            or any(sequence > self.cursor for sequence in sequences)
        ):
            raise ValueError("Incoherent event ledger")
        return self


class ProposalAcceptOut(StrictModel):
    journey: JourneyResponse
    proposal: ProposalOut
