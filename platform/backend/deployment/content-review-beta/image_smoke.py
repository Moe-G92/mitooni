"""Network-disabled image probes. Passed on stdin, never shipped as runtime code.

HTTP identities/repositories are explicit test fixtures, not hosted Auth/DB proof.
"""
from pathlib import Path
from types import SimpleNamespace
import json
import os
import shutil
import tempfile
import importlib
import app

from fastapi.testclient import TestClient
from app.config import BackendConfig
from app.dependencies import CurrentUser
from app.main import create_app
from app.repositories.account import AccountError
from app.services.content_pipeline import load_package
from app.services.content_review import ReviewPackageConfiguration, empty_state
import beta_entrypoint as beta

HASH = "85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095"
assert importlib.util.find_spec("app.corpus") is None
runtime_modules = set()
app_root = Path(next(iter(app.__path__)))
for source in app_root.rglob("*.py"):
    parts = list(source.relative_to(app_root).with_suffix("").parts)
    if parts[-1] == "__init__": parts.pop()
    runtime_modules.add(".".join(["app", *parts]))
for module_name in runtime_modules:
    importlib.import_module(module_name)
root = Path("/srv/private/review")
package, actual = load_package(root)
assert actual == HASH and len(package["assets"]) == 28 and len(package["assessmentHolds"]) == 22
assert os.getuid() == 10001
review = ReviewPackageConfiguration(root, HASH).load()
public = Path("/srv/web")
assert not root.is_relative_to(public)
assert not any(p.is_file() and (p.suffix in {".json", ".map", ".sqlite", ".pdf", ".py"} or p.name.startswith(".")) for p in public.rglob("*"))
assert not (public / "mockServiceWorker.js").exists()
assert beta.speaking_configuration({}) is None
try:
    beta.speaking_configuration({"MITOONI_SPEAKING_API_KEY": "SYNTHETIC_INCOMPLETE"})
except beta.ConfigurationUnavailable:
    pass
else:
    raise AssertionError("Partial provider configuration admitted")

identity = CurrentUser("11111111-1111-4111-8111-111111111111", "synthetic@example.invalid")
class Verifier:
    def verify(self, token):
        if token != "synthetic-test-only": raise ValueError()
        return identity
config = BackendConfig("http://127.0.0.1", "local", "synthetic-test-only", environment="test")
scope = SimpleNamespace(environment="test", issuer="http://127.0.0.1/auth/v1")
class FixtureRepository:
    config = scope
    def call(self, user, action, body=None, key=None, target=None):
        assert user == identity
        if action == "catalog":
            return {"packageHash": HASH, "targets": [review.metadata(t) for t in review.targets]}
        if action == "target": return review.snapshot(target, empty_state())
        raise AssertionError("Unexpected fixture action")
    def asset(self, user, target, asset_id, package_hash, target_hash, has_range=False):
        assert user == identity
        if has_range or package_hash != HASH or target_hash != review.metadata(target)["targetHash"]:
            raise AccountError("review_denied", 403, "Reviewer access is unavailable")
        return review.asset_bytes(target, asset_id)
fixture = FixtureRepository()
app = create_app(config, verifier=Verifier(), account_repository=fixture, content_review_repository=fixture)
beta.attach_delivery(app, public, {"beta.example", "healthcheck.railway.app"}, lambda: None)
headers = {"Authorization": "Bearer synthetic-test-only"}
with TestClient(app, base_url="https://beta.example") as client:
    assert client.get("/api/content-review/catalog").status_code == 401
    response = client.get("/api/content-review/catalog", headers=headers)
    assert response.status_code == 200 and response.json()["packageHash"] == HASH
    assert "privateContent" not in response.text
    tested = 0
    for mime in ("image/png", "audio/mpeg"):
        # The registry deliberately projects one usable visual rendition; raw
        # package assets also include other validated rendition dependencies.
        target, projected = next((t, a) for t in review.targets for a in review.assets(t) if a["mediaType"] == mime)
        asset = next(a for a in package["assets"] if a["id"] == projected["id"])
        target_response = client.get("/api/content-review/targets/" + target, headers=headers)
        assert target_response.status_code == 200 and target_response.json()["privateContent"] is None
        path = f"/api/content-review/targets/{target}/assets/{asset['id']}"
        params = {"packageHash": HASH, "targetHash": review.metadata(target)["targetHash"]}
        binary = client.get(path, params=params, headers=headers)
        assert binary.status_code == 200 and len(binary.content) == asset["sizeBytes"], (binary.status_code, len(binary.content), asset["sizeBytes"])
        assert binary.headers["content-type"] == mime
        assert binary.headers["cache-control"] == "private, no-store" and binary.headers["vary"] == "Authorization"
        assert client.get(path, params=params).status_code == 401
        tested += 1
    assert client.get("/private/review/manifest.json", headers=headers).status_code == 404
    denied = client.get("/api/content-review/catalog", headers={"host": "evil/assets/"})
    assert denied.status_code == 400 and denied.headers["cache-control"] == "private, no-store" and denied.headers["vary"] == "Authorization"

