"""Private failures never escape to generic server logging/fallback responses."""
import asyncio
from uuid import UUID
import pytest
from fastapi.testclient import TestClient
from fastapi.responses import StreamingResponse
from app.main import create_app
from app.config import BackendConfig
from app.repositories.account import LocalPostgresConfig
from app.dependencies import CurrentUser
from app.http_security import PrivateResponseBoundaryMiddleware

MARKER='SYNTHETIC_PRIVATE_INTERNAL_EXCEPTION'

class Verifier:
    def verify(self,token):return CurrentUser('00000000-0000-4000-8000-000000000021')
class Account:config=LocalPostgresConfig()
class Reviews:
    config=LocalPostgresConfig()
    def call(self,*args,**kwargs):raise RuntimeError(MARKER)


def assert_failure(response):
    assert response.status_code==500
    assert response.headers['cache-control']=='private, no-store'
    assert response.headers['vary']=='Authorization'
    assert response.headers['x-content-type-options']=='nosniff'
    assert response.json()['detail']==dict(code='request_failed',message='Request is unavailable')
    assert str(UUID(response.json()['requestId']))==response.json()['requestId']
    assert response.headers['x-request-id']==response.json()['requestId']
    assert MARKER not in response.text


def test_actual_asgi_endpoint_exception_has_private_sanitized_response(caplog):
    app=create_app(BackendConfig('http://127.0.0.1:54321','local','synthetic',environment='test'),verifier=Verifier(),account_repository=Account(),content_review_repository=Reviews())
    # raise_server_exceptions=True proves exception is consumed, not merely hidden
    # by TestClient's generic server fallback.
    with TestClient(app,raise_server_exceptions=True) as client:
        response=client.get('/api/content-review/catalog',headers={'Authorization':'Bearer synthetic'})
        assert_failure(response)
    assert MARKER not in caplog.text


def test_actual_asgi_midstream_exception_releases_no_partial_marker(caplog):
    app=create_app()
    @app.get('/api/content-review/stream-failure')
    def broken():
        async def chunks():
            yield MARKER.encode()
            raise RuntimeError(MARKER)
        return StreamingResponse(chunks(),headers={'Cache-Control':'public'})
    with TestClient(app,raise_server_exceptions=True) as client:
        assert_failure(client.get('/api/content-review/stream-failure'))
    assert MARKER not in caplog.text


def test_guard_discards_oversize_response_and_never_double_starts():
    async def inner(scope,receive,send):
        await send(dict(type='http.response.start',status=200,headers=[]))
        await send(dict(type='http.response.body',body=b'x'*17,more_body=False))
    sent=[]
    async def receive():return dict(type='http.request',body=b'')
    async def send(message):sent.append(message)
    asyncio.run(PrivateResponseBoundaryMiddleware(inner,body_limit=16)(dict(type='http',path='/api/content-review/test',headers=[]),receive,send))
    assert [m['type'] for m in sent]==['http.response.start','http.response.body']
    assert sent[0]['status']==500 and b'x'*17 not in sent[1]['body']


def test_guard_forces_private_headers_on_success_before_release():
    async def inner(scope,receive,send):
        await send(dict(type='http.response.start',status=200,headers=[(b'cache-control',b'public'),(b'vary',b'Host')]))
        await send(dict(type='http.response.body',body=b'ok',more_body=False))
    sent=[]
    async def receive():return dict(type='http.request',body=b'')
    async def send(message):sent.append(message)
    asyncio.run(PrivateResponseBoundaryMiddleware(inner)(dict(type='http',path='/api/me',headers=[]),receive,send))
    headers=dict(sent[0]['headers'])
    assert headers[b'cache-control']==b'private, no-store' and headers[b'vary']==b'Authorization' and headers[b'x-content-type-options']==b'nosniff'
    assert sent[1]['body']==b'ok'


def test_guard_preserves_nonprivate_exception_behavior():
    async def inner(scope,receive,send):raise RuntimeError(MARKER)
    async def receive():return dict(type='http.request',body=b'')
    async def send(message):raise AssertionError('No response expected')
    with pytest.raises(RuntimeError,match=MARKER):
        asyncio.run(PrivateResponseBoundaryMiddleware(inner)(dict(type='http',path='/health',headers=[]),receive,send))


def test_guard_preserves_cancellation_without_emitting_failure():
    async def inner(scope,receive,send):raise asyncio.CancelledError()
    async def receive():return dict(type='http.request',body=b'')
    async def send(message):raise AssertionError('Canceled request must not emit a response')
    with pytest.raises(asyncio.CancelledError):
        asyncio.run(PrivateResponseBoundaryMiddleware(inner)(dict(type='http',path='/api/content-review/test',headers=[]),receive,send))
