"""Actual isolated PostgreSQL candidate state checks with original synthetic tasks.

No original learner/recording/provider service or old preview is accessed.
"""
from copy import deepcopy
from datetime import datetime,timezone,timedelta
from types import SimpleNamespace
from uuid import uuid4
import json
import pytest
from psycopg.types.json import Jsonb
from app.dependencies import CurrentUser
from app.repositories.postgres_learner import PostgresLearnerRepository
from app.repositories.account import AccountError
from app.services import learner_policy as p
from local.learner_setup import CONFIG,admin_connection

class SyntheticCatalog:
    def __init__(self):
        self.catalog_hash=p.digest({'synthetic':str(uuid4())});self.items={}
        for track in ('academic','general_training'):
            for skill in p.SKILLS:
                for role in ('train','transfer','mock'):
                    id=f'{track}-{skill}-{role}';qkind='spoken_response'if skill=='speaking'else'extended_text'if skill=='writing'else'short_text'
                    task={'id':id,'title':'Synthetic '+skill,'skill':skill,'examTrack':track,'kind':{'reading':'reading_items','listening':'listening_items','writing':'task2','speaking':'speaking_turn'}[skill],'sections':[{'id':'one','title':'One','text':'The synthetic train leaves at noon.','instructions':'Answer this question.','questions':[{'id':'q1','prompt':'When does the train leave?','responseType':qkind,'options':[],'wordLimit':None,'minimumWords':None}], 'table':None,'assetIds':[]}],'assets':[],'teachingAnchors':[{'id':'a1','label':'Reading details','text':'Find the time stated in the passage.'}],'objectiveIds':[skill+'-details']}
                    meta={'id':id,'title':task['title'],'skill':skill,'examTrack':track,'branch':'foundation','role':role,'version':1,'contentHash':p.digest(task),'catalogHash':self.catalog_hash,'familyId':id,'semanticExposureGroupIds':[id],'unseenEligible':True,'objectiveIds':task['objectiveIds'],'estimatedMinutes':1,'durationSeconds':60,'available':True}
                    assessment={'kind':'qualitative'if skill in ('writing','speaking')else'deterministic','answerKey':[]if skill in ('writing','speaking')else[{'questionId':'q1','acceptedAnswers':['noon'],'rationale':'It is stated.'}],'criteria':[{'id':'detail','label':'Detail','description':'Use relevant evidence.'}],'feedbackGuidance':'Specific qualitative feedback; no scores.'}
                    self.items[id]={'task':task,'meta':meta,'assessment':assessment}
    def list_tasks(self,track=None,branch=None,role=None):return [deepcopy(r['meta'])for r in self.items.values()if(not track or r['meta']['examTrack']==track)and(not role or r['meta']['role']==role)]
    def metadata(self,id):return deepcopy(self.items[id]['meta'])
    def get_task(self,id):return deepcopy(self.items[id]['task'])
    def assessment(self,id):return deepcopy(self.items[id]['assessment'])

def seed(catalog,*,provider=False,clock=None,cap=10000000,concurrency=2):
    user=CurrentUser(str(uuid4()));policy='synthetic-'+str(uuid4())
    data={'enabled':True,'currency':'USD','pricingRevision':'synthetic-2026-11-07','capMicros':cap,'ownerCapMicros':cap,'maxConcurrent':concurrency,'models':{'text':'gpt-6.1-sol','audio':'gpt-audio-mini-2025-12-15'},'reservationMicros':{'text':3718000,'speaking':1299661},'rates':{'text':{'inputMicrosPerToken':4,'outputMicrosPerToken':15},'speaking':{'inputMicrosPerToken':10,'outputMicrosPerToken':2.4}}}
    with admin_connection()as c:
        c.execute("INSERT INTO mitooni_app.memberships(product_id,issuer,subject_id,status,roles,entitlements)VALUES('mitooni',%s,%s,'active','{learner}','{learner:use,learner:tutor,profile:write}')",(CONFIG.issuer,user.id))
        c.execute('INSERT INTO mitooni_app.learner_publications(catalog_hash,data)VALUES(%s,%s)ON CONFLICT(catalog_hash)DO NOTHING',(catalog.catalog_hash,Jsonb({'status':'approved','allowedUses':['learner_delivery','model_context'],'withdrawnTaskIds':[]})))
        if provider:
            c.execute('INSERT INTO mitooni_app.provider_budget_policies(id,data)VALUES(%s,%s)',(policy,Jsonb(data)));c.execute('INSERT INTO mitooni_app.provider_usage_totals(policy_id)VALUES(%s)',(policy,))
    repo=PostgresLearnerRepository(CONFIG,catalog,provider_enabled=provider,budget_policy_id=policy if provider else None,clock=clock)
    if provider:repo.validate_budget_policy()
    return repo,user,policy

