#!/usr/bin/env python3
"""Local teacher-review TTS. Default is read-only; no active learner media delivery."""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content/ielts-academic/2026-11-06'
OUTPUT = ROOT / 'review/content-20261106/audio'
SAY = '/usr/bin/say'
FFMPEG = '/opt/homebrew/bin/ffmpeg'
FFPROBE = '/opt/homebrew/bin/ffprobe'
# Only advertised English voices are eligible; no missing-name requests/downloads.
PREFERRED = ('Samantha', 'Daniel', 'Karen', 'Moira', 'Tessa', 'Alex', 'Fred')
COMMAND_WARNINGS: list[dict] = []
ROLE = re.compile(r'^([A-Za-z][A-Za-z .\'-]{0,39}):[ \t]*(\S.*)$')


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def safe_path(path: Path, base: Path) -> Path:
    if '..' in path.parts or not path.is_relative_to(base):
        raise ValueError('Path must be inside the fixed review/content tree without traversal')
    for node in (path, *path.parents):
        if node.is_symlink():
            raise ValueError(f'Symlink path is prohibited: {node}')
        if node == ROOT:
            break
    if not path.resolve().is_relative_to(base.resolve()):
        raise ValueError('Resolved path escapes allowed tree')
    return path


def split_script(script: str) -> tuple[str, list[dict]]:
    lines = [line for line in script.splitlines() if line.strip()]
    matches = [ROLE.fullmatch(line) for line in lines]
    if matches and all(matches):
        return 'role_labels_removed', [
            {'role': m.group(1), 'text': m.group(2)} for m in matches if m
        ]
    return 'exact_script_single_voice', [{'role': 'narrator', 'text': script}]


def sources() -> list[dict]:
    result = []
    for path in sorted(CONTENT.glob('units/*-listening-*.json')):
        safe_path(path, CONTENT)
        raw = path.read_bytes()
        data = json.loads(raw)
        script = data['stimulus']['text']
        entry = item(path, raw, path.stem, script, 'stimulus.text')
        entry['sourceBinding'] = binding(data['id'], '/stimulus/text', script)
        result.append(entry)
    mock = CONTENT / 'mocks/academic-01-listening.json'
    if mock.exists():
        safe_path(mock, CONTENT)
        raw = mock.read_bytes()
        data = json.loads(raw)
        for index, part in enumerate(data['parts'], 1):
            # Explicit supported schema; fail closed rather than guess transcript fields.
            turns = part['script']
            roles = {speaker['id'] for speaker in part['speakers']}
            if not turns or any(turn['speakerId'] not in roles for turn in turns):
                raise ValueError('Mock script contains an unknown speaker or no turns')
            script = '\n'.join(turn['text'] for turn in turns)
            entry = item(mock, raw, f'{mock.stem}-part-{index}', script,
                         f'parts[{index - 1}].script')
            entry['segmentation'] = 'structured_speaker_turns_exact_text'
            entry['segments'] = [{'role': turn['speakerId'], 'text': turn['text']} for turn in turns]
            entry['sourceTurns'] = turns
            entry['sourceBinding'] = binding(data['id'], f'/parts/{index - 1}/script', turns)
            result.append(entry)
    index_path = safe_path(CONTENT / 'source-index.json', CONTENT)
    index_raw = index_path.read_bytes()
    index = json.loads(index_raw)
    indexed = {entry['id']: entry for entry in index['entries']}
    for source in result:
        current_raw = (ROOT / source['source']).read_bytes()
        if digest(current_raw) != source['sourceSha256']:
            raise ValueError('Source changed during read-only freeze; retry after authors stop')
        data = json.loads(current_raw)
        refs = data['provenance']['sourceRefs']
        if any(ref not in indexed for ref in refs):
            raise ValueError(f'Unresolved source lineage: {source["id"]}')
        source['derivationProvenance'] = data['provenance']
        source['sourceIndex'] = {'path': str(index_path.relative_to(ROOT)),
                                 'sha256': digest(index_raw),
                                 'entries': [indexed[ref] for ref in refs]}
    return result


def binding(target_id: str, pointer: str, value: object) -> dict:
    canonical = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return {'targetId': target_id, 'pointer': pointer, 'valueSha256': digest(canonical),
            'canonicalization': 'JSON UTF-8, ensure_ascii=false, sort_keys=true, separators=comma:colon'}


def check_drift(items: list[dict]) -> None:
    for source in items:
        if digest((ROOT / source['source']).read_bytes()) != source['sourceSha256']:
            raise ValueError(f'Source drift during generation: {source["source"]}')
        index = source['sourceIndex']
        if digest((ROOT / index['path']).read_bytes()) != index['sha256']:
            raise ValueError('Source-index drift during generation')


