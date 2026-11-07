"""Request routing/privacy classification uses the ASGI path, never Host URLs."""

from ipaddress import ip_address
import re
from typing import Any


def routing_path(scope: dict[str, Any]) -> str:
    # This is the same server-derived routing path consumed by Starlette's
    # router. Reconstructing a URL from attacker-controlled Host can change it.
    path = scope.get("path", "")
    return path if isinstance(path, str) else ""


def account_or_study_path(scope: dict[str, Any]) -> bool:
    path = routing_path(scope)
    return (
        path == "/api/account"
        or path.startswith("/api/profile")
        or path.startswith("/api/study/")
        or path == "/api/content-review"
        or path.startswith("/api/content-review/")
    )


def private_api_path(scope: dict[str, Any]) -> bool:
    return routing_path(scope) == "/api/me" or account_or_study_path(scope)


def valid_host_authority(scope: dict[str, Any]) -> bool:
    """Validate authority syntax without imposing an invented deployment allowlist.

    Never construct a URL or return the supplied value. International domain
    names must use their ASCII IDNA form; bracketed IPv6 and explicit ports work.
    """
    hosts = [
        value for name, value in scope.get("headers", []) if name.lower() == b"host"
    ]
    if len(hosts) != 1:
        return False
    try:
        host = hosts[0].decode("ascii")
    except (UnicodeDecodeError, AttributeError):
        return False
    if (
        not host
        or len(host) > 261
        or any(char in host for char in "/\\?#@%")
        or any(ord(char) <= 32 or ord(char) == 127 for char in host)
    ):
        return False
    if host.startswith("["):
        match = re.fullmatch(r"\[([^\]]+)\](?::([0-9]{1,5}))?", host)
        if match is None:
            return False
        try:
            if ip_address(match.group(1)).version != 6:
                return False
        except ValueError:
            return False
        port = match.group(2)
    else:
        if host.count(":") > 1:
            return False
        name, separator, port = host.partition(":")
        labels = (name[:-1] if name.endswith(".") else name).split(".")
        if (
            not name
            or len(name) > 253
            or any(
                not re.fullmatch(
                    r"[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?", label
                )
                for label in labels
            )
        ):
            return False
        if separator and not port:
            return False
    return not port or bool(
        re.fullmatch(r"[0-9]{1,5}", port) and 1 <= int(port) <= 65535
    )


class ReviewBodyLimitMiddleware:
    """Bound actual streamed bytes before request parsing, including chunked bodies."""
    def __init__(self, app, limit=524288):
        self.app, self.limit = app, limit

    async def __call__(self, scope, receive, send):
        path = routing_path(scope)
        if scope.get('type') != 'http' or not (path == '/api/content-review' or path.startswith('/api/content-review/')):
            return await self.app(scope, receive, send)
        # Only this exact POST shape admits audio; all other review routes retain 512 KiB.
        limit = 18 * 1024 * 1024 if scope.get("method") == "POST" and re.fullmatch(r"/api/content-review/targets/[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}/speaking-recordings", path) else self.limit
        from fastapi.responses import JSONResponse
        from uuid import uuid4
        async def reject():
            response = JSONResponse(status_code=413, content={'detail': {'code': 'request_too_large', 'message': 'Review request is too large'}, 'requestId': str(uuid4())}, headers={'Cache-Control': 'private, no-store', 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff'})
            await response(scope, receive, send)
        sizes = [v for k, v in scope.get('headers', []) if k.lower() == b'content-length']
        try:
            if len(sizes) > 1 or (sizes and (int(sizes[0]) < 0 or int(sizes[0]) > limit)):
                return await reject()
        except ValueError:
            return await reject()
        messages, total = [], 0
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect':
                return
            total += len(message.get('body', b''))
            if total > limit:
                return await reject()
            messages.append(message)
            if not message.get('more_body', False):
                break
        index = 0
        async def bounded_receive():
            nonlocal index
            if index < len(messages):
                message = messages[index]
                index += 1
                return message
            return await receive()
        return await self.app(scope, bounded_receive, send)


class PrivateResponseBoundaryMiddleware:
    """Release complete bounded private responses, or one sanitized failure.

    An inner response-start is held until its body completes, so a generator
    failing after it starts cannot leak partial private text through a generic
    server fallback. This boundary is outside all other user middleware and
    never logs/serializes exceptions. Nonprivate requests retain normal ASGI
    behavior. The cap matches the existing maximum private binary asset.
    """

    def __init__(self, app, body_limit=32 * 1024 * 1024, header_limit=16384):
        self.app = app
        self.body_limit = body_limit
        self.header_limit = header_limit

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http" or not private_api_path(scope):
            return await self.app(scope, receive, send)
        from fastapi.responses import JSONResponse
        from uuid import uuid4

        state = scope.setdefault("state", {})
        state["request_id"] = str(uuid4())
        start = None
        body_buffer = bytearray()
        total = 0
        finished = False

        async def capture(message):
            nonlocal start, total, finished
            kind = message["type"]
            if kind == "http.response.start":
                if start is not None or finished:
                    raise ValueError("Invalid private response")
                raw_headers = message.get("headers", [])
                if not isinstance(raw_headers, (list, tuple)) or len(raw_headers) > 128:
                    raise ValueError("Private response headers too large")
                headers = list(raw_headers)
                if sum(len(k) + len(v) for k, v in headers) > self.header_limit:
                    raise ValueError("Private response headers too large")
                # Never trust an inner error, proxy or media handler to set these.
                protected = {b"cache-control", b"vary", b"x-content-type-options", b"x-request-id"}
                headers = [(k, v) for k, v in headers if k.lower() not in protected]
                headers.extend([(b"cache-control", b"private, no-store"),
                                (b"vary", b"Authorization"),
                                (b"x-content-type-options", b"nosniff"),
                                (b"x-request-id", state["request_id"].encode("ascii"))])
                start = dict(message, headers=headers)
            elif kind == "http.response.body":
                if start is None or finished:
                    raise ValueError("Invalid private response")
                body = message.get("body", b"")
                total += len(body)
                if total > self.body_limit:
                    raise ValueError("Private response too large")
                body_buffer.extend(body)
                finished = not message.get("more_body", False)
            else:
                # No file-path send extensions or trailers bypass byte validation.
                raise ValueError("Unsupported private response")

        try:
            await self.app(scope, receive, capture)
            if start is None or not finished:
                raise ValueError("Incomplete private response")
        except Exception:
            # Do not attach, print or re-raise the original private exception.
            request_id = state["request_id"]
            response = JSONResponse(status_code=500,
                content={"detail": {"code": "request_failed", "message": "Request is unavailable"},
                         "requestId": request_id},
                headers={"Cache-Control": "private, no-store", "Vary": "Authorization",
                         "X-Content-Type-Options": "nosniff", "X-Request-Id": request_id})
            await response(scope, receive, send)
            return
        # Nothing has reached the client until this point. A transport failure
        # while flushing is never caught into a second HTTP response.
        await send(start)
        await send({"type": "http.response.body", "body": bytes(body_buffer), "more_body": False})