def mutation(repo,user,action,body=None,target=None,key=None):return repo.call(user,action,body or{},key or str(uuid4()),target)
def preferences(repo,user,track='academic'):
    return mutation(repo,user,'preferences',{'expectedRevision':0,'examTrack':track,'weeklyHours':5,'testDate':None,'targets':{k:6.5 for k in ('overall',*p.SKILLS)},'selfReportedLevel':3.0,'locale':'en'})
def workspace(repo,user,skill='reading',mode='supported'):
    boot=repo.call(user,'bootstrap')
    if not boot['preferences']:preferences(repo,user)
    boot=repo.call(user,'bootstrap');plan=mutation(repo,user,'plan_create',{'expectedPreferencesRevision':boot['preferencesRevision'],'expectedEvidenceRevision':boot['evidenceRevision']});step=next(s for s in plan['steps']if s['skill']==skill and s['kind']!='transfer')
    return mutation(repo,user,'resolve',{'planId':plan['id'],'planVersion':plan['version'],'stepId':step['id'],'conditionPreset':mode})
def submit(repo,user,w):return mutation(repo,user,'submit',{'expectedWorkspaceRevision':w['revision'],'expectedDraftRevision':w['draft']['revision'],'expectedConditionsRevision':w['attempt']['conditions']['revision']},w['attempt']['id'])
def job(repo,user,w):return mutation(repo,user,'turn',{'expectedWorkspaceRevision':w['revision'],'workRef':{'kind':'draft','id':w['id'],'revision':w['draft']['revision']},'intent':'explain','message':'Teach one idea.'},w['id'])

@pytest.fixture(autouse=True)
def require_owned_postgres(request):
    if not request.config.getoption('--local-postgres'):
        pytest.skip('Explicit isolated learner PostgreSQL on55440 required')

@pytest.fixture
def catalogue():return SyntheticCatalog()

def test_real_database_submission_replay_privacy_and_new_repository(catalogue):
    repo,user,_=seed(catalogue);w=workspace(repo,user);key=str(uuid4());body={'expectedDraftRevision':1,'responses':[{'itemId':'q1','kind':'short_text','value':'noon'}]}
    saved=mutation(repo,user,'draft',body,w['id'],key);assert mutation(repo,user,'draft',body,w['id'],key)==saved
    frozen=submit(repo,user,saved);assert frozen['rawCheck']['correctCount']==1;assert '_assessment'not in frozen and 'feedbackGuidance'not in json.dumps(frozen);assert frozen['answerReview']['items'][0]['acceptedAnswers']==['noon']
    restarted=PostgresLearnerRepository(CONFIG,catalogue);assert restarted.call(user,'workspace',target=w['id'])['attempt']['responseHash']==frozen['attempt']['responseHash']
    _,other,_=seed(catalogue)
    with pytest.raises(AccountError)as error:restarted.call(other,'workspace',target=w['id'])
    assert error.value.status==404
    with admin_connection()as c:
        with pytest.raises(Exception):c.execute("UPDATE mitooni_app.learner_attempts SET data='{}' WHERE subject_id=%s AND id=%s",(user.id,w['attempt']['id']))

