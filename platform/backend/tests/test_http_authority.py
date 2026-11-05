"""Raw-ASGI Host/path privacy regression, synthetic identity/repositories only."""

import asyncio
import json
from uuid import uuid4
import pytest
from app.config import BackendConfig
from app.dependencies import CurrentUser, AuthenticationUnavailable
from app.main import create_app
from app.repositories.account import LocalPostgresConfig

IDENTITY = "10000000-0000-4000-8000-000000000000"


class Verifier:
    def verify(self, token):
        if token == "unavailable":
            raise AuthenticationUnavailable()
        if token != "valid":
            raise ValueError()
        return CurrentUser(IDENTITY, "synthetic@example.invalid")


class AccountRepo:
    config = LocalPostgresConfig()

    def get(self, user):
        return dict(
            identity={"id": user.id, "email": user.email},
            membership={"status": "active", "roles": ["learner"], "entitlements": []},
            state="setup-required",
            profile=None,
        )

    def mutate(self, *args):
        raise AssertionError("Invalid request must not write")


class StudyRepo:
    config = LocalPostgresConfig()

    def call(self, *args, **kwargs):
        return dict(id="journey", revision=1, policyVersion=1, steps=[])


@pytest.fixture
def app():
    return create_app(
        BackendConfig(
            "http://127.0.0.1:54321", "local", "synthetic", environment="test"
        ),
        verifier=Verifier(),
        account_repository=AccountRepo(),
        study_repository=StudyRepo(),
    )


def request(app, path, hosts, token="valid", method="GET", body=None):
    data = b"" if body is None else json.dumps(body).encode()
    headers = [(b"host", host) for host in hosts]
    headers.extend(
        [
            (b"content-type", b"application/json"),
            (b"authorization", f"Bearer {token}".encode()),
            (b"x-expected-user-id", IDENTITY.encode()),
            (b"idempotency-key", str(uuid4()).encode()),
        ]
    )
    scope = dict(
        type="http",
        asgi={"version": "3.0"},
        http_version="1.1",
        scheme="http",
        method=method,
        path=path,
        raw_path=path.encode(),
        root_path="",
        query_string=b"",
        headers=headers,
        server=("127.0.0.1", 8009),
        client=("127.0.0.1", 12345),
    )

    async def invoke():
        sent = []
        received = False

        async def receive():
            nonlocal received
            if not received:
                received = True
                return dict(type="http.request", body=data, more_body=False)
            await asyncio.Event().wait()

        async def send(message):
            sent.append(message)

        await app(scope, receive, send)
        start = next(item for item in sent if item["type"] == "http.response.start")
        output = b"".join(
            item.get("body", b"")
            for item in sent
            if item["type"] == "http.response.body"
        )
        return start["status"], dict(start["headers"]), output

    return asyncio.run(invoke())


@pytest.mark.parametrize("path", ["/api/me", "/api/account", "/api/study/journey"])
@pytest.mark.parametrize(
    "host",
    [
        b"poison.example#fragment",
        b"poison.example/health",
        b"poison.example?x=1",
        b"user@poison.example",
        b"poison.example\\health",
        b"poison.example%23fragment",
        b"bad host",
        b"bad\x00host",
        b"\xffhost",
        b"host:",
        b"[::1",
        b"host:99999",
        b"host..",
    ],
)
def test_malformed_host_rejected_without_private_echo(app, path, host):
    status, headers, body = request(app, path, [host])
    assert status == 400 and headers[b"cache-control"] == b"private, no-store"
    assert headers[b"vary"] == b"Authorization"
    assert json.loads(body)["detail"]["code"] == "invalid_request"
    assert b"synthetic@example.invalid" not in body and host not in body


@pytest.mark.parametrize("hosts", [[], [b"localhost", b"poison.example"]])
def test_missing_or_duplicate_host_rejected(app, hosts):
    status, headers, body = request(app, "/api/me", hosts)
    assert status == 400 and headers[b"cache-control"] == b"private, no-store"


@pytest.mark.parametrize("path", ["/api/me", "/api/account", "/api/study/journey"])
@pytest.mark.parametrize(
    "host",
    [
        b"testserver",
        b"127.0.0.1:8009",
        b"[::1]:8009",
        b"other.example",
        b"EXAMPLE.COM.",
        b"api_service:8080",
    ],
)
@pytest.mark.parametrize(
    "token,status", [("valid", 200), ("invalid", 401), ("unavailable", 503)]
)
def test_valid_authority_does_not_change_auth_or_privacy(
    app, path, host, token, status
):
    code, headers, body = request(app, path, [host], token)
    assert code == status and headers[b"cache-control"] == b"private, no-store"
    assert headers[b"vary"] == b"Authorization"
    if status == 401:
        assert headers[b"www-authenticate"] == b"Bearer"
    if status != 200:
        assert b"synthetic@example.invalid" not in body


def test_validation_error_uses_routing_path_without_echo(app):
    secret = "SYNTHETIC_PRIVATE_VALIDATION_VALUE"
    body = {"expectedRevision": 0, "changes": {"name": secret, "roles": ["admin"]}}
    status, headers, output = request(
        app, "/api/profile", [b"other.example"], method="PATCH", body=body
    )
    assert status == 422 and headers[b"cache-control"] == b"private, no-store"
    assert json.loads(output)["detail"]["code"] == "invalid_request"
    assert secret.encode() not in output
