"""Explicit additive local-only upgrade; preserves all profiles and work."""

from pathlib import Path
from psycopg.types.json import Jsonb
from local.seed import admin_connection
from local.fixtures import SUBJECTS
from local.study_catalog import packs
from app.services.study_editions import manifest_hash
from app.repositories.account import LocalPostgresConfig


def upgrade():
    with admin_connection() as conn:
        conn.execute(Path(__file__).with_name("study-upgrade.sql").read_text())
        for p in packs():
            conn.execute(
                "INSERT INTO mitooni_app.study_packs(id,version,content_hash,data,manifest_hash,status,fixture,allowed_uses) VALUES(%s,%s,%s,%s,%s,'approved',true,ARRAY['learner_delivery','model_context']) ON CONFLICT(id,version) DO NOTHING",
                (
                    p["stepId"],
                    1,
                    p["bundleRef"]["contentHash"],
                    Jsonb(p),
                    manifest_hash(p),
                ),
            )
        # Attest legacy task-local fixtures only; never rewrite their payload,
        # edition hash, submitted work or publication decisions on later runs.
        legacy = conn.execute(
            "SELECT id,version,data FROM mitooni_app.study_packs WHERE manifest_hash IS NULL"
        ).fetchall()
        for pack_id, version, data in legacy:
            if data.get("publication") != "synthetic-engineering-only":
                raise RuntimeError(
                    "Unrecognized local legacy pack requires explicit review"
                )
            conn.execute(
                "UPDATE mitooni_app.study_packs SET manifest_hash=%s,status='approved',fixture=true,allowed_uses=ARRAY['learner_delivery','model_context'] WHERE id=%s AND version=%s AND manifest_hash IS NULL",
                (manifest_hash(data), pack_id, version),
            )
        for name in ["a", "b"]:
            conn.execute(
                "UPDATE mitooni_app.memberships SET entitlements=ARRAY(SELECT DISTINCT unnest(entitlements || ARRAY['study:use','tutor:use','study:independent'])),revision=revision+1 WHERE issuer=%s AND subject_id=%s",
                (LocalPostgresConfig().issuer, SUBJECTS[name]),
            )
    print(
        "Additive synthetic study schema/catalog/entitlements ready; existing work retained"
    )


if __name__ == "__main__":
    upgrade()
