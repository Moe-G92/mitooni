"""Explicit engineering evidence admissions for the reviewed private first set.

This never changes extraction, semantic, teacher, delivery or publication status.
The complete-source default in other readers remains mandatory.
"""
from __future__ import annotations
import json
import sqlite3
import re
import unicodedata
from pathlib import Path
from .contracts import canonical, digest
from .ingestion import file_hash
from .store import blocking_integrity_holds

TRUSTED_REVIEW_SHA256 = '0cd7c7b25228021f7ace9d591e70dc524e85d686faa4bc7186937cf6341ee98b'
PURPOSE = 'private_firstset_selected_source_evidence'
WITHHELD = {'source_audio','source_keys','source_transcripts','unreviewed_visual_semantics','teacher_validity','global_classification','learner_publication'}
TARGETS = {f'MS1-{letter}01':{f'fnd-{skill}-train',f'fnd-{skill}-transfer'} for letter,skill in [('R','reading'),('W','writing'),('L','listening'),('S','speaking')]}
SCHEMA = '''
CREATE TABLE IF NOT EXISTS corpus_selected_admissions(admission_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES corpus_runs(run_id),revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),import_id TEXT NOT NULL,anchor_id TEXT NOT NULL,target_content_sha256 TEXT NOT NULL,target_pointer TEXT NOT NULL,review_sha256 TEXT NOT NULL,integrity_state_sha256 TEXT NOT NULL,proof_json TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS corpus_selected_admissions_no_update BEFORE UPDATE ON corpus_selected_admissions BEGIN SELECT RAISE(ABORT,'selected admissions are immutable'); END;
CREATE TRIGGER IF NOT EXISTS corpus_selected_admissions_no_delete BEFORE DELETE ON corpus_selected_admissions BEGIN SELECT RAISE(ABORT,'selected admissions are immutable'); END;
'''

class AdmissionError(ValueError):
    pass

def initialize(conn):
    """Call during setup, before starting a backfill transaction."""
    if conn.in_transaction:raise AdmissionError('admission_setup_requires_no_transaction')
    conn.executescript(SCHEMA)

def _identity(value):
    return unicodedata.normalize('NFKC',value).strip().casefold().rstrip('/').split('/')[-1]

def _pointer(value,path):
    if not path.startswith('/') or path=='/':raise AdmissionError('exact_target_source_pointer_required')
    for raw in path[1:].split('/'):
        if '~' in raw.replace('~0','').replace('~1',''):raise AdmissionError('invalid_json_pointer')
        part=raw.replace('~1','/').replace('~0','~')
        try:value=value[int(part)] if isinstance(value,list) and part.isdigit() else value[part]
        except (KeyError,IndexError,TypeError,ValueError):raise AdmissionError('target_pointer_missing') from None
    return value

def evidence(conn,revision,pages):
    result=[]
    for number in pages:
        row=conn.execute('SELECT * FROM corpus_pages WHERE revision_id=? AND page_number=?',(revision,number)).fetchone()
        if not row or row['status']!='extracted' or digest(row['text'])!=row['text_sha256']:raise AdmissionError('page_not_verified')
        pid=row['page_id'];chunks=[dict(x) for x in conn.execute('SELECT * FROM corpus_chunks WHERE page_id=? ORDER BY ordinal,chunk_id',(pid,))]
        if not chunks or any(digest(x['text'])!=x['text_sha256'] for x in chunks):raise AdmissionError('chunk_not_verified')
        regions=[dict(x) for x in conn.execute('SELECT * FROM corpus_regions WHERE page_id=? ORDER BY region_id',(pid,))]
        entities=[dict(x) for x in conn.execute('SELECT * FROM corpus_entities WHERE page_id=? ORDER BY entity_id',(pid,))]
        images=[x for x in entities if x['kind']=='page-image']
        if not images or any(not x['raw_image_sha256'] for x in images):raise AdmissionError('required_page_image_missing')
        result.append({'page':dict(row),'chunks':chunks,'regions':regions,'entities':entities})
    return result

def integrity_state_sha256(conn,run_id):
    audits=[dict(x) for x in conn.execute('SELECT * FROM corpus_integrity_audits WHERE run_id=? ORDER BY audit_id',(run_id,))]
    holds=[dict(x) for x in conn.execute('SELECT h.* FROM corpus_integrity_holds h JOIN corpus_integrity_audits a USING(audit_id) WHERE a.run_id=? ORDER BY hold_id',(run_id,))]
    return digest(canonical({'audits':audits,'holds':holds}))

