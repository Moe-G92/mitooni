"""Additive SQLite authoring store, deliberately isolated from serving databases."""
from __future__ import annotations
import json
import os
import stat
import sqlite3
from pathlib import Path

SCHEMA = '''
CREATE TABLE IF NOT EXISTS corpus_authorities(authority_id TEXT PRIMARY KEY,territory TEXT NOT NULL,processing_scope TEXT NOT NULL,distribution_scope TEXT NOT NULL,recorded_at TEXT NOT NULL,evidence TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_assets(asset_id TEXT PRIMARY KEY,revision_id TEXT NOT NULL,source_sha256 TEXT UNIQUE NOT NULL,rights_hash TEXT NOT NULL,media_type TEXT NOT NULL,byte_size INTEGER NOT NULL,extraction_version TEXT NOT NULL,status TEXT NOT NULL,expected_pages INTEGER,track TEXT,edition TEXT,format_status TEXT,metadata_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_extractions(revision_id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),tool_config_sha256 TEXT NOT NULL,extraction_version TEXT NOT NULL,metadata_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_aliases(alias_id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),relative_path TEXT UNIQUE NOT NULL,root_name TEXT NOT NULL,authority_id TEXT NOT NULL REFERENCES corpus_authorities(authority_id),track TEXT,edition TEXT,format_status TEXT,parent_asset_id TEXT,member_path TEXT);
CREATE TABLE IF NOT EXISTS corpus_source_occurrences(occurrence_id TEXT PRIMARY KEY,alias_id TEXT NOT NULL,asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),relative_path TEXT NOT NULL,root_name TEXT NOT NULL,authority_id TEXT NOT NULL REFERENCES corpus_authorities(authority_id),track TEXT,edition TEXT,format_status TEXT,parent_asset_id TEXT,member_path TEXT,recorded_at TEXT NOT NULL,UNIQUE(relative_path,asset_id,authority_id));
CREATE TABLE IF NOT EXISTS corpus_runs(run_id TEXT PRIMARY KEY,manifest_sha256 TEXT NOT NULL,extraction_version TEXT NOT NULL,started_at TEXT NOT NULL,completed_at TEXT,status TEXT NOT NULL,manifest_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_run_files(run_id TEXT NOT NULL REFERENCES corpus_runs(run_id),relative_path TEXT NOT NULL,expected_sha256 TEXT NOT NULL,occurrence_id TEXT REFERENCES corpus_source_occurrences(occurrence_id),revision_id TEXT REFERENCES corpus_extractions(revision_id),disposition TEXT NOT NULL,PRIMARY KEY(run_id,relative_path));
CREATE TABLE IF NOT EXISTS corpus_run_extractions(run_id TEXT NOT NULL REFERENCES corpus_runs(run_id),asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),status TEXT NOT NULL,error TEXT,PRIMARY KEY(run_id,asset_id));
CREATE TABLE IF NOT EXISTS corpus_run_assets(run_id TEXT NOT NULL REFERENCES corpus_runs(run_id),asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),status TEXT NOT NULL,error TEXT,PRIMARY KEY(run_id,asset_id));
CREATE TABLE IF NOT EXISTS corpus_pages(page_id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),page_number INTEGER NOT NULL,page_sha256 TEXT NOT NULL,text_sha256 TEXT NOT NULL,text TEXT NOT NULL,method TEXT NOT NULL,status TEXT NOT NULL,width REAL,height REAL,error TEXT,UNIQUE(revision_id,page_number));
CREATE TABLE IF NOT EXISTS corpus_regions(region_id TEXT PRIMARY KEY,page_id TEXT NOT NULL REFERENCES corpus_pages(page_id),kind TEXT NOT NULL,bbox_json TEXT NOT NULL,text TEXT NOT NULL,metadata_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_chunks(chunk_id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),page_id TEXT REFERENCES corpus_pages(page_id),text_sha256 TEXT NOT NULL,text TEXT NOT NULL,page_start INTEGER,page_end INTEGER,member_path TEXT,time_start REAL,time_end REAL,modality TEXT NOT NULL,extraction_method TEXT NOT NULL,extraction_version TEXT NOT NULL,quality TEXT NOT NULL,disposition TEXT NOT NULL,ordinal INTEGER NOT NULL,UNIQUE(revision_id,page_id,ordinal));
CREATE TABLE IF NOT EXISTS corpus_media(media_id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),duration_seconds REAL,codec TEXT,channels INTEGER,sample_rate INTEGER,status TEXT NOT NULL,metadata_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_transcripts(transcript_id TEXT PRIMARY KEY,media_id TEXT NOT NULL REFERENCES corpus_media(media_id),chunk_id TEXT REFERENCES corpus_chunks(chunk_id),text TEXT NOT NULL,text_sha256 TEXT NOT NULL,origin TEXT NOT NULL,alignment_status TEXT NOT NULL,metadata_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_jobs(job_id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),page_id TEXT REFERENCES corpus_pages(page_id),kind TEXT NOT NULL,status TEXT NOT NULL,reason TEXT NOT NULL,retryable INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_integrity_audits(audit_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES corpus_runs(run_id),policy_sha256 TEXT NOT NULL,manifest_sha256 TEXT NOT NULL,report_sha256 TEXT NOT NULL,method TEXT NOT NULL,recorded_at TEXT NOT NULL,evidence_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_integrity_holds(hold_id TEXT PRIMARY KEY,audit_id TEXT NOT NULL REFERENCES corpus_integrity_audits(audit_id),asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),page_id TEXT REFERENCES corpus_pages(page_id),kind TEXT NOT NULL,blocks_default INTEGER NOT NULL,reason TEXT NOT NULL,evidence_json TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS corpus_integrity_audits_no_update BEFORE UPDATE ON corpus_integrity_audits BEGIN SELECT RAISE(ABORT,'integrity audits are immutable'); END;
CREATE TRIGGER IF NOT EXISTS corpus_integrity_audits_no_delete BEFORE DELETE ON corpus_integrity_audits BEGIN SELECT RAISE(ABORT,'integrity audits are immutable'); END;
CREATE TRIGGER IF NOT EXISTS corpus_integrity_holds_no_update BEFORE UPDATE ON corpus_integrity_holds BEGIN SELECT RAISE(ABORT,'integrity holds are append-only'); END;
CREATE TRIGGER IF NOT EXISTS corpus_integrity_holds_no_delete BEFORE DELETE ON corpus_integrity_holds BEGIN SELECT RAISE(ABORT,'integrity holds are append-only'); END;
CREATE TABLE IF NOT EXISTS corpus_page_derivations(page_id TEXT PRIMARY KEY REFERENCES corpus_pages(page_id),from_page_id TEXT NOT NULL REFERENCES corpus_pages(page_id),source_sha256 TEXT NOT NULL,pixel_sha256 TEXT NOT NULL,text_sha256 TEXT NOT NULL,verification_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_archive_members(member_id TEXT PRIMARY KEY,parent_asset_id TEXT NOT NULL REFERENCES corpus_assets(asset_id),member_path TEXT NOT NULL,byte_size INTEGER NOT NULL,crc32 INTEGER NOT NULL,compression INTEGER NOT NULL,encrypted INTEGER NOT NULL,status TEXT NOT NULL,child_asset_id TEXT REFERENCES corpus_assets(asset_id),metadata_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_entities(entity_id TEXT PRIMARY KEY,revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),page_id TEXT REFERENCES corpus_pages(page_id),region_id TEXT REFERENCES corpus_regions(region_id),kind TEXT NOT NULL,reading_order INTEGER,bbox_json TEXT,raw_image_sha256 TEXT,raw_image_path TEXT,text_sha256 TEXT,status TEXT NOT NULL,confidence REAL,metadata_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corpus_edges(edge_id TEXT PRIMARY KEY,revision_id TEXT NOT NULL REFERENCES corpus_extractions(revision_id),source_entity_id TEXT NOT NULL REFERENCES corpus_entities(entity_id),target_entity_id TEXT NOT NULL REFERENCES corpus_entities(entity_id),relation TEXT NOT NULL,status TEXT NOT NULL,confidence REAL,evidence_json TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS corpus_chunks_revision ON corpus_chunks(revision_id,page_start);
CREATE INDEX IF NOT EXISTS corpus_alias_asset ON corpus_aliases(asset_id);
'''

