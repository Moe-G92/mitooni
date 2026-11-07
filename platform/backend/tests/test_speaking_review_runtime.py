"""Synthetic private runtime checks; real PostgreSQL only on explicit opt-in."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
import hashlib
import io
from pathlib import Path
from uuid import uuid4
import wave
import pytest
from fastapi.testclient import TestClient
from app.config import BackendConfig
from app.dependencies import CurrentUser
from app.repositories.account import AccountError,LocalPostgresConfig
from app.repositories.postgres_speaking_review import PostgresSpeakingReviewRepository
from app.services.content_review import ReviewPackage
from app.services.content_pipeline import digest
from app.services import speaking_review as s
from app.main import create_app
from local.seed import admin_connection
from local.speaking_fixtures import SyntheticSpeakingRunner
from app.workers.speaking_review import SpeakingReviewWorker


def wav():
    stream=io.BytesIO()
    with wave.open(stream,'wb') as a:
        a.setnchannels(1);a.setsampwidth(2);a.setframerate(8000);a.writeframes(b'\0\0'*8000)
    return stream.getvalue()

class Package:
    def load(self):
        target=dict(id='synthetic-speaking',version=1,skill='speaking',title='Synthetic task',instructions='Speak about a synthetic place.',stimulus={'kind':'prompt','text':'Describe a fictional place.'},questions=[dict(id='q',prompt='Describe it.',responseType='spoken_response')],assessment=dict(criteria=[dict(id=x,description='Listen to actual audio.') for x in ['fluency-coherence','lexical-resource','grammar','pronunciation']],feedbackGuidance='No score.'))
        return ReviewPackage(dict(manifest={'title':'Synthetic speaking'},units={target['id']:target},companions={}), 'd'*64)

def binding(data=None):
    p=Package().load();data=wav() if data is None else data
    return s.headers_binding(p.hash,digest(p.get('synthetic-speaking')),'synthetic-speaking',hashlib.sha256(data).hexdigest())

@pytest.fixture
def speaking_pg(request):
    if not request.config.getoption('--local-postgres'):pytest.skip('Explicit isolated PostgreSQL opt-in required')
    config=LocalPostgresConfig();user=CurrentUser(str(uuid4()));other=CurrentUser(str(uuid4()))
    with admin_connection() as c:
        c.execute((Path(__file__).resolve().parents[1]/'local/content-review-upgrade.sql').read_text())
        c.execute((Path(__file__).resolve().parents[1]/'local/speaking-review-upgrade.sql').read_text())
        c.execute("INSERT INTO mitooni_app.content_review_assignments(product_id,issuer,subject_id,package_hash,status,permissions) VALUES('mitooni',%s,%s,%s,'active',ARRAY['review:use','review:speaking-evaluate'])",(config.issuer,user.id,'d'*64))
    repo=PostgresSpeakingReviewRepository(config,Package(),call_budget=8,provider_enabled=True)
    yield repo,user,other
    with admin_connection() as c:
        c.execute('DELETE FROM mitooni_app.speaking_review_queue WHERE subject_id=%s',(user.id,))
        for table in ['speaking_review_records','speaking_review_budgets','content_review_assignments']:
            c.execute(f'DELETE FROM mitooni_app.{table} WHERE issuer=%s AND subject_id=%s',(config.issuer,user.id))


def submit(r,u,key=None):return r.submit(u,'synthetic-speaking',binding(),wav(),key or uuid4())

def test_pg_exact_bytes_replay_and_reopened_connection(speaking_pg):
    r,u,other=speaking_pg;key=uuid4();first=submit(r,u,key)
    assert first==submit(r,u,key)
    reopened=PostgresSpeakingReviewRepository(r.config,Package(),call_budget=8,provider_enabled=True)
    assert reopened.audio(u,'synthetic-speaking',first['recordingId'])==wav()
    assert reopened.list(u,'synthetic-speaking')['recordings']==[first]
    with pytest.raises(AccountError) as e:reopened.audio(other,'synthetic-speaking',first['recordingId'])
    assert e.value.status==403
    changed=wav()[:-2]+b'\1\0'
    with pytest.raises(AccountError) as e:r.submit(u,'synthetic-speaking',binding(changed),changed,key)
    assert e.value.code=='idempotency_conflict'


def test_pg_atomic_same_key_and_quota(speaking_pg):
    r,u,_=speaking_pg;key=uuid4()
    with ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(lambda _:submit(r,u,key),range(4)))
    assert len({x['jobId'] for x in rows})==1
    r.call_budget=2
    def attempt(_):
        try:return submit(r,u)['jobId']
        except AccountError as e:return e.code
    with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(attempt,range(4)))
    assert results.count('speaking_limit')==3
    assert len(r.list(u,'synthetic-speaking')['recordings'])==2


def test_pg_worker_fence_result_and_budget(speaking_pg):
    r,u,_=speaking_pg;item=submit(r,u);job=item['jobId']
    first=r.worker(u,job,'claim');assert r.worker(u,job,'claim') is None
    with pytest.raises(AccountError):r.worker(u,job,'dispatch',fence=first['fence']+1)
    runner=SyntheticSpeakingRunner();prepared=runner.prepare(first['bound'],first['audio'])
    assert r.worker(u,job,'dispatch',fence=first['fence'])
    with pytest.raises(AccountError):r.worker(u,job,'dispatch',fence=first['fence'])
    result=asyncio.run(runner.run(prepared));assert r.worker(u,job,'complete',fence=first['fence'],result=result)
    stored=r.list(u,'synthetic-speaking')['recordings'][0]
    assert stored['status']=='completed' and len(stored['result']['criteria'])==4
    assert r.worker(u,job,'complete',fence=first['fence'],result=result) is None
    with r._connect() as c:
        r._scope(c,u);budget=c.execute('SELECT reserved,settled FROM mitooni_app.speaking_review_budgets').fetchone()
        assert budget==dict(reserved=0,settled=1)


def test_pg_worker_actual_async_composition(speaking_pg):
    r,u,_=speaking_pg;item=submit(r,u)
    asyncio.run(SpeakingReviewWorker(r,SyntheticSpeakingRunner()).process(dict(subject_id=u.id,job_id=item['jobId'])))
    assert r.list(u,'synthetic-speaking')['recordings'][0]['status']=='completed'


def test_pg_crash_after_marker_is_unknown_no_redispatch(speaking_pg):
    r,u,_=speaking_pg;item=submit(r,u);job=item['jobId'];claimed=r.worker(u,job,'claim')
    r.worker(u,job,'dispatch',fence=claimed['fence'])
    with admin_connection() as c:c.execute("UPDATE mitooni_app.speaking_review_records SET lease_until=now()-interval '1 second' WHERE job_id=%s",(job,))
    assert r.worker(u,job,'claim') is None
    assert r.list(u,'synthetic-speaking')['recordings'][0]['status']=='dispatch_unknown'
    assert not any(str(x['job_id'])==job for x in r.queue())


def test_pg_crash_before_marker_reclaims_with_new_fence(speaking_pg):
    r,u,_=speaking_pg;item=submit(r,u);job=item['jobId'];old=r.worker(u,job,'claim')
    with admin_connection() as c:c.execute("UPDATE mitooni_app.speaking_review_records SET lease_until=now()-interval '1 second' WHERE job_id=%s",(job,))
    new=r.worker(u,job,'claim');assert new['fence']==old['fence']+1
    with pytest.raises(AccountError):r.worker(u,job,'dispatch',fence=old['fence'])


def test_pg_revocation_blocks_replay_audio_dispatch_commit(speaking_pg):
    r,u,_=speaking_pg;key=uuid4();item=submit(r,u,key);job=item['jobId'];claim=r.worker(u,job,'claim')
    with admin_connection() as c:c.execute("UPDATE mitooni_app.content_review_assignments SET status='revoked' WHERE subject_id=%s",(u.id,))
    for call in [lambda:submit(r,u,key),lambda:r.list(u,'synthetic-speaking'),lambda:r.audio(u,'synthetic-speaking',item['recordingId']),lambda:r.worker(u,job,'dispatch',fence=claim['fence']),lambda:r.worker(u,job,'complete',fence=claim['fence'],result=None)]:
        with pytest.raises(AccountError) as e:call()
        assert e.value.status==403


def test_pg_missing_provider_or_permission_has_no_queue_or_budget(speaking_pg):
    r,u,_=speaking_pg;r.provider_enabled=False
    with pytest.raises(AccountError) as e:submit(r,u)
    assert e.value.code=='speaking_unavailable' and not r.list(u,'synthetic-speaking')['recordings']
    r.provider_enabled=True
    with admin_connection() as c:c.execute("UPDATE mitooni_app.content_review_assignments SET permissions=ARRAY['review:use'] WHERE subject_id=%s",(u.id,))
    with pytest.raises(AccountError) as e:r.preflight(u,'synthetic-speaking')
    assert e.value.status==403


def test_task_and_hash_binding_exclude_private_answers():
    p=Package().load();p.targets['synthetic-speaking']['assessment']['answerKey']=['PRIVATE_ANSWER']
    bound=s.task_binding(p,'synthetic-speaking','synthetic-speaking')
    assert 'PRIVATE_ANSWER' not in str(bound)
    assert bound['taskVersion']==1 and bound['sourceHash']==p.hash
    with pytest.raises(AccountError):s.task_binding(p,'synthetic-speaking','missing')


def test_corrupt_bytes_rejected_before_provider():
    with pytest.raises(AccountError):s.admit(b'not WAV','a'*64)
    with pytest.raises(AccountError):s.admit(wav(),'a'*64)


UID='00000006-0000-4000-8000-000000000000'
class Verifier:
    def verify(self,token):
        if token!='speaking':raise ValueError()
        return CurrentUser(UID)
class Account:config=LocalPostgresConfig()
class Review:config=LocalPostgresConfig()
class Speaking:
    config=LocalPostgresConfig();provider_enabled=False
    def __init__(self):self.calls=[]
    def preflight(self,user,target):
        self.calls.append('preflight');s.fail('speaking_denied',403)
    def list(self,user,target):return dict(recordings=[],available=False)


def test_http_authority_before_audio_decode_and_private_headers():
    repo=Speaking();app=create_app(BackendConfig('http://127.0.0.1:54321','local','synthetic',environment='test'),verifier=Verifier(),account_repository=Account(),content_review_repository=Review(),speaking_review_repository=repo)
    with TestClient(app) as client:
        headers={'Authorization':'Bearer speaking','X-Expected-User-Id':UID,'Idempotency-Key':str(uuid4()),'X-Package-Hash':'d'*64,'X-Target-Hash':'a'*64,'X-Speaking-Task-Id':'q','X-Recording-Sha256':'a'*64,'Content-Type':'audio/wav'}
        response=client.post('/api/content-review/targets/q/speaking-recordings',headers=headers,content=b'not audio')
        assert response.status_code==403 and repo.calls==['preflight']
        assert response.headers['cache-control']=='private, no-store' and response.headers['x-content-type-options']=='nosniff'
        assert client.post('/api/content-review/targets/q/speaking-recordings',content=wav()).status_code==401
        assert repo.calls==['preflight']


def test_exact_audio_route_body_limit_leaves_generic_limit_unchanged():
    from app.http_security import ReviewBodyLimitMiddleware
    async def run(path,method,size):
        called=[];sent=[]
        async def inner(scope,receive,send):called.append(True)
        async def receive():return dict(type='http.request',body=b'x'*size,more_body=False)
        async def send(event):sent.append(event)
        await ReviewBodyLimitMiddleware(inner)(dict(type='http',method=method,path=path,headers=[]),receive,send)
        return called,sent
    called,_=asyncio.run(run('/api/content-review/targets/q/speaking-recordings','POST',524289));assert called
    for path,method,size in [('/api/content-review/targets/q/speaking-recordings/extra','POST',524289),('/api/content-review/targets/q/speaking-recordings','PUT',524289),('/api/content-review/targets/q/speaking-recordings','POST',18*1024*1024+1)]:
        called,sent=asyncio.run(run(path,method,size));assert not called and sent[0]['status']==413


def test_pg_actual_http_audio_submit_worker_playback_and_denied_role(speaking_pg):
    import time
    import psycopg
    r,u,other=speaking_pg
    class BoundVerifier:
        def verify(self,token):
            if token=='owner':return u
            if token=='other':return other
            raise ValueError()
    # Limit this test worker to its disposable owner; do not consume other queues.
    original_queue=r.queue
    r.queue=lambda:[row for row in original_queue() if str(row['subject_id'])==u.id]
    app=create_app(BackendConfig('http://127.0.0.1:54321','local','synthetic',environment='test'),verifier=BoundVerifier(),account_repository=Account(),content_review_repository=Review(),speaking_review_repository=r,speaking_runner=SyntheticSpeakingRunner(),speaking_worker_enabled=True)
    b=binding();headers={'Authorization':'Bearer owner','X-Expected-User-Id':u.id,'Idempotency-Key':str(uuid4()),'X-Package-Hash':b['packageHash'],'X-Target-Hash':b['targetHash'],'X-Speaking-Task-Id':b['taskId'],'X-Recording-Sha256':b['recordingSha256'],'Content-Type':'audio/wav'}
    base='/api/content-review/targets/synthetic-speaking/speaking-recordings'
    with TestClient(app) as client:
        response=client.post(base,content=wav(),headers=headers)
        assert response.status_code==201,response.text
        assert client.get(base,headers={'Authorization':'Bearer owner'}).status_code==422
        assert client.get(base,headers={'Authorization':'Bearer owner','X-Package-Hash':'f'*64,'X-Target-Hash':b['targetHash']}).status_code==409
        item=response.json()
        for _ in range(100):
            rows=client.get(base,headers={'Authorization':'Bearer owner','X-Package-Hash':b['packageHash'],'X-Target-Hash':b['targetHash']}).json()['recordings']
            if rows[0]['status']=='completed':break
            time.sleep(.01)
        assert rows[0]['status']=='completed'
        audio=client.get(base+'/'+item['recordingId']+'/audio',headers={'Authorization':'Bearer owner','X-Package-Hash':b['packageHash'],'X-Target-Hash':b['targetHash']})
        assert audio.status_code==200 and audio.content==wav()
        assert audio.headers['cache-control']=='private, no-store' and audio.headers['x-content-type-options']=='nosniff'
        assert client.get(base+'/'+item['recordingId']+'/audio',headers={'Authorization':'Bearer other','X-Package-Hash':b['packageHash'],'X-Target-Hash':b['targetHash']}).status_code==403
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with r._connect() as c:
            r._scope(c,u);c.execute("UPDATE mitooni_app.content_review_assignments SET permissions=ARRAY['review:use','review:speaking-evaluate']")
    with r._connect() as c:
        r._scope(c,other)
        assert c.execute('SELECT count(*) AS n FROM mitooni_app.speaking_review_records').fetchone()['n']==0