def _verify_images(conn,original,observed):
    try:import pymupdf
    except ImportError:raise AdmissionError('local_render_verifier_unavailable') from None
    databases=conn.execute('PRAGMA database_list').fetchall()
    main=next((row[2] for row in databases if row[1]=='main'),None)
    if not main:raise AdmissionError('private_cache_root_unavailable')
    cache=Path(main).resolve().parent
    with pymupdf.open(original) as source:
        for item in observed:
            stored=item['page'];page=source[stored['page_number']-1]
            pix=page.get_pixmap(matrix=pymupdf.Matrix(2,2),alpha=False)
            if digest(pix.samples)!=stored['page_sha256']:raise AdmissionError('original_render_hash_changed')
            if stored['method']=='pymupdf-native' and digest(page.get_text(sort=True))!=stored['text_sha256']:raise AdmissionError('original_native_text_changed')
            encoded=digest(pix.pil_tobytes(format='JPEG',quality=88))
            images=[r for r in item['regions'] if r['kind']=='page-image']
            if not images:raise AdmissionError('verified_page_image_missing')
            for region in images:
                metadata=json.loads(region['metadata_json'])
                if metadata.get('image_sha256')!=encoded:raise AdmissionError('regenerated_image_hash_changed')
                target=(cache/metadata['image_path']).resolve()
                if cache not in target.parents:raise AdmissionError('image_cache_path_outside_private_store')
                if target.exists() and (target.is_symlink() or file_hash(target)!=encoded):raise AdmissionError('cached_image_tampered')

def _proof(conn,review,*,import_id,anchor_id,occurrence_id,target_pointer,target_content_sha256,source_root,source_index_path,dependency_declarations):
    if digest(canonical(review))!=TRUSTED_REVIEW_SHA256:raise AdmissionError('untrusted_or_changed_review')
    if review.get('purpose')!=PURPOSE or review.get('teacherApproval')!='pending' or review.get('reviewerKind')!='independent_engineering_agent':raise AdmissionError('engineering_scope_only')
    if set(review.get('withheld',[]))!=WITHHELD or dependency_declarations!={key:'not_claimed' for key in WITHHELD}:raise AdmissionError('unadmitted_dependency_or_claim')
    if anchor_id not in review.get('anchors',{}):raise AdmissionError('anchor_not_reviewed')
    target=conn.execute('SELECT * FROM authored_imports WHERE import_id=?',(import_id,)).fetchone()
    if not target or target['content_id'] not in TARGETS.get(anchor_id,set()) or target['kind']!='unit':raise AdmissionError('target_outside_reviewed_firstset')
    if _identity(target['author_agent'])==_identity(review['reviewerId']):raise AdmissionError('author_cannot_review_admission')
    payload=json.loads(target['payload_json'])
    if digest(canonical(payload))!=target_content_sha256 or target['content_hash']!=target_content_sha256 or payload.get('version')!=target['version']:raise AdmissionError('target_version_or_hash_changed')
    if not re.fullmatch(r'/provenance/sourceRefs/(0|[1-9][0-9]*)',target_pointer):raise AdmissionError('exact_source_reference_pointer_required')
    if _pointer(payload,target_pointer)!=anchor_id:raise AdmissionError('pointer_does_not_bind_anchor')
    index_path=Path(source_index_path).resolve()
    if index_path.name!='source-index.json' or file_hash(index_path)!=review['sourceIndexSha256']:raise AdmissionError('source_index_changed')
    index=json.loads(index_path.read_text());captured=json.loads(target['source_index_json'])
    entry_map={item['id']:item for item in index['entries']}
    if digest(canonical(index))!=target['source_index_hash'] or not isinstance(captured,dict) or anchor_id not in captured or any(key not in entry_map or value!=entry_map[key] for key,value in captured.items()):raise AdmissionError('target_source_index_changed')
    entries=[x for x in index['entries'] if x['id']==anchor_id]
    if len(entries)!=1:raise AdmissionError('ambiguous_source_entry')
    entry=entries[0];scope=review['anchors'][anchor_id]
    if entry['pdfPages']!=scope['pages'] or entry['fileSha256']!=review['assetSha256']:raise AdmissionError('source_scope_changed')
    run=conn.execute('SELECT * FROM corpus_runs WHERE run_id=?',(review['runId'],)).fetchone()
    if not run or not run['snapshot_json'] or not json.loads(run['snapshot_json']).get('terminal') or run['tool_config_sha256']!=review['policySha256']:raise AdmissionError('run_not_exact_terminal')
    extraction=conn.execute('SELECT * FROM corpus_extractions WHERE revision_id=?',(review['revisionId'],)).fetchone()
    if not extraction or extraction['asset_id']!=review['assetSha256'] or extraction['tool_config_sha256']!=review['policySha256']:raise AdmissionError('source_revision_changed')
    quality=json.loads(extraction['quality_json'])
    if quality.get('source_hash_verified') is not True or quality.get('manifest_hash_verified') is not True:raise AdmissionError('source_end_hash_unverified')
    bound=conn.execute('SELECT * FROM corpus_run_extractions WHERE run_id=? AND asset_id=? AND revision_id=?',(review['runId'],review['assetSha256'],review['revisionId'])).fetchone()
    occurrence=conn.execute('SELECT o.*,a.territory,a.processing_scope,a.distribution_scope,a.evidence FROM corpus_source_occurrences o JOIN corpus_authorities a USING(authority_id) WHERE occurrence_id=? AND asset_id=?',(occurrence_id,review['assetSha256'])).fetchone()
    if not bound or not occurrence or occurrence['relative_path']!=entry['relativePath'] or not occurrence['processing_scope'] or not occurrence['evidence'] or occurrence_id!=review['occurrenceId'] or digest(canonical(dict(occurrence)))!=review['occurrenceAuthoritySha256']:raise AdmissionError('occurrence_authority_unverified')
    if not conn.execute('SELECT 1 FROM corpus_run_files WHERE run_id=? AND occurrence_id=? AND revision_id=?',(review['runId'],occurrence_id,review['revisionId'])).fetchone():raise AdmissionError('occurrence_not_in_terminal_run')
    root=Path(source_root).resolve();original=(root/entry['relativePath']).resolve()
    if root not in original.parents or file_hash(original)!=review['assetSha256']:raise AdmissionError('live_original_hash_changed')
    audit=conn.execute('SELECT * FROM corpus_integrity_audits WHERE run_id=? AND report_sha256=?',(review['runId'],review['integrityAuditReportSha256'])).fetchone()
    if not audit or audit['manifest_sha256']!=run['manifest_sha256']:raise AdmissionError('integrity_audit_missing')
    if integrity_state_sha256(conn,review['runId'])!=review['integrityStateSha256']:raise AdmissionError('reviewed_integrity_state_changed')
    observed=evidence(conn,review['revisionId'],scope['pages'])
    if digest(canonical(observed))!=scope['evidenceSha256']:raise AdmissionError('reviewed_page_chunk_image_evidence_changed')
    _verify_images(conn,original,observed)
    page_ids=[x['page']['page_id'] for x in observed]
    if blocking_integrity_holds(conn,review['assetSha256'],review['revisionId'],page_ids=page_ids):raise AdmissionError('selected_evidence_held')
    return {'review':review,'review_sha256':TRUSTED_REVIEW_SHA256,'run_id':review['runId'],'revision_id':review['revisionId'],'anchor_id':anchor_id,'import_id':import_id,'target_content_id':target['content_id'],'target_version':target['version'],'target_content_sha256':target_content_sha256,'target_pointer':target_pointer,'occurrence_id':occurrence_id,'occurrence_authority_sha256':digest(canonical(dict(occurrence))),'integrity_state_sha256':integrity_state_sha256(conn,review['runId']),'evidence_sha256':scope['evidenceSha256'],'page_ids':page_ids,'chunk_ids':[x['chunk_id'] for p in observed for x in p['chunks']],'image_entity_ids':[x['entity_id'] for p in observed for x in p['entities'] if x['kind']=='page-image'],'source_root':str(root),'source_index_path':str(index_path),'dependency_declarations':dependency_declarations,'purpose':PURPOSE,'semantic_completion':False,'teacher_approval':'pending','page20_image_text':'required_visual_dependency_not_semantically_attested' if anchor_id=='MS1-S01' else 'not_applicable'}

