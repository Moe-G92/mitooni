import httpx
import pytest
from fastapi.testclient import TestClient
from supabase import ClientOptions
from app.config import BackendConfig
from app.db.read_retry_transport import RestReadRetryTransport, ServiceHttpClient
from app.dependencies import CurrentUser, SupabaseIdentityVerifier
from app.main import app, create_app


def local_config(**overrides):
    return BackendConfig(**({'supabase_url': 'http://127.0.0.1:54321', 'expected_project': 'local',
                             'service_key': 'synthetic-test-credential', 'environment': 'test'} | overrides))


class Verifier:
    def verify(self, token):
        if token != 'valid-synthetic':
            raise ValueError('provider failure containing sensitive input')
        return CurrentUser('synthetic-user-a', 'learner@example.invalid')


def client():
    return TestClient(create_app(local_config(), verifier=Verifier()))


def test_default_config_does_not_inherit_source_environment(monkeypatch):
    monkeypatch.setenv('SUPABASE_URL', 'https://source.invalid')
    monkeypatch.setenv('SUPABASE_SECRET_KEY', 'must-not-be-read')
    monkeypatch.setenv('LOCAL_AUTH_BYPASS', 'true')
    monkeypatch.setenv('INTERNAL_ADMIN_EMAILS', 'learner@example.invalid')
    with TestClient(app) as c:
        assert c.get('/health').json() == {'status': 'ok'}
        assert c.get('/api/me', headers={'Authorization': 'Bearer valid-synthetic'}).status_code == 503


@pytest.mark.parametrize('token', [None, '', 'Basic abc', 'Bearer ', 'Bearer invalid', 'Bearer expired'])
def test_missing_invalid_expired_auth(token):
    headers = {} if token is None else {'Authorization': token}
    r = client().get('/api/me', headers=headers)
    assert r.status_code == 401
    assert r.headers['www-authenticate'] == 'Bearer'
    assert set(r.json()) == {'detail'}
    assert 'sensitive' not in r.text


def test_verified_identity_ignores_spoofed_claims():
    r = client().get('/api/me?user_id=attacker&role=admin', headers={
        'Authorization': 'Bearer valid-synthetic', 'X-User-Id': 'attacker', 'X-Role': 'admin'})
    assert r.json() == {'id': 'synthetic-user-a', 'email': 'learner@example.invalid'}
    assert client().post('/api/me', json={'id': 'attacker'}).status_code == 405


