"""Always-run context admission probes using synthetic private content only."""
import importlib.util
from hashlib import sha256
from pathlib import Path
import json
import shutil
import pytest
from app.contracts.learner_content import LearnerTask
from app.services.learner_content import digest

SPEC = importlib.util.spec_from_file_location('learner_context_synthetic', Path(__file__).with_name('prepare_context.py'))
context = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(context)


def fixture_catalog(root):
    root.mkdir()
    raw = b'ID3SYNTHETIC_PRIVATE_MEDIA'
    h = sha256(raw).hexdigest()
    relative = f'assets/{h}.mp3'
    (root / 'assets').mkdir()
    (root / relative).write_bytes(raw)
    asset = dict(id='synthetic-audio', path=relative, sha256=h, sizeBytes=len(raw), mediaType='audio/mpeg')
    task = LearnerTask.model_validate(dict(id='synthetic-listening',title='Synthetic practice',skill='listening',
        examTrack='academic',kind='practice',objectiveIds=['synthetic-objective'],
        sections=[dict(id='section-1',title='Section',questions=[dict(id='q1',prompt='Synthetic question',responseType='short_text')])],
        assets=[{k:asset[k] for k in ('id','sha256','mediaType')}])).model_dump()
    record = dict(task=task,metadata=dict(id=task['id'],contentHash=digest(task),version=1,role='train',
        skill=task['skill'],examTrack='academic',semanticExposureGroupIds=['synthetic-group'],familyId='synthetic-family'),
        assessment=dict(kind='deterministic',answerKey=[dict(questionId='q1',acceptedAnswers=['synthetic'])]),lineage={})
    catalog = dict(schemaVersion=1,publication=dict(scope='private_beta'),tasks=[record],assets=[asset])
    (root / 'catalog.json').write_text(json.dumps(catalog))
    return digest(catalog), relative


def fixture_code(root):
    for relative in context.CODE_FILES | {(context.DEPLOY / n).as_posix() for n in ('Dockerfile','entrypoint.py','railway.json')}:
        p = root / relative
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text('SYNTHETIC_CODE')
    shutil.copyfile(context.SOURCE_ROOT / context.DEPLOY / context.PUBLIC_CA_NAME, root / context.DEPLOY / context.PUBLIC_CA_NAME)
    for relative in ('web/src/main.tsx','platform/backend/app/main.py','platform/backend/app/corpus/private.py','web/.env','raw.sqlite'):
        p = root / relative
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text('SYNTHETIC_SENTINEL')


def test_exact_context_excludes_private_authoring_env_and_operator_binder(tmp_path):
    catalog = tmp_path / 'catalogue'; h, media = fixture_catalog(catalog)
    source = tmp_path / 'source'; fixture_code(source)
    output = tmp_path / 'context'
    context.assemble(catalog,h,output,source_root=source)
    files = {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()}
    assert 'private-learner/catalog.json' in files and 'private-learner/' + media in files
    assert not any('.env' in p or p.endswith('.sqlite') or '/corpus/' in p or 'bind_runtime' in p for p in files)
    ignore = (output / context.DEPLOY / 'Dockerfile.dockerignore').read_text().splitlines()
    assert all(not p.endswith('/') and '**' not in p for p in ignore if p.startswith('!'))


@pytest.mark.parametrize('mutation',['missing','tampered','unlisted','symlink'])
def test_invalid_private_catalogue_never_produces_context(tmp_path,mutation):
    catalog = tmp_path / 'catalogue'; h, media = fixture_catalog(catalog)
    source = tmp_path / 'source'; fixture_code(source)
    if mutation == 'missing': (catalog / media).unlink()
    elif mutation == 'tampered': (catalog / media).write_bytes(b'ID3TAMPER')
    elif mutation == 'unlisted': (catalog / 'assets' / ('0'*64 + '.png')).write_bytes(b'UNLISTED')
    else: (catalog / 'assets' / 'link.mp3').symlink_to(catalog / media)
    with pytest.raises(Exception): context.assemble(catalog,h,tmp_path / 'output',source_root=source)
    assert not (tmp_path / 'output').exists()


def test_source_changes_during_copy_never_leave_a_context(tmp_path,monkeypatch):
    catalog = tmp_path / 'catalogue'; h, _ = fixture_catalog(catalog)
    source = tmp_path / 'source'; fixture_code(source)
    real_copy = context.write_copy
    def mutate(source_file, destination):
        real_copy(source_file,destination)
        if source_file == source / 'web/src/main.tsx':
            source_file.write_text('CHANGED_DURING_COPY')
    monkeypatch.setattr(context,'write_copy',mutate)
    with pytest.raises(ValueError,match='Serving source changed'):
        context.assemble(catalog,h,tmp_path / 'output',source_root=source)
    assert not (tmp_path / 'output').exists()
