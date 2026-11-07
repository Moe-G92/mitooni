"""Receiving identity foundation with explicitly composed local account routes."""

from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import Depends, FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from uuid import uuid4
from app.repositories.account import AccountError
from app.http_security import (
    account_or_study_path,
    private_api_path,
    valid_host_authority,
)
from app.routers.account import router as account_router
from pydantic import BaseModel
from app.config import BackendConfig
from app.db.supabase_client import TargetSupabaseClient
from app.dependencies import (
    CurrentUser,
    IdentityVerifier,
    SupabaseIdentityVerifier,
    get_current_user,
)


class IdentityOut(BaseModel):
    """Verified identity only; does not imply Mitooni membership or roles."""

    id: str
    email: str | None


def create_app(
    config: BackendConfig | None = None,
    *,
    verifier: IdentityVerifier | None = None,
    account_repository=None,
    study_repository=None,
    tutor_runner=None,
    worker_enabled=False,
    content_review_repository=None,
    speaking_review_repository=None,
    speaking_runner=None,
    speaking_worker_enabled=False,
    learner_repository=None,
    learner_runner=None,
    learner_worker_enabled=False,
) -> FastAPI:
    if verifier is not None and (config is None or config.environment != "test"):
        raise ValueError(
            "Injected identity verification requires explicit test configuration"
        )
    if account_repository is not None:
        if config is None or (
            config.environment == "production"
            and account_repository.config.environment != "production"
        ):
            raise ValueError(
                "Local account repository is restricted to explicit non-production configuration"
            )
        if (
            account_repository.config.issuer
            != config.supabase_url.rstrip("/") + "/auth/v1"
        ):
            raise ValueError("Account repository and verified issuer must match")
    if study_repository is not None:
        if (
            config is None
            or account_repository is None
            or study_repository.config != account_repository.config
        ):
            raise ValueError(
                "Study and account must share explicit receiving authority"
            )
        if (
            tutor_runner is not None
            and tutor_runner.kind == "synthetic"
            and config.environment != "test"
        ):
            raise ValueError("Synthetic runner is test-only")
    if worker_enabled and (study_repository is None or tutor_runner is None):
        raise ValueError("Explicit repository and runner required for worker")
    if content_review_repository is not None:
        if config is None or account_repository is None or content_review_repository.config != account_repository.config:
            raise ValueError("Review and account must share explicit receiving authority")
    if speaking_review_repository is not None:
        if config is None or account_repository is None or content_review_repository is None or speaking_review_repository.config != account_repository.config:
            raise ValueError("Speaking and review must share explicit receiving authority")
        if speaking_runner is not None and speaking_runner.kind == "synthetic" and config.environment != "test":
            raise ValueError("Synthetic Speaking runner is test-only")
        if speaking_review_repository.provider_enabled != (speaking_runner is not None and speaking_worker_enabled):
            raise ValueError("Speaking availability must match explicit worker and runner")
    if speaking_worker_enabled and (speaking_review_repository is None or speaking_runner is None):
        raise ValueError("Explicit Speaking repository and runner required")
    if content_review_repository is not None:
        content_review_repository.speaking_available = bool(speaking_review_repository is not None and speaking_review_repository.provider_enabled and speaking_runner is not None and speaking_worker_enabled)
    if learner_repository is not None:
        if config is None or account_repository is None or learner_repository.config != account_repository.config:
            raise ValueError("Learner and account must share explicit receiving authority")
        if learner_repository.provider_enabled != (learner_runner is not None and learner_worker_enabled):
            raise ValueError("Learner provider availability must match explicit runner and worker")
        if learner_runner is not None and getattr(learner_runner,'kind',None)=='synthetic' and config.environment!='test':
            raise ValueError("Synthetic learner runner is test-only")
    if learner_worker_enabled and (learner_repository is None or learner_runner is None):
        raise ValueError("Explicit learner repository and runner required")
    client = TargetSupabaseClient(config) if config is not None else None

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        import asyncio
        from app.workers.tutor_turns import TutorWorker

        worker = TutorWorker(study_repository, tutor_runner) if worker_enabled else None
        task = asyncio.create_task(worker.run()) if worker else None
        from app.workers.speaking_review import SpeakingReviewWorker
        speaking_worker = SpeakingReviewWorker(speaking_review_repository, speaking_runner) if speaking_worker_enabled else None
        speaking_task = asyncio.create_task(speaking_worker.run()) if speaking_worker else None
        learner_worker = None
        learner_task = None
        if learner_worker_enabled:
            from app.workers.learner import LearnerWorker
            learner_repository.validate_budget_policy()
            learner_worker = LearnerWorker(learner_repository,learner_runner)
            learner_task = asyncio.create_task(learner_worker.run())
        try:
            yield
        finally:
            if learner_worker:
                learner_worker.stop.set()
                learner_task.cancel()
                await asyncio.gather(learner_task,return_exceptions=True)
            if speaking_worker:
                speaking_worker.stop.set()
                speaking_task.cancel()
                await asyncio.gather(speaking_task, return_exceptions=True)
            if worker:
                worker.stop.set()
                task.cancel()
                await asyncio.gather(task, return_exceptions=True)
            if client is not None:
                client.close()

    application = FastAPI(
        title="Mitooni",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
    )
    application.state.identity_verifier = (
        verifier
        if verifier is not None
        else (SupabaseIdentityVerifier(client) if client else None)
    )

    application.state.account_repository = account_repository
    application.state.study_repository = study_repository
    application.state.content_review_repository = content_review_repository
    application.state.speaking_review_repository = speaking_review_repository
    application.state.tutor_runner = tutor_runner
    application.state.learner_repository = learner_repository

    def account_path(request):
        return account_or_study_path(request.scope)

    def error_response(request, status, code, message, fields=None):
        detail = {"code": code, "message": message}
        if fields is not None:
            detail["fields"] = fields
        if code == "snapshot_required":
            detail["snapshotRequired"] = True
            detail["retryAction"] = "reload_turn_without_cursor"
        response = JSONResponse(
            status_code=status,
            content={"detail": detail, "requestId": request.state.request_id},
        )
        if status == 401:
            response.headers["WWW-Authenticate"] = "Bearer"
        return response

    @application.exception_handler(AccountError)
    async def account_error(request, exc):
        return error_response(request, exc.status, exc.code, exc.message)

    @application.exception_handler(HTTPException)
    async def auth_error(request, exc):
        if account_path(request):
            code = (
                "unauthenticated"
                if exc.status_code == 401
                else "authentication_unavailable"
                if exc.status_code == 503
                else "request_failed"
            )
            return error_response(
                request,
                exc.status_code,
                code,
                "Authentication required"
                if exc.status_code == 401
                else "Authentication is unavailable"
                if exc.status_code == 503
                else "Request failed",
            )
        return await http_exception_handler(request, exc)

    @application.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        if account_path(request):
            allowed = {
                "body",
                "query",
                "header",
                "expectedRevision",
                "profile",
                "changes",
                "name",
                "locale",
                "theme",
                "targets",
                "overall",
                "listening",
                "reading",
                "writing",
                "speaking",
                "testDate",
                "currentLevel",
                "weeklyHours",
                "showFlag",
                "notifications",
                "email",
                "reminders",
            }
            fields = [
                {
                    "path": ".".join(
                        str(p) if str(p) in allowed else "unknown" for p in item["loc"]
                    ),
                    "code": item["type"],
                }
                for item in exc.errors()[:20]
            ]
            return error_response(
                request, 422, "invalid_request", "Request validation failed", fields
            )
        return await request_validation_exception_handler(request, exc)

    @application.middleware("http")
    async def private_identity_response(request: Request, call_next):
        request.state.request_id = str(uuid4())
        if not valid_host_authority(request.scope):
            response = error_response(
                request, 400, "invalid_request", "Invalid request authority"
            )
            response.headers["Cache-Control"] = "private, no-store"
            response.headers["X-Content-Type-Options"] = "nosniff"
        else:
            response = await call_next(request)
        if private_api_path(request.scope):
            response.headers["Cache-Control"] = "private, no-store"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["Vary"] = "Authorization"
        return response

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/api/me", response_model=IdentityOut)
    def me(user: Annotated[CurrentUser, Depends(get_current_user)]) -> IdentityOut:
        return IdentityOut(id=user.id, email=user.email)

    # Existing identity-only factory keeps its original two-route surface.
    if account_repository is not None:
        application.include_router(account_router)

    if learner_repository is not None:
        from app.routers.learner import router as learner_router
        application.include_router(learner_router)
    if study_repository is not None:
        from app.routers.study import router as study_router

        application.include_router(study_router)
    if content_review_repository is not None:
        from app.routers.content_review import router as review_router
        application.include_router(review_router)
    if speaking_review_repository is not None:
        from app.routers.speaking_review import router as speaking_router
        application.include_router(speaking_router)
    from app.http_security import ReviewBodyLimitMiddleware, PrivateResponseBoundaryMiddleware
    application.add_middleware(ReviewBodyLimitMiddleware)
    application.add_middleware(PrivateResponseBoundaryMiddleware)
    return application


app = create_app()
