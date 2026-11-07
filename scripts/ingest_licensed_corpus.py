#!/usr/bin/env python3
"""Run with local Python containing PyMuPDF; no network or provider calls."""
from pathlib import Path
import argparse
import json
import os
import sys
import subprocess
APP = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP / 'platform' / 'backend'))
from app.corpus.ingestion import Ingestor
from app.corpus.contracts import SWIFT_OCR_SOURCE

def main():
    # Dedicated CLI process only; spawned workers inherit private creation modes.
    os.umask(0o077)
    parser=argparse.ArgumentParser()
    parser.add_argument('--source-root',type=Path,default=APP.parent)
    parser.add_argument('--output',type=Path,default=APP/'review'/'corpus-20261106')
    parser.add_argument('--ocr-binary',type=Path,default=APP/'review'/'corpus-20261106'/'vision-ocr')
    parser.add_argument('--workers',type=int,default=2)
    args=parser.parse_args()
    if not args.ocr_binary.exists() and sys.platform == 'darwin':
        args.output.mkdir(parents=True,exist_ok=True)
        source=args.output/'vision.swift';source.write_text(SWIFT_OCR_SOURCE)
        subprocess.run(['swiftc','-module-cache-path',str(args.output/'swift-module-cache'),str(source),'-o',str(args.ocr_binary)],check=True,timeout=180)
    runner=Ingestor(args.source_root,args.output,ocr_binary=args.ocr_binary if args.ocr_binary.exists() else None,workers=args.workers)
    summary=runner.run()
    print(json.dumps(summary,indent=2))
    return 1 if summary['failed_originals'] or summary['blocked_jobs'] else 0

if __name__=='__main__': raise SystemExit(main())
