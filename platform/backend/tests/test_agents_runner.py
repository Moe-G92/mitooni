"""Real pinned SDK runs over process-local HTTP fixtures; no provider access."""
import asyncio
from dataclasses import replace
import json
import httpx
import pytest
from app.contracts.tutor_runtime import BoundTurnInput, RunnerLimits, RunnerFailure
from app.providers.agents_runner import AgentsRunner


def bound(**changes):
    args=dict(actor_id='synthetic-a',issuer='synthetic',workspace_id='w',attempt_id='a',
        turn_id='t',dispatch_id='d',fence=1,bundle={'private_key':'NEVER_SEND'},
        context_manifest_id='c',context_hash='h',work_ref={'kind':'attempt','id':'a','revision':1},
        work_text='A useful example.',intent='feedback',message='Why?',
        anchors=({'id':'anchor','text':'Use a specific example.','label':'Examples'},),
        criterion_ids=('support',),assistance_mode='supported',
        task_context={'taskId':'reading-park','kind':'reading','title':'Reading evidence',
            'stimulus':'A synthetic survey observed more walking.',
            'prompt':'Choose A) proof of cause B) observation only.',
            'objectiveDescription':'Distinguish evidence from causal inference'},
        learning_control={'stage':'submitted','assistanceMode':'supported','locale':'fa',
            'selfReportedCurrentLevel':'beginner','permittedFeedbackKinds':['feedback'],
            'nextStepIds':['writing-reasons']})
    args.update(changes)
    return BoundTurnInput(**args)

class Tools:
    def __init__(self): self.calls=[]
    async def call(self,name,arguments):
        self.calls.append((name,arguments))
        return {'text':'Approved synthetic source'}

def candidate(**changes):
    result={'kind':'feedback','text':'Your example supports the point. Explain its consequence.',
        'citations':[{'anchorId':'anchor'}],'workSpans':[{'start':0,'end':17,'quote':'A useful example.'}],
        'observations':[{'criterionId':'support','text':'A concrete example is present.','workSpanIndexes':[0]}],
        'proposal':None}
    result.update(changes)
    return result

def sse(output, refusal=False):
    text=json.dumps(output)
    item={'id':'msg_1','type':'message','role':'assistant','status':'completed',
        'content':[{'type':'output_text','text':text,'annotations':[]}]} if not refusal else {
            'id':'msg_1','type':'message','role':'assistant','status':'completed',
            'content':[{'type':'refusal','refusal':'Cannot do that'}]}
    response={'id':'resp_1','object':'response','created_at':0,'status':'completed','error':None,
        'incomplete_details':None,'instructions':None,'metadata':{},'model':'test-model',
        'output':[item],'parallel_tool_calls':False,'temperature':1,'tool_choice':'auto','tools':[],
        'top_p':1,'usage':{'input_tokens':5,'output_tokens':8,'total_tokens':13}}
    events=[{'type':'response.created','response':dict(response,status='in_progress',output=[])},
        {'type':'response.output_item.added','output_index':0,'item':dict(item,status='in_progress')}]
    if refusal:events.append({'type':'response.refusal.delta','item_id':'msg_1','output_index':0,'content_index':0,'delta':'Cannot'})
    else: events.append({'type':'response.output_text.delta','item_id':'msg_1','output_index':0,'content_index':0,'delta':text})
    events += [{'type':'response.output_item.done','output_index':0,'item':item},{'type':'response.completed','response':response}]
    return ''.join('data: '+json.dumps(dict(e,sequence_number=i))+'\n\n' for i,e in enumerate(events)).encode()

async def collect(runner,prepared):return [e async for e in runner.stream(prepared)]

def run_mock(body, item=None):
    requests=[]
    async def handler(request):
        assert str(request.url)=='https://api.openai.com/v1/responses'
        requests.append(json.loads(request.content))
        return httpx.Response(200,headers={'content-type':'text/event-stream'},content=body)
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='synthetic-never-real',model='test-model',http_client=client)
            prepared=runner.prepare(item or bound(),Tools())
            return await collect(runner,prepared)
    return asyncio.run(run()),requests

