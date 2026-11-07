"""Private raw-WAV rehearsal. Identity and assignment checked before audio decode."""
import asyncio
from typing import Annotated
from fastapi import APIRouter,Depends,Header,Request,Response
from app.dependencies import CurrentUser,get_current_user
from app.routers.account import mutation_identity
from app.services import speaking_review as s
from app.media.speaking import MAX_WAV_BYTES

router=APIRouter(prefix='/api/content-review/targets/{target}/speaking-recordings')
User=Annotated[CurrentUser,Depends(get_current_user)]

def repository(request):
    repo=request.app.state.speaking_review_repository
    if repo is None:s.fail('speaking_unavailable',503)
    return repo

@router.get('')
def recordings(target:str,request:Request,user:User,x_package_hash:str|None=Header(None),x_target_hash:str|None=Header(None)):
    s.version_headers(x_package_hash,x_target_hash)
    return repository(request).list(user,target,expected_package_hash=x_package_hash,expected_target_hash=x_target_hash)

@router.get('/{recording_id}/audio')
def playback(target:str,recording_id:str,request:Request,user:User,x_package_hash:str|None=Header(None),x_target_hash:str|None=Header(None)):
    s.version_headers(x_package_hash,x_target_hash)
    data=repository(request).audio(user,target,recording_id,expected_package_hash=x_package_hash,expected_target_hash=x_target_hash)
    return Response(content=data,media_type='audio/wav',headers={'Cache-Control':'private, no-store','Vary':'Authorization','Content-Disposition':'inline','X-Content-Type-Options':'nosniff'})

@router.post('',status_code=201)
async def submit(target:str,request:Request,user:User,idempotency_key:str|None=Header(None),x_expected_user_id:str|None=Header(None),x_package_hash:str|None=Header(None),x_target_hash:str|None=Header(None),x_speaking_task_id:str|None=Header(None),x_recording_sha256:str|None=Header(None)):
    key=mutation_identity(user,x_expected_user_id,idempotency_key)
    binding=s.headers_binding(x_package_hash,x_target_hash,x_speaking_task_id,x_recording_sha256)
    repo=repository(request)
    await asyncio.to_thread(repo.preflight,user,target)
    if request.headers.get('content-type','').lower()!='audio/wav':s.fail('invalid_audio',415)
    chunks=[];total=0
    async for chunk in request.stream():
        total+=len(chunk)
        if total>MAX_WAV_BYTES:s.fail('invalid_audio',413)
        chunks.append(chunk)
    return await asyncio.to_thread(repo.submit,user,target,binding,b''.join(chunks),key)
