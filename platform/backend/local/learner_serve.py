"""Opt-in isolated candidate HTTP. Synthetic identities only; no model discovery."""
from pathlib import Path
import argparse
import uvicorn
from app.config import BackendConfig
from app.main import create_app
from app.dependencies import CurrentUser
from app.repositories.postgres_account import PostgresAccountRepository
from app.repositories.postgres_learner import PostgresLearnerRepository
from app.services.learner_content import LearnerCatalog
from local.learner_setup import CONFIG,SUBJECTS
class LearnerVerifier:
    def verify(self,token):
        name=token.removeprefix('fixture-')
        if token!='fixture-'+name or name not in SUBJECTS:raise ValueError('Invalid synthetic identity')
        return CurrentUser(str(SUBJECTS[name]),name+'@example.invalid')
def create_local_learner_app(catalog_root):
    catalog=LearnerCatalog(Path(catalog_root))
    config=BackendConfig('http://127.0.0.1:54321','local','synthetic-no-provider-key',environment='test')
    return create_app(config,verifier=LearnerVerifier(),account_repository=PostgresAccountRepository(CONFIG),learner_repository=PostgresLearnerRepository(CONFIG,catalog))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--catalog-root',type=Path,required=True);args=parser.parse_args()
    uvicorn.run(create_local_learner_app(args.catalog_root),host='127.0.0.1',port=8011)
