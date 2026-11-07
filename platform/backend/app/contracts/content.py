"""Server-only original IELTS authoring and independently supplied review evidence.

These are not learner HTTP DTOs. Authored content cannot grant publication.
"""

from typing import Annotated, Literal

from pydantic import Field, StringConstraints, model_validator

from app.contracts.tutor_runtime import StrictModel

Slug = Annotated[str, StringConstraints(pattern=r"^[a-z][a-z0-9-]{0,119}$")]
Text = Annotated[str, StringConstraints(min_length=1, max_length=30000)]
Hash = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
SourceId = Annotated[str, StringConstraints(pattern=r"^[A-Za-z][A-Za-z0-9_-]{0,119}$")]
Skill = Literal["reading", "writing", "listening", "speaking"]
Stage = Literal["train", "transfer"]
DEMAND_BRANCHES = {"fnd": "foundation", "int": "intermediate", "adv": "advanced"}
CASE_KINDS = (
    "substantive_response", "empty_response", "off_topic", "answer_key_request",
    "band_request", "prompt_injection", "supported_learning", "independent_transfer",
)
EXPECTED_UNIT_IDS = frozenset(
    f"{level}-{skill}-{stage}"
    for level in ("fnd", "int", "adv")
    for skill in ("reading", "writing", "listening", "speaking")
    for stage in ("train", "transfer")
) | frozenset(
    f"gt-{level}-{skill}-{stage}"
    for level in ("fnd", "int", "adv")
    for skill in ("reading", "writing")
    for stage in ("train", "transfer")
)


class Anchor(StrictModel):
    id: Slug
    label: Text
    text: Text


class Stimulus(StrictModel):
    kind: Literal["passage", "prompt", "chart_description", "script"]
    text: Text


class Option(StrictModel):
    id: Annotated[str, StringConstraints(pattern=r"^[A-Z][A-Z0-9]{0,7}$")]
    text: Text


class Question(StrictModel):
    id: Slug
    prompt: Text
    responseType: Literal["single_choice", "short_text", "extended_text", "spoken_response"]
    options: list[Option] = Field(max_length=12)
    wordLimit: int | None = Field(ge=1, le=2000)

    @model_validator(mode="after")
    def coherent(self):
        if len({o.id for o in self.options}) != len(self.options):
            raise ValueError("Duplicate option ID")
        if self.responseType == "single_choice" and len(self.options) < 2:
            raise ValueError("Single choice requires at least two options")
        if self.responseType != "single_choice" and self.options:
            raise ValueError("Only single choice admits options")
        return self


class Criterion(StrictModel):
    id: Slug
    label: Text
    description: Text


class AnswerKey(StrictModel):
    questionId: Slug
    acceptedAnswers: list[Text] = Field(min_length=1, max_length=20)
    rationale: Text


class Assessment(StrictModel):
    kind: Literal["deterministic", "qualitative"]
    criteria: list[Criterion] = Field(min_length=1, max_length=16)
    answerKey: list[AnswerKey] = Field(max_length=40)
    feedbackGuidance: Text


class Delivery(StrictModel):
    kind: Literal["text", "audio_required", "recording_required"]
    assetId: Slug | None


class ObjectiveMapping(StrictModel):
    objectiveId: Slug
    sourceRefIds: list[SourceId] = Field(min_length=1, max_length=20)
    sourceLearningPoint: Text
    unitTeachingConnection: Text
    taskTransformation: Text


class Provenance(StrictModel):
    origin: Literal["source_based_original"]
    sourceRefs: list[SourceId] = Field(min_length=1, max_length=40)
    territory: Literal["Iran"]
    rightsNote: Text
    transformationNotes: Text
    objectiveMappings: list[ObjectiveMapping] = Field(min_length=1, max_length=16)


class PendingTeacherReview(StrictModel):
    status: Literal["pending"]
    notes: list[Text] = Field(max_length=40)


class Locale(StrictModel):
    instructionsFa: Text
    teachingAnchorsFa: list[Anchor] = Field(max_length=16)
    feedbackGuidanceFa: Text


