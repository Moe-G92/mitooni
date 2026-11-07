"""Allowlisted learner content; private assessments never inherit public DTOs."""
from typing import Literal
from pydantic import Field, model_validator
from app.contracts.tutor_runtime import StrictModel


class LearnerOption(StrictModel):
    id: str = Field(min_length=1, max_length=16)
    text: str = Field(min_length=1, max_length=4000)


class LearnerQuestion(StrictModel):
    id: str = Field(min_length=1, max_length=160)
    prompt: str = Field(min_length=1, max_length=12000)
    responseType: Literal['single_choice', 'short_text', 'extended_text', 'spoken_response', 'multi_select']
    options: list[LearnerOption] = Field(default_factory=list, max_length=30)
    wordLimit: int | None = Field(default=None, ge=1, le=4000)
    minimumWords: int | None = Field(default=None, ge=1, le=4000)

    @model_validator(mode='after')
    def option_identities(self):
        ids = [option.id for option in self.options]
        if len(ids) != len(set(ids)):
            raise ValueError('Duplicate option identity')
        if self.responseType in {'single_choice', 'multi_select'} and len(ids) < 2:
            raise ValueError('Choice questions require options')
        if self.responseType not in {'single_choice', 'multi_select'} and ids:
            raise ValueError('Non-choice questions cannot have options')
        return self


class LearnerColumn(StrictModel):
    key: str
    label: str


class LearnerTable(StrictModel):
    title: str = ''
    description: str = ''
    unit: str = ''
    columns: list[LearnerColumn] = Field(min_length=1, max_length=30)
    rows: list[dict[str, str | int | float | None]] = Field(max_length=200)

    @model_validator(mode='after')
    def safe_rows(self):
        keys = {column.key for column in self.columns}
        if len(keys) != len(self.columns) or any(set(row) != keys for row in self.rows):
            raise ValueError('Table rows must match explicit public columns')
        return self


class LearnerSection(StrictModel):
    id: str
    title: str
    text: str | None = None
    instructions: str = ''
    questions: list[LearnerQuestion] = Field(min_length=1, max_length=100)
    table: LearnerTable | None = None
    assetIds: list[str] = Field(default_factory=list, max_length=40)


class LearnerAsset(StrictModel):
    id: str
    mediaType: Literal['image/png', 'audio/mpeg', 'audio/wav']
    sha256: str = Field(pattern=r'^[a-f0-9]{64}$')
    alt: str | None = None
    durationSeconds: float | None = Field(default=None, gt=0)


class LearnerAnchor(StrictModel):
    id: str
    label: str
    text: str


class LearnerTask(StrictModel):
    id: str
    title: str
    skill: Literal['reading', 'writing', 'listening', 'speaking']
    examTrack: Literal['academic', 'general_training', 'shared']
    kind: str
    sections: list[LearnerSection] = Field(min_length=1, max_length=30)
    assets: list[LearnerAsset] = Field(default_factory=list, max_length=100)
    teachingAnchors: list[LearnerAnchor] = Field(default_factory=list, max_length=40)
    objectiveIds: list[str] = Field(min_length=1, max_length=40)

    @model_validator(mode='after')
    def identities(self):
        questions = [q.id for s in self.sections for q in s.questions]
        asset_ids = {a.id for a in self.assets}
        if len(questions) != len(set(questions)) or len(asset_ids) != len(self.assets):
            raise ValueError('Duplicate learner item or asset')
        if any(not set(s.assetIds) <= asset_ids for s in self.sections):
            raise ValueError('Unbound section media')
        return self
