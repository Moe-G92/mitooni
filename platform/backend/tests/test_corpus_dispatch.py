"""Synthetic SDK transport evidence; no credentials, source uploads or live API."""
import json
from dataclasses import replace
import httpx
from openai import OpenAI
import pytest
from app.corpus import dispatch as d,synthesis as s
from test_corpus_synthesis import corpus


def setup(corpus,tmp_path,handler):
    run=s.plan_classification(corpus,model='gpt-6.1-sol',window_chars=200,context_chars=50,mode='provider')['run_id']
    path=tmp_path/'private'/'requests.jsonl'
    b=s.prepare_batch(corpus,run,'classify',path)
    approval=d.Approval('synthetic-approval','gpt-6.1-sol','proj_synthetic',None,1_000_000,100_000,'1','5','2')
    d.initialize(corpus)
    identity=d.prepare(corpus,b['batch_key'],path,approval)
    client=OpenAI(api_key='synthetic-not-a-credential',organization=None,project=approval.project,base_url=d.BASE_URL,max_retries=0,timeout=30,http_client=d.bounded_http_client(transport=httpx.MockTransport(handler)))
    return d.Dispatcher(corpus,client,approval),identity,path,b


def file_body(size): return dict(id='file_synthetic',object='file',bytes=size,created_at=1,filename='synthetic.jsonl',purpose='batch',status='processed')
def batch_body(identity,status='validating',**kwargs): return dict(id='batch_synthetic',object='batch',endpoint=d.ENDPOINT,input_file_id='file_synthetic',completion_window='24h',created_at=1,status=status,metadata={'dispatch_id':identity},**kwargs)


def test_exact_sdk_upload_submit_serialization(corpus,tmp_path):
    calls=[];size=0;identity=''
    def handler(request):
        calls.append(request)
        assert request.headers['openai-project']=='proj_synthetic'
        assert request.url.host=='api.openai.com'
        if request.url.path=='/v1/files':
            assert b'name="purpose"' in request.content and b'batch' in request.content
            assert data in request.content
            return httpx.Response(200,json=file_body(len(data)))
        assert request.url.path=='/v1/batches'
        assert json.loads(request.content)==dict(input_file_id='file_synthetic',endpoint=d.ENDPOINT,completion_window='24h',metadata={'dispatch_id':identity})
        return httpx.Response(200,json=batch_body(identity))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    assert transport.upload(identity)=='file_synthetic'
    assert transport.submit(identity)=='batch_synthetic'
    assert [r.method for r in calls]==['POST','POST']
    with pytest.raises(s.CorpusError):transport.upload(identity)
    with pytest.raises(s.CorpusError):transport.submit(identity)
    assert len(calls)==2


@pytest.mark.parametrize('failure',['timeout','500','bad_success'])
def test_upload_unknown_never_retries(corpus,tmp_path,failure):
    calls=[]
    def handler(request):
        calls.append(request)
        if failure=='timeout': raise httpx.ReadTimeout('synthetic private response lost',request=request)
        return httpx.Response(500,json={'error':{'message':'PRIVATE_SENTINEL'}}) if failure=='500' else httpx.Response(200,json=file_body(1))
    transport,identity,path,b=setup(corpus,tmp_path,handler)
    with pytest.raises(s.CorpusError,match='upload_outcome_unknown_reconcile_only'):transport.upload(identity)
    with pytest.raises(s.CorpusError):transport.upload(identity)
    assert len(calls)==1
    assert corpus.execute('SELECT state FROM corpus_dispatch').fetchone()[0]=='upload_unknown'


def test_submission_unknown_reconciles_known_id_without_post(corpus,tmp_path):
    calls=[];identity='';data=b''
    def handler(request):
        calls.append(request.method+' '+request.url.path)
        if request.url.path=='/v1/files':return httpx.Response(200,json=file_body(len(data)))
        if request.method=='POST':raise httpx.ReadTimeout('lost synthetic submit reply',request=request)
        return httpx.Response(200,json=batch_body(identity))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    transport.upload(identity)
    with pytest.raises(s.CorpusError,match='submission_outcome_unknown'):transport.submit(identity)
    with pytest.raises(s.CorpusError):transport.submit(identity)
    transport.reconcile_submit(identity,'batch_synthetic')
    assert calls==['POST /v1/files','POST /v1/batches','GET /v1/batches/batch_synthetic']


