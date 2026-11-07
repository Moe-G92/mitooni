"""Synthetic offline fixtures only; no model outputs or real source material."""
import json
import time
import pytest
from app.corpus import store,synthesis as s

@pytest.fixture
def corpus(tmp_path):
    c=store.connect(tmp_path/'fixture.sqlite3'); store.initialize(c); s.initialize(c)
    text=('Synthetic paragraph about comparing evidence and preserving scope. '*8)
    h=s.digest(text)
    c.execute('INSERT INTO corpus_authorities VALUES(?,?,?,?,?,?)',('u','Iran','fixture only','fixture only','2026-11-06','synthetic fixture'))
    c.execute('INSERT INTO corpus_assets VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',('a','r','f'*64,'d'*64,'pdf',100,'fixture','complete',1,'academic','fixture','fixture','{}'))
    c.execute('INSERT INTO corpus_extractions(revision_id,asset_id,tool_config_sha256,extraction_version,metadata_json) VALUES(?,?,?,?,?)',('r','a','e'*64,'fixture','{}'))
    c.execute("UPDATE corpus_extractions SET status='complete',quality_json='{\"source_hash_verified\":true}'")
    c.execute('INSERT INTO corpus_source_occurrences VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('occurrence','alias','a','fixture.pdf','fixture','u','academic','fixture','fixture',None,None,'fixture'))
    c.execute('INSERT INTO corpus_aliases VALUES(?,?,?,?,?,?,?,?,?,?)',('alias','a','fixture.pdf','fixture','u','academic','fixture','fixture',None,None))
    c.execute('INSERT INTO corpus_chunks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',('chunk','a','r',None,h,text,1,1,None,None,None,'text','fixture','fixture','fixture','extracted',0)); c.commit()
    node=dict(node_id='objective',parent_id=None,node_type='objective',exam_track='academic',skill='reading',level='Level 3',label_en='Compare',label_fa='مقایسه',objective_en='Compare evidence')
    s.seed_curriculum(c,[node]); return c

def planned(c):
    return s.plan_classification(c,model='fixture-model',window_chars=200,context_chars=50,mode='fixture')['run_id']

def prepared(c,tmp_path):
    run=planned(c); result=s.prepare_batch(c,run,'classify',tmp_path/'private'/'requests.jsonl'); s.bind_provider_batch(c,result['batch_key'],'fixture-batch'); return run,result

def results(c,path):
    lines=[]
    for r in c.execute('SELECT job_id FROM synthesis_jobs ORDER BY job_id'):
        lines.append(dict(custom_id=r[0],response=dict(status_code=200,body=dict(status='completed',output=[dict(type='message',content=[dict(type='output_text',text=json.dumps(dict(disposition='relevant',node_ids=['objective'],reason='fixture classification')))])])),error=None))
    path.write_text('\n'.join(json.dumps(x) for x in lines)); return lines

def test_primary_coverage_idempotent_and_volume(corpus):
    run=planned(corpus); original=corpus.execute('SELECT length(text) FROM corpus_chunks').fetchone()[0]
    assert s.coverage(corpus,run)['primary_chars']==original
    assert planned(corpus)==run
    assert s.estimate(corpus,run)['planned_calls']==3
    assert not s.coverage(corpus,run)['classification_complete']

def test_collect_replay(corpus,tmp_path):
    run,b=prepared(corpus,tmp_path); p=tmp_path/'results.jsonl'; rows=results(corpus,p)
    assert s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])['complete']==len(rows)
    assert s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])['failed']==0
    assert s.coverage(corpus,run)['classification_complete']

@pytest.mark.parametrize('attack',['unknown','duplicate','wrong_lease','expired_lease','stale_chunk'])
def test_fail_closed_attacks(corpus,tmp_path,attack):
    run,b=prepared(corpus,tmp_path); p=tmp_path/'results.jsonl'; rows=results(corpus,p)
    tokens=b['lease_tokens']
    if attack=='unknown': rows[0]['custom_id']='unknown'
    if attack=='duplicate': rows.append(rows[0])
    if attack=='wrong_lease': tokens={k:'wrong' for k in tokens}
    if attack=='expired_lease': corpus.execute('UPDATE synthesis_jobs SET lease_until=?',(time.time()-1,)); corpus.commit()
    if attack=='stale_chunk': corpus.execute("UPDATE corpus_chunks SET text='changed'"); corpus.commit()
    p.write_text('\n'.join(json.dumps(x) for x in rows))
    with pytest.raises(s.CorpusError): s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-batch',lease_tokens=tokens)
    assert corpus.execute('SELECT count(*) FROM synthesis_receipts').fetchone()[0]==0

