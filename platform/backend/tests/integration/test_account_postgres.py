from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from uuid import UUID, uuid4
import psycopg
import pytest
from fastapi.testclient import TestClient
from app.contracts.account import Onboarding, ProfilePatch
from app.dependencies import CurrentUser
from app.repositories.account import LocalPostgresConfig
from app.repositories.postgres_account import PostgresAccountRepository
from local.seed import admin_connection
from app.main import create_app
from app.config import BackendConfig
from app.dependencies import AuthenticationUnavailable

# Each test module owns disposable subjects; never resets browser A/B profiles.
SUBJECTS = {
    name: str(uuid4()) for name in ["a", "b", "inactive", "nonmember", "readonly"]
}


def create_local_app():
    class Verifier:
        def verify(self, token):
            if token == "local-unavailable":
                raise AuthenticationUnavailable()
            name = token.removeprefix("local-") if token.startswith("local-") else ""
            if name not in SUBJECTS:
                raise ValueError()
            return CurrentUser(SUBJECTS[name], f"{name}@example.invalid")

    return create_app(
        BackendConfig(
            "http://127.0.0.1:54321", "local", "synthetic", environment="test"
        ),
        verifier=Verifier(),
        account_repository=PostgresAccountRepository(LocalPostgresConfig()),
    )


PROFILE = dict(
    name="Synthetic learner",
    locale="fa",
    theme="system",
    targets={
        k: 6.5 for k in ["overall", "listening", "reading", "writing", "speaking"]
    },
    testDate=None,
    currentLevel=None,
    weeklyHours=6,
    showFlag=False,
    notifications={"email": False, "reminders": False},
)


@pytest.fixture(autouse=True)
def isolated_synthetic_rows(request):
    if not request.config.getoption("--local-postgres"):
        pytest.skip("Explicit --local-postgres required; no datastore proof implied")
    with admin_connection() as conn:
        for name in ["a", "b", "inactive", "readonly"]:
            conn.execute(
                "INSERT INTO mitooni_app.memberships(product_id,issuer,subject_id,status,roles,entitlements) VALUES('mitooni',%s,%s,%s,ARRAY['learner'],%s)",
                (
                    LocalPostgresConfig().issuer,
                    SUBJECTS[name],
                    "inactive" if name == "inactive" else "active",
                    [] if name == "readonly" else ["profile:write"],
                ),
            )
    yield
    with admin_connection() as conn:
        for table in ("operations", "profiles", "memberships"):
            conn.execute(
                f"DELETE FROM mitooni_app.{table} WHERE subject_id=ANY(%s::uuid[])",
                (list(SUBJECTS.values()),),
            )


def headers(name="a", key=None):
    return {
        "Authorization": f"Bearer local-{name}",
        "X-Expected-User-Id": SUBJECTS[name],
        "Idempotency-Key": str(key or uuid4()),
    }


def onboarding(c, name="a", key=None, profile=None):
    return c.post(
        "/api/profile/onboarding",
        headers=headers(name, key),
        json={"expectedRevision": 0, "profile": profile or PROFILE},
    )


def patch(c, revision, changes, name="a", key=None):
    return c.patch(
        "/api/profile",
        headers=headers(name, key),
        json={"expectedRevision": revision, "changes": changes},
    )


def test_complete_flow_retention_and_identity_is_not_profile():
    app = create_local_app()
    with TestClient(app) as c:
        account = c.get("/api/account", headers=headers()).json()
        assert account["state"] == "setup-required" and account["profile"] is None
        assert set(c.get("/api/me", headers=headers()).json()) == {"id", "email"}
        assert onboarding(c).json()["profile"]["revision"] == 1
        r = patch(c, 1, {"name": "Changed", "notifications": {"reminders": True}})
        assert r.status_code == 200, r.text
        assert r.json()["profile"]["notifications"] == {
            "email": False,
            "reminders": True,
        }
    # Independent app/repository instances and fresh DB connections retain data.
    with TestClient(create_local_app()) as c:
        data = c.get("/api/account", headers=headers()).json()
        assert data["profile"]["name"] == "Changed" and data["profile"]["revision"] == 2
        assert c.get("/api/account", headers=headers("b")).json()["profile"] is None