def freeze_hash(items: list[dict]) -> str:
    bindings = [{'id': source['id'], 'source': source['source'],
                 'sourceSha256': source['sourceSha256'],
                 'sourceIndexSha256': source['sourceIndex']['sha256']} for source in items]
    return digest(json.dumps(bindings, sort_keys=True, separators=(',', ':')).encode())


def item(path: Path, raw: bytes, name: str, script: str, field: str) -> dict:
    if not isinstance(script, str) or not script.strip() or len(script) > 200_000:
        raise ValueError(f'Invalid nonempty script: {path}:{field}')
    if '[[' in script or ']]' in script:
        raise ValueError('Embedded macOS speech control syntax prohibited')
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', name):
        raise ValueError('Unsafe media basename')
    mode, segments = split_script(script)
    return {'id': name, 'source': str(path.relative_to(ROOT)), 'sourceField': field,
            'sourceSha256': digest(raw), 'script': script,
            'scriptSha256': digest(script.encode()), 'segmentation': mode,
            'segments': segments}


def run(args: list[str]) -> str:
    result = subprocess.run(args, check=True, capture_output=True, text=True, timeout=300)
    if result.stderr.strip():
        COMMAND_WARNINGS.append({'command': args, 'stderr': result.stderr})
    return result.stdout


def probe_media(path: Path) -> dict:
    data = json.loads(run([FFPROBE, '-v', 'error', '-show_format', '-show_streams',
                           '-of', 'json', str(path)]))
    streams = [s for s in data['streams'] if s.get('codec_type') == 'audio']
    duration = float(data['format'].get('duration', 0))
    if len(streams) != 1 or duration <= 0:
        raise ValueError('Expected one nonempty audio stream')
    return {'durationSeconds': duration, 'bytes': path.stat().st_size,
            'sha256': digest(path.read_bytes()), 'codec': streams[0]['codec_name'],
            'sampleRate': streams[0]['sample_rate'], 'channels': streams[0]['channels']}