def test_upload_reconciliation_checks_actual_bytes(corpus,tmp_path):
    calls=[];data=b'';bad=True
    def handler(request):
        calls.append(request.method)
        if request.method=='POST':raise httpx.ReadTimeout('lost',request=request)
        if request.url.path.endswith('/content'):return httpx.Response(200,content=b'wrong' if bad else data)
        return httpx.Response(200,json=file_body(len(data)))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    with pytest.raises(s.CorpusError):transport.upload(identity)
    with pytest.raises(s.CorpusError,match='remote_file_mismatch'):transport.reconcile_upload(identity,'file_synthetic')
    bad=False;transport.reconcile_upload(identity,'file_synthetic')
    assert calls.count('POST')==1


@pytest.mark.parametrize('attack',['bytes','model','rights','lease','budget','project','retry','redirect'])
def test_mutation_fences_before_network(corpus,tmp_path,attack):
    calls=[]
    transport,identity,path,b=setup(corpus,tmp_path,lambda r:calls.append(r))
    if attack=='bytes':path.write_bytes(b'changed')
    elif attack=='model':corpus.execute("UPDATE synthesis_jobs SET model='other'");corpus.commit()
    elif attack=='rights':corpus.execute("UPDATE corpus_authorities SET evidence='changed'");corpus.commit()
    elif attack=='lease':corpus.execute('UPDATE synthesis_jobs SET lease_until=0');corpus.commit()
    elif attack=='budget':transport.approval=replace(transport.approval,cap_usd='0.0001')
    elif attack=='project':transport.client.project='proj_other'
    elif attack=='retry':transport.client.max_retries=1
    else:transport.client._client.follow_redirects=True
    with pytest.raises(s.CorpusError):transport.upload(identity)
    assert calls==[]


def test_streamed_result_both_files_and_byte_quota(corpus,tmp_path):
    identity='';data=b'';large=False
    rows=[]
    def handler(request):
        if request.url.path=='/v1/files':return httpx.Response(200,json=file_body(len(data)))
        if request.url.path=='/v1/batches':return httpx.Response(200,json=batch_body(identity))
        if request.url.path=='/v1/batches/batch_synthetic':return httpx.Response(200,json=batch_body(identity,'completed',output_file_id='file_out',error_file_id='file_err'))
        if request.url.path=='/v1/files/file_out/content':return httpx.Response(200,content=b'x'*100 if large else json.dumps(rows[0]).encode()+b'\n')
        return httpx.Response(200,content=b'\n'.join(json.dumps(r).encode() for r in rows[1:]))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    for jid in b['lease_tokens']:
        rows.append(dict(custom_id=jid,error=None,response=dict(status_code=200,body=dict(status='completed',output=[dict(type='message',content=[dict(type='output_text',text=json.dumps(dict(disposition='background',node_ids=[],reason='Synthetic')))])]))))
    transport.upload(identity);transport.submit(identity)
    large=True
    with pytest.raises(s.CorpusError,match='remote_artifact_byte_limit'):transport.retrieve(identity,tmp_path/'private'/'out.jsonl',max_bytes=50)
    assert corpus.execute('SELECT count(*) FROM synthesis_receipts').fetchone()[0]==0
    large=False
    result=transport.retrieve(identity,tmp_path/'private'/'out.jsonl')
    assert result['complete']==len(rows)


def test_durable_intent_precedes_remote_and_concurrent_claim(corpus,tmp_path):
    calls=[];transport=None;identity='';data=b''
    def handler(request):
        calls.append(request)
        assert corpus.execute('SELECT state FROM corpus_dispatch').fetchone()[0]=='upload_unknown'
        with pytest.raises(s.CorpusError,match='dispatch_state_conflict'):transport.upload(identity)
        return httpx.Response(200,json=file_body(len(data)))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    transport.upload(identity)
    assert len(calls)==1


