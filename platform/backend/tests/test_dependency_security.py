"""Offline regressions for the dependency incidents found during foundation review."""

from pathlib import Path
import ssl
import tomllib

import certifi
import jwt
from packaging.version import Version
import pytest


def test_unverified_jwt_decode_cannot_mutate_later_verification_policy():
    key = "synthetic-dependency-check-key-never-used-for-service-auth"
    token = jwt.encode({"sub": "synthetic", "exp": 1}, key, algorithm="HS256")
    options = {"verify_signature": False}
    jwt.decode(token, options=options)
    assert options == {"verify_signature": False}
    options["verify_signature"] = True
    with pytest.raises(jwt.ExpiredSignatureError):
        jwt.decode(token, key, algorithms=["HS256"], options=options)


def test_default_ca_bundle_removes_compromised_emsign_roots_and_still_loads():
    bundle = Path(certifi.where())
    assert "emSign" not in bundle.read_text()
    assert ssl.create_default_context(cafile=str(bundle)).cert_store_stats()["x509_ca"] > 0


def test_universal_lock_has_no_pre_patch_mcp_fallback():
    lock = tomllib.loads((Path(__file__).parents[1] / "uv.lock").read_text())
    versions = [Version(package["version"]) for package in lock["package"] if package["name"] == "mcp"]
    assert versions
    assert all(Version("1.30.0") <= version < Version("2") for version in versions)
