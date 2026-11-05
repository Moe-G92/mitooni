"""Explicit receiving PostgreSQL target; no ambient connection discovery."""

from dataclasses import dataclass, field
from ipaddress import ip_address
from urllib.parse import urlparse
import os


def isolated_options():
    # Explicit empty values prevent libpq service/SSL identity-file fallbacks.
    # No environment values are read, enumerated or copied by this module.
    if any(
        name in os.environ for name in ("PGSERVICE", "PGSERVICEFILE", "PGSYSCONFDIR")
    ):
        raise ValueError("Ambient libpq service discovery is not admitted")
    return dict(
        passfile="/nonexistent/mitooni-no-passwords",
        sslcert="",
        sslkey="",
        sslpassword="",
        sslcrl="",
        sslcrldir="",
        sslcertmode="disable",
        gssencmode="disable",
        replication="false",
        target_session_attrs="read-write",
        load_balance_hosts="disable",
        client_encoding="UTF8",
        application_name="mitooni",
        ssl_min_protocol_version="TLSv1.2",
        sslsni="1",
        channel_binding="prefer",
    )


@dataclass(frozen=True)
class ReceivingPostgresTarget:
    host: str
    database: str
    issuer: str
    user: str
    password: str = field(repr=False)
    hostaddr: str = ""
    port: int = 5432
    environment: str = "production"
    product: str = "mitooni"
    schema: str = "mitooni_app"

    def __post_init__(self):
        p = urlparse(self.issuer)
        if (
            self.product != "mitooni"
            or self.schema != "mitooni_app"
            or self.user != "mitooni_api"
            or not self.database
            or not self.host
            or not 1024 <= self.port <= 65535
        ):
            raise ValueError("Explicit Mitooni receiving database scope is required")
        if self.environment == "production":
            try:
                address = ip_address(self.hostaddr)
            except ValueError:
                raise ValueError(
                    "Explicit numeric receiving host address required"
                ) from None
            if (
                address.is_loopback
                or self.host in {"localhost", "127.0.0.1", "::1"}
                or not self.password
                or p.scheme != "https"
                or not p.hostname
                or p.path != "/auth/v1"
                or p.query
                or p.fragment
            ):
                raise ValueError(
                    "Production requires explicit remote TLS target and verified issuer"
                )
        elif (
            self.environment not in {"test", "development"}
            or self.host != "127.0.0.1"
            or self.hostaddr not in {"", "127.0.0.1"}
        ):
            raise ValueError("Local fixture target must remain loopback only")

    def connection_options(self):
        return isolated_options() | dict(
            host=self.host,
            hostaddr=self.hostaddr if self.environment == "production" else "127.0.0.1",
            port=self.port,
            dbname=self.database,
            user=self.user,
            password=self.password,
            sslrootcert="system"
            if self.environment == "production"
            else "/nonexistent/mitooni-no-root-cert",
            sslmode="verify-full" if self.environment == "production" else "disable",
            connect_timeout=3,
            options="-c statement_timeout=5000 -c lock_timeout=4000 -c search_path=mitooni_app,pg_catalog",
        )

    def verify_connection(self, conn):
        # Session verification must not begin the application's later repeatable-
        # read transaction (account GET sets isolation before its first query).
        previous = conn.autocommit
        conn.autocommit = True
        try:
            row = conn.execute(
                "SELECT current_user AS role,current_database() AS database,has_schema_privilege(current_user,'mitooni_app','USAGE') AS schema_ok,r.rolsuper,r.rolbypassrls,(SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS tls FROM pg_roles r WHERE r.rolname=current_user"
            ).fetchone()
        finally:
            conn.autocommit = previous
        values = (
            row
            if isinstance(row, dict)
            else dict(
                zip(
                    [
                        "role",
                        "database",
                        "schema_ok",
                        "rolsuper",
                        "rolbypassrls",
                        "tls",
                    ],
                    row,
                )
            )
        )
        if (
            values["role"] != self.user
            or values["database"] != self.database
            or not values["schema_ok"]
            or values["rolsuper"]
            or values["rolbypassrls"]
            or (self.environment == "production" and not values["tls"])
        ):
            raise ValueError("Receiving database identity or transport mismatch")