def synthesize(text: str, voice: str, rate: int, stem: Path) -> tuple[Path, dict]:
    textfile = stem.with_suffix('.txt')
    aiff = stem.with_suffix('.aiff')
    mp3 = stem.with_suffix('.mp3')
    textfile.write_text(text, encoding='utf-8')
    run([SAY, '-v', voice, '-r', str(rate), '-f', str(textfile), '-o', str(aiff)])
    probe_media(aiff)  # say can exit 0 with an empty AIFF when macOS sandbox access fails.
    run([FFMPEG, '-nostdin', '-v', 'error', '-n', '-i', str(aiff), '-ac', '1',
         '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '64k', str(mp3)])
    metadata = probe_media(mp3)
    aiff.unlink()  # Only disposable intermediate created in this invocation.
    return mp3, metadata


def voices(out: Path, rate: int) -> list[str]:
    advertised = run([SAY, '-v', '?'])
    (out / 'advertised-voices.txt').write_text(advertised)
    available = {m.group(1).strip() for line in advertised.splitlines()
                 if (m := re.match(r'^(.*?)\s+en[_-][A-Z]{2}\s', line))}
    proven = []
    failures = []
    for voice in PREFERRED:
        if voice not in available:
            continue
        try:
            _, media = synthesize('This is locally generated teacher review speech.', voice,
                                  rate, out / f'voice-probe-{voice.lower()}')
            proven.append(voice)
            (out / f'voice-probe-{voice.lower()}.json').write_text(json.dumps(media, indent=2))
        except (subprocess.SubprocessError, ValueError) as exc:
            failures.append({'voice': voice, 'error': str(exc),
                             'stderr': getattr(exc, 'stderr', None)})
        if len(proven) == 3:
            break
    (out / 'voice-probe.json').write_text(json.dumps({'proven': proven, 'failures': failures,
                                                                  'commandWarnings': COMMAND_WARNINGS}, indent=2))
    if not proven:
        raise ValueError('No advertised English voice produced playable local audio')
    return proven


def generate(items: list[dict], out: Path, rate: int, probe_only: bool) -> None:
    out.mkdir(parents=True, exist_ok=False)
    proven = voices(out, rate)
    manifest = {'schemaVersion': 1, 'purpose': 'teacher-review TTS',
                'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
                'sourceFreezeSha256': freeze_hash(items) if items else None,
                'generatorSha256': digest(Path(__file__).read_bytes()),
                'generationComplete': False, 'independentAudioQc': 'pending', 'teacherReview': 'pending',
                'naturalnessReview': 'pending', 'fullSimulatedTest': False,
                'addedQuestionPausesSeconds': 0, 'rateWordsPerMinute': rate,
                'voices': proven, 'commandWarnings': COMMAND_WARNINGS, 'tools': {'say': SAY, 'ffmpeg': FFMPEG, 'ffprobe': FFPROBE},
                'assets': []}
    if not probe_only:
        if len(items) != 10:
            raise ValueError(f'Expected six units plus four mock parts, found {len(items)}')
        for source in items:
            check_drift(items)
            directory = out / source['id']
            directory.mkdir()
            (directory / 'source-script.txt').write_text(source['script'])
            role_voices = {}
            files = []
            cursor = 0.0
            for index, segment in enumerate(source['segments']):
                check_drift(items)
                voice = role_voices.setdefault(segment['role'], proven[len(role_voices) % len(proven)])
                path, media = synthesize(segment['text'], voice, rate,
                                         directory / f'segment-{index:03}')
                segment.update({'voice': voice, 'rateWordsPerMinute': rate,
                                'textSha256': digest(segment['text'].encode()),
                                'startSeconds': cursor, 'media': media})
                cursor += media['durationSeconds']
                segment['endSeconds'] = cursor
                files.append(path)
            concat = directory / 'concat.txt'
            concat.write_text(''.join(f"file '{p.name}'\n" for p in files))
            final = directory / 'teacher-review.mp3'
            run([FFMPEG, '-nostdin', '-v', 'error', '-n', '-f', 'concat', '-safe', '1',
                 '-i', str(concat), '-c', 'copy', str(final)])
            source['media'] = probe_media(final)
            source['media']['path'] = str(final.relative_to(ROOT))
            manifest['assets'].append(source)
            (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    check_drift(items)
    manifest['generationComplete'] = True
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    catalog = {'schemaVersion': 1, 'kind': 'teacher_review_audio_catalog',
               'sourceFreezeSha256': manifest['sourceFreezeSha256'],
               'teacherReview': 'pending', 'assets': [
                   {'id': asset['id'], 'path': asset['media']['path'],
                    'sha256': asset['media']['sha256'], 'mediaType': 'audio/mpeg',
                    'sizeBytes': asset['media']['bytes'],
                    'sampleRateHz': int(asset['media']['sampleRate']),
                    'channels': asset['media']['channels'],
                    'durationSeconds': asset['media']['durationSeconds'],
                    'sourceBinding': asset['sourceBinding'],
                    'sourceFile': asset['source'],
                    'sourceFileSha256': asset['sourceSha256'],
                    'sourceRefs': asset['derivationProvenance']['sourceRefs'],
                    'sourceIndex': asset['sourceIndex']}
                   for asset in manifest['assets']]}
    (out / 'asset-catalog.json').write_text(json.dumps(catalog, indent=2) + '\n')
    print(json.dumps({'output': str(out), 'voices': proven, 'assets': len(manifest['assets'])}))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generate', action='store_true', help='Explicitly allow local synthesis and review output')
    parser.add_argument('--probe', action='store_true', help='Only synthesize short local voice probes; requires --generate')
    parser.add_argument('--run', default=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    parser.add_argument('--freeze-sha256', help='Required exact read-only sourceFreezeSha256 for final synthesis')
    parser.add_argument('--rate', type=int, default=155)
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,63}', args.run):
        parser.error('--run must be a simple new directory name')
    if not 100 <= args.rate <= 220:
        parser.error('--rate must be between 100 and 220')
    out = safe_path(OUTPUT / args.run, OUTPUT)
    if args.probe and not args.generate:
        parser.error('--probe requires --generate')
    items = [] if args.probe else sources()
    if not args.generate:
        print(json.dumps({'mode': 'read-only', 'sourceFreezeSha256': freeze_hash(items), 'scripts': [
            {k: v for k, v in source.items() if k not in ('script', 'segments', 'sourceTurns', 'derivationProvenance', 'sourceIndex')}
            | {'segments': len(source['segments'])} for source in items]}, indent=2))
        return 0
    if not args.probe and (not args.freeze_sha256 or args.freeze_sha256 != freeze_hash(items)):
        parser.error('Final generation requires --freeze-sha256 matching the read-only sourceFreezeSha256')
    generate(items, out, args.rate, args.probe)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, KeyError, OSError, subprocess.SubprocessError) as error:
        print(f'Audio generation refused or failed: {error}', file=sys.stderr)
        sys.exit(1)
