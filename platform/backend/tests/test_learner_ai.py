"""Actual pinned SDK over MockTransport; synthetic work, not teacher/model quality."""
import asyncio
from copy import deepcopy
import io
import json
from types import SimpleNamespace
import wave
from pathlib import Path
import httpx
import pytest
from app.providers.learner import LearnerRunner, LearnerFailure
from app.workers.learner import LearnerWorker
from test_speaking_evaluator import candidate as audio_candidate, bound as audio_bound, response as audio_response, wav


def payload(**changes):
    p = dict(jobId='job-1', kind='text', intent='feedback',
        candidateContext=dict(examTrack='general_training', locale='fa', targets={'writing': 7.0},
            selfReportedLevel=5.0, weeklyHours=5, baselineSummary=[], evidenceRevision=1,
            email='PRIVATE_EMAIL', name='PRIVATE_NAME'),
        task=dict(id='gt-letter',title='A request',examTrack='general_training',kind='gt_task1',skill='writing',
            objectiveIds=['tone'],sections=[dict(id='s1',title='Letter',instructions='Write a letter to a manager.', text=None,
                questions=[dict(id='letter',prompt='Request a repair.',responseType='extended_text')])]),
        learningControl=dict(locale='fa', stage='submitted', conditions=dict(mode='supported')),
        work=dict(ref=dict(kind='attempt', id='a', revision=1), responses=[], text='I demand fix it.'),
        anchors=[dict(id='tone',label='Register',text='Make a clear polite request.')],
        criterionIds=['task-achievement'], evidence=[dict(id='e1',kind='submission')],
        nextOptions=[dict(stepId='repair-letter',title='Revise request',skill='writing',
            objectiveIds=['tone'],evidenceIds=['e1']),dict(stepId='new-letter',title='New letter',
            skill='writing',objectiveIds=['tone'],evidenceIds=['e1'])],
        history=[dict(role='assistant',text='Try a polite request.'),dict(role='user',text='I demand fix it.')],
        message='How can I revise this?', private_key='DO_NOT_SEND', subjectId='PRIVATE_SUBJECT')
    p.update(changes)
    return p


def candidate(**changes):
    c = dict(kind='feedback',text='The request is direct; use a polite modal.',checkQuestion=None,
        citations=[dict(anchorId='tone')],workSpans=[dict(start=0,end=len('I demand fix it.'),quote='I demand fix it.')],
        observations=[dict(criterionId='task-achievement',observation='The request uses demand.',
            revisionAction='Rewrite the request with could you.',workSpanIndexes=[0],evidenceIds=['e1'])],
        proposal=None,limitations=['This is formative task feedback.'])
    c.update(changes)
    return c


def response(c=None):
    return dict(id='resp_synthetic',object='response',created_at=0,status='completed',error=None,
        incomplete_details=None,instructions=None,metadata={},model='gpt-6.1-sol',
        output=[dict(id='msg_1',type='message',role='assistant',status='completed',content=[
            dict(type='output_text',text=json.dumps(c or candidate()),annotations=[])])],
        parallel_tool_calls=False,temperature=1,tool_choice='auto',tools=[],top_p=1,
        usage=dict(input_tokens=10,output_tokens=20,total_tokens=30,
            input_tokens_details=dict(cached_tokens=2),output_tokens_details=dict(reasoning_tokens=3)))


def run_text(c=None, p=None, status=200):
    requests=[]
    async def handler(request):
        requests.append(json.loads(request.content))
        return httpx.Response(status,json=response(c) if status==200 else {'error':{'message':'PRIVATE_REMOTE'}})
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini',http_client=client)
            prepared=runner.prepare(p or payload())
            result=await runner.run(prepared)
            with pytest.raises(LearnerFailure,match='duplicate_dispatch'):
                await runner.run(prepared)
            return result
    return asyncio.run(run()),requests