def connect(path: str | Path) -> sqlite3.Connection:
    target=Path(path)
    missing=[];parent=target.parent
    while not parent.exists():missing.append(parent);parent=parent.parent
    for directory in reversed(missing):directory.mkdir(mode=0o700)
    flags=os.O_RDWR|os.O_CREAT|getattr(os,'O_NOFOLLOW',0)
    fd=os.open(target,flags,0o600)
    try:
        info=os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_nlink!=1:raise ValueError('private store must be an unlinked regular file')
        os.fchmod(fd,0o600)
    finally:os.close(fd)
    for suffix in ('-wal','-shm'):
        side=Path(str(target)+suffix)
        if side.is_symlink():raise ValueError('private sidecar symlink refused')
    conn = sqlite3.connect(target, timeout=60)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA busy_timeout=60000')
    for suffix in ('-wal','-shm'):
        side=Path(str(target)+suffix)
        if side.exists():side.chmod(0o600)
    return conn

def initialize(conn):
    conn.executescript(SCHEMA)
    columns = {row[1] for row in conn.execute('PRAGMA table_info(corpus_extractions)')}
    for name, definition in [('status', "TEXT NOT NULL DEFAULT 'pending'"),('quality_json',"TEXT NOT NULL DEFAULT '{}'"),('extent_json',"TEXT NOT NULL DEFAULT '{}'"),('policy_hash',"TEXT NOT NULL DEFAULT 'alias-scoped-no-grant'")]:
        if name not in columns:
            conn.execute(f'ALTER TABLE corpus_extractions ADD COLUMN {name} {definition}')
    run_columns={row[1] for row in conn.execute('PRAGMA table_info(corpus_runs)')}
    for name,definition in [('tool_config_sha256',"TEXT"),('snapshot_json',"TEXT")]:
        if name not in run_columns:
            conn.execute(f'ALTER TABLE corpus_runs ADD COLUMN {name} {definition}')
    conn.commit()