def test_server_clock_mock_embargo_and_revision(catalogue):
    clock=[datetime(2026,11,7,tzinfo=timezone.utc)];repo,user,_=seed(catalogue,clock=lambda:clock[0]);preferences(repo,user)
    session=mutation(repo,user,'session_create',{'mockId':'academic','mockVersion':1});session=mutation(repo,user,'session_start',{'expectedRevision':session['revision']},session['id']);section=session['sections'][0];w=repo.call(user,'workspace',target=section['workspaceId'])
    clock[0]+=timedelta(seconds=61);frozen=repo.call(user,'workspace',target=w['id']);assert frozen['rawCheck']is None
    with pytest.raises(AccountError)as err:mutation(repo,user,'revise',{'expectedWorkspaceRevision':frozen['revision']},frozen['attempt']['id'])
    assert err.value.code=='assessment_not_complete'
    session=repo.call(user,'session',target=session['id']);session=mutation(repo,user,'session_start',{'expectedRevision':session['revision']},session['id']);wid=session['sections'][1]['workspaceId'];clock[0]+=timedelta(seconds=61);expired=repo.call(user,'workspace',target=wid);assert expired['attempt']['status']=='expired'

def test_global_budget_unknown_and_actual_usage(catalogue):
    repo,user,policy=seed(catalogue,provider=True);w=workspace(repo,user);j=job(repo,user,w);claim=repo.worker(user,j['id'],'claim');assert claim['payload']['work']['ref']['revision']==1
    repo.worker(user,j['id'],'dispatch',fence=claim['fence'])
    output={'kind':'question','text':'Find the stated time.','citations':[{'anchorId':'a1'}],'workSpans':[],'observations':[],'proposal':None}
    repo.worker(user,j['id'],'complete',fence=claim['fence'],result=SimpleNamespace(candidate=output,model='gpt-6.1-sol',response_id='synthetic1',usage={'inputTokens':100,'outputTokens':10}))
    with admin_connection()as c:
        row=c.execute('SELECT reserved_micros,settled_micros,active_jobs FROM mitooni_app.provider_usage_totals WHERE policy_id=%s',(policy,)).fetchone();assert row==(0,550,0)
    w=repo.call(user,'workspace',target=w['id']);j2=job(repo,user,w);claim2=repo.worker(user,j2['id'],'claim');repo.worker(user,j2['id'],'dispatch',fence=claim2['fence']);repo.worker(user,j2['id'],'fail',fence=claim2['fence'],error=SimpleNamespace(code='dispatch_unknown',usage=None))
    with admin_connection()as c:
        row=c.execute('SELECT reserved_micros,active_jobs FROM mitooni_app.provider_usage_totals WHERE policy_id=%s',(policy,)).fetchone();assert row==(3718000,1)

def test_live_publication_withdrawal_blocks_replay_and_preserves_only_work(catalogue):
    repo,user,_=seed(catalogue);w=workspace(repo,user);key=str(uuid4());body={'expectedDraftRevision':1,'responses':[{'itemId':'q1','kind':'short_text','value':'saved learner response'}]};mutation(repo,user,'draft',body,w['id'],key)
    with admin_connection()as c:c.execute("UPDATE mitooni_app.learner_publications SET data=jsonb_set(data,'{status}','\"withdrawn\"')WHERE catalog_hash=%s",(catalogue.catalog_hash,))
    recovered=repo.call(user,'workspace',target=w['id']);assert recovered['draft']['responses'][0]['value']=='saved learner response';assert not recovered['task']['sections']and not recovered['messages']
    with pytest.raises(AccountError)as error:mutation(repo,user,'draft',body,w['id'],key)
    assert error.value.code=='content_withdrawn'

def test_audio_over_one_megabyte_and_json_boundary(catalogue):
    import io,wave
    from fastapi.testclient import TestClient
    from app.config import BackendConfig
    from app.main import create_app
    from app.repositories.postgres_account import PostgresAccountRepository
    repo,user,_=seed(catalogue);w=workspace(repo,user,'speaking');stream=io.BytesIO()
    with wave.open(stream,'wb')as audio:audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(24000);audio.writeframes(b'\x00\x00'*600000)
    class Verifier:
        def verify(self,_):return user
    config=BackendConfig('http://127.0.0.1:54321','local','synthetic-no-provider-key',environment='test')
    app=create_app(config,verifier=Verifier(),account_repository=PostgresAccountRepository(CONFIG),learner_repository=repo)
    headers={'Authorization':'Bearer synthetic','X-Expected-User-Id':user.id,'Idempotency-Key':str(uuid4()),'Content-Type':'audio/wav'}
    with TestClient(app)as client:
        response=client.post(f"/api/learner/attempts/{w['attempt']['id']}/recordings?itemId=q1&expectedDraftRevision=1",content=stream.getvalue(),headers=headers)
        assert response.status_code==201,response.text
        rid=response.json()['id'];played=client.get('/api/learner/recordings/'+rid+'/audio',headers={'Authorization':'Bearer synthetic'});assert played.content==stream.getvalue()
        too_big=client.patch('/api/learner/preferences',content=b' '*600000,headers=headers|{'Content-Type':'application/json'});assert too_big.status_code==413

