"""Deploy boundary probes; no production identity, database or network access."""
import importlib.util
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

SPEC = importlib.util.spec_from_file_location("beta_entrypoint", Path(__file__).with_name("entrypoint.py"))
beta = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(beta)


def client(tmp_path, readiness=lambda: None):
    (tmp_path / "index.html").write_text("<html>Mo account application</html>")
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "main.js").write_text("/* public UI */")
    app = FastAPI()
    @app.get("/api/content-review/catalog")
    def protected():
        from fastapi import HTTPException
        raise HTTPException(401)
    return TestClient(beta.attach_delivery(app, tmp_path, {"beta.example", "healthcheck.railway.app"}, readiness), base_url="https://beta.example")


def test_delivery_keeps_api_and_private_paths_out_of_spa(tmp_path):
    with client(tmp_path) as c:
        assert c.get("/app/content-review/fnd-reading-train").status_code == 200
        assert "Mo account" in c.get("/sign-in").text
        assert c.get("/api/content-review/catalog").status_code == 401
        for path in ("/api", "/api/no-such-route", "/private/review/manifest.json", "/content/source-index.json", "/.env", "/assets/nope.json", "/deployment/entrypoint.py"):
            response = c.get(path)
            assert response.status_code == 404
            assert "Mo account" not in response.text
        assert c.get("/assets/main.js").text == "/* public UI */"
        assert c.get("/app").headers["cache-control"] == "private, no-store"
        assert c.get("/app").headers["x-robots-tag"].startswith("noindex")


def test_fresh_learner_deep_link_serves_only_app_bootstrap(tmp_path):
    workspace = "11111111-1111-4111-8111-111111111111"
    # Fresh client has no cookies/token or prior SPA navigation. This is the
    # deployment reload path, not an in-app React Router transition.
    with client(tmp_path) as c:
        response = c.get("/learn/" + workspace)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/html")
        assert response.text == "<html>Mo account application</html>"
        assert response.headers["cache-control"] == "private, no-store"
        for path in ("/learn", "/learn/not-a-workspace", "/learn/" + workspace + "/answers",
                     "/learn/" + workspace + ".json", "/learn/" + workspace + "/.env",
                     "/api/learner/invalid", "/api/learner/workspaces/" + workspace,
                     "/private/learner/catalog.json", "/assets/catalog.json"):
            denied = c.get(path)
            assert denied.status_code == 404
            assert "Mo account" not in denied.text
        assert c.get("/api/content-review/catalog").status_code == 401


def test_readiness_host_and_error_are_sanitized(tmp_path):
    def unavailable():
        raise ValueError("SENSITIVE_SYNTHETIC_MARKER")
    with client(tmp_path, unavailable) as c:
        assert c.get("/ready", headers={"host": "healthcheck.railway.app"}).status_code == 503
        assert c.get("/ready").json() == {"status": "unavailable"}
        assert "SENSITIVE" not in c.get("/ready").text
        for host in ("other.example", "beta.example.evil", "beta.example:443"):
            assert c.get("/ready", headers={"host": host}).status_code == 400
        denied = c.get("/api/content-review/catalog", headers={"host": "other.example"})
        assert denied.status_code == 400 and denied.headers["vary"] == "Authorization"
        assert denied.headers["x-content-type-options"] == "nosniff"
        assert denied.headers["cache-control"] == "private, no-store"
        assert denied.json()["requestId"] and "other.example" not in denied.text
        malicious = c.get("/api/content-review/catalog", headers={"host": "evil/assets/"})
        assert malicious.status_code == 400 and malicious.headers["cache-control"] == "private, no-store"


def test_ready_is_not_learner_membership(tmp_path):
    with client(tmp_path) as c:
        assert c.get("/ready").json() == {"status": "ready"}


def test_unconfigured_beta_and_main_fail_closed_without_details(monkeypatch, capsys):
    with pytest.raises(beta.ConfigurationUnavailable, match="^Beta configuration unavailable$"):
        beta.create_beta({"MITOONI_AUTH_SERVICE_KEY": "SENSITIVE_SYNTHETIC_MARKER"})
    monkeypatch.delenv("PORT", raising=False)
    assert beta.main() == 1
    assert capsys.readouterr().err == "Beta configuration unavailable\n"


def test_readiness_requires_forced_rls_and_frozen_attempt_trigger(monkeypatch):
    queries = []
    class Connection:
        forced = True
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def execute(self, sql, params):
            queries.append((sql, params))
            self.trigger = "pg_trigger" in sql
            return self
        def fetchall(self):
            return [{"table_name": table, "column_name": col, "type": typ} for table, columns in beta.REQUIRED_COLUMNS.items() for col, typ in columns.items()]
        def fetchone(self):
            return {"enabled": "O"} if self.trigger else {"rls": True, "forced": self.forced, "readable": True}
    connection = Connection()
    class Repository:
        def _connect(self): return connection
        def validate_publication(self): return {"status": "approved", "allowedUses": ["learner_delivery"]}
    class Catalog:
        root = "/synthetic/catalog"
        catalog_hash = "a" * 64
    monkeypatch.setattr(beta, "LearnerCatalog", lambda root, hash: Catalog())
    beta.readiness_check(Repository(), Catalog())
    assert len(queries) == len(beta.LEARNER_TABLES) + 2
    assert all("FROM pg_" in sql and "FROM mitooni_app" not in sql for sql, _ in queries)
    connection.forced = False
    with pytest.raises(beta.ConfigurationUnavailable):
        beta.readiness_check(Repository(), Catalog())


def test_learner_configuration_is_explicit_complete_and_sanitized():
    assert beta.learner_configuration({}) == (None, None)
    complete = {"MITOONI_AI_TEXT_MODEL": "synthetic-model", "MITOONI_AI_AUDIO_MODEL": "synthetic-audio",
                "MITOONI_AI_API_KEY": "SYNTHETIC_NOT_A_SECRET", "MITOONI_AI_BUDGET_POLICY_ID": "synthetic-policy-v1"}
    for values in ({"MITOONI_AI_API_KEY": "synthetic"}, complete | {"MITOONI_AI_API_KEY": ""},
                   complete | {"MITOONI_AI_TEXT_MODEL": "bad model"}, complete | {"MITOONI_AI_BUDGET_POLICY_ID": "../../bad"}):
        with pytest.raises(beta.ConfigurationUnavailable, match="^Learner AI configuration unavailable$") as exc:
            beta.learner_configuration(values)
        assert "SYNTHETIC" not in str(exc.value)
