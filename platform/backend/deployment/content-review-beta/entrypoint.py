"""Explicit hosted teacher beta. Environment variables only; no .env loading."""
from pathlib import Path
import json
import os
import re
import sys
from uuid import uuid4

from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles

from app.composition import create_receiving_app, SpeakingProviderConfiguration
from app.config import BackendConfig
from app.repositories.postgres_content_review import PostgresContentReviewRepository
from app.repositories.postgres_target import ReceivingPostgresTarget
from app.services.content_review import ReviewPackageConfiguration


class ConfigurationUnavailable(Exception):
    """No source configuration or exception detail may be logged."""


def required(values, name):
    value = values.get(name)
    if not isinstance(value, str) or not value.strip():
        raise ConfigurationUnavailable()
    return value


def speaking_configuration(values):
    names = ("MITOONI_SPEAKING_MODEL", "MITOONI_SPEAKING_API_KEY", "MITOONI_SPEAKING_CALL_BUDGET")
    if not any(name in values for name in names):
        return None
    try:
        model, key, raw_budget = (required(values, name) for name in names)
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,119}", model) or not re.fullmatch(r"[1-8]", raw_budget):
            raise ConfigurationUnavailable()
        return SpeakingProviderConfiguration(model=model, api_key=key, call_budget=int(raw_budget))
    except Exception:
        raise ConfigurationUnavailable("Speaking configuration unavailable") from None


class BetaStaticFiles(StaticFiles):
    """SPA fallback only for known app routes; never for APIs or private paths."""
    async def get_response(self, path, scope):
        clean = scope.get("path", "")
        if any(p.startswith(".") for p in clean.split("/") if p):
            raise HTTPException(404)
        if clean == "/api" or clean.startswith("/api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404,
                                headers={"Cache-Control": "private, no-store"})
        if clean == "/" or clean in {"/sign-in", "/onboarding"} or re.fullmatch(r"/(?:app|study)(?:/[A-Za-z0-9_-]+)*", clean):
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


def readiness_check(repository, review):
    review.load()
    # Connection verifies TLS, receiving role/database/schema and non-BYPASSRLS.
    # Inspect schema metadata only: no roster, membership or customer records.
    with repository._connect() as conn:
        for table in ("content_review_assignments", "content_review_states", "content_review_operations",
                      "speaking_review_budgets", "speaking_review_records", "speaking_review_queue"):
            row = conn.execute(
                "SELECT c.relrowsecurity AS rls,has_table_privilege(current_user,c.oid,'SELECT') AS readable "
                "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
                "WHERE n.nspname='mitooni_app' AND c.relname=%s AND c.relkind='r'", (table,),
            ).fetchone()
            if not row or not row["rls"] or not row["readable"]:
                raise ConfigurationUnavailable()
        columns = conn.execute(
            "SELECT a.attname AS name,format_type(a.atttypid,a.atttypmod) AS type "
            "FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace "
            "WHERE n.nspname='mitooni_app' AND c.relname='content_review_assignments' AND a.attnum>0 AND NOT a.attisdropped", (),
        ).fetchall()
        expected = {"product_id": "text", "issuer": "text", "subject_id": "uuid", "package_hash": "text",
                    "status": "text", "permissions": "text[]", "lock_revision": "integer"}
        if {row["name"]: row["type"] for row in columns} != expected:
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
        review = ReviewPackageConfiguration(Path("/srv/private/review"), required(values, "MITOONI_REVIEW_PACKAGE_HASH"))
        static_root = Path("/srv/web")
        built = json.loads(Path("/srv/build-auth.json").read_text())
        if built != {"authUrl": config.supabase_url.rstrip("/")} or not (static_root / "index.html").is_file():
            raise ConfigurationUnavailable()
        host = required(values, "MITOONI_BETA_HOST").lower()
        if not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?", host) or "." not in host or ".." in host:
            raise ConfigurationUnavailable()
        repository = PostgresContentReviewRepository(target, review)
        check = lambda: readiness_check(repository, review)
        check()  # Missing/invalid content, receiving identity or schema stops startup.
        application = create_receiving_app(config, target, provider=None, review_configuration=review,
                                          speaking_provider=speaking_configuration(values))
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
