"""Explicit hosted candidate beta. Environment variables only; no .env loading."""
from pathlib import Path
import json
import os
import re
import sys
from uuid import uuid4

from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles

from app.composition import create_receiving_app
from app.config import BackendConfig
from app.repositories.postgres_learner import PostgresLearnerRepository
from app.repositories.postgres_target import ReceivingPostgresTarget
from app.services.learner_content import LearnerCatalog


class ConfigurationUnavailable(Exception):
    """No source configuration or exception detail may be logged."""


def required(values, name):
    value = values.get(name)
    if not isinstance(value, str) or not value.strip():
        raise ConfigurationUnavailable()
    return value


def learner_configuration(values):
    names = ("MITOONI_AI_API_KEY", "MITOONI_AI_TEXT_MODEL", "MITOONI_AI_AUDIO_MODEL", "MITOONI_AI_BUDGET_POLICY_ID")
    if not any(name in values for name in names):
        return None, None
    try:
        key, text_model, audio_model, policy_id = (required(values, name) for name in names)
        for model in (text_model, audio_model):
            if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,119}", model):
                raise ConfigurationUnavailable()
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,99}", policy_id):
            raise ConfigurationUnavailable()
        from app.providers.learner import LearnerRunner
        return LearnerRunner(api_key=key, text_model=text_model, audio_model=audio_model), policy_id
    except Exception:
        raise ConfigurationUnavailable("Learner AI configuration unavailable") from None


class BetaStaticFiles(StaticFiles):
    """SPA fallback only for known app routes; never for APIs or private paths."""
    async def get_response(self, path, scope):
        clean = scope.get("path", "")
        if any(p.startswith(".") for p in clean.split("/") if p):
            raise HTTPException(404)
        if clean == "/api" or clean.startswith("/api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404,
                                headers={"Cache-Control": "private, no-store"})
        learner_workspace = re.fullmatch(r"/learn/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}", clean)
        if clean == "/" or clean in {"/sign-in", "/onboarding"} or learner_workspace or re.fullmatch(r"/(?:app|study)(?:/[A-Za-z0-9_-]+)*", clean):
            return await super().get_response("index.html", scope)
        # Public output consists only of the reviewed Vite assets and index.
        if clean != "/index.html" and not clean.startswith("/assets/"):
            raise HTTPException(404)
        return await super().get_response(path, scope)


def attach_delivery(application, static_root, hosts, readiness):
    @application.middleware("http")
    async def delivery_boundary(request, call_next):
        authority = request.headers.getlist("host")
        if len(authority) != 1 or authority[0].lower() not in hosts:
            response = JSONResponse({"detail": {"code": "invalid_request", "message": "Invalid request authority"},
                                     "requestId": str(uuid4())}, status_code=400)
        else:
            response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
        if not request.scope.get("path", "").startswith("/assets/"):
            response.headers["Cache-Control"] = "private, no-store"
        if request.scope.get("path", "").startswith("/api/"):
            response.headers["Vary"] = "Authorization"
        return response

    @application.get("/ready")
    def ready():
        try:
            readiness()
        except Exception:
            return JSONResponse({"status": "unavailable"}, status_code=503,
                                headers={"Cache-Control": "private, no-store"})
        return {"status": "ready"}

    application.mount("/", BetaStaticFiles(directory=str(static_root), html=False))
    return application


LEARNER_TABLES = (
    "learner_journeys", "learner_plan_versions", "learner_sessions", "learner_workspaces",
    "learner_attempts", "learner_evidence", "learner_jobs", "learner_recordings",
    "learner_operations", "learner_job_queue", "provider_budget_policies",
    "provider_usage_totals", "provider_usage_reservations", "learner_publications",
)


REQUIRED_COLUMNS = {table: {"issuer": "text", "subject_id": "uuid", "data": "jsonb", "revision": "integer"}
                    for table in LEARNER_TABLES[:8]}
REQUIRED_COLUMNS.update({
    "learner_attempts": REQUIRED_COLUMNS["learner_attempts"] | {"status": "text", "body_hash": "text"},
    "learner_recordings": REQUIRED_COLUMNS["learner_recordings"] | {"audio": "bytea", "sha256": "text"},
    "learner_publications": {"catalog_hash": "text", "data": "jsonb", "lock_revision": "integer"},
    "learner_operations": {"issuer": "text", "subject_id": "uuid", "operation_id": "uuid", "request_hash": "text", "outcome": "jsonb"},
    "learner_job_queue": {"job_id": "uuid", "issuer": "text", "subject_id": "uuid"},
    "provider_budget_policies": {"id": "text", "data": "jsonb"},
    "provider_usage_totals": {"policy_id": "text", "reserved_micros": "bigint", "settled_micros": "bigint", "revision": "integer"},
    "provider_usage_reservations": {"id": "uuid", "issuer": "text", "subject_id": "uuid", "policy_id": "text", "reserved_micros": "bigint", "settled_micros": "bigint", "status": "text", "data": "jsonb"},
})


