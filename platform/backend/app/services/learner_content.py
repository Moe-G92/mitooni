"""Read-only private candidate catalogue, independent of reviewer routes/roles.

Only explicit task fields are learner-visible. Publication policy, keys, source
locations, scripts and semantic identities stay in this server-only object.
"""
from __future__ import annotations
from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path
import struct
import re
from app.contracts.learner_content import LearnerTask

MAX_CATALOG_BYTES = 20 * 1024 * 1024
MAX_ASSET_BYTES = 32 * 1024 * 1024


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()


def digest(value):
    return sha256(canonical(value)).hexdigest()


def safe_path(root: Path, relative: str) -> Path:
    if not isinstance(relative, str) or not relative or '\\' in relative:
        raise ValueError('Invalid catalogue asset path')
    path = Path(relative)
    if path.is_absolute() or any(x in {'.', '..'} for x in path.parts):
        raise ValueError('Catalogue asset path escapes root')
    current = root
    for part in path.parts:
        current = current / part
        if current.is_symlink():
            raise ValueError('Catalogue symlinks are forbidden')
    if not current.is_file() or not current.resolve().is_relative_to(root):
        raise ValueError('Catalogue asset missing')
    return current


def _json(raw):
    def pairs(values):
        result = {}
        for key, value in values:
            if key in result:
                raise ValueError('Duplicate catalogue key')
            result[key] = value
        return result
    def invalid(_):
        raise ValueError('Invalid catalogue number')
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid)