def test_missing_partial_and_schema_errors_are_receipted_failures(corpus,tmp_path):
    run,b=prepared(corpus,tmp_path); p=tmp_path/'results.jsonl'; rows=results(corpus,p)
    rows[0]['response']['body']['status']='incomplete'; rows[1]['response']['body']['output'][0]['content'][0]['text']='{"disposition":"relevant","node_ids":[],"reason":"x","extra":true}'
    p.write_text('\n'.join(json.dumps(x) for x in rows[:-1]))
    report=s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])
    assert report['failed']==3
    assert not s.coverage(corpus,run)['classification_complete']
    with pytest.raises(s.CorpusError): s.prepare_batch(corpus,run,'classify',tmp_path/'next.jsonl')
    job=next(iter(b['lease_tokens'])); s.retry(corpus,job,reason='explicit fixture repair')
    assert corpus.execute('SELECT state FROM synthesis_jobs WHERE job_id=?',(job,)).fetchone()[0]=='planned'

def test_no_silent_held_chunk_or_asset(corpus):
    corpus.execute("UPDATE corpus_assets SET status='partial'"); corpus.commit()
    run=planned(corpus); report=s.coverage(corpus,run)
    assert report['chunks']==1 and report['assets']==1 and report['open_gaps']==2 and report['jobs']=={}

def test_strict_json_and_symlink(corpus,tmp_path):
    for bad in ['{"a":1,"a":2}','{"a":NaN}']:
        with pytest.raises(s.CorpusError): s.read_json(bad)
    (tmp_path/'alias').symlink_to(tmp_path,target_is_directory=True)
    with pytest.raises(s.CorpusError): s.private_write(tmp_path/'alias'/'out.jsonl','x')

def test_curriculum_cycle_and_free_source_level(corpus):
    assert corpus.execute('SELECT level FROM curriculum_nodes').fetchone()[0]=='Level 3'
    with pytest.raises(s.CorpusError): s.seed_curriculum(corpus,[],[('objective','objective','prerequisite')])

def test_pack_plan_and_real_wire_fixture_collection(corpus,tmp_path):
    run,b=prepared(corpus,tmp_path); p=tmp_path/'classifications.jsonl'; results(corpus,p)
    s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])
    report=s.plan_packs(corpus,run,model='fixture-model')
    assert report['planned_pack_calls']==3
    b=s.prepare_batch(corpus,run,'synthesize',tmp_path/'packs.jsonl'); s.bind_provider_batch(corpus,b['batch_key'],'fixture-packs')
    wire=[]
    for i,row in enumerate(corpus.execute("SELECT * FROM synthesis_jobs WHERE phase='synthesize' ORDER BY job_id").fetchall()):
        anchor=json.loads(json.loads(row['request_json'])['input'][1]['content'])['anchor']
        text='Compare the stated evidence.'
        payload=dict(pack_id=f'pack-{i}',node_id='objective',version=1,sections=[dict(section_id='concept',kind='concept',text_en=text,text_fa='شواهد',claims=[dict(claim_id='claim',section_start=0,section_end=len(text),text_en=text,text_fa='شواهد',conditions='When explicit evidence exists',exceptions='Insufficient evidence remains unknown',anchors=[anchor])])])
        wire.append(dict(custom_id=row['job_id'],error=None,response=dict(status_code=200,body=dict(status='completed',output=[dict(type='message',content=[dict(type='output_text',text=json.dumps(payload))])]))))
    p=tmp_path/'pack-results.jsonl'; p.write_text('\n'.join(json.dumps(x) for x in wire))
    assert s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-packs',lease_tokens=b['lease_tokens'])['complete']==3
    assert corpus.execute('SELECT count(*) FROM teaching_packs').fetchone()[0]==3
    assert corpus.execute("SELECT count(*) FROM teaching_packs WHERE teacher_state='pending'").fetchone()[0]==3
    with pytest.raises(s.CorpusError): s.admit_pack(corpus,run,payload,source_mode='provider')

