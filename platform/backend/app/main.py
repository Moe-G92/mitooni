"""Bounded receiving app: no business routers, workers, env loading or DB writes."""
from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import Depends, FastAPI, Request
from pydantic import BaseModel
from app.config import BackendConfig
from app.db.supabase_client import TargetSupabaseClient
from app.dependencies import CurrentUser, IdentityVerifier, SupabaseIdentityVerifier, get_current_user


class IdentityOut(BaseModel):
    """Verified identity only; does not imply Mitooni membership or roles."""
    id: str
    email: str | None


def create_app(config: BackendConfig | None = None, *, verifier: IdentityVerifier | None = None) -> FastAPI:
    if verifier is not None and (config is None or config.environment != "test"):
        raise ValueError("Injected identity verification requires explicit test configuration")
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

    @application.middleware("http")
    async def private_identity_response(request: Request, call_next):
        response = await call_next(request)
        if request.url.path == "/api/me":
            response.headers["Cache-Control"] = "private, no-store"
        return response

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/api/me", response_model=IdentityOut)
    def me(user: Annotated[CurrentUser, Depends(get_current_user)]) -> IdentityOut:
        return IdentityOut(id=user.id, email=user.email)

    return application


app = create_app()
