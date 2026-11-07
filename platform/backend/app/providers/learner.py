"""One provider invocation per candidate job, with explicit safe accounting results."""
import asyncio
import base64
from copy import deepcopy
from dataclasses import dataclass, field
import json
import re
import httpx
from agents import OpenAIResponsesModel, Runner, RunConfig, _debug
from openai import AsyncOpenAI, APIStatusError, APIConnectionError
from app.agents.learner import build_learner, LearnerCandidate, LearnerSpeakingCollection, PUBLIC_TEACHING
from app.contracts.learner_content import LearnerTask
from app.contracts.learner import ItemResponse
from app.contracts.speaking import SpeakingInput, SpeakingCandidate
from app.media.speaking import admit_wav
from app.providers.agents_runner import _install_sdk_log_boundary
from app.providers.speaking_runner import SYSTEM as AUDIO_SYSTEM


class LearnerFailure(Exception):
    def __init__(self, code, *, usage=None, model=None, response_id=None):
        self.code, self.usage, self.model, self.response_id = code, usage, model, response_id
        super().__init__(code)


@dataclass(frozen=True)
class LearnerResult:
    candidate: dict = field(repr=False)
    model: str
    response_id: str
    usage: dict


@dataclass
class PreparedLearner:
    job_id: str
    payload: dict = field(repr=False)
    audio: object = field(default=None, repr=False)
    speaking: SpeakingInput | None = field(default=None, repr=False)
    recordings: tuple = field(default=(), repr=False)
    used: bool = False


def _metadata(value):
    return isinstance(value, str) and bool(re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}', value))


def _scalars(value, keys):
    if not isinstance(value, dict):
        raise ValueError()
    result = {k: value[k] for k in keys if k in value}
    if any(v is not None and type(v) not in (str, int, float, bool) for v in result.values()):
        raise ValueError()
    return result


def _conditions(value):
    # Condition-policy revisions and draft/work revisions are different counters.
    # Keep the pedagogically meaningful conditions, not their internal counter.
    return _scalars(value, ('original','current','assisted','exposureEligible','mode','assistanceMode'))


def _reference(value):
    return _scalars(value, ('kind','id','revision'))


def _strings(values):
    if not isinstance(values, list) or any(not isinstance(v, str) for v in values):
        raise ValueError()
    return list(values)


def _evidence(value):
    result = _scalars(value, ('id','kind','taskId','skill','attemptId','createdAt'))
    if not result.get('id'):
        raise ValueError()
    if 'conditions' in value:
        result['conditions'] = _conditions(value['conditions'])
    if 'contentRef' in value:
        result['contentRef'] = _scalars(value['contentRef'], ('taskId','version','contentHash','catalogHash','catalogVersion'))
    if 'objectiveIds' in value:
        result['objectiveIds'] = _strings(value['objectiveIds'])
    if value.get('rawCheck'):
        result['rawCheck'] = _scalars(value['rawCheck'], ('itemCount','correctCount'))
    return result


def _usage(input_tokens, output_tokens, total_tokens, *, cached=0, audio=0, reasoning=0):
    values = (input_tokens, output_tokens, total_tokens, cached, audio, reasoning)
    if (any(type(n) is not int or not 0 <= n <= 10_000_000 for n in values)
            or total_tokens != input_tokens + output_tokens or cached > input_tokens
            or audio > input_tokens or reasoning > output_tokens):
        raise LearnerFailure('provider_invalid_usage')
    return dict(requests=1, inputTokens=input_tokens, outputTokens=output_tokens,
        totalTokens=total_tokens, cachedInputTokens=cached, audioInputTokens=audio,
        reasoningOutputTokens=reasoning)