def test_missing_pre_snapshot_edition_recovers_owned_result_without_regrading(catalogue):
    repo,user,_=seed(catalogue);w=workspace(repo,user);w=mutation(repo,user,'draft',{'expectedDraftRevision':1,'responses':[{'itemId':'q1','kind':'short_text','value':'noon'}]},w['id']);frozen=submit(repo,user,w)
    # Model the pre-freeze synthetic fixture only: its private source file was
    # replaced before snapshots existed. Never repin/regrade that old attempt.
    old_hash=p.digest({'old-fixture':str(uuid4())})
    with admin_connection()as c:
        row=c.execute('SELECT data FROM mitooni_app.learner_workspaces WHERE subject_id=%s AND id=%s',(user.id,w['id'])).fetchone()[0]
        row={k:v for k,v in row.items()if not k.startswith('_')};row['contentRef']['catalogHash']=old_hash
        c.execute('UPDATE mitooni_app.learner_workspaces SET data=%s WHERE subject_id=%s AND id=%s',(Jsonb(row),user.id,w['id']))
        c.execute('INSERT INTO mitooni_app.learner_publications(catalog_hash,data)VALUES(%s,%s)',(old_hash,Jsonb({'status':'approved','allowedUses':['learner_delivery'],'withdrawnTaskIds':[]})))
    recovered=repo.call(user,'workspace',target=w['id']);assert recovered['rawCheck']==frozen['rawCheck'];assert recovered['attempt']['responseHash']==frozen['attempt']['responseHash'];assert not recovered['task']['sections']and not recovered['capabilities']

def test_mock_listening_once_only_marker_resumes_from_server_clock(catalogue):
    from pathlib import Path
    import tempfile,io,wave
    from hashlib import sha256
    stream=io.BytesIO()
    with wave.open(stream,'wb')as audio:audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(24000);audio.writeframes(b'\x00\x00'*24000)
    data=stream.getvalue();path=Path(tempfile.mkdtemp())/'synthetic.wav';path.write_bytes(data)
    for record in catalogue.items.values():
        if record['meta']['skill']=='listening':
            record['task']['assets']=[{'id':'sound1','sha256':sha256(data).hexdigest(),'mediaType':'audio/wav','durationSeconds':1.0}];record['task']['sections'][0]['assetIds']=['sound1'];record['meta']['contentHash']=p.digest(record['task'])
    catalogue.asset=lambda _: {'path':path,'sha256':sha256(data).hexdigest(),'mediaType':'audio/wav'}
    clock=[datetime(2026,11,7,tzinfo=timezone.utc)];repo,user,_=seed(catalogue,clock=lambda:clock[0]);preferences(repo,user);session=mutation(repo,user,'session_create',{'mockId':'academic','mockVersion':1});session=mutation(repo,user,'session_start',{'expectedRevision':session['revision']},session['id']);w=repo.call(user,'workspace',target=session['sections'][0]['workspaceId']);deadline=w['attempt']['deadlineAt'];assert w['task']['skill']=='listening' and w['playbackPolicy']=='one_pass'and w['listeningPlayback']is None
    key=str(uuid4());body={'expectedWorkspaceRevision':w['revision']};started=mutation(repo,user,'playback_start',body,w['id'],key);marker=started['listeningPlayback'];assert marker['orderedAssetIds']==['sound1'];assert mutation(repo,user,'playback_start',body,w['id'],key)['listeningPlayback']['nonce']==marker['nonce']
    clock[0]+=timedelta(seconds=15);reloaded=repo.call(user,'workspace',target=w['id']);assert reloaded['listeningPlayback']['elapsedSeconds']==15;assert reloaded['attempt']['deadlineAt']==deadline
    second=mutation(repo,user,'playback_start',{'expectedWorkspaceRevision':reloaded['revision']},w['id']);assert second['listeningPlayback']['startedAt']==marker['startedAt']and second['listeningPlayback']['nonce']==marker['nonce']

