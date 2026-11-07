"""Real isolated PostgreSQL review authority and durability; explicit opt-in only."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
import pytest
import psycopg
from app.contracts.content_review import BoundMutation, DraftIn, ReviewIn
from app.dependencies import CurrentUser
from app.repositories.account import AccountError, LocalPostgresConfig
from app.repositories.postgres_content_review import PostgresContentReviewRepository
from app.services.content_review import ReviewPackage
from local.seed import admin_connection


def synthetic_package():
    unit=dict(id='synthetic-review',version=1,skill='reading',examTrack='academic',stage='train',pathwayIds=['fnd'],title='Synthetic',instructions='Read',stimulus={'kind':'passage','text':'Synthetic passage'},questions=[dict(id='synthetic-q',prompt='Choose',responseType='short_text',options=[],wordLimit=2)],assessment={'answerKey':'PRIVATE_SYNTHETIC'})
    return ReviewPackage(dict(manifest={'title':'Synthetic'},units={unit['id']:unit},companions={}), 'e'*64)

class SyntheticConfiguration:
    def load(self):return synthetic_package()

@pytest.fixture
def review_pg(request):
    if not request.config.getoption('--local-postgres'):
        pytest.skip('Explicit isolated PostgreSQL opt-in required')
    config=LocalPostgresConfig();u=CurrentUser(str(uuid4()));other=CurrentUser(str(uuid4()))
    with admin_connection() as c:
        c.execute((Path(__file__).resolve().parents[1]/'local/content-review-upgrade.sql').read_text())
        c.execute("INSERT INTO mitooni_app.content_review_assignments(product_id,issuer,subject_id,package_hash,status,permissions) VALUES('mitooni',%s,%s,%s,'active',ARRAY['review:use'])",(config.issuer,u.id,'e'*64))
    repo=PostgresContentReviewRepository(config,SyntheticConfiguration())
    yield repo,u,other
    with admin_connection() as c:
        for table in ['content_review_operations','content_review_states','content_review_assignments']:
            c.execute(f'DELETE FROM mitooni_app.{table} WHERE issuer=%s AND subject_id=%s',(config.issuer,u.id))


def bound(repo,user):
    snap=repo.call(user,'target',target='synthetic-review')
    return dict(packageHash=snap['packageHash'],targetHash=snap['targetHash'],expectedRevision=snap['revision'])


def mutation(repo,user,action,body,key=None):
    return repo.call(user,action,body,key or uuid4(),'synthetic-review')


def test_actual_pg_assignment_is_not_identity_or_learner_role(review_pg):
    r,u,other=review_pg
    assert r.call(u,'catalog')['targets'][0]['id']=='synthetic-review'
    with pytest.raises(AccountError) as e:r.call(other,'catalog')
    assert e.value.status==403
    with r._connect() as c:
        r._scope(c,u)
        assert c.execute('SELECT count(*) AS n FROM mitooni_app.content_review_assignments').fetchone()['n']==1
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with r._connect() as c:
            r._scope(c,u)
            c.execute("UPDATE mitooni_app.content_review_assignments SET status='active'")
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        with r._connect() as c:
            r._scope(c,u)
            c.execute("INSERT INTO mitooni_app.content_review_assignments(product_id,issuer,subject_id,package_hash,status,permissions) VALUES('mitooni',%s,%s,%s,'active',ARRAY['review:use'])",(r.config.issuer,u.id,'f'*64))


def test_actual_pg_blind_submission_reveal_review_replay_durability(review_pg):
    r,u,_=review_pg
    draft=DraftIn(**bound(r,u),answers=[dict(questionId='synthetic-q',text='Original answer')]);key=uuid4()
    first=mutation(r,u,'draft',draft,key)
    assert first==mutation(r,u,'draft',draft,key)
    assert first['privateContent'] is None
    with pytest.raises(AccountError) as e:mutation(r,u,'draft',DraftIn(**draft.model_dump()|{'answers':[]}),key)
    assert e.value.code=='idempotency_conflict'
    sub=mutation(r,u,'submit',BoundMutation(**bound(r,u)))
    reveal=mutation(r,u,'reveal',BoundMutation(**bound(r,u)))
    result=mutation(r,u,'review',ReviewIn(**bound(r,u),decision='changes_needed',comment='Clarify the prompt',itemComments=[dict(itemId='synthetic-q',decision='changes_needed',comment='Ambiguous')]))
    assert result['submission']==sub['submission'] and result['submission']['conditions']=='blind'
    assert result['revealedAt']==reveal['revealedAt']
    # New repository/connection, not an in-process state map.
    reopened=PostgresContentReviewRepository(r.config,SyntheticConfiguration())
    assert reopened.call(u,'target',target='synthetic-review')==result
    export=reopened.call(u,'export')
    assert export['learnerPublicationAuthorized'] is False
    assert export['records'][0]['targetHash']==result['targetHash']
    assert export['records'][0]['submission']['answers'][0]['text']=='Original answer'


def test_actual_pg_revocation_blocks_reads_exports_and_exact_replay(review_pg):
    r,u,_=review_pg;key=uuid4();body=BoundMutation(**bound(r,u))
    mutation(r,u,'reveal',body,key)
    with admin_connection() as c:c.execute("UPDATE mitooni_app.content_review_assignments SET status='revoked' WHERE issuer=%s AND subject_id=%s",(r.config.issuer,u.id))
    for action in ['catalog','export','target','reveal']:
        with pytest.raises(AccountError) as e:r.call(u,action,body,key,'synthetic-review')
        assert e.value.status==403


def test_actual_pg_cas_and_content_hash_conflict(review_pg):
    r,u,_=review_pg
    body=BoundMutation(**bound(r,u))
    def write():
        try:return mutation(r,u,'reveal',body)['revision']
        except AccountError as e:return e.code
    with ThreadPoolExecutor(max_workers=2) as ex:results=list(ex.map(lambda _:write(),range(2)))
    assert sorted(str(x) for x in results)==['1','review_conflict']
    with pytest.raises(AccountError) as e:mutation(r,u,'reveal',BoundMutation(**bound(r,u)|{'targetHash':'b'*64}))
    assert e.value.code=='content_changed'


def test_actual_pg_browser_has_no_review_table_grants(review_pg):
    r,u,_=review_pg
    with admin_connection() as c:
        for table in ['content_review_assignments','content_review_states','content_review_operations']:
            assert not c.execute("SELECT has_table_privilege('mitooni_browser',%s,'SELECT')",('mitooni_app.'+table,)).fetchone()[0]


def test_actual_pg_http_assets_recheck_assignment_and_hashes(review_pg,tmp_path,monkeypatch):
    """Actual route + receiving DB + real registry, synthetic PNG/MP3 files."""
    from fastapi.testclient import TestClient
    from app.config import BackendConfig
    from app.main import create_app
    from app.repositories.postgres_account import PostgresAccountRepository
    from app.services.content_review import ReviewPackageConfiguration
    from test_content_review_assets import media_package, url, png, MP3
    r,u,other=review_pg
    p,ph,_=media_package(tmp_path)
    with admin_connection() as c:
        c.execute('UPDATE mitooni_app.content_review_assignments SET package_hash=%s WHERE issuer=%s AND subject_id=%s',(ph,r.config.issuer,u.id))
    monkeypatch.setattr('app.services.content_review.load_package',lambda root:(p,ph))
    r.package_configuration=ReviewPackageConfiguration(tmp_path,ph)
    class Verifier:
        def verify(self,token):
            if token=='reviewer':return u
            if token=='other':return other
            raise ValueError()
    app=create_app(BackendConfig('http://127.0.0.1:54321','local','synthetic',environment='test'),verifier=Verifier(),account_repository=PostgresAccountRepository(r.config),content_review_repository=r)
    headers={'Authorization':'Bearer reviewer'}
    with TestClient(app) as client:
        for aid,payload in [('synthetic-image',png()),('synthetic-sound',MP3)]:
            response=client.get(url(ph,p,asset=aid),headers=headers)
            assert response.status_code==200 and response.content==payload
            assert response.headers['x-content-type-options']=='nosniff'
        assert client.get(url(ph,p),headers={'Authorization':'Bearer other'}).status_code==403
        assert client.get(url('f'*64,p),headers=headers).status_code==409
        assert client.get(url(ph,p,target='other-target'),headers=headers).status_code==404
        with admin_connection() as c:
            c.execute("UPDATE mitooni_app.content_review_assignments SET status='revoked' WHERE issuer=%s AND subject_id=%s",(r.config.issuer,u.id))
        response=client.get(url(ph,p),headers=headers)
        assert response.status_code==403 and response.headers['cache-control']=='private, no-store'
        assert response.headers['x-content-type-options']=='nosniff'


def test_actual_frozen_numeric_mock_save_submit_roundtrip(request):
    """Actual frozen content + existing local schema, disposable owner, no DDL."""
    if not request.config.getoption('--local-postgres'):
        pytest.skip('Explicit isolated PostgreSQL opt-in required')
    from app.services.content_review import ReviewPackageConfiguration
    h='85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095'
    root=Path(__file__).resolve().parents[3]/'review/content-20261106/editions'/h
    if not root.is_dir():pytest.skip('Exact local frozen edition is required')
    config=LocalPostgresConfig();user=CurrentUser(str(uuid4()))
    repository=PostgresContentReviewRepository(config,ReviewPackageConfiguration(root,h))
    with admin_connection() as c:
        c.execute("INSERT INTO mitooni_app.content_review_assignments(product_id,issuer,subject_id,package_hash,status,permissions) VALUES('mitooni',%s,%s,%s,'active',ARRAY['review:use'])",(config.issuer,user.id,h))
    try:
        for target in ['academic-01-listening','academic-01-reading','general-01-reading']:
            before=repository.call(user,'target',target=target)
            ids=[q['id'] for section in before['task']['sections'] for q in section['questions']]
            assert all(isinstance(q,str) for q in ids) and len(ids)==len(set(ids))
            binding=dict(packageHash=h,targetHash=before['targetHash'],expectedRevision=before['revision'])
            draft=DraftIn(**binding,answers=[dict(questionId=ids[0],text='Synthetic roundtrip response')])
            saved=repository.call(user,'draft',draft,uuid4(),target)
            submitted=repository.call(user,'submit',BoundMutation(**binding|{'expectedRevision':saved['revision']}),uuid4(),target)
            reopened=PostgresContentReviewRepository(config,ReviewPackageConfiguration(root,h)).call(user,'target',target=target)
            assert submitted['submission']==reopened['submission']
            assert reopened['submission']['answers']==[dict(questionId=ids[0],text='Synthetic roundtrip response')]
            assert reopened['privateContent'] is None and reopened['submission']['conditions']=='blind'
    finally:
        with admin_connection() as c:
            for table in ['content_review_operations','content_review_states','content_review_assignments']:
                c.execute(f'DELETE FROM mitooni_app.{table} WHERE issuer=%s AND subject_id=%s',(config.issuer,user.id))
