"""Explicit synthetic-only local provisioning. No application enrollment route."""
import psycopg
from app.repositories.account import LocalPostgresConfig
from local.fixtures import SUBJECTS


def admin_connection():
    options=LocalPostgresConfig().connection_options() | {'user':'mitooni_admin'}
    return psycopg.connect(**options)


def seed():
    with admin_connection() as conn:
        for name in ('a','b','inactive','readonly'):
            conn.execute("INSERT INTO mitooni_app.memberships(product_id,issuer,subject_id,status,roles,entitlements) VALUES('mitooni',%s,%s,%s,%s,%s) ON CONFLICT(product_id,issuer,subject_id) DO UPDATE SET status=excluded.status,roles=excluded.roles,entitlements=excluded.entitlements,revision=mitooni_app.memberships.revision+1",(
                LocalPostgresConfig().issuer,SUBJECTS[name],'inactive' if name=='inactive' else 'active',['learner'],[] if name=='readonly' else ['profile:write']))
    print('Synthetic local membership fixtures provisioned; no profiles or real identities created')


if __name__=='__main__':
    seed()