def test_baseline_section_immediately_marks_and_accepts_feedback_before_other_skills(catalogue):
    repo,user,_=seed(catalogue,provider=True);preferences(repo,user);session=mutation(repo,user,'baseline_create',{'expectedPreferencesRevision':1});session=mutation(repo,user,'session_start',{'expectedRevision':session['revision']},session['id']);w=repo.call(user,'workspace',target=session['sections'][0]['workspaceId']);w=mutation(repo,user,'draft',{'expectedDraftRevision':1,'responses':[{'itemId':'q1','kind':'short_text','value':'noon'}]},w['id']);w=submit(repo,user,w)
    assert w['rawCheck']['correctCount']==1 and 'tutor:use'in w['capabilities'];assert repo.call(user,'session',target=session['id'])['status']=='running'
    feedback=mutation(repo,user,'feedback',{'expectedWorkspaceRevision':w['revision']},w['attempt']['id']);assert feedback['status']=='queued'
    # No provider worker or dispatch: this checks early eligibility, not fake AI.

def test_authoritative_answer_review_pre_post_baseline_productive_and_withdrawal(catalogue):
    # Source annotations outside the explicit public key/rationale fields never escape.
    record=catalogue.items['academic-reading-train'];record['assessment']['privateScript']='PRIVATE-CANARY';record['assessment']['answerKey'][0]['sourceMapping']='PRIVATE-CANARY'
    repo,user,_=seed(catalogue);preferences(repo,user);session=mutation(repo,user,'baseline_create',{'expectedPreferencesRevision':1});session=mutation(repo,user,'session_start',{'expectedRevision':session['revision']},session['id']);w=repo.call(user,'workspace',target=session['sections'][0]['workspaceId']);assert w['answerReview']is None
    key=str(uuid4());body={'expectedWorkspaceRevision':w['revision'],'expectedDraftRevision':w['draft']['revision'],'expectedConditionsRevision':1};frozen=mutation(repo,user,'submit',body,w['attempt']['id'],key)
    expected={'actorKind':'authoritative_answer_key','items':[{'itemId':'q1','acceptedAnswers':['noon'],'rationale':'It is stated.'}],'answerGroups':[]};assert frozen['answerReview']==expected;assert 'PRIVATE-CANARY'not in json.dumps(frozen)
    assert repo.call(user,'result',target=w['attempt']['id'])['answerReview']==expected
    with admin_connection()as c:
        count=c.execute("SELECT count(*)FROM mitooni_app.learner_evidence WHERE subject_id=%s AND data->>'kind'='answer_reveal'",(user.id,)).fetchone()[0];assert count==1
        c.execute("UPDATE mitooni_app.learner_publications SET data=jsonb_set(data,'{status}','\"withdrawn\"')WHERE catalog_hash=%s",(catalogue.catalog_hash,))
    assert repo.call(user,'workspace',target=w['id'])['answerReview']is None
    with pytest.raises(AccountError):mutation(repo,user,'submit',body,w['attempt']['id'],key)
    # Qualitative writing has no authoritative right-answer bank.
    other_catalogue=SyntheticCatalog();other,writer,_=seed(other_catalogue);writing=workspace(other,writer,'writing');assert submit(other,writer,writing)['answerReview']is None


