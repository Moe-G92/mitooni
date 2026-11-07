"""Private frozen Speaking assessment bindings; not learner HTTP authority."""
from typing import Annotated, Literal
from pydantic import ConfigDict, Field, StringConstraints, model_validator
from app.contracts.tutor_runtime import StrictModel

Hash = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
Id = Annotated[str, StringConstraints(min_length=1, max_length=160)]
Text = Annotated[str, StringConstraints(min_length=1, max_length=2000)]
CriterionId = Literal["fluency-coherence", "lexical-resource", "grammatical-range-accuracy", "pronunciation"]
CRITERIA = frozenset(("fluency-coherence", "lexical-resource", "grammatical-range-accuracy", "pronunciation"))


class SpeakingInput(StrictModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)
    dispatchId: Id
    attemptId: Id
    taskId: Id
    taskVersion: int = Field(ge=1)
    taskHash: Hash
    assessmentId: Id
    assessmentVersion: int = Field(ge=1)
    assessmentHash: Hash
    sourceVersion: Id
    sourceHash: Hash
    recordingId: Id
    recordingSha256: Hash
    recordingDurationSeconds: float = Field(ge=0.25, le=180, allow_inf_nan=False)
    prompt: str = Field(min_length=1, max_length=12000, repr=False)
    assessmentGuidance: str = Field(min_length=1, max_length=12000, repr=False)
    transcript: str | None = Field(default=None, max_length=16000, repr=False)
    transcriptUncertainty: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def uncertain_transcript(self):
        if self.transcript is not None and not self.transcriptUncertainty:
            raise ValueError("Auxiliary transcript requires uncertainty")
        return self


class AudioEvidence(StrictModel):
    recordingSha256: Hash
    startSeconds: float = Field(ge=0, allow_inf_nan=False)
    endSeconds: float = Field(gt=0, allow_inf_nan=False)
    observation: Text

    @model_validator(mode="after")
    def ordered(self):
        if self.startSeconds >= self.endSeconds:
            raise ValueError("Invalid evidence interval")
        return self


class SpeakingCriterion(StrictModel):
    criterionId: CriterionId
    status: Literal["observed", "insufficient_evidence"]
    observation: Text
    revisionAction: Text
    evidence: list[AudioEvidence] = Field(max_length=8)
    limitation: Text

    @model_validator(mode="after")
    def grounded(self):
        if (self.status == "observed") != bool(self.evidence):
            raise ValueError("Observed criteria require audio evidence; abstentions have none")
        return self


class SpeakingCandidate(StrictModel):
    kind: Literal["qualitative_speaking_feedback"]
    criteria: list[SpeakingCriterion] = Field(min_length=4, max_length=4)
    limitations: list[Text] = Field(min_length=1, max_length=8)
    timestampStatus: Literal["model_estimated_unverified"]
    assessmentScope: Literal["recorded_rehearsal"]

    @model_validator(mode="after")
    def criteria_complete(self):
        if {c.criterionId for c in self.criteria} != CRITERIA:
            raise ValueError("Exactly four unique Speaking criteria required")
        return self

    def validate_binding(self, bound: SpeakingInput):
        for criterion in self.criteria:
            for evidence in criterion.evidence:
                if evidence.recordingSha256 != bound.recordingSha256 or evidence.endSeconds > bound.recordingDurationSeconds:
                    raise ValueError("Evidence does not match frozen recording")
        return self
