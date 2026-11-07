"""Synthetic-only cipher handoff tests; no keys, passwords or remote calls created."""
import base64
from datetime import datetime, timedelta, timezone
import importlib.util
import io
import json
from pathlib import Path
from types import SimpleNamespace
import sys
from uuid import uuid4
import pytest

spec = importlib.util.spec_from_file_location('bootstrap_credential', Path(__file__).with_name('bootstrap_credential.py'))
handoff = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = handoff
spec.loader.exec_module(handoff)
NOW = datetime(2026, 11, 7, 1, 0, 0, tzinfo=timezone.utc)
PASSWORD = 'c' * 96  # Clearly synthetic marker, never an actual generated password.
ENCRYPTION = 'A' * 40
PRIMARY = 'B' * 40


def time_text(value):
    return value.strftime('%Y-%m-%dT%H:%M:%SZ')


@pytest.fixture
def fixture(tmp_path, monkeypatch):
    home = tmp_path / 'isolated-gnupg'
    home.mkdir(mode=0o700)
    context = handoff.Context(str(uuid4()), time_text(NOW + timedelta(seconds=90)), ENCRYPTION, PRIMARY)
    inner = dict(schemaVersion=1, projectRef=handoff.PROJECT_REF, role=handoff.ROLE, nonce=context.nonce,
                 expiresAt=context.expires_at, password=PASSWORD)
    outer = {key: value for key, value in inner.items() if key != 'password'}
    outer.update(recipientFingerprint=ENCRYPTION, ciphertextBase64=base64.b64encode(b'SYNTHETIC-CIPHERTEXT').decode())
    status = f'[GNUPG:] DECRYPTION_KEY {ENCRYPTION} {PRIMARY} u\n[GNUPG:] DECRYPTION_OKAY\n[GNUPG:] GOODMDC\n'.encode()
    state = dict(inner=inner, outer=outer, status=status, returncode=0, calls=[])
    def run(args, **kwargs):
        state['calls'].append((args, kwargs))
        if args[0] == handoff.GPG:
            return SimpleNamespace(returncode=state['returncode'], stdout=state.get('plaintext', json.dumps(state['inner']).encode()), stderr=state['status'])
        assert args[0] == '/synthetic/railway'
        return SimpleNamespace(returncode=state.get('bind_code', 0), stdout=PASSWORD, stderr=PASSWORD)
    monkeypatch.setattr(handoff.subprocess, 'run', run)
    state.update(home=home, context=context)
    return state


def invoke(f, *, now=lambda: NOW):
    return handoff.handoff(json.dumps(f['outer']).encode(), f['context'], f['home'], '/synthetic/railway', now=now)


def test_password_appears_only_in_fixed_railway_stdin_never_args_files_or_output(fixture,capsys):
    f=fixture
    result=invoke(f)
    assert result['boundKeys']==['MITOONI_DB_PASSWORD'] and result['deploymentTriggered'] is False
    assert len(f['calls'])==2
    gpg,gpg_options=f['calls'][0]
    assert gpg[0]==handoff.GPG and '--no-options' in gpg and '--no-auto-key-retrieve' in gpg
    assert gpg[gpg.index('--max-output')+1]=='4096' and gpg_options['timeout']==15
    assert gpg_options['input']==b'SYNTHETIC-CIPHERTEXT'
    railway,railway_options=f['calls'][1]
    assert '--stdin' in railway and '--skip-deploys' in railway
    assert railway_options['input']==PASSWORD and railway_options['timeout']==45
    assert PASSWORD not in repr(gpg) and PASSWORD not in repr(railway)
    receipt=list(f['home'].iterdir())
    assert len(receipt)==1 and receipt[0].stat().st_mode & 0o777 == 0o600
    assert PASSWORD not in receipt[0].read_text() and PASSWORD not in json.dumps(result)
    assert PASSWORD not in str(capsys.readouterr())


@pytest.mark.parametrize('key,value',[
    ('projectRef','another-project'),('role','postgres'),('nonce',str(uuid4())),
    ('expiresAt','2026-11-07T01:03:00Z'),('recipientFingerprint','D'*40),('schemaVersion',True),
    ('extra','unexpected'),('ciphertextBase64','not base64'),('ciphertextBase64','YQ==\n')])
def test_wrong_outer_context_or_format_fails_before_decryption(fixture,key,value):
    f=fixture;f['outer'][key]=value
    with pytest.raises(handoff.HandoffError):invoke(f)
    assert not f['calls']


@pytest.mark.parametrize('key,value',[
    ('projectRef','another-project'),('role','postgres'),('nonce',str(uuid4())),
    ('expiresAt','2026-11-07T01:03:00Z'),('schemaVersion',True),('extra','unexpected'),
    ('password','D'*96),('password','c'*95),('password',None)])
def test_wrong_decrypted_context_never_reaches_provider(fixture,key,value):
    f=fixture;f['inner'][key]=value
    with pytest.raises(handoff.HandoffError) as error:invoke(f)
    assert PASSWORD not in str(error.value) and len(f['calls'])==1


