"""Actual ASGI request limits and auth/privacy; repositories are synthetic here."""
import asyncio
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from app.config import BackendConfig
from app.dependencies import CurrentUser, AuthenticationUnavailable
from app.main import create_app
from app.http_security import ReviewBodyLimitMiddleware
from app.repositories.account import LocalPostgresConfig, AccountError

UID='00000006-0000-4000-8000-000000000000'
class Verifier:
    def verify(self,token):
        if token=='unavailable':raise AuthenticationUnavailable()
        if token!='reviewer':raise ValueError()
        return CurrentUser(UID)
class Account:
    config=LocalPostgresConfig()
class Reviews:
    config=LocalPostgresConfig()
    def __init__(self):self.calls=[]
    def call(self,user,action,body=None,key=None,target=None):
        self.calls.append((user.id,action,target))
        if target=='denied':raise AccountError('review_denied',403,'Reviewer access is unavailable')
        return {'action':action,'reviewerId':user.id}

@pytest.fixture
def client():
    repo=Reviews()
    app=create_app(BackendConfig('http://127.0.0.1:54321','local','synthetic',environment='test'),verifier=Verifier(),account_repository=Account(),content_review_repository=repo)
    with TestClient(app) as c:yield c,repo


def test_auth_sanitization_and_no_store(client):
    c,r=client
    for token,status in [('bad',401),('unavailable',503),('reviewer',200)]:
        response=c.get('/api/content-review/catalog',headers={'Authorization':'Bearer '+token})
        assert response.status_code==status
        assert response.headers['cache-control']=='private, no-store'
        assert response.headers['vary']=='Authorization'
    assert len(r.calls)==1
    denied=c.get('/api/content-review/targets/denied',headers={'Authorization':'Bearer reviewer'})
    assert denied.status_code==403
    assert denied.json()['detail']['code']=='review_denied'


def test_validation_never_echoes_private_inputs_and_mutation_guards(client):
    c,r=client
    headers={'Authorization':'Bearer reviewer','X-Expected-User-Id':UID,'Idempotency-Key':str(uuid4())}
    base=dict(packageHash='a'*64,targetHash='b'*64,expectedRevision=0)
    response=c.patch('/api/content-review/targets/q/draft',json=base|{'answers':[{'questionId':'q','text':'PRIVATE_SECRET'}],'role':'PRIVATE_SECRET'},headers=headers)
    assert response.status_code==422 and 'PRIVATE_SECRET' not in response.text and not r.calls
    response=c.post('/api/content-review/targets/q/reveal',json=base,headers=headers|{'X-Expected-User-Id':'other'})
    assert response.status_code==409 and not r.calls
    response=c.post('/api/content-review/targets/q/reveal',json=base,headers=headers)
    assert response.status_code==200 and r.calls==[(UID,'reveal','q')]


def test_oversize_http_body_gets_private_sanitized_413(client):
    c,r=client
    response=c.post('/api/content-review/targets/q/reveal',content=b'x'*524289,headers={'Content-Type':'application/json'})
    assert response.status_code==413 and response.headers['cache-control']=='private, no-store'
    assert response.json()['detail']['code']=='request_too_large' and not r.calls


@pytest.mark.parametrize('declared',[None,b'1',b'999999'])
def test_streaming_body_is_bounded_even_without_or_false_content_length(declared):
    called=[]
    async def inner(scope,receive,send):called.append(True)
    app=ReviewBodyLimitMiddleware(inner,limit=16)
    headers=[] if declared is None else [(b'content-length',declared)]
    scope=dict(type='http',path='/api/content-review/targets/q/reveal',headers=headers,method='POST',http_version='1.1')
    chunks=iter([dict(type='http.request',body=b'x'*10,more_body=True),dict(type='http.request',body=b'x'*10,more_body=False)])
    sent=[]
    async def receive():return next(chunks)
    async def send(message):sent.append(message)
    asyncio.run(app(scope,receive,send))
    assert not called and sent[0]['status']==413


def test_unconfigured_factory_has_no_review_routes():
    with TestClient(create_app()) as c:assert c.get('/api/content-review/catalog').status_code==404


def test_review_composition_rejects_unmatched_repository():
    with pytest.raises(ValueError):create_app(BackendConfig('http://127.0.0.1:54321','local','synthetic',environment='test'),content_review_repository=Reviews())
