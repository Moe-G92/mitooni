"""Isolated55440 PostgreSQL +actual pinned SDK/local HTTP; no real provider calls.

Each invocation owns fresh synthetic member/policy/catalog UUIDs. No reset or
cleanup touches prior fixtures; immutable attempts remain durable test evidence.
"""
import asyncio
from copy import deepcopy
import json
from uuid import uuid4
import httpx
import pytest
from psycopg.types.json import Jsonb
from app.dependencies import CurrentUser
from app.contracts.learner_content import LearnerTask
from app.providers.learner import LearnerRunner
from app.repositories.postgres_learner import PostgresLearnerRepository
from app.services.learner_content import digest
from app.workers.learner import LearnerWorker
from local.learner_setup import CONFIG, admin_connection
from test_learner_content import fixture as content_fixture, save
from test_learner_ai import response as text_response, candidate
from test_speaking_evaluator import wav, candidate as audio_candidate, response as audio_response


def setup(request,tmp_path):
    if not request.config.getoption('--local-postgres'):
        pytest.skip('Explicit isolated learner PostgreSQL required')
    identity=str(uuid4());policy_id='ai-integration-'+str(uuid4())
    value=content_fixture(tmp_path)
    base=value['tasks'][0]
    base['task'].update(id='synthetic-writing-'+identity,skill='writing',kind='gt_task1',examTrack='general_training',
        title='Synthetic polite request',objectiveIds=['tone'],teachingAnchors=[dict(id='tone',label='Register',text='Make a clear polite request.')])
    base['task']['sections'][0]['questions']=[dict(id='letter',prompt='Request a repair.',responseType='extended_text')]
    base['metadata'].update(id=base['task']['id'],skill='writing',examTrack='general_training',familyId='synthetic-family-'+identity,
        semanticExposureGroupIds=['synthetic-exposure-'+identity],objectiveIds=['tone'])
    base['assessment']=dict(kind='qualitative',answerKey=[],criteria=[dict(id='task-achievement',label='Purpose',description='Clear polite request')],feedbackGuidance='Synthetic task only; no bands.')
    base['metadata']['contentHash']=digest(base['task'])
    speaking=deepcopy(base)
    speaking['task'].update(id='synthetic-speaking-'+identity,skill='speaking',kind='speaking_turn',examTrack='shared',title='Synthetic three-part rehearsal')
    speaking['task']['sections']=[dict(id='part'+str(i),title='Part '+str(i),text=None,instructions='Record a response.',
        questions=[dict(id='part'+str(i),prompt='Describe a useful place.',responseType='spoken_response')],table=None,assetIds=[])for i in (1,2,3)]
    speaking['metadata'].update(id=speaking['task']['id'],skill='speaking',examTrack='shared',contentHash=digest(speaking['task']),familyId='speaking-'+identity)
    speaking['assessment']['criteria']=[dict(id=c,label=c,description='Qualitative audio evidence')for c in ('fluency-coherence','lexical-resource','grammatical-range-accuracy','pronunciation')]
    value['tasks'].append(speaking)
    for record in value['tasks']:
        record['task']=LearnerTask.model_validate(record['task']).model_dump()
        record['metadata']['contentHash']=digest(record['task'])
    catalog=save(tmp_path,value)
    policy=dict(enabled=True,currency='USD',pricingRevision='2026-11-07',capMicros=10_000_000,
        ownerCapMicros=10_000_000,maxConcurrent=1,models=dict(text='gpt-6.1-sol',audio='gpt-audio-mini'),
        reservationMicros=dict(text=3_718_000,speaking=1_299_661),rates=dict(
            text=dict(inputMicrosPerToken=4,outputMicrosPerToken=15),
            speaking=dict(inputMicrosPerToken=10,outputMicrosPerToken=2.4)))
    with admin_connection() as c:
        c.execute("INSERT INTO mitooni_app.memberships(product_id,issuer,subject_id,status,roles,entitlements)VALUES('mitooni',%s,%s,'active',%s,%s)",
            (CONFIG.issuer,identity,['learner'],['learner:use','learner:tutor']))
        c.execute('INSERT INTO mitooni_app.provider_budget_policies(id,data)VALUES(%s,%s)',(policy_id,Jsonb(policy)))
        c.execute('INSERT INTO mitooni_app.provider_usage_totals(policy_id)VALUES(%s)',(policy_id,))
        c.execute('INSERT INTO mitooni_app.learner_publications(catalog_hash,data)VALUES(%s,%s)',
            (catalog.catalog_hash,Jsonb(dict(status='approved',allowedUses=['learner_delivery','model_context'],withdrawnTaskIds=[]))))
    repo=PostgresLearnerRepository(CONFIG,catalog,provider_enabled=True,budget_policy_id=policy_id)
    user=CurrentUser(identity)
    repo.call(user,'preferences',dict(expectedRevision=0,examTrack='general_training',weeklyHours=5,testDate=None,
        targets={s:7.0 for s in ('overall','reading','writing','listening','speaking')},selfReportedLevel=5.0,locale='en'),str(uuid4()))
    plan=repo.call(user,'plan_create',dict(expectedPreferencesRevision=1,expectedEvidenceRevision=0),str(uuid4()))
    return repo,user,policy_id,plan


def workspace(repo,user,plan,skill):
    step=next(s for s in plan['steps']if s['skill']==skill)
    return repo.call(user,'resolve',dict(planId=plan['id'],planVersion=plan['version'],stepId=step['id'],conditionPreset='supported'),str(uuid4()))


