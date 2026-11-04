"""Explicit receiving-workload configuration; never reads environment files."""
from dataclasses import dataclass, field
from urllib.parse import urlparse


@dataclass(frozen=True)
class BackendConfig:
    supabase_url: str
    expected_project: str
    service_key: str = field(repr=False)
    environment: str = "development"
    workload: str = "mitooni"

    def __post_init__(self) -> None:
        parsed = urlparse(self.supabase_url)
        local = parsed.hostname in {"127.0.0.1", "localhost", "::1"}
        if self.workload != "mitooni" or self.environment not in {"development", "test", "production"}:
            raise ValueError("Explicit Mitooni workload and environment are required")
        if not self.service_key.strip() or not self.expected_project.strip():
            raise ValueError("Explicit target project and server credential are required")
        if parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in {"", "/"}:
            raise ValueError("Supabase URL must be a bare service origin")
        if local:
            if self.environment == "production" or parsed.scheme not in {"http", "https"} or self.expected_project != "local":
                raise ValueError("Loopback requires an explicit local development/test project")
        elif (self.environment != "production" or parsed.scheme != "https"
              or parsed.hostname != f"{self.expected_project}.supabase.co" or parsed.port not in {None, 443}):
            raise ValueError("Hosted configuration requires production and an explicit matching project")
