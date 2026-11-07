"""Candidate v2 wire requests. Authority, scoring and publication are server-owned."""
from typing import Literal
from pydantic import Field, model_validator
from app.contracts.tutor_runtime import StrictModel
from app.contracts.account import Targets

Skill = Literal['reading','listening','writing','speaking']
Track = Literal['academic','general_training']

class PreferencesIn(StrictModel):
    expectedRevision: int = Field(ge=0)
    examTrack: Track
    weeklyHours: int = Field(ge=0,le=60)
    testDate: str|None = None
    targets: Targets
    selfReportedLevel: float|None = Field(default=None,ge=0,le=9,multiple_of=.5)
    locale: Literal['fa','en'] = 'fa'

class BaselineIn(StrictModel):
    expectedPreferencesRevision: int = Field(ge=1)

class PlanIn(StrictModel):
    expectedPreferencesRevision: int = Field(ge=1)
    expectedEvidenceRevision: int = Field(ge=0)

class ResolveIn(StrictModel):
    planId: str|None = None
    planVersion: int|None = Field(default=None,ge=1)
    stepId: str|None = None
    sessionId: str|None = None
    sectionId: str|None = None
    conditionPreset: Literal['supported','independent'] = 'supported'
    @model_validator(mode='after')
    def target(self):
        if not ((self.planId and self.planVersion and self.stepId and not self.sessionId and not self.sectionId) or (self.sessionId and self.sectionId and not self.planId and not self.stepId)):
            raise ValueError('One plan step or session section required')
        return self

class ItemResponse(StrictModel):
    itemId: str = Field(min_length=1,max_length=160)
    kind: Literal['choice','short_text','multi_select','matching','ordered','essay','recording']
    value: str|list[str]|dict[str,str] = Field(union_mode='left_to_right')

class DraftIn(StrictModel):
    expectedDraftRevision: int = Field(ge=1)
    responses: list[ItemResponse] = Field(max_length=100)

class SubmitIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)
    expectedDraftRevision: int = Field(ge=1)
    expectedConditionsRevision: int = Field(ge=1)

class AssistanceIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)
    expectedConditionsRevision: int = Field(ge=1)
    action: Literal['switch_to_supported'] = 'switch_to_supported'

class RevisionIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)

class WorkRef(StrictModel):
    kind: Literal['draft','attempt']
    id: str = Field(min_length=1,max_length=160)
    revision: int = Field(ge=1)

class TurnIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)
    workRef: WorkRef
    intent: Literal['explain','hint','feedback','propose_next']
    message: str = Field(default='',max_length=3000)

class FeedbackIn(StrictModel):
    expectedWorkspaceRevision: int = Field(ge=1)

class SessionIn(StrictModel):
    kind: Literal['mock'] = 'mock'
    mockId: str
    mockVersion: int = Field(ge=1)
    expectedPlanVersion: int|None = None

class StartIn(StrictModel):
    expectedRevision: int = Field(ge=1)

class CancelIn(StrictModel):
    expectedRevision: int = Field(ge=1)

class AcceptIn(StrictModel):
    expectedPlanVersion: int = Field(ge=1)
    expectedEvidenceRevision: int = Field(ge=0)

class VocabularyIn(StrictModel):
    expectedRevision: int = Field(ge=0)
    word: str = Field(min_length=1,max_length=120)
    meaning: str = Field(default='',max_length=1000)
    example: str = Field(default='',max_length=1000)
    sourceTaskId: str|None = Field(default=None,max_length=160)

class ProductFeedbackIn(StrictModel):
    expectedRevision: int = Field(ge=0)
    text: str = Field(min_length=1,max_length=2000)
    route: str = Field(min_length=1,max_length=240)
    workspaceId: str|None = None

class VocabularyReviewIn(StrictModel):
    expectedRevision: int = Field(ge=0)
    recall: Literal['again','known']

class AnswerReviewItemOut(StrictModel):
    itemId: str = Field(min_length=1,max_length=160)
    acceptedAnswers: list[str|list[str]|dict[str,str]] = Field(min_length=1,max_length=40)
    rationale: str|None

class AnswerReviewGroupOut(StrictModel):
    questionIds: list[str] = Field(min_length=1,max_length=100)
    acceptedAnswers: list[str|list[str]|dict[str,str]] = Field(min_length=1,max_length=100)
    orderIndependent: bool
    distinct: bool

class AnswerReviewOut(StrictModel):
    actorKind: Literal['authoritative_answer_key']
    items: list[AnswerReviewItemOut] = Field(min_length=1,max_length=100)
    answerGroups: list[AnswerReviewGroupOut] = Field(max_length=40)