def test_sdk_single_call_scoped_context_and_usage():
    result, requests=run_text()
    assert len(requests)==1 and result.usage['cachedInputTokens']==2
    request=requests[0]
    assert request['model']=='gpt-6.1-sol' and request['service_tier']=='default'
    assert request['store'] is False and request['max_output_tokens']==2000
    assert request['tools']==[] and request['reasoning']=={'effort':'low'}
    text=json.dumps(request)
    assert all(secret not in text for secret in ('PRIVATE_EMAIL','PRIVATE_NAME','PRIVATE_SUBJECT','DO_NOT_SEND'))
    assert 'I demand fix it.' in text and 'Try a polite request.' in text and 'repair-letter' in text
    assert result.response_id=='resp_synthetic' and result.model=='gpt-6.1-sol'
    assert 'Do not mention\ninternal IDs, revisions, hashes, jobs' in request['instructions']
    assert 'Preserve genuine educational and audio limitations' in request['instructions']


@pytest.mark.parametrize('c',[
    candidate(citations=[dict(anchorId='hidden')]),
    candidate(workSpans=[dict(start=0,end=15,quote='Invented quote.')]),
    candidate(observations=[]),
    candidate(proposal=dict(targetStepId='not-allowed',evidenceIds=['e1'],reason='Invented')),
    candidate(text='Your band is 7'),
    candidate(text='نمره شما ۷'),
    candidate(limitations=['Your band is 8']),
    candidate(proposal=dict(targetStepId='new-letter',evidenceIds=['e1'],reason='Your band is 8')),
    candidate(band=7),
])
def test_invalid_output_retains_usage_and_never_releases(c):
    with pytest.raises(LearnerFailure) as raised:
        run_text(c)
    assert raised.value.usage['totalTokens']==30
    assert raised.value.response_id=='resp_synthetic'


def test_numeric_goal_mention_is_not_a_prohibited_generated_score():
    result,_=run_text(candidate(text='Your target band is 7; practise polite requests.'))
    assert 'target' in result.candidate['text']


def test_generated_question_and_multiple_allowed_next_choices():
    result,_=run_text(candidate(kind='question',checkQuestion='How would you ask politely?',observations=[]),
        payload(intent='explain'))
    assert result.candidate['checkQuestion']
    result,_=run_text(candidate(kind='next_proposal',observations=[],proposal=dict(
        targetStepId='new-letter',evidenceIds=['e1'],reason='Apply the register in a fresh task.')),
        payload(intent='propose_next'))
    assert result.candidate['proposal']['targetStepId']=='new-letter'


def test_preparation_limits_and_independent_embargo_before_io():
    runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini')
    for p in [payload(work=dict(text='x'*70000)),payload(history=[dict(role='system',text='bad')]),
              payload(learningControl=dict(locale='en',stage='working',conditions=dict(mode='independent')))]:
        with pytest.raises(LearnerFailure):
            runner.prepare(p)


def test_no_sdk_retry_on_remote_failure():
    calls=[]
    async def handler(request):
        calls.append(request)
        return httpx.Response(429,json={'error':{'message':'PRIVATE_ERROR'}})
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini',http_client=client)
            with pytest.raises(LearnerFailure,match='provider_rate_limited'):
                await runner.run(runner.prepare(payload()))
    asyncio.run(run())
    assert len(calls)==1


def test_native_audio_four_criteria_and_modality_usage():
    calls=[]
    async def handler(request):
        p=json.loads(request.content);calls.append(p)
        assert p['modalities']==['text'] and p['service_tier']=='default'
        assert p['messages'][1]['content'][2]['type']=='input_audio'
        assert 'Preserve genuine educational and audio limitations' in p['messages'][0]['content']
        assert 'designated structured binding fields' in p['messages'][0]['content']
        r=audio_response();r['model']='gpt-audio-mini'
        r['usage']['prompt_tokens_details']=dict(audio_tokens=3,cached_tokens=0)
        return httpx.Response(200,json=r)
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini',http_client=client)
            result=await runner.run(runner.prepare(payload(kind='speaking',speakingInput=audio_bound().model_dump()),wav()))
            assert len(result.candidate['criteria'])==4 and result.usage['audioInputTokens']==3
            assert result.usage['modalityDetailsAvailable'] is True
    asyncio.run(run());assert len(calls)==1


