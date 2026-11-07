"""Run from platform/backend: python -m scripts.content_pipeline PACKAGE [COMMAND]."""

import argparse
import json
from pathlib import Path

from app.services.content_pipeline import build_metadata, intake_media, load_package, evaluate, publish_teacher_edition


def main(argv=None):
    parser = argparse.ArgumentParser(description="Offline original IELTS content validation and private teacher review")
    parser.add_argument("package", type=Path)
    parser.add_argument("command", nargs="?", choices=["validate", "build-metadata", "intake-media", "evaluate", "publish-teacher"], default="validate")
    parser.add_argument("--output", type=Path, default=Path("../../review/content"))
    parser.add_argument("--visual-manifest", type=Path)
    parser.add_argument("--audio-manifest", type=Path)
    args = parser.parse_args(argv)
    if args.command == "intake-media":
        path, package_hash = intake_media(args.package, args.output, visual_manifest=args.visual_manifest, audio_manifest=args.audio_manifest)
        print(json.dumps({"privateStagingPackage": str(path), "packageHash": package_hash, "teacherApproval": "pending"}, indent=2))
        return 0
    package, package_hash = build_metadata(args.package) if args.command == "build-metadata" else load_package(args.package)
    result = {"packageHash": package_hash, "unitCount": len(package["units"]), "caseCount": len(package["evaluation"]["cases"]), "teacherApproval": "pending"}
    if args.command == "evaluate":
        result = evaluate(package, package_hash)
    elif args.command == "publish-teacher":
        result["localPrivateEdition"] = str(publish_teacher_edition(package, package_hash, args.output, source_root=args.package).resolve())
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
