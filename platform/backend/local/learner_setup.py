"""Explicit additive setup of the isolated synthetic learner database only."""
from pathlib import Path
import psycopg
from app.repositories.account import LocalPostgresConfig
from local.fixtures import SUBJECTS as ACCOUNT_SUBJECTS
from psycopg.types.json import Jsonb

SUBJECTS = ACCOUNT_SUBJECTS | {
    "acceptance-a": "00000101-0000-4000-8000-000000000000",
    "acceptance-c": "00000105-0000-4000-8000-000000000000",
    "acceptance-b": "00000102-0000-4000-8000-000000000000",
    "browser-a": "00000103-0000-4000-8000-000000000000",
    "browser-b": "00000104-0000-4000-8000-000000000000",
}

CONFIG = LocalPostgresConfig(port=55440)


def admin_connection():
    return psycopg.connect(**(CONFIG.connection_options() | {'user': 'mitooni_admin'}))


def publish_catalog(catalog_hash: str, withdrawn_task_ids: list[str] | None = None):
    """Explicit admin-only local admission after a private catalogue is loaded.

    withdrawn_task_ids explicitly denies tasks. The default publishes
    the entire admitted catalogue. No call is made automatically during setup.
    """
    with admin_connection() as conn:
        conn.execute("""INSERT INTO mitooni_app.learner_publications(catalog_hash,data)
            VALUES(%s,%s) ON CONFLICT(catalog_hash) DO UPDATE
            SET data=excluded.data,lock_revision=mitooni_app.learner_publications.lock_revision+1""",
            (catalog_hash, Jsonb({"status": "approved", "allowedUses": ["learner_delivery"],
                                 "withdrawnTaskIds": withdrawn_task_ids or []})))


def main():
    root = Path(__file__).resolve().parents[1]
    with admin_connection() as conn:
        # Connect options pin local loopback/port and disable credential fallbacks.
        for role, login in (('mitooni_api', 'LOGIN'), ('mitooni_browser', 'NOLOGIN')):
            if conn.execute('SELECT 1 FROM pg_roles WHERE rolname=%s', (role,)).fetchone() is None:
                conn.execute(f'CREATE ROLE {role} {login} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS')
        if conn.execute("SELECT to_regclass('mitooni_app.memberships')").fetchone()[0] is None:
            conn.execute((root / 'deployment/receiving-schema.sql').read_text())
        conn.execute((root / 'deployment/learner-schema.sql').read_text())
        for name in ('a', 'b', 'inactive', 'readonly', 'acceptance-a', 'acceptance-b', 'acceptance-c', 'browser-a', 'browser-b'):
            conn.execute("""INSERT INTO mitooni_app.memberships
                (product_id,issuer,subject_id,status,roles,entitlements)
                VALUES('mitooni',%s,%s,%s,%s,%s)
                ON CONFLICT(product_id,issuer,subject_id) DO UPDATE SET entitlements=excluded.entitlements""",
                (CONFIG.issuer, SUBJECTS[name], 'inactive' if name == 'inactive' else 'active',
                 ['learner'], [] if name == 'readonly' else
                 ['profile:write', 'learner:use', 'learner:tutor', 'study:use', 'tutor:use', 'study:independent']))
    print('Isolated learner schema and synthetic memberships ready on 127.0.0.1:55440')


if __name__ == '__main__':
    main()
