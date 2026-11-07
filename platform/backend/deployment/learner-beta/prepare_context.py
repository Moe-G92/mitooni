"""Create one explicit local Docker context from a validated immutable edition.

Never reads .env, source originals, corpus stores or review siblings. No network.
"""
from pathlib import Path
from hashlib import sha256
import argparse
import json
import re
import shutil
import sys
import tempfile

SOURCE_ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(SOURCE_ROOT / "platform/backend"))
from app.services.content_pipeline import safe_file, no_symlinks, rename_exclusive
from app.services.learner_content import LearnerCatalog

DEPLOY = Path("platform/backend/deployment/learner-beta")
PUBLIC_CA_NAME = "supabase-root-2021.crt"
PUBLIC_CA_SHA256 = "700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7"
CODE_FILES = {"web/package.json", "web/package-lock.json", "web/index.html", "web/tsconfig.json", "web/vite.config.ts",
              "web/scripts/account-build-boundary.ts", "platform/backend/pyproject.toml", "platform/backend/uv.lock"}


def allowed_package_path(relative):
    return bool(re.fullmatch(r"(?:catalog\.json|assets/[a-f0-9]{64}\.(?:png|mp3|wav))", relative))


def catalogue_paths(root, expected_hash):
    catalog = LearnerCatalog(root, expected_hash)
    entries = list(root.rglob("*"))
    if any(p.is_symlink() for p in entries):
        raise ValueError("Catalogue symlinks are forbidden")
    files = {p.relative_to(root).as_posix() for p in entries if p.is_file()}
    declared = {"catalog.json"} | {r["path"] for r in json.loads((root / "catalog.json").read_bytes())["assets"]}
    if files != declared:
        raise ValueError("Catalogue inventory mismatch")
    # Loader validates the exact graph. This second bounded grammar excludes any
    # newly introduced source/data format until its packaging review is explicit.
    if not all(allowed_package_path(relative) for relative in files):
        raise ValueError("Catalogue contains a forbidden deployment file")
    return catalog, files


def write_copy(source, destination):
    no_symlinks(source)
    if not source.is_file():
        raise ValueError("Missing declared context file")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(source.read_bytes())


def source_paths(source_root):
    code = set(CODE_FILES)
    for path in (source_root / "web/src").rglob("*"):
        if path.is_symlink():
            raise ValueError("Source symlinks forbidden")
        if path.is_file() and not any(part.startswith(".") for part in path.relative_to(source_root).parts):
            if path.suffix not in {".ts", ".tsx", ".js", ".css", ".json"}:
                raise ValueError("Unexpected frontend source file")
            code.add(path.relative_to(source_root).as_posix())
    for path in (source_root / "platform/backend/app").rglob("*.py"):
        if path.is_relative_to(source_root / "platform/backend/app/corpus"):
            continue  # Private authoring/ingestion/dispatch is not serving code.
        code.add(path.relative_to(source_root).as_posix())
    code |= {(DEPLOY / name).as_posix() for name in ("Dockerfile", "entrypoint.py", "railway.json", PUBLIC_CA_NAME)}
    return code


def assemble(edition, package_hash, output, *, source_root=SOURCE_ROOT):
    edition, output, source_root = Path(edition), Path(output), Path(source_root)
    if not re.fullmatch(r"[a-f0-9]{64}", package_hash):
        raise ValueError("Explicit immutable edition/hash required")
    no_symlinks(edition)
    no_symlinks(output)
    no_symlinks(source_root)
    if output.resolve().is_relative_to(source_root.resolve()) or output.resolve().is_relative_to(edition.resolve()):
        raise ValueError("Deployment context must be outside source and edition trees")
    if output.exists() or not output.parent.is_dir():
        raise ValueError("Output must be a new context in an existing directory")
    catalog, private_paths = catalogue_paths(edition, package_hash)
    code = source_paths(source_root)
    stage = Path(tempfile.mkdtemp(prefix=".mitooni-context-", dir=output.parent))
    try:
        for relative in sorted(code):
            write_copy(safe_file(source_root, relative), stage / relative)
        if sha256((stage / DEPLOY / PUBLIC_CA_NAME).read_bytes()).hexdigest() != PUBLIC_CA_SHA256:
            raise ValueError("Pinned public database CA mismatch")
        for relative in sorted(private_paths):
            write_copy(safe_file(edition, relative), stage / "private-learner" / relative)
        copied, copied_paths = catalogue_paths(stage / "private-learner", package_hash)
        if copied.catalog_hash != catalog.catalog_hash or copied_paths != private_paths:
            raise ValueError("Catalogue changed while preparing context")
        if any(sha256(safe_file(edition, p).read_bytes()).digest() != sha256((stage / "private-learner" / p).read_bytes()).digest() for p in private_paths):
            raise ValueError("Catalogue changed while preparing context")
        if source_paths(source_root) != code or any(sha256(safe_file(source_root, p).read_bytes()).digest() != sha256((stage / p).read_bytes()).digest() for p in code):
            raise ValueError("Serving source changed while preparing context")
        admitted = code | {"private-learner/" + relative for relative in private_paths}
        # Exact files only: negating parent directories admits hidden descendants.
        ignore = "**\n" + "\n".join("!" + relative for relative in sorted(admitted)) + "\n"
        (stage / DEPLOY / "Dockerfile.dockerignore").write_text(ignore)
        manifest = {"catalogHash": package_hash, "assetCount": len(private_paths) - 1,
                    "files": {relative: sha256((stage / relative).read_bytes()).hexdigest() for relative in sorted(admitted)}}
        (stage / "context-manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2) + "\n")
        rename_exclusive(stage, output)
        return {"catalogHash": package_hash, "assetCount": len(private_paths) - 1, "contextFiles": len(admitted), "output": str(output)}
    except Exception:
        shutil.rmtree(stage)
        raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", dest="edition", type=Path, required=True)
    parser.add_argument("--catalog-hash", dest="package_hash", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        result = assemble(args.edition, args.package_hash, args.output)
    except Exception:
        print("Deployment context validation failed", file=sys.stderr)
        return 1
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
