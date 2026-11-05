"""Admitted BarEx af57036 study_editions.py:23–25 projection function.

Exact canonical-anchor hash retained. Owner-serialized first-open implements
source ensure_pin's read-winning-pin rule with direct receiving PostgreSQL.
"""

import hashlib
import json
from typing import Any


def projection_revision(projection: dict[str, Any]) -> str:
    body = json.dumps(
        projection.get("ordered_anchors") or [],
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def manifest_hash(pack: dict[str, Any]) -> str:
    """Attest full immutable graph/bundle; publication authority is separate."""
    immutable = {key: value for key, value in pack.items() if key != "publication"}
    body = json.dumps(
        immutable, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def public_content_hash(pack: dict[str, Any]) -> str:
    """Public learner content hash must never be an answer-key oracle.

    Private keys/rationales belong only to server manifest attestation. This
    projection is independently defined, rather than a blacklist of secret fields.
    """
    public = {
        key: pack[key]
        for key in [
            "stepId",
            "title",
            "skill",
            "kind",
            "taskId",
            "familyId",
            "stimulus",
            "prompt",
            "anchors",
            "criteria",
        ]
    }
    body = json.dumps(public, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()