def validate_candidate(candidate, payload):
    c = LearnerCandidate.model_validate(candidate).model_dump()
    anchors = {a['id'] for a in payload['anchors']}
    evidence = {e['id'] for e in payload['evidence']}
    criteria = set(payload['criterionIds'])
    text = payload['work']['text']
    if any(x['anchorId'] not in anchors for x in c['citations']):
        raise LearnerFailure('invalid_reference')
    for span in c['workSpans']:
        if span['end'] <= span['start'] or text[span['start']:span['end']] != span['quote']:
            raise LearnerFailure('invalid_reference')
    for observation in c['observations']:
        if (observation['criterionId'] not in criteria
                or not set(observation['evidenceIds']).issubset(evidence)
                or any(i < 0 or i >= len(c['workSpans']) for i in observation['workSpanIndexes'])
                or not (observation['workSpanIndexes'] or observation['evidenceIds'])):
            raise LearnerFailure('invalid_reference')
    if payload['intent'] == 'feedback' and (c['kind'] != 'feedback' or not c['observations']):
        raise LearnerFailure('invalid_feedback')
    if payload['intent'] in ('explain', 'hint', 'repair') and not c['checkQuestion']:
        raise LearnerFailure('invalid_check')
    if c['proposal']:
        proposal = c['proposal']
        option = next((o for o in payload['nextOptions'] if o['stepId'] == proposal['targetStepId']), None)
        if (not option or not set(proposal['evidenceIds']).issubset(evidence)
                or not set(proposal['evidenceIds']).issubset(option['evidenceIds'])):
            raise LearnerFailure('invalid_proposal')
    if payload['intent'] == 'propose_next' and (c['kind'] != 'next_proposal' or not c['proposal']):
        raise LearnerFailure('invalid_proposal')
    # A coarse additional guard, not a semantic quality certificate. Numeric goals
    # remain valid input; the output schema deliberately contains no score field.
    generated = ' '.join([c['text'], c['checkQuestion'] or ''] +
        [o['observation'] + ' ' + o['revisionAction'] for o in c['observations']] +
        c['limitations'] + ([c['proposal']['reason']] if c['proposal'] else []))
    if re.search(r'(?:your|overall)\s+(?:band|score)\s*(?:is|:|=)\s*[0-9]|(?:نمره|بند)\s*(?:شما|کلی)\s*[:=]?\s*[0-9۰-۹]', generated, re.I):
        raise LearnerFailure('policy_violation')
    return c


class _CapturedModel(OpenAIResponsesModel):
    """Retain safe usage even if the SDK subsequently rejects structured output."""
    response = None
    raw_response = None
    calls = 0
    async def get_response(self, *args, **kwargs):
        if self.calls:
            raise LearnerFailure('provider_call_limit')
        self.calls += 1
        response = await super().get_response(*args, **kwargs)
        self.response = response
        return response

    async def _fetch_response(self, *args, **kwargs):
        response = await super()._fetch_response(*args, **kwargs)
        self.raw_response = response
        return response