@pytest.mark.parametrize('status',[
    b'[GNUPG:] DECRYPTION_OKAY\n',
    f'[GNUPG:] DECRYPTION_KEY {"D"*40} {PRIMARY} u\n[GNUPG:] GOODMDC\n[GNUPG:] DECRYPTION_OKAY\n'.encode(),
    f'[GNUPG:] DECRYPTION_KEY {ENCRYPTION} {"D"*40} u\n[GNUPG:] GOODMDC\n[GNUPG:] DECRYPTION_OKAY\n'.encode(),
    f'[GNUPG:] DECRYPTION_KEY {ENCRYPTION} {PRIMARY} u\n[GNUPG:] GOODMDC\n[GNUPG:] DECRYPTION_OKAY\n[GNUPG:] BADMDC\n'.encode(),
    b'\xff',
])
def test_missing_wrong_or_corrupt_gpg_status_rejected(fixture,status):
    fixture['status']=status
    with pytest.raises(handoff.HandoffError):invoke(fixture)
    assert len(fixture['calls'])==1


@pytest.mark.parametrize('offset',[-1,0,45,301])
def test_expiry_future_extension_and_insufficient_binding_budget_rejected(fixture,offset):
    f=fixture
    f['context']=handoff.Context(f['context'].nonce,time_text(NOW+timedelta(seconds=offset)),ENCRYPTION,PRIMARY)
    f['outer']['expiresAt']=f['context'].expires_at
    with pytest.raises(handoff.HandoffError):invoke(f)
    assert not f['calls']


def test_expiry_checked_again_after_decryption(fixture):
    times=iter([NOW,NOW+timedelta(seconds=60)])
    with pytest.raises(handoff.HandoffError):invoke(fixture,now=lambda:next(times))
    assert len(fixture['calls'])==1


def test_uncertain_provider_failure_is_sanitized_and_nonce_cannot_replay(fixture):
    f=fixture;f['bind_code']=1
    with pytest.raises(handoff.HandoffError) as error:invoke(f)
    assert str(error.value)==handoff.FAILURE and PASSWORD not in str(error.value)
    f['bind_code']=0
    with pytest.raises(handoff.HandoffError):invoke(f)
    assert len(f['calls'])==2


def test_private_home_mode_and_symlink_rejected(fixture,tmp_path):
    f=fixture;f['home'].chmod(0o755)
    with pytest.raises(handoff.HandoffError):invoke(f)
    f['home'].chmod(0o700)
    link=tmp_path/'alias';link.symlink_to(f['home'],target_is_directory=True);f['home']=link
    with pytest.raises(handoff.HandoffError):invoke(f)
    assert not f['calls']


def test_bounded_input_plaintext_and_duplicate_json(fixture):
    f=fixture
    for raw in [b'x'*(handoff.MAX_INPUT+1),json.dumps(f['outer']).encode()[:-1]+b',"role":"mitooni_api"}']:
        with pytest.raises(handoff.HandoffError):handoff.handoff(raw,f['context'],f['home'],'/synthetic/railway',now=lambda:NOW)
    assert not f['calls']
    f['plaintext']=b'x'*(handoff.MAX_PLAINTEXT+1)
    with pytest.raises(handoff.HandoffError):invoke(f)
    assert len(f['calls'])==1


def test_gpg_timeout_does_not_echo_sensitive_subprocess_fields(fixture,monkeypatch):
    def run(*args,**kwargs):raise handoff.subprocess.TimeoutExpired(['gpg'],15,output=PASSWORD,stderr=PASSWORD)
    monkeypatch.setattr(handoff.subprocess,'run',run)
    with pytest.raises(handoff.HandoffError) as error:invoke(fixture)
    assert str(error.value)==handoff.FAILURE and PASSWORD not in str(error.value)


def test_cli_parser_error_cannot_echo_unknown_secret_argument(capsys):
    assert handoff.main(['--unexpected-secret',PASSWORD])==1
    output=capsys.readouterr()
    assert PASSWORD not in output.out+output.err and output.err.strip()==handoff.FAILURE


def test_directory_fsync_failure_blocks_decryption_and_binding_and_retains_marker(fixture,monkeypatch):
    f=fixture
    real_fsync=handoff.os.fsync
    synced=[]
    def fsync(fd):
        import stat
        is_directory=stat.S_ISDIR(handoff.os.fstat(fd).st_mode)
        synced.append(is_directory)
        if is_directory:
            raise OSError(PASSWORD)
        real_fsync(fd)
    monkeypatch.setattr(handoff.os,'fsync',fsync)
    with pytest.raises(handoff.HandoffError) as error:invoke(f)
    assert str(error.value)==handoff.FAILURE and PASSWORD not in str(error.value)
    assert synced==[False,True] and not f['calls']
    receipts=list(f['home'].glob('handoff-*.json'))
    assert len(receipts)==1 and json.loads(receipts[0].read_text())=={'nonce':f['context'].nonce,'state':'consumed'}
    assert PASSWORD not in receipts[0].read_text()
