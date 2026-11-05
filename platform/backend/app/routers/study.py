"""Owned study BFF; trusted identity never comes from path/body fields."""

from typing import Annotated
from fastapi import APIRouter, Depends, Header, Request, Query
from app.dependencies import CurrentUser, get_current_user
from app.routers.account import mutation_identity
from app.repositories.account import AccountError
from app.contracts.study import *

router = APIRouter(prefix="/api/study")
User = Annotated[CurrentUser, Depends(get_current_user)]


def repo(r):
    if r.app.state.study_repository is None:
        raise AccountError("store_unavailable", 503, "Study storage is unavailable")
    return r.app.state.study_repository


def mutate(r, u, action, b, key, expected, target=None):
    op = mutation_identity(u, expected, key)
    if action == "turn" and r.app.state.tutor_runner is None:
        raise AccountError("provider_unavailable", 503, "Tutoring is not configured")
    return repo(r).call(u, action, b, op, target)


@router.get("/journey", response_model=JourneyResponse)
def get_journey(request: Request, user: User):
    return repo(request).call(user, "journey")


@router.post("/workspaces/resolve", response_model=WorkspaceResponse)
def resolve(
    b: ResolveIn,
    request: Request,
    user: User,
    idempotency_key: str | None = Header(None),
    x_expected_user_id: str | None = Header(None),
):
    return mutate(request, user, "resolve", b, idempotency_key, x_expected_user_id)


@router.get("/workspaces/{wid}", response_model=WorkspaceResponse)
def workspace(wid: str, request: Request, user: User):
    return repo(request).call(user, "workspace", target=wid)


@router.patch("/workspaces/{wid}/draft", response_model=DraftOut)
def draft(
    wid: str,
    b: DraftIn,
    request: Request,
    user: User,
    idempotency_key: str | None = Header(None),
    x_expected_user_id: str | None = Header(None),
):
    return mutate(request, user, "draft", b, idempotency_key, x_expected_user_id, wid)


@router.post("/attempts/{aid}/submit", response_model=WorkspaceResponse)
def submit(
    aid: str,
    b: SubmitIn,
    request: Request,
    user: User,
    idempotency_key: str | None = Header(None),
    x_expected_user_id: str | None = Header(None),
):
    return mutate(request, user, "submit", b, idempotency_key, x_expected_user_id, aid)


@router.post("/workspaces/{wid}/assistance", response_model=WorkspaceResponse)
def assistance(
    wid: str,
    b: AssistanceIn,
    request: Request,
    user: User,
    idempotency_key: str | None = Header(None),
    x_expected_user_id: str | None = Header(None),
):
    return mutate(
        request, user, "assistance", b, idempotency_key, x_expected_user_id, wid
    )


@router.post("/workspaces/{wid}/attempts", response_model=WorkspaceResponse)
def child(
    wid: str,
    b: ChildAttemptIn,
    request: Request,
    user: User,
    idempotency_key: str | None = Header(None),
    x_expected_user_id: str | None = Header(None),
):
    return mutate(request, user, "child", b, idempotency_key, x_expected_user_id, wid)


@router.post("/workspaces/{wid}/turns", response_model=TurnOut, status_code=202)
def turn(
    wid: str,
    b: TurnIn,
    request: Request,
    user: User,
    idempotency_key: str | None = Header(None),
    x_expected_user_id: str | None = Header(None),
):
    return mutate(request, user, "turn", b, idempotency_key, x_expected_user_id, wid)


@router.get("/turns/{tid}", response_model=TurnResponse)
def poll(
    tid: str, request: Request, user: User, afterSequence: int | None = Query(None)
):
    return repo(request).poll(user, tid, afterSequence)


@router.post("/turns/{tid}/cancel", response_model=TurnOut)
def cancel(
    tid: str,
    b: CancelIn,
    request: Request,
    user: User,
    idempotency_key: str | None = Header(None),
    x_expected_user_id: str | None = Header(None),
):
    return mutate(request, user, "cancel", b, idempotency_key, x_expected_user_id, tid)


@router.post("/proposals/{pid}/accept", response_model=ProposalAcceptOut)
def accept(
    pid: str,
    b: AcceptProposalIn,
    request: Request,
    user: User,
    idempotency_key: str | None = Header(None),
    x_expected_user_id: str | None = Header(None),
):
    return mutate(request, user, "accept", b, idempotency_key, x_expected_user_id, pid)
