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
from app.services.content_pipeline import (load_package, require_review_media, package_paths,
                                          safe_file, no_symlinks, rename_exclusive)

DEPLOY = Path("platform/backend/deployment/content-review-beta")
PUBLIC_CA_NAME = "supabase-root-2021.crt"
PUBLIC_CA_SHA256 = "700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7"
CODE_FILES = {"web/package.json", "web/package-lock.json", "web/index.html", "web/tsconfig.json", "web/vite.config.ts",
              "web/scripts/account-build-boundary.ts", "platform/backend/pyproject.toml", "platform/backend/uv.lock"}


def allowed_package_path(relative):
    return bool(re.fullmatch(
        r"(?:manifest\.json|evaluation/cases\.json|[a-z0-9-]+\.json|(?:units|mocks)/[a-z0-9-]+\.json|"
        r"visual-specs/[a-zA-Z0-9_-]+\.json|media/[a-zA-Z0-9_-]+\.(?:png|mp3|wav))", relative))


def write_copy(source, destination):
    no_symlinks(source)
    if not source.is_file():
        raise ValueError("Missing declared context file")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(source.read_bytes())


def assemble(edition, package_hash, output, *, source_root=SOURCE_ROOT):
    edition, output, source_root = Path(edition), Path(output), Path(source_root)
    if not re.fullmatch(r"[a-f0-9]{64}", package_hash) or edition.name != package_hash:
        raise ValueError("Explicit immutable edition/hash required")
    no_symlinks(edition)
    no_symlinks(output)
    no_symlinks(source_root)
    if output.resolve().is_relative_to(source_root.resolve()) or output.resolve().is_relative_to(edition.resolve()):
        raise ValueError("Deployment context must be outside source and edition trees")
    if output.exists() or not output.parent.is_dir():
        raise ValueError("Output must be a new context in an existing directory")
    package, actual = load_package(edition)
    if actual != package_hash:
        raise ValueError("Edition hash mismatch")
    require_review_media(package)
    private_paths = package_paths(package)
    if not all(allowed_package_path(relative) for relative in private_paths):
        raise ValueError("Edition contains a forbidden deployment file")
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
    stage = Path(tempfile.mkdtemp(prefix=".mitooni-context-", dir=output.parent))
    try:
        for relative in sorted(code):
            write_copy(safe_file(source_root, relative), stage / relative)
        if sha256((stage / DEPLOY / PUBLIC_CA_NAME).read_bytes()).hexdigest() != PUBLIC_CA_SHA256:
            raise ValueError("Pinned public database CA mismatch")
        for relative in sorted(private_paths):
            write_copy(safe_file(edition, relative), stage / "private-review" / relative)
        copied, copied_hash = load_package(stage / "private-review")
        if copied != package or copied_hash != package_hash:
            raise ValueError("Edition changed while preparing context")
        admitted = code | {"private-review/" + relative for relative in private_paths}
        # Exact files only: negating parent directories admits hidden descendants.
        ignore = "**\n" + "\n".join("!" + relative for relative in sorted(admitted)) + "\n"
        (stage / DEPLOY / "Dockerfile.dockerignore").write_text(ignore)
        manifest = {"packageHash": package_hash, "assetCount": len(package["assets"]),
                    "assessmentHoldCount": len(package["assessmentHolds"]),
                    "files": {relative: sha256((stage / relative).read_bytes()).hexdigest() for relative in sorted(admitted)}}
        (stage / "context-manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2) + "\n")
        rename_exclusive(stage, output)
        return {"packageHash": package_hash, "assetCount": len(package["assets"]), "contextFiles": len(admitted), "output": str(output)}
    except Exception:
        shutil.rmtree(stage)
        raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--edition", type=Path, required=True)
    parser.add_argument("--package-hash", required=True)
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
