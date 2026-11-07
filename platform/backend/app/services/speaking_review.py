"""Narrow private recorded rehearsal; server owns task/rubric and all bindings."""
from uuid import UUID
import re
from pydantic import ValidationError
from app.contracts.speaking import SpeakingInput, SpeakingCandidate
from app.media.speaking import admit_wav, AudioAdmissionError
from app.repositories.account import AccountError
from app.services.content_pipeline import digest

MAX_RECORDINGS = 8
MAX_STORAGE_BYTES = 48 * 1024 * 1024
PERMISSION = 'review:speaking-evaluate'
CRITERIA = ('fluency-coherence','lexical-resource','grammatical-range-accuracy','pronunciation')
GUIDANCE = ('Give qualitative formative feedback on this recorded rehearsal only. '
    'Assess fluency and coherence, lexical resource, grammatical range and accuracy, and pronunciation separately. '
    'Use actual waveform evidence; pronunciation and temporal fluency cannot be inferred from a transcript. '
    'Abstain where evidence is insufficient. Accent identity is not an error. No numeric band or overall prediction. '
    'Timestamp evidence is a model estimate for human verification, not verified alignment.')


def fail(code, status=409):
    messages = {'speaking_denied':'Speaking review access is unavailable', 'speaking_unavailable':'Speaking evaluation is unavailable',
        'speaking_limit':'Speaking review limit reached', 'content_changed':'Review content changed; reload before recording',
        'idempotency_conflict':'Operation key was already used for another recording', 'invalid_audio':'Use a complete PCM WAV recording of 0.25 to 180 seconds',
        'invalid_request':'Speaking request is invalid', 'speaking_conflict':'Speaking work changed; reload before continuing'}
    raise AccountError(code, status, messages.get(code, 'Speaking review storage is unavailable'))


def uuid_string(value):
    try: return str(UUID(str(value)))
    except (ValueError, TypeError, AttributeError): fail('invalid_request',422)


def version_headers(package_hash,target_hash):
    if any(not isinstance(x,str) or not re.fullmatch('[a-f0-9]{64}',x) for x in (package_hash,target_hash)):
        fail('invalid_request',422)
    return package_hash,target_hash


def headers_binding(package_hash, target_hash, task_id, audio_hash):
    if any(not isinstance(x,str) or not re.fullmatch('[a-f0-9]{64}',x) for x in (package_hash,target_hash,audio_hash)):
        fail('invalid_request',422)
    if not isinstance(task_id,str) or not re.fullmatch('[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}',task_id):
        fail('invalid_request',422)
    return dict(packageHash=package_hash,targetHash=target_hash,taskId=task_id,recordingSha256=audio_hash)


def task_binding(package, target_id, task_id):
    target=package.get(target_id)
    if target.get('skill')!='speaking': fail('speaking_denied',403)
    section=next((s for s in package.task(target_id)['sections'] if s['id']==task_id),None)
    if not section: fail('invalid_request',422)
    # Explicit known rubric fields only; never send answer keys or examiner strategies.
    assessment=target.get('assessment')
    if assessment:
        criteria=[dict(id=c['id'],description=c.get('description','')) for c in assessment.get('criteria',[])]
        if {c['id'] for c in criteria} != {'fluency-coherence','lexical-resource','grammar','pronunciation'}:
            fail('speaking_unavailable',503)
        rubric=dict(criteria=criteria,feedbackGuidance=assessment.get('feedbackGuidance',''),policy=GUIDANCE)
    else:
        source=target.get('teacherOnly',{}).get('rubric',{})
        if set(source.get('criteria',[])) != {'fluency_and_coherence','lexical_resource','grammatical_range_and_accuracy','pronunciation'}:
            fail('speaking_unavailable',503)
        rubric=dict(criteria=list(CRITERIA),policy=GUIDANCE,sourceVersion=source.get('sourceVersion',''))
    import json
    prompt=json.dumps(dict(instructions=package.task(target_id)['instructions'],section=section),ensure_ascii=False)
    guidance=json.dumps(rubric,ensure_ascii=False)
    return dict(taskId=task_id,taskVersion=target['version'],taskHash=digest(section),
        assessmentId=target_id+':speaking-qualitative',assessmentVersion=target['version'],assessmentHash=digest(rubric),
        sourceVersion='review-package:'+package.hash,sourceHash=package.hash,prompt=prompt,assessmentGuidance=guidance)


def admit(data, expected_hash):
    try: audio=admit_wav(data)
    except AudioAdmissionError: fail('invalid_audio',422)
    if audio.sha256!=expected_hash: fail('invalid_audio',422)
    return audio


def validate_record(row):
    data=bytes(row['audio'])
    frozen=row['frozen']
    try:audio=admit(data,frozen['recordingSha256'])
    except AccountError:fail('speaking_unavailable',503)
    try:
        bound=SpeakingInput.model_validate(frozen['input'])
        if (bound.recordingId!=str(row['recording_id']) or bound.attemptId!=str(row['job_id'])
                or bound.recordingSha256!=audio.sha256 or bound.recordingDurationSeconds!=audio.duration_seconds
                or bound.dispatchId!=str(row['dispatch_candidate'])
                or frozen['audioMetadata']!=dict(sizeBytes=audio.size_bytes,durationSeconds=audio.duration_seconds,sampleRate=audio.sample_rate,channels=audio.channels,sampleWidth=audio.sample_width)
                or digest(frozen)!=row['request_hash']): raise ValueError()
        if (row['status']=='completed') != (row.get('result') is not None):raise ValueError()
        result=row.get('result')
        if result is not None:
            SpeakingCandidate.model_validate(result['feedback']).validate_binding(bound)
            if result['recordingSha256']!=audio.sha256 or result['dispatchId']!=str(row['dispatch_id']): raise ValueError()
    except (ValueError,KeyError,TypeError,ValidationError): fail('speaking_unavailable',503)
    return bound,audio


def projection(row):
    bound,audio=validate_record(row)
    return dict(packageHash=row['package_hash'],targetHash=row['target_hash'],recordingId=str(row['recording_id']),jobId=str(row['job_id']),taskId=bound.taskId,
        status=row['status'],revision=row['revision'],recordingSha256=audio.sha256,durationSeconds=audio.duration_seconds,
        sizeBytes=audio.size_bytes,error=row['error_code'],result=row['result']['feedback'] if row['result'] else None,
        conditions=row['frozen']['conditions'],createdAt=row['created_at'].isoformat(),
        limitations=['Recorded rehearsal; no validated band estimate.','Audio timestamps are model estimates for human review.'])
