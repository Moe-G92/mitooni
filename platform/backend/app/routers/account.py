"""Account-only routes; expected-user assertions precede repository side effects."""
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Header, Request
from app.contracts.account import AccountOut, Onboarding, ProfilePatch
from app.dependencies import CurrentUser, get_current_user
from app.repositories.account import AccountError

router = APIRouter()


def repository(request: Request):
    value=request.app.state.account_repository
    if value is None:
        raise AccountError('store_unavailable',503,'Account storage is unavailable')
    return value


def mutation_identity(user, expected_user, operation_key):
    if expected_user != user.id:
        raise AccountError('account_changed',409,'Your account changed; reload before saving')
    try:
        return UUID(operation_key or '')
    except ValueError:
        raise AccountError('invalid_request',422,'A valid operation key is required') from None


@router.get('/api/account',response_model=AccountOut)
def account(request: Request,user: Annotated[CurrentUser,Depends(get_current_user)]):
    return repository(request).get(user)


@router.post('/api/profile/onboarding',response_model=AccountOut)
def onboarding(body: Onboarding,request: Request,user: Annotated[CurrentUser,Depends(get_current_user)],
               idempotency_key: str | None=Header(default=None),x_expected_user_id: str | None=Header(default=None)):
    key=mutation_identity(user,x_expected_user_id,idempotency_key)
    return repository(request).mutate(user,'onboarding',body,key)


@router.patch('/api/profile',response_model=AccountOut)
def patch(body: ProfilePatch,request: Request,user: Annotated[CurrentUser,Depends(get_current_user)],
          idempotency_key: str | None=Header(default=None),x_expected_user_id: str | None=Header(default=None)):
    key=mutation_identity(user,x_expected_user_id,idempotency_key)
    return repository(request).mutate(user,'profile',body,key)
