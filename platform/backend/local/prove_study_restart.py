"""Opt-in restart durability proof for owned synthetic database; no reset.

Coordinate browser/API reviewers first. Uses a disposable synthetic owner,
retains all other profiles/work, and restarts only labelled local container.
"""

import asyncio
import subprocess
import sys
import time
from uuid import uuid4
from app.dependencies import CurrentUser
from app.repositories.account import LocalPostgresConfig
from app.repositories.postgres_study import PostgresStudyRepository
from app.contracts.study import ResolveIn, DraftIn, TurnIn
from app.providers.synthetic_runner import SyntheticRunner
from app.workers.tutor_turns import TutorWorker
from local.seed import admin_connection
from local.manage import owned, NAME, run


def main():
    if not owned("container"):
        raise RuntimeError("Owned local database is absent")
    config = LocalPostgresConfig()
    user = CurrentUser(str(uuid4()))
    r = PostgresStudyRepository(config, runner_kind="synthetic")
    with admin_connection() as c:
        c.execute(
            "INSERT INTO mitooni_app.memberships(product_id,issuer,subject_id,status,roles,entitlements) VALUES('mitooni',%s,%s,'active',ARRAY['learner'],ARRAY['study:use','tutor:use'])",
            (config.issuer, user.id),
        )
    try:
        w = r.call(
            user,
            "resolve",
            ResolveIn(
                stepId="writing-reasons",
                conditionPreset="supported",
                expectedJourneyRevision=1,
            ),
            uuid4(),
        )
        d = r.call(
            user,
            "draft",
            DraftIn(
                expectedDraftRevision=1,
                taskId=w["draft"]["taskId"],
                changes={
                    "text": "Libraries should keep books while improving digital access because residents need different ways to read."
                },
            ),
            uuid4(),
            w["id"],
        )
        t = r.call(
            user,
            "turn",
            TurnIn(
                expectedWorkspaceRevision=1,
                workRef={"kind": "draft", "id": d["id"], "revision": d["revision"]},
                intent="explain",
                message="Explain a repair step",
            ),
            uuid4(),
            w["id"],
        )
        row = next(x for x in r.queue() if str(x["turn_id"]) == t["id"])
        asyncio.run(TutorWorker(r, SyntheticRunner()).process(row))
        before = r.call(user, "workspace", target=w["id"])
        beforeturn = r.poll(user, t["id"])
        assert beforeturn["turn"]["status"] == "completed"
        run("restart", NAME, capture_output=True)
        for _ in range(100):
            try:
                with admin_connection() as c:
                    c.execute("SELECT 1")
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("Local database did not become ready")
        fresh = PostgresStudyRepository(config, runner_kind="synthetic")
        assert fresh.call(user, "workspace", target=w["id"]) == before
        assert fresh.poll(user, t["id"]) == beforeturn
        print(
            "PASS actual local PostgreSQL restart retained exact draft, bundle, completed turn and message; no redispatch/reset"
        )
    finally:
        with admin_connection() as c:
            for table in ["study_queue", "study_operations", "study_states"]:
                c.execute(
                    f"DELETE FROM mitooni_app.{table} WHERE issuer=%s AND subject_id=%s",
                    (config.issuer, user.id),
                )
            c.execute(
                "DELETE FROM mitooni_app.memberships WHERE issuer=%s AND subject_id=%s",
                (config.issuer, user.id),
            )


if __name__ == "__main__":
    main()
