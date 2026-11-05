from types import SimpleNamespace
from uuid import uuid4
import httpx
import pytest
from fastapi.testclient import TestClient
from supabase_auth.errors import AuthApiError,AuthRetryableError
from app.config import BackendConfig
from app.dependencies import SupabaseIdentityVerifier,AuthenticationUnavailable,InvalidAuthentication
from app.main import create_app
from app.contracts.account import ProfileChanges,Onboarding
from pydantic import ValidationError
from app.repositories.account import LocalPostgresConfig
from app.repositories.postgres_account import PostgresAccountRepository
from local.fixtures import LocalSyntheticVerifier,SUBJECTS
from local.serve import create_local_app


@pytest.mark.parametrize('exception,expected',[
    (AuthApiError('synthetic invalid',401,None),InvalidAuthentication),
    (AuthApiError('synthetic rejected',400,'bad_jwt'),InvalidAuthentication),
    (AuthApiError('synthetic rate limit',429,None),AuthenticationUnavailable),
    (AuthApiError('synthetic bad configuration',400,None),AuthenticationUnavailable),
    (AuthApiError('synthetic server failure',500,None),AuthenticationUnavailable),
    (AuthRetryableError('synthetic outage',503),AuthenticationUnavailable),
    (httpx.ConnectError('synthetic outage'),AuthenticationUnavailable),
])
def test_sdk_rejection_and_unavailability_are_distinct(exception,expected):
    def reject(_token):raise exception
    wrapper=SimpleNamespace(get=lambda:SimpleNamespace(auth=SimpleNamespace(get_user=reject)))
    with pytest.raises(expected):SupabaseIdentityVerifier(wrapper).verify('synthetic')


@pytest.mark.parametrize('changes',[
    {},{'name':None},{'targets':{}},{'targets':{'overall':None}},
    {'notifications':{}},{'notifications':{'email':None}}, {'weeklyHours':True},
    {'email':'not-allowed'},{'targets':{'rogue':6.0}},
])
def test_strict_changes_reject_ambiguous_or_privileged_inputs(changes):
    with pytest.raises(ValidationError):ProfileChanges.model_validate(changes)


def test_expected_user_rejected_before_repository_call():
    class Repo:
        config=LocalPostgresConfig()
        def mutate(self,*args):raise AssertionError('must not touch repository')
    cfg=BackendConfig('http://127.0.0.1:54321','local','synthetic',environment='test')
    with TestClient(create_app(cfg,verifier=LocalSyntheticVerifier(),account_repository=Repo())) as c:
        r=c.patch('/api/profile',headers={'Authorization':'Bearer local-a','X-Expected-User-Id':SUBJECTS['b'],'Idempotency-Key':str(uuid4())},json={'expectedRevision':1,'changes':{'name':'x'}})
    assert r.status_code==409


def test_store_outage_is_safe_503(monkeypatch):
    import psycopg
    def failed(self):raise psycopg.OperationalError('sensitive provider connection details')
    monkeypatch.setattr(PostgresAccountRepository,'_connect',failed)
    with TestClient(create_local_app()) as c:
        r=c.get('/api/account',headers={'Authorization':'Bearer local-a'})
    assert r.status_code==503 and r.json()['detail']['code']=='store_unavailable'
    assert 'sensitive' not in r.text


def test_local_repo_or_verifier_cannot_be_enabled_in_production():
    config=BackendConfig('https://example.supabase.co','example','synthetic',environment='production')
    with pytest.raises(ValueError):create_app(config,account_repository=PostgresAccountRepository(LocalPostgresConfig()))
    with pytest.raises(ValueError):create_app(config,verifier=LocalSyntheticVerifier())
    with pytest.raises(ValueError):LocalPostgresConfig(environment='production')
    with pytest.raises(ValueError):LocalPostgresConfig(database='source')


def test_only_accepted_account_and_study_surface_with_fixture():
    paths={route.path for route in create_local_app().routes}
    assert paths=={'/health','/api/me','/api/account','/api/profile','/api/profile/onboarding',
        '/api/study/journey','/api/study/workspaces/resolve','/api/study/workspaces/{wid}',
        '/api/study/workspaces/{wid}/draft','/api/study/attempts/{aid}/submit',
        '/api/study/workspaces/{wid}/assistance','/api/study/workspaces/{wid}/attempts',
        '/api/study/workspaces/{wid}/turns','/api/study/turns/{tid}',
        '/api/study/turns/{tid}/cancel','/api/study/proposals/{pid}/accept'}


def test_sdk_construction_misconfiguration_does_not_force_logout():
    def failed():raise ValueError('invalid synthetic server configuration')
    with pytest.raises(AuthenticationUnavailable):
        SupabaseIdentityVerifier(SimpleNamespace(get=failed)).verify('synthetic')
