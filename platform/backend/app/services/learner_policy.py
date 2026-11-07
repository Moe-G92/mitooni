"""Pure candidate policy. Objective observations are facts, never band estimates."""
from datetime import date, datetime, timedelta, timezone
from hashlib import sha256
import json
import math
import unicodedata
from uuid import uuid4
from app.repositories.account import AccountError

SKILLS = ('reading', 'listening', 'writing', 'speaking')
BRANCHES = ('foundation', 'intermediate', 'advanced')


def uid(): return str(uuid4())
def now(): return datetime.now(timezone.utc).isoformat()
def digest(v): return sha256(json.dumps(v, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
def fail(code, status=409):
    messages = {'access_required': 'Learner access is required', 'revision_conflict': 'This work changed. Reload before saving.', 'content_gap': 'This activity is unavailable. Choose another activity.', 'provider_unavailable': 'AI feedback is unavailable. Your work is saved.', 'content_withdrawn': 'This material is no longer available. Your responses are saved.', 'deadline_passed': 'Time has ended. Your acknowledged answers are saved.', 'budget_exhausted': 'AI usage is unavailable. Your work is saved.'}
    raise AccountError(code, status, messages.get(code, 'This action is unavailable. Reload and try again.'))


def expect(a, b):
    if a != b: fail('revision_conflict')


def branch(p):
    level = p.get('selfReportedLevel')
    return 'foundation' if level is None or level < 5 else 'intermediate' if level < 7 else 'advanced'


def ref(m):
    return {k: m[k] for k in ('catalogHash', 'version', 'contentHash')} | {'taskId': m['id'], 'policyVersion': 1}


def normal(v):
    return ' '.join(unicodedata.normalize('NFKC', str(v)).strip().casefold().split())


def _canonical_answer(value, unordered=False):
    if isinstance(value, dict):
        return tuple(sorted((normal(k), _canonical_answer(v)) for k, v in value.items()))
    if isinstance(value, list):
        values = tuple(_canonical_answer(x) for x in value)
        return tuple(sorted(values, key=repr)) if unordered else values
    return normal(value)


def mark(responses, assessment, questions=None):
    """Mark every keyed item, including omissions; keys never leave this function.

    Structured acceptedAnswers are alternative complete responses. Flat multi-select
    keys describe the required set; duplicate selections cannot earn extra credit.
    Grouped source slots consume each accepted answer at most once when distinct.
    """
    if assessment.get('kind') != 'deterministic': return None
    values = {x['itemId']: x for x in responses}
    question_map = {q['id']: q for q in (questions or [])}
    items = []
    for key in assessment.get('answerKey', []):
        qid = key['questionId']
        response = values.get(qid, {})
        value = response.get('value', '')
        kind = response.get('kind')
        accepted = key.get('acceptedAnswers', [])
        unordered = kind == 'multi_select' or key.get('orderIndependent', False)
        alternatives = accepted
        if kind == 'multi_select' and accepted and all(not isinstance(a, (dict, list)) for a in accepted):
            alternatives = [accepted]
        correct = bool(value) and any(_canonical_answer(value, unordered) == _canonical_answer(a, unordered) for a in alternatives)
        if kind == 'multi_select' and isinstance(value, list):
            correct = correct and len({_canonical_answer(a) for a in value}) == len(value)
        word_limit = question_map.get(qid, {}).get('wordLimit', key.get('wordLimit'))
        if isinstance(word_limit, int) and isinstance(value, str):
            correct = correct and len(value.split()) <= word_limit
        items.append({'itemId': qid, 'correct': bool(correct)})
    if not items: fail('content_gap', 503)
    item_map = {item['itemId']: item for item in items}
    for group in assessment.get('answerGroups', []):
        ids = group['questionIds']
        accepted = group.get('acceptedAnswers', [])
        # Each scalar is one source answer; nested lists provide spelling alternatives.
        slots = [{normal(a) for a in answer} if isinstance(answer, list) else {normal(answer)} for answer in accepted]
        matches = {}
        seen = set()
        answers = {}
        for index, qid in enumerate(ids):
            if qid not in item_map: continue
            response = values.get(qid, {}).get('value', '')
            answer = normal(response) if not isinstance(response, (dict, list)) else ''
            limit = question_map.get(qid, {}).get('wordLimit')
            valid = bool(answer) and (not isinstance(limit, int) or len(str(response).split()) <= limit)
            if group.get('distinct') and answer in seen: valid = False
            if valid: seen.add(answer)
            answers[qid] = answer if valid else ''
            item_map[qid]['correct'] = False

        def assign(qid, visited):
            position = ids.index(qid)
            for slot_index, alternatives in enumerate(slots):
                if not group.get('orderIndependent') and slot_index != position: continue
                if slot_index in visited or not answers[qid] or answers[qid] not in alternatives: continue
                visited.add(slot_index)
                if slot_index not in matches or assign(matches[slot_index], visited):
                    matches[slot_index] = qid
                    return True
            return False

        for qid in answers:
            if group.get('distinct'):
                assign(qid, set())
            else:
                position = ids.index(qid)
                candidates = slots if group.get('orderIndependent') else slots[position:position + 1]
                item_map[qid]['correct'] = bool(answers[qid]) and any(answers[qid] in slot for slot in candidates)
        if group.get('distinct'):
            for qid in matches.values(): item_map[qid]['correct'] = True
    return {'actorKind': 'deterministic_check', 'itemCount': len(items), 'correctCount': sum(x['correct'] for x in items), 'items': items}


def _objective_facts(evidence, by_id):
    """Latest submitted observation per objective; descendants supersede ancestors.

    Evidence is persisted in append order. AI prose never changes deterministic
    progression. A supported repair clears a past error but does not prove transfer.
    """
    latest = {}
    submissions = [e for e in evidence if e.get('kind') == 'submission']
    by_attempt = {e['attemptId']: e for e in submissions if e.get('attemptId')}

    def descends_from(child, ancestor):
        target = ancestor.get('attemptId')
        parent = child.get('parentAttemptId')
        visited = set()
        while parent and parent not in visited:
            if parent == target: return True
            visited.add(parent)
            parent = by_attempt.get(parent, {}).get('parentAttemptId')
        return False

    for fact in submissions:
        raw = fact.get('rawCheck')
        if not raw or not raw.get('itemCount'): continue
        task = by_id.get(fact.get('taskId'), {})
        objectives = fact.get('objectiveIds') or task.get('objectiveIds') or [f"skill:{fact['skill']}"]
        for objective in objectives:
            previous = latest.get((fact['skill'], objective))
            if previous is None or not descends_from(previous, fact):
                latest[(fact['skill'], objective)] = fact
    return latest, submissions


def _independent(fact):
    conditions = fact.get('conditions') or {}
    if isinstance(conditions, str): return conditions == 'independent'
    return conditions.get('current') == 'independent' and not conditions.get('assisted', False) and conditions.get('exposureEligible', True)


def build_plan(preferences, metadata, evidence, version=1):
    """Rank the entire admitted track; schedule independently of manual availability.

    Teacher branch mappings define progression: errors retain that branch for repair;
    a fully correct independent check prioritizes its next mapped branch. This is a
    content routing decision, not a mastery threshold or an estimated IELTS band.
    """
    created_at = now()
    today = datetime.fromisoformat(created_at.replace('Z', '+00:00')).date()
    test_date = date.fromisoformat(preferences['testDate'][:10]) if preferences.get('testDate') else None
    horizon = max(0, (test_date - today).days) if test_date else 7
    capacity = max(0, preferences['weeklyHours'] * 60)
    admitted = [m for m in metadata if m.get('examTrack', preferences['examTrack']) in {preferences['examTrack'], 'shared'} and m.get('role') != 'mock']
    by_id = {m['id']: m for m in admitted}
    latest, submissions = _objective_facts(evidence, by_id)
    completed = {e['taskId'] for e in submissions}
    skill_branches = {}
    for skill in SKILLS:
        observations = [fact for (s, _), fact in latest.items() if s == skill]
        available_branches = [b for b in BRANCHES if any(m['skill'] == skill and m.get('branch') == b for m in admitted)]
        selected = branch(preferences)
        if observations:
            errors = [f for f in observations if f['rawCheck']['correctCount'] < f['rawCheck']['itemCount']]
            fact = errors[-1] if errors else observations[-1]
            mapped = by_id.get(fact.get('taskId'), {}).get('branch', selected)
            if mapped not in BRANCHES: mapped = selected
            selected = mapped
            if not errors and _independent(fact) and mapped in available_branches:
                selected = available_branches[min(available_branches.index(mapped) + 1, len(available_branches) - 1)]
        skill_branches[skill] = selected

    def relevant(m):
        objectives = set(m.get('objectiveIds', []))
        return [fact for (skill, objective), fact in latest.items() if skill == m['skill'] and (not objectives or objective in objectives or objective == f'skill:{skill}')]

    def needs_repair(m):
        return m.get('role') == 'train' and any(
            f.get('taskId') == m['id'] and f['rawCheck']['correctCount'] < f['rawCheck']['itemCount']
            for f in relevant(m)
        )

    def priority(m):
        facts = relevant(m)
        errors = any(f['rawCheck']['correctCount'] < f['rawCheck']['itemCount'] for f in facts)
        supported_success = bool(facts) and not errors and any(not _independent(f) for f in facts)
        preferred_role = 'train' if errors or not facts else 'transfer' if supported_success else 'train'
        return (m['id'] in completed and not needs_repair(m), not m.get('available', True), not errors, m.get('branch') != skill_branches[m['skill']], m.get('role') != preferred_role, -preferences['targets'][m['skill']], SKILLS.index(m['skill']), m['id'])

    used = 0
    week_used = [0] * math.ceil(horizon / 7)
    week_capacities = [capacity * min(7, horizon - week * 7) / 7 for week in range(len(week_used))]
    steps = []
    for m in sorted(admitted, key=priority):
        minutes = max(1, math.ceil(m.get('estimatedMinutes') or (m.get('durationSeconds') or 1200) / 60))
        prerequisites = m.get('prerequisites') or []
        state = 'unavailable' if not m.get('available', True) else 'completed' if m['id'] in completed and not needs_repair(m) else 'locked' if any(p not in completed for p in prerequisites) else 'available'
        week = next((i for i, budget in enumerate(week_capacities) if week_used[i] + minutes <= budget), None) if state == 'available' else None
        scheduled = week is not None
        scheduled_date = None
        if scheduled:
            scheduled_date = (today + timedelta(days=week * 7 + int(week_used[week] * 7 / capacity))).isoformat()
            week_used[week] += minutes
            used += minutes
        facts = relevant(m)
        errors = any(f['rawCheck']['correctCount'] < f['rawCheck']['itemCount'] for f in facts)
        steps.append({'id': m['id'], 'kind': 'repair' if errors and m.get('role') == 'train' else 'transfer' if m.get('role') == 'transfer' else 'lesson', 'skill': m['skill'], 'title': m['title'], 'taskId': m['id'], 'contentRef': ref(m), 'objectiveIds': m.get('objectiveIds', []), 'estimatedMinutes': minutes, 'state': state, 'reasonEvidenceIds': list(dict.fromkeys(f['id'] for f in facts)), 'scheduled': scheduled, 'scheduledDate': scheduled_date})
    if not steps: fail('content_gap', 503)
    recommended = next((s['id'] for s in steps if s['state'] == 'available'), None)
    return {'id': uid(), 'version': version, 'status': 'active' if capacity and horizon else 'needs_attention', 'preferencesRevision': preferences['revision'], 'evidenceRevision': len(evidence), 'policyVersion': 1, 'weeklyCapacityMinutes': capacity, 'planningHorizonDays': horizon, 'scheduledMinutes': used, 'unscheduledMinutes': sum(s['estimatedMinutes'] for s in steps if s['state'] == 'available' and not s['scheduled']), 'recommendedStepId': recommended, 'skillBranches': skill_branches, 'steps': steps, 'createdAt': created_at}