def test_active_mock_family_blocks_old_answer_review_and_operation_replay(catalogue):
    # Make train/mock deliberately share the same semantic question family.
    for record in catalogue.items.values():
        if record['meta']['skill']=='reading':record['meta']['semanticExposureGroupIds']=['shared-reading-family']
    clock=[datetime(2026,11,7,tzinfo=timezone.utc)];repo,user,_=seed(catalogue,clock=lambda:clock[0]);w=workspace(repo,user);key=str(uuid4());body={'expectedWorkspaceRevision':w['revision'],'expectedDraftRevision':1,'expectedConditionsRevision':1};frozen=mutation(repo,user,'submit',body,w['attempt']['id'],key);assert frozen['answerReview']is not None
    session=mutation(repo,user,'session_create',{'mockId':'academic','mockVersion':1});assert repo.call(user,'workspace',target=w['id'])['answerReview']is None
    assert mutation(repo,user,'submit',body,w['attempt']['id'],key)['answerReview']is None
    assert repo.call(user,'result',target=w['attempt']['id'])['answerReview']is None
    # Marking can occur, but keys are withheld through the whole mock.
    session=mutation(repo,user,'session_start',{'expectedRevision':session['revision']},session['id']);clock[0]+=timedelta(seconds=61);mock=repo.call(user,'workspace',target=session['sections'][0]['workspaceId']);assert mock['attempt']['status']=='expired' and mock['answerReview']is None
    with admin_connection()as c:
        row=c.execute('SELECT data FROM mitooni_app.learner_sessions WHERE subject_id=%s AND id=%s',(user.id,session['id'])).fetchone()[0];row['status']='completed';c.execute('UPDATE mitooni_app.learner_sessions SET data=%s WHERE subject_id=%s AND id=%s',(Jsonb(row),user.id,session['id']))
    assert repo.call(user,'workspace',target=mock['id'])['answerReview']['items'][0]['acceptedAnswers']==['noon']


def test_answer_review_preserves_structured_alternatives_and_explicit_groups(catalogue):
    record=catalogue.items['academic-reading-train'];record['assessment']['answerKey'][0].update(acceptedAnswers=[['B','D'],{'left':'right'}],rationale=None);record['assessment']['answerGroups']=[{'questionIds':['q1'],'acceptedAnswers':['B','D'],'orderIndependent':True,'distinct':True,'sourceMapping':'NEVER-PUBLIC'}]
    repo,user,_=seed(catalogue);w=workspace(repo,user);review=submit(repo,user,w)['answerReview'];assert review['items'][0]['acceptedAnswers']==[['B','D'],{'left':'right'}];assert review['items'][0]['rationale']is None;assert review['answerGroups']==[{'questionIds':['q1'],'acceptedAnswers':['B','D'],'orderIndependent':True,'distinct':True}];assert 'NEVER-PUBLIC'not in json.dumps(review)

def test_answer_review_uses_pinned_edition_when_current_catalogue_removes_task(catalogue):
    repo,user,_=seed(catalogue);w=workspace(repo,user);key=str(uuid4());body={'expectedWorkspaceRevision':w['revision'],'expectedDraftRevision':w['draft']['revision'],'expectedConditionsRevision':1};w=mutation(repo,user,'submit',body,w['attempt']['id'],key);expected=w['answerReview'];del catalogue.items[w['taskId']]
    # The still-published immutable workspace snapshot owns its original key,
    # public task and semantic family, not the replacement catalogue listing.
    assert repo.call(user,'workspace',target=w['id'])['answerReview']==expected
    assert mutation(repo,user,'submit',body,w['attempt']['id'],key)['answerReview']==expected


def test_answer_review_family_embargo_uses_pinned_session_metadata(catalogue):
    for record in catalogue.items.values():
        if record['meta']['skill']=='reading':record['meta']['semanticExposureGroupIds']=['original-family']
    repo,user,_=seed(catalogue);w=workspace(repo,user);w=submit(repo,user,w);session=mutation(repo,user,'session_create',{'mockId':'academic','mockVersion':1});assert '_sectionMetadata'not in session
    # New catalogue metadata must not erase the existing mock's family embargo.
    catalogue.items['academic-reading-mock']['meta']['semanticExposureGroupIds']=['new-edition-family']
    assert repo.call(user,'workspace',target=w['id'])['answerReview']is None

def test_answer_review_matches_actual_admitted_source_keys_exactly():
    from pathlib import Path
    from app.services.learner_content import LearnerCatalog
    root=Path(__file__).resolve().parents[3]/'review/learner-mvp-20261107/catalog'
    if not root.is_dir():pytest.skip('Private admitted source catalogue is not part of ordinary test assets')
    catalog=LearnerCatalog(root);repo,user,_=seed(catalog);w=workspace(repo,user);source=catalog.assessment(w['taskId']);assert w['answerReview']is None
    reviewed=submit(repo,user,w)['answerReview'];assert reviewed['items']==[{'itemId':key['questionId'],'acceptedAnswers':key['acceptedAnswers'],'rationale':key.get('rationale')or None}for key in source['answerKey']]
    assert set(reviewed)=={'actorKind','items','answerGroups'}

