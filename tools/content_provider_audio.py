#!/usr/bin/env python3
"""Prepare private, one-off tts-1-hd replacement. No key/env/network in default mode."""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import logging
import os
from pathlib import Path
import re
import sqlite3
import stat
import sys
import time
import content_review_audio as local

MODEL = 'tts-1-hd'
DEADLINE = '2027-01-06'
VOICES = ('onyx', 'nova', 'echo')
PRICE_MICRO_USD_PER_BYTE = 30  # $30/1M characters, UTF-8 bytes conservatively reserved.
PRICE_URL = 'https://developers.openai.com/api/docs/pricing'
MAX_BYTES = 64 * 1024 * 1024
BASE_MANIFEST = local.OUTPUT / 'source-reviewed-01/manifest.json'
BASE_SHA = '690a7187770e9b498653ac799ae9d5f006e0dc1df3cd6a3ab100397c5c3233c6'


def install_sdk_log_boundary() -> None:
    """Reuse app/providers/agents_runner.py namespace suppression, before handlers."""
    previous = logging.getLogRecordFactory()
    if getattr(previous, '_mitooni_sdk_boundary', False):
        return
    def factory(*args, **kwargs):
        record = previous(*args, **kwargs)
        if record.name.split('.')[0] in {'openai', 'httpx', 'httpcore'}:
            record.msg = 'SDK diagnostic suppressed'
            record.args = ()
            record.exc_info = None
            record.exc_text = None
            record.stack_info = None
        return record
    factory._mitooni_sdk_boundary = True
    logging.setLogRecordFactory(factory)


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def sha(value: object) -> str:
    return hashlib.sha256(canonical(value)).hexdigest()


def fresh() -> None:
    if dt.datetime.now(dt.timezone.utc).date().isoformat() >= DEADLINE:
        raise ValueError('Model shutdown reached; re-research and explicitly version a new plan')


def plan() -> dict:
    fresh()
    raw = local.safe_path(BASE_MANIFEST, local.OUTPUT).read_bytes()
    if local.digest(raw) != BASE_SHA:
        raise ValueError('Preserved engineering manifest changed')
    previous = json.loads(raw)
    current = local.sources()
    old = {asset['id']: asset for asset in previous['assets']}
    requests = []
    for asset in current:
        prior = old[asset['id']]
        if asset['sourceBinding'] != prior['sourceBinding']:
            raise ValueError('Script value differs from the source-reviewed frozen edition')
        if [s['text'] for s in asset['segments']] != [s['text'] for s in prior['segments']]:
            raise ValueError('Utterance extraction changed')
        roles = {}
        for number, segment in enumerate(asset['segments']):
            voice = roles.setdefault(segment['role'], VOICES[len(roles) % len(VOICES)])
            body = {'model': MODEL, 'voice': voice, 'input': segment['text'],
                    'response_format': 'wav', 'speed': 1.0}
            request = {'assetId': asset['id'], 'segment': number, 'role': segment['role'],
                       'body': body, 'sourceBinding': asset['sourceBinding'],
                       'reservedMicroUsd': len(segment['text'].encode()) * PRICE_MICRO_USD_PER_BYTE}
            request['requestHash'] = sha(request)
            requests.append(request)
    if len(requests) != 138 or sum(len(r['body']['input']) for r in requests) != 43652:
        raise ValueError('Expected exact 138 utterances / 43652 characters')
    local.check_drift(current)
    return {'schemaVersion': 1, 'kind': 'provider_audio_plan', 'purpose': 'teacher-review AI-generated audio',
            'model': MODEL, 'helperSha256': local.digest(Path(__file__).read_bytes()), 'executeBefore': DEADLINE, 'maxSdkRetries': 0,
            'pricing': {'url': PRICE_URL, 'verifiedDate': '2026-11-07',
                        'usdPerMillionCharacters': 30, 'reservation': 'UTF-8-byte upper envelope'},
            'oldEngineeringManifestSha256': BASE_SHA, 'sourceFreezeSha256': local.freeze_hash(current),
            'assets': current, 'requests': requests,
            'maximumModelUsageMicroUsd': sum(r['reservedMicroUsd'] for r in requests),
            'proposedCapMicroUsd': 2_000_000,
            'excludedFromCap': 'taxes and unrelated account activity',
            'teacherAudioQc': 'pending', 'commercialClearance': 'accountable-human decision pending'}


def run_dir(name: str) -> Path:
    if not re.fullmatch(r'provider-[A-Za-z0-9_-]{1,54}', name):
        raise ValueError('Run name must start provider- and contain only letters, numbers, dash or underscore')
    return local.safe_path(local.OUTPUT / name, local.OUTPUT)


