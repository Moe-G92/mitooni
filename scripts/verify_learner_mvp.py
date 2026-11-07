#!/usr/bin/env python3
"""Independent real-HTTP learner checks. Local synthetic owners only; never hosted.

No repository fixtures, DB access, environment variables or answer keys are used.
Output contains identifiers/counts/assertions, never source passages or responses.
A generated tone tests recording transport only, not speech assessment validity.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import struct
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from uuid import uuid4
import wave

SKILLS = {'reading', 'listening', 'writing', 'speaking'}
FORBIDDEN = {'answerKey', 'acceptedAnswers', 'privatePath', 'sourcePath', 'apiKey', 'providerKey'}


class Failure(Exception):
    pass


class Http:
    def __init__(self, base, name, subject):
        self.base, self.name, self.subject = base.rstrip('/') + '/api/learner', name, subject
        self.calls = 0

    def request(self, method, path, body=None, *, key=None, raw=False, expected=(200, 201, 202)):
        headers = {'Authorization': 'Bearer fixture-' + self.name,
                   'X-Expected-User-Id': self.subject}
        if method != 'GET':
            headers['Idempotency-Key'] = key or str(uuid4())
        if isinstance(body, bytes):
            payload = body
            headers['Content-Type'] = 'audio/wav'
        elif body is not None:
            payload = json.dumps(body).encode()
            headers['Content-Type'] = 'application/json'
        else:
            payload = None
        self.calls += 1
        try:
            with urlopen(Request(self.base + path, data=payload, method=method, headers=headers), timeout=30) as response:
                data, status = response.read(), response.status
        except HTTPError as error:
            data, status = error.read(), error.code
        except URLError as error:
            raise Failure('HTTP unavailable: ' + str(error.reason)) from None
        if raw:
            result = data
        else:
            try:
                result = json.loads(data)
            except (ValueError, UnicodeDecodeError):
                raise Failure(f'{method} {path}: non-JSON status {status}') from None
            inspect_private(result)
        if status not in expected:
            detail = result.get('detail', result) if isinstance(result, dict) else {}
            code = detail.get('code', 'unknown') if isinstance(detail, dict) else 'invalid_detail'
            raise Failure(f'{method} {path}: HTTP {status} {code}')
        return result


def inspect_private(value):
    if isinstance(value, dict):
        bad = FORBIDDEN.intersection(value)
        if bad:
            raise Failure('private field in learner JSON: ' + ','.join(sorted(bad)))
        for item in value.values():
            inspect_private(item)
    elif isinstance(value, list):
        for item in value:
            inspect_private(item)


def check(condition, message):
    if not condition:
        raise Failure(message)


def tone(seconds=2):
    out = io.BytesIO()
    with wave.open(out, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        wav.writeframes(b''.join(struct.pack('<h', round(2000 * math.sin(2 * math.pi * 220 * i / 16000)))
                                  for i in range(16000 * seconds)))
    return out.getvalue()


class Suite:
    def __init__(self, args):
        self.args = args
        self.events = []
        self.workspaces = []
        self.clients = [Http(args.base, args.owner_a, args.subject_a), Http(args.base, args.owner_b, args.subject_b)]

    def record(self, name, run):
        if self.args.only and name not in self.args.only:
            return None
        started = time.monotonic()
        try:
            result = run()
            self.events.append({'check': name, 'status': 'passed', 'evidence': result,
                                'seconds': round(time.monotonic() - started, 3)})
            return result
        except Exception as error:
            self.events.append({'check': name, 'status': 'failed', 'error': str(error),
                                'seconds': round(time.monotonic() - started, 3)})
            return None

    def preferences(self, client, track, hours, level, priority='writing'):
        boot = client.request('GET', '/bootstrap')
        targets = {skill: 6 for skill in SKILLS}
        targets.update(overall=7)
        targets[priority] = 8
        result = client.request('PATCH', '/preferences', {
            'expectedRevision': boot['preferencesRevision'], 'examTrack': track,
            'weeklyHours': hours, 'selfReportedLevel': level, 'testDate': '2027-01-15',
            'locale': 'fa', 'targets': targets})
        check(result['examTrack'] == track and result['weeklyHours'] == hours, 'preferences failed readback')
        return result

    def plan(self, client):
        boot = client.request('GET', '/bootstrap')
        result = client.request('POST', '/plans', {
            'expectedPreferencesRevision': boot['preferencesRevision'],
            'expectedEvidenceRevision': boot['evidenceRevision']})
        check(set(s['skill'] for s in result['steps']) == SKILLS, 'plan omits one or more skills')
        check(result['preferencesRevision'] == boot['preferencesRevision'], 'plan stale preferences')
        return result

    @staticmethod
    def signature(plan):
        return [(s['skill'], s['taskId'], s['kind'], s['state']) for s in plan['steps']]

    def branch_trace(self, client, track, branch, level):
        self.preferences(client, track, 8, level)
        plan = self.plan(client)
        completed = []
        for skill in sorted(SKILLS):
            demand = {'foundation': 'fnd', 'intermediate': 'int', 'advanced': 'adv'}[branch]
            expected_id = ('gt-' if track == 'general_training' and skill in ('reading', 'writing') else '') + demand + '-' + skill + '-train'
            step = next((s for s in plan['steps'] if s['taskId'] == expected_id and s['state'] in ('available', 'in_progress', 'completed')), None)
            check(step is not None, f'{track}/{branch}/{skill} no usable plan activity')
            ws = client.request('POST', '/workspaces/resolve', {'planId': plan['id'], 'planVersion': plan['version'], 'stepId': step['id'], 'conditionPreset': 'supported'})
            check(ws['task']['examTrack'] in (track, 'shared'), 'wrong track task')
            check(ws['task']['skill'] == skill, 'wrong skill task')
            self.assets(client, ws)
            teaching = self.explain(client, ws)
            submitted = self.complete(client, ws)
            feedback = self.feedback(client, submitted)
            repair = {'status': 'not_repeated', 'reason': 'explicit source-coverage run; repair mechanics checked separately'} if self.args.skip_repair else self.repair(client, submitted)
            completed.append({'skill': skill, 'taskId': ws['task']['id'], 'workspaceId': ws['id'],
                              'itemCount': sum(len(s['questions']) for s in ws['task']['sections']),
                              'rawCheck': submitted.get('rawCheck'), 'teaching': teaching, 'feedback': feedback, 'repair': repair})
        return {'track': track, 'branchHypothesis': branch, 'planVersion': plan['version'], 'skills': completed}

    def assets(self, client, ws):
        for asset in ws['task'].get('assets', []):
            content = client.request('GET', f"/workspaces/{ws['id']}/assets/{asset['id']}", raw=True)
            check(hashlib.sha256(content).hexdigest() == asset['sha256'], 'asset SHA256 mismatch')
        if ws['task']['skill'] == 'listening':
            check(any(a['mediaType'].startswith('audio/') for a in ws['task'].get('assets', [])), 'Listening task has no playable audio')
            if ws.get('playbackPolicy') == 'one_pass':
                key = str(uuid4())
                body = {'expectedWorkspaceRevision': ws['revision']}
                path = f"/workspaces/{ws['id']}/playback/start"
                started = client.request('POST', path, body, key=key)
                replay = client.request('POST', path, body, key=key)
                marker = started['listeningPlayback']
                check(marker['startedAt'] == replay['listeningPlayback']['startedAt'] and marker['nonce'] == replay['listeningPlayback']['nonce'], 'Listening playback exact replay resets marker')
                duplicate = client.request('POST', path, {'expectedWorkspaceRevision': started['revision']})
                check(duplicate['listeningPlayback']['startedAt'] == marker['startedAt'] and duplicate['listeningPlayback']['nonce'] == marker['nonce'], 'Listening new-key start resets marker')
                restored = client.request('GET', f"/workspaces/{ws['id']}")
                check(restored['attempt']['deadlineAt'] == ws['attempt']['deadlineAt'], 'Listening start altered section deadline')
                check(restored['listeningPlayback']['startedAt'] == marker['startedAt'], 'Listening reload lost playback marker')
                check(restored['listeningPlayback']['elapsedSeconds'] >= marker['elapsedSeconds'], 'Listening elapsed clock went backwards')

    def complete(self, client, ws, override=None):
        ws = client.request('GET', f"/workspaces/{ws['id']}")
        if ws['attempt']['status'] != 'open':
            # Repeated runs must preserve frozen originals rather than reset data.
            ws = client.request('POST', f"/attempts/{ws['attempt']['id']}/revisions", {'expectedWorkspaceRevision': ws['revision']})
        responses = []
        for section in ws['task']['sections']:
            for q in section['questions']:
                kind = q['responseType']
                if kind == 'spoken_response':
                    audio = tone()
                    path = f"/attempts/{ws['attempt']['id']}/recordings?" + urlencode({'itemId': q['id'], 'expectedDraftRevision': ws['draft']['revision']})
                    rec = client.request('POST', path, audio)
                    readback = client.request('GET', f"/recordings/{rec['id']}/audio", raw=True)
                    check(hashlib.sha256(readback).hexdigest() == rec['sha256'], 'recording readback mismatch')
                    responses.append({'itemId': q['id'], 'kind': 'recording', 'value': rec['id']})
                elif kind == 'single_choice':
                    check(q.get('options'), 'choice without options')
                    responses.append({'itemId': q['id'], 'kind': 'choice', 'value': q['options'][0]['id']})
                elif kind == 'extended_text':
                    responses.append({'itemId': q['id'], 'kind': 'essay', 'value': 'Synthetic engineering response. ' * 90})
                elif kind == 'multi_select':
                    responses.append({'itemId': q['id'], 'kind': 'multi_select', 'value': [q['options'][0]['id']]})
                elif kind in ('matching', 'ordered'):
                    raise Failure('wire question type requires dedicated response fixture: ' + kind)
                else:
                    responses.append({'itemId': q['id'], 'kind': 'short_text', 'value': 'synthetic'})
        if override is not None:
            responses = override
        key = str(uuid4())
        body = {'expectedDraftRevision': ws['draft']['revision'], 'responses': responses}
        draft = client.request('PATCH', f"/workspaces/{ws['id']}/draft", body, key=key)
        replay = client.request('PATCH', f"/workspaces/{ws['id']}/draft", body, key=key)
        check(draft['draft'] == replay['draft'], 'draft idempotency mismatch')
        restored = client.request('GET', f"/workspaces/{ws['id']}")
        check(restored['draft']['responses'] == responses, 'acknowledged draft lost on reload')
        body = {'expectedWorkspaceRevision': draft['revision'], 'expectedDraftRevision': draft['draft']['revision'],
                'expectedConditionsRevision': draft['attempt']['conditions']['revision']}
        key = str(uuid4())
        result = client.request('POST', f"/attempts/{ws['attempt']['id']}/submit", body, key=key)
        replay = client.request('POST', f"/attempts/{ws['attempt']['id']}/submit", body, key=key)
        check(result['attempt']['responseHash'] == replay['attempt']['responseHash'], 'submit replay changed response hash')
        check(result['attempt']['status'] == 'submitted', 'attempt not submitted')
        check(result['attempt']['responses'] == responses, 'frozen response mismatch')
        if ws['task']['skill'] in ('reading', 'listening'):
            session = client.request('GET', f"/sessions/{ws['sessionId']}") if ws.get('sessionId') else None
            if session and session['kind'] == 'mock' and session['status'] != 'completed':
                check(result.get('rawCheck') is None, 'active mock leaks marking result')
            else:
                check(result.get('rawCheck') and result['rawCheck']['itemCount'] == len(responses), 'marking omits task items')
        self.workspaces.append((client, result))
        return result

    def poll_job(self, client, job):
        deadline = time.monotonic() + self.args.poll_seconds
        while job['status'] in ('queued', 'running', 'cancel_requested') and time.monotonic() < deadline:
            time.sleep(.25)
            job = client.request('GET', f"/jobs/{job['id']}")
        check(job['status'] == 'completed' and job.get('output'), 'AI job did not complete: ' + job['status'])
        return job

    def explain(self, client, ws):
        boot = client.request('GET', '/bootstrap')
        if not boot['providerAvailable']:
            return {'status': 'provider_unavailable', 'liveAI': False}
        if ws['attempt']['status'] != 'open':
            return {'status': 'prior_frozen_work', 'liveAI': False}
        job = client.request('POST', f"/workspaces/{ws['id']}/turns", {
            'expectedWorkspaceRevision': ws['revision'],
            'workRef': {'kind': 'draft', 'id': ws['id'], 'revision': ws['draft']['revision']},
            'intent': 'explain', 'message': 'Explain this objective, then ask me a question to check understanding.'})
        job = self.poll_job(client, job)
        output = job['output']
        check(bool(output.get('text')), 'teaching output has no explanation')
        return {'jobId': job['id'], 'kind': output.get('kind'),
                'hasCheckQuestion': bool(output.get('checkQuestion')), 'liveAI': False,
                'boundary': 'synthetic local runner, not evidence of pedagogic usefulness'}

    def feedback(self, client, ws):
        boot = client.request('GET', '/bootstrap')
        if not boot['providerAvailable']:
            error = client.request('POST', f"/attempts/{ws['attempt']['id']}/feedback",
                                   {'expectedWorkspaceRevision': ws['revision']}, expected=(503,))
            check(error['detail']['code'] == 'provider_unavailable', 'provider missing did not fail closed')
            return {'status': 'provider_unavailable', 'realAI': False}
        job = client.request('POST', f"/attempts/{ws['attempt']['id']}/feedback", {'expectedWorkspaceRevision': ws['revision']})
        deadline = time.monotonic() + self.args.poll_seconds
        while job['status'] in ('queued', 'running', 'cancel_requested') and time.monotonic() < deadline:
            time.sleep(.25)
            job = client.request('GET', f"/jobs/{job['id']}")
        check(job['status'] == 'completed' and job.get('output'), 'feedback did not reach completed output: ' + job['status'])
        return {'jobId': job['id'], 'kind': job['output'].get('kind'), 'realAI': False,
                'boundary': 'local synthetic provider plumbing only'}

    def repair(self, client, ws):
        current = client.request('GET', f"/workspaces/{ws['id']}")
        if 'attempt:revise' not in current['capabilities']:
            raise Failure('submitted work has no repair capability')
        child = client.request('POST', f"/attempts/{ws['attempt']['id']}/revisions", {'expectedWorkspaceRevision': current['revision']})
        check(child['attempt']['parentAttemptId'] == ws['attempt']['id'], 'repair lost frozen parent identity')
        check(child['attempt']['conditions']['current'] == 'supported', 'repair not supported')
        repaired = self.complete(client, child)
        check(repaired['attempt']['parentAttemptId'] == ws['attempt']['id'], 'submitted repair lost parent')
        return {'parentAttemptId': ws['attempt']['id'], 'childAttemptId': child['attempt']['id'],
                'childStatus': repaired['attempt']['status']}

    def baseline(self, client, track):
        preferences = self.preferences(client, track, 8, 6)
        session = client.request('POST', '/baselines', {'expectedPreferencesRevision': preferences['revision']})
        check(set(s['skill'] for s in session['sections']) == SKILLS, 'baseline omits skill')
        seen = []
        for _ in range(len(session['sections'])):
            session = client.request('POST', f"/sessions/{session['id']}/start", {'expectedRevision': session['revision']})
            section = next((s for s in session['sections'] if s['status'] == 'running'), None)
            check(section is not None, 'baseline did not start next section')
            ws = client.request('POST', '/workspaces/resolve', {'sessionId': session['id'], 'sectionId': section['id'], 'conditionPreset': 'supported'})
            self.assets(client, ws)
            self.complete(client, ws)
            seen.append(section['skill'])
            session = client.request('GET', f"/sessions/{session['id']}")
        check(set(seen) == SKILLS, 'baseline actual submissions omit skill')
        return {'sessionId': session['id'], 'status': session['status'], 'skillsSubmitted': seen}

    def progress(self, client):
        result = client.request('GET', '/progress')
        check(result['noBandEstimate'] is True, 'progress lacks no-band policy')
        check(set(s['skill'] for s in result['skills']) == SKILLS, 'progress omits skill')
        check(all(s['submittedCount'] > 0 for s in result['skills']), 'progress lacks actual skill submissions')
        return {'evidenceRevision': result['evidenceRevision'], 'skills': result['skills'], 'noBandEstimate': True}

    def isolation(self):
        check(self.workspaces, 'no completed workspace for isolation check')
        owner, ws = self.workspaces[0]
        other = next(c for c in self.clients if c is not owner)
        other.request('GET', f"/workspaces/{ws['id']}", expected=(404,))
        return {'foreignWorkspace': '404'}

    def profiles(self):
        plans = []
        for client, track, hours, level, priority in [(self.clients[0], 'academic', 2, 3, 'writing'),
                                                      (self.clients[1], 'general_training', 10, 8, 'reading')]:
            self.preferences(client, track, hours, level, priority)
            plans.append(self.plan(client))
        check(self.signature(plans[0]) != self.signature(plans[1]), 'different track/target/time produced identical material plan')
        check(plans[0]['weeklyCapacityMinutes'] != plans[1]['weeklyCapacityMinutes'], 'time did not alter capacity')
        return [{'capacity': p['weeklyCapacityMinutes'], 'steps': self.signature(p)} for p in plans]

    def recovery_readback(self):
        check(self.args.recovery_reference is not None, 'supply prior actual HTTP output via --recovery-reference')
        reference = json.loads(self.args.recovery_reference.read_text())
        checked = []
        for event in reference['checks']:
            evidence = event.get('evidence')
            if not isinstance(evidence, dict) or not isinstance(evidence.get('skills'), list):
                continue
            track = evidence.get('track')
            if track not in ('academic', 'general_training'):
                continue
            client = self.clients[0 if track == 'academic' else 1]
            for original in evidence['skills']:
                if not isinstance(original, dict) or 'workspaceId' not in original:
                    continue
                ws = client.request('GET', f"/workspaces/{original['workspaceId']}")
                check(ws['attempt']['status'] == 'submitted', 'prior frozen attempt status lost across restart')
                check(ws.get('rawCheck') == original['rawCheck'], 'prior raw result changed across restart')
                check(ws['task']['id'] == original['taskId'], 'prior content pin changed across restart')
                check(bool(ws['attempt']['responseHash']), 'prior frozen response hash absent')
                checked.append(original['workspaceId'])
        check(checked, 'reference contains no saved workspace evidence')
        return {'readBackFrozenWorkspaces': len(checked), 'workspaceIds': checked,
                'scope': 'prior HTTP-submitted exact pinned work/raw results survive backend-coordinated API restart'}

    def objective_counterfactual(self):
        check(self.args.correction_responses is not None, 'supply independently authored public-task responses via --correction-responses')
        fixture = json.loads(self.args.correction_responses.read_text())
        client = self.clients[1]
        self.preferences(client, fixture['examTrack'], 8, 8, 'reading')
        before = self.plan(client)
        step = next((s for s in before['steps'] if s['taskId'] == fixture['taskId']), None)
        check(step is not None, 'correction target absent from admitted plan')
        ws = client.request('POST', '/workspaces/resolve', {'planId': before['id'], 'planVersion': before['version'],
                            'stepId': step['id'], 'conditionPreset': 'supported'})
        incorrect = []
        for section in ws['task']['sections']:
            for q in section['questions']:
                if q['responseType'] == 'single_choice':
                    incorrect.append({'itemId': q['id'], 'kind': 'choice', 'value': q['options'][0]['id']})
                else:
                    incorrect.append({'itemId': q['id'], 'kind': 'short_text', 'value': 'synthetic'})
        wrong = self.complete(client, ws, incorrect)
        error_plan = self.plan(client)
        error_steps = [s for s in error_plan['steps'] if s['taskId'] == fixture['taskId']]
        check(any(s['kind'] == 'repair' and s['reasonEvidenceIds'] for s in error_steps), 'wrong actual work does not create evidenced objective repair')
        current = client.request('GET', f"/workspaces/{wrong['id']}")
        child = client.request('POST', f"/attempts/{wrong['attempt']['id']}/revisions", {'expectedWorkspaceRevision': current['revision']})
        corrected = self.complete(client, child, fixture['responses'])
        raw = corrected['rawCheck']
        check(raw and raw['correctCount'] == raw['itemCount'], 'independently authored corrected response did not achieve exact objective check')
        corrected_plan = self.plan(client)
        corrected_steps = [s for s in corrected_plan['steps'] if s['taskId'] == fixture['taskId']]
        check(all(s['kind'] != 'repair' for s in corrected_steps), 'corrected child left lifetime repair penalty')
        branches = [p.get('skillBranches') for p in (before, error_plan, corrected_plan)]
        check(branches[0] and branches[1] and branches[0]['reading'] != branches[1]['reading'], 'Reading error did not change per-skill route')
        check(all(branches[0][skill] == branches[1][skill] for skill in SKILLS - {'reading'}), 'Reading error changed unrelated skill route')
        check(corrected_plan['preferencesRevision'] == error_plan['preferencesRevision'], 'evidence comparison changed preferences')
        check(before.get('recommendedStepId') != error_plan.get('recommendedStepId'), 'actual Reading error did not change next material recommendation')
        return {'taskId': fixture['taskId'], 'wrongAttemptId': wrong['attempt']['id'],
                'correctedAttemptId': corrected['attempt']['id'], 'wrongRawCheck': wrong['rawCheck'],
                'correctedRawCheck': raw, 'skillBranchesBeforeErrorAfterCorrection': branches,
                'errorStepKinds': [s['kind'] for s in error_steps],
                'correctedStepKinds': [s['kind'] for s in corrected_steps],
                'recommendations': [p.get('recommendedStepId') for p in (before, error_plan, corrected_plan)],
                'scope': 'latest objective evidence changes per-skill route and removes stale repair; no calibrated level claim'}

    def schedule_counterfactual(self):
        client = self.clients[0]
        plans = []
        for hours in (1, 8):
            self.preferences(client, 'academic', hours, 6)
            plan = self.plan(client)
            scheduled = [(s['taskId'], s.get('scheduledDate')) for s in plan['steps'] if s.get('scheduled')]
            check(scheduled, 'positive-time plan has no scheduled work')
            check(all(day is not None for _, day in scheduled), 'scheduled activity lacks date')
            plans.append((plan, scheduled))
        check(plans[0][1] != plans[1][1], 'same profile changed hours but schedule unchanged')
        return [{'weeklyCapacityMinutes': p['weeklyCapacityMinutes'], 'scheduled': schedule}
                for p, schedule in plans]

    def beyond_eight(self):
        client = self.clients[0]
        self.preferences(client, 'academic', 8, 6)
        newly_completed = []
        plan = self.plan(client)
        completed = {s['taskId'] for s in plan['steps'] if s['state'] == 'completed'}
        for _ in range(9):
            if len(completed) > 8:
                break
            step = next((s for s in plan['steps'] if s['state'] == 'available' and s['taskId'] not in completed), None)
            check(step is not None, 'catalogue dead end before nine distinct total completions')
            ws = client.request('POST', '/workspaces/resolve', {'planId': plan['id'], 'planVersion': plan['version'],
                                'stepId': step['id'], 'conditionPreset': 'supported'})
            self.assets(client, ws)
            self.complete(client, ws)
            newly_completed.append(step['taskId'])
            plan = self.plan(client)
            completed.update(s['taskId'] for s in plan['steps'] if s['state'] == 'completed')
            completed.update(newly_completed)
        check(len(completed) > 8, 'no nine distinct activities could be submitted')
        return {'distinctCompletedActivityCount': len(completed), 'completedTaskIds': sorted(completed),
                'newlyCompletedThisCheck': newly_completed,
                'remainingAvailable': [s['taskId'] for s in plan['steps'] if s['state'] == 'available'],
                'scope': 'real persisted catalogue progression, not proof of appropriate teaching or unseen families'}

    def zero_hours(self):
        client = self.clients[0]
        self.preferences(client, 'academic', 0, 6)
        plan = self.plan(client)
        check(any(s['state'] in ('available', 'in_progress', 'completed') for s in plan['steps']), 'zero-hours candidate cannot manually choose practice')
        step = next(s for s in plan['steps'] if s['state'] in ('available', 'in_progress', 'completed'))
        ws = client.request('POST', '/workspaces/resolve', {'planId': plan['id'], 'planVersion': plan['version'],
                            'stepId': step['id'], 'conditionPreset': 'supported'})
        check(ws['task']['id'] == step['taskId'], 'manual zero-hours practice resolve mismatched')
        return {'capacity': plan['weeklyCapacityMinutes'], 'manualPracticeAvailable': True, 'workspaceId': ws['id']}

    def mocks(self, client, track):
        self.preferences(client, track, 8, 6)
        catalog = client.request('GET', '/mocks')['mocks']
        entry = next((m for m in catalog if m['examTrack'] == track and m['available']), None)
        check(entry is not None, 'no operational full mock for ' + track)
        session = client.request('POST', '/sessions', {'mockId': entry['id'], 'mockVersion': entry['version']})
        check(set(s['skill'] for s in session['sections']) == SKILLS, 'mock lacks four skills')
        check(all(s['deadlineAt'] is None for s in session['sections']), 'creating mock starts clock before admission')
        seen = []
        for _ in range(len(session['sections'])):
            session = client.request('POST', f"/sessions/{session['id']}/start", {'expectedRevision': session['revision']})
            section = next((s for s in session['sections'] if s['status'] == 'running'), None)
            check(section is not None, 'mock next section unavailable')
            check(section['deadlineAt'] is not None, 'mock has no server deadline')
            ws = client.request('POST', '/workspaces/resolve', {'sessionId': session['id'], 'sectionId': section['id'], 'conditionPreset': 'independent'})
            check(not ws['task']['teachingAnchors'], 'independent mock exposes teaching anchors')
            resumed = client.request('GET', f"/sessions/{session['id']}")
            check(next(s for s in resumed['sections'] if s['id'] == section['id'])['deadlineAt'] == section['deadlineAt'], 'reload resets deadline')
            self.assets(client, ws)
            self.complete(client, ws)
            seen.append(section['skill'])
            session = client.request('GET', f"/sessions/{session['id']}")
        for section in session['sections']:
            if section['skill'] in ('reading', 'listening'):
                saved = client.request('GET', f"/workspaces/{section['workspaceId']}")
                expected = sum(len(s['questions']) for s in saved['task']['sections'])
                check(saved.get('rawCheck') and saved['rawCheck']['itemCount'] == expected, 'completed mock marking unavailable/incomplete')
        return {'sessionId': session['id'], 'skillsSubmitted': seen, 'status': session['status'],
                'boundary': 'deadline preserved on HTTP reload; real-time expiry/restart not tested'}

    def run(self):
        self.record('different_profiles_material_time', self.profiles)
        for client, track in zip(self.clients, ('academic', 'general_training')):
            self.record(track + '_four_skill_baseline', lambda c=client, t=track: self.baseline(c, t))
        for client, track in zip(self.clients, ('academic', 'general_training')):
            for branch, level in [('foundation', 3), ('intermediate', 6), ('advanced', 8)]:
                self.record(track + '_' + branch + '_four_skill_loop',
                            lambda c=client, t=track, b=branch, l=level: self.branch_trace(c, t, b, l))
        for client, track in zip(self.clients, ('academic', 'general_training')):
            self.record(track + '_four_skill_mock', lambda c=client, t=track: self.mocks(c, t))
            self.record(track + '_real_progress', lambda c=client: self.progress(c))
        self.record('foreign_owner_denied', self.isolation)
        if self.args.recovery_reference or (self.args.only and 'prior_http_work_survives_restart' in self.args.only):
            self.record('prior_http_work_survives_restart', self.recovery_readback)
        if self.args.correction_responses or (self.args.only and 'same_profile_changed_evidence_objective_repair' in self.args.only):
            self.record('same_profile_changed_evidence_objective_repair', self.objective_counterfactual)
        self.record('same_profile_changed_time_schedule', self.schedule_counterfactual)
        self.record('progress_beyond_initial_eight', self.beyond_eight)
        self.record('zero_hours_manual_practice', self.zero_hours)
        return {'boundary': 'real loopback HTTP and isolated synthetic PostgreSQL; no live AI or speech-validity claim',
                'base': self.args.base, 'checks': self.events, 'httpCalls': sum(c.calls for c in self.clients),
                'limitations': ['No browser/UI verification', 'No paid or live provider calls',
                                'Synthetic tone is not speech', 'No clock manipulation or actual expiry wait',
                                'No server restart executed by this script', 'Teaching quality and calibrated assessment require independent provider/domain evidence'],
                'passed': all(e['status'] == 'passed' for e in self.events)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', default='http://127.0.0.1:8011')
    parser.add_argument('--owner-a', default='acceptance-a')
    parser.add_argument('--subject-a', default='00000101-0000-4000-8000-000000000000')
    parser.add_argument('--owner-b', default='acceptance-b')
    parser.add_argument('--subject-b', default='00000102-0000-4000-8000-000000000000')
    parser.add_argument('--skip-repair', action='store_true', help='Content coverage only: preserve owner recording quota; repair evidence reported separately')
    parser.add_argument('--recovery-reference', type=Path, help='Prior actual HTTP output for read-only restart comparison')
    parser.add_argument('--correction-responses', type=Path, help='Private file of independently authored responses to a public task, never a private key export')
    parser.add_argument('--only', action='append', help='Execute named check only (repeatable)')
    parser.add_argument('--poll-seconds', type=float, default=15)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    parsed = urlparse(args.base)
    if parsed.scheme != 'http' or parsed.hostname != '127.0.0.1' or parsed.port != 8011 or parsed.path not in ('', '/'):
        parser.error('Only isolated synthetic http://127.0.0.1:8011 is allowed')
    if not all(name.startswith('acceptance-') for name in (args.owner_a, args.owner_b)):
        parser.error('Use backend-provisioned acceptance-* synthetic owners only')
    result = Suite(args).run()
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(text + '\n')
    print(text)
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
