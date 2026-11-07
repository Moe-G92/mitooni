"""Invite-only review endpoints; verified identity never implies assignment."""
from typing import Annotated
from fastapi import APIRouter, Depends, Header, Request, Query
from fastapi.responses import Response
from app.dependencies import CurrentUser, get_current_user
from app.routers.account import mutation_identity
from app.contracts.content_review import BoundMutation, DraftIn, ReviewIn, Hash
from app.repositories.account import AccountError

router = APIRouter(prefix='/api/content-review')
User = Annotated[CurrentUser, Depends(get_current_user)]

def repository(request):
    repo = request.app.state.content_review_repository
    if repo is None:
        raise AccountError('store_unavailable', 503, 'Review storage is unavailable')
    return repo

def mutate(request, user, action, target, body, key, expected):
    operation = mutation_identity(user, expected, key)
    return repository(request).call(user, action, body, operation, target)

@router.get('/catalog')
def catalog(request: Request, user: User):
    return repository(request).call(user, 'catalog')

@router.get('/export')
def export(request: Request, user: User):
    return repository(request).call(user, 'export')

@router.get('/targets/{target}')
def target_get(target: str, request: Request, user: User):
    return repository(request).call(user, 'target', target=target)

@router.patch('/targets/{target}/draft')
def draft(target: str, body: DraftIn, request: Request, user: User, idempotency_key: str | None=Header(None), x_expected_user_id: str | None=Header(None)):
    return mutate(request,user,'draft',target,body,idempotency_key,x_expected_user_id)

@router.post('/targets/{target}/submit')
def submit(target: str, body: BoundMutation, request: Request, user: User, idempotency_key: str | None=Header(None), x_expected_user_id: str | None=Header(None)):
    return mutate(request,user,'submit',target,body,idempotency_key,x_expected_user_id)

@router.post('/targets/{target}/reveal')
def reveal(target: str, body: BoundMutation, request: Request, user: User, idempotency_key: str | None=Header(None), x_expected_user_id: str | None=Header(None)):
    return mutate(request,user,'reveal',target,body,idempotency_key,x_expected_user_id)

@router.patch('/targets/{target}/review')
def review(target: str, body: ReviewIn, request: Request, user: User, idempotency_key: str | None=Header(None), x_expected_user_id: str | None=Header(None)):
    return mutate(request,user,'review',target,body,idempotency_key,x_expected_user_id)


@router.get('/targets/{target}/assets/{asset_id}')
def asset_get(target: str, asset_id: str, request: Request, user: User,
              packageHash: Annotated[Hash, Query()], targetHash: Annotated[Hash, Query()],
              range_header: str | None = Header(None, alias='Range')):
    data, metadata = repository(request).asset(user, target, asset_id, packageHash, targetHash, has_range=range_header is not None)
    return Response(content=data, media_type=metadata['mediaType'], headers={
        'Cache-Control': 'private, no-store', 'Vary': 'Authorization',
        'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'none',
    })