def submit(repo,user,w,responses):
    w=repo.call(user,'draft',dict(expectedDraftRevision=w['draft']['revision'],responses=responses),str(uuid4()),w['id'])
    w=repo.call(user,'submit',dict(expectedWorkspaceRevision=w['revision'],expectedDraftRevision=w['draft']['revision'],
        expectedConditionsRevision=w['attempt']['conditions']['revision']),str(uuid4()),w['attempt']['id'])
    job=repo.call(user,'feedback',dict(expectedWorkspaceRevision=w['revision']),str(uuid4()),w['attempt']['id'])
    return w,job


def process(repo,user,job,handler):
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler))as client:
            runner=LearnerRunner(api_key='synthetic-only',text_model='gpt-6.1-sol',audio_model='gpt-audio-mini',http_client=client)
            await LearnerWorker(repo,runner).process(dict(issuer=CONFIG.issuer,subjectId=user.id,jobId=job['id']))
    asyncio.run(run())
    return repo.call(user,'job',target=job['id'])


def test_actual_pg_single_text_dispatch_usage_and_durable_history(request,tmp_path):
    repo,user,policy,plan=setup(request,tmp_path);w=workspace(repo,user,plan,'writing')
    w,job=submit(repo,user,w,[dict(itemId='letter',kind='essay',value='I demand fix it.')])
    assert w['draft']['revision']==2 and w['attempt']['conditions']['revision']==1
    assert job['workRef']['revision']==2
    calls=[]
    async def handler(req):
        calls.append(req)
        return httpx.Response(200,json=text_response(candidate(observations=[dict(
            criterionId='task-achievement',observation='The request uses demand.',revisionAction='Use could you.',
            workSpanIndexes=[0],evidenceIds=[])])))
    out=process(repo,user,job,handler)
    assert len(calls)==1 and out['status']=='completed',out
    assert repo.messages(user,w['id'])['messages'][0]['output']['text'].startswith('The request')
    with admin_connection()as c:
        r=c.execute('SELECT status,reserved_micros,settled_micros FROM mitooni_app.provider_usage_reservations WHERE id=%s',(job['id'],)).fetchone()
        assert r==('settled',0,340)
        totals=c.execute('SELECT reserved_micros,settled_micros,active_jobs FROM mitooni_app.provider_usage_totals WHERE policy_id=%s',(policy,)).fetchone()
        assert totals==(0,340,0)


def test_actual_pg_three_native_audio_recordings_one_dispatch(request,tmp_path):
    repo,user,policy,plan=setup(request,tmp_path);w=workspace(repo,user,plan,'speaking');responses=[]
    for i in (1,2,3):
        r=repo.recording(user,w['attempt']['id'],'part'+str(i),w['draft']['revision'],wav(),str(uuid4()))
        responses.append(dict(itemId='part'+str(i),kind='recording',value=r['id']))
    w,job=submit(repo,user,w,responses);calls=[]
    async def handler(req):
        payload=json.loads(req.content);calls.append(payload)
        entries=[]
        for content in payload['messages'][1]['content']:
            if content['type']=='text':
                data=json.loads(content['text'])
                if 'recordingId'in data:entries.append(dict(recordingId=data['recordingId'],feedback=audio_candidate()))
        out=audio_response(dict(kind='qualitative_speaking_feedback_collection',recordings=entries));out['model']='gpt-audio-mini'
        return httpx.Response(200,json=out)
    out=process(repo,user,job,handler)
    assert len(calls)==1 and out['status']=='completed',out
    assert len(out['output']['recordings'])==3
    with admin_connection()as c:
        assert c.execute('SELECT reserved_micros,settled_micros,active_jobs FROM mitooni_app.provider_usage_totals WHERE policy_id=%s',(policy,)).fetchone()==(0,67,0)


def test_actual_pg_unknown_dispatch_holds_money_and_does_not_retry(request,tmp_path):
    repo,user,policy,plan=setup(request,tmp_path);w=workspace(repo,user,plan,'writing')
    w,job=submit(repo,user,w,[dict(itemId='letter',kind='essay',value='I demand fix it.')]);calls=[]
    async def handler(req):
        calls.append(req)
        raise httpx.ReadTimeout('Synthetic unknown',request=req)
    out=process(repo,user,job,handler)
    assert out['status']=='dispatch_unknown'and len(calls)==1,out
    out=process(repo,user,job,handler)
    assert out['status']=='dispatch_unknown'and len(calls)==1
    with admin_connection()as c:
        r=c.execute('SELECT status,reserved_micros,settled_micros FROM mitooni_app.provider_usage_reservations WHERE id=%s',(job['id'],)).fetchone()
        assert r==('dispatch-unknown',3_718_000,0)
        assert c.execute('SELECT reserved_micros,settled_micros,active_jobs FROM mitooni_app.provider_usage_totals WHERE policy_id=%s',(policy,)).fetchone()==(3_718_000,0,1)


def test_actual_pg_invalid_candidate_still_settles_known_usage(request,tmp_path):
    repo,user,policy,plan=setup(request,tmp_path);w=workspace(repo,user,plan,'writing')
    w,job=submit(repo,user,w,[dict(itemId='letter',kind='essay',value='I demand fix it.')]);calls=[]
    async def handler(req):
        calls.append(req)
        return httpx.Response(200,json=text_response(candidate(citations=[dict(anchorId='invented-source')])) )
    out=process(repo,user,job,handler)
    assert out['status']=='failed'and out['output']is None and len(calls)==1,out
    with admin_connection()as c:
        assert c.execute('SELECT status,reserved_micros,settled_micros FROM mitooni_app.provider_usage_reservations WHERE id=%s',(job['id'],)).fetchone()==('settled',0,340)
