"""Reviewer input contracts; no identity, authorization or publication fields."""
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator, field_validator

Hash = Annotated[str, StringConstraints(pattern=r'^[a-f0-9]{64}$')]
Id = Annotated[str, StringConstraints(pattern=r'^[a-z0-9][a-z0-9-]{0,127}$')]
Decision = Literal['comment', 'changes_needed', 'ready_for_editor']

class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)

class BoundMutation(Strict):
    packageHash: Hash
    targetHash: Hash
    expectedRevision: int = Field(ge=0, le=1_000_000)

class Answer(Strict):
    questionId: Id
    text: str = Field(max_length=20_000)

    @field_validator('text')
    @classmethod
    def valid_text(cls, value):
        if '\x00' in value:
            raise ValueError('NUL is not valid review text')
        return value

class DraftIn(BoundMutation):
    answers: list[Answer] = Field(max_length=100)

    @model_validator(mode='after')
    def bounded(self):
        if len({a.questionId for a in self.answers}) != len(self.answers) or sum(len(a.text) for a in self.answers) > 100_000:
            raise ValueError('Answers exceed bounds or duplicate identifiers')
        return self

class ItemComment(Strict):
    itemId: Id
    comment: str = Field(max_length=4000)
    decision: Decision

    @field_validator('comment')
    @classmethod
    def valid_text(cls, value):
        if '\x00' in value:
            raise ValueError('NUL is not valid review text')
        return value

class ReviewIn(BoundMutation):
    decision: Decision
    comment: str = Field(max_length=4000)
    itemComments: list[ItemComment] = Field(max_length=100)

    @field_validator('comment')
    @classmethod
    def valid_text(cls, value):
        if '\x00' in value:
            raise ValueError('NUL is not valid review text')
        return value

    @model_validator(mode='after')
    def bounded(self):
        if len({a.itemId for a in self.itemComments}) != len(self.itemComments) or len(self.comment) + sum(len(a.comment) for a in self.itemComments) > 40_000:
            raise ValueError('Comments exceed bounds or duplicate identifiers')
        return self