for mutation in ("missing", "tampered"):
    with tempfile.TemporaryDirectory(prefix="beta-media-smoke-") as temporary:
        copied = Path(temporary) / "edition"
        shutil.copytree(root, copied)
        # Source image permissions are preserved by copytree. Make only this
        # owned disposable test copy writable before fault injection/cleanup.
        for entry in [copied, *copied.rglob("*")]:
            entry.chmod(0o700 if entry.is_dir() else 0o600)
        media = next((copied / "media").glob("*.mp3"))
        if mutation == "missing": media.unlink()
        else:
            data = bytearray(media.read_bytes()); data[-1] ^= 1; media.write_bytes(data)
        try: ReviewPackageConfiguration(copied, HASH).load()
        except AccountError as exc: assert exc.status == 503 and exc.code == "content_unavailable"
        else: raise AssertionError("Invalid binary package admitted")
        # Exercise the actual hosted startup order with invalid bytes. Only the
        # package location is redirected to this disposable copy; DB must never
        # be attempted. Auth origin follows the public build metadata, while
        # identities/passwords remain fixtures and networking stays disabled.
        connections = []
        class NoConnection:
            def __init__(self, *args): pass
            def _connect(self):
                connections.append(True)
                raise AssertionError("Database touched before invalid package denial")
        original_package = beta.ReviewPackageConfiguration
        original_repository = beta.PostgresContentReviewRepository
        beta.ReviewPackageConfiguration = lambda path, package_hash: original_package(copied, package_hash)
        beta.PostgresContentReviewRepository = NoConnection
        try:
            built_origin = json.loads(Path("/srv/build-auth.json").read_text())["authUrl"]
            built_project = built_origin.removeprefix("https://").removesuffix(".supabase.co")
            values = {"MITOONI_AUTH_URL": built_origin, "MITOONI_AUTH_PROJECT": built_project,
                      "MITOONI_AUTH_SERVICE_KEY": "synthetic-test-only", "MITOONI_DB_HOST": "db.synthetic-beta.supabase.co",
                      "MITOONI_DB_HOSTADDR": "192.0.2.1", "MITOONI_DB_NAME": "postgres", "MITOONI_DB_PORT": "5432",
                      "MITOONI_DB_PASSWORD": "synthetic-test-only", "MITOONI_REVIEW_PACKAGE_HASH": HASH,
                      "MITOONI_BETA_HOST": "beta.example"}
            try: beta.create_beta(values)
            except beta.ConfigurationUnavailable: pass
            else: raise AssertionError("Invalid media did not stop hosted startup")
            assert not connections
        finally:
            beta.ReviewPackageConfiguration = original_package
            beta.PostgresContentReviewRepository = original_repository
print(json.dumps({"packageHash": HASH, "assets": 28, "assessmentHolds": 22, "uid": os.getuid(),
                  "fixtureHttpAssetTypesChecked": tested, "missingAndTamperedMediaDenied": True,
                  "invalidMediaStopsStartupBeforeDatabase": True,
                  "runtimeModulesImported": len(runtime_modules), "privateAuthoringCodeAbsent": True,
                  "providerDefault": "unavailable", "network": "disabled", "hostedAuthAndDatabaseProven": False}))
