"""Actual Agents SDK adapter; all emitted events are private worker input.

Adapts BarEx af57036 server Runner.run_streamed/context mechanics, not its
prompts or model loop. No session/continuation state or automatic retry exists.
"""
import asyncio
from dataclasses import dataclass
import json
import logging
from typing import Any
import httpx
from agents import OpenAIResponsesModel, Runner, RunConfig, _debug
from openai import AsyncOpenAI, APIConnectionError, APIStatusError, APITimeoutError
from app.agents.context import AgentContext, teaching_projection
from app.agents.tutor import build_tutor
from app.agents.planner import build_planner
from app.contracts.tutor_runtime import BoundTurnInput, RunnerEvent, RunnerFailure, TutorCandidate

def _install_sdk_log_boundary():
    """Discard SDK diagnostics before any handler sees message/args/tracebacks.

    Process-wide by namespace, so concurrent SDK child tasks and future child
    loggers are covered. This deliberately suppresses all SDK diagnostic content,
    rather than attempting to recognise private strings. App diagnostics use only
    bounded RunnerFailure codes outside these namespaces.
    """
    previous = logging.getLogRecordFactory()
    if getattr(previous, '_mitooni_sdk_boundary', False):
        return
    def factory(*args, **kwargs):
        record = previous(*args, **kwargs)
        if record.name.split('.')[0] in {'openai', 'httpx', 'httpcore'}:
            record.msg = 'SDK diagnostic suppressed'
            record.args = ()
            record.exc_info = None
            record.exc_text = None
            record.stack_info = None
        return record
    factory._mitooni_sdk_boundary = True
    logging.setLogRecordFactory(factory)


@dataclass
class PreparedRun:
    bound: BoundTurnInput
    context: AgentContext
    agent: Any
    input: list
    canceled: asyncio.Event
    used: bool = False
    result: Any = None
    client: Any = None

