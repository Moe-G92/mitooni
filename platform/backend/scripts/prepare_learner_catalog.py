#!/usr/bin/env python3
"""Assemble only explicitly selected private learner assets, never whole books.

Requires an independently checked PRIVATE seed with exact key/page bindings.
No provider, network, ingestion initialization or serving database is used.
"""
from __future__ import annotations
import argparse
from copy import deepcopy
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sqlite3
import sys
import subprocess

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.learner_content import LearnerCatalog, canonical, digest, safe_path
from app.contracts.learner_content import LearnerTask


def private_write(path, raw):
    path = Path(path)
    if path.is_symlink():
        raise ValueError('Refuse output symlink')
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    if path.exists():
        if path.read_bytes() != raw:
            raise ValueError('Refuse overwrite of different private artifact')
        return
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(raw)


def asset(out, raw, mime, *, alt=None, duration=None):
    h = sha256(raw).hexdigest()
    extension = {'image/png': 'png', 'audio/mpeg': 'mp3', 'audio/wav': 'wav'}[mime]
    aid = 'm-' + h
    relative = f'assets/{h}.{extension}'
    private_write(out / relative, raw)
    record = dict(id=aid, path=relative, sha256=h, mediaType=mime, sizeBytes=len(raw))
    public = dict(id=aid, sha256=h, mediaType=mime, alt=alt, durationSeconds=duration)
    return record, public


def clean_page(text):
    # Remove publisher/mirror running furniture only; keep all actual task text.
    lines = [line.rstrip() for line in text.splitlines()]
    lines = [line for line in lines if not re.fullmatch(r'\s*(?:S&S IELTS|AFARINESH IELTS House|www\.afarinesh\.org|JELTS REAL EXAMS|IELTS REAL EXAMS)\s*', line)]
    return '\n'.join(lines).strip()