def test_worker_dispatch_precedes_io_and_unknown_never_retries():
    events=[]
    class Repo:
        config=SimpleNamespace(issuer='synthetic')
        def worker(self,user,job_id,action,**kwargs):
            events.append(action)
            if action=='claim':return dict(fence=1,payload=payload())
            if action=='check':return True
            if action=='fail':assert kwargs['error'].code=='dispatch_unknown'
    class Runner:
        def prepare(self,p,a=None):events.append('prepare');return p
        async def run(self,p):events.append('http');raise LearnerFailure('provider_timeout')
        async def cancel(self,j):pass
    asyncio.run(LearnerWorker(Repo(),Runner()).process(dict(issuer='synthetic',subjectId='subject',jobId='job-1')))
    assert events.index('dispatch') < events.index('http')
    assert events.count('http')==1 and events[-1]=='fail'


def test_unexpected_model_holds_unknown_cost():
    async def handler(request):
        r=response();r['model']='unexpected-expensive-model'
        return httpx.Response(200,json=r)
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini',http_client=client)
            with pytest.raises(LearnerFailure,match='provider_model_mismatch') as raised:
                await runner.run(runner.prepare(payload()))
            assert raised.value.usage is None
            assert raised.value.model=='unexpected-expensive-model'
    asyncio.run(run())


def test_native_multi_recording_order_and_binding():
    first=audio_bound();second=audio_bound(recordingId='recording-2',taskId='task-2')
    third=audio_bound(recordingId='recording-3',taskId='task-3')
    async def handler(request):
        p=json.loads(request.content)
        assert len([c for c in p['messages'][1]['content'] if c['type']=='input_audio'])==3
        assert p['max_completion_tokens']==8192
        c=dict(kind='qualitative_speaking_feedback_collection',recordings=[
            dict(recordingId=b.recordingId,feedback=audio_candidate()) for b in (first,second,third)])
        r=audio_response(c);r['model']='gpt-audio-mini'
        return httpx.Response(200,json=r)
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini',http_client=client)
            p=payload(kind='speaking',speakingInputs=[first.model_dump(),second.model_dump(),third.model_dump()])
            result=await runner.run(runner.prepare(p,{'recording':wav(),'recording-2':wav(),'recording-3':wav()}))
            assert len(result.candidate['recordings'])==3
            assert result.usage['modalityDetailsAvailable'] is False
            with pytest.raises(LearnerFailure,match='invalid_context'):
                runner.prepare(p,{'recording':wav(),'recording-2':wav(),'injected':wav()})
    asyncio.run(run())


def test_cancel_and_authority_loss_interrupt_without_completion():
    async def scenario(authority=False):
        events=[];started=asyncio.Event()
        class Repo:
            config=SimpleNamespace(issuer='synthetic')
            def worker(self,user,job_id,action,**kwargs):
                events.append(action)
                if action=='claim':return dict(fence=1,payload=payload())
                if action=='check':return not authority
                if action=='fail':assert kwargs['error'].code=='dispatch_unknown'
        class Runner:
            def prepare(self,p,a=None):return p
            async def run(self,p):started.set();await asyncio.Event().wait()
            async def cancel(self,j):events.append('cancel')
        worker=LearnerWorker(Repo(),Runner())
        task=asyncio.create_task(worker.process(dict(issuer='synthetic',subjectId='s',jobId='job-1')))
        await started.wait()
        if authority:
            await asyncio.wait_for(task,1)
        else:
            task.cancel()
            with pytest.raises(asyncio.CancelledError):await task
        assert 'complete' not in events and 'fail' in events and 'cancel' in events
    asyncio.run(scenario());asyncio.run(scenario(True))


def test_task_private_field_injection_fails_before_request():
    p=payload();p['task']['answerKeys']={'letter':'PRIVATE_ANSWER'}
    runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini')
    with pytest.raises(LearnerFailure,match='invalid_context'):runner.prepare(p)


@pytest.mark.parametrize('location',['control','reference','history','conditions','baseline'])
def test_nested_projection_excludes_unexpected_authority_fields(location):
    p=payload();canary='PRIVATE_NESTED_CANARY'
    if location=='control':p['learningControl']['subjectId']=canary
    if location=='reference':p['work']['ref']['subjectId']=canary
    if location=='history':p['history'][0]['workRef']={'privateKey':canary}
    if location=='conditions':p['evidence'][0]['conditions']={'privateKey':canary}
    if location=='baseline':p['candidateContext']['baselineSummary']=[{'privateKey':canary}]
    runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini')
    try:prepared=runner.prepare(p)
    except LearnerFailure:assert location=='baseline'
    else:assert canary not in json.dumps(prepared.payload)


