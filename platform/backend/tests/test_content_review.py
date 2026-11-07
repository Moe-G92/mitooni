"""Synthetic projection/state evidence; no DB/provider calls or learner fixtures."""
from copy import deepcopy
import json
from pathlib import Path
import pytest
from pydantic import ValidationError
from app.contracts.content_review import BoundMutation, DraftIn, ReviewIn
from app.repositories.account import AccountError
from app.services.content_pipeline import digest
from app.services.content_review import ReviewPackage, ReviewPackageConfiguration, empty_state


def package():
    u=dict(id='fnd-reading-train',version=1,skill='reading',examTrack='academic',stage='train',pathwayIds=['fnd'],title='Synthetic practice',instructions='Read',stimulus={'kind':'passage','text':'Candidate passage'},questions=[dict(id='q1',prompt='Choose',responseType='single_choice',options=[dict(id='A',text='One'),dict(id='B',text='Two')],wordLimit=None)],assessment={'answerKey':'SECRET_KEY'},locale={'feedbackGuidanceFa':'SECRET_GUIDANCE'})
    return ReviewPackage(dict(manifest={'title':'Synthetic'},units={u['id']:u},companions={}), 'a'*64)


def binding(p,s=None):
    return dict(packageHash=p.hash,targetHash=digest(p.get('fnd-reading-train')),expectedRevision=(s or empty_state())['revision'])


def test_blind_projection_then_submission_reveal_and_review():
    p=package(); s=empty_state(); uid='fnd-reading-train'
    text=json.dumps(p.snapshot(uid,s))
    assert 'SECRET' not in text and 'Candidate passage' in text
    assert p.snapshot(uid,s)['privateContent'] is None
    payload=DraftIn(**binding(p),answers=[dict(questionId='q1',text='<script>inert text</script>')]).model_dump()
    s=p.apply(uid,s,'draft',payload)
    s=p.apply(uid,s,'submit',binding(p,s),now='2026-11-06T12:00:00Z')
    assert s['submission']['conditions']=='blind'
    s=p.apply(uid,s,'reveal',binding(p,s),now='2026-11-06T12:01:00Z')
    assert s['submission']['conditions']=='blind' and s['revealedAt']=='2026-11-06T12:01:00Z'
    assert 'SECRET_KEY' in json.dumps(p.snapshot(uid,s))
    s=p.apply(uid,s,'review',ReviewIn(**binding(p,s),decision='changes_needed',comment='Ambiguous',itemComments=[dict(itemId='q1',decision='changes_needed',comment='Clarify')]).model_dump())
    assert s['review']['decision']=='changes_needed'
    with pytest.raises(AccountError,match='Submitted'):
        p.apply(uid,s,'draft',DraftIn(**binding(p,s),answers=[]).model_dump())


def test_exposure_without_blind_submission_is_recorded():
    p=package(); uid='fnd-reading-train'
    s=p.apply(uid,empty_state(),'reveal',binding(p))
    s=p.apply(uid,s,'submit',binding(p,s))
    assert s['submission']['conditions']=='exposed_typed_rehearsal'


def test_conflicts_and_unknown_ids():
    p=package();uid='fnd-reading-train'
    with pytest.raises(AccountError) as e:p.apply(uid,empty_state(),'reveal',binding(p)|{'targetHash':'b'*64})
    assert e.value.code=='content_changed'
    with pytest.raises(AccountError) as e:p.apply(uid,empty_state(),'reveal',binding(p)|{'expectedRevision':1})
    assert e.value.code=='review_conflict'
    with pytest.raises(AccountError) as e:p.apply(uid,empty_state(),'draft',binding(p)|{'answers':[{'questionId':'wrong','text':''}]})
    assert e.value.status==422
    with pytest.raises(AccountError) as e:p.apply(uid,empty_state(),'review',binding(p)|{'decision':'comment','comment':'','itemComments':[]})
    assert e.value.code=='reveal_required'


