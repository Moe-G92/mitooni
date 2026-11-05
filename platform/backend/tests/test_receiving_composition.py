import socket
import pytest
from app.config import BackendConfig
from app.composition import create_receiving_app, ProviderConfiguration
from app.repositories.postgres_target import ReceivingPostgresTarget
from app.repositories.postgres_study import PostgresStudyRepository
from app.repositories.account import LocalPostgresConfig
from app.main import create_app
from app.providers.synthetic_runner import SyntheticRunner
from app.repositories.postgres_account import PostgresAccountRepository


def target(**kw):
    fields = dict(
        host="db.example.supabase.co",
        hostaddr="192.0.2.10",
        database="mitooni",
        issuer="https://example.supabase.co/auth/v1",
        user="mitooni_api",
        password="synthetic-only",
    )
    fields.update(kw)
    return ReceivingPostgresTarget(**fields)


def test_production_composition_constructs_without_network(monkeypatch):
    def denied(*a, **kw):
        raise AssertionError("Unexpected network")

    monkeypatch.setattr(socket.socket, "connect", denied)
    config = BackendConfig(
        "https://example.supabase.co",
        "example",
        "synthetic-only",
        environment="production",
    )
    app = create_receiving_app(
        config,
        target(),
        ProviderConfiguration("test-model", "synthetic-only", call_budget=16),
    )
    assert app.state.tutor_runner.kind == "provider"
    assert "/api/study/journey" in {r.path for r in app.routes}
    assert app.state.study_repository.config.environment == "production"


@pytest.mark.parametrize(
    "kw",
    [
        {"host": "127.0.0.1"},
        {"password": ""},
        {"user": "postgres"},
        {"schema": "public"},
        {"issuer": "http://example/auth/v1"},
    ],
)
def test_target_dangerous_defaults_rejected(kw):
    with pytest.raises(ValueError):
        target(**kw)


def test_synthetic_runner_not_admitted_production():
    config = BackendConfig(
        "https://example.supabase.co",
        "example",
        "synthetic-only",
        environment="production",
    )
    t = target()
    with pytest.raises(ValueError):
        create_app(
            config,
            account_repository=PostgresAccountRepository(t),
            study_repository=PostgresStudyRepository(t, call_budget=16),
            tutor_runner=SyntheticRunner(),
        )
    with pytest.raises(ValueError):
        PostgresStudyRepository(t)