def test_routes_only_and_no_external_startup(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError('Unexpected HTTP client send')
    monkeypatch.setattr(httpx.Client, 'send', forbidden)
    a = create_app(local_config())
    assert {(r.path, tuple(sorted(r.methods))) for r in a.routes} == {
        ('/health', ('GET',)), ('/api/me', ('GET',))}
    assert next(r.endpoint for r in a.routes if r.path == '/health')() == {'status': 'ok'}
    assert not a.state.identity_verifier.client._client


@pytest.mark.parametrize('changes', [
    {'supabase_url': 'https://source.supabase.co', 'expected_project': 'other', 'environment': 'production'},
    {'supabase_url': 'https://source.supabase.co', 'expected_project': 'source'},
    {'environment': 'production'}, {'expected_project': ''}, {'service_key': ''},
    {'workload': 'barex'}, {'supabase_url': 'http://127.0.0.1:54321/path'},
    {'supabase_url': 'http://secret@127.0.0.1:54321'},
])
def test_config_fails_closed(changes):
    with pytest.raises(ValueError):
        local_config(**changes)


def test_explicit_hosted_target_is_configurable_without_connection():
    config = BackendConfig('https://mitooni-example.supabase.co', 'mitooni-example',
                           'synthetic-server-only', environment='production')
    assert 'synthetic-server-only' not in repr(config)
    a = create_app(config)
    assert not a.state.identity_verifier.client._client
    with pytest.raises(ValueError):
        create_app(config, verifier=Verifier())
    with pytest.raises(ValueError):
        create_app(verifier=Verifier())


class DisconnectingTransport(httpx.BaseTransport):
    def __init__(self, failures):
        self.calls = 0
        self.failures = failures

    def handle_request(self, request):
        self.calls += 1
        if self.calls <= self.failures:
            raise httpx.RemoteProtocolError('synthetic disconnect')
        return httpx.Response(200, content=b'[]')


@pytest.mark.parametrize('method,path,body', [
    ('POST', '/rest/v1/items', b'{}'), ('PATCH', '/rest/v1/items', b'{}'),
    ('DELETE', '/rest/v1/items', b''), ('PUT', '/rest/v1/items', b'{}'),
    ('GET', '/rest/v1/rpc/action', b''), ('POST', '/rest/v1/rpc/action', b'{}'),
    ('GET', '/auth/v1/user', b''), ('GET', '/rest/v1/items', b'nonempty'),
])
def test_mutations_rpc_and_non_reads_never_retry(method, path, body):
    transport = DisconnectingTransport(2)
    with httpx.Client(transport=RestReadRetryTransport(transport)) as c:
        with pytest.raises(httpx.RemoteProtocolError):
            c.request(method, 'https://synthetic.invalid' + path, content=body)
    assert transport.calls == 1


@pytest.mark.parametrize('failures', [1, 2])
def test_read_retry_bounded(failures, monkeypatch):
    monkeypatch.setattr('app.db.read_retry_transport.time.sleep', lambda _: None)
    transport = DisconnectingTransport(failures)
    with httpx.Client(transport=RestReadRetryTransport(transport)) as c:
        if failures == 1:
            assert c.get('https://synthetic.invalid/rest/v1/items').status_code == 200
        else:
            with pytest.raises(httpx.RemoteProtocolError):
                c.get('https://synthetic.invalid/rest/v1/items')
    assert transport.calls == 2


def test_service_timeout_retention():
    options = ClientOptions(postgrest_client_timeout=17, storage_client_timeout=23, function_client_timeout=29)
    with ServiceHttpClient(options, transport=httpx.MockTransport(lambda _: httpx.Response(200))) as c:
        for path, expected in [('/rest/v1/items', 17), ('/storage/v1/object', 23), ('/functions/v1/task', 29)]:
            assert c.build_request('GET', 'https://synthetic.invalid' + path).extensions['timeout']['read'] == expected
        assert c.build_request('GET', 'https://synthetic.invalid/rest/v1/items', timeout=7).extensions['timeout']['read'] == 7


def test_sdk_verifier_uses_provider_verified_identity():
    class Auth:
        def get_user(self, token):
            assert token == 'synthetic'
            from types import SimpleNamespace
            return SimpleNamespace(user=SimpleNamespace(id='verified', email=None))
    class FakeClient:
        def get(self):
            from types import SimpleNamespace
            return SimpleNamespace(auth=Auth())
    assert SupabaseIdentityVerifier(FakeClient()).verify('synthetic') == CurrentUser('verified')


@pytest.mark.parametrize('scheme', ['Bearer', 'bearer', 'BEARER', 'bEaReR'])
def test_bearer_scheme_is_case_insensitive(scheme):
    r = client().get('/api/me', headers={'Authorization': f'{scheme} valid-synthetic'})
    assert r.status_code == 200


@pytest.mark.parametrize('mode,status', [('valid', 200), ('invalid', 401), ('missing', 401), ('unconfigured', 503)])
def test_identity_and_auth_errors_are_private_no_store(mode, status):
    c = TestClient(create_app()) if mode == 'unconfigured' else client()
    headers = {'Authorization': f'Bearer {"valid-synthetic" if mode == "valid" else "invalid"}'} if mode != 'missing' else {}
    r = c.get('/api/me', headers=headers)
    assert r.status_code == status
    assert r.headers['cache-control'] == 'private, no-store'


def install_fake_sdk(monkeypatch, *, fail_first=False, entered=None, release=None):
    from types import SimpleNamespace
    import app.db.supabase_client as module
    transports = []
    clients = []

    class HTTP:
        def __init__(self, _options):
            self.close_count = 0
            transports.append(self)
        def close(self):
            self.close_count += 1

    def construct(_url, _key, *, options):
        assert options.httpx_client is transports[-1]
        if entered is not None:
            entered.set()
            assert release.wait(5), 'test construction release timed out'
        if fail_first and len(transports) == 1:
            raise RuntimeError('synthetic constructor failure')
        result = SimpleNamespace(auth=SimpleNamespace(get_user=lambda _: SimpleNamespace(
            user=SimpleNamespace(id='verified-synthetic', email=None))))
        clients.append(result)
        return result

    monkeypatch.setattr(module, 'ServiceHttpClient', HTTP)
    monkeypatch.setattr(module, 'create_client', construct)
    return transports, clients


def test_concurrent_lazy_get_constructs_one_sdk_and_transport(monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier, Event
    from app.db.supabase_client import TargetSupabaseClient
    entered, release = Event(), Event()
    transports, clients = install_fake_sdk(monkeypatch, entered=entered, release=release)
    target = TargetSupabaseClient(local_config())
    barrier = Barrier(8)
    def get():
        barrier.wait(timeout=5)
        return target.get()
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(get) for _ in range(8)]
        assert entered.wait(5)
        release.set()
        results = [f.result(timeout=5) for f in futures]
    assert len(transports) == len(clients) == 1
    assert all(result is clients[0] for result in results)
    target.close()
    assert transports[0].close_count == 1


def test_failed_initialization_closes_transport_and_retries_fresh(monkeypatch):
    from app.db.supabase_client import TargetSupabaseClient
    transports, clients = install_fake_sdk(monkeypatch, fail_first=True)
    target = TargetSupabaseClient(local_config())
    with pytest.raises(RuntimeError, match='synthetic constructor failure'):
        target.get()
    assert transports[0].close_count == 1
    assert target._client is target._http is None
    assert target.get() is clients[0]
    assert len(transports) == 2
    target.close()
    target.close()
    assert [t.close_count for t in transports] == [1, 1]
    assert target._client is target._http is None


def test_close_waits_for_initialization_then_resets(monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event
    from app.db.supabase_client import TargetSupabaseClient
    entered, release = Event(), Event()
    transports, clients = install_fake_sdk(monkeypatch, entered=entered, release=release)
    target = TargetSupabaseClient(local_config())
    with ThreadPoolExecutor(max_workers=2) as pool:
        constructing = pool.submit(target.get)
        assert entered.wait(5)
        closing = pool.submit(target.close)
        release.set()
        assert constructing.result(timeout=5) is clients[0]
        closing.result(timeout=5)
    assert target._client is target._http is None
    assert transports[0].close_count == 1


def test_repeated_application_lifespan_recreates_closed_client(monkeypatch):
    transports, clients = install_fake_sdk(monkeypatch)
    a = create_app(local_config())
    for _ in range(2):
        with TestClient(a) as c:
            assert c.get('/api/me', headers={'Authorization': 'Bearer synthetic'}).json() == {
                'id': 'verified-synthetic', 'email': None}
    assert len(clients) == 2
    assert [t.close_count for t in transports] == [1, 1]
