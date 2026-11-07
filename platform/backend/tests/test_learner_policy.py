"""Synthetic source-shaped keys and counterfactual candidate journeys."""
import pytest
from app.services import learner_policy as policy


@pytest.fixture(autouse=True)
def clock(monkeypatch):
    monkeypatch.setattr(policy, 'now', lambda: '2026-11-07T10:00:00+00:00')


def preferences():
    return dict(revision=1, examTrack='academic', weeklyHours=2, testDate=None,
                targets=dict(reading=6, listening=6, writing=6, speaking=6), selfReportedLevel=4)


def task(tid, skill='reading', branch='foundation', role='train', **changes):
    return dict(id=tid, title=tid, skill=skill, branch=branch, role=role,
                objectiveIds=[skill + ':detail'], familyId=tid, estimatedMinutes=20,
                durationSeconds=1200, catalogHash='catalog', version=1, contentHash=tid,
                **changes)


def fact(tid, attempt='a1', correct=0, count=2, parent=None, skill='reading', supported=False):
    return dict(id=attempt, kind='submission', taskId=tid, skill=skill,
                attemptId=attempt, parentAttemptId=parent, objectiveIds=[skill + ':detail'],
                conditions=dict(current='supported' if supported else 'independent', assisted=supported, exposureEligible=not supported),
                rawCheck=dict(itemCount=count, correctCount=correct, items=[]))


def test_entire_catalog_and_progress_beyond_eight():
    tasks = [task(f't{i:02}') for i in range(14)]
    evidence = [fact(m['id'], f'a{i}', 2) for i, m in enumerate(tasks[:9])]
    plan = policy.build_plan(preferences(), tasks, evidence)
    assert len(plan['steps']) == 14
    assert plan['recommendedStepId'] == 't09'
    assert plan['scheduledMinutes'] == 100
    assert all(not s['scheduled'] for s in plan['steps'] if s['state'] == 'completed')


def test_zero_hours_keeps_manual_practice_available():
    p = preferences(); p['weeklyHours'] = 0
    plan = policy.build_plan(p, [task('reading')], [])
    assert plan['recommendedStepId'] == 'reading'
    assert plan['steps'][0]['state'] == 'available'
    assert plan['steps'][0]['scheduled'] is False
    assert plan['steps'][0]['scheduledDate'] is None


def test_latest_child_repair_clears_error_and_independent_advances_only_its_skill():
    tasks = [task('original'), task('repair'), task('transfer', role='transfer'), task('advanced', branch='intermediate'), task('listening', skill='listening')]
    errors = [fact('original')]
    before = policy.build_plan(preferences(), tasks, errors)
    assert next(s for s in before['steps'] if s['id'] == 'repair')['kind'] == 'repair'
    repaired = errors + [fact('original', 'a2', 2, parent='a1', supported=True)]
    after = policy.build_plan(preferences(), tasks, repaired)
    assert after['recommendedStepId'] == 'transfer'
    assert all(s['kind'] != 'repair' for s in after['steps'])
    independent = repaired + [fact('original', 'a3', 2, parent='a2')]
    final = policy.build_plan(preferences(), tasks, independent)
    assert final['recommendedStepId'] == 'advanced'
    assert final['skillBranches']['reading'] == 'intermediate'
    assert final['skillBranches']['listening'] == 'foundation'
    assert policy.build_plan(preferences(), tasks, independent[::-1])['skillBranches']['reading'] == 'intermediate'


def test_track_targets_time_and_date_change_real_selection_and_schedule():
    tasks = [task('reading', examTrack='academic'), task('writing', skill='writing', examTrack='academic'), task('gt', examTrack='general_training')]
    p = preferences(); p['targets']['writing'] = 8
    assert policy.build_plan(p, tasks, [])['recommendedStepId'] == 'writing'
    p['examTrack'] = 'general_training'
    assert [s['id'] for s in policy.build_plan(p, tasks, [])['steps']] == ['gt']
    tasks = [task(f't{i}') for i in range(20)]
    p = preferences(); p['weeklyHours'] = 1; p['testDate'] = '2026-11-08'
    soon = policy.build_plan(p, tasks, [])
    p['testDate'] = '2026-11-21'
    later = policy.build_plan(p, tasks, [])
    assert soon['scheduledMinutes'] == 0
    assert later['scheduledMinutes'] == 120
    assert all(s['scheduledDate'] < p['testDate'] for s in later['steps'] if s['scheduled'])
    p['weeklyHours'] = 2
    assert policy.build_plan(p, tasks, [])['scheduledMinutes'] == 240


def test_prerequisites_and_unavailable_are_distinct_from_time_budget():
    tasks = [task('a'), task('b', prerequisites=['a']), task('c', available=False)]
    first = policy.build_plan(preferences(), tasks, [])
    assert {s['id']: s['state'] for s in first['steps']} == dict(a='available', b='locked', c='unavailable')
    second = policy.build_plan(preferences(), tasks, [fact('a', correct=2)])
    assert next(s for s in second['steps'] if s['id'] == 'b')['state'] == 'available'