def create_admission(conn,review_manifest,**scope):
    """Append only. Caller owns transaction/commit; initialization is separate."""
    proof=_proof(conn,review_manifest,**scope);admission_id=digest(canonical(proof))
    conn.execute('INSERT OR IGNORE INTO corpus_selected_admissions VALUES(?,?,?,?,?,?,?,?,?,?)',(admission_id,proof['run_id'],proof['revision_id'],proof['import_id'],proof['anchor_id'],proof['target_content_sha256'],proof['target_pointer'],proof['review_sha256'],proof['integrity_state_sha256'],canonical(proof)))
    return admission_id

def validate_admission(conn,admission_id,*,import_id,target_pointer,target_content_sha256):
    row=conn.execute('SELECT * FROM corpus_selected_admissions WHERE admission_id=?',(admission_id,)).fetchone()
    if not row:raise AdmissionError('admission_missing')
    proof=json.loads(row['proof_json'])
    if digest(canonical(proof))!=admission_id or (proof['import_id'],proof['target_pointer'],proof['target_content_sha256'])!=(import_id,target_pointer,target_content_sha256):raise AdmissionError('admission_target_or_record_changed')
    fresh=_proof(conn,proof['review'],**{key:proof[key] for key in ('import_id','anchor_id','occurrence_id','target_pointer','target_content_sha256','source_root','source_index_path','dependency_declarations')})
    if fresh!=proof:raise AdmissionError('admission_stale')
    return proof

def resolve_admitted_chunk(conn,admission_id,chunk_id,**target):
    proof=validate_admission(conn,admission_id,**target)
    if chunk_id not in proof['chunk_ids']:raise AdmissionError('chunk_outside_selected_scope')
    return dict(conn.execute('SELECT * FROM corpus_chunks WHERE chunk_id=?',(chunk_id,)).fetchone())