def test_private_symlink_and_permissions(corpus,tmp_path):
    transport,identity,path,b=setup(corpus,tmp_path,lambda r:pytest.fail('network forbidden'))
    path.chmod(0o644)
    with pytest.raises(s.CorpusError,match='permissions'):transport.upload(identity)
    path.chmod(0o600)
    alias=tmp_path/'alias';alias.symlink_to(path)
    with pytest.raises(s.CorpusError,match='symlink'):d.read_private(alias,1_000_000)


def test_approval_output_cap_and_immutable_scope(corpus,tmp_path):
    transport,identity,path,b=setup(corpus,tmp_path,lambda r:pytest.fail('network forbidden'))
    with pytest.raises(s.CorpusError,match='token_ceiling'):
        d.prepare(corpus,b['batch_key'],path,replace(transport.approval,output_token_ceiling=1))
    with pytest.raises(s.CorpusError,match='immutable_dispatch'):
        d.prepare(corpus,b['batch_key'],path,replace(transport.approval,reference='different-approval'))


def test_single_batch_approval_cannot_fund_second_batch(corpus,tmp_path):
    transport,identity,path,b=setup(corpus,tmp_path,lambda r:pytest.fail('network forbidden'))
    run=corpus.execute('SELECT run_id FROM synthesis_batches WHERE batch_key=?',(b['batch_key'],)).fetchone()[0]
    # A distinct plan configuration produces another valid run/batch.
    run=s.plan_classification(corpus,model='gpt-6.1-sol',window_chars=250,context_chars=50,mode='provider')['run_id']
    other=tmp_path/'private'/'other.jsonl';batch=s.prepare_batch(corpus,run,'classify',other)
    with pytest.raises(s.CorpusError,match='approval_reference_already_reserved'):
        d.prepare(corpus,batch['batch_key'],other,transport.approval)


def test_read_provider_errors_are_sanitized(corpus,tmp_path):
    def handler(request):
        if request.method=='POST':raise httpx.ReadTimeout('lost',request=request)
        return httpx.Response(500,json={'error':{'message':'PRIVATE_PROVIDER_SENTINEL'}})
    transport,identity,path,b=setup(corpus,tmp_path,handler)
    with pytest.raises(s.CorpusError):transport.upload(identity)
    with pytest.raises(s.CorpusError,match='provider_read_failed') as exc:transport.reconcile_upload(identity,'file_synthetic')
    assert 'PRIVATE_PROVIDER' not in str(exc.value)


def test_external_binding_cannot_start_second_remote_operation(corpus,tmp_path):
    transport,identity,path,b=setup(corpus,tmp_path,lambda r:pytest.fail('network forbidden'))
    s.bind_provider_batch(corpus,b['batch_key'],'batch_external')
    with pytest.raises(s.CorpusError,match='dispatch_provider_binding_conflict'):transport.upload(identity)


def test_error_body_bounded_before_sdk_buffers(corpus,tmp_path):
    consumed=[]
    class ErrorStream(httpx.SyncByteStream):
        def __iter__(self):
            for i in range(100):consumed.append(i);yield b'x'*65536
    def handler(request):
        if request.method=='POST':raise httpx.ReadTimeout('lost',request=request)
        return httpx.Response(500,stream=ErrorStream())
    transport,identity,path,b=setup(corpus,tmp_path,handler)
    with pytest.raises(s.CorpusError):transport.upload(identity)
    with pytest.raises(s.CorpusError,match='provider_read_failed|provider_response_byte_limit'):transport.reconcile_upload(identity,'file_synthetic')
    assert len(consumed)==16  # 1MB global non-success cap, one boundary chunk