def test_answer_review_never_publishes_a_productive_model_answer_even_if_misclassified(catalogue):
    for skill in ('writing','speaking'):
        record=catalogue.items['academic-'+skill+'-train'];record['assessment'].update(kind='deterministic',answerKey=[{'questionId':'q1','acceptedAnswers':['PRODUCTIVE-MODEL-ANSWER'],'rationale':'Never a unique right answer.'}])
    repo,user,_=seed(catalogue)
    for skill in ('writing','speaking'):
        w=workspace(repo,user,skill);result=submit(repo,user,w);assert result['answerReview']is None;assert 'PRODUCTIVE-MODEL-ANSWER'not in json.dumps(result)

def test_preferences_atomically_replan_track_time_goals_without_rewriting_completed_work(catalogue):
    repo,user,_=seed(catalogue);w=workspace(repo,user);w=mutation(repo,user,'draft',{'expectedDraftRevision':1,'responses':[{'itemId':'q1','kind':'short_text','value':'noon'}]},w['id']);completed=submit(repo,user,w);before=repo.call(user,'bootstrap');old=deepcopy(before['activePlan'])
    changed=mutation(repo,user,'preferences',{'expectedRevision':before['preferencesRevision'],'examTrack':'general_training','weeklyHours':0,'testDate':'2026-12-01','targets':{k:7.5 for k in ('overall',*p.SKILLS)},'selfReportedLevel':3.0,'locale':'en'})
    after=repo.call(user,'bootstrap');new=after['activePlan'];assert changed==after['preferences'];assert new['id']!=old['id']and new['version']==old['version']+1;assert new['preferencesRevision']==changed['revision'];assert new['evidenceRevision']==before['evidenceRevision']==after['evidenceRevision'];assert new['weeklyCapacityMinutes']==0
    assert all(step['taskId'].startswith('general_training-')for step in new['steps']);assert any(step['state']=='available'for step in new['steps']);assert not any(step['scheduled']for step in new['steps'])
    history=repo.call(user,'plans')['plans'];assert len(history)==2 and history[0]==old
    retained=repo.call(user,'workspace',target=w['id']);assert retained['attempt']==completed['attempt'];assert retained['contentRef']==completed['contentRef'];assert retained['rawCheck']==completed['rawCheck']


def test_preferences_replan_failure_rolls_back_then_exact_retry_commits_once(catalogue,monkeypatch):
    repo,user,_=seed(catalogue);workspace(repo,user);before=repo.call(user,'bootstrap');body=deepcopy(before['preferences']);body.pop('revision');body['expectedRevision']=before['preferencesRevision'];body['weeklyHours']=12;key=str(uuid4());original=repo._put
    def fail_plan_insert(c,o,kind,data,insert=False,extra=None):
        if kind=='plans':raise AccountError('store_unavailable',503,'Synthetic transaction failure')
        return original(c,o,kind,data,insert,extra)
    with monkeypatch.context()as patch:
        patch.setattr(repo,'_put',fail_plan_insert)
        with pytest.raises(AccountError):mutation(repo,user,'preferences',body,key=key)
    failed=repo.call(user,'bootstrap');assert failed['preferences']==before['preferences'];assert failed['activePlan']==before['activePlan'];assert len(repo.call(user,'plans')['plans'])==1
    with admin_connection()as c:assert c.execute('SELECT count(*)FROM mitooni_app.learner_operations WHERE subject_id=%s AND operation_id=%s',(user.id,key)).fetchone()[0]==0
    result=mutation(repo,user,'preferences',body,key=key);assert mutation(repo,user,'preferences',body,key=key)==result;after=repo.call(user,'bootstrap');assert after['preferences']['weeklyHours']==12;assert after['activePlan']['weeklyCapacityMinutes']==720;assert len(repo.call(user,'plans')['plans'])==2