@pytest.mark.parametrize('field,value',[('answers',[{'questionId':'q1','text':'x'*20001}]),('answers',[{'questionId':'q1','text':''}]*2)])
def test_input_bounds(field,value):
    with pytest.raises(ValidationError):DraftIn(**binding(package()),**{field:value})


def test_no_client_authority_and_no_approval_decision():
    with pytest.raises(ValidationError):BoundMutation(**binding(package()),role='teacher')
    with pytest.raises(ValidationError):ReviewIn(**binding(package()),decision='approved',comment='',itemComments=[])


def test_package_configuration_requires_exact_trusted_hash(monkeypatch,tmp_path):
    p=package()
    monkeypatch.setattr('app.services.content_review.load_package', lambda _: (p.package,'b'*64))
    with pytest.raises(AccountError) as e:ReviewPackageConfiguration(tmp_path,'a'*64).load()
    assert e.value.status==503
    with pytest.raises(ValueError):ReviewPackageConfiguration(Path('relative'),'a'*64)


def test_actual_companion_shapes_are_projected_without_keys_or_scripts():
    # Actual author source shapes, not package validation: other workers may be
    # updating manifest hashes. This check has no publication/teacher inference.
    root=Path(__file__).resolve().parents[3]/'content/ielts-academic/2026-11-06'
    companions={json.loads(f.read_text())['id']:json.loads(f.read_text()) for f in (root/'mocks').glob('*.json')}
    p=ReviewPackage(dict(manifest={'title':'Review'},units={},companions=companions),'a'*64)
    assert len(companions)==6
    for uid,t in companions.items():
        snapshot=p.snapshot(uid,empty_state()); serialized=json.dumps(snapshot)
        assert snapshot['task']['sections']
        assert 'teacherOnly' not in serialized and 'interviewerGuidance' not in serialized
        for section in snapshot['task']['sections']:
            for q in section['questions']:
                assert 'answer' not in q
                assert isinstance(q['id'], str)
                assert isinstance(q['instructions'], str)
        if t['skill']=='listening':
            assert all(s['text'] is None for s in snapshot['task']['sections'])
            assert t['parts'][0]['script'][0]['text'] not in serialized
        if uid=='general-01-reading':assert t['sections'][0]['texts'][0]['text'] in snapshot['task']['sections'][0]['text']
        if t['skill']=='speaking':
            assert t['parts'][1]['cueCard']['explain'] in serialized
            assert t['parts'][2]['questions'][0]['question'] in serialized


def test_actual_writing_essential_table_and_letter_points_survive_projection():
    root=Path(__file__).resolve().parents[3]/'content/ielts-academic/2026-11-06/mocks'
    for filename in ['academic-01-writing.json','general-01-writing.json']:
        t=json.loads((root/filename).read_text())
        p=ReviewPackage(dict(manifest={'title':'Review'},units={},companions={t['id']:t}),'a'*64)
        sections=p.task(t['id'])['sections']
        assert sections[0]['minimumWords']==150
        assert sections[1]['minimumWords']==250
        if filename.startswith('academic'):
            assert [section['title'] for section in sections]==['Task 1','Task 2']
            assert sections[0]['text'] is None
            assert sections[0]['table']['rows']==t['tasks'][0]['stimulus']['rows']
        else:
            for bullet in t['tasks'][0]['bullets']:
                assert bullet in sections[0]['questions'][0]['prompt']


def test_internal_graph_companions_never_become_teacher_catalog_targets():
    p=package()
    p.package['companions']={kind:dict(id=kind,kind=kind,version=1,title=kind) for kind in ['source_index','media_catalog','corpus_lineage','syllabus','mock_blueprint']}
    reviewed=ReviewPackage(p.package,p.hash)
    assert set(reviewed.targets)=={'fnd-reading-train','syllabus','mock_blueprint'}
    for hidden in ['source_index','media_catalog','corpus_lineage']:
        with pytest.raises(AccountError) as e:reviewed.get(hidden)
        assert e.value.status==403


