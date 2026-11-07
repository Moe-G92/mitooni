"""Server-only, explicitly configured authoring package and reviewer projections."""
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import re
from app.services.content_pipeline import load_package, digest
from app.repositories.account import AccountError


def fail(code, status=409):
    messages = {
        'review_denied': 'Reviewer access is unavailable',
        'asset_unavailable': 'Review media is unavailable',
        'range_unsupported': 'Partial media requests are unavailable',
        'content_unavailable': 'Review content is unavailable',
        'review_conflict': 'Review changed; reload before saving',
        'content_changed': 'Review content changed; reload before saving',
        'idempotency_conflict': 'Operation key was already used for different changes',
        'invalid_request': 'Review request is invalid',
        'reveal_required': 'Reveal the review material before commenting',
        'submission_frozen': 'Submitted rehearsal cannot be changed',
        'operation_limit': 'Too many review operations; try again later',
    }
    raise AccountError(code, status, messages.get(code, 'Review storage is unavailable'))


@dataclass(frozen=True)
class ReviewPackageConfiguration:
    root: Path
    package_hash: str

    def __post_init__(self):
        if not isinstance(self.root, Path) or not self.root.is_absolute() or not re.fullmatch(r'[a-f0-9]{64}', self.package_hash):
            raise ValueError('Explicit absolute review package root and canonical hash required')

    def load(self):
        try:
            package, actual = load_package(self.root)
            if actual != self.package_hash:
                fail('content_unavailable', 503)
            media = None
            if package.get('assets'):
                from app.media.registry import bind_package_assets
                media = bind_package_assets(self.root, package, actual)
            return ReviewPackage(package, actual, media_registry=media)
        except AccountError:
            raise
        except Exception:
            fail('content_unavailable', 503)


def authored_question_id(value):
    """Normalize trusted authored integers only; request contracts stay strict."""
    if type(value) is int and value > 0:
        value = str(value)
    if not isinstance(value, str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,127}', value):
        fail('content_unavailable', 503)
    return value


def question(q):
    """Known question fields only; never traverse author answer/evidence fields."""
    opts = q.get('options', [])
    if isinstance(opts, dict):
        opts = [{'id': k, 'text': v} for k, v in opts.items()]
    return dict(id=authored_question_id(q['id']), prompt=q.get('prompt', ''), responseType=q.get('responseType', q.get('type', 'short_text')),
                options=[{'id': o['id'], 'text': o['text']} for o in opts], wordLimit=q.get('wordLimit'), instructions=q.get('instructions', ''))


def empty_state():
    return dict(revision=0, draft={'answers': []}, submission=None, revealedAt=None, review=None)