def test_terminal_source_run_pins_immutable_revision_not_active_pointer(corpus):
    corpus.execute('INSERT INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,completed_at,status,manifest_json,snapshot_json) VALUES(?,?,?,?,?,?,?,?)',('source-run','f'*64,'fixture','start','end','partial','[]','{"terminal":true}'))
    corpus.execute('INSERT INTO corpus_run_extractions VALUES(?,?,?,?,?)',('source-run','a','r','complete',None)); corpus.commit()
    run=s.plan_classification(corpus,model='fixture-model',window_chars=200,mode='fixture',corpus_run_id='source-run')['run_id']
    h=s.snapshot(corpus,'source-run')
    corpus.execute('INSERT INTO corpus_extractions(revision_id,asset_id,tool_config_sha256,extraction_version,metadata_json,status) VALUES(?,?,?,?,?,?)',('r2','a','0'*64,'new-fixture','{}','failed'))
    corpus.execute("UPDATE corpus_assets SET revision_id='r2',status='failed'"); corpus.commit()
    assert s.snapshot(corpus,'source-run')==h
    assert s.coverage(corpus,run)['snapshot_current']
    a=dict(chunk_id='chunk',text_sha256=corpus.execute('SELECT text_sha256 FROM corpus_chunks').fetchone()[0],alias_id='alias',occurrence_id='occurrence',start=0,end=20)
    assert s.resolve_anchor(corpus,a)[0]['revision_id']=='r'

def test_malformed_wire_envelopes_do_not_escape_or_complete(corpus,tmp_path):
    run,b=prepared(corpus,tmp_path); p=tmp_path/'malformed.jsonl'
    p.write_text('null\n')
    with pytest.raises(s.CorpusError): s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])
    rows=results(corpus,p)
    rows[0]['response']['body']=[]
    rows[1]['response']['body']['output']=['bad']
    p.write_text('\n'.join(json.dumps(x) for x in rows))
    r=s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])
    assert r['failed']==2 and r['complete']==1

def test_expired_submission_recovers_collection_without_new_operation(corpus,tmp_path):
    run,b=prepared(corpus,tmp_path); path=tmp_path/'late.jsonl'; results(corpus,path)
    before=[tuple(r) for r in corpus.execute('SELECT job_id,attempt,lease_token,provider_batch_id FROM synthesis_jobs ORDER BY job_id')]
    corpus.execute('UPDATE synthesis_jobs SET lease_until=?',(time.time()-1,)); corpus.commit()
    with pytest.raises(s.CorpusError): s.validate_bound_batch(corpus,b['batch_key'])
    with pytest.raises(s.CorpusError): s.recover_collection(corpus,b['batch_key'],batch_id='another-operation',lease_tokens=b['lease_tokens'],reason='fixture late download')
    recovered=s.recover_collection(corpus,b['batch_key'],batch_id='fixture-batch',lease_tokens=b['lease_tokens'],reason='Fixture late download of same completed provider operation')
    assert recovered['new_provider_operations']==0 and recovered['new_attempts']==0
    assert before==[tuple(r) for r in corpus.execute('SELECT job_id,attempt,lease_token,provider_batch_id FROM synthesis_jobs ORDER BY job_id')]
    assert s.validate_bound_batch(corpus,b['batch_key'])['request_count']==3
    assert s.collect_batch(corpus,b['batch_key'],path,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])['complete']==3