class AuthorUnit(StrictModel):
    schemaVersion: Literal[1]
    id: Slug
    version: int = Field(ge=1)
    skill: Skill
    examTrack: Literal["academic", "general_training", "shared"]
    stage: Stage
    pathwayIds: list[Slug] = Field(min_length=1, max_length=8)
    objectiveIds: list[Slug] = Field(min_length=1, max_length=16)
    familyId: Slug
    title: Text
    instructions: Text
    stimulus: Stimulus
    questions: list[Question] = Field(min_length=1, max_length=40)
    teachingAnchors: list[Anchor] = Field(max_length=16)
    assessment: Assessment
    delivery: Delivery
    provenance: Provenance
    teacherReview: PendingTeacherReview
    locale: Locale

    @model_validator(mode="after")
    def coherent(self):
        questions = {q.id: q for q in self.questions}
        if len(questions) != len(self.questions):
            raise ValueError("Duplicate question ID")
        for values in (self.pathwayIds, self.objectiveIds):
            if len(set(values)) != len(values):
                raise ValueError("Duplicate reference")
        mappings = self.provenance.objectiveMappings
        if len(mappings) != len(self.objectiveIds) or {m.objectiveId for m in mappings} != set(self.objectiveIds):
            raise ValueError("Every objective requires one source-learning transformation mapping")
        if len(set(self.provenance.sourceRefs)) != len(self.provenance.sourceRefs):
            raise ValueError("Duplicate source reference")
        for mapping in mappings:
            if not set(mapping.sourceRefIds) <= set(self.provenance.sourceRefs):
                raise ValueError("Objective mapping uses an undeclared source")
        anchors = [a.id for a in self.teachingAnchors]
        if self.stage == "train" and not anchors:
            raise ValueError("Training requires substantive teaching anchors")
        translated = [a.id for a in self.locale.teachingAnchorsFa]
        if len(set(anchors)) != len(anchors) or translated != anchors:
            raise ValueError("Translated anchor IDs must match ordered English anchors")
        criteria = [c.id for c in self.assessment.criteria]
        if len(set(criteria)) != len(criteria):
            raise ValueError("Duplicate criterion ID")
        keys = self.assessment.answerKey
        if self.assessment.kind == "qualitative" and keys:
            raise ValueError("Qualitative assessment cannot have deterministic keys")
        if self.assessment.kind == "deterministic":
            if len(keys) != len(questions) or {k.questionId for k in keys} != set(questions):
                raise ValueError("Every deterministic question requires exactly one key")
            for key in keys:
                q = questions[key.questionId]
                if q.responseType not in {"single_choice", "short_text"}:
                    raise ValueError("Extended or spoken responses need qualitative review")
                if len(set(key.acceptedAnswers)) != len(key.acceptedAnswers):
                    raise ValueError("Duplicate accepted answer")
                if q.responseType == "single_choice" and not set(key.acceptedAnswers) <= {o.id for o in q.options}:
                    raise ValueError("Key must reference an option")
        if self.skill == "listening" and (self.stimulus.kind != "script" or self.delivery.kind != "audio_required"):
            raise ValueError("Listening requires private script and real audio")
        if self.skill == "speaking" and self.delivery.kind != "recording_required":
            raise ValueError("Speaking requires recording support")
        if self.skill in {"reading", "writing"} and self.delivery.kind != "text":
            raise ValueError("Reading/writing authoring requires text delivery")
        if self.skill in {"listening", "speaking"} and self.examTrack != "shared":
            raise ValueError("Listening/speaking are shared across IELTS tracks")
        if self.skill in {"reading", "writing"} and self.examTrack == "shared":
            raise ValueError("Reading/writing must identify an IELTS track")
        return self


class UnitRef(StrictModel):
    id: Slug
    path: Text
    sha256: Hash


class Pathway(StrictModel):
    id: Slug
    examTrack: Literal["academic", "general_training"]
    demandBranchId: Literal["foundation", "intermediate", "advanced"]
    title: Text
    entryProfile: Text
    targetIntent: Text
    orderedUnitIds: list[Slug] = Field(min_length=1, max_length=100)


class MockSection(StrictModel):
    skill: Skill
    durationMinutes: int = Field(ge=1, le=120)
    requiredItems: int = Field(ge=1, le=100)
    unitIds: list[Slug] = Field(max_length=100)
    missingRequirements: list[Text] = Field(min_length=1, max_length=40)


class MockBlueprint(StrictModel):
    status: Literal["blueprint"]
    sections: list[MockSection] = Field(min_length=4, max_length=4)
    claim: Literal["not_a_full_mock"]


class Manifest(StrictModel):
    schemaVersion: Literal[1]
    id: Slug
    version: int = Field(ge=1)
    title: Text
    units: list[UnitRef] = Field(min_length=36, max_length=36)
    companions: list["CompanionRef"] = Field(min_length=6, max_length=30)
    assets: list["CuratedAsset"] = Field(default_factory=list, max_length=200)
    pathways: list[Pathway] = Field(min_length=1, max_length=8)
    mockBlueprint: MockBlueprint


class EvaluationCase(StrictModel):
    id: Slug
    unitId: Slug
    pathwayId: Slug
    kind: Literal[
        "substantive_response", "empty_response", "off_topic", "answer_key_request",
        "band_request", "prompt_injection", "supported_learning", "independent_transfer",
    ]
    mode: Literal["supported", "independent", "post_submit_review"]
    syntheticResponse: str = Field(max_length=20000)
    expectedChecks: list[Text] = Field(min_length=1, max_length=20)
    prohibitedClaims: list[Text] = Field(min_length=1, max_length=20)


class EvaluationSet(StrictModel):
    schemaVersion: Literal[1]
    cases: list[EvaluationCase] = Field(min_length=288, max_length=288)


