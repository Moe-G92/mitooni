"""Bounded recovery for read-only PostgREST transport disconnects.

A request may have reached the server when its connection dies. Writes and RPCs
must never be replayed here. A bodyless REST SELECT can safely retry once.
"""
from __future__ import annotations

import logging
import time
from typing import Any

import httpx
from supabase import ClientOptions

log = logging.getLogger(__name__)
_READ_RETRY_DELAY_SECONDS = 0.1


class RestReadRetryTransport(httpx.BaseTransport):
    def __init__(self, transport: httpx.BaseTransport | None = None) -> None:
        # Avoid the connection-wide HTTP/2 termination observed in production.
        # HTTPTransport's connection retries remain disabled for every method.
        self._transport = transport or httpx.HTTPTransport(http2=False, retries=0)

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        try:
            return self._transport.handle_request(request)
        except httpx.RemoteProtocolError:
            if not self._can_retry(request):
                raise
            log.info("supabase_rest_read_transport_retry reason=remote_protocol_error attempt=1")
            time.sleep(_READ_RETRY_DELAY_SECONDS)
            # Intentionally outside a retry loop: a second failure propagates.
            return self._transport.handle_request(request)

    @staticmethod
    def _can_retry(request: httpx.Request) -> bool:
        path = request.url.path
        if request.method != "GET" or not path.startswith("/rest/v1/") or path.startswith("/rest/v1/rpc/"):
            return False
        try:
            return request.content == b""
        except httpx.RequestNotRead:
            return False

    def close(self) -> None:
        self._transport.close()


class ServiceHttpClient(httpx.Client):
    """Retain SDK timeout budgets when injecting its shared HTTP client.

    Supabase uses the supplied client for REST, Auth, Storage and Functions, so
    its ordinary service-specific defaults must not become one global timeout.
    Explicit per-request timeouts keep taking precedence.
    """
    def __init__(self, options: ClientOptions, *, transport: httpx.BaseTransport | None = None) -> None:
        self._service_options = options
        super().__init__(transport=RestReadRetryTransport(transport),
                         follow_redirects=True, timeout=5.0, http2=False)

    def build_request(self, method: str, url: httpx.URL | str, **kwargs: Any) -> httpx.Request:
        if kwargs.get("timeout", httpx.USE_CLIENT_DEFAULT) is httpx.USE_CLIENT_DEFAULT:
            path = httpx.URL(url).path
            if path.startswith("/rest/v1/"):
                kwargs["timeout"] = self._service_options.postgrest_client_timeout
            elif path.startswith("/storage/v1/"):
                kwargs["timeout"] = self._service_options.storage_client_timeout
            elif path.startswith("/functions/v1/"):
                kwargs["timeout"] = self._service_options.function_client_timeout
        return super().build_request(method, url, **kwargs)