def test_encoded_error_rejected_before_sdk_decompression(corpus,tmp_path):
    import gzip
    consumed=[];closed=[]
    class CompressedStream(httpx.SyncByteStream):
        def __iter__(self):consumed.append(True);yield gzip.compress(b'x'*2_000_000)
        def close(self):closed.append(True)
    def handler(request):
        assert request.headers['Accept-Encoding']=='identity'
        if request.method=='POST':raise httpx.ReadTimeout('lost',request=request)
        return httpx.Response(500,headers={'content-encoding':'gzip'},stream=CompressedStream())
    transport,identity,path,b=setup(corpus,tmp_path,handler)
    with pytest.raises(s.CorpusError):transport.upload(identity)
    with pytest.raises(s.CorpusError,match='provider_read_failed|encoded_provider_response'):transport.reconcile_upload(identity,'file_synthetic')
    assert consumed==[] and closed


def test_oversize_error_stream_closed(corpus,tmp_path):
    closed=[]
    class ErrorStream(httpx.SyncByteStream):
        def __iter__(self):yield b'x'*1_000_001
        def close(self):closed.append(True)
    def handler(request):
        return httpx.Response(500,stream=ErrorStream())
    transport,identity,path,b=setup(corpus,tmp_path,handler)
    with pytest.raises(s.CorpusError,match='upload_outcome_unknown'):transport.upload(identity)
    assert closed
    assert corpus.execute('SELECT state FROM corpus_dispatch').fetchone()[0]=='upload_unknown'


@pytest.mark.parametrize('kind',['redirect','oversize200','interrupted200'])
def test_mutating_reply_failure_closes_and_stays_unknown(corpus,tmp_path,kind):
    calls=[];closed=[]
    class ReplyStream(httpx.SyncByteStream):
        def __iter__(self):
            if kind=='oversize200':yield b'x'*1_000_001
            else:yield b'{';raise httpx.ReadError('synthetic interruption')
        def close(self):closed.append(True)
    def handler(request):
        calls.append(request)
        if kind=='redirect':return httpx.Response(307,headers={'location':'https://elsewhere.invalid'})
        return httpx.Response(200,stream=ReplyStream())
    transport,identity,path,b=setup(corpus,tmp_path,handler)
    with pytest.raises(s.CorpusError,match='upload_outcome_unknown'):transport.upload(identity)
    with pytest.raises(s.CorpusError):transport.upload(identity)
    assert len(calls)==1
    if kind!='redirect':assert closed
    assert corpus.execute('SELECT state FROM corpus_dispatch').fetchone()[0]=='upload_unknown'


@pytest.mark.parametrize('phase',['upload','submit'])
def test_expired_unknown_recovers_same_operation(corpus,tmp_path,phase):
    calls=[];data=b'';identity='';lost=True
    def handler(request):
        calls.append(request.method+' '+request.url.path)
        if request.method=='POST':
            if request.url.path=='/v1/files' and phase=='submit':return httpx.Response(200,json=file_body(len(data)))
            raise httpx.ReadTimeout('lost synthetic reply',request=request)
        if request.url.path.endswith('/content'):return httpx.Response(200,content=data)
        if request.url.path.startswith('/v1/files/'):return httpx.Response(200,json=file_body(len(data)))
        return httpx.Response(200,json=batch_body(identity))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    if phase=='submit':transport.upload(identity)
    with pytest.raises(s.CorpusError):getattr(transport,phase)(identity)
    before=[tuple(r) for r in corpus.execute('SELECT attempt,lease_token FROM synthesis_jobs ORDER BY job_id')]
    corpus.execute('UPDATE synthesis_jobs SET lease_until=0');corpus.commit()
    with pytest.raises(s.CorpusError):getattr(transport,'reconcile_'+phase)(identity,'file_synthetic' if phase=='upload' else 'batch_synthetic')
    count=len(calls)
    transport.recover_unknown(identity,reason='Synthetic explicit overnight same-operation recovery')
    assert len(calls)==count
    assert before==[tuple(r) for r in corpus.execute('SELECT attempt,lease_token FROM synthesis_jobs ORDER BY job_id')]
    getattr(transport,'reconcile_'+phase)(identity,'file_synthetic' if phase=='upload' else 'batch_synthetic')
    assert sum(c.startswith('POST') for c in calls)==(1 if phase=='upload' else 2)
    assert corpus.execute('SELECT state FROM corpus_dispatch').fetchone()[0]==('uploaded' if phase=='upload' else 'submitted')