def test_receiving_nested_preferences_keep_goal_without_identity():
    p=payload();prefs=p['candidateContext'];p['candidateContext']={'preferences':prefs,'baselineSummary':[],'evidenceRevision':4}
    runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini')
    prepared=runner.prepare(p)
    assert prepared.payload['candidateContext']['targets']['writing']==7
    assert prepared.payload['candidateContext']['examTrack']=='general_training'
    assert prepared.payload['candidateContext']['evidenceRevision']==4
    assert 'PRIVATE_EMAIL' not in json.dumps(prepared.payload)


def test_condition_counter_is_not_a_work_revision_or_public_teaching_fact():
    p=payload()
    conditions=dict(original='supported',current='supported',revision=1,assisted=True,exposureEligible=False)
    p['learningControl']['conditions']=deepcopy(conditions)
    p['work']['ref']['revision']=2
    p['evidence'][0]['conditions']=deepcopy(conditions)
    p['candidateContext']['baselineSummary']=[deepcopy(p['evidence'][0])]
    runner=LearnerRunner(api_key='synthetic',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini')
    prepared=runner.prepare(p)
    assert prepared.payload['work']['ref']==dict(kind='attempt',id='a',revision=2)
    for projected in (prepared.payload['learningControl']['conditions'],
        prepared.payload['evidence'][0]['conditions'],
        prepared.payload['candidateContext']['baselineSummary'][0]['conditions']):
        assert projected=={k:v for k,v in conditions.items()if k!='revision'}
    assert p['learningControl']['conditions']['revision']==1
    assert p['evidence'][0]['conditions']['revision']==1


def test_licensed_three_part_speaking_without_teaching_anchors_accepts_actual_synthetic_voice():
    from app.services.learner_content import LearnerCatalog, digest
    from app.media.speaking import admit_wav
    root=Path(__file__).resolve().parents[3]
    catalog_root=root/'review/learner-mvp-20261107/catalog'
    audio_root=root/'review/learner-mvp-20261107/synthetic-speaking'
    if not (catalog_root/'catalog.json').is_file() or not all((audio_root/f'part-{i}.wav').is_file()for i in (1,2,3)):
        pytest.skip('Private licensed catalogue and explicitly synthetic voiced fixtures required')
    catalog=LearnerCatalog(catalog_root)
    task=catalog.get_task('c19-01-speaking');assessment=catalog.assessment('c19-01-speaking')
    meta=catalog.metadata('c19-01-speaking')
    assert task['teachingAnchors']==[]
    bindings=[];audio={}
    for i,section in enumerate(task['sections'],1):
        raw=(audio_root/f'part-{i}.wav').read_bytes();admitted=admit_wav(raw)
        with wave.open(io.BytesIO(raw),'rb')as speech:
            assert any(speech.readframes(speech.getnframes())), 'Voiced synthetic fixture must not be silent PCM'
        recording_id=f'synthetic-part-{i}';audio[recording_id]=raw
        bindings.append(audio_bound(admitted,recordingId=recording_id,
            taskId=task['id']+'-'+section['questions'][0]['id'],taskVersion=meta['version'],
            taskHash=meta['contentHash'],assessmentHash=digest(assessment),
            sourceVersion=catalog.catalog_hash,sourceHash=meta['contentHash'],
            prompt=section['questions'][0]['prompt'],assessmentGuidance=assessment['feedbackGuidance']).model_dump())
    runner=LearnerRunner(api_key='synthetic-no-provider-call',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini-2025-12-15')
    prepared=runner.prepare(payload(kind='speaking',task=task,anchors=[],speakingInputs=bindings),audio)
    assert len(prepared.recordings)==3 and prepared.payload['anchors']==[]
    assert [b.taskId for b,_ in prepared.recordings]==['c19-01-speaking-part1','c19-01-speaking-part2','c19-01-speaking-part3']
    assert 'PRIVATE_NAME'not in json.dumps(prepared.payload)
    with pytest.raises(LearnerFailure,match='content_unavailable'):
        runner.prepare(payload(anchors=[]))