def build(edition: Path, source_root: Path, store: Path, seed: dict, out: Path, *, internal_narration=False):
    if any(p.is_symlink() for p in (out.absolute(), *out.absolute().parents)):
        raise ValueError('Refuse output symlink')
    out.mkdir(parents=True, exist_ok=True, mode=0o700)
    manifest = json.loads((edition / 'manifest.json').read_text())
    for ref in manifest['units'] + manifest['companions']:
        if digest(json.loads(safe_path(edition.resolve(), ref['path']).read_bytes())) != ref['sha256']:
            raise ValueError('Frozen edition JSON hash mismatch')
    unit_payloads = {r['id']: json.loads((edition / r['path']).read_text()) for r in manifest['units']}
    syllabus = json.loads((edition / 'syllabus.json').read_text())
    mappings = {u['id']: u for u in syllabus['units']}
    records, assets = [], {}
    def add_asset(raw, mime, **kwargs):
        private, public = asset(out, raw, mime, **kwargs)
        assets[private['id']] = private
        return public
    for unit in unit_payloads.values():
        uid = unit['id']
        media = []
        for a in manifest['assets']:
            # Largest responsive visual only; every audio is exact-bound below.
            if a['mediaType'] == 'image/png' and a['width'] != 1280:
                continue
            if not any(b['targetId'] == uid for b in a['contentBindings']):
                continue
            if a['mediaType'].startswith('audio/') and not internal_narration:
                continue
            raw = safe_path(edition.resolve(), a['path']).read_bytes()
            if sha256(raw).hexdigest() != a['sha256']:
                raise ValueError('Frozen media hash mismatch')
            for binding in a['contentBindings']:
                if binding['targetId'] != uid:
                    continue
                value = unit
                for token in binding['targetPointer'].strip('/').split('/'):
                    value = value[int(token)] if isinstance(value, list) else value[token]
                if digest(value) != binding['targetValueSha256']:
                    raise ValueError('Frozen media content binding mismatch')
            media.append(add_asset(raw, a['mediaType'], alt=a.get('alt'), duration=a.get('durationSeconds')))
        questions = [dict(id=q['id'], prompt=q['prompt'], responseType=q['responseType'], options=q['options'], wordLimit=q['wordLimit'], minimumWords=None) for q in unit['questions']]
        text = None if unit['skill'] == 'listening' else unit['stimulus']['text']
        task = dict(id=uid, title=unit['title'], skill=unit['skill'], examTrack=unit['examTrack'],
                    kind={'reading': 'reading_items', 'listening': 'listening_items', 'writing': 'writing_tasks', 'speaking': 'speaking_turn'}[unit['skill']],
                    sections=[dict(id=uid, title=unit['title'], text=text, instructions=unit['instructions'], questions=questions, table=None, assetIds=[a['id'] for a in media])],
                    assets=media, teachingAnchors=unit['locale']['teachingAnchorsFa'], objectiveIds=unit['objectiveIds'])
        task = LearnerTask.model_validate(task).model_dump()
        branch = {'fnd': 'foundation', 'int': 'intermediate', 'adv': 'advanced'}[uid.removeprefix('gt-').split('-')[0]]
        row = mappings[uid]
        groups = row['semanticExposureGroupIds']
        overlaps = [g['id'] for g in syllabus['semanticExposureGroups'] if g['id'] in groups and len({x['unitId'] for x in g['activities']}) > 1]
        available = unit['skill'] != 'listening' or bool(media)
        records.append(dict(task=task,
            metadata=dict(id=uid, title=unit['title'], skill=unit['skill'], examTrack=unit['examTrack'], branch=branch, role=unit['stage'], version=unit['version'], contentHash=digest(task), familyId=unit['familyId'], semanticExposureGroupIds=groups,
                          objectiveIds=unit['objectiveIds'], estimatedMinutes={'reading': 15, 'writing': 25, 'listening': 10, 'speaking': 12}[unit['skill']], available=available, origin='source_based_original', unseenEligible=not overlaps, exposureHolds=overlaps),
            assessment=deepcopy(unit['assessment']),
            lineage=dict(origin='source_based_original', editionId=edition.name, sourceUnitHash=digest(unit), sourceRefs=unit['provenance']['sourceRefs'], provenance=unit['provenance'], privateScript=unit['stimulus']['text'] if unit['skill'] == 'listening' else None,
                         narrationScope='authorized_internal_three_teacher_product_testing' if unit['skill'] == 'listening' and media else None,
                         publicationBasis='2026-11-07 internal learner preview; original author review metadata preserved privately', historicalTeacherReview=unit['teacherReview'], activityExposureMappings=row['activityExposureMappings'])))
    conn = sqlite3.connect(f'file:{store.resolve()}?mode=ro', uri=True)
    conn.row_factory = sqlite3.Row
    try:
        books = {}
        for name, source in seed['books'].items():
            path = safe_path(source_root.resolve(), source['relativePath'])
            if sha256(path.read_bytes()).hexdigest() != source['sha256']:
                raise ValueError('Licensed source hash mismatch')
            extraction = conn.execute('SELECT revision_id FROM corpus_assets WHERE asset_id=?', (source['sha256'],)).fetchone()
            if not extraction:
                raise ValueError('Licensed source missing from private corpus')
            revision = extraction['revision_id']
            check = conn.execute('SELECT status,quality_json FROM corpus_extractions WHERE revision_id=?', (revision,)).fetchone()
            if check['status'] != 'complete' or not json.loads(check['quality_json']).get('source_hash_verified'):
                raise ValueError('Licensed extraction is incomplete')
            if conn.execute('SELECT 1 FROM corpus_integrity_holds WHERE asset_id=? AND revision_id=? AND blocks_default=1 LIMIT 1', (source['sha256'], revision)).fetchone():
                raise ValueError('Selected source has an integrity hold')
            books[name] = (path, revision, source)
        def pages(book, numbers):
            path, revision, source = books[book]
            text, media, lineage = [], [], []
            for n in numbers:
                row = conn.execute('SELECT page_id,text,text_sha256 FROM corpus_pages WHERE revision_id=? AND page_number=?', (revision, n)).fetchone()
                if not row or not row['text'].strip():
                    raise ValueError('Selected task page has no accessible extraction')
                text.append(clean_page(row['text']))
                rendered = subprocess.run(['python3', '-c', 'import pymupdf as fitz,sys;d=fitz.open(sys.argv[1]);sys.stdout.buffer.write(d[int(sys.argv[2])-1].get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False).tobytes("png"))', str(path), str(n)], capture_output=True, check=True, timeout=30).stdout
                alt = seed.get('visualDescriptions', {}).get(f'{book}:{n}', f'Exercise page {n}. The complete task text is also provided in this section.')
                media.append(add_asset(rendered, 'image/png', alt=alt))
                lineage.append(dict(sourceSha256=source['sha256'], extractionRevision=revision, page=n, pageId=row['page_id'], textSha256=row['text_sha256']))
            return '\n\n'.join(text), media, lineage
        for form in seed['forms']:
            sections, public_assets, source_pages = [], [], []
            for section in form['sections']:
                text, media, refs = pages(form['book'], section['pages'])
                if section.get('audio'):
                    source = section['audio']
                    raw = safe_path(source_root.resolve(), source['relativePath']).read_bytes()
                    if sha256(raw).hexdigest() != source['sha256']:
                        raise ValueError('Original audio source hash mismatch')
                    media.append(add_asset(raw, 'audio/mpeg', duration=source['durationSeconds']))
                questions = deepcopy(section['questions'])
                if section.get('textOverride'):
                    text = section['textOverride']
                sections.append(dict(id=section['id'], title=section['title'], text=text, instructions=section.get('instructions', ''), questions=questions, table=section.get('table'), assetIds=[a['id'] for a in media]))
                public_assets.extend(media)
                source_pages.extend(refs)
            # Content-addressed pages shared between speaking parts appear once.
            public_assets = list({a['id']: a for a in public_assets}.values())
            task = LearnerTask.model_validate(dict(id=form['id'], title=form['title'], skill=form['skill'], examTrack=form['examTrack'], kind=form['kind'], sections=sections, assets=public_assets, teachingAnchors=[], objectiveIds=form['objectiveIds'])).model_dump()
            book = books[form['book']][2]
            key_page = form.get('keyPage')
            key_ref = None
            if key_page:
                r = conn.execute('SELECT page_id,text_sha256 FROM corpus_pages WHERE revision_id=? AND page_number=?', (books[form['book']][1], key_page)).fetchone()
                if not r or form['keyVerification']['sourceSha256'] != book['sha256'] or form['keyVerification']['page'] != key_page or form['keyVerification']['textSha256'] != r['text_sha256']:
                    raise ValueError('Private key verification source drift')
                key_ref = dict(page=key_page, pageId=r['page_id'], textSha256=r['text_sha256'], method=form['keyVerification']['method'])
            records.append(dict(task=task,
                metadata=dict(id=form['id'], title=form['title'], skill=form['skill'], examTrack=form['examTrack'], branch='all', role='mock', version=1, contentHash=digest(task), familyId=form['familyId'], semanticExposureGroupIds=form['semanticExposureGroupIds'], objectiveIds=form['objectiveIds'], estimatedMinutes=(form['durationSeconds']+59)//60, durationSeconds=form['durationSeconds'], available=True, origin='licensed_curated', unseenEligible=True, exposureHolds=[]),
                assessment=form['assessment'],
                lineage=dict(origin='licensed_curated', sourcePages=source_pages, privateKeySource=key_ref, sourceSha256=book['sha256'], title=form['title'], reviewedContentBasis='Existing licensed source validation accepted by owner; exact selected task/key/media adapter verification separate', sourceFamilyAliases=form.get('sourceFamilyAliases', []), timing=form.get('timing', {}))))
    finally:
        conn.close()
    catalog = dict(schemaVersion=1, publication=dict(scope='private_beta', audience='three_authorized_teachers', purpose='internal_product_testing', calibratedBands=False, sourceRightsTerritory='Iran', policyVersion=1), tasks=records, assets=sorted(assets.values(), key=lambda a:a['id']))
    private_write(out / 'catalog.json', canonical(catalog))
    loaded = LearnerCatalog(out, digest(catalog))
    return dict(catalogHash=loaded.catalog_hash, tasks=len(records), available=len(loaded.list_tasks()), assets=len(assets), prompts=sum(len(s['questions']) for r in records for s in r['task']['sections']), origins={origin:sum(r['metadata']['origin']==origin for r in records) for origin in ['licensed_curated','source_based_original']})


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ['edition', 'source-root', 'store', 'seed', 'output']:
        p.add_argument('--'+name, type=Path, required=True)
    p.add_argument('--include-internal-narration', action='store_true', help='Only authorized internal three-teacher product testing, never public learner publication')
    args=p.parse_args()
    result=build(args.edition.resolve(), args.source_root.resolve(), args.store, json.loads(args.seed.read_text()), args.output, internal_narration=args.include_internal_narration)
    print(json.dumps(result, sort_keys=True))

if __name__ == '__main__':
    main()
