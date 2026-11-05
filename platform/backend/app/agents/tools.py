"""Scoped function-tool wiring; no database, URL, filesystem or identity tools."""
from agents import RunContextWrapper, function_tool
from app.agents.context import AgentContext
from app.contracts.tutor_runtime import RunnerFailure

@function_tool(failure_error_function=None)
async def approved_anchor(ctx: RunContextWrapper[AgentContext], anchor_id: str) -> dict:
    """Read one permitted teaching anchor by its approved identifier."""
    if anchor_id not in {a['id'] for a in ctx.context.bound.anchors}:
        raise RunnerFailure('tool_denied')
    return await ctx.context.call('approved_anchor', {'anchorId': anchor_id})

@function_tool(failure_error_function=None)
async def learning_snapshot(ctx: RunContextWrapper[AgentContext]) -> dict:
    """Read the current server-filtered learning snapshot; cannot change progress."""
    return await ctx.context.call('learning_snapshot', {})

@function_tool(failure_error_function=None)
async def next_options(ctx: RunContextWrapper[AgentContext]) -> dict:
    """Read server-allowed next choices; final proposals require server validation."""
    return await ctx.context.call('next_options', {})