def test_result_quotas_and_run_metadata_drift(corpus,tmp_path):
    path=tmp_path/'large'; path.write_text('x'*50)
    with pytest.raises(s.CorpusError): list(s.bounded_result_lines(path,max_records=1,max_bytes=30))
    with pytest.raises(s.CorpusError): list(s.bounded_result_lines(path,max_records=1,max_line_bytes=30))
    run,b=prepared(corpus,tmp_path); results(corpus,path)
    corpus.execute("UPDATE synthesis_runs SET corpus_snapshot_hash='tampered'"); corpus.commit()
    with pytest.raises(s.CorpusError): s.collect_batch(corpus,b['batch_key'],path,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])
    assert corpus.execute('SELECT count(*) FROM synthesis_receipts').fetchone()[0]==0

def test_substantive_persian_span_and_duplicate_claims_rejected_before_collection(corpus):
    run=planned(corpus)
    anchor=dict(chunk_id='chunk',text_sha256=corpus.execute('SELECT text_sha256 FROM corpus_chunks').fetchone()[0],alias_id='alias',occurrence_id='occurrence',start=0,end=20)
    payload=dict(pack_id='p',node_id='objective',version=1,sections=[dict(section_id='s',kind='concept',text_en='Compare.',text_fa='شواهد added fact',claims=[dict(claim_id='c',section_start=0,section_end=8,text_en='Compare.',text_fa='شواهد',conditions='',exceptions='',anchors=[anchor])])])
    with pytest.raises(s.CorpusError): s.validate_pack(corpus,payload)
    payload['sections'][0]['text_fa']='شواهد'; payload['sections'][0]['claims']*=2
    with pytest.raises(s.CorpusError): s.validate_pack(corpus,payload)

def test_integrity_overlay_blocks_default_resolver_and_prepared_manifest(corpus,tmp_path):
    run,b=prepared(corpus,tmp_path)
    corpus.execute('INSERT INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,status,manifest_json) VALUES(?,?,?,?,?,?)',('source','f'*64,'fixture','start','partial','[]'))
    corpus.execute('INSERT INTO corpus_integrity_audits VALUES(?,?,?,?,?,?,?,?)',('audit','source','p'*64,'m'*64,'r'*64,'synthetic audit','now','{}'))
    corpus.execute('INSERT INTO corpus_integrity_holds VALUES(?,?,?,?,?,?,?,?,?)',('hold','audit','a','r',None,'corrupt_render',1,'Synthetic structural hold','{}')); corpus.commit()
    anchor=dict(chunk_id='chunk',text_sha256=corpus.execute('SELECT text_sha256 FROM corpus_chunks').fetchone()[0],alias_id='alias',occurrence_id='occurrence',start=0,end=20)
    with pytest.raises(s.CorpusError,match='source_integrity_hold'): s.resolve_anchor(corpus,anchor)
    with pytest.raises(s.CorpusError): s.validate_bound_batch(corpus,b['batch_key'])
    assert corpus.execute('SELECT count(*) FROM synthesis_receipts').fetchone()[0]==0

def test_classification_counts_separate_downstream_jobs_and_source_gaps(corpus,tmp_path):
    run,b=prepared(corpus,tmp_path); p=tmp_path/'out'; results(corpus,p)
    s.collect_batch(corpus,b['batch_key'],p,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])
    s.plan_packs(corpus,run,model='fixture-model')
    assert s.coverage(corpus,run)['classification_complete']
    with corpus: s._gap(corpus,run,'failed-media','media','Synthetic unprocessed source media')
    report=s.coverage(corpus,run)
    assert report['classification_jobs_complete'] and not report['classification_complete']


def test_prepared_manifest_rejects_model_and_request_configuration_drift(corpus,tmp_path):
    run=planned(corpus); b=s.prepare_batch(corpus,run,'classify',tmp_path/'requests')
    assert s.validate_prepared_batch(corpus,b['batch_key'])['request_count']==3
    corpus.execute("UPDATE synthesis_jobs SET model='different'"); corpus.commit()
    with pytest.raises(s.CorpusError): s.validate_prepared_batch(corpus,b['batch_key'])