def write_new(path: Path, value: object) -> None:
    local.safe_path(path,local.OUTPUT)
    with path.open('xb') as file:
        file.write(canonical(value) + b'\n')
        file.flush()
        os.fsync(file.fileno())


class Ledger:
    """Global CAS: even another run cannot silently resend the same request."""
    def __init__(self, path: Path):
        self.db = sqlite3.connect(path, timeout=1, isolation_level=None)
        self.db.execute('PRAGMA synchronous=FULL')
        self.db.execute('CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, plan TEXT, approval TEXT, cap INTEGER, reserved INTEGER DEFAULT 0)')
        self.db.execute('CREATE TABLE IF NOT EXISTS requests (hash TEXT PRIMARY KEY, run TEXT, state TEXT, reserved INTEGER, receipt TEXT)')

    def register(self, name: str, digest: str, approval: str, cap: int) -> None:
        self.db.execute('INSERT OR IGNORE INTO runs(id,plan,approval,cap) VALUES(?,?,?,?)', (name,digest,approval,cap))
        if self.db.execute('SELECT plan,approval,cap FROM runs WHERE id=?',(name,)).fetchone() != (digest,approval,cap):
            raise ValueError('Existing run approval/plan/budget differs')

    def claim(self, request: dict, name: str) -> None:
        expected = {k:v for k,v in request.items() if k != 'requestHash'}
        if request['requestHash'] != sha(expected):
            raise ValueError('Request hash mismatch')
        amount = request['reservedMicroUsd']
        if type(amount) is not int or amount <= 0 or amount != len(request['body']['input'].encode()) * PRICE_MICRO_USD_PER_BYTE:
            raise ValueError('Invalid request reservation')
        self.db.execute('BEGIN IMMEDIATE')
        try:
            if self.db.execute('SELECT state FROM requests WHERE hash=?',(request['requestHash'],)).fetchone():
                raise ValueError('Already dispatched or unknown: no automatic resend, including across runs')
            row = self.db.execute('SELECT cap,reserved FROM runs WHERE id=?',(name,)).fetchone()
            amount = request['reservedMicroUsd']
            if not row or row[1] + amount > row[0]:
                raise ValueError('Budget admission refused')
            self.db.execute('UPDATE runs SET reserved=reserved+? WHERE id=?',(amount,name))
            self.db.execute('INSERT INTO requests VALUES(?,?,?,?,NULL)',(request['requestHash'],name,'in_flight',amount))
            self.db.execute('COMMIT')  # FULL durability before provider invocation.
        except BaseException:
            self.db.execute('ROLLBACK')
            raise

    def finish(self, request: dict, state: str, receipt: dict) -> None:
        changed = self.db.execute('UPDATE requests SET state=?,receipt=? WHERE hash=? AND state=?',
                                  (state,canonical(receipt).decode(),request['requestHash'],'in_flight')).rowcount
        if changed != 1:
            raise ValueError('Receipt CAS failed')

    def state(self, request: dict):
        return self.db.execute('SELECT state,receipt FROM requests WHERE hash=?',(request['requestHash'],)).fetchone()


