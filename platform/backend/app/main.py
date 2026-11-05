"""Receiving identity foundation with explicitly composed local account routes."""
from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import Depends, FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler,request_validation_exception_handler
from uuid import uuid4
from app.repositories.account import AccountError
from app.routers.account import router as account_router
from pydantic import BaseModel
from app.config import BackendConfig
from app.db.supabase_client import TargetSupabaseClient
from app.dependencies import CurrentUser, IdentityVerifier, SupabaseIdentityVerifier, get_current_user


class IdentityOut(BaseModel):
    """Verified identity only; does not imply Mitooni membership or roles."""
    id: str
    email: str | None


def create_app(config: BackendConfig | None = None, *, verifier: IdentityVerifier | None = None, account_repository=None) -> FastAPI:
    if verifier is not None and (config is None or config.environment != "test"):
        raise ValueError("Injected identity verification requires explicit test configuration")
    if account_repository is not None:
        if config is None or config.environment not in {"test", "development"}:
            raise ValueError("Local account repository is restricted to explicit non-production configuration")
        if account_repository.config.issuer != config.supabase_url.rstrip("/") + "/auth/v1":
            raise ValueError("Account repository and verified issuer must match")
    client = TargetSupabaseClient(config) if config is not None else None

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        try:
            yield
        finally:
            if client is not None:
                client.close()

    application = FastAPI(title="Mitooni", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
    application.state.identity_verifier = verifier if verifier is not None else (SupabaseIdentityVerifier(client) if client else None)

    application.state.account_repository = account_repository

    def account_path(request):
        return request.url.path == "/api/account" or request.url.path.startswith("/api/profile")

    def error_response(request, status, code, message, fields=None):
        detail={"code":code,"message":message}
        if fields is not None:
            detail["fields"]=fields
        response=JSONResponse(status_code=status,content={"detail":detail,"requestId":request.state.request_id})
        if status==401:
            response.headers["WWW-Authenticate"]="Bearer"
        return response

    @application.exception_handler(AccountError)
    async def account_error(request, exc):
        return error_response(request,exc.status,exc.code,exc.message)

    @application.exception_handler(HTTPException)
    async def auth_error(request, exc):
        if account_path(request):
            code="unauthenticated" if exc.status_code==401 else "authentication_unavailable" if exc.status_code==503 else "request_failed"
            return error_response(request,exc.status_code,code,"Authentication required" if exc.status_code==401 else "Authentication is unavailable" if exc.status_code==503 else "Request failed")
        return await http_exception_handler(request,exc)

    @application.exception_handler(RequestValidationError)
    async def validation_error(request,exc):
        if account_path(request):
            allowed={"body","query","header","expectedRevision","profile","changes","name","locale","theme","targets","overall","listening","reading","writing","speaking","testDate","currentLevel","weeklyHours","showFlag","notifications","email","reminders"}
            fields=[{"path":".".join(str(p) if str(p) in allowed else "unknown" for p in item["loc"]),"code":item["type"]} for item in exc.errors()[:20]]
            return error_response(request,422,"invalid_request","Request validation failed",fields)
        return await request_validation_exception_handler(request,exc)

    @application.middleware("http")
    async def private_identity_response(request: Request, call_next):
        request.state.request_id=str(uuid4())
        response = await call_next(request)
        if request.url.path == "/api/me" or account_path(request):
            response.headers["Cache-Control"] = "private, no-store"
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

    return application


app = create_app()
