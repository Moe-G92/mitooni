"""Real loopback HTTP proof inside a network-disabled local image.

Supplied on stdin, not shipped. Repository/identity are explicit fixtures; no DB,
Auth service or provider request is permitted. Patched entrypoint may be mounted
read-only for bounded proof before the coordinator's consolidated image build.
"""
from pathlib import Path
from types import SimpleNamespace
import json
import socket
import threading
import time
import httpx
import uvicorn
from app.config import BackendConfig
from app.main import create_app
import beta_entrypoint as beta

class Verifier:
    def verify(self,token):
        raise AssertionError('No token/remote identity request is needed for entry HTML')
class Repository:
    config = SimpleNamespace(environment='test',issuer='http://127.0.0.1/auth/v1')
    provider_enabled = False
    def call(self,*args,**kwargs):
        raise AssertionError('Anonymous request must stop before repository')
repo = Repository()
app = create_app(BackendConfig('http://127.0.0.1','local','synthetic-test-only',environment='test'),
    verifier=Verifier(),account_repository=repo,learner_repository=repo)
public = Path('/srv/web')
beta.attach_delivery(app,public,{'beta.example'},lambda:None)
with socket.socket() as temporary:
    temporary.bind(('127.0.0.1',0))
    port = temporary.getsockname()[1]
server = uvicorn.Server(uvicorn.Config(app,host='127.0.0.1',port=port,access_log=False,
    log_config=None,log_level='critical',proxy_headers=False))
thread = threading.Thread(target=server.run,daemon=True)
thread.start()
try:
    deadline = time.monotonic() + 10
    while not server.started:
        if time.monotonic() >= deadline:
            raise AssertionError('Fixture HTTP server unavailable')
        time.sleep(.02)
    with httpx.Client(base_url=f'http://127.0.0.1:{port}',headers={'Host':'beta.example'},trust_env=False) as client:
        # First request has no token, cookie, route history or earlier app visit.
        workspace = '11111111-1111-4111-8111-111111111111'
        page = client.get('/learn/' + workspace)
        assert page.status_code == 200 and page.headers['content-type'].startswith('text/html')
        assert page.content == (public/'index.html').read_bytes()
        assert page.headers['cache-control'] == 'private, no-store'
        assert 'set-cookie' not in page.headers
        assert client.get('/api/learner/workspaces/' + workspace).status_code == 401
        for path in ['/api/learner/invalid','/private/learner/catalog.json','/learn/not-an-id',
                     '/learn/'+workspace+'/answers','/learn/'+workspace+'/.env','/.env',
                     '/assets/catalog.json']:
            denied = client.get(path)
            assert denied.status_code == 404 and denied.content != page.content
        assert client.get('/learn/'+workspace,headers={'Host':'evil.example'}).status_code == 400
    print(json.dumps({'transport':'actual loopback HTTP','freshLearnerDeepLinkHTML':True,
        'apiAuthPreserved':True,'privateUnknownMalformedPathsDenied':True,'noCookieOrLearnerContent':True,
        'network':'disabled_except_container_loopback','hostedAuthDatabaseProviderProven':False}))
finally:
    server.should_exit = True
    thread.join(5)