@pytest.mark.parametrize(
    "name,state,status",
    [
        ("nonmember", "none", 403),
        ("inactive", "inactive", 403),
        ("readonly", "active", 403),
    ],
)
def test_nonmember_inactive_and_missing_permission_denied(name, state, status):
    with TestClient(create_local_app()) as c:
        account = c.get("/api/account", headers=headers(name)).json()
        assert account["membership"]["status"] == state
        assert account["profile"] is None
        r = onboarding(c, name)
        assert r.status_code == status
        assert r.headers["cache-control"] == "private, no-store"


@pytest.mark.parametrize(
    "field,value",
    [
        ("email", "attacker@example.invalid"),
        ("id", SUBJECTS["b"]),
        ("roles", ["admin"]),
        ("plan", "coach"),
        ("entitlements", ["everything"]),
        ("accommodation", 2),
        ("onboarded", True),
        ("issuer", "forged"),
        ("revision", 99),
    ],
)
def test_mass_assignment_is_rejected_and_safe(field, value):
    with TestClient(create_local_app()) as c:
        onboarding(c)
        r = patch(c, 1, {field: value})
        assert r.status_code == 422, r.text
        assert "attacker@example.invalid" not in r.text
        assert "input" not in str(r.json()["detail"].get("fields", []))
        assert (
            c.get("/api/account", headers=headers()).json()["profile"]["revision"] == 1
        )


def test_expected_user_mismatch_has_no_repository_side_effect():
    with TestClient(create_local_app()) as c:
        h = headers()
        h["X-Expected-User-Id"] = SUBJECTS["b"]
        r = c.post(
            "/api/profile/onboarding",
            headers=h,
            json={"expectedRevision": 0, "profile": PROFILE},
        )
        assert r.status_code == 409 and r.json()["detail"]["code"] == "account_changed"
    with admin_connection() as conn:
        assert (
            conn.execute(
                "SELECT count(*) FROM mitooni_app.operations WHERE subject_id=ANY(%s::uuid[])",
                (list(SUBJECTS.values()),),
            ).fetchone()[0]
            == 0
        )
        assert (
            conn.execute(
                "SELECT count(*) FROM mitooni_app.profiles WHERE subject_id=ANY(%s::uuid[])",
                (list(SUBJECTS.values()),),
            ).fetchone()[0]
            == 0
        )


def test_idempotency_retry_conflict_and_historical_revision_without_old_grants():
    key = uuid4()
    with TestClient(create_local_app()) as c:
        first = onboarding(c, key=key)
        assert first.status_code == 200, first.text
        assert onboarding(c, key=key).json() == first.json()
        assert patch(c, 1, {"name": "Later"}).status_code == 200
        replay = onboarding(c, key=key)
        assert replay.json()["profile"]["revision"] == 1
        assert (
            c.get("/api/account", headers=headers()).json()["profile"]["revision"] == 2
        )
        changed = deepcopy(PROFILE)
        changed["name"] = "Different"
        assert onboarding(c, key=key, profile=changed).status_code == 409
        # Current authority, not old stored grants, controls every replay.
        with admin_connection() as conn:
            conn.execute(
                "UPDATE mitooni_app.memberships SET roles='{}',entitlements=ARRAY['profile:write'] WHERE subject_id=%s",
                (SUBJECTS["a"],),
            )
        assert onboarding(c, key=key).json()["membership"]["roles"] == []
        with admin_connection() as conn:
            conn.execute(
                "UPDATE mitooni_app.memberships SET status='inactive' WHERE subject_id=%s",
                (SUBJECTS["a"],),
            )
        assert onboarding(c, key=key).status_code == 403
        assert c.get("/api/account", headers=headers()).json()["profile"] is None


