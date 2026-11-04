"""BarEx-derived verified Bearer identity boundary, without role/dev bypasses."""
from dataclasses import dataclass
from typing import Protocol
from fastapi import Header, HTTPException, Request
from app.db.supabase_client import TargetSupabaseClient


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None = None


class IdentityVerifier(Protocol):
    def verify(self, token: str) -> CurrentUser: ...


class SupabaseIdentityVerifier:
    def __init__(self, client: TargetSupabaseClient) -> None:
        self.client = client

    def verify(self, token: str) -> CurrentUser:
        response = self.client.get().auth.get_user(token)
        if response.user is None or not response.user.id:
            raise ValueError("Invalid identity")
        return CurrentUser(id=str(response.user.id), email=response.user.email)


def get_current_user(request: Request, authorization: str | None = Header(default=None)) -> CurrentUser:
    verifier = request.app.state.identity_verifier
    if verifier is None:
        raise HTTPException(status_code=503, detail="Authentication is not configured")
    scheme, separator, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not separator or not token.strip():
        raise HTTPException(status_code=401, detail="Authorization header required", headers={"WWW-Authenticate": "Bearer"})
    try:
        user = verifier.verify(token)
        if not isinstance(user, CurrentUser) or not user.id:
            raise ValueError("Invalid identity")
        return user
    except Exception:
        # Never log a token, provider exception or untrusted claims.
        raise HTTPException(status_code=401, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"}) from None
