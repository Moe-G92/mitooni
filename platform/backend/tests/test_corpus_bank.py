"""Synthetic manual fixtures, not provider generation or semantic validation."""
import copy
import pytest
from test_corpus_synthesis import corpus,planned
from app.corpus import bank,synthesis as s

def candidate(c):
    h=c.execute('SELECT text_sha256 FROM corpus_chunks').fetchone()[0]
    return dict(candidate_id='fixture',version=1,node_id='objective',role='practice',family_id='family',skill='reading',level='Foundation',exam_track='academic',content={'key':'blue'},stimuli=[dict(stimulus_id='p',kind='reading',text_en='The new panel is blue.',private_script_en='',chart_data=[])],media=[],criteria=[dict(criterion_id='evidence',label_en='Evidence',guidance_fa='شواهد',evidence_modality='text')],steps=[dict(step_id='answer',kind='practice',stimulus_id='p',prompt_en='What colour is the panel?',feedback_fa='شواهد را بررسی کنید',criterion_ids=['evidence'],exposure='supported',revises_step_id=None)],form_sections=[],assessment=dict(scoring_kind='practice_accuracy',calibrated_band=False,audio_required=False,transcript_only_pronunciation=False,independence='supported'),source_mappings=[dict(target_pointer='/stimuli/0/text_en',transformation='Original synthetic fixture for an evidence exercise',anchors=[dict(chunk_id='chunk',text_sha256=h,alias_id='alias',occurrence_id='occurrence',start=0,end=20)])],own_evidence=[dict(target_pointer='/content/key',stimulus_id='p',start=17,end=21,explanation='Own stimulus states the colour; source-original answer is not used')],inspections=[dict(chunk_id='chunk',text_sha256=h,inspector_session='author',method='source_read',observation='Synthetic fixture inspected only')])

def admit(c,p):
    bank.initialize(c); run=planned(c); return bank.admit_candidate(c,run,p,source_mode='manual',author_session='author',author_model='gpt-6.1-sol')

def test_normalized_activity_manual_admission_and_idempotency(corpus):
    p=candidate(corpus); report=admit(corpus,p)
    assert report['teacher_approval']=='pending' and report['semantic_entailment']=='not_established'
    assert admit(corpus,p)['replay']
    assert corpus.execute('SELECT count(*) FROM activity_steps').fetchone()[0]==1
    assert corpus.execute('SELECT count(*) FROM synthesis_receipts').fetchone()[0]==0
    p['content']['key']='green'
    with pytest.raises(s.CorpusError): admit(corpus,p)

@pytest.mark.parametrize('attack',['hash','own_span','source_inspection','dangling','revision','fake_band','provider'])
def test_invalid_candidates_rejected(corpus,attack):
    p=candidate(corpus)
    if attack=='hash': p['source_mappings'][0]['anchors'][0]['text_sha256']='0'*64
    if attack=='own_span': p['own_evidence'][0]['end']=500
    if attack=='source_inspection': p['inspections'][0]['inspector_session']='someone_else'
    if attack=='dangling': p['steps'][0]['stimulus_id']='unknown'
    if attack=='revision': p['steps'][0]['revises_step_id']='answer'
    if attack=='fake_band': p['assessment']['calibrated_band']=True
    with pytest.raises(ValueError):
        if attack=='provider':
            bank.initialize(corpus); bank.admit_candidate(corpus,planned(corpus),p,source_mode='provider',author_session='author',author_model='model')
        else: admit(corpus,p)

def test_media_pending_and_speaking_audio_truth(corpus):
    p=candidate(corpus); p['skill']='speaking'; p['assessment']['audio_required']=True
    p['media']=[dict(media_id='audio',stimulus_id='p',kind='audio',status='pending',asset_sha256='',asset_path='',duration_seconds=None,exposure='learner',requirement='Synthetic audio pending')]
    report=admit(corpus,p)
    assert 'media_pending' in report['findings'] and 'speaking_audio_evaluation_not_executed' in report['findings']

