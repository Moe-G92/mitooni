"""Server identity/scope adapted from BarEx af57036 tutor guards:74–150."""
from dataclasses import dataclass
import json
from app.contracts.tutor_runtime import BoundTurnInput, RunnerFailure, ToolService

@dataclass
class AgentContext:
    bound: BoundTurnInput
    tools: ToolService
    calls: int = 0

    async def call(self, name: str, arguments: dict):
        if not self.bound.actor_id or not self.bound.issuer or not self.bound.workspace_id:
            raise RunnerFailure('tool_denied')
        self.calls += 1
        if self.calls > self.bound.limits.tool_calls:
            raise RunnerFailure('tool_limit')
        # Callback rechecks durable membership/fence/policy. No authority is model input.
        result = await self.tools.call(name, arguments)
        if len(json.dumps(result, ensure_ascii=False).encode()) > 32768:
            raise RunnerFailure('tool_output_invalid')
        return result

# Provider input is a narrow projection, not an arbitrary pack/context dump.
from typing import Literal
from pydantic import Field, ValidationError
from app.contracts.tutor_runtime import StrictModel

class TaskContext(StrictModel):
    taskId: str = Field(min_length=1,max_length=120)
    kind: Literal['reading','task2']
    title: str = Field(min_length=1,max_length=240)
    stimulus: str = Field(max_length=20000)
    prompt: str = Field(min_length=1,max_length=6000)
    objectiveDescription: str = Field(min_length=1,max_length=2000)
    # Optional only when authored as separate public options (fixture embeds in prompt).
    answerOptions: list[str] = Field(default_factory=list,max_length=12)

class LearningControl(StrictModel):
    stage: Literal['working','submitted','reviewing']
    assistanceMode: Literal['supported','post_submit_review']
    locale: Literal['fa','en']
    selfReportedCurrentLevel: str | None = Field(default=None,max_length=120)
    permittedFeedbackKinds: list[Literal['explanation','question','feedback']] = Field(min_length=1,max_length=3)
    nextStepIds: list[str] = Field(max_length=12)


def teaching_projection(bound):
    try:
        task = TaskContext.model_validate(bound.task_context)
        control = LearningControl.model_validate(bound.learning_control)
        if control.assistanceMode != bound.assistance_mode:
            raise RunnerFailure('invalid_context')
        if any(len(s)>2000 for s in task.answerOptions) or any(len(s)>120 for s in control.nextStepIds):
            raise RunnerFailure('input_limit')
        return task.model_dump(), control.model_dump()
    except ValidationError:
        raise RunnerFailure('invalid_context') from None
