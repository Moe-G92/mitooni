"""Explicit additive local reviewer assignment; no reset or roster overwrite."""
import argparse
from pathlib import Path
from local.seed import admin_connection
from local.review_fixtures import REVIEWER_ID
from app.repositories.account import LocalPostgresConfig
from app.services.content_review import ReviewPackageConfiguration


def upgrade(root: Path, expected_hash: str):
    package = ReviewPackageConfiguration(root, expected_hash).load()
    with admin_connection() as conn:
        conn.execute(Path(__file__).with_name('content-review-upgrade.sql').read_text())
        # Independent reviewer authorization; no learner profile or roles needed.
        # A revoked/changed assignment is never reactivated by rerunning setup.
        conn.execute("INSERT INTO mitooni_app.content_review_assignments(product_id,issuer,subject_id,package_hash,status,permissions) VALUES('mitooni',%s,%s,%s,'active',ARRAY['review:use']) ON CONFLICT DO NOTHING", (LocalPostgresConfig().issuer, REVIEWER_ID, package.hash))
    print('Additive local synthetic reviewer schema and exact package assignment ready')

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--package-root', required=True, type=Path)
    p.add_argument('--package-hash', required=True)
    args = p.parse_args()
    upgrade(args.package_root, args.package_hash)
