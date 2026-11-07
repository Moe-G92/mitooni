from copy import deepcopy
import json
from pathlib import Path
import base64
import pytest
from pydantic import ValidationError
from app.contracts.learner_content import LearnerTask
from app.services.learner_content import LearnerCatalog, canonical, digest


def fixture(tmp_path, *, skill='reading'):
    task=dict(id='task-one',title='Read and answer',skill=skill,examTrack='academic' if skill=='reading' else 'shared',kind='reading_items',sections=[dict(id='one',title='One',text='The train leaves at noon.',instructions='Choose one.',questions=[dict(id='q1',prompt='When?',responseType='single_choice',options=[dict(id='A',text='Noon'),dict(id='B',text='One')],wordLimit=None,minimumWords=None)],table=None,assetIds=[])],assets=[],teachingAnchors=[dict(id='detail',label='Find detail',text='Find the stated time.')],objectiveIds=['reading-detail'])
    record=dict(task=task,metadata=dict(id=task['id'],title=task['title'],skill=skill,examTrack=task['examTrack'],branch='foundation',role='train',version=1,contentHash=digest(task),familyId='family-one',semanticExposureGroupIds=['meaning-one'],objectiveIds=['reading-detail'],estimatedMinutes=10,available=True),assessment=dict(kind='deterministic',answerKey=[dict(questionId='q1',acceptedAnswers=['A'],rationale='PRIVATE rationale canary')],criteria=[dict(id='accuracy',label='Accuracy',description='Practice accuracy')],feedbackGuidance='PRIVATE feedback canary'),lineage=dict(sourcePath='PRIVATE/source.pdf',privateScript='PRIVATE transcript canary'))
    value=dict(schemaVersion=1,publication=dict(scope='private_beta'),tasks=[record],assets=[])
    return value


def save(tmp_path, value):
    (tmp_path/'catalog.json').write_bytes(canonical(value))
    return LearnerCatalog(tmp_path, digest(value))


def test_projection_never_returns_private_fields(tmp_path):
    value=fixture(tmp_path);catalog=save(tmp_path,value)
    public=json.dumps(catalog.get_task('task-one'))
    assert 'PRIVATE' not in public and 'answerKey' not in public and 'sourcePath' not in public
    assert catalog.assessment('task-one')['answerKey'][0]['acceptedAnswers']==['A']
    projected=catalog.get_task('task-one');projected['sections'][0]['questions'][0]['prompt']='changed'
    assert catalog.get_task('task-one')['sections'][0]['questions'][0]['prompt']=='When?'
    assert catalog.list_tasks('academic','foundation','train')[0]['catalogHash']==catalog.catalog_hash
    assert not catalog.list_tasks('general_training','foundation')


def test_changed_private_key_changes_catalog_attestation_not_public_hash(tmp_path):
    value=fixture(tmp_path);first=digest(value);pub=value['tasks'][0]['metadata']['contentHash']
    value['tasks'][0]['assessment']['answerKey'][0]['acceptedAnswers']=['B']
    assert digest(value)!=first and value['tasks'][0]['metadata']['contentHash']==pub


@pytest.mark.parametrize('change', ['hash','missing-key','duplicate-key','wrong-key','missing-groups','duplicate-task','script-public','unsafe-table','listening-no-audio','wrong-track'])
def test_invalid_catalog_fails_closed(tmp_path,change):
    v=fixture(tmp_path);r=v['tasks'][0]
    if change=='hash':r['metadata']['contentHash']='0'*64
    elif change=='missing-key':r['assessment']['answerKey']=[]
    elif change=='duplicate-key':r['assessment']['answerKey']*=2
    elif change=='wrong-key':r['assessment']['answerKey'][0]['questionId']='other'
    elif change=='missing-groups':r['metadata']['semanticExposureGroupIds']=[]
    elif change=='duplicate-task':v['tasks'].append(deepcopy(r))
    elif change=='script-public':r['task']['privateScript']='secret'
    elif change=='unsafe-table':r['task']['sections'][0]['table']={'answerKey':'secret'}
    elif change=='listening-no-audio':r['task']['skill']='listening';r['metadata']['skill']='listening';r['task']['examTrack']='shared';r['metadata']['examTrack']='shared';r['metadata']['contentHash']=digest(r['task'])
    elif change=='wrong-track':r['metadata']['examTrack']='general_training'
    with pytest.raises((ValueError,ValidationError)):save(tmp_path,v)


def test_public_table_accepts_only_named_scalar_columns(tmp_path):
    value=fixture(tmp_path);table=dict(title='Times',description='',unit='hours',columns=[dict(key='time',label='Time')],rows=[dict(time=12)])
    value['tasks'][0]['task']['sections'][0]['table']=table
    task=LearnerTask.model_validate(value['tasks'][0]['task'])
    assert task.sections[0].table.rows==[{'time':12}]
    table['rows'][0]['answerKey']='private'
    with pytest.raises(ValidationError):LearnerTask.model_validate(value['tasks'][0]['task'])


def test_exact_inventory_rejects_extra_and_symlinks(tmp_path):
    value=fixture(tmp_path);save(tmp_path,value)
    (tmp_path/'raw-book.pdf').write_text('never serve')
    with pytest.raises(ValueError,match='inventory'):LearnerCatalog(tmp_path)
    (tmp_path/'raw-book.pdf').unlink();(tmp_path/'extra').mkdir()
    with pytest.raises(ValueError,match='directory'):LearnerCatalog(tmp_path)
    (tmp_path/'extra').rmdir();(tmp_path/'link').symlink_to(tmp_path/'catalog.json')
    with pytest.raises(ValueError,match='symlink'):LearnerCatalog(tmp_path)


def test_asset_hash_path_binding_and_recheck(tmp_path):
    from hashlib import sha256
    value=fixture(tmp_path)
    raw=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC1kAAAAASUVORK5CYII=')
    h=sha256(raw).hexdigest();(tmp_path/'assets').mkdir();path=tmp_path/'assets'/f'{h}.png';path.write_bytes(raw)
    a=dict(id='image',sha256=h,mediaType='image/png',path=f'assets/{h}.png',sizeBytes=len(raw));value['assets']=[a]
    r=value['tasks'][0];r['task']['assets']=[dict(id='image',sha256=h,mediaType='image/png',alt='A single dot.',durationSeconds=None)];r['task']['sections'][0]['assetIds']=['image'];r['metadata']['contentHash']=digest(r['task'])
    catalog=save(tmp_path,value)
    assert catalog.asset('image','task-one')['path']==path
    with pytest.raises(KeyError):catalog.asset('image','not-the-task')
    path.write_bytes(raw+b'changed')
    with pytest.raises(ValueError,match='size'):catalog.asset('image','task-one')


def test_unavailable_listening_not_listed_or_returned(tmp_path):
    value=fixture(tmp_path,skill='listening');value['tasks'][0]['metadata']['available']=False
    catalog=save(tmp_path,value)
    assert catalog.list_tasks()==[]
    with pytest.raises(ValueError,match='unavailable'):catalog.get_task('task-one')


def test_publication_and_expected_hash_required_to_match(tmp_path):
    v=fixture(tmp_path);save(tmp_path,v)
    with pytest.raises(ValueError,match='hash'):LearnerCatalog(tmp_path,'0'*64)
    v['publication']['scope']='public'
    with pytest.raises(ValueError,match='private'):save(tmp_path,v)