def test_competing_same_revision_has_one_winner():
    with TestClient(create_local_app()) as c:
        onboarding(c)

        def save(name):
            return patch(c, 1, {"name": name}).status_code

        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(save, ["One", "Two"]))
        assert sorted(statuses) == [200, 409]
        assert (
            c.get("/api/account", headers=headers()).json()["profile"]["revision"] == 2
        )


def test_competing_onboarding_and_same_key_retry():
    with TestClient(create_local_app()) as c:
        key = uuid4()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: onboarding(c, key=key), range(2)))
        assert [r.status_code for r in results] == [200, 200]
        assert results[0].json() == results[1].json()
        with admin_connection() as conn:
            assert (
                conn.execute(
                    "SELECT count(*) FROM mitooni_app.profiles WHERE subject_id=ANY(%s::uuid[])",
                    (list(SUBJECTS.values()),),
                ).fetchone()[0]
                == 1
            )
            assert (
                conn.execute(
                    "SELECT count(*) FROM mitooni_app.operations WHERE subject_id=ANY(%s::uuid[])",
                    (list(SUBJECTS.values()),),
                ).fetchone()[0]
                == 1
            )


def test_revocation_commits_before_waiting_mutation():
    with TestClient(create_local_app()) as c:
        onboarding(c)
        with ThreadPoolExecutor(max_workers=1) as pool:
            with admin_connection() as conn:
                conn.execute(
                    "SELECT * FROM mitooni_app.memberships WHERE subject_id=%s FOR UPDATE",
                    (SUBJECTS["a"],),
                )
                pending = pool.submit(patch, c, 1, {"name": "Must not commit"})
                conn.execute(
                    "UPDATE mitooni_app.memberships SET status='inactive' WHERE subject_id=%s",
                    (SUBJECTS["a"],),
                )
            assert pending.result(timeout=8).status_code == 403
    with admin_connection() as conn:
        assert (
            conn.execute(
                "SELECT revision FROM mitooni_app.profiles WHERE subject_id=%s",
                (SUBJECTS["a"],),
            ).fetchone()[0]
            == 1
        )


def test_grants_rls_cross_subject_and_roles():
    options = LocalPostgresConfig().connection_options()
    with psycopg.connect(**options) as conn:
        # Unscoped BFF sees no rows; browser role has no direct data privilege.
        assert (
            conn.execute("SELECT count(*) FROM mitooni_app.memberships").fetchone()[0]
            == 0
        )
        conn.execute(
            "SELECT set_config('mitooni.issuer',%s,true),set_config('mitooni.subject',%s,true)",
            (LocalPostgresConfig().issuer, SUBJECTS["a"]),
        )
        assert conn.execute(
            "SELECT subject_id FROM mitooni_app.memberships"
        ).fetchall() == [(UUID(SUBJECTS["a"]),)]
        assert (
            conn.execute(
                "SELECT * FROM mitooni_app.memberships WHERE subject_id=%s",
                (SUBJECTS["b"],),
            ).fetchall()
            == []
        )
    for sql in [
        "UPDATE mitooni_app.memberships SET roles=ARRAY['admin']",
        "UPDATE mitooni_app.memberships SET status='active'",
        "INSERT INTO mitooni_app.memberships VALUES('mitooni','x',gen_random_uuid(),'active','{}','{}',1)",
    ]:
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            with psycopg.connect(**options) as conn:
                conn.execute(sql)
    with admin_connection() as conn:
        assert (
            conn.execute(
                "SELECT has_schema_privilege('mitooni_browser','mitooni_app','USAGE')"
            ).fetchone()[0]
            is False
        )
        assert (
            conn.execute(
                "SELECT bool_and(relrowsecurity) FROM pg_class WHERE relnamespace='mitooni_app'::regnamespace AND relkind='r'"
            ).fetchone()[0]
            is True
        )


