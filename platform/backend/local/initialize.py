"""Apply original local-only schema once to our isolated database, then seed."""
from pathlib import Path
from local.seed import admin_connection,seed


if __name__=='__main__':
    with admin_connection() as conn:
        exists=conn.execute("SELECT to_regclass('mitooni_app.memberships')").fetchone()[0]
        if exists is None:
            conn.execute(Path(__file__).with_name('schema.sql').read_text())
    seed()