class LearnerRunner:
    kind = 'provider'
    def __init__(self, *, api_key, text_model, audio_model, http_client=None,
                 output_tokens=2000, audio_output_tokens=8192, timeout_seconds=90):
        if (not isinstance(api_key, str) or not api_key.strip()
                or not all(_metadata(m) for m in (text_model, audio_model))
                or type(output_tokens) is not int or not 128 <= output_tokens <= 4096
                or type(audio_output_tokens) is not int or not 4096 <= audio_output_tokens <= 16384
                or isinstance(timeout_seconds, bool) or not 0 < timeout_seconds <= 120):
            raise LearnerFailure('provider_configuration')
        self._key, self.text_model, self.audio_model = api_key, text_model, audio_model
        self._http, self.output_tokens, self.timeout_seconds = http_client, output_tokens, timeout_seconds
        self.audio_output_tokens = audio_output_tokens
        self._active = {}
        _install_sdk_log_boundary()

    def prepare(self, payload, audio=None):
        if not (_debug.DONT_LOG_MODEL_DATA and _debug.DONT_LOG_TOOL_DATA):
            raise LearnerFailure('unsafe_provider_logging')
        try:
            if payload['kind'] not in ('text', 'speaking') or payload['intent'] not in ('explain', 'hint', 'feedback', 'repair', 'propose_next'):
                raise ValueError()
            if not _metadata(payload['jobId']):
                raise ValueError()
            # Explicit identity-free projection; task/work/evidence are already
            # canonical public/server-authorized projections from the repository.
            projected = {k: deepcopy(payload[k]) for k in ('candidateContext', 'task', 'learningControl',
                'work', 'anchors', 'criterionIds', 'evidence', 'nextOptions', 'intent')}
            projected['message'] = payload.get('message', '')
            projected['history'] = deepcopy(payload.get('history', []))
            if (not isinstance(projected['message'], str) or len(projected['message']) > 3000
                    or len(projected['history']) > 12 or any(
                        not isinstance(h, dict) or set(h) - {'role', 'text', 'workRef'}
                        or h.get('role') not in ('user', 'assistant')
                        or not isinstance(h.get('text'), str) for h in projected['history'])
                    or len(json.dumps(projected['history']).encode()) > 24576):
                raise ValueError()
            raw_context = projected['candidateContext']
            preferences = raw_context.get('preferences') or raw_context
            projected['candidateContext'] = _scalars(preferences,
                ('examTrack','locale','selfReportedLevel','weeklyHours','testDate'))
            if 'targets' in preferences:
                projected['candidateContext']['targets'] = _scalars(preferences['targets'],
                    ('overall','reading','writing','listening','speaking'))
            projected['candidateContext'].update(_scalars(raw_context, ('evidenceRevision',)))
            projected['candidateContext']['baselineSummary'] = [_evidence(e) for e in raw_context.get('baselineSummary', [])]
            projected['learningControl'] = dict(_scalars(projected['learningControl'], ('locale','stage')),
                conditions=_conditions(projected['learningControl'].get('conditions', {})))
            for h in projected['history']:
                if 'workRef' in h:
                    h['workRef'] = _reference(h['workRef'])
            projected['task'] = LearnerTask.model_validate(projected['task']).model_dump()
            projected['work'] = {k: projected['work'][k] for k in ('ref', 'responses', 'text')}
            projected['work']['ref'] = _reference(projected['work']['ref'])
            projected['work']['responses'] = [ItemResponse.model_validate(r).model_dump()
                for r in projected['work']['responses']]
            projected['anchors'] = [dict(id=a['id'], label=a['label'], text=a['text'])
                for a in projected['anchors']]
            if any(not isinstance(v, str) for a in projected['anchors'] for v in a.values()):
                raise ValueError()
            projected['criterionIds'] = _strings(projected['criterionIds'])
            projected['nextOptions'] = [{k: o[k] for k in ('stepId','title','skill','objectiveIds','evidenceIds')}
                for o in projected['nextOptions']]
            for option in projected['nextOptions']:
                if any(not isinstance(option[k], str) for k in ('stepId','title','skill')):
                    raise ValueError()
                option['objectiveIds'] = _strings(option['objectiveIds'])
                option['evidenceIds'] = _strings(option['evidenceIds'])
            projected['evidence'] = [_evidence(e) for e in projected['evidence']]
            # Only rubric criteria/guidance, never private answer maps/rationales.
            assessment = payload.get('assessment', {})
            projected['assessment'] = {k: deepcopy(assessment[k]) for k in
                ('criteria', 'feedbackGuidance', 'questionCriteria') if k in assessment}
            if 'feedbackGuidance' in projected['assessment'] and not isinstance(projected['assessment']['feedbackGuidance'], str):
                raise ValueError()
            if 'criteria' in projected['assessment']:
                projected['assessment']['criteria'] = [_scalars(c, ('id','label','description'))
                    for c in projected['assessment']['criteria']]
            if 'questionCriteria' in projected['assessment']:
                projected['assessment']['questionCriteria'] = {item: dict(_scalars(c, ('taskKind','guidance')),
                    criterionIds=_strings(c.get('criterionIds', [])))
                    for item, c in projected['assessment']['questionCriteria'].items()}
            if (projected['learningControl']['locale'] not in ('fa', 'en')
                    or not isinstance(projected['work']['text'], str)
                    or len(projected['anchors']) > 16 or len(projected['evidence']) > 64
                    or len(projected['nextOptions']) > 24
                    or len(json.dumps(projected, ensure_ascii=False).encode()) > 65536):
                raise ValueError()
            # Independent in-progress assessment cannot silently receive coaching.
            control = projected['learningControl']
            conditions = control.get('conditions', {})
            mode = conditions.get('current', conditions.get('assistanceMode', conditions.get('mode')))
            if mode == 'independent' and control.get('stage') not in ('submitted', 'reviewing', 'review'):
                raise LearnerFailure('assistance_required')
            if payload['kind'] == 'text' and not projected['anchors']:
                raise LearnerFailure('content_unavailable')
            admitted = bound = None
            recordings = []
            if payload['kind'] == 'speaking':
                inputs = payload.get('speakingInputs')
                if inputs is None:
                    inputs = [payload['speakingInput']]
                    audio = {inputs[0]['recordingId']: audio}
                if not isinstance(audio, dict) or not 1 <= len(inputs) <= 8:
                    raise ValueError()
                for item in inputs:
                    bound = SpeakingInput.model_validate(item)
                    admitted = admit_wav(audio[bound.recordingId])
                    if bound.recordingSha256 != admitted.sha256 or bound.recordingDurationSeconds != admitted.duration_seconds:
                        raise ValueError()
                    recordings.append((bound, admitted))
                ids = [b.recordingId for b, _ in recordings]
                if (len(set(ids)) != len(ids) or set(audio) != set(ids)
                        or sum(a.duration_seconds for _, a in recordings) > 600
                        or sum(a.size_bytes for _, a in recordings) > 48 * 1024 * 1024):
                    raise ValueError()
            elif audio is not None:
                raise ValueError()
            return PreparedLearner(payload['jobId'], projected, admitted, bound, tuple(recordings))
        except LearnerFailure:
            raise
        except Exception:
            raise LearnerFailure('invalid_context') from None

    async def run(self, prepared):
        if prepared.used or prepared.job_id in self._active:
            raise LearnerFailure('duplicate_dispatch')
        prepared.used = True
        task = asyncio.current_task()
        self._active[prepared.job_id] = task
        client = model = None
        usage = response_id = None
        selected = self.audio_model if prepared.audio else self.text_model
        try:
            async with asyncio.timeout(self.timeout_seconds):
                client = AsyncOpenAI(api_key=self._key, max_retries=0,
                    base_url='https://api.openai.com/v1/', organization='', project='',
                    timeout=self.timeout_seconds, http_client=self._http or httpx.AsyncClient(trust_env=False))
                if prepared.audio:
                    multi = len(prepared.recordings) > 1
                    schema = LearnerSpeakingCollection if multi else SpeakingCandidate
                    content = [{'type': 'text', 'text': json.dumps(prepared.payload, ensure_ascii=False)}]
                    for bound, audio in prepared.recordings:
                        content.extend([{'type': 'text', 'text': json.dumps(dict(recordingId=bound.recordingId,
                            taskId=bound.taskId, prompt=bound.prompt, recordingSha256=audio.sha256,
                            durationSeconds=audio.duration_seconds, assessmentGuidance=bound.assessmentGuidance), ensure_ascii=False)},
                            {'type': 'input_audio', 'input_audio': {'data': base64.b64encode(audio.data).decode('ascii'), 'format': 'wav'}}])
                    response = await client.chat.completions.create(model=selected, store=False,
                        service_tier='default', modalities=['text'], max_completion_tokens=self.audio_output_tokens,
                        messages=[{'role': 'system', 'content': AUDIO_SYSTEM + json.dumps(schema.model_json_schema()) + PUBLIC_TEACHING +
                            '\nUse candidateContext.locale for feedback. Adapt revision actions to the objective and actual prior evidence. Numeric targets are goals, never measurements. For multiple recordings return exactly one feedback entry per supplied recordingId in supplied order. Each has its own four criteria and only that recording hash/timestamps. These are recorded rehearsals, not a validated full interview.'},
                            {'role': 'user', 'content': content}])
                    response_id = response.id
                    if response.model != selected or not _metadata(response_id) or response.usage is None:
                        raise LearnerFailure('provider_invalid_usage')
                    u = response.usage
                    details = u.prompt_tokens_details
                    usage = _usage(u.prompt_tokens, u.completion_tokens, u.total_tokens,
                        cached=getattr(details, 'cached_tokens', 0) or 0,
                        audio=getattr(details, 'audio_tokens', 0) or 0,
                        reasoning=getattr(u.completion_tokens_details, 'reasoning_tokens', 0) or 0)
                    usage['modalityDetailsAvailable'] = details is not None and getattr(details, 'audio_tokens', None) is not None
                    if len(response.choices) != 1:
                        raise LearnerFailure('provider_invalid_output')
                    choice = response.choices[0]
                    if choice.message.refusal:
                        raise LearnerFailure('provider_refused')
                    if choice.finish_reason != 'stop':
                        raise LearnerFailure('provider_incomplete')
                    raw = choice.message.content
                    if not isinstance(raw, str) or len(raw.encode()) > 131072:
                        raise LearnerFailure('provider_invalid_output')
                    def reject_constant(_):
                        raise ValueError()
                    parsed = json.loads(raw, parse_constant=reject_constant)
                    if multi:
                        collection = LearnerSpeakingCollection.model_validate(parsed)
                        if [r.recordingId for r in collection.recordings] != [b.recordingId for b, _ in prepared.recordings]:
                            raise LearnerFailure('invalid_audio_binding')
                        for r, (bound, _) in zip(collection.recordings, prepared.recordings):
                            r.feedback.validate_binding(bound)
                        candidate = collection.model_dump()
                    else:
                        candidate = SpeakingCandidate.model_validate(parsed).validate_binding(prepared.speaking).model_dump()
                else:
                    model = _CapturedModel(model=selected, openai_client=client)
                    result = await Runner.run(build_learner(model, self.output_tokens),
                        json.dumps(prepared.payload, ensure_ascii=False), max_turns=1,
                        run_config=RunConfig(tracing_disabled=True, trace_include_sensitive_data=False))
                    candidate = validate_candidate(result.final_output, prepared.payload)
                if model and model.response:
                    if not model.raw_response or model.raw_response.model != selected:
                        raise LearnerFailure('provider_model_mismatch')
                    response_id = model.response.response_id
                    u = model.response.usage
                    usage = _usage(u.input_tokens, u.output_tokens, u.total_tokens,
                        cached=u.input_tokens_details.cached_tokens,
                        reasoning=u.output_tokens_details.reasoning_tokens)
                    usage['modalityDetailsAvailable'] = True
                output_cap = self.audio_output_tokens if prepared.audio else self.output_tokens
                if not _metadata(response_id) or usage is None or usage['outputTokens'] > output_cap:
                    raise LearnerFailure('provider_invalid_usage')
                return LearnerResult(candidate, selected, response_id, usage)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            if model and model.response:
                response_id = model.response.response_id
                u = model.response.usage
                try:
                    usage = _usage(u.input_tokens, u.output_tokens, u.total_tokens,
                        cached=u.input_tokens_details.cached_tokens, reasoning=u.output_tokens_details.reasoning_tokens)
                    usage['modalityDetailsAvailable'] = True
                except LearnerFailure:
                    usage = None
            mismatch = (model is not None and model.raw_response is not None
                and model.raw_response.model != selected)
            if mismatch:
                # An unexpected model must never settle at the configured rate.
                usage = None
            code = exc.code if isinstance(exc, LearnerFailure) else (
                'provider_timeout' if isinstance(exc, (TimeoutError, httpx.TimeoutException)) else
                'provider_unavailable' if isinstance(exc, APIConnectionError) else
                'provider_configuration' if isinstance(exc, APIStatusError) and exc.status_code in (401,403,404) else
                'provider_rate_limited' if isinstance(exc, APIStatusError) and exc.status_code == 429 else
                'provider_invalid_output')
            raise LearnerFailure(code, usage=usage,
                model=model.raw_response.model if mismatch and _metadata(model.raw_response.model) else selected,
                response_id=response_id) from None
        finally:
            self._active.pop(prepared.job_id, None)
            if client and self._http is None:
                await client.close()

    async def cancel(self, job_id):
        task = self._active.get(job_id)
        if task and task is not asyncio.current_task():
            task.cancel()