@pytest.mark.parametrize('attack',['project','grant','request','ready','reason'])
def test_expired_unknown_recovery_rejects_scope_drift(corpus,tmp_path,attack):
    calls=[]
    def handler(request):calls.append(request);raise httpx.ReadTimeout('lost',request=request)
    transport,identity,path,b=setup(corpus,tmp_path,handler)
    if attack!='ready':
        with pytest.raises(s.CorpusError):transport.upload(identity)
    corpus.execute('UPDATE synthesis_jobs SET lease_until=0');corpus.commit()
    if attack=='project':transport.client.project='wrong'
    elif attack=='grant':transport.approval=replace(transport.approval,reference='wrong')
    elif attack=='request':path.write_bytes(b'changed')
    count=len(calls)
    with pytest.raises(s.CorpusError):transport.recover_unknown(identity,reason='' if attack=='reason' else 'Synthetic explicit recovery')
    assert len(calls)==count
    assert corpus.execute('SELECT max(lease_until) FROM synthesis_jobs').fetchone()[0]==0


def test_concurrent_upload_reconciliation_never_reissues_post(corpus,tmp_path):
    calls=[];data=b'';identity='';entered=False;transport=None
    def handler(request):
        nonlocal entered
        calls.append(request.method+' '+request.url.path)
        if request.method=='POST':raise httpx.ReadTimeout('lost',request=request)
        if request.url.path.endswith('/content'):return httpx.Response(200,content=data)
        if not entered:
            entered=True
            transport.reconcile_upload(identity,'file_synthetic')
        return httpx.Response(200,json=file_body(len(data)))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    with pytest.raises(s.CorpusError):transport.upload(identity)
    with pytest.raises(s.CorpusError,match='dispatch_state_conflict'):transport.reconcile_upload(identity,'file_synthetic')
    assert corpus.execute('SELECT state FROM corpus_dispatch').fetchone()[0]=='uploaded'
    assert calls.count('POST /v1/files')==1


def test_saved_remote_batch_binding_gap_recovers_after_expiry(corpus,tmp_path,monkeypatch):
    calls=[];data=b'';identity=''
    def handler(request):
        calls.append(request.method+' '+request.url.path)
        if request.url.path=='/v1/files':return httpx.Response(200,json=file_body(len(data)))
        return httpx.Response(200,json=batch_body(identity))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    transport.upload(identity)
    bind=s.bind_provider_batch
    def crash(*args,**kwargs):raise s.CorpusError('synthetic_local_binding_crash')
    monkeypatch.setattr(s,'bind_provider_batch',crash)
    with pytest.raises(s.CorpusError,match='synthetic_local_binding_crash'):transport.submit(identity)
    assert corpus.execute('SELECT batch_id FROM corpus_dispatch').fetchone()[0]=='batch_synthetic'
    monkeypatch.setattr(s,'bind_provider_batch',bind)
    corpus.execute('UPDATE synthesis_jobs SET lease_until=0');corpus.commit()
    transport.recover_unknown(identity,reason='Synthetic explicit saved identity binding recovery')
    transport.reconcile_submit(identity,'batch_synthetic')
    assert calls.count('POST /v1/batches')==1
    assert corpus.execute('SELECT provider_id FROM synthesis_batches').fetchone()[0]=='batch_synthetic'


def test_sdk_child_debug_logs_do_not_expose_private_payload(corpus,tmp_path,caplog):
    import logging
    data=b''
    def handler(request):return httpx.Response(200,json=file_body(len(data)))
    transport,identity,path,b=setup(corpus,tmp_path,handler);data=path.read_bytes()
    child=logging.getLogger('openai._base_client');child.disabled=False;child.setLevel(logging.DEBUG)
    with caplog.at_level(logging.DEBUG):transport.upload(identity)
    assert not any(r.name.startswith(('openai','httpx','httpcore')) for r in caplog.records)