@pytest.mark.parametrize('role',['primary','context'])
def test_relational_source_spans_must_equal_frozen_request(corpus,tmp_path,role):
    run=planned(corpus); b=s.prepare_batch(corpus,run,'classify',tmp_path/'requests'); s.bind_provider_batch(corpus,b['batch_key'],'fixture-batch')
    path=tmp_path/'results'; results(corpus,path)
    corpus.execute('UPDATE synthesis_job_inputs SET start_offset=start_offset+1 WHERE role=?',(role,)); corpus.commit()
    with pytest.raises(s.CorpusError,match='job_input_rows_differ_from_request'): s.collect_batch(corpus,b['batch_key'],path,batch_id='fixture-batch',lease_tokens=b['lease_tokens'])
    assert corpus.execute('SELECT count(*) FROM synthesis_receipts').fetchone()[0]==0


def test_prepared_unknown_reconciliation_preserves_attempt_and_fences(corpus,tmp_path):
    run=planned(corpus); b=s.prepare_batch(corpus,run,'classify',tmp_path/'requests')
    before=[tuple(r) for r in corpus.execute('SELECT job_id,state,attempt,lease_token,provider_batch_id,request_hash FROM synthesis_jobs ORDER BY job_id')]
    corpus.execute('UPDATE synthesis_jobs SET lease_until=?',(time.time()-1,)); corpus.commit()
    with pytest.raises(s.CorpusError): s.validate_prepared_batch(corpus,b['batch_key'])
    with pytest.raises(s.CorpusError): s.recover_prepared_reconciliation(corpus,b['batch_key'],lease_tokens={},reason='Fixture unknown upload')
    r=s.recover_prepared_reconciliation(corpus,b['batch_key'],lease_tokens=b['lease_tokens'],reason='Fixture same-operation unknown upload metadata reconciliation only')
    assert r['new_attempts']==0 and r['new_provider_operations']==0
    assert before==[tuple(row) for row in corpus.execute('SELECT job_id,state,attempt,lease_token,provider_batch_id,request_hash FROM synthesis_jobs ORDER BY job_id')]
    assert s.validate_prepared_batch(corpus,b['batch_key'])['request_count']==3
    s.bind_provider_batch(corpus,b['batch_key'],'known-fixture-operation')
    with pytest.raises(s.CorpusError): s.recover_prepared_reconciliation(corpus,b['batch_key'],lease_tokens=b['lease_tokens'],reason='Cannot use prepared recovery once bound')