def test_concurrent_preferences_replan_has_one_revision_winner_and_owner_isolation(catalogue):
    from concurrent.futures import ThreadPoolExecutor
    repo,user,_=seed(catalogue);workspace(repo,user);other,other_user,_=seed(catalogue);workspace(other,other_user);untouched=other.call(other_user,'bootstrap');before=repo.call(user,'bootstrap');base=deepcopy(before['preferences']);base.pop('revision');base['expectedRevision']=before['preferencesRevision']
    bodies=[base|{'weeklyHours':1,'examTrack':'academic'},base|{'weeklyHours':8,'examTrack':'general_training'}]
    def save(body):
        try:return ('saved',mutation(repo,user,'preferences',body))
        except AccountError as error:return ('error',error.code)
    with ThreadPoolExecutor(max_workers=2)as executor:results=list(executor.map(save,bodies))
    assert sorted(x[0]for x in results)==['error','saved'];assert next(x[1]for x in results if x[0]=='error')=='revision_conflict'
    final=repo.call(user,'bootstrap');assert final['preferences']['revision']==before['preferencesRevision']+1;assert final['activePlan']['preferencesRevision']==final['preferences']['revision'];assert final['activePlan']['version']==before['activePlan']['version']+1;assert len(repo.call(user,'plans')['plans'])==2
    assert all(step['taskId'].startswith(final['preferences']['examTrack']+'-')for step in final['activePlan']['steps']);assert other.call(other_user,'bootstrap')==untouched

@pytest.mark.parametrize('track',['academic','general_training'])
def test_new_mock_order_matches_primary_test_day_sequence_and_baseline_stays_unchanged(catalogue,track):
    # British Council test-day advice, retrieved2026-11-07:
    # https://takeielts.britishcouncil.org/what-is-ielts/test-day-advice
    repo,user,_=seed(catalogue);preferences(repo,user,track)
    mock=mutation(repo,user,'session_create',{'mockId':track,'mockVersion':1})
    assert [section['skill']for section in mock['sections']]==['listening','reading','writing','speaking']
    assert [section['status']for section in mock['sections']]==['ready','locked','locked','locked']
    assert all(section['contentRef']['taskId'].startswith(track+'-')for section in mock['sections'])
    baseline=mutation(repo,user,'baseline_create',{'expectedPreferencesRevision':1})
    assert [section['skill']for section in baseline['sections']]==['reading','listening','writing','speaking']


def test_legacy_mock_order_deadlines_and_pins_survive_new_creation_and_exact_replay(catalogue):
    clock=[datetime(2026,11,7,tzinfo=timezone.utc)];repo,user,_=seed(catalogue,clock=lambda:clock[0]);preferences(repo,user)
    legacy=mutation(repo,user,'session_create',{'mockId':'academic','mockVersion':1})
    # This fresh, owned fixture represents the previously persisted format;
    # no production/preview session is rewritten by implementation or test.
    with admin_connection()as c:
        row=c.execute('SELECT data FROM mitooni_app.learner_sessions WHERE subject_id=%s AND id=%s',(user.id,legacy['id'])).fetchone()[0]
        order={'reading':0,'listening':1,'writing':2,'speaking':3};row['sections'].sort(key=lambda section:order[section['skill']])
        for index,section in enumerate(row['sections']):section['status']='ready'if index==0 else'locked'
        c.execute('UPDATE mitooni_app.learner_sessions SET data=%s WHERE subject_id=%s AND id=%s',(Jsonb(row),user.id,legacy['id']))
    key=str(uuid4());body={'expectedRevision':1};started=mutation(repo,user,'session_start',body,legacy['id'],key)
    assert [section['skill']for section in started['sections']]==['reading','listening','writing','speaking']
    with admin_connection()as c:stored_before=c.execute('SELECT data FROM mitooni_app.learner_sessions WHERE subject_id=%s AND id=%s',(user.id,legacy['id'])).fetchone()[0]
    newer=mutation(repo,user,'session_create',{'mockId':'academic','mockVersion':1});assert newer['sections'][0]['skill']=='listening'
    assert repo.call(user,'session',target=legacy['id'])==started
    assert mutation(repo,user,'session_start',body,legacy['id'],key)==started
    with admin_connection()as c:stored_after=c.execute('SELECT data FROM mitooni_app.learner_sessions WHERE subject_id=%s AND id=%s',(user.id,legacy['id'])).fetchone()[0]
    assert stored_after==stored_before