class CompanionRef(StrictModel):
    id: Slug
    path: Text
    sha256: Hash
    kind: Literal["syllabus", "mock_blueprint", "mock", "source_index", "media_catalog", "corpus_lineage"]


class AssetContentBinding(StrictModel):
    targetId: Slug
    targetPointer: Text
    targetValueSha256: Hash


class CuratedAsset(StrictModel):
    id: Slug
    path: Text
    sha256: Hash
    mediaType: Literal["image/png", "audio/mpeg", "audio/wav"]
    sizeBytes: int = Field(ge=1, le=100_000_000)
    width: int | None = Field(ge=1, le=10000)
    height: int | None = Field(ge=1, le=10000)
    durationSeconds: float | None = Field(gt=0, le=7200)
    sampleRateHz: int | None = Field(ge=8000, le=192000)
    channels: int | None = Field(ge=1, le=2)
    sourceAssetId: Slug
    sourceRefs: list[SourceId] = Field(min_length=1, max_length=40)
    contentBindings: list[AssetContentBinding] = Field(min_length=1, max_length=40)
    specPath: Text | None
    specSha256: Hash | None
    alt: Text | None

    @model_validator(mode="after")
    def coherent(self):
        suffix = {"image/png": ".png", "audio/mpeg": ".mp3", "audio/wav": ".wav"}[self.mediaType]
        if self.path != f"media/{self.id}{suffix}":
            raise ValueError("Canonical media path must match ID and measured type")
        if self.mediaType == "image/png":
            if None in (self.width, self.height, self.specPath, self.specSha256, self.alt) or any(v is not None for v in (self.durationSeconds, self.sampleRateHz, self.channels)):
                raise ValueError("PNG requires dimensions, editable spec and accessible text")
            if not self.specPath.startswith("visual-specs/") or not self.specPath.endswith(".json"):
                raise ValueError("Visual spec requires canonical package path")
        elif None in (self.durationSeconds, self.sampleRateHz, self.channels) or any(v is not None for v in (self.width, self.height, self.specPath, self.specSha256, self.alt)):
            raise ValueError("Audio requires measured audio metadata only")
        return self


class MediaCatalog(StrictModel):
    schemaVersion: Literal[1]
    kind: Literal["media_catalog"]
    id: Slug
    version: int = Field(ge=1)
    teacherReview: PendingTeacherReview
    assets: list[CuratedAsset] = Field(min_length=1, max_length=200)
    upstreamManifestHashes: list[Hash] = Field(min_length=1, max_length=20)


class SourceEntry(StrictModel):
    id: SourceId
    relativePath: Text
    fileSha256: Hash
    pdfPages: list[int] = Field(min_length=1, max_length=30)
    excerptSha256: Hash
    learningObjectives: list[Text] = Field(min_length=1, max_length=30)
    excerptBoundary: Text
    inspectionNotes: Text | None = None
    sourceContentSummary: Text | None = None
    transformationBoundaries: Text | None = None
    skill: Skill | None = None
    taskPatterns: list[Text] | None = None

    @model_validator(mode="after")
    def coherent(self):
        from pathlib import Path
        path = Path(self.relativePath)
        if path.is_absolute() or ".." in path.parts or "\\" in self.relativePath:
            raise ValueError("Source path must be project-relative")
        if any(type(p) is not int or p < 1 for p in self.pdfPages) or len(set(self.pdfPages)) != len(self.pdfPages):
            raise ValueError("Source pages must be distinct positive page numbers")
        return self


class SourceIndex(StrictModel):
    schemaVersion: Literal[1]
    kind: Literal["source_index"]
    id: Slug
    version: int = Field(ge=1)
    teacherReview: PendingTeacherReview
    territory: Literal["Iran"]
    rightsNote: Text
    entries: list[SourceEntry] = Field(min_length=1, max_length=500)


class MockSourceMapping(StrictModel):
    targetPointer: Text
    sourceRefIds: list[SourceId] = Field(min_length=1, max_length=20)
    sourceLearningPoint: Text
    taskTransformation: Text


class MockProvenance(StrictModel):
    origin: Literal["source_based_original"]
    sourceRefs: list[SourceId] = Field(min_length=1, max_length=40)
    territory: Literal["Iran"]
    rightsNote: Text
    transformationNotes: Text
    sourceMappings: list[MockSourceMapping] = Field(min_length=1, max_length=40)


class ReviewDisposition(StrictModel):
    targetId: Slug
    decision: Literal["approved", "rejected", "changes_needed"]
    rationale: Text


class TeacherEvidence(StrictModel):
    schemaVersion: Literal[1]
    actorKind: Literal["human_teacher"]
    reviewerId: Slug
    packageHash: Hash
    reviewedAt: Annotated[str, StringConstraints(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")]
    evidencePath: Text
    evidenceSha256: Hash
    dispositions: list[ReviewDisposition] = Field(min_length=1, max_length=1000)


Manifest.model_rebuild()
