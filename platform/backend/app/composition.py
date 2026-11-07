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


@dataclass(frozen=True)
class SpeakingProviderConfiguration:
    model: str
    api_key: str = field(repr=False)
    call_budget: int


def create_receiving_app(
    config: BackendConfig,
    target: ReceivingPostgresTarget,
    provider: ProviderConfiguration | None = None,
    review_configuration=None,
    speaking_provider: SpeakingProviderConfiguration | None = None,
    learner_catalog=None,
    learner_runner=None,
    learner_budget_policy_id=None,
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
    from app.repositories.postgres_content_review import PostgresContentReviewRepository
    from app.repositories.postgres_speaking_review import PostgresSpeakingReviewRepository
    from app.providers.speaking_runner import SpeakingRunner
    speaking_runner = SpeakingRunner(api_key=speaking_provider.api_key, model=speaking_provider.model) if speaking_provider else None
    if speaking_provider and review_configuration is None:
        raise ValueError("Speaking requires explicit review package")
    from app.repositories.postgres_learner import PostgresLearnerRepository
    learner_repository = PostgresLearnerRepository(target,learner_catalog,provider_enabled=learner_runner is not None,budget_policy_id=learner_budget_policy_id) if learner_catalog is not None else None
    return create_app(
        config,
        learner_repository=learner_repository,
        learner_runner=learner_runner,
        learner_worker_enabled=learner_runner is not None,
        account_repository=PostgresAccountRepository(target),
        study_repository=PostgresStudyRepository(
            target, call_budget=provider.call_budget if provider else 1
        ),
        speaking_review_repository=PostgresSpeakingReviewRepository(target, review_configuration,call_budget=speaking_provider.call_budget if speaking_provider else 0,provider_enabled=speaking_runner is not None) if review_configuration else None,
        speaking_runner=speaking_runner,
        speaking_worker_enabled=speaking_runner is not None,
        tutor_runner=runner,
        worker_enabled=runner is not None,
        content_review_repository=PostgresContentReviewRepository(target, review_configuration) if review_configuration else None,
    )