def readiness_check(repository, catalog, runner=None):
    # Reload verifies current immutable catalogue/media bytes; no learner records.
    LearnerCatalog(catalog.root, catalog.catalog_hash)
    with repository._connect() as conn:
        for table in LEARNER_TABLES:
            row = conn.execute(
                "SELECT c.relrowsecurity AS rls,c.relforcerowsecurity AS forced,"
                "has_table_privilege(current_user,c.oid,'SELECT') AS readable "
                "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
                "WHERE n.nspname='mitooni_app' AND c.relname=%s AND c.relkind='r'", (table,),
            ).fetchone()
            if not row or not row["rls"] or not row["forced"] or not row["readable"]:
                raise ConfigurationUnavailable()
        columns = conn.execute(
            "SELECT c.relname AS table_name,a.attname AS column_name,format_type(a.atttypid,a.atttypmod) AS type "
            "FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace "
            "WHERE n.nspname='mitooni_app' AND c.relname=ANY(%s) AND a.attnum>0 AND NOT a.attisdropped",
            (list(LEARNER_TABLES),),
        ).fetchall()
        actual = {(r["table_name"], r["column_name"]): r["type"] for r in columns}
        for table in LEARNER_TABLES:
            for name, expected in REQUIRED_COLUMNS[table].items():
                if actual.get((table, name)) != expected:
                    raise ConfigurationUnavailable()
        row = conn.execute(
            "SELECT t.tgenabled AS enabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid "
            "JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='mitooni_app' "
            "AND c.relname='learner_attempts' AND t.tgname='frozen_learner_attempt' AND NOT t.tgisinternal", (),
        ).fetchone()
        if not row or row["enabled"] != "O":
            raise ConfigurationUnavailable()

    repository.validate_publication()  # Admin-owned status, never learner data.
    if runner is not None:
        policy = repository.validate_budget_policy()
        if policy["models"] != {"text": runner.text_model, "audio": runner.audio_model}:
            raise ConfigurationUnavailable()


def create_beta(values=None):
    values = os.environ if values is None else values
    try:
        config = BackendConfig(
            supabase_url=required(values, "MITOONI_AUTH_URL"),
            expected_project=required(values, "MITOONI_AUTH_PROJECT"),
            service_key=required(values, "MITOONI_AUTH_SERVICE_KEY"),
            environment="production",
        )
        target = ReceivingPostgresTarget(
            host=required(values, "MITOONI_DB_HOST"),
            hostaddr=required(values, "MITOONI_DB_HOSTADDR"),
            database=required(values, "MITOONI_DB_NAME"),
            port=int(required(values, "MITOONI_DB_PORT")),
            user="mitooni_api", password=required(values, "MITOONI_DB_PASSWORD"),
            issuer=config.supabase_url.rstrip("/") + "/auth/v1",
        )
        catalog = LearnerCatalog(Path("/srv/private/learner"), required(values, "MITOONI_LEARNER_CATALOG_HASH"))
        static_root = Path("/srv/web")
        built = json.loads(Path("/srv/build-auth.json").read_text())
        if built != {"authUrl": config.supabase_url.rstrip("/")} or not (static_root / "index.html").is_file():
            raise ConfigurationUnavailable()
        host = required(values, "MITOONI_BETA_HOST").lower()
        if not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?", host) or "." not in host or ".." in host:
            raise ConfigurationUnavailable()
        runner, policy_id = learner_configuration(values)
        repository = PostgresLearnerRepository(target, catalog, provider_enabled=runner is not None, budget_policy_id=policy_id)
        check = lambda: readiness_check(repository, catalog, runner)
        check()  # Missing/invalid content, receiving identity or schema stops startup.
        application = create_receiving_app(config, target, provider=None, learner_catalog=catalog,
                                          learner_runner=runner, learner_budget_policy_id=policy_id)
        return attach_delivery(application, static_root, {host, "healthcheck.railway.app"}, check)
    except Exception:
        raise ConfigurationUnavailable("Beta configuration unavailable") from None


def main():
    try:
        port = int(required(os.environ, "PORT"))
        if not 1024 <= port <= 65535:
            raise ConfigurationUnavailable()
        application = create_beta()
    except Exception:
        print("Beta configuration unavailable", file=sys.stderr)
        return 1
    import uvicorn
    # No request URLs, query strings, credentials or raw exception details in logs.
    uvicorn.run(application, host="0.0.0.0", port=port, proxy_headers=False,
                access_log=False, log_config={"version": 1, "disable_existing_loggers": True,
                                             "handlers": {"null": {"class": "logging.NullHandler"}},
                                             "root": {"handlers": ["null"], "level": "CRITICAL"}})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