class ReviewPackage:
    def __init__(self, package, package_hash, media_registry=None):
        self.package = package
        self.hash = package_hash
        self.media_registry = media_registry
        self.targets = package['units'] | {key: value for key, value in package['companions'].items()
            if value.get('kind') in {'mock', 'syllabus', 'mock_blueprint'}}

    def get(self, target_id):
        if target_id not in self.targets:
            fail('review_denied', 403)
        return self.targets[target_id]

    def title(self, target_id):
        target = self.get(target_id)
        if target.get('kind') == 'mock':
            match = re.fullmatch(r'(academic|general(?:-training)?)-(\d+)-(reading|writing|listening|speaking)', target_id)
            if match:
                track = 'Academic' if match[1] == 'academic' else 'General Training'
                return f'{track} {match[2]} · {match[3].capitalize()}'
        if target.get('kind') == 'syllabus':
            return 'IELTS Academic and General Training curriculum'
        if target.get('kind') == 'mock_blueprint':
            return 'Mock blueprint'
        return target.get('title', target_id)

    def metadata(self, target_id, state=None):
        t = self.get(target_id)
        s = state or empty_state()
        skill = t.get('skill')
        kind = 'unit' if target_id in self.package['units'] else t['kind']
        delivery = ('audio_ready' if any(a['mediaType'].startswith('audio/') for a in self.assets(target_id)) else 'audio_pending') if skill == 'listening' else 'recording_pending' if skill == 'speaking' else 'text' if kind in {'unit', 'mock'} else 'document'
        return dict(id=target_id, targetHash=digest(t), version=t['version'], kind=kind,
                    title=self.title(target_id), skill=skill, examTrack=t.get('examTrack', 'shared' if skill in {'listening', 'speaking'} else 'general_training' if target_id.startswith('general-') else 'academic' if t.get('exam') == 'ielts-academic' else None),
                    stage=t.get('stage'), pathwayIds=t.get('pathwayIds', []), deliveryStatus=delivery, revision=s['revision'],
                    revealed=s['revealedAt'] is not None, submitted=s['submission'] is not None,
                    decision=s['review']['decision'] if s['review'] else None)

    def task(self, target_id):
        t = self.get(target_id)
        sections = []
        if target_id in self.package['units']:
            stimulus = t['stimulus']
            sections.append(dict(id=t['id'], title=self.title(target_id), text=None if stimulus['kind'] == 'script' else stimulus['text'], questions=[question(q) for q in t['questions']]))
        elif t['kind'] == 'mock':
            for p in t.get('passages', []) + t.get('sections', []):
                # GT texts are explicit nested passage fields, not a recursive redaction.
                texts = p.get('texts', [])
                text = p.get('text') if not texts else '\n\n'.join(x['title'] + '\n' + x['text'] for x in texts)
                sections.append(dict(id=p['id'], title=p.get('title', p['id']), text=text, questions=[question(q) for q in p.get('questions', [])]))
            for task_number, p in enumerate(t.get('tasks', []), start=1):
                stimulus = p.get('stimulus')
                # Structured candidate table; no reviewer guidance or arbitrary fields.
                text, table = None, None
                if isinstance(stimulus, dict):
                    if 'text' in stimulus:
                        text = stimulus['text']
                    elif stimulus.get('type') == 'table':
                        columns = [{'key': x['key'], 'label': x['label']} for x in stimulus['columns']]
                        table = dict(title=stimulus.get('title', ''), description=stimulus.get('description', ''), unit=stimulus.get('unit', ''), columns=columns,
                            rows=[{x['key']: row[x['key']] for x in columns} for row in stimulus['rows']])
                prompt = p.get('prompt', '')
                if p.get('bullets'):
                    prompt += '\n' + '\n'.join(p['bullets'])
                sections.append(dict(id=p['id'], title=p.get('title') or f'Task {task_number}', text=text, table=table,
                    questions=[dict(id=p['id'], prompt=prompt, responseType='extended_text', options=[], wordLimit=None)]))
            for p in t.get('parts', []):
                if t.get('skill') == 'listening':
                    qs = [question(q) for q in p.get('questions', [])]
                    sections.append(dict(id=p['id'], title=p.get('title', p['id']), text=None, questions=qs))
                elif t.get('skill') == 'speaking':
                    # Interviewer guidance, follow-up strategy and private rubric stay private.
                    prompts = list(p.get('opening', []))
                    for topic in p.get('topicSets', []):
                        prompts.extend(topic.get('questions', []))
                    card = p.get('cueCard', {})
                    if card:
                        prompts.append(card.get('topic', card.get('prompt', '')))
                        prompts.extend(card.get('points', card.get('bulletPoints', card.get('bullets', []))))
                    if card.get('explain'):
                        prompts.append(card['explain'])
                    prompts.extend(p.get('discussionQuestions', p.get('questions', [])))
                    texts = [x if isinstance(x, str) else x.get('question', x.get('prompt', x.get('text', ''))) for x in prompts]
                    sections.append(dict(id=p['id'], title='Part ' + str(p['part']), text='\n'.join(texts),
                        questions=[dict(id=p['id'], prompt='Typed rehearsal', responseType='spoken_response', options=[], wordLimit=None)]))
        instructions = t.get('instructions', '') if sections else ''
        for section in sections:
            source = next((x for key in ('parts', 'passages', 'sections', 'tasks') for x in t.get(key, []) if x['id'] == section['id']), {})
            section['instructions'] = source.get('instructions', '')
            section['minimumWords'] = source.get('minimumWords')
            section.setdefault('table', None)
            for q in section['questions']:
                q.setdefault('instructions', '')
        identifiers = [q['id'] for section in sections for q in section['questions']]
        if len(identifiers) != len(set(identifiers)):
            fail('content_unavailable', 503)
        return dict(instructions=instructions, sections=sections, assets=self.assets(target_id))

    def assets(self, target_id):
        self.get(target_id)
        if self.media_registry is None:
            return []
        try:
            assets = self.media_registry.assets_for(target_id)
            result = []
            for asset in assets:
                if asset['mediaType'] not in {'image/png', 'audio/mpeg', 'audio/wav'}:
                    fail('content_unavailable', 503)
                # No registry paths or private annotations cross this allowlist.
                metadata = {key: asset.get(key) for key in ('id', 'kind', 'mediaType', 'sha256', 'width', 'height', 'alt')}
                from urllib.parse import quote
                metadata['alt'] = metadata['alt'] or 'Listening audio'
                metadata['url'] = ('/api/content-review/targets/' + quote(target_id, safe='') + '/assets/' + quote(asset['id'], safe='')
                    + '?packageHash=' + self.hash + '&targetHash=' + digest(self.get(target_id)))
                result.append(metadata)
            return result
        except AccountError:
            raise
        except Exception:
            fail('content_unavailable', 503)

    def asset_bytes(self, target_id, asset_id):
        self.get(target_id)
        if self.media_registry is None:
            fail('asset_unavailable', 404)
        metadata = next((a for a in self.assets(target_id) if a['id'] == asset_id), None)
        if metadata is None:
            fail('asset_unavailable', 404)
        try:
            data, checked = self.media_registry.read_asset(target_id, asset_id)
            from hashlib import sha256
            if (not isinstance(data, bytes) or not data or len(data) > 32 * 1024 * 1024
                or sha256(data).hexdigest() != metadata['sha256']
                or checked['sha256'] != metadata['sha256'] or checked['mediaType'] != metadata['mediaType']):
                fail('content_unavailable', 503)
            return data, metadata
        except AccountError:
            raise
        except Exception:
            fail('content_unavailable', 503)

    def item_ids(self, target_id):
        task = self.task(target_id)
        return {target_id} | {s['id'] for s in task['sections']} | {q['id'] for s in task['sections'] for q in s['questions']}

    def snapshot(self, target_id, state):
        t = self.get(target_id)
        metadata = self.metadata(target_id, state)
        limits = ['Teacher review only; editorial readiness does not publish learner content.', 'Blind records only that this account had not revealed this target here; exposure elsewhere is unknown.']
        if t.get('skill') == 'listening':
            limits.append('Listen to the audio before submitting. Transcripts appear only after reveal.' if metadata['deliveryStatus'] == 'audio_ready' else 'Audio is pending. Typed responses cannot establish listening ability; transcripts appear only after reveal.')
        if t.get('skill') == 'speaking':
            limits.append('Typed rehearsal cannot establish speaking ability. Recorded rehearsal availability is checked separately.')
        return dict(packageHash=self.hash, targetHash=metadata['targetHash'], target=metadata,
                    **deepcopy(state), task=self.task(target_id), privateContent=deepcopy(t) if state['revealedAt'] else None, limitations=limits)

    def apply(self, target_id, state, action, payload, now=None):
        self.get(target_id)
        if payload['packageHash'] != self.hash or payload['targetHash'] != digest(self.get(target_id)):
            fail('content_changed')
        if payload['expectedRevision'] != state['revision']:
            fail('review_conflict')
        s = deepcopy(state)
        now = now or datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        if action == 'draft':
            if s['submission']:
                fail('submission_frozen')
            allowed = {q['id'] for section in self.task(target_id)['sections'] for q in section['questions']}
            if any(a['questionId'] not in allowed for a in payload['answers']):
                fail('invalid_request', 422)
            s['draft'] = {'answers': payload['answers']}
        elif action == 'submit':
            if s['submission']:
                fail('submission_frozen')
            s['submission'] = dict(answers=deepcopy(s['draft']['answers']), submittedAt=now,
                conditions='exposed_typed_rehearsal' if s['revealedAt'] else 'blind')
        elif action == 'reveal':
            if s['revealedAt'] is None:
                s['revealedAt'] = now
        elif action == 'review':
            if not s['revealedAt']:
                fail('reveal_required')
            if any(i['itemId'] not in self.item_ids(target_id) for i in payload['itemComments']):
                fail('invalid_request', 422)
            s['review'] = {k: payload[k] for k in ('decision', 'comment', 'itemComments')}
        else:
            fail('invalid_request', 422)
        s['revision'] += 1
        return s
