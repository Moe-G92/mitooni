"""Strict editable media contracts, deliberately separate from teacher answers."""
from math import isfinite
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Id = Annotated[str, StringConstraints(pattern=r'^[a-z][a-z0-9-]{0,119}$')]
Hash = Annotated[str, StringConstraints(pattern=r'^[a-f0-9]{64}$')]
Label = Annotated[str, StringConstraints(min_length=1, max_length=220)]

class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid')

class SourceBinding(Strict):
    sourceRefId: str
    fileSha256: Hash
    excerptSha256: Hash
    pdfPages: list[int] = Field(min_length=1)
    figure: Label

class ContentBinding(Strict):
    contentId: Id
    relativePath: str
    jsonPointer: str
    canonicalValueSha256: Hash

class Series(Strict):
    id: Id
    label: Label
    values: list[float] = Field(min_length=1, max_length=30)

class Data(Strict):
    categories: list[Label] = Field(min_length=1, max_length=30)
    categoryLabel: Label
    seriesLabel: Label = "Category"
    unit: Label
    series: list[Series] = Field(min_length=1, max_length=10)
    minimum: float = 0
    maximum: float
    tick: float = Field(gt=0)
    timeStatus: Literal['recorded', 'projected', 'mixed', 'not_temporal']
    footnotes: list[Label] = Field(default_factory=list, max_length=5)

    @model_validator(mode='after')
    def coherent(self):
        if not all(isfinite(v) for v in [self.minimum,self.maximum,self.tick]) or self.maximum <= self.minimum:
            raise ValueError('Invalid axis domain')
        if (self.maximum-self.minimum)/self.tick > 30:
            raise ValueError('Too many ticks')
        if len(set(self.categories)) != len(self.categories) or len({s.id for s in self.series}) != len(self.series):
            raise ValueError('Duplicate categories or series')
        for s in self.series:
            if len(s.values) != len(self.categories):
                raise ValueError('Series/category length mismatch')
            if any(not isfinite(v) or not self.minimum <= v <= self.maximum for v in s.values):
                raise ValueError('Value outside axis domain or not finite')
        return self

class Stage(Strict):
    id: Id
    order: int = Field(ge=1)
    action: Label
    materialBefore: Label
    materialAfter: Label
    inputs: list[Label] = Field(default_factory=list, max_length=6)
    removals: list[Label] = Field(default_factory=list, max_length=6)

class Edge(Strict):
    source: Id
    target: Id
    relation: Literal['next']

class Process(Strict):
    stages: list[Stage] = Field(min_length=2, max_length=30)
    edges: list[Edge] = Field(min_length=1, max_length=40)
    footnotes: list[Label] = Field(default_factory=list, max_length=5)

    @model_validator(mode='after')
    def coherent(self):
        ids = [s.id for s in self.stages]
        if len(set(ids)) != len(ids) or [s.order for s in self.stages] != list(range(1,len(ids)+1)):
            raise ValueError('Stages need distinct IDs and contiguous source order')
        expected = list(zip(ids, ids[1:]))
        if [(e.source,e.target) for e in self.edges] != expected:
            raise ValueError('Only explicitly ordered next edges are supported; no dangling or invented branches')
        return self

class VisualSpec(Strict):
    schemaVersion: Literal[1] = 1
    id: Id
    version: int = Field(ge=1)
    kind: Literal['table', 'line_chart', 'process']
    title: Label
    verification: Literal['source_verified', 'provisional']
    sourceRefs: list[str] = Field(min_length=1)
    sourceBindings: list[SourceBinding] = Field(min_length=1)
    contentBindings: list[ContentBinding] = Field(default_factory=list)
    corpusEntityIds: list[Hash] = Field(default_factory=list)
    data: Data | None = None
    process: Process | None = None

    @model_validator(mode='after')
    def coherent(self):
        if len(set(self.sourceRefs)) != len(self.sourceRefs) or set(self.sourceRefs) != {s.sourceRefId for s in self.sourceBindings}:
            raise ValueError('Source bindings must cover declared source refs')
        if (self.kind == 'process') != (self.process is not None) or (self.kind != 'process') != (self.data is not None):
            raise ValueError('Kind/payload mismatch')
        return self