def test_review_does_not_forge_teacher_or_blind_evidence(corpus):
    p=candidate(corpus); receipt=admit(corpus,p)
    r=dict(review_id='r',candidate_id='fixture',version=1,content_hash=receipt['content_hash'],phase='review',mode='manual',session_id='reviewer',model='gpt-6.1-sol',decision='agree',evidence='Synthetic manual independent session evidence, same model not asymmetric model review')
    bank.record_review(corpus,r)
    assert corpus.execute('SELECT teacher_state FROM bank_candidates').fetchone()[0]=='pending'
    r['review_id']='self'; r['session_id']='author'
    with pytest.raises(s.CorpusError): bank.record_review(corpus,r)
    r['session_id']='reviewer'; r['phase']='blind'
    with pytest.raises(s.CorpusError): bank.record_review(corpus,r)
    r['phase']='review'; r['mode']='provider'
    with pytest.raises(s.CorpusError): bank.record_review(corpus,r)

def test_typed_graph_cycles_and_graph_pin(corpus):
    p=candidate(corpus); receipt=admit(corpus,p)
    assert bank.pin_activity_graph(corpus,'fixture',1)==receipt['graph_hash']
    nodes=[dict(node_id='a',kind='step'),dict(node_id='b',kind='step')]
    with pytest.raises(s.CorpusError): bank.validate_graph(nodes,[('a','b','next'),('b','a','next')])
    with pytest.raises(s.CorpusError): bank.validate_graph(nodes,[('a','b','requires_asset')])
    with pytest.raises(s.CorpusError): bank.validate_graph(nodes,[('a','missing','next')])

def test_source_entity_dependency_keeps_visual_pending(corpus):
    admit(corpus,candidate(corpus))
    corpus.execute('INSERT INTO corpus_entities VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',('figure','r',None,None,'figure',0,'[0,0,100,100]','f'*64,'private-fixture.png',None,'proposed',0.5,'{}')); corpus.commit()
    with pytest.raises(s.CorpusError): bank.bind_source_entity(corpus,'fixture',1,target_pointer='/stimuli/0',entity_id='figure',locator={'cell_id':'figure'},occurrence_id='occurrence')
    assert bank.bind_source_entity(corpus,'fixture',1,target_pointer='/stimuli/0',entity_id='figure',locator={'page_id':None},occurrence_id='occurrence')['state']=='pending'

