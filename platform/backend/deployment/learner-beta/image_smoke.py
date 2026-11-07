"""Network-disabled image evidence. Supplied on stdin, never shipped.

Synthetic fixtures are not hosted Auth/PostgreSQL/provider proof.
"""
from pathlib import Path
from hashlib import sha256
import importlib
import inspect
import json
import os
import shutil
import ssl
import tempfile
import app
import beta_entrypoint as beta
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from app.services.learner_content import LearnerCatalog

assert {'learner_catalog','learner_runner','learner_budget_policy_id'} <= set(inspect.signature(beta.create_receiving_app).parameters)
assert os.getuid() == 10001
assert os.environ['SSL_CERT_FILE'] == '/etc/ssl/certs/ca-certificates.crt'
ca = Path('/usr/local/share/ca-certificates/mitooni-supabase-root-2021.crt')
assert sha256(ca.read_bytes()).hexdigest() == '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7'
trusted = ssl.create_default_context()
assert ssl.PEM_cert_to_DER_cert(ca.read_text()) in trusted.get_ca_certs(binary_form=True)
assert importlib.util.find_spec('app.corpus') is None
modules = set()
for source in Path(next(iter(app.__path__))).rglob('*.py'):
    parts = list(source.relative_to(Path(next(iter(app.__path__)))).with_suffix('').parts)
    if parts[-1] == '__init__': parts.pop()
    modules.add('.'.join(['app', *parts]))
for module in modules:
    importlib.import_module(module)
root = Path('/srv/private/learner')
catalog = LearnerCatalog(root)
public = Path('/srv/web')
assert not root.is_relative_to(public)
assert not any(p.is_file() and (p.suffix in {'.json','.map','.sqlite','.pdf','.py','.mp3','.wav','.png'} or p.name.startswith('.')) for p in public.rglob('*'))
assert not (public / 'mockServiceWorker.js').exists()
assert beta.learner_configuration({}) == (None, None)
manifest = json.loads((root / 'catalog.json').read_bytes())
assert len(manifest['assets']) > 0
assert {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()} == {'catalog.json'} | {a['path'] for a in manifest['assets']}
for record in manifest['assets']:
    asset = catalog.asset(record['id'])
    assert asset['sizeBytes'] == len(asset['path'].read_bytes())

application = FastAPI()
@application.get('/api/learner/bootstrap')
def protected_fixture():
    raise HTTPException(401)
beta.attach_delivery(application, public, {'beta.example','healthcheck.railway.app'}, lambda: None)
with TestClient(application, base_url='https://beta.example') as client:
    assert client.get('/app').status_code == 200
    deep_link = client.get('/learn/11111111-1111-4111-8111-111111111111')
    assert deep_link.status_code == 200 and deep_link.headers['content-type'].startswith('text/html')
    assert deep_link.content == (public / 'index.html').read_bytes()
    assert deep_link.headers['cache-control'] == 'private, no-store'
    assert client.get('/ready').json() == {'status':'ready'}
    assert client.get('/api/learner/bootstrap').status_code == 401
    for path in ['/api', '/api/no-such-route', '/private/learner/catalog.json', '/catalog.json', '/.env', '/learn/not-a-workspace', '/learn/11111111-1111-4111-8111-111111111111/answers']:
        assert client.get(path).status_code == 404
    assert client.get('/app', headers={'host':'evil.example'}).status_code == 400
    assert client.get('/app').headers['cache-control'] == 'private, no-store'

# Actual receiving learner router plus explicit fixture identity/repository.
from types import SimpleNamespace
from app.config import BackendConfig
from app.dependencies import CurrentUser
from app.main import create_app
from app.repositories.account import AccountError
identity = CurrentUser('11111111-1111-4111-8111-111111111111','synthetic@example.invalid')
class Verifier:
    def verify(self,token):
        if token != 'synthetic-test-only': raise ValueError()
        return identity
