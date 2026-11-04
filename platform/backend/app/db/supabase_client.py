"""Adapted BarEx service client: explicit config, instance scope, lazy creation.

Service credentials stay server-side and bypass RLS. No global environment or
source allowlists are inherited; future data routes must enforce ownership.
"""
from threading import Lock
from supabase import Client, ClientOptions, create_client
from app.config import BackendConfig
from app.db.read_retry_transport import ServiceHttpClient


class TargetSupabaseClient:
    def __init__(self, config: BackendConfig) -> None:
        self._lock = Lock()
        self.config = config
        self._client: Client | None = None
        self._http: ServiceHttpClient | None = None

    def get(self) -> Client:
        with self._lock:
            if self._client is None:
                options = ClientOptions()
                http = ServiceHttpClient(options)
                options.httpx_client = http
                try:
                    client = create_client(self.config.supabase_url, self.config.service_key, options=options)
                except BaseException:
                    http.close()
                    raise
                self._http = http
                self._client = client
            return self._client

    def close(self) -> None:
        with self._lock:
            http = self._http
            self._http = None
            self._client = None
            if http is not None:
                http.close()
