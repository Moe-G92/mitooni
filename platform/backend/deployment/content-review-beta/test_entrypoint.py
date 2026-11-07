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


def test_readiness_requires_rls_tables_without_reading_assignments():
    queries = []
    class Connection:
        rls = True
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def execute(self, sql, params):
            queries.append((sql, params))
            return self
        def fetchone(self): return {"rls": self.rls, "readable": True}
        def fetchall(self):
            return [{"name": key, "type": value} for key, value in {"product_id": "text", "issuer": "text", "subject_id": "uuid", "package_hash": "text", "status": "text", "permissions": "text[]", "lock_revision": "integer"}.items()]
    connection = Connection()
    class Repository:
        def _connect(self): return connection
    class Review:
        def load(self): return None
    beta.readiness_check(Repository(), Review())
    assert len(queries) == 7
    assert all("FROM pg_" in sql and "FROM mitooni_app" not in sql for sql, _ in queries)
    connection.rls = False
    with pytest.raises(beta.ConfigurationUnavailable):
        beta.readiness_check(Repository(), Review())


def test_speaking_configuration_is_explicit_optional_and_bounded():
    assert beta.speaking_configuration({}) is None
    complete = {"MITOONI_SPEAKING_MODEL": "synthetic-model", "MITOONI_SPEAKING_API_KEY": "SYNTHETIC_NOT_A_SECRET", "MITOONI_SPEAKING_CALL_BUDGET": "2"}
    configured = beta.speaking_configuration(complete)
    assert configured.model == "synthetic-model" and configured.call_budget == 2
    assert "SYNTHETIC_NOT_A_SECRET" not in repr(configured)
    for values in ({"MITOONI_SPEAKING_MODEL": "synthetic-model"}, complete | {"MITOONI_SPEAKING_API_KEY": ""}, complete | {"MITOONI_SPEAKING_CALL_BUDGET": "9"}, complete | {"MITOONI_SPEAKING_CALL_BUDGET": "1.0"}):
        with pytest.raises(beta.ConfigurationUnavailable, match="^Speaking configuration unavailable$"):
            beta.speaking_configuration(values)
