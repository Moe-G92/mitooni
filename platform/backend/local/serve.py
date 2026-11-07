"""Opt-in localhost-only synthetic HTTP harness. Never imported by app.main."""
import uvicorn
from app.config import BackendConfig
from app.main import create_app
from app.repositories.account import LocalPostgresConfig
from app.repositories.postgres_account import PostgresAccountRepository
from local.fixtures import LocalSyntheticVerifier


def create_local_app(review_configuration=None, *, speaking_synthetic=False):
    config=BackendConfig('http://127.0.0.1:54321','local','synthetic-no-provider-key',environment='test')
    from app.repositories.postgres_study import PostgresStudyRepository
    from app.providers.synthetic_runner import SyntheticRunner
    target=LocalPostgresConfig()
    from app.repositories.postgres_content_review import PostgresContentReviewRepository
    from local.review_fixtures import LocalReviewVerifier
    from app.repositories.postgres_speaking_review import PostgresSpeakingReviewRepository
    from local.speaking_fixtures import SyntheticSpeakingRunner
    if speaking_synthetic and review_configuration is None:
        raise ValueError('Synthetic Speaking requires explicit review package')
    speaking_repo=PostgresSpeakingReviewRepository(target,review_configuration,call_budget=8 if speaking_synthetic else 0,provider_enabled=speaking_synthetic) if review_configuration else None
    return create_app(config,speaking_review_repository=speaking_repo,speaking_runner=SyntheticSpeakingRunner() if speaking_synthetic else None,speaking_worker_enabled=speaking_synthetic,verifier=LocalReviewVerifier() if review_configuration else LocalSyntheticVerifier(),account_repository=PostgresAccountRepository(target),study_repository=PostgresStudyRepository(target,runner_kind='synthetic'),tutor_runner=SyntheticRunner(),worker_enabled=True,content_review_repository=PostgresContentReviewRepository(target, review_configuration) if review_configuration else None)


if __name__=='__main__':
    # Host cannot be widened by a flag or inherited production setting.
    import argparse
    from pathlib import Path
    from app.services.content_review import ReviewPackageConfiguration
    p = argparse.ArgumentParser()
    p.add_argument('--review-package-root', type=Path)
    p.add_argument('--review-package-hash')
    p.add_argument('--speaking-synthetic', action='store_true')
    args = p.parse_args()
    if bool(args.review_package_root) != bool(args.review_package_hash):
        p.error('Both explicit review package root and hash are required')
    review = ReviewPackageConfiguration(args.review_package_root, args.review_package_hash) if args.review_package_root else None
    if review:
        review.load()
    uvicorn.run(create_local_app(review,speaking_synthetic=args.speaking_synthetic),host='127.0.0.1',port=8009)
