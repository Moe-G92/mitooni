"""Operator-only ciphertext handoff. No SQL, remote bootstrap or key generation.

A reviewed server operation must independently enforce its watchdog and logging
prerequisites. This helper accepts only that operation's encrypted result and
passes its validated password to the existing fixed-target Railway stdin binder.
"""
import argparse
import base64
from dataclasses import dataclass
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
from uuid import UUID

PROJECT_REF = 'syczumdwgabypxkopkpn'
ROLE = 'mitooni_api'
GPG = '/opt/homebrew/bin/gpg'
MAX_INPUT = 32768
MAX_CIPHERTEXT = 16384
MAX_PLAINTEXT = 4096
MAX_TTL = 300
MIN_BIND_TTL = 50  # Existing binder has a 45-second timeout.
OUTER_FIELDS = {'schemaVersion', 'projectRef', 'role', 'nonce', 'expiresAt', 'recipientFingerprint', 'ciphertextBase64'}
INNER_FIELDS = {'schemaVersion', 'projectRef', 'role', 'nonce', 'expiresAt', 'password'}
FAILURE = 'Credential handoff failed; do not retry this nonce'


class HandoffError(Exception):
    pass


def fail():
    raise HandoffError(FAILURE) from None


def parse_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                fail()
            result[key] = value
        return result
    def invalid(_):
        fail()
    try:
        value = json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid)
        if type(value) is not dict:
            fail()
        return value
    except HandoffError:
        raise
    except Exception:
        fail()