class AgentsRunner:
    kind = 'provider'

    def __init__(self, *, api_key: str, model: str, http_client: httpx.AsyncClient | None = None):
        # No environment discovery, implicit client, model fallback or alternate vendor.
        if not api_key.strip() or not model.strip():
            raise RunnerFailure('provider_unavailable')
        _install_sdk_log_boundary()
        self._key = api_key
        self._model = model
        self._http = http_client
        self._active: dict[str, PreparedRun] = {}

    def prepare(self, bound: BoundTurnInput, tools) -> PreparedRun:
        _install_sdk_log_boundary()
        if not (_debug.DONT_LOG_MODEL_DATA and _debug.DONT_LOG_TOOL_DATA):
            raise RunnerFailure('unsafe_provider_logging')
        if getattr(bound, 'assistance_mode', 'independent') not in ('supported', 'post_submit_review'):
            raise RunnerFailure('assistance_required')
        if not all((bound.actor_id, bound.issuer, bound.workspace_id, bound.attempt_id,
                    bound.turn_id, bound.dispatch_id, bound.context_manifest_id, bound.context_hash)):
            raise RunnerFailure('invalid_context')
        limits = bound.limits
        if not (1 <= limits.output_tokens <= 4096 and 1 <= limits.sdk_turns <= 8
                and 0 <= limits.tool_calls <= 8 and 0 < limits.timeout_seconds <= 120):
            raise RunnerFailure('invalid_limits')
        if bound.intent not in ('explain', 'hint', 'feedback', 'propose_next'):
            raise RunnerFailure('invalid_context')
        if bound.intent == 'feedback' and bound.work_ref.get('kind') != 'attempt':
            raise RunnerFailure('invalid_context')
        # Explicit allowlisted projection prevents accidental serialization of bundle
        # internals/keys and identity. Only already-authorized anchors reach the model.
        if len(bound.anchors) > 16 or len(bound.allowed_history) > 20:
            raise RunnerFailure('input_limit')
        anchors = [{'id': a['id'], 'text': a['text'], 'label': a['label']} for a in bound.anchors]
        history = []
        for item in bound.allowed_history:
            if set(item) != {'role', 'text'} or item['role'] not in ('user', 'assistant'):
                raise RunnerFailure('invalid_context')
            history.append({'role': item['role'], 'content': item['text']})
        task, control = teaching_projection(bound)
        payload = {'task': task, 'learningControl': control, 'intent': bound.intent, 'message': bound.message, 'work': bound.work_text,
                   'anchors': anchors, 'criterionIds': bound.criterion_ids}
        serialized = json.dumps(payload, ensure_ascii=False)
        if len(serialized.encode()) + len(json.dumps(history).encode()) > 65536:
            raise RunnerFailure('input_limit')
        # Preparation allocates no client/socket. Worker can discard this after
        # losing a lease without requiring an async cleanup operation.
        return PreparedRun(bound, AgentContext(bound, tools), None,
            history + [{'role': 'user', 'content': serialized}], asyncio.Event())

    async def stream(self, prepared: PreparedRun):
        _install_sdk_log_boundary()
        if prepared.used or prepared.bound.turn_id in self._active:
            raise RunnerFailure('duplicate_dispatch')
        prepared.used = True
        self._active[prepared.bound.turn_id] = prepared
        result = None
        try:
            if prepared.canceled.is_set():
                raise RunnerFailure('canceled')
            async with asyncio.timeout(prepared.bound.limits.timeout_seconds):
                http_client = self._http or httpx.AsyncClient(trust_env=False)
                prepared.client = AsyncOpenAI(api_key=self._key, max_retries=0,
                    base_url='https://api.openai.com/v1/', organization='', project='',
                    timeout=prepared.bound.limits.timeout_seconds, http_client=http_client)
                model = OpenAIResponsesModel(model=self._model, openai_client=prepared.client)
                builder = build_planner if prepared.bound.intent == 'propose_next' else build_tutor
                prepared.agent = builder(model, prepared.bound.limits)
                result = Runner.run_streamed(prepared.agent, prepared.input,
                    context=prepared.context, max_turns=prepared.bound.limits.sdk_turns,
                    run_config=RunConfig(tracing_disabled=True, trace_include_sensitive_data=False))
                prepared.result = result
                total = 0
                async for event in result.stream_events():
                    if prepared.canceled.is_set():
                        result.cancel()
                        raise RunnerFailure('canceled')
                    if event.type == 'raw_response_event':
                        raw = event.data
                        if raw.type == 'response.refusal.delta':
                            raise RunnerFailure('provider_refused')
                        if raw.type == 'response.output_text.delta':
                            total += len(raw.delta.encode())
                            if total > 32768:
                                raise RunnerFailure('output_limit')
                            # Deliberately do not emit raw text: SDK buffers privately.
                    elif event.type == 'run_item_stream_event' and event.name == 'tool_called':
                        yield RunnerEvent('tool_status', 'running')
                if prepared.canceled.is_set():
                    raise RunnerFailure('canceled')
                candidate = TutorCandidate.model_validate(result.final_output)
                if len(candidate.model_dump_json().encode()) > 32768:
                    raise RunnerFailure('output_limit')
                yield RunnerEvent('candidate', candidate)
                usage = result.context_wrapper.usage
                yield RunnerEvent('usage', {'requests': usage.requests,
                    'inputTokens': usage.input_tokens, 'outputTokens': usage.output_tokens})
                yield RunnerEvent('finished')
        except RunnerFailure:
            raise
        except TimeoutError:
            raise RunnerFailure('provider_timeout') from None
        except asyncio.CancelledError:
            raise
        except Exception as error:
            # SDK wraps tool failures; preserve only our bounded safe failure code.
            pending = [error]
            seen = set()
            while pending and len(seen) < 32:
                nested = pending.pop()
                if id(nested) in seen:
                    continue
                seen.add(id(nested))
                if isinstance(nested, RunnerFailure):
                    raise RunnerFailure(nested.code) from None
                if isinstance(nested, (APITimeoutError, httpx.TimeoutException)):
                    raise RunnerFailure('provider_timeout') from None
                if isinstance(nested, APIConnectionError):
                    raise RunnerFailure('provider_unavailable') from None
                if isinstance(nested, APIStatusError):
                    status = nested.status_code
                    code = ('provider_configuration' if status in (401, 403, 404) else
                            'provider_rate_limited' if status == 429 else
                            'provider_unavailable' if status >= 500 else 'provider_invalid_output')
                    raise RunnerFailure(code) from None
                pending.extend(getattr(nested, 'exceptions', ()))
                if nested.__cause__ is not None:
                    pending.append(nested.__cause__)
            # Never leak SDK exceptions containing prompts, tools, input or credentials.
            raise RunnerFailure('provider_invalid_output') from None
        finally:
            if result is not None and not result.is_complete:
                result.cancel()
            self._active.pop(prepared.bound.turn_id, None)
            if self._http is None and prepared.client is not None:
                await prepared.client.close()

    async def cancel(self, turn_id: str) -> None:
        prepared = self._active.get(turn_id)
        if prepared:
            prepared.canceled.set()
            if prepared.result is not None:
                prepared.result.cancel()
