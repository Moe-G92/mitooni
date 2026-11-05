"""Opt-in localhost-only synthetic HTTP harness. Never imported by app.main."""
import uvicorn
from app.config import BackendConfig
from app.main import create_app
from app.repositories.account import LocalPostgresConfig
from app.repositories.postgres_account import PostgresAccountRepository
from local.fixtures import LocalSyntheticVerifier


def create_local_app():
    config=BackendConfig('http://127.0.0.1:54321','local','synthetic-no-provider-key',environment='test')
    from app.repositories.postgres_study import PostgresStudyRepository
    from app.providers.synthetic_runner import SyntheticRunner
    target=LocalPostgresConfig()
    return create_app(config,verifier=LocalSyntheticVerifier(),account_repository=PostgresAccountRepository(target),study_repository=PostgresStudyRepository(target,runner_kind='synthetic'),tutor_runner=SyntheticRunner(),worker_enabled=True)


if __name__=='__main__':
    # Host cannot be widened by a flag or inherited production setting.
    uvicorn.run(create_local_app(),host='127.0.0.1',port=8009)
