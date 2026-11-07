"""Assignment-scoped atomic bytea pilot. Provider IO never occurs in a transaction."""
from uuid import uuid4
from functools import wraps
import re
from datetime import datetime, timezone
import psycopg
from psycopg.types.json import Jsonb
from app.repositories.postgres_account import PostgresAccountRepository
from app.repositories.account import AccountError
from app.services.content_pipeline import digest
from app.services import speaking_review as s
from app.contracts.speaking import SpeakingCandidate

OWNER="product_id='mitooni' AND issuer=%s AND subject_id=%s"
TERMINAL={'completed','failed','dispatch_unknown'}

def safe_database(method):
    @wraps(method)
    def wrapped(*args,**kwargs):
        try:return method(*args,**kwargs)
        except AccountError:raise
        except (psycopg.Error,KeyError,TypeError,ValueError,AttributeError):
            s.fail('speaking_unavailable',503)
    return wrapped

class PostgresSpeakingReviewRepository(PostgresAccountRepository):
    def __init__(self,config,package_configuration,*,call_budget=0,provider_enabled=False,lease_seconds=130):
        super().__init__(config)
        if type(call_budget) is not int or not 0<=call_budget<=8 or not 1<=lease_seconds<=180:
            raise ValueError('Explicit bounded Speaking pilot configuration required')
        self.package_configuration,self.call_budget,self.provider_enabled=package_configuration,call_budget,provider_enabled
        self.lease_seconds=lease_seconds

    def _authority(self,c,owner,package_hash):
        row=c.execute(f"SELECT status,permissions FROM mitooni_app.content_review_assignments WHERE {OWNER} AND package_hash=%s FOR SHARE",(*owner,package_hash)).fetchone()
        if not row or row['status']!='active' or not {'review:use',s.PERMISSION}<=set(row['permissions']):s.fail('speaking_denied',403)

    def _context(self,c,user,target,*,write=False,expected_package_hash=None,expected_target_hash=None):
        package=self.package_configuration.load()
        owner=self._scope(c,user)
        self._authority(c,owner,package.hash)
        if package.get(target).get('skill')!='speaking':s.fail('speaking_denied',403)
        if expected_package_hash is not None and (expected_package_hash!=package.hash or expected_target_hash!=digest(package.get(target))):s.fail('content_changed')
        if write:c.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s,0))",('|'.join((*owner,package.hash)),))
        return package,owner

    @safe_database
    def preflight(self,user,target):
        with self._connect() as c:
            package,_=self._context(c,user,target)
            if not self.provider_enabled or self.call_budget<1:s.fail('speaking_unavailable',503)
            return package.hash

    def _rows(self,c,owner,package,target):
        rows=c.execute(f"SELECT * FROM mitooni_app.speaking_review_records WHERE {OWNER} AND package_hash=%s AND target_id=%s ORDER BY created_at",(*owner,package.hash,target)).fetchall()
        for row in rows:
            if row['target_hash']!=digest(package.get(target)):s.fail('content_changed')
        return rows

    @safe_database
    def list(self,user,target,*,expected_package_hash=None,expected_target_hash=None):
        with self._connect() as c:
            package,owner=self._context(c,user,target,expected_package_hash=expected_package_hash,expected_target_hash=expected_target_hash)
            return dict(packageHash=package.hash,targetHash=digest(package.get(target)),recordings=[s.projection(r) for r in self._rows(c,owner,package,target)],available=self.provider_enabled and self.call_budget>0)

    @safe_database
    def audio(self,user,target,recording_id,*,expected_package_hash=None,expected_target_hash=None):
        recording_id=s.uuid_string(recording_id)
        with self._connect() as c:
            package,owner=self._context(c,user,target,expected_package_hash=expected_package_hash,expected_target_hash=expected_target_hash)
            row=next((r for r in self._rows(c,owner,package,target) if str(r['recording_id'])==recording_id),None)
            if row is None:s.fail('speaking_denied',403)
            return s.validate_record(row)[1].data

    @safe_database
    def submit(self,user,target,binding,data,key):
        key=s.uuid_string(key)
        with self._connect() as c:
            package,owner=self._context(c,user,target,write=True)
            if binding['packageHash']!=package.hash or binding['targetHash']!=digest(package.get(target)):s.fail('content_changed')
            # Recheck authority before decoder; caller's declared hash never proves bytes.
            audio=s.admit(data,binding['recordingSha256'])
            request_hash=digest(binding)
            previous=c.execute(f"SELECT r.* FROM mitooni_app.speaking_review_records r WHERE {OWNER} AND package_hash=%s AND target_id=%s AND operation_id=%s",(*owner,package.hash,target,key)).fetchone()
            if previous:
                if previous['operation_hash']!=request_hash or bytes(previous['audio'])!=data:s.fail('idempotency_conflict')
                return s.projection(previous)
            if not self.provider_enabled or self.call_budget<1:s.fail('speaking_unavailable',503)
            task=s.task_binding(package,target,binding['taskId'])
            c.execute("INSERT INTO mitooni_app.speaking_review_budgets(product_id,issuer,subject_id,package_hash) VALUES('mitooni',%s,%s,%s) ON CONFLICT DO NOTHING",(*owner,package.hash))
            budget=c.execute(f"SELECT * FROM mitooni_app.speaking_review_budgets WHERE {OWNER} AND package_hash=%s FOR UPDATE",(*owner,package.hash)).fetchone()
            if budget['recordings']>=s.MAX_RECORDINGS or budget['storage_bytes']+audio.size_bytes>s.MAX_STORAGE_BYTES or budget['reserved']+budget['settled']>=self.call_budget:s.fail('speaking_limit',429)
            recording_id,job_id,dispatch_id=uuid4(),uuid4(),uuid4()
            state=c.execute(f"SELECT data FROM mitooni_app.content_review_states WHERE {OWNER} AND package_hash=%s AND target_id=%s",(*owner,package.hash,target)).fetchone()
            revealed=bool(state and state['data'].get('revealedAt'))
            frozen=dict(packageHash=package.hash,targetHash=binding['targetHash'],targetVersion=package.get(target)['version'],
                packageVersion=package.package['manifest'].get('version'),familyId=package.get(target).get('familyId'),
                audioMetadata=dict(sizeBytes=audio.size_bytes,durationSeconds=audio.duration_seconds,sampleRate=audio.sample_rate,channels=audio.channels,sampleWidth=audio.sample_width),
                recordingSha256=audio.sha256,conditions=dict(kind='recorded_rehearsal',locallyRevealed=revealed,externalExposure='unknown'),
                input=dict(**task,dispatchId=str(dispatch_id),attemptId=str(job_id),recordingId=str(recording_id),recordingSha256=audio.sha256,recordingDurationSeconds=audio.duration_seconds))
            # Strict provider input validation before reservation/insert.
            from app.contracts.speaking import SpeakingInput
            SpeakingInput.model_validate(frozen['input'])
            c.execute("INSERT INTO mitooni_app.speaking_review_records(product_id,issuer,subject_id,package_hash,target_id,target_hash,recording_id,job_id,operation_id,operation_hash,request_hash,frozen,audio,dispatch_candidate) VALUES('mitooni',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",(*owner,package.hash,target,binding['targetHash'],recording_id,job_id,key,request_hash,digest(frozen),Jsonb(frozen),data,dispatch_id))
            c.execute(f"UPDATE mitooni_app.speaking_review_budgets SET recordings=recordings+1,storage_bytes=storage_bytes+%s,reserved=reserved+1 WHERE {OWNER} AND package_hash=%s",(audio.size_bytes,*owner,package.hash))
            c.execute("INSERT INTO mitooni_app.speaking_review_queue(job_id,issuer,subject_id) VALUES(%s,%s,%s)",(job_id,*owner))
            return s.projection(c.execute("SELECT * FROM mitooni_app.speaking_review_records WHERE job_id=%s",(job_id,)).fetchone())

    @safe_database
    def queue(self):
        with self._connect() as c:
            return c.execute("SELECT job_id,issuer,subject_id FROM mitooni_app.speaking_review_queue WHERE issuer=%s ORDER BY created_at LIMIT 8",(self.config.issuer,)).fetchall()

    def _finish(self,c,owner,row,status,error=None,result=None):
        c.execute("UPDATE mitooni_app.speaking_review_records SET status=%s,error_code=%s,result=%s,revision=revision+1,lease_until=NULL WHERE job_id=%s",(status,error,Jsonb(result) if result else None,row['job_id']))
        c.execute(f"UPDATE mitooni_app.speaking_review_budgets SET reserved=reserved-1,settled=settled+%s WHERE {OWNER} AND package_hash=%s",(int(row['dispatch_id'] is not None),*owner,row['package_hash']))
        c.execute("DELETE FROM mitooni_app.speaking_review_queue WHERE job_id=%s",(row['job_id'],))

    @safe_database
    def worker(self,user,job_id,action,*,fence=None,result=None):
        with self._connect() as c:
            owner=self._scope(c,user)
            row=c.execute(f"SELECT target_id,package_hash FROM mitooni_app.speaking_review_records WHERE {OWNER} AND job_id=%s",(*owner,job_id)).fetchone()
            if not row:
                # Revoked RLS may hide a formerly queued record. Remove only owned
                # scheduler metadata; never read bytes or mutate the hidden result.
                if action=='claim':
                    c.execute("DELETE FROM mitooni_app.speaking_review_queue WHERE job_id=%s AND issuer=%s AND subject_id=%s",(job_id,*owner))
                    return None
                s.fail('speaking_denied',403)
            # Assignment locks precede owner lock on every API and worker path.
            self._authority(c,owner,row['package_hash'])
            c.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s,0))",('|'.join((*owner,row['package_hash'])),))
            row=c.execute(f"SELECT * FROM mitooni_app.speaking_review_records WHERE {OWNER} AND job_id=%s FOR UPDATE",(*owner,job_id)).fetchone()
            package=self.package_configuration.load()
            if package.hash!=row['package_hash'] or digest(package.get(row['target_id']))!=row['target_hash']:s.fail('content_changed')
            bound,audio=s.validate_record(row)
            if row['status'] in TERMINAL:return None
            now=datetime.now(timezone.utc)
            if action=='claim':
                if row['status']=='running':
                    if row['lease_until']>now:return None
                    if row['dispatch_id']:
                        self._finish(c,owner,row,'dispatch_unknown','dispatch_unknown');return None
                new_fence=row['fence']+1
                c.execute("UPDATE mitooni_app.speaking_review_records SET status='running',fence=%s,revision=revision+1,lease_until=now()+(%s * interval '1 second') WHERE job_id=%s",(new_fence,self.lease_seconds,job_id))
                return dict(bound=bound,audio=audio,fence=new_fence)
            if fence!=row['fence'] or row['status']!='running':s.fail('speaking_conflict')
            if row['lease_until']<=now:
                if row['dispatch_id']:
                    self._finish(c,owner,row,'dispatch_unknown','dispatch_unknown');return None
                s.fail('speaking_conflict')
            if action=='check':return True
            if action=='dispatch':
                if row['dispatch_id'] or not self.provider_enabled:s.fail('speaking_conflict')
                c.execute("UPDATE mitooni_app.speaking_review_records SET dispatch_id=dispatch_candidate,revision=revision+1 WHERE job_id=%s",(job_id,));return True
            if action=='complete':
                if not row['dispatch_id'] or str(row['dispatch_id'])!=bound.dispatchId:s.fail('speaking_conflict')
                candidate=SpeakingCandidate.model_validate(result.candidate.model_dump()).validate_binding(bound)
                counters=result.usage
                if (set(counters)!={'inputTokens','outputTokens','totalTokens'} or any(type(n) is not int or not 0<=n<=10_000_000 for n in counters.values())
                    or counters['totalTokens']!=counters['inputTokens']+counters['outputTokens'] or counters['outputTokens']>4096
                    or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}',result.model)
                    or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}',result.response_id)):s.fail('speaking_unavailable',503)
                stored=dict(feedback=candidate.model_dump(),recordingSha256=audio.sha256,dispatchId=bound.dispatchId,
                    model=result.model,responseId=result.response_id,usage=result.usage)
                self._finish(c,owner,row,'completed',result=stored);return True
            if action=='fail':
                self._finish(c,owner,row,'dispatch_unknown' if row['dispatch_id'] else 'failed','dispatch_unknown' if row['dispatch_id'] else 'speaking_unavailable');return True
            s.fail('invalid_request',422)
