import hashlib
import json
import sqlite3
import pytest
from app.corpus import store
from app.corpus import multimodal as m

def h(raw):return hashlib.sha256(raw).hexdigest()

@pytest.fixture
def corpus(tmp_path):
    c=sqlite3.connect(':memory:');c.row_factory=sqlite3.Row;store.initialize(c)
    original=b'synthetic original';asset=h(original);revision='revision';root=tmp_path/'sources';root.mkdir();(root/'book.pdf').write_bytes(original)
    cache=tmp_path/'cache';cache.mkdir();image=b'\x89PNG\r\n\x1a\nsynthetic';(cache/'page.png').write_bytes(image)
    c.execute('INSERT INTO corpus_authorities VALUES(?,?,?,?,?,?)',('auth','Iran','full-model-processing','curated-only','now','synthetic'))
    c.execute('INSERT INTO corpus_assets VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(asset,revision,asset,'rights','pdf',len(original),'v','complete',1,'academic','1','historical','{}'))
    c.execute('INSERT INTO corpus_extractions VALUES(?,?,?,?,?,?,?,?,?)',(revision,asset,'tool','v','{}','complete','{"source_hash_verified":true}','{}','rights'))
    c.execute('INSERT INTO corpus_source_occurrences VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('occ','alias',asset,'book.pdf','source','auth','academic','1','historical',None,None,'now'))
    c.execute('INSERT INTO corpus_runs(run_id,manifest_sha256,extraction_version,started_at,completed_at,status,manifest_json,tool_config_sha256,snapshot_json) VALUES(?,?,?,?,?,?,?,?,?)',('run','manifest','v','now','now','complete','[]','tool','{"terminal":true}'))
    c.execute('INSERT INTO corpus_run_extractions VALUES(?,?,?,?,?)',('run',asset,revision,'complete',None));c.execute('INSERT INTO corpus_run_files VALUES(?,?,?,?,?,?)',('run','book.pdf',asset,'occ',revision,'complete'))
    c.execute('INSERT INTO corpus_pages VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('page',asset,revision,1,'pixels',h(b'native image title omitted'),'native image title omitted','pymupdf-native','complete',100.,200.,None))
    meta=json.dumps({'image_path':'page.png','image_sha256':h(image),'coordinate_frame':'original-display-points'})
    c.execute('INSERT INTO corpus_regions VALUES(?,?,?,?,?,?)',('region','page','page-image','[0,0,100,200]','',meta))
    c.execute('INSERT INTO corpus_entities VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',('entity',revision,'page','region','page-image',0,'[0,0,100,200]',h(image),'page.png',h(b''),'proposed',None,meta));c.commit()
    return c,root,cache

def candidate(t):return dict(task_id=t['task_id'],input_hash=t['input_hash'],disposition='interpreted',objects=[dict(object_id='title',kind='objective',title='Observe',description='Visible title',evidence=[dict(entity_id='entity',chunk_id=None,bbox=[1.,1.,20.,20.],time_start=None,time_end=None,observation='visible')],uncertainties=[])],axes=[],data=[],relations=[],segments=[],omissions=[])

def prepared(corpus):
    c,root,cache=corpus;p=m.plan_multimodal(c,'run');t=p['tasks'][0];r=m.prepare_request(c,p,t['task_id'],source_root=root,cache_root=cache);return c,p,t,r

def test_native_page_is_visual_task_and_deterministic(corpus):
    c,_,_=corpus;p=m.plan_multimodal(c,'run');assert p==m.plan_multimodal(c,'run');assert p['summary']['page_tasks']==1;assert not p['summary']['semantic_completion'];assert p['tasks'][0]['inputs']['placements'][0]['occurrence']['occurrence_id']=='occ'

@pytest.mark.parametrize('mutation',["UPDATE corpus_pages SET text='changed'","UPDATE corpus_source_occurrences SET authority_id='bad'","UPDATE corpus_authorities SET processing_scope='revoked'"])
def test_source_drift(corpus,mutation):
    c,root,cache=corpus;p=m.plan_multimodal(c,'run');c.execute(mutation)
    with pytest.raises(m.MultimodalError,match='snapshot_drift'):m.prepare_request(c,p,p['tasks'][0]['task_id'],source_root=root,cache_root=cache)

def test_missing_raster_recoverable_and_explicit_callback(corpus):
    c,root,cache=corpus;p=m.plan_multimodal(c,'run');t=p['tasks'][0];raw=(cache/'page.png').read_bytes();(cache/'page.png').unlink()
    with pytest.raises(m.MultimodalError,match='recoverable'):m.prepare_request(c,p,t['task_id'],source_root=root,cache_root=cache)
    def render(region):
        assert region=='region';(cache/'page.png').write_bytes(raw);return cache/'page.png'
    assert m.prepare_request(c,p,t['task_id'],source_root=root,cache_root=cache,render_region=render)['provider_calls']==0

def test_original_drift(corpus):
    c,root,cache=corpus;p=m.plan_multimodal(c,'run');(root/'book.pdf').write_bytes(b'changed')
    with pytest.raises(m.MultimodalError,match='drift'):m.prepare_request(c,p,p['tasks'][0]['task_id'],source_root=root,cache_root=cache)

def test_symlink_refused(corpus,tmp_path):
    c,root,cache=corpus;p=m.plan_multimodal(c,'run');raw=(cache/'page.png').read_bytes();(cache/'page.png').unlink();other=tmp_path/'other';other.write_bytes(raw);(cache/'page.png').symlink_to(other)
    with pytest.raises(m.MultimodalError,match='symlink'):m.prepare_request(c,p,p['tasks'][0]['task_id'],source_root=root,cache_root=cache)

def test_receipt_geometry_fencing(corpus):
    c,p,t,r=prepared(corpus);b=m.bind_prepared(c,p,r,mode='provider',provider_id='request-1')
    with pytest.raises(m.MultimodalError,match='provenance'):m.admit_candidate(c,p,b['binding_id'],provider_id='wrong',request_hash=r['request_hash'],payload=candidate(t))
    bad=candidate(t);bad['objects'][0]['evidence'][0]['bbox']=[0.,0.,101.,2.]
    with pytest.raises(m.MultimodalError,match='geometry'):m.admit_candidate(c,p,b['binding_id'],provider_id='request-1',request_hash=r['request_hash'],payload=bad)
    result=m.admit_candidate(c,p,b['binding_id'],provider_id='request-1',request_hash=r['request_hash'],payload=candidate(t));assert result['state']=='candidate';assert c.execute('SELECT COUNT(*) FROM multimodal_reviews').fetchone()[0]==0

def test_unknown_relation(corpus):
    c,p,t,r=prepared(corpus);value=candidate(t);value['relations']=[dict(source_id='title',target_id='invented',relation='question_about',evidence=value['objects'][0]['evidence'],uncertainty='')]
    with pytest.raises(m.MultimodalError,match='relation'):m._candidate(t,value)

def test_plan_request_drift(corpus):
    c,p,t,r=prepared(corpus);r['kwargs']['max_output_tokens']=999
    with pytest.raises(m.MultimodalError,match='prepared_config_mismatch'):m.bind_prepared(c,p,r)
    p['config']['vision_model']='changed'
    with pytest.raises(m.MultimodalError,match='plan_drift'):m.validate_plan(c,p)

def test_strict_schema_and_sdk_fields(corpus):
    _,_,_,r=prepared(corpus)
    from openai.types.responses.response_create_params import ResponseCreateParamsNonStreaming
    assert set(r['kwargs'])<=set(ResponseCreateParamsNonStreaming.__annotations__)
    def walk(n):
        if isinstance(n,dict):
            if n.get('type')=='object':assert n.get('additionalProperties') is False;assert set(n['required'])==set(n['properties'])
            for v in n.values():walk(v)
        elif isinstance(n,list):
            for v in n:walk(v)
    walk(m.SemanticCandidate.model_json_schema())

def add_audio(corpus, *, size=None, duration=10.,raw=b'synthetic audio',sample_rate=44100,channels=2):
    c,root,_=corpus;asset=h(raw);rev='audio-revision';(root/'audio.mp3').write_bytes(raw)
    c.execute('INSERT INTO corpus_assets VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(asset,rev,asset,'rights','mp3',size or len(raw),'v','complete',None,'shared','1','historical','{}'))
    c.execute('INSERT INTO corpus_extractions VALUES(?,?,?,?,?,?,?,?,?)',(rev,asset,'tool','v','{}','metadata-admitted','{"source_hash_verified":true}','{}','rights'))
    c.execute('INSERT INTO corpus_source_occurrences VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('audio-occ','audio-alias',asset,'audio.mp3','source','auth','shared','1','historical',None,None,'now'))
    c.execute('INSERT INTO corpus_run_extractions VALUES(?,?,?,?,?)',('run',asset,rev,'complete',None));c.execute('INSERT INTO corpus_run_files VALUES(?,?,?,?,?,?)',('run','audio.mp3',asset,'audio-occ',rev,'complete'))
    c.execute('INSERT INTO corpus_media VALUES(?,?,?,?,?,?,?,?,?)',('audio',asset,rev,duration,'mp3',channels,sample_rate,'metadata-admitted-transcript-pending','{}'))
    page_asset=c.execute("SELECT asset_id FROM corpus_assets WHERE media_type='pdf'").fetchone()[0]
    c.execute('INSERT INTO corpus_chunks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',('printed-chunk',page_asset,'revision','page',h(b'Printed script'),'Printed script',1,1,None,None,None,'text','synthetic','v','candidate','extracted',0))
    c.execute('INSERT INTO corpus_transcripts VALUES(?,?,?,?,?,?,?,?)',('printed-original','audio','printed-chunk','Printed script',h(b'Printed script'),'licensed-book-candidate','unaligned-edition-candidate','{}'));c.commit()


def test_all_audio_denominator_and_oversize_hold(corpus):
    add_audio(corpus,size=m.MAX_FILE_BYTES+1);c,root,cache=corpus;p=m.plan_multimodal(c,'run');assert p['summary']['audio_originals']==1
    t=next(t for t in p['tasks'] if t['kind']=='source_asr');assert 'audio_segmentation_required' in t['blocked_reasons'];assert t['inputs']['payload']['segmentation_policy']['state']=='not_executed'
    with pytest.raises(m.MultimodalError,match='segmentation'):m.prepare_request(c,p,t['task_id'],source_root=root,cache_root=cache)


def test_asr_timestamp_semantics_and_dependency(corpus):
    add_audio(corpus);c,root,cache=corpus;p=m.plan_multimodal(c,'run');t=next(t for t in p['tasks'] if t['kind']=='source_asr');r=m.prepare_request(c,p,t['task_id'],source_root=root,cache_root=cache)
    assert r['kwargs']['timestamp_granularities']==['segment'];assert p['config']['asr_compatibility_deprecation']=='2027-02-26'
    v=m.adapt_asr(t,{'segments':[{'id':0,'start':0,'end':9.,'text':'Synthetic speech'}]});assert v['segments'][0]['end']==9.
    with pytest.raises(m.MultimodalError,match='timestamped'):m.adapt_asr(t,{'text':'No times supplied'})
    with pytest.raises(m.MultimodalError,match='segment_bounds'):m.adapt_asr(t,{'segments':[{'id':0,'start':0,'end':11.,'text':'Invalid'}]})
    align=next(t for t in p['tasks'] if t['kind']=='audio_alignment')
    with pytest.raises(m.MultimodalError,match='asr_provider'):m.prepare_request(c,p,align['task_id'],source_root=root,cache_root=cache)
    binding=m.bind_prepared(c,p,r,mode='fixture');receipt=m.admit_candidate(c,p,binding['binding_id'],provider_id=None,request_hash=r['request_hash'],payload=v)
    with pytest.raises(m.MultimodalError,match='asr_provider'):m.prepare_request(c,p,align['task_id'],source_root=root,cache_root=cache,dependencies={t['task_id']:receipt})
    receipt['mode']='provider';receipt['provider_id']='invented'
    with pytest.raises(m.MultimodalError,match='asr_provider_receipt_required'):m.prepare_request(c,p,align['task_id'],source_root=root,cache_root=cache,dependencies={t['task_id']:receipt})


def test_identical_bytes_all_placements_one_billable_task(corpus):
    c,root,cache=corpus;asset=c.execute('SELECT asset_id FROM corpus_assets').fetchone()[0]
    (root/'copy.pdf').write_bytes((root/'book.pdf').read_bytes())
    c.execute('INSERT INTO corpus_source_occurrences VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('copy-occ','copy-alias',asset,'copy.pdf','source','auth','general-training','other','historical',None,None,'now'))
    c.execute('INSERT INTO corpus_run_files VALUES(?,?,?,?,?,?)',('run','copy.pdf',asset,'copy-occ','revision','complete'));c.commit()
    p=m.plan_multimodal(c,'run');assert p['summary']['page_tasks']==1;assert len(p['tasks'][0]['inputs']['placements'])==2
    c.execute('INSERT INTO corpus_aliases VALUES(?,?,?,?,?,?,?,?,?,?)',('alias',asset,'book.pdf','wrong','auth',None,None,None,None,None));c.commit()
    m.validate_plan(c,p)  # mutable current alias is deliberately irrelevant


def test_integrity_hold_blocks_asset_even_if_other_page(corpus):
    c,root,cache=corpus;asset=c.execute('SELECT asset_id FROM corpus_assets').fetchone()[0]
    c.execute('INSERT INTO corpus_integrity_audits VALUES(?,?,?,?,?,?,?,?)',('audit','run','policy','manifest','report','synthetic','now','{}'));c.execute('INSERT INTO corpus_integrity_holds VALUES(?,?,?,?,?,?,?,?,?)',('hold','audit',asset,'revision',None,'source-warning',1,'synthetic','{}'));c.commit()
    p=m.plan_multimodal(c,'run');assert 'source_integrity_default_hold' in p['tasks'][0]['blocked_reasons']
    with pytest.raises(m.MultimodalError,match='integrity'):m.prepare_request(c,p,p['tasks'][0]['task_id'],source_root=root,cache_root=cache)


def test_actual_sdk_serializes_both_requests_offline(corpus):
    import httpx
    from openai import OpenAI
    add_audio(corpus);c,root,cache=corpus;p=m.plan_multimodal(c,'run');seen=[]
    def transport(request):
        seen.append(request)
        if request.url.path.endswith('/audio/transcriptions'):
            assert b'synthetic audio' in request.content;assert b'whisper-1' in request.content;assert b'timestamp_granularities[]' in request.content
            return httpx.Response(200,json={'text':'Synthetic speech','language':'english','duration':10.,'segments':[]})
        body=json.loads(request.content);assert body['store'] is False;assert body['input'][0]['content'][1]['image_url'].startswith('data:image/png;base64,')
        return httpx.Response(200,json={'id':'resp_fixture','object':'response','created_at':0,'model':'gpt-6-astra','status':'completed','output':[]})
    client=OpenAI(api_key='synthetic-not-a-key',base_url='https://api.openai.com/v1',max_retries=0,http_client=httpx.Client(transport=httpx.MockTransport(transport)))
    try:
        page=next(t for t in p['tasks'] if t['kind']=='page_semantics');asr=next(t for t in p['tasks'] if t['kind']=='source_asr')
        client.responses.create(**m.prepare_request(c,p,page['task_id'],source_root=root,cache_root=cache)['kwargs'])
        client.audio.transcriptions.create(**m.prepare_request(c,p,asr['task_id'],source_root=root,cache_root=cache)['kwargs'])
        assert len(seen)==2
    finally:client.close()

@pytest.mark.parametrize('mutation',['source_text','authority','remove_task'])
def test_rehashed_plan_is_not_source_authority(corpus,mutation):
    c,root,cache=corpus;p=m.plan_multimodal(c,'run')
    if mutation=='source_text':p['tasks'][0]['inputs']['payload']['page']['text']='invented'
    elif mutation=='authority':p['tasks'][0]['inputs']['placements'][0]['authority']['processing_scope']='invented'
    else:p['tasks']=[]
    p['plan_hash']=m.digest({k:v for k,v in p.items() if k!='plan_hash'})
    with pytest.raises(m.MultimodalError,match='membership_or_eligibility'):m.validate_plan(c,p)


def test_rehashed_remote_image_url_cannot_bind(corpus):
    c,p,t,r=prepared(corpus);content=r['kwargs']['input'][0]['content'];content[1]['image_url']='https://synthetic.invalid/remote,'+content[1]['image_url'].split(',',1)[1];r['request_hash']=m.digest([r['method'],r['kwargs']])
    with pytest.raises(m.MultimodalError,match='image_mismatch'):m.bind_prepared(c,p,r)


def test_evidence_must_land_inside_referenced_figure(corpus):
    c,_,_=corpus;c.execute("UPDATE corpus_entities SET bbox_json='[50,50,60,60]',kind='figure'");p=m.plan_multimodal(c,'run');t=p['tasks'][0]
    with pytest.raises(m.MultimodalError,match='outside_referenced_entity'):m._candidate(t,candidate(t))


def wave_audio(corpus,frames=80000,rate=8000,channels=1,noise=False):
    import io,wave,array,random
    data=array.array('h',(random.Random(i).randint(-32768,32767) if noise else (i%30000)-15000 for i in range(frames*channels))).tobytes()
    buffer=io.BytesIO()
    with wave.open(buffer,'wb') as w:w.setnchannels(channels);w.setsampwidth(2);w.setframerate(rate);w.writeframes(data)
    add_audio(corpus,raw=buffer.getvalue(),duration=frames/rate,sample_rate=rate,channels=channels)
    c,_,_=corpus;p=m.plan_multimodal(c,'run');return p,next(t for t in p['tasks'] if t['kind']=='source_asr'),data


@pytest.mark.parametrize('channels',[1,2])
def test_real_flac_partition_roundtrip_and_request(corpus,tmp_path,channels):
    c,root,_=corpus;p,task,raw=wave_audio(corpus,channels=channels);out=tmp_path/'segments'
    path=m.segment_source_audio(task,source_root=root,output_root=out,core_seconds=3,context_seconds=1)
    manifest=m.read_segmentation_manifest(path);assert manifest['decoded_sha256']==h(raw);assert manifest['total_frames']==80000
    assert [(s['core_start_frame'],s['core_end_frame']) for s in manifest['segments']]==[(0,24000),(24000,48000),(48000,72000),(72000,80000)]
    assert all((path.parent/s['path']).stat().st_mode & 0o777==0o600 for s in manifest['segments']);assert path.parent.stat().st_mode & 0o777==0o700
    v2=m.plan_multimodal(c,'run',segmentations=[manifest]);assert v2['summary']['audio_originals']==1;assert v2['summary']['requests_by_kind']['source_asr']==4
    segmented=next(t for t in v2['tasks'] if t['kind']=='source_asr');prepared=m.prepare_request(c,v2,segmented['task_id'],source_root=root,cache_root=out)
    assert prepared['kwargs']['file'][0]=='source.flac';assert prepared['kwargs']['file'][2]=='audio/flac';assert prepared['kwargs']['file'][1].startswith(b'fLaC')
    binding=m.bind_prepared(c,v2,prepared,source_root=root,cache_root=out)
    value=m.adapt_asr(segmented,{'segments':[{'id':0,'start':0.,'end':0.5,'text':'Synthetic segment'}]})
    with pytest.raises(m.MultimodalError,match='roots_required'):m.admit_candidate(c,v2,binding['binding_id'],provider_id=None,request_hash=prepared['request_hash'],payload=value)
    assert m.admit_candidate(c,v2,binding['binding_id'],provider_id=None,request_hash=prepared['request_hash'],payload=value,source_root=root,cache_root=out)['state']=='candidate'
    import httpx
    from openai import OpenAI
    def transport(request):
        assert b'source.flac' in request.content and b'audio/flac' in request.content and b'fLaC' in request.content
        return httpx.Response(200,json={'text':'Synthetic','language':'english','duration':3.,'segments':[]})
    client=OpenAI(api_key='synthetic-not-a-key',max_retries=0,http_client=httpx.Client(transport=httpx.MockTransport(transport)))
    try:client.audio.transcriptions.create(**prepared['kwargs'])
    finally:client.close()
    with pytest.raises(m.MultimodalError,match='output_exists'):m.segment_source_audio(task,source_root=root,output_root=out,core_seconds=3,context_seconds=1)


def test_recursive_actual_size_split_and_failure_cleanup(corpus,tmp_path):
    _,root,_=corpus;_,task,raw=wave_audio(corpus,frames=32000,noise=True);out=tmp_path/'segments'
    path=m.segment_source_audio(task,source_root=root,output_root=out,core_seconds=3,context_seconds=0,max_file_bytes=18000)
    manifest=m.read_segmentation_manifest(path);assert len(manifest['segments'])>2;assert all(s['encoded_bytes']<=18000 for s in manifest['segments']);assert manifest['primary_partition']['sha256']==h(raw)
    with pytest.raises(m.MultimodalError,match='cannot_fit|recursion_limit'):
        m.segment_source_audio(task,source_root=root,output_root=out,core_seconds=1,context_seconds=2,max_file_bytes=9000)
    assert not list(out.glob('.audio-stage-*'))


def test_segmentation_drift_symlink_and_quota(corpus,tmp_path):
    _,root,_=corpus;_,task,_=wave_audio(corpus,frames=8000);out=tmp_path/'segments'
    with pytest.raises(m.MultimodalError,match='disk_floor'):m.segment_source_audio(task,source_root=root,output_root=out,disk_floor=10**20)
    actual=root/'audio.mp3';other=tmp_path/'copy';other.write_bytes(actual.read_bytes());actual.unlink();actual.symlink_to(other)
    with pytest.raises(m.MultimodalError,match='symlink'):m.segment_source_audio(task,source_root=root,output_root=out)


def test_bounded_audio_process_failures(tmp_path):
    import sys
    out=tmp_path/'partial'
    for code,cap,timeout,reason in [('import sys;sys.stdout.buffer.write(b"x"*200000)',100,5,'output_limit'),('import sys;sys.stderr.buffer.write(b"x"*100000)',100,5,'stderr_limit'),('import time;time.sleep(3)',100,0.1,'timeout'),('raise SystemExit(2)',100,5,'process_failed')]:
        with pytest.raises(m.MultimodalError,match=reason):m._stream_command([sys.executable,'-c',code],out,max_bytes=cap,timeout=timeout)
        assert not out.exists()


def test_segmentation_manifest_and_derivation_fencing(corpus,tmp_path):
    import copy,shutil
    c,root,_=corpus;_,task,_=wave_audio(corpus,frames=32000);out=tmp_path/'segments';path=m.segment_source_audio(task,source_root=root,output_root=out,core_seconds=2,context_seconds=0);manifest=m.read_segmentation_manifest(path)
    bad=copy.deepcopy(manifest);bad['segments'][0]['core_end_frame']-=1;bad['manifest_hash']=m.digest({k:v for k,v in bad.items() if k!='manifest_hash'})
    with pytest.raises(m.MultimodalError,match='partition|extent'):m.plan_multimodal(c,'run',segmentations=[bad])
    bad=copy.deepcopy(manifest);first,second=bad['segments'];first['path']=second['path'];first['encoded_sha256']=second['encoded_sha256'];first['encoded_bytes']=second['encoded_bytes'];first['decoded_sha256']=second['decoded_sha256'];second['path']='copy-'+second['path'];bad['manifest_hash']=m.digest({k:v for k,v in bad.items() if k!='manifest_hash'})
    dest=out/bad['manifest_hash'];shutil.copytree(path.parent,dest);shutil.copyfile(dest/first['path'],dest/second['path'])
    for item in dest.iterdir():item.chmod(0o600)
    v2=m.plan_multimodal(c,'run',segmentations=[bad]);t=next(t for t in v2['tasks'] if t['kind']=='source_asr')
    with pytest.raises(m.MultimodalError,match='not_derived_from_original_interval'):m.prepare_request(c,v2,t['task_id'],source_root=root,cache_root=out)
    m.persist_plan(c,v2)
    c.execute('CREATE TABLE multimodal_bindings(binding_id TEXT PRIMARY KEY,task_id TEXT,request_hash TEXT,provider_id TEXT,mode TEXT)')
    c.execute('INSERT INTO multimodal_bindings VALUES(?,?,?,?,?)',('wrong-segment',t['task_id'],'request',None,'fixture'));c.commit()
    value=m.adapt_asr(t,{'segments':[{'id':0,'start':0.,'end':0.5,'text':'Synthetic candidate'}]})
    with pytest.raises(m.MultimodalError,match='not_derived_from_original_interval'):m.admit_candidate(c,v2,'wrong-segment',provider_id=None,request_hash='request',payload=value,source_root=root,cache_root=out)


def test_segment_timing_keeps_context_separate(corpus,tmp_path):
    c,root,_=corpus;_,task,_=wave_audio(corpus,frames=40000);out=tmp_path/'segments';manifest=m.read_segmentation_manifest(m.segment_source_audio(task,source_root=root,output_root=out,core_seconds=2,context_seconds=1));p=m.plan_multimodal(c,'run',segmentations=[manifest]);t=[t for t in p['tasks'] if t['kind']=='source_asr'][1]
    v=m.adapt_asr(t,{'segments':[{'id':0,'start':0.,'end':0.5,'text':'Context only'},{'id':1,'start':1.,'end':2.,'text':'Primary'}]});timeline=m.segment_timeline(t,v)
    assert timeline['observations'][0]['absolute_start_seconds']==1.;assert not timeline['observations'][0]['primary_midpoint_in_core'];assert timeline['observations'][1]['primary_midpoint_in_core'];assert not timeline['semantic_completion']


def test_hardlinks_and_partial_publish_refused(corpus,tmp_path,monkeypatch):
    import os
    _,root,_=corpus;_,task,_=wave_audio(corpus,frames=8000);out=tmp_path/'segments';os.link(root/'audio.mp3',root/'hardlink')
    with pytest.raises(m.MultimodalError,match='hardlinked'):m.segment_source_audio(task,source_root=root,output_root=out)
    (root/'hardlink').unlink()
    def fail(*args):raise KeyboardInterrupt()
    monkeypatch.setattr(m,'_atomic_publish_directory',fail)
    with pytest.raises(KeyboardInterrupt):m.segment_source_audio(task,source_root=root,output_root=out)
    assert not list(out.iterdir())


def test_midstream_rate_or_channel_change_refused(corpus,tmp_path):
    import subprocess,io,wave
    chunks=[]
    for rate,channels in [(8000,1),(16000,2)]:
        raw=io.BytesIO()
        with wave.open(raw,'wb') as w:w.setnchannels(channels);w.setsampwidth(2);w.setframerate(rate);w.writeframes(b'\x00\x10'*rate*channels)
        chunks.append(subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-i','pipe:0','-c:a','libmp3lame','-b:a','64k','-f','mp3','pipe:1'],input=raw.getvalue(),capture_output=True,check=True,timeout=10).stdout)
    add_audio(corpus,raw=b''.join(chunks),duration=2.,sample_rate=8000,channels=1);c,root,_=corpus;t=next(t for t in m.plan_multimodal(c,'run')['tasks'] if t['kind']=='source_asr')
    with pytest.raises(m.MultimodalError,match='changing_audio_format|audio_metadata_drift'):m.segment_source_audio(t,source_root=root,output_root=tmp_path/'segments')


def test_audio_relative_traversal_refused_before_read(tmp_path):
    outside=tmp_path/'outside';outside.write_bytes(b'synthetic');sub=tmp_path/'sub';sub.mkdir()
    with pytest.raises(m.MultimodalError,match='unsafe_audio_path'):m._secure_regular(sub/'..'/'outside')