def test_ingestion_page_dispositions_not_mislabeled_as_missing_extraction(corpus):
    for i,status in enumerate(['extracted','blank-verified','blank-candidate']):
        corpus.execute('INSERT INTO corpus_pages VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(f'page-{i}','a','r',i+1,'a'*64,'b'*64,'Synthetic fixture text','fixture',status,100.0,100.0,None))
    corpus.commit(); run=planned(corpus)
    page_gaps=corpus.execute("SELECT target_id,reason FROM corpus_gaps WHERE run_id=? AND kind='page'",(run,)).fetchall()
    assert [tuple(r) for r in page_gaps]==[('page-2','blank-candidate')]

def test_explicit_pilot_then_remaining_uses_one_ledger_without_duplicate_calls(corpus,tmp_path):
    run=planned(corpus); ids=[r[0] for r in corpus.execute('SELECT job_id FROM synthesis_jobs WHERE run_id=? ORDER BY job_id',(run,))]
    pilot=s.prepare_batch(corpus,run,'classify',tmp_path/'pilot',job_ids=[ids[1]],limit=1,model='fixture-model')
    assert list(pilot['lease_tokens'])==[ids[1]]
    assert corpus.execute("SELECT count(*) FROM synthesis_jobs WHERE state='planned'").fetchone()[0]==2
    s.bind_provider_batch(corpus,pilot['batch_key'],'fixture-pilot')
    all_results=tmp_path/'all-results'; wire=results(corpus,all_results); selected=[r for r in wire if r['custom_id']==ids[1]]
    path=tmp_path/'pilot-result'; path.write_text(json.dumps(selected[0]))
    assert s.collect_batch(corpus,pilot['batch_key'],path,batch_id='fixture-pilot',lease_tokens=pilot['lease_tokens'])['complete']==1
    remaining=s.prepare_batch(corpus,run,'classify',tmp_path/'remaining',model='fixture-model')
    assert set(remaining['lease_tokens'])==set(ids)-{ids[1]}
    assert corpus.execute('SELECT count(*) FROM synthesis_receipts').fetchone()[0]==1
    assert corpus.execute('SELECT sum(attempt) FROM synthesis_jobs').fetchone()[0]==3

@pytest.mark.parametrize('attack',['duplicate','missing','foreign_run','phase','model','not_planned','over_limit'])
def test_invalid_subset_rejected_before_leases_or_files(corpus,tmp_path,attack):
    run=planned(corpus); ids=[r[0] for r in corpus.execute('SELECT job_id FROM synthesis_jobs WHERE run_id=?',(run,))]
    selected=[ids[0]]; phase='classify'; model='fixture-model'; limit=3
    if attack=='duplicate':selected*=2
    if attack=='missing':selected=['0'*64]
    if attack=='foreign_run':
        foreign=s.plan_classification(corpus,model='other',window_chars=200,mode='fixture')['run_id'];selected=[corpus.execute('SELECT job_id FROM synthesis_jobs WHERE run_id=?',(foreign,)).fetchone()[0]]
    if attack=='phase':phase='generate'
    if attack=='model':model='other'
    if attack=='not_planned':corpus.execute("UPDATE synthesis_jobs SET state='failed' WHERE job_id=?",(ids[0],));corpus.commit()
    if attack=='over_limit':selected=ids;limit=1
    with pytest.raises(s.CorpusError):s.prepare_batch(corpus,run,phase,tmp_path/'denied',job_ids=selected,model=model,limit=limit)
    assert not (tmp_path/'denied').exists()
    assert corpus.execute('SELECT sum(attempt) FROM synthesis_jobs').fetchone()[0]==0
    assert corpus.execute('SELECT count(*) FROM synthesis_batches').fetchone()[0]==0

def test_selector_file_private_nonsymlink_and_bounded(tmp_path):
    path=tmp_path/'selector';path.write_text(json.dumps(['a'*64]));path.chmod(0o600)
    assert s.read_job_selector(path)==['a'*64]
    alias=tmp_path/'alias';alias.symlink_to(path)
    with pytest.raises(s.CorpusError):s.read_job_selector(alias)
    path.chmod(0o644)
    with pytest.raises(s.CorpusError):s.read_job_selector(path)
    path.chmod(0o600);path.write_bytes(b' '*4_000_001)
    with pytest.raises(s.CorpusError):s.read_job_selector(path)

def test_exact_hundred_pilot_leaves_only_remaining_jobs_planned(corpus,tmp_path):
    text='Synthetic offline fixture. '*840
    corpus.execute('UPDATE corpus_chunks SET text=?,text_sha256=?',(text,s.digest(text))); corpus.commit()
    run=planned(corpus); ids=[r[0] for r in corpus.execute('SELECT job_id FROM synthesis_jobs WHERE run_id=? ORDER BY job_id',(run,))]
    assert len(ids)>100
    batch=s.prepare_batch(corpus,run,'classify',tmp_path/'pilot100',job_ids=ids[:100],limit=100,model='fixture-model')
    assert len(batch['lease_tokens'])==100
    s.bind_provider_batch(corpus,batch['batch_key'],'fixture-pilot100')
    wire=results(corpus,tmp_path/'fixture-all'); selected=[r for r in wire if r['custom_id'] in ids[:100]]
    path=tmp_path/'fixture-selected';path.write_text('\n'.join(json.dumps(r) for r in selected))
    assert s.collect_batch(corpus,batch['batch_key'],path,batch_id='fixture-pilot100',lease_tokens=batch['lease_tokens'])['complete']==100
    assert corpus.execute("SELECT count(*) FROM synthesis_jobs WHERE state='planned'").fetchone()[0]==len(ids)-100
    remaining=s.prepare_batch(corpus,run,'classify',tmp_path/'remainder',model='fixture-model')
    assert set(remaining['lease_tokens'])==set(ids[100:])
    assert corpus.execute('SELECT sum(attempt) FROM synthesis_jobs').fetchone()[0]==len(ids)
    assert corpus.execute('SELECT count(*) FROM synthesis_receipts').fetchone()[0]==100