def test_actual_sdk_candidate_and_private_projection():
    events,requests=run_mock(sse(candidate()))
    assert [e.kind for e in events]==['candidate','usage','finished']
    assert events[0].data.text.startswith('Your example')
    request=requests[0]
    assert request['model']=='test-model' and request['store'] is False
    assert request['max_output_tokens']==1600
    assert 'NEVER_SEND' not in json.dumps(request) and 'synthetic-a' not in json.dumps(request)
    assert 'previous_response_id' not in request
    assert len(request['tools'])==2

@pytest.mark.parametrize('output',[candidate(band=7),candidate(text=''),{'text':'bad'},candidate(text='x'*6001)])
def test_malformed_candidate_has_no_release(output):
    with pytest.raises(RunnerFailure):run_mock(sse(output))

def test_refusal_has_no_candidate():
    with pytest.raises(RunnerFailure,match='provider_refused'):run_mock(sse({},refusal=True))

def test_independent_and_bad_limits_fail_before_http():
    runner=AgentsRunner(api_key='synthetic',model='test-model')
    with pytest.raises(RunnerFailure,match='assistance_required'):
        runner.prepare(bound(assistance_mode='independent'),Tools())
    with pytest.raises(RunnerFailure,match='invalid_limits'):
        runner.prepare(bound(limits=RunnerLimits(tool_calls=99)),Tools())
    with pytest.raises(RunnerFailure,match='input_limit'):
        runner.prepare(bound(work_text='x'*70000),Tools())

def tool_sse(name='approved_anchor', arguments=None):
    item={'id':'fc_1','type':'function_call','call_id':'call_1','name':name,
          'arguments':json.dumps(arguments or {'anchor_id':'anchor'}),'status':'completed'}
    response={'id':'resp_tool','object':'response','created_at':0,'status':'completed','error':None,
        'incomplete_details':None,'instructions':None,'metadata':{},'model':'test-model',
        'output':[item],'parallel_tool_calls':False,'temperature':1,'tool_choice':'auto','tools':[],
        'top_p':1,'usage':{'input_tokens':3,'output_tokens':2,'total_tokens':5}}
    return ('data: '+json.dumps({'type':'response.completed','sequence_number':0,'response':response})+'\n\n').encode()


def test_real_sdk_multiple_model_tool_turns_and_injection_denial():
    async def scenario(forbidden=False, limit=4):
        requests=[];tools=Tools()
        async def handler(request):
            requests.append(json.loads(request.content))
            # Two distinct tool/model iterations, then typed generated final output.
            payload=tool_sse(arguments={'anchor_id':'private-key' if forbidden else 'anchor'}) if len(requests)<=2 else sse(candidate())
            return httpx.Response(200,headers={'content-type':'text/event-stream'},content=payload)
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='synthetic',model='test-model',http_client=client)
            events=await collect(runner,runner.prepare(bound(limits=RunnerLimits(tool_calls=limit)),tools))
        return events,requests,tools
    events,requests,tools=asyncio.run(scenario())
    assert len(requests)==3 and len(tools.calls)==2
    assert all(call==('approved_anchor',{'anchorId':'anchor'}) for call in tools.calls)
    assert any(i.get('type')=='function_call_output' for i in requests[1]['input'])
    assert [e.kind for e in events].count('candidate')==1
    with pytest.raises(RunnerFailure,match='tool_denied'):asyncio.run(scenario(forbidden=True))
    with pytest.raises(RunnerFailure,match='tool_limit'):asyncio.run(scenario(limit=1))


