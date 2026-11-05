"""Opt-in localhost-only synthetic HTTP harness. Never imported by app.main."""
import uvicorn
from app.config import BackendConfig
from app.main import create_app
from app.repositories.account import LocalPostgresConfig
from app.repositories.postgres_account import PostgresAccountRepository
from local.fixtures import LocalSyntheticVerifier


def create_local_app():
    config=BackendConfig('http://127.0.0.1:54321','local','synthetic-no-provider-key',environment='test')
    return create_app(config,verifier=LocalSyntheticVerifier(),account_repository=PostgresAccountRepository(LocalPostgresConfig()))


if __name__=='__main__':
    # Host cannot be widened by a flag or inherited production setting.
    uvicorn.run(create_local_app(),host='127.0.0.1',port=8009)