def obtain(sdk, request: dict, out: Path, ledger: Ledger, name: str) -> dict:
    """SDK must be explicitly injected; never constructed or discovered here."""
    install_sdk_log_boundary()
    existing = ledger.state(request)
    if existing:
        if existing[0] != 'completed':
            raise ValueError('In-flight/unknown/invalid outcome: reconcile receipt/account; never resend automatically')
        receipt = json.loads(existing[1])
        for field in ('wav','mp3'):
            media = receipt[field]
            path = local.safe_path(local.ROOT / media['path'], local.OUTPUT)
            if local.digest(path.read_bytes()) != media['sha256']:
                raise ValueError('Completed receipt media changed; cannot resend')
        return receipt
    local.safe_path(out,local.OUTPUT)
    out.mkdir(parents=True, exist_ok=False)
    write_new(out / 'request.json',request)
    client = sdk.with_options(max_retries=0, timeout=120.0)
    ledger.claim(request,name)
    receipt = {'requestHash': request['requestHash'], 'state': 'unknown',
               'reservedMicroUsd': request['reservedMicroUsd'],
               'requestedModel': MODEL, 'providerReturnedModel': 'not supplied by Speech API',
               'spokenFidelity': 'unverified; no provider transcript', 'teacherReview': 'pending'}
    try:
        started = time.monotonic()
        wav = local.safe_path(out / 'speech.wav',local.OUTPUT)
        with client.audio.speech.with_streaming_response.create(**request['body']) as response:
            mime = response.headers.get('content-type','').split(';')[0].strip().lower()
            request_id = response.headers.get('x-request-id')
            receipt.update({'providerRequestId': request_id, 'responseMime': mime})
            if mime not in ('audio/wav','audio/x-wav','audio/wave') or not request_id:
                raise ValueError('Expected WAV MIME and provider request-ID receipt')
            size = 0
            with wav.open('xb') as file:
                for chunk in response.iter_bytes():
                    if time.monotonic() - started > 120:
                        raise ValueError('Provider stream deadline exceeded')
                    if not isinstance(chunk,bytes):
                        raise ValueError('Non-byte provider chunk')
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise ValueError('Provider media byte bound exceeded')
                    file.write(chunk)
                file.flush()
                os.fsync(file.fileno())
        if time.monotonic() - started > 120:
            raise ValueError('Provider stream deadline exceeded')
        with wav.open('rb') as file:
            signature = file.read(12)
        if signature[:4] != b'RIFF' or signature[8:12] != b'WAVE':
            raise ValueError('Invalid WAV signature')
        measured = local.probe_media(wav)
        if measured['sampleRate'] != '24000' or measured['channels'] != 1 or measured['durationSeconds'] > 600:
            raise ValueError('Unexpected sample format or duration')
        measured['path'] = str(wav.relative_to(local.ROOT))
        mp3 = out / 'speech.mp3'
        local.run([local.FFMPEG,'-nostdin','-v','error','-xerror','-n','-i',str(wav),'-ac','1','-ar','24000',
                   '-codec:a','libmp3lame','-b:a','64k',str(mp3)])
        local.run([local.FFMPEG,'-nostdin','-v','error','-xerror','-i',str(mp3),'-f','null','-'])
        compressed = local.probe_media(mp3)
        compressed['path'] = str(mp3.relative_to(local.ROOT))
        receipt.update({'state':'completed','wav':measured,'mp3':compressed})
        write_new(out / 'receipt.json',receipt)
        ledger.finish(request,'completed',receipt)
        return receipt
    except BaseException as error:
        # Never persist exception messages: provider errors can echo credentials or inputs.
        receipt['state'] = 'unknown'
        receipt['errorType'] = type(error).__name__
        ledger.finish(request,'unknown',receipt)
        if not (out / 'unknown.json').exists():
            write_new(out / 'unknown.json',receipt)
        raise ValueError('Provider attempt outcome unknown/invalid; reservation retained; no automatic retry') from None