def test_zero_http_retries_and_duplicate_dispatch():
    async def scenario():
        calls=[]
        async def handler(request):
            calls.append(request)
            return httpx.Response(429,json={'error':{'message':'synthetic rate limit','type':'rate_limit_error'}})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='synthetic',model='test-model',http_client=client)
            prepared=runner.prepare(bound(),Tools())
            with pytest.raises(RunnerFailure):await collect(runner,prepared)
            with pytest.raises(RunnerFailure,match='duplicate_dispatch'):await collect(runner,prepared)
        assert len(calls)==1
    asyncio.run(scenario())


def test_timeout_and_cooperative_cancel_without_candidate():
    async def scenario(cancel):
        started=asyncio.Event()
        async def handler(request):
            started.set()
            await asyncio.Event().wait()
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='synthetic',model='test-model',http_client=client)
            prepared=runner.prepare(bound(limits=RunnerLimits(timeout_seconds=.05 if not cancel else 2)),Tools())
            task=asyncio.create_task(collect(runner,prepared))
            await started.wait()
            if cancel:await runner.cancel('t')
            with pytest.raises(RunnerFailure,match='canceled' if cancel else 'provider_timeout'):
                await asyncio.wait_for(task,1)
    asyncio.run(scenario(False))
    asyncio.run(scenario(True))


def test_sdk_turn_limit_and_raw_output_limit():
    async def scenario():
        async def handler(request):
            return httpx.Response(200,headers={'content-type':'text/event-stream'},content=tool_sse())
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='synthetic',model='test-model',http_client=client)
            with pytest.raises(RunnerFailure):
                await collect(runner,runner.prepare(bound(limits=RunnerLimits(sdk_turns=1)),Tools()))
    asyncio.run(scenario())
    with pytest.raises(RunnerFailure,match='output_limit'):run_mock(sse(candidate(text='x'*33000)))

def test_unsafe_sdk_logging_fails_closed(monkeypatch):
    from agents import _debug
    monkeypatch.setattr(_debug,'DONT_LOG_TOOL_DATA',False)
    with pytest.raises(RunnerFailure,match='unsafe_provider_logging'):
        AgentsRunner(api_key='synthetic',model='test-model').prepare(bound(),Tools())

@pytest.mark.parametrize('status,code',[(401,'provider_configuration'),(403,'provider_configuration'),
    (429,'provider_rate_limited'),(503,'provider_unavailable')])
def test_api_failure_codes_and_sdk_log_boundary(status,code,caplog):
    import logging
    caplog.set_level(logging.DEBUG)
    async def run():
        requests=[]
        async def handler(request):
            requests.append(request)
            return httpx.Response(status,json={'error':{'message':'PRIVATE_REMOTE_BODY','type':'fixture'}})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='PRIVATE_KEY',model='test-model',http_client=client)
            prepared=runner.prepare(bound(work_text='PRIVATE_ESSAY'),Tools())
            with pytest.raises(RunnerFailure,match=code):await collect(runner,prepared)
        assert len(requests)==1
    asyncio.run(run())
    for record in caplog.records:
        if record.name.split('.')[0] in {'openai','httpx','httpcore'}:
            assert record.msg=='SDK diagnostic suppressed'
            assert not record.args and record.exc_info is None and record.stack_info is None
    assert not any(s in caplog.text for s in ['PRIVATE_REMOTE_BODY','PRIVATE_KEY','PRIVATE_ESSAY'])


def test_concurrent_future_child_logs_drop_arbitrary_content(caplog):
    import logging
    caplog.set_level(logging.DEBUG)
    AgentsRunner(api_key='fixture',model='fixture')
    async def emit(i):
        await asyncio.sleep(0)
        try:raise ValueError('ARBITRARY_PRIVATE_EXCEPTION_'+str(i))
        except ValueError:
            logging.getLogger('openai.future.child'+str(i)).error('PRIVATE_MSG_%s',i,exc_info=True,stack_info=True)
    async def run():await asyncio.gather(*(emit(i) for i in range(5)))
    asyncio.run(run())
    records=[r for r in caplog.records if r.name.startswith('openai.')]
    assert len(records)==5
    assert all(r.msg=='SDK diagnostic suppressed' and not r.args and not r.exc_info and not r.stack_info for r in records)
    assert 'PRIVATE' not in caplog.text


