"""Candidate-only authenticated HTTP boundary; no reviewer access grants."""
from typing import Annotated
from fastapi import APIRouter,Depends,Request,Header,Query
from fastapi.responses import Response
from app.dependencies import CurrentUser,get_current_user
from app.repositories.account import AccountError
from app.contracts import learner as dto
from app.services.learner_policy import fail
router=APIRouter(prefix='/api/learner')
User=Annotated[CurrentUser,Depends(get_current_user)]
def repo(request):
    r=request.app.state.learner_repository
    if r is None:fail('store_unavailable',503)
    return r
def mutate(request,user,action,body,key,expected,target=None):
    if expected!=user.id or not key:fail('invalid_request',422)
    return repo(request).call(user,action,body,key,target)
# explicit routes keep schemas and operation boundaries inspectable.
@router.get('/bootstrap')
def bootstrap(request:Request,user:User):return repo(request).call(user,'bootstrap')
@router.patch('/preferences')
def preferences(body:dto.PreferencesIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'preferences',body,idempotency_key,x_expected_user_id)
@router.post('/baselines')
def baseline(body:dto.BaselineIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'baseline_create',body,idempotency_key,x_expected_user_id)
@router.get('/plans/current')
def plan_current(request:Request,user:User):return repo(request).call(user,'plan_current')
@router.get('/plans')
def plans(request:Request,user:User):return repo(request).call(user,'plans')
@router.post('/plans')
def plan_create(body:dto.PlanIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'plan_create',body,idempotency_key,x_expected_user_id)
@router.post('/plans/{plan_id}/proposals/{proposal_id}/accept')
def accept(plan_id:str,proposal_id:str,body:dto.AcceptIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'proposal_accept',body,idempotency_key,x_expected_user_id,plan_id+':'+proposal_id)
@router.get('/sessions')
def sessions(request:Request,user:User):return repo(request).call(user,'sessions')
@router.post('/sessions')
def session_create(body:dto.SessionIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'session_create',body,idempotency_key,x_expected_user_id)
@router.get('/sessions/{id}')
def session(id:str,request:Request,user:User):return repo(request).call(user,'session',target=id)
@router.post('/sessions/{id}/start')
def start(id:str,body:dto.StartIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'session_start',body,idempotency_key,x_expected_user_id,id)
@router.get('/mocks')
def mocks(request:Request,user:User):return repo(request).call(user,'mocks')
@router.post('/workspaces/resolve')
def resolve(body:dto.ResolveIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'resolve',body,idempotency_key,x_expected_user_id)
@router.get('/workspaces/{id}')
def workspace(id:str,request:Request,user:User):return repo(request).call(user,'workspace',target=id)
@router.get('/workspaces/{id}/messages')
def messages(id:str,request:Request,user:User,limit:int=Query(20,ge=1,le=50),before:str|None=None):return repo(request).messages(user,id,limit,before)
@router.post('/workspaces/{id}/playback/start')
def playback_start(id:str,body:dto.RevisionIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'playback_start',body,idempotency_key,x_expected_user_id,id)
@router.patch('/workspaces/{id}/draft')
def draft(id:str,body:dto.DraftIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'draft',body,idempotency_key,x_expected_user_id,id)
@router.post('/workspaces/{id}/assistance')
def assistance(id:str,body:dto.AssistanceIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'assistance',body,idempotency_key,x_expected_user_id,id)
@router.post('/workspaces/{id}/turns',status_code=202)
def turn(id:str,body:dto.TurnIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'turn',body,idempotency_key,x_expected_user_id,id)
@router.post('/attempts/{id}/submit')
def submit(id:str,body:dto.SubmitIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'submit',body,idempotency_key,x_expected_user_id,id)
@router.post('/attempts/{id}/revisions')
def revise(id:str,body:dto.RevisionIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'revise',body,idempotency_key,x_expected_user_id,id)
@router.post('/attempts/{id}/feedback',status_code=202)
def feedback(id:str,body:dto.FeedbackIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'feedback',body,idempotency_key,x_expected_user_id,id)
@router.post('/attempts/{id}/recordings',status_code=201)
async def recording(id:str,request:Request,user:User,itemId:str,expectedDraftRevision:int=Query(ge=1),idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):
    if x_expected_user_id!=user.id or not idempotency_key:fail('invalid_request',422)
    repo(request).recording_preflight(user,id,itemId,expectedDraftRevision)
    if request.headers.get('content-type','').split(';')[0]!='audio/wav':fail('invalid_audio',422)
    # Reject before buffering bytes; stream count independently enforces actual length.
    count=0;chunks=[]
    async for chunk in request.stream():
        count+=len(chunk)
        if count>18*1024*1024:fail('request_too_large',413)
        chunks.append(chunk)
    return repo(request).recording(user,id,itemId,expectedDraftRevision,b''.join(chunks),idempotency_key)
@router.get('/recordings/{id}/audio')
def audio(id:str,request:Request,user:User):
    data,mime=repo(request).binary(user,'recording',id);return Response(data,media_type=mime)
@router.get('/workspaces/{id}/assets/{asset_id}')
def asset(id:str,asset_id:str,request:Request,user:User):
    data,mime=repo(request).binary(user,'asset',id,asset_id);return Response(data,media_type=mime)
@router.get('/jobs/{id}')
def job(id:str,request:Request,user:User):return repo(request).call(user,'job',target=id)
@router.post('/jobs/{id}/cancel')
def cancel(id:str,body:dto.CancelIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'cancel',body,idempotency_key,x_expected_user_id,id)
@router.get('/progress')
def progress(request:Request,user:User):return repo(request).call(user,'progress')
@router.get('/results')
def results(request:Request,user:User):return repo(request).call(user,'results')
@router.get('/results/{id}')
def result(id:str,request:Request,user:User):return repo(request).call(user,'result',target=id)
@router.get('/vocabulary')
def vocabulary(request:Request,user:User):return repo(request).call(user,'vocabulary')
@router.post('/vocabulary')
def vocabulary_add(body:dto.VocabularyIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'vocabulary_add',body,idempotency_key,x_expected_user_id)
@router.post('/vocabulary/{id}/reviews')
def vocabulary_review(id:str,body:dto.VocabularyReviewIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'vocabulary_review',body,idempotency_key,x_expected_user_id,id)
@router.get('/coaching')
def coaching(request:Request,user:User):return repo(request).call(user,'coaching')
@router.get('/feedback')
def feedback_list(request:Request,user:User):return repo(request).call(user,'feedback_list')
@router.post('/feedback')
def product_feedback(body:dto.ProductFeedbackIn,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None)):return mutate(request,user,'product_feedback',body,idempotency_key,x_expected_user_id)
