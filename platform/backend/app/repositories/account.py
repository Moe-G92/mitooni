"""Receiving account errors and local PostgreSQL adapter configuration."""

from dataclasses import dataclass


class AccountError(Exception):
    def __init__(self, code: str, status: int, message: str):
        self.code, self.status, self.message = code, status, message


@dataclass(frozen=True)
class LocalPostgresConfig:
    port: int = 55439
    database: str = "mitooni_local"
    issuer: str = "http://127.0.0.1:54321/auth/v1"
    environment: str = "test"

    def __post_init__(self):
        if (
            self.environment not in {"test", "development"}
            or self.database != "mitooni_local"
            or not 1024 <= self.port <= 65535
        ):
            raise ValueError(
                "Only an explicitly isolated local Mitooni test datastore is supported"
            )
        if self.issuer != "http://127.0.0.1:54321/auth/v1":
            raise ValueError("Local adapter requires the explicit synthetic issuer")

    def connection_options(self):
        from app.repositories.postgres_target import isolated_options

        return isolated_options() | dict(
            host="127.0.0.1",
            hostaddr="127.0.0.1",
            port=self.port,
            dbname=self.database,
            user="mitooni_api",
            password="",
            passfile="/nonexistent/mitooni-no-passwords",
            sslmode="disable",
            connect_timeout=3,
            options="-c statement_timeout=5000 -c lock_timeout=4000",
        )