def test_replay_expiry_and_bound_limit():
    with TestClient(create_local_app()) as c:
        key = uuid4()
        onboarding(c, key=key)
        with admin_connection() as conn:
            conn.execute(
                "UPDATE mitooni_app.operations SET created_at=now()-interval '25 hours'"
            )
        assert onboarding(c, key=key).status_code == 409


def test_new_route_errors_401_vs_503_no_store():
    with TestClient(create_local_app()) as c:
        for token, status, code in [
            ("expired", 401, "unauthenticated"),
            ("local-unavailable", 503, "authentication_unavailable"),
        ]:
            r = c.get("/api/account", headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == status and r.json()["detail"]["code"] == code
            assert r.headers["cache-control"] == "private, no-store"
            assert r.headers["vary"] == "Authorization"
            assert set(r.json()) == {"detail", "requestId"}


def test_other_issuer_does_not_grant_membership():
    with admin_connection() as conn:
        conn.execute(
            "INSERT INTO mitooni_app.memberships VALUES('mitooni','https://other-issuer.invalid',%s,'active',ARRAY['admin'],ARRAY['profile:write'],1)",
            (SUBJECTS["nonmember"],),
        )
    try:
        with TestClient(create_local_app()) as c:
            r = c.get("/api/account", headers=headers("nonmember"))
            assert r.json()["membership"] == {
                "status": "none",
                "roles": [],
                "entitlements": [],
            }
            assert onboarding(c, "nonmember").status_code == 403
    finally:
        with admin_connection() as conn:
            conn.execute(
                "DELETE FROM mitooni_app.memberships WHERE issuer='https://other-issuer.invalid'"
            )


def test_operation_count_bound_and_profile_unchanged():
    with TestClient(create_local_app()) as c:
        onboarding(c)
        with admin_connection() as conn:
            conn.execute("DELETE FROM mitooni_app.operations")
            conn.execute(
                "INSERT INTO mitooni_app.operations SELECT 'mitooni',%s,%s,'profile',md5(i::text)::uuid,repeat('a',64),'{}'::jsonb,now() FROM generate_series(1,256) i",
                (LocalPostgresConfig().issuer, SUBJECTS["a"]),
            )
        r = patch(c, 1, {"name": "Not saved"})
        assert r.status_code == 429 and r.json()["detail"]["code"] == "operation_limit"
        assert (
            c.get("/api/account", headers=headers()).json()["profile"]["revision"] == 1
        )


def test_rls_denies_browser_even_if_table_grants_mistakenly_added():
    with admin_connection() as conn:
        conn.execute("GRANT USAGE ON SCHEMA mitooni_app TO mitooni_browser")
        conn.execute("GRANT SELECT ON mitooni_app.memberships TO mitooni_browser")
        conn.execute("SET LOCAL ROLE mitooni_browser")
        assert (
            conn.execute("SELECT count(*) FROM mitooni_app.memberships").fetchone()[0]
            == 0
        )
        conn.rollback()  # leave actual default-deny grants unchanged


def test_operation_key_owner_scope_and_patch_replay():
    key = uuid4()
    with TestClient(create_local_app()) as c:
        assert onboarding(c, key=key).status_code == 200
        assert onboarding(c, "b", key=key).status_code == 200
        patch_key = uuid4()
        first = patch(c, 1, {"name": "A only"}, key=patch_key)
        repeat = patch(c, 1, {"name": "A only"}, key=patch_key)
        assert repeat.status_code == 200 and repeat.json() == first.json()
        assert (
            c.get("/api/account", headers=headers("b")).json()["profile"]["name"]
            == PROFILE["name"]
        )
    # An A-scoped backend connection cannot see/update B's stored profile.
    with psycopg.connect(**LocalPostgresConfig().connection_options()) as conn:
        conn.execute(
            "SELECT set_config('mitooni.issuer',%s,true),set_config('mitooni.subject',%s,true)",
            (LocalPostgresConfig().issuer, SUBJECTS["a"]),
        )
        assert (
            conn.execute(
                "UPDATE mitooni_app.profiles SET revision=999 WHERE subject_id=%s",
                (SUBJECTS["b"],),
            ).rowcount
            == 0
        )


def test_unknown_key_and_input_values_not_reflected_in_validation():
    with TestClient(create_local_app()) as c:
        r = patch(c, 1, {"sensitive-untrusted-key@example.invalid": "sensitive-value"})
        assert r.status_code == 422
        assert "sensitive" not in r.text
        assert r.json()["detail"]["fields"][0]["path"] == "body.changes.unknown"


def test_corrupt_stored_projection_and_replay_are_safe_503(caplog):
    from psycopg.types.json import Jsonb

    key = uuid4()
    with TestClient(create_local_app()) as c:
        assert onboarding(c, key=key).status_code == 200
        corrupt = {"name": "sensitive-stored-profile", "weeklyHours": "wrong-type"}
        with admin_connection() as conn:
            conn.execute(
                "UPDATE mitooni_app.profiles SET data=%s WHERE subject_id=%s",
                (Jsonb(corrupt), SUBJECTS["a"]),
            )
            conn.execute(
                "UPDATE mitooni_app.operations SET outcome=%s WHERE subject_id=%s",
                (
                    Jsonb({"profile": corrupt | {"revision": 1, "onboarded": True}}),
                    SUBJECTS["a"],
                ),
            )
        responses = [
            c.get("/api/account", headers=headers()),
            onboarding(c, key=key),
            patch(c, 1, {"theme": "dark"}),
        ]
        assert [r.status_code for r in responses] == [503, 503, 503]
        for r in responses:
            assert r.json()["detail"]["code"] == "store_unavailable"
            assert "sensitive-stored" not in r.text
            assert r.headers["cache-control"] == "private, no-store"
        assert "sensitive-stored" not in caplog.text


@pytest.mark.parametrize("corrupt", [None, "sensitive-corrupt-snapshot", []])
def test_corrupt_replay_shapes_are_safe_503(corrupt, caplog):
    from psycopg.types.json import Jsonb

    key = uuid4()
    with TestClient(create_local_app()) as c:
        assert onboarding(c, key=key).status_code == 200
        with admin_connection() as conn:
            conn.execute(
                "UPDATE mitooni_app.operations SET outcome=%s WHERE subject_id=%s",
                (Jsonb({"profile": corrupt}), SUBJECTS["a"]),
            )
        r = onboarding(c, key=key)
        assert (
            r.status_code == 503 and r.json()["detail"]["code"] == "store_unavailable"
        )
        assert "sensitive-corrupt" not in r.text + caplog.text


def test_commit_then_lost_ack_retries_one_logical_result(monkeypatch):
    from app.repositories.account import AccountError

    original = PostgresAccountRepository.mutate
    lost = [False]

    def drop_first_ack(self, *args, **kwargs):
        committed = original(self, *args, **kwargs)
        if not lost[0]:
            lost[0] = True
            raise AccountError("store_unavailable", 503, "Acknowledgement unavailable")
        return committed

    monkeypatch.setattr(PostgresAccountRepository, "mutate", drop_first_ack)
    key = uuid4()
    with TestClient(create_local_app()) as c:
        assert onboarding(c, key=key).status_code == 503
        retry = onboarding(c, key=key)
        assert retry.status_code == 200 and retry.json()["profile"]["revision"] == 1
        with admin_connection() as conn:
            assert (
                conn.execute(
                    "SELECT count(*) FROM mitooni_app.profiles WHERE subject_id=ANY(%s::uuid[])",
                    (list(SUBJECTS.values()),),
                ).fetchone()[0]
                == 1
            )
            assert (
                conn.execute(
                    "SELECT count(*) FROM mitooni_app.operations WHERE subject_id=ANY(%s::uuid[])",
                    (list(SUBJECTS.values()),),
                ).fetchone()[0]
                == 1
            )
