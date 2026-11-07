"""Additive local schema; separate explicit synthetic permission grant."""
import argparse
from pathlib import Path
from local.seed import admin_connection
from local.review_fixtures import REVIEWER_ID
from app.repositories.account import LocalPostgresConfig
from app.services.content_review import ReviewPackageConfiguration

def upgrade(root,expected_hash,*,grant_synthetic=False):
    package=ReviewPackageConfiguration(root,expected_hash).load()
    with admin_connection() as c:
        c.execute(Path(__file__).with_name('speaking-review-upgrade.sql').read_text())
        if grant_synthetic:
            # Deliberate synthetic grant only; never create/reactivate a revoked assignment.
            c.execute("UPDATE mitooni_app.content_review_assignments SET permissions=ARRAY['review:use','review:speaking-evaluate'] WHERE product_id='mitooni' AND issuer=%s AND subject_id=%s AND package_hash=%s AND status='active' AND permissions=ARRAY['review:use']",(LocalPostgresConfig().issuer,REVIEWER_ID,package.hash))
    print('Additive local Speaking schema ready; no provider or production configuration changed')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--package-root',required=True,type=Path);p.add_argument('--package-hash',required=True);p.add_argument('--grant-synthetic-speaking',action='store_true')
    args=p.parse_args();upgrade(args.package_root,args.package_hash,grant_synthetic=args.grant_synthetic_speaking)