def execute(sdk, prepared: dict, directory: Path, approval: str, cap: int) -> None:
    fresh()
    # Rebuild against actual frozen sources; never trust a modified plan JSON to choose model/rate/text.
    if canonical(prepared) != canonical(plan()):
        raise ValueError('Prepared plan/source drift')
    if not approval.strip() or len(approval)>200 or cap != 2_000_000:
        raise ValueError('Explicit approval reference and exact proposed $2 cap required')
    lock = local.safe_path(local.OUTPUT / 'provider-ledger-v1.sqlite3',local.OUTPUT)
    ledger = Ledger(lock)
    ledger.register(directory.name,sha(prepared),approval,cap)
    receipts = {}
    for request in prepared['requests']:
        local.check_drift(prepared['assets'])
        out = directory / request['assetId'] / f"turn-{request['segment']:03}"
        receipts[request['requestHash']] = obtain(sdk,request,out,ledger,directory.name)
    local.check_drift(prepared['assets'])
    manifest = {'schemaVersion':1,'purpose':'teacher-review AI-generated audio','generationComplete':False,
                'provider':'OpenAI','requestedModel':MODEL,'planSha256':sha(prepared),'approvalReference':approval,
                'sourceFreezeSha256':prepared['sourceFreezeSha256'],'teacherReview':'pending',
                'independentAudioQc':'pending','naturalnessReview':'pending','fullSimulatedTest':False,'assets':[]}
    for asset in prepared['assets']:
        directory_asset = local.safe_path(directory / asset['id'],local.OUTPUT)
        selected = [r for r in prepared['requests'] if r['assetId']==asset['id']]
        paths = [local.ROOT / receipts[r['requestHash']]['mp3']['path'] for r in selected]
        concat = directory_asset / 'concat.txt'
        expected_concat = ''.join(f"file '{p.relative_to(directory_asset)}'\n" for p in paths)
        local.safe_path(concat,local.OUTPUT)
        if concat.exists() and concat.read_text() != expected_concat:
            raise ValueError('Concat plan changed')
        if not concat.exists():
            with concat.open('x') as file:
                file.write(expected_concat)
        final = local.safe_path(directory_asset / 'teacher-review.mp3',local.OUTPUT)
        final_receipt = local.safe_path(directory_asset / 'final-receipt.json',local.OUTPUT)
        if final.exists():
            if not final_receipt.exists() or local.digest(final.read_bytes()) != json.loads(final_receipt.read_bytes())['sha256']:
                raise ValueError('Unreceipted/tampered final media; local recovery required, do not resend provider requests')
        if not final.exists():
            local.run([local.FFMPEG,'-nostdin','-v','error','-n','-f','concat','-safe','1','-i',str(concat),'-c','copy',str(final)])
        asset['media'] = local.probe_media(final)
        if not final_receipt.exists():
            write_new(final_receipt,asset['media'])
        asset['media']['path'] = str(final.relative_to(local.ROOT))
        cursor = 0.0
        for segment,request in zip(asset['segments'],selected):
            receipt = receipts[request['requestHash']]
            segment.update({'voice':request['body']['voice'],'startSeconds':cursor,'providerReceipt':receipt})
            cursor += receipt['mp3']['durationSeconds']
            segment['endSeconds'] = cursor
        manifest['assets'].append(asset)
    local.check_drift(prepared['assets'])
    manifest['generationComplete'] = True
    write_new(directory / 'manifest.json',manifest)
    catalog = {'schemaVersion':1,'kind':'teacher_review_audio_catalog','sourceFreezeSha256':prepared['sourceFreezeSha256'],
               'teacherReview':'pending','assets':[]}
    for asset in manifest['assets']:
        media = asset['media']
        catalog['assets'].append({'id':asset['id'],'path':media['path'],'sha256':media['sha256'],'mediaType':'audio/mpeg',
                                  'sizeBytes':media['bytes'],'sampleRateHz':int(media['sampleRate']),'channels':media['channels'],
                                  'durationSeconds':media['durationSeconds'],'sourceBinding':asset['sourceBinding'],
                                  'sourceFile':asset['source'],'sourceFileSha256':asset['sourceSha256'],
                                  'sourceRefs':asset['derivationProvenance']['sourceRefs'],'sourceIndex':asset['sourceIndex']})
    write_new(directory / 'asset-catalog.json',catalog)


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run',default='provider-replacement-01')
    parser.add_argument('--prepare',action='store_true')
    parser.add_argument('--execute',action='store_true')
    parser.add_argument('--approved-plan-sha256')
    parser.add_argument('--approval-ref')
    parser.add_argument('--budget-usd',choices=['2.00'])
    parser.add_argument('--credential-fd',type=int)
    args=parser.parse_args()
    directory=run_dir(args.run)
    if args.prepare and args.execute:
        parser.error('Prepare and execute are separate checkpoints')
    if args.execute:
        if not (args.approved_plan_sha256 and args.approval_ref and args.budget_usd and args.credential_fd==0):
            parser.error('Execution requires approved plan hash, approval reference, $2.00 budget and credential FD0')
        prepared=json.loads(local.safe_path(directory/'plan.json',local.OUTPUT).read_bytes())
        if sha(prepared)!=args.approved_plan_sha256 or canonical(prepared)!=canonical(plan()):
            parser.error('Approved plan hash/source mismatch')
        # Read only an explicitly supplied private pipe; never env/default credentials or a tty.
        if not stat.S_ISFIFO(os.fstat(0).st_mode):
            parser.error('Credential FD0 must be a private pipe, not terminal/file input')
        key=sys.stdin.buffer.read(513).strip()
        if not key or len(key)>512:
            parser.error('Credential pipe must contain one bounded API key')
        install_sdk_log_boundary()
        import httpx
        from openai import OpenAI
        transport=httpx.Client(trust_env=False,follow_redirects=False,timeout=120.0)
        client=OpenAI(api_key=key.decode('ascii'),organization='',project='',webhook_secret='',base_url='https://api.openai.com/v1',
                      max_retries=0,timeout=120.0,http_client=transport)
        del key
        try: execute(client,prepared,directory,args.approval_ref,2_000_000)
        finally: client.close()
        print(json.dumps({'run':str(directory),'status':'completed; teacher QA pending'}))
        return
    prepared=plan()
    if args.prepare:
        directory.mkdir(parents=True,exist_ok=False)
        write_new(directory/'plan.json',prepared)
    print(json.dumps({'mode':'prepared' if args.prepare else 'read-only','planSha256':sha(prepared),
                      'requests':len(prepared['requests']),'characters':sum(len(r['body']['input']) for r in prepared['requests']),
                      'reservedUsd':prepared['maximumModelUsageMicroUsd']/1_000_000,
                      'proposedCapUsd':2,'executeBefore':DEADLINE,'run':str(directory)},indent=2))


if __name__=='__main__':
    try: main()
    except Exception as error:
        # No SDK exception or credential-bearing repr is printed.
        print(f'Replacement refused or stopped ({type(error).__name__}); inspect private local receipts',file=sys.stderr)
        sys.exit(1)