def test_environment_cannot_change_endpoint_or_receiving_headers(monkeypatch):
    # Entirely synthetic environment patch; no environment/credentials read by test.
    monkeypatch.setenv('OPENAI_BASE_URL','https://forbidden.invalid')
    monkeypatch.setenv('OPENAI_ORG_ID','foreign-organization')
    monkeypatch.setenv('OPENAI_PROJECT_ID','foreign-project')
    async def run():
        async def handler(request):
            assert str(request.url)=='https://api.openai.com/v1/responses'
            assert request.headers.get('openai-organization','')==''
            assert request.headers.get('openai-project','')==''
            return httpx.Response(200,headers={'content-type':'text/event-stream'},content=sse(candidate()))
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='fixture',model='test-model',http_client=client)
            await collect(runner,runner.prepare(bound(),Tools()))
    asyncio.run(run())


def test_prepare_allocates_no_clients(monkeypatch):
    import app.providers.agents_runner as module
    def denied(*args,**kwargs):raise AssertionError('Client allocated during prepare')
    monkeypatch.setattr(module,'AsyncOpenAI',denied)
    prepared=AgentsRunner(api_key='fixture',model='test-model').prepare(bound(),Tools())
    assert prepared.client is None and prepared.agent is None


def test_transport_timeout_is_classified():
    async def run():
        async def handler(request):raise httpx.ReadTimeout('PRIVATE_TIMEOUT')
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='fixture',model='test-model',http_client=client)
            with pytest.raises(RunnerFailure,match='provider_timeout'):
                await collect(runner,runner.prepare(bound(),Tools()))
    asyncio.run(run())


def test_actual_request_carries_authored_task_and_learning_controls():
    events,requests=run_mock(sse(candidate()))
    payload=json.loads(requests[0]['input'][-1]['content'])
    assert payload['task']['stimulus']=='A synthetic survey observed more walking.'
    assert 'A)' in payload['task']['prompt'] and 'B)' in payload['task']['prompt']
    assert payload['task']['objectiveDescription']=='Distinguish evidence from causal inference'
    assert payload['learningControl']=={'stage':'submitted','assistanceMode':'supported','locale':'fa',
        'selfReportedCurrentLevel':'beginner','permittedFeedbackKinds':['feedback'],'nextStepIds':['writing-reasons']}
    with pytest.raises(RunnerFailure,match='invalid_context'):
        run_mock(sse(candidate()),replace(bound(),task_context=dict(bound().task_context,privateKey='B')))
    with pytest.raises(RunnerFailure,match='invalid_context'):
        run_mock(sse(candidate()),replace(bound(),learning_control=dict(bound().learning_control,assistanceMode='post_submit_review')))


def test_own_client_disables_environment_and_is_closed(monkeypatch):
    import app.providers.agents_runner as module
    original_init=httpx.AsyncClient.__init__
    clients=[]
    async def handler(request):
        assert str(request.url)=='https://api.openai.com/v1/responses'
        return httpx.Response(200,headers={'content-type':'text/event-stream'},content=sse(candidate()))
    def constructor(client,*args,**kwargs):
        assert kwargs.get('trust_env') is False
        kwargs['transport']=httpx.MockTransport(handler)
        original_init(client,*args,**kwargs)
        clients.append(client)
    monkeypatch.setattr(httpx.AsyncClient,'__init__',constructor)
    async def run():
        runner=AgentsRunner(api_key='fixture',model='test-model')
        prepared=runner.prepare(bound(),Tools())
        assert not clients
        await collect(runner,prepared)
    asyncio.run(run())
    assert len(clients)==1 and clients[0].is_closed