def test_ai_observations_cannot_change_objective_progression():
    tasks = [task('foundation'), task('advanced', branch='advanced')]
    plan = policy.build_plan(preferences(), tasks, [dict(id='ai', kind='ai_observation', skill='reading', score=9)])
    assert plan['skillBranches']['reading'] == 'foundation'


def test_scalar_multiselect_ordered_matching_and_omissions():
    assessment = dict(kind='deterministic', answerKey=[
        dict(questionId='text', acceptedAnswers=['New York']),
        dict(questionId='multi', acceptedAnswers=['A', 'B']),
        dict(questionId='ordered', acceptedAnswers=[['A', 'B']]),
        dict(questionId='match', acceptedAnswers=[{'one': 'B', 'two': 'A'}]),
        dict(questionId='missing', acceptedAnswers=['yes']),
    ])
    responses = [dict(itemId='text', kind='short_text', value=' NEW   YORK '),
                 dict(itemId='multi', kind='multi_select', value=['B', 'A']),
                 dict(itemId='ordered', kind='ordered', value=['B', 'A']),
                 dict(itemId='match', kind='matching', value={'two': 'A', 'one': 'B'})]
    check = policy.mark(responses, assessment)
    assert check['itemCount'] == 5 and check['correctCount'] == 3
    assert policy.mark(responses, assessment, [dict(id='text', wordLimit=1)])['correctCount'] == 2
    responses[1]['value'] = ['A', 'A']
    assert policy.mark(responses, assessment)['correctCount'] == 2
    assert policy.mark([], dict(kind='qualitative')) is None


def test_source_unordered_slots_do_not_double_count_repeated_answer():
    assessment = dict(kind='deterministic', answerKey=[dict(questionId=q, acceptedAnswers=['B', 'C']) for q in ['q1', 'q2']],
                      answerGroups=[dict(questionIds=['q1', 'q2'], acceptedAnswers=['B', 'C'], orderIndependent=True, distinct=True)])
    responses = [dict(itemId=q, kind='choice', value='B') for q in ['q1', 'q2']]
    assert policy.mark(responses, assessment)['correctCount'] == 1
    responses[1]['value'] = 'C'
    assert policy.mark(responses, assessment)['correctCount'] == 2
    responses[0]['value'] = 'C'; responses[1]['value'] = 'B'
    assert policy.mark(responses, assessment)['correctCount'] == 2


def test_group_alternative_matching_finds_maximum_not_greedy_assignment():
    assessment = dict(kind='deterministic', answerKey=[dict(questionId=q, acceptedAnswers=['A', 'B']) for q in ['q1', 'q2']],
                      answerGroups=[dict(questionIds=['q1', 'q2'], acceptedAnswers=[['A', 'B'], ['A']], orderIndependent=True, distinct=True)])
    responses = [dict(itemId='q1', kind='choice', value='A'), dict(itemId='q2', kind='choice', value='B')]
    assert policy.mark(responses, assessment)['correctCount'] == 2


def test_later_unrelated_attempt_supersedes_older_repair():
    tasks = [task('original'), task('other'), task('repair'), task('advanced', branch='intermediate')]
    evidence = [fact('original'), fact('original', 'a2', 2, parent='a1'), fact('other', 'a3', 0)]
    plan = policy.build_plan(preferences(), tasks, evidence)
    assert plan['skillBranches']['reading'] == 'foundation'
    assert next(s for s in plan['steps'] if s['id'] == 'repair')['kind'] == 'repair'


def test_indivisible_long_activity_does_not_overfill_one_week():
    p = preferences(); p['weeklyHours'] = 1; p['testDate'] = '2026-11-21'
    long_task = task('long'); long_task['estimatedMinutes'] = 90
    plan = policy.build_plan(p, [long_task, task('short')], [])
    assert next(s for s in plan['steps'] if s['id'] == 'long')['scheduled'] is False
    assert next(s for s in plan['steps'] if s['id'] == 'long')['state'] == 'available'
    assert plan['scheduledMinutes'] == 20


def test_latest_failed_train_reopens_for_child_then_success_closes_repair():
    tasks = [task('only-train'), task('transfer', role='transfer'), task('writing', skill='writing')]
    failed = [fact('only-train', 'a1', 0)]
    plan = policy.build_plan(preferences(), tasks, failed)
    repair = next(s for s in plan['steps'] if s['id'] == 'only-train')
    assert plan['recommendedStepId'] == 'only-train'
    assert repair['state'] == 'available' and repair['kind'] == 'repair'
    assert repair['scheduled'] is True
    failed.append(fact('only-train', 'a2', 1, parent='a1', supported=True))
    repeated = policy.build_plan(preferences(), tasks, failed)
    assert repeated['recommendedStepId'] == 'only-train'
    failed.append(fact('only-train', 'a3', 2, parent='a2', supported=True))
    repaired = policy.build_plan(preferences(), tasks, failed)
    closed = next(s for s in repaired['steps'] if s['id'] == 'only-train')
    assert repaired['recommendedStepId'] == 'transfer'
    assert closed['state'] == 'completed' and closed['scheduled'] is False
    assert closed['kind'] != 'repair'