def read_chunks(conn) -> list[dict]:
    rows = conn.execute("SELECT c.*,a.source_sha256,a.media_type,a.track,a.edition,a.format_status FROM corpus_chunks c JOIN corpus_assets a ON a.asset_id=c.asset_id AND a.revision_id=c.revision_id JOIN corpus_extractions x ON x.revision_id=c.revision_id WHERE a.status='complete' AND x.status='complete' AND json_extract(x.quality_json,'$.source_hash_verified')=1 AND c.disposition='extracted' AND NOT EXISTS(SELECT 1 FROM corpus_integrity_holds h WHERE h.asset_id=a.asset_id AND h.revision_id=c.revision_id AND h.blocks_default=1) ORDER BY c.asset_id,c.page_start,c.ordinal").fetchall()
    result = []
    for row in rows:
        value = dict(row)
        value['aliases'] = [dict(x) for x in conn.execute('SELECT * FROM corpus_source_occurrences WHERE asset_id=? ORDER BY relative_path', (row['asset_id'],))]
        result.append(value)
    return result


def bind_run_snapshot(conn, run_id: str, tool_config_sha256: str, *, terminal=False) -> dict:
    """Bind only the frozen manifest/policy, never infer from current asset pointers.

    Terminal serialized summaries remain stable after new extractions/retries.
    """
    from collections import Counter
    from .contracts import canonical, digest
    run=conn.execute('SELECT * FROM corpus_runs WHERE run_id=?',(run_id,)).fetchone()
    if run is None: raise ValueError('unknown corpus run')
    if run['tool_config_sha256'] and run['tool_config_sha256'] != tool_config_sha256:
        raise ValueError('immutable run policy conflict')
    if run['snapshot_json']:
        return json.loads(run['snapshot_json'])
    manifest=json.loads(run['manifest_json'])
    statuses=Counter();revision_ids=[];missing=[]
    for original in manifest:
        asset=original['sha256'];revision=digest(canonical([asset,tool_config_sha256]))
        extraction=conn.execute('SELECT * FROM corpus_extractions WHERE revision_id=?',(revision,)).fetchone()
        occurrence=conn.execute('SELECT occurrence_id FROM corpus_source_occurrences WHERE relative_path=? AND asset_id=? ORDER BY recorded_at LIMIT 1',(original['path'],asset)).fetchone()
        state=extraction['status'] if extraction else 'not-admitted'
        statuses[state]+=1
        conn.execute('INSERT INTO corpus_run_files VALUES(?,?,?,?,?,?) ON CONFLICT(run_id,relative_path) DO UPDATE SET occurrence_id=excluded.occurrence_id,revision_id=excluded.revision_id,disposition=excluded.disposition',(run_id,original['path'],asset,occurrence[0] if occurrence else None,revision if extraction else None,state))
        if extraction:
            revision_ids.append(revision)
            conn.execute('INSERT INTO corpus_run_extractions VALUES(?,?,?,?,?) ON CONFLICT(run_id,asset_id) DO UPDATE SET status=excluded.status',(run_id,asset,revision,state,None))
        else:missing.append(original['path'])
    archive_members=Counter()
    for asset in sorted({entry['sha256'] for entry in manifest}):
        for member in conn.execute('SELECT * FROM corpus_archive_members WHERE parent_asset_id=?',(asset,)):
            archive_members[member['status']]+=1
            if member['child_asset_id']:
                child_revision=digest(canonical([member['child_asset_id'],tool_config_sha256]))
                child=conn.execute('SELECT status FROM corpus_extractions WHERE revision_id=?',(child_revision,)).fetchone()
                if child:
                    revision_ids.append(child_revision)
                    conn.execute('INSERT INTO corpus_run_extractions VALUES(?,?,?,?,?) ON CONFLICT(run_id,asset_id) DO UPDATE SET status=excluded.status',(run_id,member['child_asset_id'],child_revision,child[0],None))
    unique=sorted(set(revision_ids));page_states=Counter();methods=Counter();jobs=Counter();types=Counter();duration=0;media_count=0;chars=0
    for revision in unique:
        for row in conn.execute('SELECT status,method,length(text) chars FROM corpus_pages WHERE revision_id=?',(revision,)):
            page_states[row['status']]+=1;methods[row['method']]+=1;chars+=row['chars']
        for row in conn.execute("SELECT kind FROM corpus_jobs WHERE revision_id=? AND status='blocked'",(revision,)):jobs[row['kind']]+=1
        for row in conn.execute('SELECT kind,COUNT(*) n FROM corpus_entities WHERE revision_id=? GROUP BY kind',(revision,)):types[row['kind']]+=row['n']
        for row in conn.execute('SELECT duration_seconds FROM corpus_media WHERE revision_id=?',(revision,)):duration+=row[0] or 0;media_count+=1
    result={'run_id':run_id,'manifest_sha256':run['manifest_sha256'],'tool_config_sha256':tool_config_sha256,'original_files':len(manifest),'original_statuses':dict(statuses),'missing_paths':missing,'page_statuses':dict(page_states),'page_methods':dict(methods),'source_entities':dict(types),'blocked_jobs':dict(jobs),'archive_member_statuses':dict(archive_members),'audio_files':media_count,'audio_seconds':duration,'extracted_characters':chars,'token_estimate_char_div_4':round(chars/4),'semantic_completion':False,'terminal':terminal}
    if terminal and (missing or statuses.get('pending')):
        raise ValueError('cannot finalize a run with unprocessed original assets')
    conn.execute('UPDATE corpus_runs SET tool_config_sha256=?,snapshot_json=? WHERE run_id=?',(tool_config_sha256,canonical(result) if terminal else None,run_id))
    conn.commit()
    return result

def blocking_integrity_holds(conn, asset_id: str, revision_id: str, *, page_ids: list[str] | None = None) -> list[dict]:
    """Shared fail-closed source gate for private readers, anchors and graph binds.

    The default checks the entire asset. Only a separately validated explicit
    selected-page admission may call the narrow page predicate.
    """
    values: list[object] = [asset_id, revision_id]
    where = 'asset_id=? AND revision_id=? AND blocks_default=1'
    if page_ids is not None:
        if not page_ids:
            raise ValueError('selected scope must bind nonempty page identities')
        where += ' AND (page_id IS NULL OR page_id IN (' + ','.join('?' for _ in page_ids) + '))'
        values.extend(page_ids)
    return [dict(row) for row in conn.execute('SELECT * FROM corpus_integrity_holds WHERE '+where+' ORDER BY hold_id',values)]