def test_authored_import_is_held_not_fabricated_admission(corpus,tmp_path):
    import json
    bank.initialize(corpus)
    root=tmp_path/'authored'; (root/'units').mkdir(parents=True); (root/'mocks').mkdir()
    records=tmp_path/'records'; records.mkdir(); (records/'content-author-rw-20261106.md').write_text('Synthetic author inspection record; not a real provider review')
    index={'entries':[dict(id='ref',fileSha256='f'*64,pdfPages=[1],relativePath='fixture.pdf',inspectionNotes='Synthetic source read') ]}
    (root/'source-index.json').write_text(json.dumps(index))
    payload=dict(id='real-artifact-fixture',version=2,skill='reading',stage='train',stimulus={'text':'A fixture object is blue.'},questions=[],assessment={'answerKey':[{'evidenceQuote':'blue'}]},provenance={'sourceRefs':['ref']})
    (root/'units'/'fixture.json').write_text(json.dumps(payload))
    report=bank.import_authored(corpus,root,records_root=records,import_session='import-event')
    assert report['imports']==1 and report['admitted_candidates']==0 and report['provider_jobs_completed']==0
    row=corpus.execute('SELECT * FROM authored_imports').fetchone()
    assert row['authored_at'] is None and row['author_agent']=='/root/author_reading_writing' and row['status']=='held'
    assert corpus.execute('SELECT count(*) FROM authored_own_evidence').fetchone()[0]==1
    assert bank.project_imported_activities(corpus)['projected_held_imports']==1
    assert bank.backfill_authored_sources(corpus)[0]['missing_source_refs']==['ref']
    corpus.execute('INSERT INTO corpus_pages VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('page','a','r',1,'a'*64,'b'*64,'Synthetic page','fixture','complete',100.0,100.0,None))
    corpus.execute("UPDATE corpus_chunks SET page_id='page'"); corpus.commit()
    assert bank.backfill_authored_sources(corpus)[0]['resolved_chunk_anchors']==1
    assert corpus.execute('SELECT status FROM authored_imports').fetchone()[0]=='anchors_resolved'
    assert corpus.execute("SELECT count(*) FROM authored_import_gaps WHERE status='open'").fetchone()[0]>=3
    assert corpus.execute('SELECT count(*) FROM bank_candidates').fetchone()[0]==0

def test_generation_wire_fixture_reaches_held_candidate_not_approval(corpus,tmp_path):
    import json
    bank.initialize(corpus); run=planned(corpus)
    a=candidate(corpus)['source_mappings'][0]['anchors'][0]
    text='Compare the supplied evidence.'
    pack=dict(pack_id='pack',node_id='objective',version=1,sections=[dict(section_id='concept',kind='concept',text_en=text,text_fa='شواهد',claims=[dict(claim_id='claim',section_start=0,section_end=len(text),text_en=text,text_fa='شواهد',conditions='Use evidence',exceptions='Unknown stays unknown',anchors=[a])])])
    s.admit_pack(corpus,run,pack,source_mode='fixture')
    blueprint=[dict(plan_id='slot',node_id='objective',role='practice',skill='reading',level='Level 1',exam_track='academic',pack_id='pack',pack_version=1,media_kinds=[])]
    assert bank.plan_candidates(corpus,run,blueprint,model='fixture-model')['planned_generation_calls']==1
    b=s.prepare_batch(corpus,run,'generate',tmp_path/'generation.jsonl'); s.bind_provider_batch(corpus,b['batch_key'],'fixture-generation')
    p=candidate(corpus); p['level']='Level 1'; p['inspections'][0]['inspector_session']='generation:slot'
    wire=dict(custom_id=next(iter(b['lease_tokens'])),error=None,response=dict(status_code=200,body=dict(status='completed',output=[dict(type='message',content=[dict(type='output_text',text=json.dumps(p))])])))
    result=tmp_path/'generation-results.jsonl'; result.write_text(json.dumps(wire)+'\n')
    assert s.collect_batch(corpus,b['batch_key'],result,batch_id='fixture-generation',lease_tokens=b['lease_tokens'])['complete']==1
    row=corpus.execute('SELECT * FROM bank_candidates').fetchone()
    assert row['source_mode']=='fixture' and row['teacher_state']=='pending' and row['author_session']=='generation:slot'

def test_visual_registry_bytes_and_typed_graph_not_ocr_inference(corpus,tmp_path):
    import json,hashlib
    corpus.executescript(bank.IMPORT_SCHEMA)
    spec={'id':'visual','kind':'process','data':[]}; raw=json.dumps(spec); sh=hashlib.sha256(raw.encode()).hexdigest()
    (tmp_path/'spec.json').write_text(raw); (tmp_path/'asset.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'); ah=hashlib.sha256((tmp_path/'asset.svg').read_bytes()).hexdigest()
    manifest={'assets':[dict(id='render',visualId='visual',specSha256=sh,specPath='spec.json',relativePath='asset.svg',sha256=ah,width=360,height=200,mediaType='image/svg+xml',contentBindings=[])]}
    (tmp_path/'manifest.json').write_text(json.dumps(manifest))
    graph={'visuals':[dict(nodes=[dict(id='v',kind='authored_visual',specSha256=sh),dict(id='s',kind='stage')],edges=[dict(source='v',target='s',relation='has_stage')])]}
    (tmp_path/'graph.json').write_text(json.dumps(graph))
    assert bank.import_visual_registry(corpus,tmp_path/'manifest.json',tmp_path/'graph.json')['source_graph']=='pending'
    assert corpus.execute('SELECT count(*) FROM visual_graph_edges').fetchone()[0]==1
    (tmp_path/'asset.svg').write_text('tampered')
    with pytest.raises(s.CorpusError): bank.import_visual_registry(corpus,tmp_path/'manifest.json',tmp_path/'graph.json')

def test_cli_validation_errors_do_not_echo_private_candidate(corpus,tmp_path):
    import json,subprocess,sys
    from pathlib import Path
    p=tmp_path/'bad.json'; p.write_text(json.dumps({'private_source':'PRIVATE-CONTENT-SENTINEL'}))
    db=corpus.execute('PRAGMA database_list').fetchone()[2]
    script=Path(__file__).resolve().parents[1]/'scripts'/'generate_ielts_bank.py'
    proc=subprocess.run([sys.executable,str(script),'--db',db,'admit','--run-id','no-run','--candidate',str(p),'--author-session','fixture','--source-mode','manual'],capture_output=True,text=True)
    assert proc.returncode!=0 and 'PRIVATE-CONTENT-SENTINEL' not in proc.stdout+proc.stderr and 'invalid_private_artifact' in proc.stderr

def test_listening_cannot_disguise_script_as_visible_reading(corpus):
    p=candidate(corpus); p['skill']='listening'; p['assessment']['audio_required']=True
    with pytest.raises(s.CorpusError): admit(corpus,p)
    p['stimuli'][0]['kind']='audio'; p['stimuli'][0]['private_script_en']='PRIVATE SCRIPT'; p['media']=[dict(media_id='a',stimulus_id='p',kind='audio',status='pending',asset_sha256='',asset_path='',duration_seconds=None,exposure='learner',requirement='Audio required')]
    with pytest.raises(s.CorpusError): admit(corpus,p)  # Script may not appear as text_en.

@pytest.mark.parametrize('dimension',['skill','level','exam_track','media','phase'])
def test_generation_blueprint_dimensions_are_not_author_mutable(corpus,tmp_path,dimension):
    import json
    bank.initialize(corpus); run=planned(corpus)
    anchor=candidate(corpus)['source_mappings'][0]['anchors'][0]
    pack=dict(pack_id='p',node_id='objective',version=1,sections=[dict(section_id='s',kind='concept',text_en='Compare.',text_fa='شواهد',claims=[dict(claim_id='c',section_start=0,section_end=8,text_en='Compare.',text_fa='شواهد',conditions='',exceptions='',anchors=[anchor])])])
    s.admit_pack(corpus,run,pack,source_mode='fixture')
    spec=dict(plan_id='slot',node_id='objective',role='practice',skill='reading',level='Foundation',exam_track='academic',pack_id='p',pack_version=1,media_kinds=['image'] if dimension=='media' else [])
    bank.plan_candidates(corpus,run,[spec],model='fixture-model'); b=s.prepare_batch(corpus,run,'generate',tmp_path/'request'); s.bind_provider_batch(corpus,b['batch_key'],'fixture-generation')
    p=candidate(corpus); p['inspections'][0]['inspector_session']='generation:slot'
    if dimension=='skill': p['skill']='writing'
    if dimension=='level': p['level']='Level 3'
    if dimension=='exam_track': p['exam_track']='general_training'
    if dimension=='phase': p['steps'][0]['kind']='mock'
    wire=dict(custom_id=next(iter(b['lease_tokens'])),error=None,response=dict(status_code=200,body=dict(status='completed',output=[dict(type='message',content=[dict(type='output_text',text=json.dumps(p))])])))
    out=tmp_path/'result'; out.write_text(json.dumps(wire))
    report=s.collect_batch(corpus,b['batch_key'],out,batch_id='fixture-generation',lease_tokens=b['lease_tokens'])
    assert report['failed']==1 and report['admitted']==0 and corpus.execute('SELECT count(*) FROM bank_candidates').fetchone()[0]==0


def test_default_integrity_hold_blocks_entity_binding(corpus):
    admit(corpus,candidate(corpus))
    corpus.execute('INSERT INTO corpus_entities VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',('figure','r',None,None,'figure',0,'[]','f'*64,'private-fixture.png',None,'proposed',0.5,'{}'))
    corpus.execute('INSERT INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,status,manifest_json) VALUES(?,?,?,?,?,?)',('source','f'*64,'fixture','start','partial','[]'))
    corpus.execute('INSERT INTO corpus_integrity_audits VALUES(?,?,?,?,?,?,?,?)',('audit','source','p'*64,'m'*64,'r'*64,'synthetic audit','now','{}'))
    corpus.execute('INSERT INTO corpus_integrity_holds VALUES(?,?,?,?,?,?,?,?,?)',('hold','audit','a','r',None,'corrupt_render',1,'Synthetic structural hold','{}')); corpus.commit()
    with pytest.raises(s.CorpusError,match='source_integrity_hold'): bank.bind_source_entity(corpus,'fixture',1,target_pointer='/stimuli/0',entity_id='figure',locator={'page_id':None},occurrence_id='occurrence')

# This class exercises the real reviewed admission engine on a synthetic PDF.
# Run in the pinned private-authoring environment, not the serving environment.
import unittest
import sqlite3
import test_corpus_admission as _admission_fixtures
from app.corpus import admission as _admission

class TestBankSelectedEvidenceIntegration(unittest.TestCase):
    def setUp(self):
        _admission_fixtures.AdmissionTests.setUp(self)
        self.conn.execute("ALTER TABLE authored_imports ADD COLUMN status TEXT NOT NULL DEFAULT 'held'")
        self.conn.commit(); bank.initialize(self.conn)
        self.admission_id=_admission.create_admission(self.conn,self.review,**self.scope)
        self.conn.commit()
        self.capabilities={'import':{'MS1-R01':self.admission_id}}

    def test_strict_optin_strict_snapshots_and_dependencies(self):
        first=bank.backfill_authored_sources(self.conn,import_ids=['import'],corpus_run_id='run')[0]
        self.assertEqual(first['state'],'held')
        legacy=self.conn.execute('SELECT * FROM authored_source_backfills').fetchone()
        selected=bank.backfill_authored_sources(self.conn,import_ids=['import'],corpus_run_id='run',selected_admissions=self.capabilities)[0]
        self.assertEqual(selected['state'],'anchors_resolved');self.assertEqual(selected['selected_admission_count'],1)
        self.assertEqual(self.conn.execute('SELECT count(*) FROM authored_import_sources').fetchone()[0],0)
        self.assertGreater(self.conn.execute('SELECT count(*) FROM bank_selected_chunk_bindings').fetchone()[0],0)
        self.assertEqual(self.conn.execute("SELECT count(*) FROM authored_import_gaps WHERE kind='selected_dependency_withheld' AND status='open'").fetchone()[0],7)
        self.assertFalse(selected['semantic_completion']);self.assertEqual(selected['teacher_approval'],'pending')
        again=bank.backfill_authored_sources(self.conn,import_ids=['import'],corpus_run_id='run')[0]
        self.assertEqual(again['state'],'held');self.assertEqual(again['scope_snapshot_id'],first['scope_snapshot_id'])
        self.assertEqual(tuple(legacy),tuple(self.conn.execute('SELECT * FROM authored_source_backfills').fetchone()))
        self.assertEqual(self.conn.execute('SELECT count(*) FROM bank_source_scope_snapshots').fetchone()[0],2)
        self.assertEqual(self.conn.execute('SELECT status FROM corpus_extractions').fetchone()[0],'partial')
        with self.assertRaises(sqlite3.IntegrityError):self.conn.execute('DELETE FROM bank_selected_source_links')
        self.conn.rollback()

    def test_invalid_unused_target_and_run_capabilities_write_nothing(self):
        for attack in [dict(self.capabilities,unused={'MS1-R01':self.admission_id}),{'import':{'MS1-W01':self.admission_id}},{'import':{'MS1-R01':'missing-admission'}}]:
            with self.assertRaises(ValueError):bank.backfill_authored_sources(self.conn,import_ids=['import'],corpus_run_id='run',selected_admissions=attack)
            self.assertEqual(self.conn.execute('SELECT count(*) FROM bank_selected_source_links').fetchone()[0],0)
            self.assertEqual(self.conn.execute('SELECT count(*) FROM bank_source_scope_snapshots').fetchone()[0],0)
        self.conn.execute('INSERT INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,completed_at,status,manifest_json,snapshot_json) VALUES(?,?,?,?,?,?,?,?)',('other','m','fixture','start','end','partial','[]','{"terminal":true}'));self.conn.commit()
        with self.assertRaises(ValueError):bank.backfill_authored_sources(self.conn,import_ids=['import'],corpus_run_id='other',selected_admissions=self.capabilities)
        self.assertEqual(self.conn.execute('SELECT count(*) FROM bank_selected_source_links').fetchone()[0],0)

    def test_changed_target_and_new_integrity_hold_cannot_reuse_capability(self):
        self.conn.execute('INSERT INTO corpus_integrity_holds VALUES(?,?,?,?,?,?,?,?,?)',('hold','audit',self.asset,self.rev,None,'unresolved',1,'synthetic global hold','{}'));self.conn.commit()
        with self.assertRaises(ValueError):bank.backfill_authored_sources(self.conn,import_ids=['import'],corpus_run_id='run',selected_admissions=self.capabilities)
        self.assertEqual(self.conn.execute('SELECT count(*) FROM bank_source_scope_snapshots').fetchone()[0],0)

def test_exposure_versions_scope_and_hash_fail_closed(corpus,tmp_path):
    import json
    bank.initialize(corpus); payloads={}; ids={}
    for label,version in [('old',1),('new',2)]:
        payload=dict(id='unit',version=version,skill='reading',stimulus={'text':'fixture'},questions=[{'id':'q'}]); payloads[label]=payload
        h=s.digest(payload); iid=s.digest(['unit',version,h]); ids[label]=iid
        corpus.execute('INSERT INTO authored_imports VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(iid,'fixture',0,'unit',version,h,'unit','fixture','fixture','fixture',None,'r','r','i',s.canonical(payload),'{}','held'))
    corpus.commit(); path=tmp_path/'syllabus.json'
    registry={'units':[{'id':'unit','unitCanonicalSha256':s.digest(payloads['old'])}],'semanticExposureGroups':[{'id':'g','activities':[{'unitId':'unit','questionId':'q'}],'rule':'First immutable rule'}]}
    path.write_text(json.dumps(registry)); first=bank.import_exposure_registry(corpus,path,import_ids=[ids['old']])
    registry['semanticExposureGroups'][0]['rule']='Revised explicit rule'; registry['units'][0]['unitCanonicalSha256']=s.digest(payloads['new'])
    path.write_text(json.dumps(registry)); second=bank.import_exposure_registry(corpus,path,import_ids=[ids['new']])
    assert first['registry_hash']!=second['registry_hash']
    assert corpus.execute('SELECT count(*) FROM exposure_group_versions').fetchone()[0]==2
    assert {tuple(r) for r in corpus.execute('SELECT import_id,registry_hash FROM authored_exposure_group_versions')}=={(ids['old'],first['registry_hash']),(ids['new'],second['registry_hash'])}
    assert bank.exposure_overlap(corpus,ids['new'],[ids['old']])['shared_groups']==['g']
    registry['units'][0]['unitCanonicalSha256']='bad'; path.write_text(json.dumps(registry))
    with pytest.raises(s.CorpusError,match='hash_mismatch'): bank.import_exposure_registry(corpus,path,import_ids=[ids['new']])
    assert corpus.execute('SELECT count(*) FROM exposure_group_versions').fetchone()[0]==2
    assert bank.project_imported_activities(corpus,import_ids=[ids['new']])['projected_held_imports']==1
    assert corpus.execute('SELECT import_id FROM authored_import_graph_versions').fetchone()[0]==ids['new']
    with pytest.raises(s.CorpusError): bank.project_imported_activities(corpus,import_ids=['missing'])
    corpus.execute('UPDATE authored_imports SET payload_json=? WHERE import_id=?',(s.canonical(dict(payloads['new'],id='drift')),ids['new'])); corpus.commit()
    with pytest.raises(s.CorpusError,match='import_content_drift'): bank.import_exposure_registry(corpus,path,import_ids=[ids['new']])
