"""Owner-scoped normalized candidate state. External execution never runs in SQL transactions."""
from copy import deepcopy
from datetime import datetime,timedelta,timezone,date
from uuid import UUID
from pathlib import Path
from decimal import Decimal,ROUND_CEILING
import time
from psycopg.types.json import Jsonb
from app.repositories.postgres_account import PostgresAccountRepository,OWNER
from app.services import learner_policy as p
from app.media.speaking import admit_wav,AudioAdmissionError

TABLES={'plans':'learner_plan_versions','sessions':'learner_sessions','workspaces':'learner_workspaces','attempts':'learner_attempts','evidence':'learner_evidence','jobs':'learner_jobs','recordings':'learner_recordings'}
TERMINAL={'completed','failed','canceled','dispatch-unknown'}

class PostgresLearnerRepository(PostgresAccountRepository):
    def __init__(self,config,catalog,*,provider_enabled=False,budget_policy_id=None,clock=None):
        super().__init__(config);self.catalog=catalog;self.provider_enabled=provider_enabled;self.budget_policy_id=budget_policy_id;self.clock=clock or (lambda:datetime.now(timezone.utc));self._execution_models=None;self._execution_pricing_revision=None
    def _now(self):return self.clock().isoformat()
    def _authority(self,c,user,tutor=False):
        owner=self._scope(c,user)
        member=c.execute(f'SELECT * FROM mitooni_app.memberships WHERE {OWNER} FOR UPDATE',owner).fetchone()
        if not member or member['status']!='active' or 'learner:use' not in member['entitlements'] or tutor and 'learner:tutor' not in member['entitlements']:p.fail('access_required',403)
        return owner
    def _rows(self,c,o,kind):return [r['data'] for r in c.execute(f'SELECT data FROM mitooni_app.{TABLES[kind]} WHERE {OWNER} ORDER BY created_at,id',o).fetchall()]
    def _get(self,c,o,kind,id):
        try:id=str(UUID(str(id)))
        except (ValueError,TypeError):p.fail('invalid_request',422)
        r=c.execute(f'SELECT data FROM mitooni_app.{TABLES[kind]} WHERE {OWNER} AND id=%s',(*o,id)).fetchone()
        if not r:p.fail('not_found',404)
        return r['data']
    def _put(self,c,o,kind,d,insert=False,extra=None):
        table=TABLES[kind];extra=extra or {}
        if insert:
            cols=['product_id','issuer','subject_id','id','revision','data']+list(extra)
            values=['mitooni',*o,d['id'],d.get('revision',1),Jsonb(d),*extra.values()]
            c.execute(f"INSERT INTO mitooni_app.{table} ({','.join(cols)}) VALUES ({','.join(['%s']*len(cols))})",values)
        else:
            changes='data=%s,revision=%s'+''.join(','+k+'=%s' for k in extra)
            c.execute(f'UPDATE mitooni_app.{table} SET {changes} WHERE {OWNER} AND id=%s',(Jsonb(d),d.get('revision',1),*extra.values(),*o,d['id']))
    def _journey(self,c,o):
        r=c.execute(f'SELECT data FROM mitooni_app.learner_journeys WHERE {OWNER}',o).fetchone()
        return r['data'] if r else {'preferences':None,'activePlanId':None,'evidenceRevision':0,'vocabulary':{'revision':0,'items':[]},'productFeedback':[]}
    def _save_journey(self,c,o,j):
        c.execute('INSERT INTO mitooni_app.learner_journeys(product_id,issuer,subject_id,data) VALUES(%s,%s,%s,%s) ON CONFLICT(product_id,issuer,subject_id) DO UPDATE SET data=EXCLUDED.data,revision=learner_journeys.revision+1',('mitooni',*o,Jsonb(j)))
    def _metadata(self,prefs=None,role=None):
        track=(prefs or {}).get('examTrack','academic');br=p.branch(prefs or {})
        return self.catalog.list_tasks(track,None,role)
    def _meta(self,id):
        if hasattr(self.catalog,'metadata'):
            try:return self.catalog.metadata(id)
            except KeyError:p.fail('content_gap',503)
        for track in ('academic','general_training'):
            for branch in ('foundation','intermediate','advanced'):
                for m in self.catalog.list_tasks(track,branch,None):
                    if m['id']==id:return m
        p.fail('content_gap',503)
    def _published(self,w,c=None):
        m=w.get('_metadata') or self._meta(w['taskId'])
        if c is None:p.fail('content_withdrawn',503)
        publication=c.execute('SELECT data FROM mitooni_app.learner_publications WHERE catalog_hash=%s FOR SHARE',(w['contentRef']['catalogHash'],)).fetchone()
        if not publication or publication['data'].get('status')!='approved' or 'learner_delivery' not in publication['data'].get('allowedUses',[]) or w['taskId'] in publication['data'].get('withdrawnTaskIds',[]):p.fail('content_withdrawn')
        if p.ref(m)!=w['contentRef']:p.fail('content_changed')
        if m.get('status')=='withdrawn' or not m.get('available',True):p.fail('content_withdrawn')
        return m
    def _evidence(self,c,o,j,kind,**kw):
        e={'id':p.uid(),'kind':kind,'createdAt':self._now(),**kw};self._put(c,o,'evidence',e,True);j['evidenceRevision']+=1;self._save_journey(c,o,j);return e
    def _public_job(self,d):return {k:deepcopy(d.get(k)) for k in ('id','revision','workspaceId','attemptId','intent','output','error','retryAction','createdAt','workRef','contentRef')}|{'status':d['status'].replace('-','_')}
    def _view(self,c,o,w):
        a=w['attempt'];result={k:deepcopy(v) for k,v in w.items() if not k.startswith('_')};result['serverNow']=self._now();result['answerReview']=None
        try:self._published(w,c)
        except Exception as e:
            from app.repositories.account import AccountError
            if not isinstance(e,AccountError):raise
            result['task']={'id':w['taskId'],'title':'Saved work','skill':w['skill'],'sections':[],'assets':[],'teachingAnchors':[]};result['capabilities']=[];result['feedback']=None;result['messages']=[]
            if w.get('sessionId'):
                session=self._get(c,o,'sessions',w['sessionId'])
                if session['kind']=='mock' and session['status']!='completed':result['rawCheck']=None
            return result
        task=self._task(w)
        if a['conditions']['current']=='independent':task['teachingAnchors']=[]
        result['task']=task
        result['sessionKind']=None;result['playbackPolicy']='replay';result['listeningPlayback']=None
        if w['sessionId']:
            session=self._get(c,o,'sessions',w['sessionId']);result['sessionKind']=session['kind']
            if session['kind']=='mock' and w['skill']=='listening':
                result['playbackPolicy']='one_pass'
                if w.get('listeningPlayback'):
                    playback=deepcopy(w['listeningPlayback']);playback['serverNow']=self._now();playback['elapsedSeconds']=max(0,(self.clock()-datetime.fromisoformat(playback['startedAt'])).total_seconds());result['listeningPlayback']=playback
        caps=[]
        if a['status']=='open':caps=['draft:write','attempt:submit']+(['support:switch'] if a['conditions']['current']=='independent' else [])+(['recording:write'] if w['skill']=='speaking' else [])
        else:caps=['attempt:revise']
        if self.provider_enabled and (a['conditions']['current']=='supported' or a['status']!='open'):caps+=['tutor:use']
        result['capabilities']=caps
        result['feedback']=None
        result['messages']=self._messages(c,o,w)['messages']
        if w['sessionId']:
            session=self._get(c,o,'sessions',w['sessionId'])
            if session['kind']=='mock' and session['status']!='completed':result['rawCheck']=None;result['messages']=[];result['capabilities']=[x for x in caps if x not in ('tutor:use','attempt:revise','support:switch')]
        if w.get('latestJobId'):
            job=self._get(c,o,'jobs',w['latestJobId'])
            if job['status']=='completed':result['feedback']=job.get('output')
        if w['sessionId']:
            session=self._get(c,o,'sessions',w['sessionId'])
            if session['kind']=='mock' and session['status']!='completed':result['feedback']=None
        result['answerReview']=self._answer_review(c,o,w)
        return result
    def _session_view(self,d):return {k:deepcopy(v)for k,v in d.items()if not k.startswith('_')}|{'serverNow':self._now()}
    def _new_workspace(self,c,o,j,task_id,mode,*,planId=None,stepId=None,sessionId=None,sectionId=None,deadline=None,parent=None):
        m=self._meta(task_id);wid=p.uid();aid=p.uid();conditions={'original':mode,'current':mode,'revision':1,'assisted':mode=='supported','exposureEligible':bool(m.get('unseenEligible',True))}
        prior=self._rows(c,o,'evidence');groups=set(m.get('semanticExposureGroupIds',[]) or [m.get('familyId',task_id)])
        exposed=any(groups&set(e.get('exposureGroups',[])) for e in prior)
        if exposed:conditions['exposureEligible']=False
        a={'id':aid,'status':'open','parentAttemptId':parent,'contentRef':p.ref(m),'conditions':conditions,'startedAt':self._now(),'deadlineAt':deadline,'submittedAt':None,'responseHash':None,'responses':[]}
        w={'id':wid,'revision':1,'taskId':task_id,'skill':m['skill'],'contentRef':p.ref(m),'draft':{'revision':1,'responses':[]},'attempt':a,'latestJobId':None,'rawCheck':None,'sessionId':sessionId,'sectionId':sectionId,'planId':planId,'stepId':stepId,'feedback':None}
        w['_task']=deepcopy(self.catalog.get_task(task_id));w['_assessment']=deepcopy(self.catalog.assessment(task_id));w['_metadata']=deepcopy(m);w['_assets']={}
        for asset in w['_task'].get('assets',[]):
            stored=self.catalog.asset(asset['id']);w['_assets'][asset['id']]={'path':str(stored['path']),'sha256':stored['sha256'],'mediaType':stored['mediaType']}
        self._published(w,c);self._put(c,o,'workspaces',w,True)
        self._evidence(c,o,j,'exposure',taskId=task_id,attemptId=aid,skill=m['skill'],exposureGroups=list(groups),contentRef=p.ref(m))
        return w
    def _find_attempt(self,c,o,aid):
        try:aid=str(UUID(str(aid)))
        except (ValueError,TypeError):p.fail('invalid_request',422)
        row=c.execute(f"SELECT data FROM mitooni_app.learner_workspaces WHERE {OWNER} AND data->'attempt'->>'id'=%s ORDER BY created_at DESC LIMIT 1",(*o,aid)).fetchone()
        if not row:p.fail('not_found',404)
        return row['data']
    def _deadline(self,w):return w['attempt'].get('deadlineAt') and self.clock()>=datetime.fromisoformat(w['attempt']['deadlineAt'])
    def _freeze(self,c,o,j,w,expired=False):
        a=w['attempt'];a['status']='expired' if expired else 'submitted';a['submittedAt']=self._now();a['responses']=deepcopy(w['draft']['responses']);a['responseHash']=p.digest(a['responses']);a['draftRevision']=w['draft']['revision']
        questions=[q for section in self._task(w)['sections'] for q in section['questions']];raw=p.mark(a['responses'],self._assessment(w),questions);w['rawCheck']=raw;w['revision']+=1
        self._put(c,o,'attempts',a,True,{'status':a['status'],'body_hash':a['responseHash']});self._put(c,o,'workspaces',w)
        self._evidence(c,o,j,'submission',taskId=w['taskId'],skill=w['skill'],workspaceId=w['id'],attemptId=a['id'],conditions=a['conditions'],parentAttemptId=a['parentAttemptId'],contentRef=w['contentRef'],rawCheck=raw,objectiveIds=self._meta(w['taskId']).get('objectiveIds',[]))
        if w['sessionId']:
            s=self._get(c,o,'sessions',w['sessionId']);index=next(i for i,x in enumerate(s['sections']) if x['id']==w['sectionId']);s['sections'][index]['status']='expired' if expired else 'submitted'
            if index+1<len(s['sections']):s['sections'][index+1]['status']='ready'
            else:s['status']='completed';s['completedAt']=self._now()
            s['revision']+=1;self._put(c,o,'sessions',s)
        return w
    def _expire(self,c,o,j,w):
        if w['attempt']['status']=='open' and self._deadline(w):self._freeze(c,o,j,w,True)
        return w
    def call(self,user,action,body=None,key=None,target=None):
        b=body.model_dump() if hasattr(body,'model_dump') else body or {}
        with self._connect() as c:
            o=self._authority(c,user);j=self._journey(c,o)
            mutation=key is not None;route=action+(':'+str(target) if target else '')
            if mutation:
                try:key=str(UUID(key))
                except (ValueError,TypeError):p.fail('invalid_request',422)
                request_hash=p.digest(b);old=c.execute(f'SELECT request_hash,outcome FROM mitooni_app.learner_operations WHERE {OWNER} AND route=%s AND operation_id=%s',(*o,route,key)).fetchone()
                if old:
                    if old['request_hash']!=request_hash:p.fail('idempotency_conflict')
                    out=old['outcome']['value'];self._replay_authority(c,o,out);return out
            out=self._action(c,o,j,action,b,target,user)
            if mutation:c.execute('INSERT INTO mitooni_app.learner_operations(product_id,issuer,subject_id,route,operation_id,request_hash,outcome) VALUES(%s,%s,%s,%s,%s,%s,%s)',('mitooni',*o,route,key,request_hash,Jsonb({'value':out})))
            return out
    def _replay_authority(self,c,o,out):
        if isinstance(out,dict) and out.get('answerReview') is not None and out.get('id'):
            workspace=self._get(c,o,'workspaces',out['id']);self._published(workspace,c);out['answerReview']=self._answer_review(c,o,workspace)
        if isinstance(out,dict) and 'contentRef'in out:
            if 'taskId'in out and out.get('id'):self._published(self._get(c,o,'workspaces',out['id']),c)
            elif out.get('task',{}).get('id'):self._published({'taskId':out['task']['id'],'contentRef':out['contentRef']},c)
        if isinstance(out,dict) and out.get('workspaceId'):
            self._published(self._get(c,o,'workspaces',out['workspaceId']),c)
    def _preferences(self,j):
        if not j.get('preferences'):p.fail('setup_required',409)
        return j['preferences']
    def _action(self,c,o,j,action,b,target,user):
        if action=='bootstrap':
            sessions=self._rows(c,o,'sessions');return {'preferences':j['preferences'],'preferencesRevision':(j['preferences']or{}).get('revision',0),'evidenceRevision':j['evidenceRevision'],'activePlan':self._get(c,o,'plans',j['activePlanId']) if j.get('activePlanId') else None,'resumableSession':next((self._session_view(s) for s in reversed(sessions) if s['status']not in ('completed','abandoned')),None),'providerAvailable':self.provider_enabled,'capabilities':['learner:use']+(['learner:tutor'] if self.provider_enabled else [])}
        if action=='preferences':
            p.expect((j['preferences']or{}).get('revision',0),b['expectedRevision'])
            if b.get('testDate'):
                try:date.fromisoformat(b['testDate'])
                except ValueError:p.fail('invalid_request',422)
            j['preferences']={k:deepcopy(v)for k,v in b.items()if k!='expectedRevision'}|{'revision':(j['preferences']or{}).get('revision',0)+1}
            if j.get('activePlanId'):
                previous=self._get(c,o,'plans',j['activePlanId'])
                plan=p.build_plan(j['preferences'],self._metadata(j['preferences']),self._rows(c,o,'evidence'),previous['version']+1)
                plan['evidenceRevision']=j['evidenceRevision']
                self._put(c,o,'plans',plan,True)
                j['activePlanId']=plan['id']
            self._save_journey(c,o,j)
            return j['preferences']
        if action=='plans':return {'plans':self._rows(c,o,'plans')}
        if action=='plan_current':return self._get(c,o,'plans',j['activePlanId']) if j.get('activePlanId') else None
        if action=='plan_create':
            prefs=self._preferences(j);p.expect(prefs['revision'],b['expectedPreferencesRevision']);p.expect(j['evidenceRevision'],b['expectedEvidenceRevision'])
            old=self._get(c,o,'plans',j['activePlanId']) if j.get('activePlanId')else None
            plan=p.build_plan(prefs,self._metadata(prefs),self._rows(c,o,'evidence'),old['version']+1 if old else 1)
            plan['evidenceRevision']=j['evidenceRevision'];self._put(c,o,'plans',plan,True);j['activePlanId']=plan['id'];self._save_journey(c,o,j);return plan
        if action in ('baseline_create','session_create'):
            prefs=self._preferences(j)
            if action=='baseline_create':p.expect(prefs['revision'],b['expectedPreferencesRevision'])
            role='mock' if action=='session_create' else 'train';meta=self._metadata(prefs,role)
            if action=='session_create' and (b['mockId']!=prefs['examTrack'] or b['mockVersion']!=1):p.fail('content_changed')
            sections=[]
            section_order=('listening','reading','writing','speaking') if action=='session_create' else p.SKILLS
            for skill in section_order:
                matches=[m for m in meta if m['skill']==skill];matches.sort(key=lambda m:(m.get('branch')not in (p.branch(prefs),'all'),m['id']))
                if not matches:p.fail('content_gap',503)
                m=matches[0];sections.append({'id':p.uid(),'skill':skill,'title':m['title'],'taskId':m['id'],'contentRef':p.ref(m),'status':'ready' if not sections else 'locked','workspaceId':None,'startedAt':None,'deadlineAt':None,'durationSeconds':int(m.get('durationSeconds') or m.get('estimatedMinutes',20)*60)})
            s={'id':p.uid(),'revision':1,'kind':'mock' if action=='session_create' else 'baseline','examTrack':prefs['examTrack'],'status':'ready','sections':sections,'startedAt':None,'completedAt':None,'_sectionMetadata':{section['id']:self._meta(section['taskId'])for section in sections}};self._put(c,o,'sessions',s,True);return self._session_view(s)
        if action=='sessions':
            for w in self._rows(c,o,'workspaces'):self._expire(c,o,j,w)
            return {'sessions':[self._session_view(s) for s in self._rows(c,o,'sessions')]}
        if action in ('session','session_start'):
            s=self._get(c,o,'sessions',target)
            for section in s['sections']:
                if section['workspaceId']:self._expire(c,o,j,self._get(c,o,'workspaces',section['workspaceId']))
            s=self._get(c,o,'sessions',target)
            if action=='session_start':
                p.expect(s['revision'],b['expectedRevision']);section=next((x for x in s['sections'] if x['status']=='ready'),None)
                if not section:p.fail('assessment_not_complete')
                self._start_section(c,o,j,s,section)
            return self._session_view(s)
        if action=='mocks':
            prefs=self._preferences(j);meta=self._metadata(prefs,'mock');skills=sorted({m['skill'] for m in meta});return {'mocks':[{'id':prefs['examTrack'],'version':1,'title':'IELTS '+('Academic' if prefs['examTrack']=='academic'else 'General Training'),'examTrack':prefs['examTrack'],'skills':skills,'durationSeconds':sum(int(m.get('durationSeconds')or m.get('estimatedMinutes',20)*60)for m in meta),'available':len(skills)==4,'reason':None if len(skills)==4 else 'content_gap'}]}
        if action=='resolve':
            if b.get('sessionId'):
                s=self._get(c,o,'sessions',b['sessionId']);section=next((x for x in s['sections'] if x['id']==b['sectionId']),None)
                if not section:p.fail('not_found',404)
                if section['status']=='locked':p.fail('assessment_not_complete')
                if not section['workspaceId']:self._start_section(c,o,j,s,section)
                w=self._get(c,o,'workspaces',section['workspaceId'])
            else:
                plan=self._get(c,o,'plans',b['planId']);p.expect(plan['version'],b['planVersion']);step=next((x for x in plan['steps']if x['id']==b['stepId']),None)
                if not step or step['state'] in ('locked','unavailable'):p.fail('content_gap')
                w=next((w for w in reversed(self._rows(c,o,'workspaces')) if w['planId']==plan['id']and w['stepId']==step['id']),None)
                if w is None:
                    probe={'taskId':step['taskId']};self._embargo(c,o,probe)
                    w=self._new_workspace(c,o,j,step['taskId'],'independent' if step['kind']=='transfer' else b['conditionPreset'],planId=plan['id'],stepId=step['id'])
            return self._view(c,o,self._expire(c,o,j,w))
        if action=='workspace':return self._view(c,o,self._expire(c,o,j,self._get(c,o,'workspaces',target)))
        if action in ('draft','assistance','turn','playback_start'):
            w=self._get(c,o,'workspaces',target)
        elif action in ('submit','revise','feedback','result'):
            w=self._find_attempt(c,o,target)
        else:w=None
        if w:
            self._expire(c,o,j,w);self._published(w,c);a=w['attempt'];conditions=a['conditions']
            if action=='playback_start':
                p.expect(w['revision'],b['expectedWorkspaceRevision'])
                if not w['sessionId'] or w['skill']!='listening' or a['status']!='open':p.fail('invalid_request',422)
                session=self._get(c,o,'sessions',w['sessionId'])
                if session['kind']!='mock':p.fail('invalid_request',422)
                if not w.get('listeningPlayback'):
                    task=self._task(w);assets={asset['id']:asset for asset in task['assets'] if asset['mediaType'].startswith('audio/')};ordered=[]
                    for section in task['sections']:
                        for asset_id in section.get('assetIds',[]):
                            if asset_id in assets and asset_id not in ordered:ordered.append(asset_id)
                    for asset_id in assets:
                        if asset_id not in ordered:ordered.append(asset_id)
                    if not ordered or any(not isinstance(assets[id].get('durationSeconds'),(int,float)) or assets[id]['durationSeconds']<=0 for id in ordered):p.fail('content_gap',503)
                    w['listeningPlayback']={'startedAt':self._now(),'orderedAssetIds':ordered,'durationsSeconds':[assets[id]['durationSeconds'] for id in ordered],'nonce':p.uid()};w['revision']+=1;self._put(c,o,'workspaces',w)
                    section=next(x for x in session['sections'] if x['id']==w['sectionId']);section['playbackStartedAt']=w['listeningPlayback']['startedAt'];section['playbackPolicy']='one_pass';session['revision']+=1;self._put(c,o,'sessions',session)
            elif action=='draft':
                if a['status']!='open':p.fail('submission_frozen')
                p.expect(w['draft']['revision'],b['expectedDraftRevision']);self._validate_responses(c,o,w,b['responses']);w['draft']={'revision':w['draft']['revision']+1,'responses':b['responses']};w['revision']+=1;self._put(c,o,'workspaces',w)
            elif action=='submit':
                if a['status']!='open':return self._view(c,o,w)
                p.expect(w['revision'],b['expectedWorkspaceRevision']);p.expect(w['draft']['revision'],b['expectedDraftRevision']);p.expect(conditions['revision'],b['expectedConditionsRevision'])
                if w['sessionId'] and w['skill']=='listening' and self._get(c,o,'sessions',w['sessionId'])['kind']=='mock' and not w.get('listeningPlayback'):p.fail('playback_required')
                self._freeze(c,o,j,w)
            elif action=='assistance':
                self._embargo(c,o,w)
                p.expect(w['revision'],b['expectedWorkspaceRevision']);p.expect(conditions['revision'],b['expectedConditionsRevision'])
                if a['status']!='open':p.fail('submission_frozen')
                conditions.update(current='supported',assisted=True,revision=conditions['revision']+1);w['revision']+=1;self._put(c,o,'workspaces',w);self._evidence(c,o,j,'assistance',attemptId=a['id'],skill=w['skill'],taskId=w['taskId'])
            elif action=='revise':
                if w['sessionId'] and self._get(c,o,'sessions',w['sessionId'])['status']!='completed':p.fail('assessment_not_complete')
                self._embargo(c,o,w)
                p.expect(w['revision'],b['expectedWorkspaceRevision'])
                if a['status']=='open':p.fail('submission_required')
                child=self._new_workspace(c,o,j,w['taskId'],'supported',planId=w['planId'],stepId=w['stepId'],parent=a['id']);return self._view(c,o,child)
            elif action in ('turn','feedback'):
                self._authority(c,user,True)
                self._embargo(c,o,w)
                if not self.provider_enabled or not self.budget_policy_id:p.fail('provider_unavailable',503)
                p.expect(w['revision'],b['expectedWorkspaceRevision'])
                if conditions['current']=='independent'and a['status']=='open':p.fail('condition_switch_required')
                if action=='feedback'and a['status']=='open':p.fail('submission_required')
                if w['sessionId']:
                    session=self._get(c,o,'sessions',w['sessionId'])
                    if session['kind']=='mock'and session['status']!='completed':p.fail('assessment_not_complete')
                if w.get('latestJobId') and self._get(c,o,'jobs',w['latestJobId'])['status']not in TERMINAL:p.fail('turn_active')
                intent='feedback'if action=='feedback'else b['intent']
                if intent=='feedback'and a['status']=='open':p.fail('submission_required')
                workref={'kind':'attempt'if a['status']!='open'else'draft','id':a['id']if a['status']!='open'else w['id'],'revision':w['draft']['revision']}
                if action=='turn'and b['workRef']!=workref:p.fail('revision_conflict')
                job={'id':p.uid(),'revision':1,'workspaceId':w['id'],'attemptId':a['id'],'intent':intent,'message':b.get('message',''),'workRef':workref,'contentRef':w['contentRef'],'status':'queued','fence':0,'leaseUntil':0,'dispatchId':None,'output':None,'error':None,'retryAction':None,'createdAt':self._now()};self._put(c,o,'jobs',job,True,{'status':'queued'});c.execute('INSERT INTO mitooni_app.learner_job_queue(job_id,issuer,subject_id)VALUES(%s,%s,%s)',(job['id'],*o));w['latestJobId']=job['id'];w['revision']+=1;self._put(c,o,'workspaces',w);return self._public_job(job)
            return self._view(c,o,w)
        if action in ('job','cancel'):
            d=self._get(c,o,'jobs',target);self._published(self._get(c,o,'workspaces',d['workspaceId']),c)
            if action=='cancel':
                p.expect(d['revision'],b['expectedRevision'])
                if d['status']not in TERMINAL:d['status']='cancel-requested'if d.get('dispatchId')else'canceled';d['revision']+=1;self._put(c,o,'jobs',d,extra={'status':d['status']})
            return self._public_job(d)
        if action=='proposal_accept':return self._accept_proposal(c,o,j,b,target)
        if action in ('progress','results'):return self._progress(c,o,j,results=action=='results')
        if action=='vocabulary':return self._vocabulary_view(j)
        if action=='vocabulary_add':
            v=j.setdefault('vocabulary',{'revision':0,'items':[]});p.expect(v['revision'],b['expectedRevision'])
            if len(v['items'])>=500:p.fail('storage_limit',429)
            v['items'].append({'id':p.uid(),'word':b['word'],'meaning':b.get('meaning',''),'example':b.get('example',''),'sourceTaskId':b.get('sourceTaskId'),'createdAt':self._now(),'reviewRevision':0,'dueAt':self._now(),'lastReviewedAt':None,'lastRecall':None});v['revision']+=1;self._save_journey(c,o,j);return self._vocabulary_view(j)
        if action=='vocabulary_review':
            v=j.setdefault('vocabulary',{'revision':0,'items':[]});p.expect(v['revision'],b['expectedRevision']);item=next((x for x in v['items'] if x['id']==target),None)
            if not item:p.fail('not_found',404)
            item.update(reviewRevision=item.get('reviewRevision',0)+1,lastRecall=b['recall'],lastReviewedAt=self._now(),dueAt=(self.clock()+timedelta(days=1 if b['recall']=='known' else 0)).isoformat());v['revision']+=1;self._save_journey(c,o,j);return self._vocabulary_view(j)
        if action=='coaching':return {'available':False,'requests':[]}
        if action=='feedback_list':return {'revision':len(j.get('productFeedback',[])),'items':j.get('productFeedback',[])}
        if action=='product_feedback':
            feedback=j.setdefault('productFeedback',[]);p.expect(len(feedback),b['expectedRevision'])
            if b.get('workspaceId'):self._get(c,o,'workspaces',b['workspaceId'])
            if len(feedback)>=100:p.fail('storage_limit',429)
            item={'id':p.uid(),**b,'createdAt':self._now()};feedback.append(item);self._save_journey(c,o,j);return {'revision':len(feedback),'items':feedback}
        p.fail('invalid_request',422)
    def _start_section(self,c,o,j,s,section):
        if any(x['status']=='running'for x in s['sections']):p.fail('assessment_not_complete')
        section['startedAt']=self._now();section['deadlineAt']=(self.clock()+timedelta(seconds=section['durationSeconds'])).isoformat();section['status']='running'
        w=self._new_workspace(c,o,j,section['taskId'],'independent',sessionId=s['id'],sectionId=section['id'],deadline=section['deadlineAt']);section['workspaceId']=w['id'];s['status']='running';s['startedAt']=s['startedAt']or self._now();s['revision']+=1;self._put(c,o,'sessions',s)
    def _validate_responses(self,c,o,w,responses):
        questions={q['id']:q for section in self._task(w)['sections']for q in section['questions']}
        seen=set();size=0
        for r in responses:
            id=r['itemId'];value=r['value'];kind=r['kind']
            if id not in questions or id in seen:p.fail('invalid_request',422)
            seen.add(id);q=questions[id];rt=q['responseType'];expected={'single_choice':'choice','short_text':'short_text','extended_text':'essay','spoken_response':'recording','multi_select':'multi_select','matching':'matching','ordered':'ordered'}.get(rt)
            if expected!=kind:p.fail('invalid_request',422)
            if kind in ('choice','short_text','essay','recording') and not isinstance(value,str):p.fail('invalid_request',422)
            if kind in ('multi_select','ordered')and(not isinstance(value,list)or len(value)>100):p.fail('invalid_request',422)
            if kind=='matching'and(not isinstance(value,dict)or len(value)>100):p.fail('invalid_request',422)
            if kind=='choice'and value not in {a['id']for a in q.get('options',[])}:p.fail('invalid_request',422)
            if kind=='recording':
                recording=self._get(c,o,'recordings',value)
                if recording['attemptId']!=w['attempt']['id']or recording['itemId']!=id:p.fail('invalid_request',422)
            size+=len(str(value).encode())
            if isinstance(value,str)and len(value)>20000:p.fail('invalid_request',422)
        if size>100000:p.fail('invalid_request',422)
    def _progress(self,c,o,j,results=False):
        evidence=self._rows(c,o,'evidence');sub=[e for e in evidence if e['kind']=='submission'];recent=[];skills=[]
        for e in reversed(sub[-100:]):
            m=self._meta(e['taskId']);recent.append({'id':e['attemptId'],'skill':e['skill'],'title':m['title'],'submittedAt':e['createdAt'],'conditions':e['conditions'],'rawCheck':e.get('rawCheck'),'workspaceId':e['workspaceId']})
        hidden={w['attempt']['id']for w in self._rows(c,o,'workspaces')if w['sessionId']and self._get(c,o,'sessions',w['sessionId'])['kind']=='mock'and self._get(c,o,'sessions',w['sessionId'])['status']!='completed'}
        for r in recent:
            if r['id']in hidden:r['rawCheck']=None
        if results:return {'attempts':recent}
        for skill in p.SKILLS:
            facts=[e for e in sub if e['skill']==skill];raw=[e['rawCheck']for e in facts if e.get('rawCheck') and e['attemptId']not in hidden];skills.append({'skill':skill,'itemCount':sum(x['itemCount']for x in raw),'correctCount':sum(x['correctCount']for x in raw),'submittedCount':len(facts),'supportedCount':sum(x['conditions']['current']=='supported'for x in facts),'independentCount':sum(x['conditions']['current']=='independent'and x['conditions']['exposureEligible']for x in facts),'feedbackCount':sum(e['kind']=='ai_observation'and e.get('skill')==skill for e in evidence),'objectiveIds':sorted({obj for e in facts for obj in e.get('objectiveIds',[])})})
        plan=self._get(c,o,'plans',j['activePlanId'])if j.get('activePlanId')else None
        return {'evidenceRevision':j['evidenceRevision'],'skills':skills,'recentAttempts':recent,'nextActions':[{'stepId':s['id'],'title':s['title'],'skill':s['skill']}for s in (plan or {}).get('steps',[])if s['state']=='available'][:4],'noBandEstimate':True}
    def _accept_proposal(self,c,o,j,b,target):
        plan_id,proposal_id=target.split(':',1);plan=self._get(c,o,'plans',plan_id);p.expect(plan['version'],b['expectedPlanVersion']);p.expect(j['evidenceRevision'],b['expectedEvidenceRevision'])
        if j['activePlanId']!=plan_id:p.fail('revision_conflict')
        jobs=self._rows(c,o,'jobs');job=next((d for d in jobs if (d.get('output')or{}).get('proposal',{} )and d['output']['proposal'].get('id')==proposal_id),None)
        if not job or job['status']!='completed':p.fail('not_found',404)
        proposal=job['output']['proposal'];step=next((s for s in plan['steps']if s['id']==proposal['targetStepId']),None)
        if not step or step['state']=='unavailable':p.fail('content_gap')
        evidence={e['id']for e in self._rows(c,o,'evidence')}
        if not set(proposal.get('evidenceIds',[]))<=evidence:p.fail('invalid_request',422)
        new=deepcopy(plan);new.update(id=p.uid(),version=plan['version']+1,evidenceRevision=j['evidenceRevision'],createdAt=self._now());new['steps'].sort(key=lambda x:x['id']!=step['id']);self._put(c,o,'plans',new,True);j['activePlanId']=new['id'];self._save_journey(c,o,j);return new
    def recording(self,user,attempt_id,item_id,expected_revision,data,key):
        with self._connect()as c:
            o=self._authority(c,user);j=self._journey(c,o);w=self._find_attempt(c,o,attempt_id);self._published(w,c)
            try:audio=admit_wav(data)
            except AudioAdmissionError:p.fail('invalid_audio',422)
            request_hash=p.digest({'attemptId':attempt_id,'itemId':item_id,'revision':expected_revision,'sha256':audio.sha256});route='recording:'+attempt_id
            try:key=str(UUID(key))
            except(ValueError,TypeError):p.fail('invalid_request',422)
            old=c.execute(f'SELECT request_hash,outcome FROM mitooni_app.learner_operations WHERE {OWNER} AND route=%s AND operation_id=%s',(*o,route,key)).fetchone()
            if old:
                if old['request_hash']!=request_hash:p.fail('idempotency_conflict')
                return old['outcome']['value']
            self._expire(c,o,j,w)
            if w['attempt']['status']!='open':p.fail('submission_frozen')
            p.expect(w['draft']['revision'],expected_revision)
            questions={q['id']:q for section in self._task(w)['sections']for q in section['questions']}
            if item_id not in questions or questions[item_id]['responseType']!='spoken_response':p.fail('invalid_request',422)
            records=self._rows(c,o,'recordings')
            if len(records)>=80 or sum(r['sizeBytes']for r in records)+audio.size_bytes>150*1024*1024:p.fail('storage_limit',429)
            d={'id':p.uid(),'attemptId':attempt_id,'workspaceId':w['id'],'itemId':item_id,'sha256':audio.sha256,'sizeBytes':audio.size_bytes,'durationSeconds':float(audio.duration_seconds),'mediaType':'audio/wav','createdAt':self._now()};self._put(c,o,'recordings',d,True,{'audio':data,'sha256':audio.sha256});c.execute('INSERT INTO mitooni_app.learner_operations(product_id,issuer,subject_id,route,operation_id,request_hash,outcome)VALUES(%s,%s,%s,%s,%s,%s,%s)',('mitooni',*o,route,key,request_hash,Jsonb({'value':d})));return d
    def binary(self,user,kind,id,asset_id=None):
        with self._connect()as c:
            o=self._authority(c,user)
            if kind=='recording':
                r=self._get(c,o,'recordings',id);w=self._get(c,o,'workspaces',r['workspaceId']);self._published(w,c);row=c.execute(f'SELECT audio FROM mitooni_app.learner_recordings WHERE {OWNER} AND id=%s',(*o,id)).fetchone();data=bytes(row['audio']);admitted=admit_wav(data)
                if admitted.sha256!=r['sha256'] or admitted.size_bytes!=r['sizeBytes']:p.fail('content_changed')
                return data,'audio/wav'
            w=self._get(c,o,'workspaces',id);self._published(w,c);task=self._task(w)
            if asset_id not in {a['id']for a in task.get('assets',[])}:p.fail('not_found',404)
            asset=(w.get('_assets')or{}).get(asset_id) or self.catalog.asset(asset_id);path=Path(asset['path']);data=path.read_bytes()
            from hashlib import sha256
            if sha256(data).hexdigest()!=asset['sha256']:p.fail('content_changed')
            return data,asset['mediaType']
    def queue(self):
        with self._connect()as c:return [{'issuer':r['issuer'],'subjectId':str(r['subject_id']),'jobId':str(r['job_id'])}for r in c.execute('SELECT * FROM mitooni_app.learner_job_queue ORDER BY created_at LIMIT 20').fetchall()]
    def validate_budget_policy(self):
        if not self.provider_enabled:return None
        if not self.budget_policy_id:p.fail('provider_unavailable',503)
        with self._connect()as c:
            row=c.execute('SELECT data FROM mitooni_app.provider_budget_policies WHERE id=%s',(self.budget_policy_id,)).fetchone()
            if not row:p.fail('budget_exhausted',503)
            d=row['data'];self._validate_policy(d)
            totals=c.execute('SELECT * FROM mitooni_app.provider_usage_totals WHERE policy_id=%s',(self.budget_policy_id,)).fetchone()
            if not totals or totals['reserved_micros']+totals['settled_micros']>d['capMicros']:p.fail('budget_exhausted',503)
            if self._execution_models is None:self._execution_models=deepcopy(d['models']);self._execution_pricing_revision=d['pricingRevision']
            elif d['models']!=self._execution_models or d['pricingRevision']!=self._execution_pricing_revision:p.fail('provider_unavailable',503)
            return d
    def _validate_policy(self,d):
        if d.get('enabled')is not True or d.get('currency')!='USD' or not isinstance(d.get('pricingRevision'),str) or not d['pricingRevision'] or not all(type(d.get(k))is int and d[k]>0 for k in ('capMicros','ownerCapMicros','maxConcurrent')):p.fail('budget_exhausted',503)
        if set(d.get('models',{}))!={'text','audio'}or any(not isinstance(v,str)or not v for v in d['models'].values()):p.fail('budget_exhausted',503)
        for kind in ('text','speaking'):
            quote=d.get('reservationMicros',{}).get(kind);rates=d.get('rates',{}).get(kind,{})
            if type(quote)is not int or quote<=0 or any(isinstance(rates.get(k),bool)or not isinstance(rates.get(k),(float,int))or not 0<rates[k]<10000 for k in ('inputMicrosPerToken','outputMicrosPerToken')):p.fail('budget_exhausted',503)
        # These are reviewed request/context ceilings, not observed token predictions.
        floors={'text':922000*Decimal(str(d['rates']['text']['inputMicrosPerToken']))+2000*Decimal(str(d['rates']['text']['outputMicrosPerToken'])),'speaking':128000*Decimal(str(d['rates']['speaking']['inputMicrosPerToken']))+8192*Decimal(str(d['rates']['speaking']['outputMicrosPerToken']))}
        if any(d['reservationMicros'][k]<floors[k]for k in floors):p.fail('budget_exhausted',503)
    def _reserve(self,c,o,job,payload):
        policy=c.execute('SELECT data FROM mitooni_app.provider_budget_policies WHERE id=%s FOR SHARE',(self.budget_policy_id,)).fetchone()
        if not policy or not policy['data'].get('enabled'):p.fail('budget_exhausted',429)
        policy=policy['data'];self._validate_policy(policy)
        if self._execution_models is None or policy['models']!=self._execution_models or policy['pricingRevision']!=self._execution_pricing_revision:p.fail('provider_unavailable',503)
        kind=payload['kind'];quote=policy.get('reservationMicros',{}).get(kind)
        count=1
        if type(quote)is not int or quote<=0:p.fail('budget_exhausted',429)
        quote*=count
        totals=c.execute('SELECT * FROM mitooni_app.provider_usage_totals WHERE policy_id=%s FOR UPDATE',(self.budget_policy_id,)).fetchone()
        if not totals:p.fail('budget_exhausted',429)
        own=c.execute(f"SELECT COALESCE(sum(reserved_micros+settled_micros),0) amount,count(*)FILTER(WHERE status='reserved') active FROM mitooni_app.provider_usage_reservations WHERE {OWNER} AND policy_id=%s",(*o,self.budget_policy_id)).fetchone()
        if totals['reserved_micros']+totals['settled_micros']+quote>policy['capMicros']or own['amount']+quote>policy['ownerCapMicros']or totals['active_jobs']>=policy['maxConcurrent']:p.fail('budget_exhausted',429)
        c.execute('UPDATE mitooni_app.provider_usage_totals SET reserved_micros=reserved_micros+%s,active_jobs=active_jobs+1,revision=revision+1 WHERE policy_id=%s',(quote,self.budget_policy_id))
        c.execute('INSERT INTO mitooni_app.provider_usage_reservations(id,issuer,subject_id,policy_id,reserved_micros,status,data)VALUES(%s,%s,%s,%s,%s,%s,%s)',(job['id'],*o,self.budget_policy_id,quote,'reserved',Jsonb({'kind':kind,'models':policy.get('models',{}),'pricingRevision':policy.get('pricingRevision'),'rates':policy['rates'],'quoteMicros':quote})))
        job['reservedMicros']=quote;return policy
    def _settle(self,c,o,job,result=None,unknown=False):
        row=c.execute(f'SELECT * FROM mitooni_app.provider_usage_reservations WHERE {OWNER} AND id=%s FOR UPDATE',(*o,job['id'])).fetchone()
        if not row or row['status']!='reserved':return
        usage=getattr(result,'usage',None);model=getattr(result,'model',None);kind=row['data']['kind'];expected=row['data']['models'].get('audio'if kind=='speaking'else'text')
        if unknown or not isinstance(usage,dict)or model!=expected or any(type(usage.get(k))is not int or usage[k]<0 for k in ('inputTokens','outputTokens')):
            c.execute("UPDATE mitooni_app.provider_usage_reservations SET status='dispatch-unknown' WHERE id=%s",(job['id'],));return
        rates=row['data']['rates'][kind];amount=int((Decimal(usage['inputTokens'])*Decimal(str(rates['inputMicrosPerToken']))+Decimal(usage['outputTokens'])*Decimal(str(rates['outputMicrosPerToken']))).to_integral_value(rounding=ROUND_CEILING))
        if amount>row['reserved_micros']:
            c.execute("UPDATE mitooni_app.provider_usage_reservations SET status='dispatch-unknown' WHERE id=%s",(job['id'],));return
        ceiling=row['reserved_micros'];c.execute("UPDATE mitooni_app.provider_usage_reservations SET reserved_micros=0,settled_micros=%s,status='settled',data=data||%s WHERE id=%s",(amount,Jsonb({'usage':usage,'model':model,'responseId':getattr(result,'response_id',None)}),job['id']));c.execute('UPDATE mitooni_app.provider_usage_totals SET reserved_micros=reserved_micros-%s,settled_micros=settled_micros+%s,active_jobs=active_jobs-1,revision=revision+1 WHERE policy_id=%s',(ceiling,amount,row['policy_id']))
    def worker(self,user,job_id,action,*,fence=None,result=None,error=None):
        with self._connect()as c:
            o=self._authority(c,user,True);j=self._journey(c,o);job=self._get(c,o,'jobs',job_id);w=self._get(c,o,'workspaces',job['workspaceId']);self._published(w,c)
            if action=='claim':
                if job['status']in TERMINAL:
                    c.execute('DELETE FROM mitooni_app.learner_job_queue WHERE job_id=%s AND issuer=%s AND subject_id=%s',(job_id,*o));return None
                if job['status']=='cancel-requested':job['status']='canceled';self._settle(c,o,job,unknown=bool(job.get('dispatchId')));self._put(c,o,'jobs',job,extra={'status':job['status']});return None
                if job['status']=='running':
                    if job['leaseUntil']>time.time():return None
                    if job.get('dispatchId'):
                        job['status']='dispatch-unknown';job['error']={'code':'dispatch_unknown','message':'Feedback delivery is uncertain. No automatic retry was made.'};self._settle(c,o,job,unknown=True);self._put(c,o,'jobs',job,extra={'status':job['status']});return None
                job['fence']+=1;job['status']='running';job['leaseUntil']=time.time()+130;job['revision']+=1;payload,audio=self._bound(c,o,j,w,job);job['boundPayload']=payload;job['boundHash']=p.digest(payload);self._put(c,o,'jobs',job,extra={'status':'running'});return {'fence':job['fence'],'payload':payload,'audio':audio}
            if job['fence']!=fence or job['leaseUntil']<=time.time()or job['status']not in ('running','cancel-requested'):p.fail('stale_worker')
            if action in ('check','complete'):
                self._execution_policy(c,job)
            if action=='check':
                if job['status']=='cancel-requested':p.fail('canceled')
                return True
            if action=='dispatch':
                publication=c.execute('SELECT data FROM mitooni_app.learner_publications WHERE catalog_hash=%s FOR SHARE',(w['contentRef']['catalogHash'],)).fetchone()
                if not publication or 'model_context' not in publication['data'].get('allowedUses',[]):p.fail('provider_unavailable',503)
                if job['status']=='cancel-requested' or job.get('dispatchId'):p.fail('stale_worker')
                payload,_=self._bound(c,o,j,w,job);self._reserve(c,o,job,payload);job['dispatchId']=p.uid();self._put(c,o,'jobs',job,extra={'status':job['status']});return None
            if action=='complete' and not job.get('dispatchId'):p.fail('stale_worker')
            if action in ('complete','fail'):
                if job['status']=='cancel-requested':job['status']='canceled';job['output']=None
                elif action=='complete':
                    reservation=c.execute(f'SELECT data FROM mitooni_app.provider_usage_reservations WHERE {OWNER} AND id=%s',(*o,job_id)).fetchone()
                    expected=reservation['data']['models'].get('audio' if reservation['data']['kind']=='speaking' else 'text') if reservation else None
                    if expected is None or getattr(result,'model',None)!=expected or not isinstance(getattr(result,'usage',None),dict):p.fail('provider_invalid_usage',422)
                    output=deepcopy(result.candidate);self._validate_output(c,o,j,w,job,output);job['output']=output;job['status']='completed';self._evidence(c,o,j,'ai_observation',attemptId=w['attempt']['id'],skill=w['skill'],taskId=w['taskId'],jobId=job['id'],workRef=job['workRef'])
                else:
                    code=getattr(error,'code',str(error)if isinstance(error,str)else'provider_unavailable');job['status']='dispatch-unknown'if code=='dispatch_unknown'else'failed';job['error']={'code':code,'message':'Feedback could not be completed. Your work is saved.'}
                job['revision']+=1;self._settle(c,o,job,result or error,unknown=job['status']=='dispatch-unknown');self._put(c,o,'jobs',job,extra={'status':job['status']});c.execute('DELETE FROM mitooni_app.learner_job_queue WHERE job_id=%s AND issuer=%s AND subject_id=%s',(job_id,*o));return self._public_job(job)
            p.fail('invalid_request',422)
    def _messages(self,c,o,w,limit=20,before=None):
        params=[*o,w['id']];where=''
        if before:
            cursor=c.execute(f"SELECT created_at,id FROM mitooni_app.learner_jobs WHERE {OWNER} AND id=%s AND data->>'workspaceId'=%s",(*o,before,w['id'])).fetchone()
            if not cursor:p.fail('not_found',404)
            where=' AND (created_at,id)<(%s,%s)';params.extend([cursor['created_at'],cursor['id']])
        params.append(limit+1)
        rows=c.execute(f"SELECT data FROM mitooni_app.learner_jobs WHERE {OWNER} AND data->>'workspaceId'=%s AND status='completed'{where} ORDER BY created_at DESC,id DESC LIMIT %s",params).fetchall();jobs=[r['data']for r in rows];selected=list(reversed(jobs[:limit]));return {'messages':[{'id':d['id'],'jobId':d['id'],'requestText':d.get('message',''),'output':d.get('output'),'createdAt':d['createdAt']}for d in selected],'nextCursor':selected[0]['id']if len(jobs)>limit else None}
    def messages(self,user,wid,limit=20,before=None):
        with self._connect()as c:
            o=self._authority(c,user);w=self._get(c,o,'workspaces',wid);self._published(w,c);return self._messages(c,o,w,min(max(1,limit),50),before)
    def _bound(self,c,o,j,w,job):
        if job.get('boundPayload'):
            payload=deepcopy(job['boundPayload']);audio=None
            if payload['kind']=='speaking':
                audio={}
                for item in payload['speakingInputs']:
                    r=self._get(c,o,'recordings',item['recordingId']);row=c.execute(f'SELECT audio FROM mitooni_app.learner_recordings WHERE {OWNER} AND id=%s',(*o,r['id'])).fetchone();audio[r['id']]=bytes(row['audio'])
            return payload,audio
        if job['workRef']['kind']=='draft' and job['workRef']['revision']!=w['draft']['revision']:p.fail('revision_conflict')
        task=self._task(w);assessment=self._assessment(w);a=w['attempt'];responses=a['responses']if a['status']!='open'else w['draft']['responses'];evidence=self._rows(c,o,'evidence')[-40:]
        safe_evidence=[]
        for e in evidence:
            item={k:e[k]for k in ('id','kind','taskId','skill','attemptId','contentRef','conditions','objectiveIds','createdAt')if k in e}
            if e.get('rawCheck'):item['rawCheck']={k:e['rawCheck'][k]for k in ('itemCount','correctCount')}
            safe_evidence.append(item)
        safe_assessment={k:assessment[k]for k in ('criteria','feedbackGuidance','questionCriteria')if k in assessment}
        plan=self._get(c,o,'plans',j['activePlanId'])if j.get('activePlanId')else None;options=[{'stepId':s['id'],'title':s['title'],'skill':s['skill'],'objectiveIds':s['objectiveIds'],'evidenceIds':[e['id']for e in safe_evidence if e.get('skill')==s['skill']]}for s in (plan or{}).get('steps',[])if s['state']=='available'][:20]
        text='\n'.join(str(r['value'])for r in responses if r['kind']!='recording')
        if job.get('message'):text+='\n[Current learner check response]\n'+job['message']
        history=[]
        for msg in self._messages(c,o,w,6)['messages']:
            if msg['requestText']:history.append({'role':'user','text':msg['requestText']})
            if (msg['output']or{}).get('text'):
                output=msg['output'];history.append({'role':'assistant','text':output['text']+('\n'+output['checkQuestion'] if output.get('checkQuestion') else '')})
            elif (msg['output']or{}).get('kind')=='qualitative_speaking_feedback_collection':
                summaries=[]
                for recording in msg['output'].get('recordings',[]):
                    for criterion in recording['feedback'].get('criteria',[]):summaries.append(criterion['criterionId']+': '+criterion['observation']+' '+criterion['revisionAction'])
                history.append({'role':'assistant','text':'\n'.join(summaries)[:6000]})
        payload={'jobId':job['id'],'kind':'speaking'if w['skill']=='speaking'and job['intent']=='feedback'else'text','intent':job['intent'],'message':job.get('message',''),'candidateContext':{'preferences':j.get('preferences'),'evidenceRevision':j['evidenceRevision'],'baselineSummary':safe_evidence},'task':task,'assessment':safe_assessment,'learningControl':{'locale':(j.get('preferences')or{}).get('locale','fa'),'stage':'review'if a['status']!='open'else'train','conditions':a['conditions']},'work':{'ref':job['workRef'],'responses':responses,'text':text},'anchors':task.get('teachingAnchors',[]),'criterionIds':[x['id']for x in assessment.get('criteria',[])],'evidence':safe_evidence,'nextOptions':options,'history':history[-12:]}
        audio=None
        if payload['kind']=='speaking':
            recordings=[];audio={}
            questions={q['id']:q for s in task['sections']for q in s['questions']}
            for response in responses:
                if response['kind']!='recording':continue
                r=self._get(c,o,'recordings',response['value'])
                if r['attemptId']!=a['id']or r['itemId']!=response['itemId']:p.fail('invalid_request',422)
                row=c.execute(f'SELECT audio FROM mitooni_app.learner_recordings WHERE {OWNER} AND id=%s',(*o,r['id'])).fetchone();audio[r['id']]=bytes(row['audio'])
                bound={'dispatchId':job['id']+'-'+str(job['fence']),'attemptId':a['id'],'taskId':w['taskId']+'-'+response['itemId'],'taskVersion':w['contentRef']['version'],'taskHash':w['contentRef']['contentHash'],'assessmentId':w['taskId']+'-assessment','assessmentVersion':w['contentRef']['version'],'assessmentHash':p.digest(safe_assessment),'sourceVersion':w['contentRef']['catalogHash'],'sourceHash':w['contentRef']['contentHash'],'recordingId':r['id'],'recordingSha256':r['sha256'],'recordingDurationSeconds':float(r['durationSeconds']),'prompt':questions[r['itemId']]['prompt'][:12000],'assessmentGuidance':assessment.get('feedbackGuidance','Give qualitative evidence-based feedback; no bands.')[:12000],'transcript':None,'transcriptUncertainty':None};recordings.append(bound)
            if not recordings:p.fail('submission_required')
            payload['speakingInputs']=recordings
        return payload,audio
    def _validate_output(self,c,o,j,w,job,out):
        if not isinstance(out,dict):p.fail('invalid_output',422)
        if out.get('kind')in ('qualitative_speaking_feedback','qualitative_speaking_feedback_collection'):
            from app.contracts.speaking import SpeakingCandidate,SpeakingInput
            payload,audio=self._bound(c,o,j,w,job);bindings={r['recordingId']:r for r in payload['speakingInputs']}
            if out['kind']=='qualitative_speaking_feedback':
                if len(bindings)!=1:p.fail('invalid_output',422)
                SpeakingCandidate.model_validate(out).validate_binding(SpeakingInput.model_validate(next(iter(bindings.values()))))
            else:
                if set(x['recordingId']for x in out.get('recordings',[]))!=set(bindings):p.fail('invalid_output',422)
                for x in out['recordings']:SpeakingCandidate.model_validate(x['feedback']).validate_binding(SpeakingInput.model_validate(bindings[x['recordingId']]))
            return
        task=self._task(w);allowed={a['id']:a for a in task.get('teachingAnchors',[])}
        if not out.get('text')or len(out['text'])>12000:p.fail('invalid_output',422)
        for citation in out.get('citations',[]):
            if citation['anchorId']not in allowed:p.fail('invalid_output',422)
            citation['label']=allowed[citation['anchorId']]['label']
        payload,_=self._bound(c,o,j,w,job);text=payload['work']['text'];spans=out.get('workSpans',[])
        for span in spans:
            if type(span.get('start'))is not int or type(span.get('end'))is not int or not 0<=span['start']<span['end']<=len(text)or text[span['start']:span['end']]!=span['quote']:p.fail('invalid_output',422)
        criteria={x['id']for x in self._assessment(w).get('criteria',[])};evidence={e['id']for e in self._rows(c,o,'evidence')}
        for obs in out.get('observations',[]):
            if obs['criterionId']not in criteria or any(i<0 or i>=len(spans)for i in obs.get('workSpanIndexes',[]))or not set(obs.get('evidenceIds',[]))<=evidence:p.fail('invalid_output',422)
        proposal=out.get('proposal')
        if proposal:
            plan=self._get(c,o,'plans',j['activePlanId'])if j.get('activePlanId')else None
            if not plan or proposal['targetStepId']not in {x['stepId']for x in payload['nextOptions']}or not set(proposal.get('evidenceIds',[]))<=evidence:p.fail('invalid_output',422)
            proposal.update(id=p.uid(),expectedPlanVersion=plan['version'],expectedEvidenceRevision=j['evidenceRevision'])
    def _vocabulary_view(self,j):
        v=deepcopy(j.get('vocabulary',{'revision':0,'items':[]}))
        for x in v['items']:
            x.setdefault('reviewRevision',0);x.setdefault('dueAt',x['createdAt']);x.setdefault('lastReviewedAt',None);x.setdefault('lastRecall',None);x['due']=datetime.fromisoformat(x['dueAt'])<=self.clock()
        return v|{'available':True,'serverNow':self._now()}
    def _embargo(self,c,o,w):
        metadata=w.get('_metadata')or self._meta(w['taskId']);groups=set(metadata.get('semanticExposureGroupIds',[])or[metadata.get('familyId',w['taskId'])])
        for session in self._rows(c,o,'sessions'):
            if session['kind']!='mock'or session['status']in('completed','abandoned'):continue
            for section in session['sections']:
                m=session.get('_sectionMetadata',{}).get(section['id'])
                if m is None and section.get('workspaceId'):m=self._get(c,o,'workspaces',section['workspaceId']).get('_metadata')
                if m is None:m=self._meta(section['taskId'])
                related=set(m.get('semanticExposureGroupIds',[])or[m.get('familyId',section['taskId'])])
                if groups&related:p.fail('assessment_not_complete')
    def recording_preflight(self,user,attempt_id,item_id,expected_revision):
        with self._connect()as c:
            o=self._authority(c,user);w=self._find_attempt(c,o,attempt_id);self._published(w,c)
            if w['attempt']['status']!='open' or self._deadline(w):p.fail('submission_frozen')
            p.expect(w['draft']['revision'],expected_revision)
            if not any(q['id']==item_id and q['responseType']=='spoken_response'for s in self._task(w)['sections']for q in s['questions']):p.fail('invalid_request',422)
    def validate_publication(self):
        with self._connect()as c:
            row=c.execute('SELECT data FROM mitooni_app.learner_publications WHERE catalog_hash=%s FOR SHARE',(self.catalog.catalog_hash,)).fetchone()
            if not row or row['data'].get('status')!='approved' or 'learner_delivery'not in row['data'].get('allowedUses',[]):p.fail('content_withdrawn',503)
            return row['data']
    def _task(self,w):return deepcopy(w['_task']) if '_task'in w else deepcopy(self.catalog.get_task(w['taskId']))
    def _assessment(self,w):
        if '_assessment'in w:return deepcopy(w['_assessment'])
        if w['contentRef']['catalogHash']!=self.catalog.catalog_hash:p.fail('content_changed')
        return deepcopy(self.catalog.assessment(w['taskId']))
    def _execution_policy(self,c,job):
        row=c.execute('SELECT data FROM mitooni_app.provider_budget_policies WHERE id=%s FOR SHARE',(self.budget_policy_id,)).fetchone()
        if not row or not row['data'].get('enabled'):p.fail('provider_unavailable',503)
        if job.get('dispatchId'):
            reservation=c.execute('SELECT data FROM mitooni_app.provider_usage_reservations WHERE id=%s',(job['id'],)).fetchone()
            if not reservation or row['data'].get('models')!=reservation['data'].get('models')or row['data'].get('pricingRevision')!=reservation['data'].get('pricingRevision'):p.fail('provider_unavailable',503)
    def bind_execution_configuration(self,models):
        policy=self.validate_budget_policy()
        if policy is None or policy['models']!=models:p.fail('provider_unavailable',503)
        if self._execution_models!=models:p.fail('provider_unavailable',503)
    def _answer_review(self,c,o,w):
        """Release exact admitted keys only after immutable work and family embargo.

        This projection is never provider input. Answer exposure is committed
        before the HTTP transaction can release these bytes, including GET.
        """
        if w['skill']not in ('reading','listening') or w['attempt']['status']not in ('submitted','expired'):return None
        from app.repositories.account import AccountError
        try:self._embargo(c,o,w)
        except AccountError as error:
            if error.code=='assessment_not_complete':return None
            raise
        assessment=self._assessment(w)
        if assessment.get('kind')!='deterministic':return None
        from app.contracts.learner import AnswerReviewOut
        questions={q['id']for section in self._task(w)['sections']for q in section['questions']}
        items=[]
        for key in assessment.get('answerKey',[]):
            if key.get('questionId')not in questions:p.fail('content_changed')
            rationale=key.get('rationale')
            items.append({'itemId':key['questionId'],'acceptedAnswers':deepcopy(key['acceptedAnswers']),'rationale':rationale if isinstance(rationale,str)and rationale else None})
        groups=[]
        for group in assessment.get('answerGroups',[]):
            if not set(group.get('questionIds',[]))<=questions:p.fail('content_changed')
            groups.append({'questionIds':deepcopy(group['questionIds']),'acceptedAnswers':deepcopy(group['acceptedAnswers']),'orderIndependent':group.get('orderIndependent',False),'distinct':group.get('distinct',False)})
        review=AnswerReviewOut.model_validate({'actorKind':'authoritative_answer_key','items':items,'answerGroups':groups}).model_dump()
        evidence=self._rows(c,o,'evidence')
        if not any(e['kind']=='answer_reveal'and e.get('attemptId')==w['attempt']['id']for e in evidence):
            metadata=w.get('_metadata')or self._meta(w['taskId']);groups=metadata.get('semanticExposureGroupIds',[])or[metadata.get('familyId',w['taskId'])]
            self._evidence(c,o,self._journey(c,o),'answer_reveal',attemptId=w['attempt']['id'],taskId=w['taskId'],skill=w['skill'],contentRef=w['contentRef'],exposureGroups=groups)
        return review
