"""Private source extraction contracts; no learner serving dependency."""
from __future__ import annotations
import hashlib
import json
import re

VERSION = 'mitooni-private-extraction-1'
CHUNK_SIZE = 1600
OVERLAP = 160

def digest(value: bytes | str) -> str:
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()

def canonical(value: object) -> str:
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'))

def chunks(text: str, size: int = CHUNK_SIZE, overlap: int = OVERLAP):
    if size <= overlap or overlap < 0:
        raise ValueError('invalid chunk policy')
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            boundary = text.rfind('\n', start + size // 2, end)
            if boundary > start:
                end = boundary + 1
        yield text[start:end]
        if end == len(text):
            break
        start = max(start + 1, end - overlap)

def classify(path: str):
    low = path.lower()
    track = 'general-training' if 'general' in low else 'academic' if 'academic' in low else 'shared-or-unknown'
    match = re.search(r'cambridge[ -]*(?:ielts[ -]*)?(\d+)', low)
    edition = match.group(1) if match else None
    return track, edition, 'historical-source-not-default-assessment', {'classification_method': 'path-inference', 'confidence': 'unverified'}

# Local Apple Vision adapter; emitted only into ignored private cache.
SWIFT_OCR_SOURCE = 'import Foundation\nimport Vision\nimport AppKit\nfor path in CommandLine.arguments.dropFirst() {\n do {\n  let url = URL(fileURLWithPath: path)\n  let request = VNRecognizeTextRequest()\n  request.recognitionLevel = .accurate\n  request.recognitionLanguages = ["en-US"]\n  request.usesLanguageCorrection = true\n  try VNImageRequestHandler(url: url, options: [:]).perform([request])\n  let rows = (request.results ?? []).compactMap { observation -> [String: Any]? in\n   guard let candidate = observation.topCandidates(1).first else { return nil }\n   let box = observation.boundingBox\n   return ["text":candidate.string,"confidence":candidate.confidence,"bbox":[box.minX,box.minY,box.maxX,box.maxY]]\n  }\n  let data = try JSONSerialization.data(withJSONObject: ["path":path,"rows":rows])\n  print(String(data:data,encoding:.utf8)!)\n } catch { fputs("OCR failed: \\(error)\\n",stderr); exit(1) }\n}\n'
