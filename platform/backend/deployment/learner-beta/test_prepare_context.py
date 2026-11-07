"""Packaging boundary evidence against the frozen local curated teacher edition."""
import importlib.util
from pathlib import Path
import shutil
import pytest

SPEC = importlib.util.spec_from_file_location("prepare_context", Path(__file__).with_name("prepare_context.py"))
context = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(context)
EDITION = context.SOURCE_ROOT / "review/learner-mvp-20261107/catalog"
pytestmark = pytest.mark.skipif(not (EDITION / "catalog.json").is_file(), reason="Private learner catalogue not supplied")
HASH = context.LearnerCatalog(EDITION).catalog_hash if (EDITION / "catalog.json").is_file() else "a" * 64


def synthetic_code(root):
    for relative in context.CODE_FILES | {(context.DEPLOY / name).as_posix() for name in ("Dockerfile", "entrypoint.py", "railway.json")}:
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("SYNTHETIC_CODE_ONLY")
    ca = root / context.DEPLOY / context.PUBLIC_CA_NAME
    shutil.copyfile(context.SOURCE_ROOT / context.DEPLOY / context.PUBLIC_CA_NAME, ca)
    for relative in ("web/src/main.tsx", "platform/backend/app/main.py", "platform/backend/app/corpus/private-authoring-sentinel.py", "private-corpus.sqlite", "review/raw-source.pdf", "web/.env"):
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("SYNTHETIC_RAW_OR_SECRET_SENTINEL" if not relative.endswith((".py", ".tsx")) else "SYNTHETIC_CODE_ONLY")


def test_context_contains_only_declared_curated_files_and_code(tmp_path):
    source = tmp_path / "source"
    synthetic_code(source)
    result = context.assemble(EDITION, HASH, tmp_path / "context", source_root=source)
    assert result["assetCount"] > 0
    output = tmp_path / "context"
    files = {p.relative_to(output).as_posix() for p in output.rglob("*") if p.is_file()}
    assert not any("raw-source" in p or p.endswith(".sqlite") or ".env" in p for p in files)
    assert not any(p.startswith("platform/backend/app/corpus/") for p in files)
    ignore = (output / context.DEPLOY / "Dockerfile.dockerignore").read_text().splitlines()
    assert not any(line.startswith("!") and (line.endswith("/") or "**" in line) for line in ignore)
    copied, paths = context.catalogue_paths(output / "private-learner", HASH)
    assert copied.catalog_hash == HASH and len(paths) > 1


@pytest.mark.parametrize("mutation", ["missing", "tampered", "unlisted", "unlisted_allowed_name", "symlink"])
def test_invalid_edition_never_produces_context(tmp_path, mutation):
    edition = tmp_path / HASH
    shutil.copytree(EDITION, edition)
    media = next((edition / "assets").glob("*.mp3"))
    if mutation == "missing":
        media.unlink()
    elif mutation == "tampered":
        data = bytearray(media.read_bytes()); data[-1] ^= 1; media.write_bytes(data)
    elif mutation == "unlisted":
        (edition / "raw-source.sqlite").write_bytes(b"SYNTHETIC_RAW_SENTINEL")
    elif mutation == "unlisted_allowed_name":
        (edition / "assets" / ("0" * 64 + ".png")).write_bytes(b"SYNTHETIC_UNLISTED")
    else:
        relative = media.relative_to(edition)
        media.unlink(); media.symlink_to(EDITION / relative)
    with pytest.raises(Exception):
        context.assemble(edition, HASH, tmp_path / "output")
    assert not (tmp_path / "output").exists()


def test_context_cannot_be_written_into_app_or_follow_source_symlinks(tmp_path):
    source = tmp_path / "source"
    synthetic_code(source)
    with pytest.raises(ValueError, match="outside source"):
        context.assemble(EDITION, HASH, source / "accidental-public-context", source_root=source)
    (source / "web/src/link.ts").symlink_to(source / "web/src/main.tsx")
    with pytest.raises(ValueError, match="symlinks forbidden"):
        context.assemble(EDITION, HASH, tmp_path / "output", source_root=source)
    assert not (tmp_path / "output").exists()


@pytest.mark.parametrize("mutation", ["missing", "tampered", "symlink"])
def test_missing_or_changed_public_ca_never_produces_context(tmp_path, mutation):
    source = tmp_path / "source"
    synthetic_code(source)
    ca = source / context.DEPLOY / context.PUBLIC_CA_NAME
    if mutation == "missing":
        ca.unlink()
    elif mutation == "tampered":
        ca.write_bytes(ca.read_bytes() + b"SYNTHETIC_TAMPER")
    else:
        ca.unlink()
        ca.symlink_to(context.SOURCE_ROOT / context.DEPLOY / context.PUBLIC_CA_NAME)
    with pytest.raises(Exception):
        context.assemble(EDITION, HASH, tmp_path / "output", source_root=source)
    assert not (tmp_path / "output").exists()