def utc(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', value):
        fail()
    try:
        return datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    except ValueError:
        fail()


@dataclass(frozen=True)
class Context:
    nonce: str
    expires_at: str
    encryption_fingerprint: str
    primary_fingerprint: str

    def __post_init__(self):
        try:
            nonce = UUID(self.nonce)
            if str(nonce) != self.nonce or nonce.version != 4:
                fail()
        except (ValueError, TypeError, AttributeError):
            fail()
        utc(self.expires_at)
        if any(not isinstance(f, str) or not re.fullmatch(r'[A-F0-9]{40}', f)
               for f in (self.encryption_fingerprint, self.primary_fingerprint)):
            fail()
        if self.encryption_fingerprint == self.primary_fingerprint:
            fail()  # pgcrypto-compatible signing primary + encryption subkey.

    def check_time(self, now, minimum=0):
        remaining = (utc(self.expires_at) - now).total_seconds()
        if not minimum < remaining <= MAX_TTL:
            fail()


def private_home(value):
    try:
        supplied = Path(value)
        if not supplied.is_absolute() or supplied.is_symlink():
            fail()
        home = supplied.resolve(strict=True)
        info = home.stat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o700:
            fail()
        return home
    except HandoffError:
        raise
    except Exception:
        fail()


def envelope_matches(value, fields, context):
    if (set(value) != fields or type(value.get('schemaVersion')) is not int or value['schemaVersion'] != 1
        or value.get('projectRef') != PROJECT_REF or value.get('role') != ROLE
        or value.get('nonce') != context.nonce or value.get('expiresAt') != context.expires_at):
        fail()


def ciphertext(value, context):
    envelope_matches(value, OUTER_FIELDS, context)
    if value['recipientFingerprint'] != context.encryption_fingerprint:
        fail()
    encoded = value['ciphertextBase64']
    if not isinstance(encoded, str) or not encoded or len(encoded) > 4 * ((MAX_CIPHERTEXT + 2) // 3):
        fail()
    try:
        data = base64.b64decode(encoded, validate=True)
    except Exception:
        fail()
    if not data or len(data) > MAX_CIPHERTEXT or base64.b64encode(data).decode('ascii') != encoded:
        fail()
    return data


def consume_nonce(home, context):
    # Public receipt only. An uncertain dispatch is never automatically repeated.
    # O_EXCL/O_NOFOLLOW prevents overwriting earlier receipts or following links.
    try:
        name = home / ('handoff-' + context.nonce + '.json')
        fd = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, 'w') as receipt:
            json.dump({'nonce': context.nonce, 'state': 'consumed'}, receipt)
            receipt.flush()
            os.fsync(receipt.fileno())
        # Persist the new directory entry before any uncertain external action.
        directory_fd = os.open(home, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    except Exception:
        fail()


def decrypt(data, context, home):
    args = [GPG, '--no-options', '--homedir', str(home), '--batch', '--no-tty',
            '--pinentry-mode', 'error', '--no-auto-key-retrieve', '--no-auto-key-import',
            '--quiet', '--max-output', str(MAX_PLAINTEXT), '--status-fd', '2', '--decrypt']
    try:
        result = subprocess.run(args, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                timeout=15, check=False)
        if result.returncode != 0 or not isinstance(result.stdout, bytes) or not 0 < len(result.stdout) <= MAX_PLAINTEXT or not isinstance(result.stderr, bytes) or len(result.stderr) > 65536:
            fail()
        statuses = [line.split() for line in result.stderr.decode('utf-8', errors='strict').splitlines() if line.startswith('[GNUPG:] ')]
        codes = {line[1] for line in statuses if len(line) >= 2}
        if not {'DECRYPTION_OKAY', 'GOODMDC'} <= codes or codes & {'BADMDC', 'ERRMDC', 'DECRYPTION_FAILED', 'NO_SECKEY', 'ERROR', 'FAILURE', 'NODATA', 'BAD_PASSPHRASE', 'MISSING_PASSPHRASE', 'BADARMOR', 'UNEXPECTED'}:
            fail()
        keys = [line for line in statuses if len(line) >= 2 and line[1] == 'DECRYPTION_KEY']
        if len(keys) != 1 or len(keys[0]) != 5 or keys[0][2:4] != [context.encryption_fingerprint, context.primary_fingerprint]:
            fail()
        value = parse_json(result.stdout)
        envelope_matches(value, INNER_FIELDS, context)
        if not isinstance(value['password'], str) or not re.fullmatch(r'[a-f0-9]{96}', value['password']):
            fail()
        return value['password']
    except HandoffError:
        raise
    except Exception:
        fail()


def bind_password(password, cli):
    # Reuse fixed Mitooni Railway project/environment/service + stdin transport.
    try:
        spec = importlib.util.spec_from_file_location('mitooni_credential_binding', Path(__file__).with_name('bind_runtime.py'))
        binding = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(binding)
        result = binding.bind({'MITOONI_DB_PASSWORD': password}, cli)
        if result != ['MITOONI_DB_PASSWORD']:
            fail()
    except HandoffError:
        raise
    except Exception:
        fail()


def handoff(raw, context, gnupg_home, cli, *, now=None):
    now = now or (lambda: datetime.now(timezone.utc))
    try:
        if not isinstance(raw, bytes) or len(raw) > MAX_INPUT or not isinstance(cli, str) or not Path(cli).is_absolute():
            fail()
        context.check_time(now(), minimum=MIN_BIND_TTL)
        home = private_home(gnupg_home)
        data = ciphertext(parse_json(raw), context)
        consume_nonce(home, context)
        password = decrypt(data, context, home)
        context.check_time(now(), minimum=MIN_BIND_TTL)
        try:
            bind_password(password, cli)
        finally:
            password = None  # No claim of secure erasure of Python string copies.
        context.check_time(now())
        return {'nonce': context.nonce, 'recipientFingerprint': context.encryption_fingerprint,
                'boundKeys': ['MITOONI_DB_PASSWORD'], 'deploymentTriggered': False}
    except HandoffError:
        raise
    except Exception:
        fail()


class SafeParser(argparse.ArgumentParser):
    def error(self, _message):
        fail()


def main(argv=None):
    try:
        parser = SafeParser(description='Bind a reviewed encrypted Mitooni credential; no SQL is executed.')
        parser.add_argument('--nonce', required=True)
        parser.add_argument('--expires-at', required=True)
        parser.add_argument('--encryption-fingerprint', required=True)
        parser.add_argument('--primary-fingerprint', required=True)
        parser.add_argument('--gnupg-home', required=True)
        parser.add_argument('--cli', required=True)
        args = parser.parse_args(argv)
        context = Context(args.nonce, args.expires_at, args.encryption_fingerprint, args.primary_fingerprint)
        raw = sys.stdin.buffer.read(MAX_INPUT + 1)
        result = handoff(raw, context, args.gnupg_home, args.cli)
    except Exception:
        print(FAILURE, file=sys.stderr)
        return 1
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
