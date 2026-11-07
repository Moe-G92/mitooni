"""Explicit, durable OpenAI Batch transport. Construction never performs network IO.

Callers supply approved configuration and an SDK client; this module never reads keys.
Unknown remote mutation outcomes remain fenced until known-ID reconciliation.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from decimal import Decimal
import os
import hashlib
from pathlib import Path
import re
import stat
import sqlite3
import logging

import httpx
from openai import OpenAI
import openai
from . import synthesis as s

BASE_URL = 'https://api.openai.com/v1/'
ENDPOINT = '/v1/responses'
MAX_REQUEST_BYTES = 190_000_000
MAX_RESULT_BYTES = 190_000_000


class _QuotaStream(httpx.SyncByteStream):
    def __init__(self,stream,limit):self.stream,self.limit=stream,limit
    def __iter__(self):
        total=0
        try:
            for chunk in self.stream:
                total+=len(chunk)
                if total>self.limit:raise s.CorpusError('provider_response_byte_limit')
                yield chunk
        finally:
            self.stream.close()
    def close(self):self.stream.close()


class _QuotaTransport(httpx.BaseTransport):
    """Bound bodies before SDK eager error/JSON reads can buffer them."""
    def __init__(self,inner):self.inner=inner
    def handle_request(self,request):
        request.headers['Accept-Encoding']='identity'
        response=self.inner.handle_request(request)
        if response.headers.get('content-encoding','identity').lower()!='identity':
            response.close()
            raise s.CorpusError('encoded_provider_response_rejected')
        limit=MAX_RESULT_BYTES if response.is_success and request.url.path.endswith('/content') else 1_000_000
        return httpx.Response(response.status_code,headers=response.headers,stream=_QuotaStream(response.stream,limit),extensions=response.extensions)
    def close(self):self.inner.close()


def silence_provider_logs():
    """Private authoring never emits SDK request bodies, headers or error payloads."""
    roots=('openai','httpx','httpcore')
    names=set(roots)|{'openai._base_client'}|{name for name in logging.Logger.manager.loggerDict if any(name.startswith(root+'.') for root in roots)}
    for name in names:
        logger=logging.getLogger(name)
        logger.disabled=True
        logger.setLevel(logging.CRITICAL+1)


def bounded_http_client(*,transport=None,timeout=60):
    """Construct an exclusively owned client using public httpx transport injection.

    No network IO occurs during construction. Caller/SDK owns and closes client.
    """
    silence_provider_logs()
    return httpx.Client(transport=_QuotaTransport(transport if transport is not None else httpx.HTTPTransport(retries=0,trust_env=False)),trust_env=False,follow_redirects=False,timeout=timeout)


@dataclass(frozen=True)
class Approval:
    """An externally approved *single batch* scope, not a claim of user approval."""
    reference: str
    model: str
    project: str
    organization: str | None
    input_token_ceiling: int
    output_token_ceiling: int
    input_usd_per_million: str
    output_usd_per_million: str
    cap_usd: str

    def validate(self):
        if not all(isinstance(v,str) and v.strip() for v in (self.reference,self.model,self.project)):
            raise s.CorpusError('explicit_approval_configuration_required')
        if self.organization is not None and not self.organization.strip():
            raise s.CorpusError('invalid_organization')
        if type(self.input_token_ceiling) is not int or type(self.output_token_ceiling) is not int or min(self.input_token_ceiling,self.output_token_ceiling)<=0:
            raise s.CorpusError('invalid_token_ceiling')
        try:
            ip,op,cap=map(Decimal,(self.input_usd_per_million,self.output_usd_per_million,self.cap_usd))
            if not all(x.is_finite() and x>0 for x in (ip,op,cap)): raise ValueError()
            if (ip*self.input_token_ceiling+op*self.output_token_ceiling)/1_000_000>cap: raise ValueError()
        except (ValueError,ArithmeticError):
            raise s.CorpusError('approval_budget_exceeded') from None


def initialize(conn):
    conn.execute('''CREATE TABLE IF NOT EXISTS corpus_dispatch(
        dispatch_id TEXT PRIMARY KEY,batch_key TEXT UNIQUE NOT NULL REFERENCES synthesis_batches(batch_key),
        approval_json TEXT NOT NULL,manifest_json TEXT NOT NULL,request_path TEXT NOT NULL,
        state TEXT NOT NULL,file_id TEXT,batch_id TEXT,result_hash TEXT)''')
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS corpus_dispatch_approval_reference ON corpus_dispatch(json_extract(approval_json,'$.reference'))")
    conn.commit()


def _private_path(path):
    path=Path(path).absolute()
    if any(x in {'public','content','.git'} for x in path.parts): raise s.CorpusError('private_path_required')
    for parent in (path,*path.parents):
        if parent.is_symlink(): raise s.CorpusError('artifact_symlink')
    return path


def read_private(path,limit):
    path=_private_path(path)
    fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW)
    with os.fdopen(fd,'rb') as f:
        st=os.fstat(f.fileno())
        if not stat.S_ISREG(st.st_mode) or st.st_mode & 0o077 or st.st_uid!=os.getuid() or st.st_size>limit:
            raise s.CorpusError('private_artifact_permissions_or_size')
        value=f.read(limit+1)
    if len(value)>limit: raise s.CorpusError('artifact_byte_limit')
    return value


def _manifest(conn,batch_key):
    # Mandatory public owner validator; never silently substitute a weaker check.
    batch=conn.execute('SELECT * FROM synthesis_batches WHERE batch_key=?',(batch_key,)).fetchone()
    validator=getattr(s,'validate_bound_batch' if batch and batch['status'] in {'submitted','collected'} else 'validate_prepared_batch',None)
    if validator is None: raise s.CorpusError('synthesis_validation_seam_unavailable')
    validator(conn,batch_key)
    b=conn.execute('SELECT * FROM synthesis_batches WHERE batch_key=?',(batch_key,)).fetchone()
    run=conn.execute('SELECT * FROM synthesis_runs WHERE run_id=?',(b['run_id'],)).fetchone()
    if run['mode']!='provider': raise s.CorpusError('provider_run_required')
    jobs=[]; lines=[]
    for jid,token in sorted(s.read_json(b['expected_json']).items()):
        row=conn.execute('SELECT * FROM synthesis_jobs WHERE job_id=?',(jid,)).fetchone()
        request=s.read_json(row['request_json'])
        jobs.append({k:row[k] for k in ('job_id','attempt','lease_token','request_hash','model','rights_hash','input_hash','prompt_hash','schema_hash')})
        lines.append(s.canonical(dict(custom_id=jid,method='POST',url=ENDPOINT,body=request))+'\n')
    data=''.join(lines).encode()
    if hashlib.sha256(data).hexdigest()!=b['file_hash']: raise s.CorpusError('request_file_hash_mismatch')
    return dict(batch_key=batch_key,run_id=b['run_id'],config_hash=s.digest(run['config_json']),snapshot=run['corpus_snapshot_hash'],file_hash=b['file_hash'],jobs=jobs),data


def prepare(conn,batch_key,request_path,approval: Approval):
    """Local only. Caller must obtain actual approval before subsequent transport calls."""
    approval.validate()
    manifest,data=_manifest(conn,batch_key)
    if not data or len(data)>MAX_REQUEST_BYTES or len(manifest['jobs'])>50000: raise s.CorpusError('request_limit')
    if read_private(request_path,MAX_REQUEST_BYTES)!=data: raise s.CorpusError('request_file_hash_mismatch')
    requests=[s.read_json(line) for line in data.decode().splitlines()]
    if any(r['body']['model']!=approval.model for r in requests): raise s.CorpusError('approved_model_mismatch')
    # UTF-8 bytes are a conservative local bound, plus framing/schema allowance.
    # This is not a model tokenizer or provider usage count.
    if len(data)+1024*len(requests)>approval.input_token_ceiling or sum(r['body']['max_output_tokens'] for r in requests)>approval.output_token_ceiling:
        raise s.CorpusError('approved_token_ceiling_exceeded')
    identity=s.digest([manifest,asdict(approval)])
    with conn:
        old=conn.execute('SELECT * FROM corpus_dispatch WHERE batch_key=?',(batch_key,)).fetchone()
        if old:
            if old['dispatch_id']!=identity: raise s.CorpusError('immutable_dispatch_conflict')
            return identity
        if conn.execute("SELECT 1 FROM corpus_dispatch WHERE json_extract(approval_json,'$.reference')=?",(approval.reference,)).fetchone():
            raise s.CorpusError('approval_reference_already_reserved')
        try:
            conn.execute('INSERT INTO corpus_dispatch VALUES(?,?,?,?,?,?,?,?,?)',(identity,batch_key,s.canonical(asdict(approval)),s.canonical(manifest),str(_private_path(request_path)),'ready',None,None,None))
        except sqlite3.IntegrityError:
            raise s.CorpusError('dispatch_or_approval_reservation_conflict') from None
    return identity


class Dispatcher:
    def __init__(self,conn,client: OpenAI,approval: Approval):
        self.conn,self.client,self.approval=conn,client,approval
        approval.validate()
        if not isinstance(client,OpenAI): raise s.CorpusError('openai_sdk_client_required')
        self._client_check()
        self._bounded_transport=client._client._transport

    def _client_check(self):
        silence_provider_logs()
        c=self.client;a=self.approval
        if openai.__version__!='2.21.0' or httpx.__version__!='0.28.1':raise s.CorpusError('unreviewed_provider_sdk_version')
        if not isinstance(c._client._transport,_QuotaTransport):raise s.CorpusError('bounded_owned_http_client_required')
        t=c.timeout
        finite_timeout=isinstance(t,(int,float)) and 0<t<=120 or isinstance(t,httpx.Timeout) and all(v is not None and 0<v<=120 for v in (t.connect,t.read,t.write,t.pool))
        if str(c.base_url)!=BASE_URL or c.project!=a.project or c.organization!=a.organization or c.max_retries!=0 or not finite_timeout or c._client.follow_redirects:
            raise s.CorpusError('provider_configuration_mismatch')
        # Custom headers/query can override destination/account/content semantics.
        if c._custom_headers or c._custom_query or c._client.auth is not None or any(c._client.event_hooks.values()) or c._client.params or any(c._client._mounts.values()) or (hasattr(self,'_bounded_transport') and c._client._transport is not self._bounded_transport):
            raise s.CorpusError('provider_custom_configuration_rejected')

    def _check(self,identity):
        self._client_check()
        row=self.conn.execute('SELECT * FROM corpus_dispatch WHERE dispatch_id=?',(identity,)).fetchone()
        if not row or row['approval_json']!=s.canonical(asdict(self.approval)): raise s.CorpusError('dispatch_approval_mismatch')
        manifest,data=_manifest(self.conn,row['batch_key'])
        if s.canonical(manifest)!=row['manifest_json'] or s.digest([manifest,asdict(self.approval)])!=identity: raise s.CorpusError('dispatch_manifest_changed')
        batch=self.conn.execute('SELECT provider_id FROM synthesis_batches WHERE batch_key=?',(row['batch_key'],)).fetchone()
        if batch['provider_id'] is not None and (row['state'] not in {'submitted','collected'} or row['batch_id']!=batch['provider_id']):
            raise s.CorpusError('dispatch_provider_binding_conflict')
        if read_private(row['request_path'],MAX_REQUEST_BYTES)!=data: raise s.CorpusError('request_file_hash_mismatch')
        return row,data

    def _transition(self,identity,old,new,**values):
        allowed={'file_id','batch_id','result_hash'}
        if not set(values)<=allowed: raise s.CorpusError('invalid_dispatch_update')
        columns=['state=?']+[f'{k}=?' for k in values]
        with self.conn:
            changed=self.conn.execute(f"UPDATE corpus_dispatch SET {','.join(columns)} WHERE dispatch_id=? AND state=?",(new,*values.values(),identity,old)).rowcount
            if changed!=1: raise s.CorpusError('dispatch_state_conflict')

    def upload(self,identity):
        row,data=self._check(identity)
        self._transition(identity,'ready','upload_unknown')
        try:
            remote=self.client.files.create(file=(identity+'.jsonl',data,'application/jsonl'),purpose='batch')
            if remote.purpose!='batch' or remote.bytes!=len(data) or not re.fullmatch(r'file[-_][A-Za-z0-9_-]+',remote.id): raise ValueError()
        except Exception:
            raise s.CorpusError('upload_outcome_unknown_reconcile_only') from None
        self._transition(identity,'upload_unknown','uploaded',file_id=remote.id)
        return remote.id

    @staticmethod
    def _safe_read(call):
        try:
            return call()
        except s.CorpusError:
            raise
        except Exception:
            raise s.CorpusError('provider_read_failed_reconcile_same_operation') from None

    def _read_remote(self,file_id,limit):
        if not isinstance(file_id,str) or not re.fullmatch(r'file[-_][A-Za-z0-9_-]+',file_id): raise s.CorpusError('invalid_remote_file_id')
        return self._safe_read(lambda:self._download(file_id,limit))

    def _download(self,file_id,limit):
        chunks=[];size=0
        with self.client.files.with_streaming_response.content(file_id) as response:
            for chunk in response.iter_bytes(chunk_size=65536):
                size+=len(chunk)
                if size>limit: raise s.CorpusError('remote_artifact_byte_limit')
                chunks.append(chunk)
        return b''.join(chunks)

    def recover_unknown(self,identity,*,reason,extension_seconds=86400):
        """Explicit same-operation lease recovery; no network or new attempt/token.

        Only lost upload/submission replies qualify. Fresh mutation methods always
        use normal live validators; recovery is never an implicit retry path.
        """
        self._client_check()
        self.approval.validate()
        if not isinstance(reason,str) or not reason.strip() or len(reason)>1000:
            raise s.CorpusError('explicit_recovery_reason_required')
        row=self.conn.execute('SELECT * FROM corpus_dispatch WHERE dispatch_id=?',(identity,)).fetchone()
        if not row or row['state'] not in {'upload_unknown','submit_unknown','submitted'} or row['approval_json']!=s.canonical(asdict(self.approval)):
            raise s.CorpusError('unknown_recovery_scope_mismatch')
        if row['state']=='submitted' and not row['batch_id']:
            raise s.CorpusError('unknown_recovery_scope_mismatch')
        frozen=s.read_json(row['manifest_json'])
        if s.digest([frozen,asdict(self.approval)])!=identity:raise s.CorpusError('unknown_recovery_manifest_changed')
        batch=self.conn.execute('SELECT * FROM synthesis_batches WHERE batch_key=?',(row['batch_key'],)).fetchone()
        run=self.conn.execute('SELECT * FROM synthesis_runs WHERE run_id=?',(frozen['run_id'],)).fetchone()
        if not batch or batch['status']!='prepared' or batch['provider_id'] is not None or batch['run_id']!=frozen['run_id'] or not run or run['mode']!='provider' or s.digest(run['config_json'])!=frozen['config_hash'] or run['corpus_snapshot_hash']!=frozen['snapshot'] or not s.run_snapshot_current(self.conn,run):
            raise s.CorpusError('unknown_recovery_manifest_changed')
        tokens={j['job_id']:j['lease_token'] for j in frozen['jobs']}
        if s.read_json(batch['expected_json'])!=tokens or batch['file_hash']!=frozen['file_hash']:
            raise s.CorpusError('unknown_recovery_manifest_changed')
        lines=[]
        for expected in frozen['jobs']:
            job=self.conn.execute('SELECT * FROM synthesis_jobs WHERE job_id=?',(expected['job_id'],)).fetchone()
            if not job or job['state']!='prepared' or any(job[k]!=v for k,v in expected.items()):
                raise s.CorpusError('unknown_recovery_job_changed')
            lines.append(s.canonical(dict(custom_id=job['job_id'],method='POST',url=ENDPOINT,body=s.read_json(job['request_json'])))+'\n')
        data=''.join(lines).encode()
        if hashlib.sha256(data).hexdigest()!=frozen['file_hash'] or read_private(row['request_path'],MAX_REQUEST_BYTES)!=data:
            raise s.CorpusError('unknown_recovery_request_changed')
        recovery=getattr(s,'recover_prepared_reconciliation',None)
        if recovery is None:raise s.CorpusError('synthesis_recovery_seam_unavailable')
        result=recovery(self.conn,row['batch_key'],lease_tokens=tokens,reason=reason,extension_seconds=extension_seconds)
        self._check(identity)
        return result

    def reconcile_upload(self,identity,file_id):
        row,data=self._check(identity)
        if row['state']!='upload_unknown': raise s.CorpusError('reconciliation_state_conflict')
        if not isinstance(file_id,str) or not re.fullmatch(r'file[-_][A-Za-z0-9_-]+',file_id): raise s.CorpusError('invalid_remote_file_id')
        remote=self._safe_read(lambda:self.client.files.retrieve(file_id))
        if remote.id!=file_id or remote.purpose!='batch' or remote.bytes!=len(data) or self._read_remote(file_id,len(data))!=data:
            raise s.CorpusError('remote_file_mismatch')
        self._transition(identity,'upload_unknown','uploaded',file_id=file_id)

    def submit(self,identity):
        row,_=self._check(identity)
        self._transition(identity,'uploaded','submit_unknown')
        try:
            remote=self.client.batches.create(input_file_id=row['file_id'],endpoint=ENDPOINT,completion_window='24h',metadata={'dispatch_id':identity})
            self._batch_match(remote,identity,row['file_id'])
        except Exception:
            raise s.CorpusError('submission_outcome_unknown_reconcile_only') from None
        # Persist remote identity before binding; binding can safely be reconciled.
        self._transition(identity,'submit_unknown','submitted',batch_id=remote.id)
        s.bind_provider_batch(self.conn,row['batch_key'],remote.id)
        return remote.id

    @staticmethod
    def _batch_match(remote,identity,file_id):
        if remote.input_file_id!=file_id or remote.endpoint!=ENDPOINT or remote.completion_window!='24h' or (remote.metadata or {}).get('dispatch_id')!=identity or not re.fullmatch(r'batch[-_][A-Za-z0-9_-]+',remote.id):
            raise s.CorpusError('remote_batch_mismatch')

    def reconcile_submit(self,identity,batch_id):
        row,_=self._check(identity)
        if row['state'] not in {'submit_unknown','submitted'} or row['batch_id'] not in {None,batch_id}: raise s.CorpusError('reconciliation_state_conflict')
        if not isinstance(batch_id,str) or not re.fullmatch(r'batch[-_][A-Za-z0-9_-]+',batch_id): raise s.CorpusError('invalid_remote_batch_id')
        remote=self._safe_read(lambda:self.client.batches.retrieve(batch_id))
        self._batch_match(remote,identity,row['file_id'])
        if remote.id!=batch_id: raise s.CorpusError('remote_batch_mismatch')
        if row['state']=='submit_unknown': self._transition(identity,'submit_unknown','submitted',batch_id=batch_id)
        s.bind_provider_batch(self.conn,row['batch_key'],batch_id)

    def retrieve(self,identity,output_path,*,max_bytes=MAX_RESULT_BYTES):
        if type(max_bytes) is not int or not 1<=max_bytes<=MAX_RESULT_BYTES: raise s.CorpusError('invalid_result_limit')
        row,_=self._check(identity)
        if row['state']!='submitted': raise s.CorpusError('dispatch_state_conflict')
        remote=self._safe_read(lambda:self.client.batches.retrieve(row['batch_id']))
        self._batch_match(remote,identity,row['file_id'])
        if remote.id!=row['batch_id']: raise s.CorpusError('remote_batch_mismatch')
        if remote.status not in {'completed','expired','cancelled','failed'}: return {'status':remote.status,'collected':False}
        parts=[]; remaining=max_bytes
        for fid in (remote.output_file_id,remote.error_file_id):
            if fid:
                content=self._read_remote(fid,remaining)
                remaining-=len(content);parts.append(content.rstrip(b'\n'))
        data=b'\n'.join(p for p in parts if p)
        if len(data)>max_bytes: raise s.CorpusError('remote_artifact_byte_limit')
        path=_private_path(output_path)
        if path.exists():
            if read_private(path,max_bytes)!=data: raise s.CorpusError('immutable_result_conflict')
        else: s.private_write(path,data.decode('utf-8'))
        manifest=s.read_json(row['manifest_json'])
        tokens={j['job_id']:j['lease_token'] for j in manifest['jobs']}
        result=s.collect_batch(self.conn,row['batch_key'],path,batch_id=row['batch_id'],lease_tokens=tokens)
        self._transition(identity,'submitted','collected',result_hash=hashlib.sha256(data).hexdigest())
        return result