def test_concurrent_real_sdk_debug_requests_are_private(caplog):
    import logging
    caplog.set_level(logging.DEBUG)
    async def handler(request):
        await asyncio.sleep(0)
        return httpx.Response(200,headers={'content-type':'text/event-stream'},content=sse(candidate()))
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            runner=AgentsRunner(api_key='PRIVATE_CONCURRENT_KEY',model='test-model',http_client=client)
            await asyncio.gather(*(collect(runner,runner.prepare(bound(turn_id=str(i),work_text='PRIVATE_CONCURRENT_WORK_'+str(i)),Tools())) for i in range(2)))
    asyncio.run(run())
    records=[r for r in caplog.records if r.name.split('.')[0] in {'openai','httpx','httpcore'}]
    assert records and all(r.msg=='SDK diagnostic suppressed' and not r.args and r.exc_info is None for r in records)
    assert 'PRIVATE_CONCURRENT' not in caplog.text


def test_sdk_boundary_composes_factory_and_preserves_application_logs(caplog):
    import logging
    from app.providers.agents_runner import _install_sdk_log_boundary
    prior=logging.getLogRecordFactory()
    def existing(*args,**kwargs):
        record=prior(*args,**kwargs)
        record.application_factory_marker=True
        return record
    logging.setLogRecordFactory(existing)
    try:
        _install_sdk_log_boundary()
        caplog.set_level(logging.DEBUG)
        logging.getLogger('mitooni.application').info('Application value %s','kept')
        logging.getLogger('openai.future').error('SDK arbitrary %s','discarded')
        application=next(r for r in caplog.records if r.name=='mitooni.application')
        sdk=next(r for r in caplog.records if r.name=='openai.future')
        assert application.application_factory_marker and sdk.application_factory_marker
        assert application.msg=='Application value %s' and application.args==('kept',)
        assert application.getMessage()=='Application value kept'
        assert sdk.msg=='SDK diagnostic suppressed' and not sdk.args
    finally:
        logging.setLogRecordFactory(prior)


def test_locale_and_self_report_are_sent_as_controls_not_scores():
    _,requests=run_mock(sse(candidate()))
    serialized=json.dumps(requests[0])
    assert 'locale fa for Persian or en for English' in serialized
    assert 'not a validated score' in serialized
    payload=json.loads(requests[0]['input'][-1]['content'])
    assert payload['learningControl']['locale']=='fa'
    assert payload['learningControl']['selfReportedCurrentLevel']=='beginner'
    assert 'measuredLevel' not in payload['learningControl']
    assert 'score' not in payload['learningControl']


def test_canonical_history_preserves_order_and_anchors_current_message_work():
    history=({'role':'user','text':'Earlier question one'},
        {'role':'assistant','text':'Earlier explanation one'},
        {'role':'user','text':'Earlier question two'},
        {'role':'assistant','text':'Earlier explanation two'})
    current=bound(allowed_history=history,message='Explain this current sentence: “My example.”',
        work_text='Current captured work: My example.')
    _,requests=run_mock(sse(candidate()),current)
    inputs=requests[0]['input']
    assert inputs[:-1]==[{'role':h['role'],'content':h['text']} for h in history]
    assert inputs[-1]['role']=='user'
    payload=json.loads(inputs[-1]['content'])
    assert payload['message']=='Explain this current sentence: “My example.”'
    assert payload['work']=='Current captured work: My example.'
    assert len(inputs)==len(history)+1
    with pytest.raises(RunnerFailure,match='invalid_context'):
        run_mock(sse(candidate()),bound(allowed_history=({'role':'system','text':'Wrong authority'},)))
    with pytest.raises(RunnerFailure,match='invalid_context'):
        run_mock(sse(candidate()),bound(allowed_history=({'role':'user','text':'Wrong context','contextId':'foreign'},)))
    with pytest.raises(RunnerFailure,match='input_limit'):
        run_mock(sse(candidate()),bound(allowed_history=tuple({'role':'user','text':'too much'} for _ in range(21))))