class LearnerCatalog:
    def __init__(self, root: Path, expected_hash: str | None = None):
        original = Path(root).absolute()
        if any(p.is_symlink() for p in (original, *original.parents)):
            raise ValueError('Catalogue root symlinks are forbidden')
        self.root = original.resolve(strict=True)
        path = safe_path(self.root, 'catalog.json')
        if path.stat().st_size > MAX_CATALOG_BYTES:
            raise ValueError('Catalogue too large')
        catalog = _json(path.read_bytes())
        self.catalog_hash = digest(catalog)
        if expected_hash is not None and expected_hash != self.catalog_hash:
            raise ValueError('Catalogue hash mismatch')
        if catalog.get('schemaVersion') != 1 or catalog.get('publication', {}).get('scope') != 'private_beta':
            raise ValueError('Explicit private candidate publication required')
        if set(catalog) != {'schemaVersion', 'publication', 'tasks', 'assets'}:
            raise ValueError('Unexpected catalogue fields')
        self._tasks = {}
        self._assets = {}
        listed = {'catalog.json'} | {record['path'] for record in catalog['assets']}
        actual = set()
        for path in self.root.rglob('*'):
            if path.is_symlink():
                raise ValueError('Catalogue symlinks are forbidden')
            if path.is_file():
                actual.add(path.relative_to(self.root).as_posix())
            elif path.is_dir() and path.relative_to(self.root).as_posix() != 'assets':
                raise ValueError('Unlisted catalogue directory')
        if actual != listed:
            raise ValueError('Catalogue inventory mismatch')
        for record in catalog['assets']:
            aid = record['id']
            extension = {'image/png': 'png', 'audio/mpeg': 'mp3', 'audio/wav': 'wav'}.get(record['mediaType'])
            if extension is None or record['path'] != f"assets/{record['sha256']}.{extension}" or not re.fullmatch(r'[a-f0-9]{64}', record['sha256']):
                raise ValueError('Noncanonical content-addressed asset path')
            if aid in self._assets:
                raise ValueError('Duplicate catalogue asset')
            self._assets[aid] = deepcopy(record)
            self._verified_asset(aid)
        for record in catalog['tasks']:
            public = LearnerTask.model_validate(record['task']).model_dump()
            tid = public['id']
            meta = record['metadata']
            assessment = record['assessment']
            if tid in self._tasks or meta['id'] != tid or meta['contentHash'] != digest(public):
                raise ValueError('Task identity/hash mismatch')
            if meta['version'] < 1 or meta['role'] not in {'train', 'transfer', 'mock'}:
                raise ValueError('Invalid task publication')
            if meta['skill'] != public['skill'] or meta['examTrack'] != public['examTrack']:
                raise ValueError('Task metadata mismatch')
            ids = {q['id'] for s in public['sections'] for q in s['questions']}
            keys = assessment['answerKey']
            if assessment['kind'] == 'deterministic':
                if len(keys) != len(ids) or {x['questionId'] for x in keys} != ids or any(not x['acceptedAnswers'] for x in keys):
                    raise ValueError('Every deterministic item needs one private key')
                questions = {q['id']: q for section in public['sections'] for q in section['questions']}
                for key in keys:
                    question = questions[key['questionId']]
                    if question['responseType'] not in {'single_choice', 'short_text', 'multi_select'}:
                        raise ValueError('Deterministic key for unsupported response type')
                    if question['responseType'] == 'single_choice' and not set(key['acceptedAnswers']) <= {o['id'] for o in question['options']}:
                        raise ValueError('Private key does not match public option identities')
                grouped = set()
                for group in assessment.get('answerGroups', []):
                    members = group['questionIds']
                    if not members or len(members) != len(set(members)) or not set(members) <= ids or grouped & set(members) or len(group.get('acceptedAnswers', [])) != len(members):
                        raise ValueError('Invalid distinct answer group')
                    if type(group.get('orderIndependent')) is not bool or type(group.get('distinct')) is not bool:
                        raise ValueError('Explicit answer group matching policy required')
                    grouped.update(members)
            elif assessment['kind'] != 'qualitative' or keys:
                raise ValueError('Invalid qualitative assessment')
            for asset in public['assets']:
                stored = self._assets.get(asset['id'])
                if not stored or any(asset[k] != stored[k] for k in ('sha256', 'mediaType')):
                    raise ValueError('Task asset binding mismatch')
            if public['skill'] == 'listening' and meta.get('available', True) and not any(a['mediaType'].startswith('audio/') for a in public['assets']):
                raise ValueError('Available listening requires real bound audio')
            if not meta.get('semanticExposureGroupIds') or not meta.get('familyId'):
                raise ValueError('Semantic exposure identity required')
            self._tasks[tid] = dict(task=public, metadata=deepcopy(meta), assessment=deepcopy(assessment), lineage=deepcopy(record['lineage']))
        if not self._tasks:
            raise ValueError('Empty learner catalogue')

    def _verified_asset(self, aid):
        r = self._assets[aid]
        p = safe_path(self.root, r['path'])
        if not 0 < r['sizeBytes'] <= MAX_ASSET_BYTES or p.stat().st_size != r['sizeBytes']:
            raise ValueError('Asset size mismatch')
        raw = p.read_bytes()
        if sha256(raw).hexdigest() != r['sha256']:
            raise ValueError('Asset hash mismatch')
        mime = r['mediaType']
        if mime == 'image/png':
            if raw[:8] != b'\x89PNG\r\n\x1a\n' or len(raw) < 24:
                raise ValueError('Invalid PNG')
            width, height = struct.unpack('>II', raw[16:24])
            if not 1 <= width <= 12000 or not 1 <= height <= 16000:
                raise ValueError('Invalid image dimensions')
        elif mime == 'audio/mpeg':
            if not (raw[:3] == b'ID3' or len(raw) > 1 and raw[0] == 255 and raw[1] & 224 == 224):
                raise ValueError('Invalid MP3')
        elif mime == 'audio/wav':
            if raw[:4] != b'RIFF' or raw[8:12] != b'WAVE':
                raise ValueError('Invalid WAV')
        else:
            raise ValueError('Unsupported learner media')
        return dict(path=p, sha256=r['sha256'], mediaType=mime, sizeBytes=r['sizeBytes'])

    def list_tasks(self, track=None, branch=None, role=None):
        result = []
        for record in self._tasks.values():
            m = record['metadata']
            if not m.get('available', True):
                continue
            if track and m['examTrack'] not in {track, 'shared'}:
                continue
            if branch and m['branch'] not in {branch, 'all'}:
                continue
            if role and m['role'] != role:
                continue
            result.append(dict(deepcopy(m), catalogHash=self.catalog_hash))
        return result

    def metadata(self, task_id):
        return dict(deepcopy(self._tasks[task_id]['metadata']), catalogHash=self.catalog_hash)

    def get_task(self, task_id):
        record = self._tasks[task_id]
        if not record['metadata'].get('available', True):
            raise ValueError('Task media is unavailable for learner delivery')
        return deepcopy(record['task'])

    def assessment(self, task_id):
        return deepcopy(self._tasks[task_id]['assessment'])

    def lineage(self, task_id):
        return deepcopy(self._tasks[task_id]['lineage'])

    def asset(self, asset_id, task_id=None):
        if task_id is not None and asset_id not in {a['id'] for a in self.get_task(task_id)['assets']}:
            raise ValueError('Asset does not belong to task')
        return self._verified_asset(asset_id)