def test_speaking_capability_comes_from_current_server_assignment_and_runtime():
    from app.repositories.postgres_content_review import PostgresContentReviewRepository
    from app.repositories.account import LocalPostgresConfig
    p=package();target=p.get('fnd-reading-train');target['skill']='speaking'
    repo=PostgresContentReviewRepository(LocalPostgresConfig(),None)
    assignment={'permissions':['review:use']}
    assert repo._snapshot(p,target['id'],empty_state(),assignment)['task']['speaking']=={'permissionGranted':False,'available':False}
    repo.speaking_available=True
    assert repo._snapshot(p,target['id'],empty_state(),assignment)['task']['speaking']['available'] is False
    assignment['permissions'].append('review:speaking-evaluate')
    assert repo._snapshot(p,target['id'],empty_state(),assignment)['task']['speaking']=={'permissionGranted':True,'available':True}
    repo.speaking_available=False
    assert repo._snapshot(p,target['id'],empty_state(),assignment)['task']['speaking']=={'permissionGranted':True,'available':False}


def test_authored_numeric_ids_normalize_in_projection_draft_and_review():
    p=package();target=p.get('fnd-reading-train');target['questions'][0]['id']=1
    assert p.task(target['id'])['sections'][0]['questions'][0]['id']=='1'
    state=p.apply(target['id'],empty_state(),'draft',DraftIn(packageHash=p.hash,targetHash=digest(target),expectedRevision=0,answers=[dict(questionId='1',text='A')]).model_dump())
    state=p.apply(target['id'],state,'submit',dict(packageHash=p.hash,targetHash=digest(target),expectedRevision=1))
    assert state['submission']['answers']==[dict(questionId='1',text='A')]
    assert '1' in p.item_ids(target['id'])
    with pytest.raises(ValidationError):DraftIn(packageHash=p.hash,targetHash=digest(target),expectedRevision=0,answers=[dict(questionId=1,text='A')])


@pytest.mark.parametrize('bad',[True,False,0,-1,1.0,None,{},[]])
def test_nonidentifier_authored_ids_rejected(bad):
    p=package();target=p.get('fnd-reading-train');target['questions'][0]['id']=bad
    with pytest.raises(AccountError) as e:p.task(target['id'])
    assert e.value.code=='content_unavailable'


def test_authored_numeric_string_semantic_collision_rejected():
    p=package();target=p.get('fnd-reading-train');target['questions'][0]['id']=1
    target['questions'].append(dict(target['questions'][0],id='1'))
    with pytest.raises(AccountError) as e:p.task(target['id'])
    assert e.value.code=='content_unavailable'


def test_primary_mock_and_document_titles_do_not_print_internal_ids_or_review_suffixes():
    p=package()
    for ident,expected in [('academic-01-listening','Academic 01 · Listening'),('general-01-reading','General Training 01 · Reading')]:
        p.package['companions'][ident]=dict(id=ident,kind='mock',version=1,title='Source-based review candidate')
    p.package['companions']['syllabus']=dict(id='syllabus',kind='syllabus',version=1,title='Curriculum — review edition')
    p.package['companions']['blueprint']=dict(id='blueprint',kind='mock_blueprint',version=1,title='Written form review blueprint')
    reviewed=ReviewPackage(p.package,p.hash)
    assert reviewed.metadata('academic-01-listening')['title']=='Academic 01 · Listening'
    assert reviewed.metadata('general-01-reading')['title']=='General Training 01 · Reading'
    assert reviewed.metadata('syllabus')['title']=='IELTS Academic and General Training curriculum'
    assert reviewed.metadata('blueprint')['title']=='Mock blueprint'
    assert p.package['companions']['academic-01-listening']['title']=='Source-based review candidate'
