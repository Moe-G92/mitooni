"""Provider/state seam: candidates are private; only state service can publish.

Source patterns: BarEx af57036 server.py Runner/context composition and
per-call scope in agents/tutor_agent.py. No source prompts/content copied.
"""

from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Literal, Protocol
from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class Citation(StrictModel):
    anchorId: str = Field(min_length=1, max_length=120)


class WorkSpan(StrictModel):
    start: int = Field(ge=0)
    end: int = Field(gt=0)
    quote: str = Field(max_length=600)


class Observation(StrictModel):
    criterionId: str = Field(min_length=1, max_length=120)
    text: str = Field(min_length=1, max_length=1000)
    workSpanIndexes: list[int] = Field(min_length=1, max_length=8)


class NextProposal(StrictModel):
    targetStepId: str = Field(min_length=1, max_length=120)
    evidenceIds: list[str] = Field(default_factory=list, max_length=8)


class TutorCandidate(StrictModel):
    kind: Literal["explanation", "question", "feedback"]
    text: str = Field(min_length=1, max_length=6000)
    citations: list[Citation] = Field(default_factory=list, max_length=8)
    workSpans: list[WorkSpan] = Field(default_factory=list, max_length=8)
    observations: list[Observation] = Field(default_factory=list, max_length=8)
    proposal: NextProposal | None = None


@dataclass(frozen=True)
class RunnerLimits:
    output_tokens: int = 1600
    sdk_turns: int = 4
    tool_calls: int = 4
    timeout_seconds: float = 45


@dataclass(frozen=True)
class BoundTurnInput:
    actor_id: str
    issuer: str
    workspace_id: str
    attempt_id: str
    turn_id: str
    dispatch_id: str
    fence: int
    bundle: dict[str, Any]
    context_manifest_id: str
    context_hash: str
    work_ref: dict[str, Any]
    work_text: str
    intent: str
    message: str
    anchors: tuple[dict[str, str], ...]
    criterion_ids: tuple[str, ...]
    allowed_history: tuple[dict[str, str], ...] = ()
    task_context: dict[str, Any] = field(default_factory=dict)
    learning_control: dict[str, Any] = field(default_factory=dict)
    assistance_mode: Literal["supported", "post_submit_review", "independent"] = (
        "independent"
    )
    limits: RunnerLimits = field(default_factory=RunnerLimits)


@dataclass(frozen=True)
class RunnerEvent:
    """PRIVATE worker events; never serialize directly to learner HTTP."""

    kind: Literal[
        "text_delta", "tool_status", "candidate", "usage", "refusal", "finished"
    ]
    data: Any = None


class RunnerFailure(Exception):
    def __init__(self, code="provider_unavailable"):
        self.code = code
        super().__init__(code)


class ToolService(Protocol):
    async def call(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]: ...


class TutorRunner(Protocol):
    kind: Literal["provider", "synthetic"]

    def prepare(self, bound: BoundTurnInput, tools: ToolService) -> Any:
        """Must be local-only; no network until state records dispatch."""
        ...

    def stream(self, prepared: Any) -> AsyncIterator[RunnerEvent]: ...
    async def cancel(self, turn_id: str) -> None: ...