class FixtureRepository:
    config = SimpleNamespace(environment='test',issuer='http://127.0.0.1/auth/v1')
    provider_enabled = False
    def binary(self,user,kind,workspace,asset_id):
        assert user == identity and kind == 'asset'
        if workspace != 'synthetic-owned-workspace':
            raise AccountError('not_found',404,'Unavailable')
        asset = catalog.asset(asset_id)
        return asset['path'].read_bytes(), asset['mediaType']
fixture = FixtureRepository()
configured = BackendConfig('http://127.0.0.1','local','synthetic-test-only',environment='test')
actual = create_app(configured,verifier=Verifier(),account_repository=fixture,learner_repository=fixture)
beta.attach_delivery(actual,public,{'beta.example','healthcheck.railway.app'},lambda:None)
http_media = 0
with TestClient(actual,base_url='https://beta.example') as client:
    for mime in ('image/png','audio/mpeg'):
        record = next(r for r in manifest['assets'] if r['mediaType'] == mime)
        path = '/api/learner/workspaces/synthetic-owned-workspace/assets/' + record['id']
        assert client.get(path).status_code == 401
        result = client.get(path,headers={'Authorization':'Bearer synthetic-test-only'})
        assert result.status_code == 200 and result.headers['content-type'] == mime
        assert len(result.content) == record['sizeBytes']
        assert result.headers['cache-control'] == 'private, no-store' and result.headers['vary'] == 'Authorization'
        denied = client.get(path.replace('synthetic-owned-workspace','other-workspace'),headers={'Authorization':'Bearer synthetic-test-only'})
        assert denied.status_code == 404
        http_media += 1

for mutation in ('missing','tampered'):
    with tempfile.TemporaryDirectory(prefix='learner-image-smoke-') as temporary:
        copied = Path(temporary) / 'catalogue'
        shutil.copytree(root, copied)
        for entry in [copied, *copied.rglob('*')]:
            entry.chmod(0o700 if entry.is_dir() else 0o600)
        asset = copied / manifest['assets'][0]['path']
        if mutation == 'missing': asset.unlink()
        else: asset.write_bytes(asset.read_bytes() + b'SYNTHETIC_TAMPER')
        try: LearnerCatalog(copied, catalog.catalog_hash)
        except ValueError: pass
        else: raise AssertionError('Invalid learner media admitted')
        connections = []
        class NoDatabase:
            def __init__(self,*args,**kwargs):
                connections.append(True)
                raise AssertionError('Database reached before catalogue denial')
        original_catalog, original_repository = beta.LearnerCatalog, beta.PostgresLearnerRepository
        beta.LearnerCatalog = lambda *args: LearnerCatalog(copied,catalog.catalog_hash)
        beta.PostgresLearnerRepository = NoDatabase
        origin = json.loads(Path('/srv/build-auth.json').read_bytes())['authUrl']
        values = dict(MITOONI_AUTH_URL=origin,MITOONI_AUTH_PROJECT=origin.removeprefix('https://').removesuffix('.supabase.co'),
            MITOONI_AUTH_SERVICE_KEY='synthetic-test-only',MITOONI_DB_HOST='db.synthetic-beta.supabase.co',
            MITOONI_DB_HOSTADDR='192.0.2.1',MITOONI_DB_NAME='postgres',MITOONI_DB_PORT='5432',
            MITOONI_DB_PASSWORD='synthetic-test-only',MITOONI_LEARNER_CATALOG_HASH=catalog.catalog_hash,MITOONI_BETA_HOST='beta.example')
        try:
            try: beta.create_beta(values)
            except beta.ConfigurationUnavailable: pass
            else: raise AssertionError('Invalid catalogue did not stop hosted startup')
            assert not connections
        finally:
            beta.LearnerCatalog, beta.PostgresLearnerRepository = original_catalog, original_repository

print(json.dumps({'catalogHash':catalog.catalog_hash,'tasks':len(manifest['tasks']),
    'assets':len(manifest['assets']),'uid':os.getuid(),'runtimeModulesImported':len(modules),
    'privateSourceStaticDenial':True,'fixtureAuthenticatedMediaTypes':http_media,'missingTamperedMediaDenied':True,'network':'disabled',
    'hostedAuthDatabaseProviderProven':False}))
