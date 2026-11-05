"""Explicit receiving composition; no env-file loading or fixture discovery."""

from dataclasses import dataclass, field
from app.config import BackendConfig
from app.main import create_app
from app.repositories.postgres_target import ReceivingPostgresTarget
from app.repositories.postgres_account import PostgresAccountRepository
from app.repositories.postgres_study import PostgresStudyRepository


@dataclass(frozen=True)
class ProviderConfiguration:
    model: str
    api_key: str = field(repr=False)
    call_budget: int


def create_receiving_app(
    config: BackendConfig,
    target: ReceivingPostgresTarget,
    provider: ProviderConfiguration | None = None,
):
    if (
        config.environment != "production"
        or target.environment != "production"
        or target.issuer != config.supabase_url.rstrip("/") + "/auth/v1"
    ):
        raise ValueError(
            "Explicit matching production receiving identity and database required"
        )
    runner = None
    if provider is not None:
        from app.providers.agents_runner import AgentsRunner

        runner = AgentsRunner(api_key=provider.api_key, model=provider.model)
    return create_app(
        config,
        account_repository=PostgresAccountRepository(target),
        study_repository=PostgresStudyRepository(
            target, call_budget=provider.call_budget if provider else 1
        ),
        tutor_runner=runner,
        worker_enabled=runner is not None,
    )
