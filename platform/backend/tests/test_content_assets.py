"""Static editorial safeguards for the original Academic 01 review candidates.

These inspect source artifacts directly, without runtime validators, providers or DB.
They establish structural/evidence integrity, not teacher approval or calibration.
"""
import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3] / 'content' / 'ielts-academic' / '2026-11-06' / 'mocks'


def asset(skill):
    return json.loads((ROOT / f'academic-01-{skill}.json').read_text())


def words(text):
    # IELTS treats a hyphenated word as one word; paragraph letters are excluded.
    return re.findall(r"[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*", text)


@pytest.mark.parametrize('skill', ['reading', 'listening', 'writing', 'speaking'])
def test_candidates_cannot_claim_human_approval_or_operational_readiness(skill):
    data = asset(skill)
    assert data['skill'] == skill
    assert data['schemaVersion'] == 1
    assert data['teacherReview']['status'] == 'pending'
    assert data['delivery']['status'] not in {'ready', 'published', 'approved', 'live'}
    assert data['provenance']


def check_questions(questions, text, *, reading=True):
    for q in questions:
        assert q['prompt'].strip() and q['instructions'].strip()
        answer = q['answer']
        assert answer['evidenceQuote'].strip() in text, q['id']
        assert answer['rationale'].strip(), q['id']
        accepted = answer['acceptedAnswers']
        assert accepted and len(accepted) == len(set(accepted)), q['id']
        options = {o['id'] for o in q['options']}
        if q['type'] == 'true_false_not_given':
            assert set(accepted) <= {'TRUE', 'FALSE', 'NOT GIVEN'}
            assert 'information' in q['instructions']
        elif q['type'] == 'yes_no_not_given':
            assert set(accepted) <= {'YES', 'NO', 'NOT GIVEN'}
            assert 'writer' in q['instructions']
        elif options:
            assert set(accepted) <= options
        else:
            assert isinstance(q['wordLimit'], int) and q['wordLimit'] > 0
            for a in accepted:
                assert len(a.split()) <= q['wordLimit'], (q['id'], a)
                if reading:
                    assert a.casefold() in text.casefold(), (q['id'], a)


def test_reading_has_full_length_and_supported_markable_items():
    data = asset('reading')
    assert data['durationMinutes'] == 60
    passages = data['passages']
    assert len(passages) == 3
    total = sum(len(words(re.sub(r'(?m)^[A-G]$', '', p['text']))) for p in passages)
    assert 2150 <= total <= 2750
    assert [q['id'] for p in passages for q in p['questions']] == list(range(1, 41))
    for p in passages:
        check_questions(p['questions'], p['text'])
        headings = [q for q in p['questions'] if q['type'] == 'matching_headings']
        if headings:
            assert len(headings[0]['options']) > len(headings)
            keys = [q['answer']['acceptedAnswers'][0] for q in headings]
            assert len(keys) == len(set(keys))
    qs = {q['id']: q for p in passages for q in p['questions']}
    assert qs[3]['answer']['acceptedAnswers'] == ['NOT GIVEN']
    assert qs[30]['answer']['acceptedAnswers'] == ['NOT GIVEN']


def test_writing_supplies_complete_table_and_two_weighted_tasks():
    data = asset('writing')
    assert data['timing']['totalSeconds'] == 3600
    one, two = data['tasks']
    assert [one['minimumWords'], two['minimumWords']] == [150, 250]
    assert [one['weight'], two['weight']] == [1, 2]
    table = one['stimulus']
    assert table['type'] == 'table' and table['unit'] == 'people'
    # Independently transcribed from Mindset3 PDF17 visual graph, not derived
    # from the candidate's teacher analysis. Counts must not become percentages.
    columns = table['columns']
    assert [c['label'] for c in columns[1:]] == ['1990', '2000', '2010']
    observed = {row['reason']: [row[c['key']] for c in columns[1:]] for row in table['rows']}
    assert observed == {
        'Rising cost of living': [65000, 85000, 80000],
        'Traffic': [20000, 35000, 60000],
        'Lifestyle': [20000, 30000, 40000],
    }
    assert one['prompt'].strip() and two['prompt'].strip()
    assert data['delivery']['playable'] is False
    assert data['delivery']['runtimeSupported'] is False


def test_speaking_requires_real_interaction_and_audio_evidence():
    data = asset('speaking')
    assert [p['part'] for p in data['parts']] == [1, 2, 3]
    assert data['timing']['minimumTotalSeconds'] == 660
    assert data['timing']['maximumTotalSeconds'] == 840
    long_turn = data['timing']['parts'][1]
    assert long_turn['preparationSeconds'] == 60
    assert long_turn['maximumLongTurnSeconds'] == 120
    assert len(data['parts'][1]['cueCard']['points']) == 3
    assert data['parts'][1]['cueCard']['explain']
    assert data['parts'][2]['questions']
    assert data['delivery']['interaction'] == 'responsive_interviewer_required'
    assert data['delivery']['recordingRequired'] is True
    assert data['delivery']['playable'] is False
    assert data['delivery']['runtimeSupported'] is False
    assert 'pronunciation' in data['teacherOnly']['rubric']['criteria']
    assert data['teacherOnly']['interviewerPolicy']['noTeachingDuringIndependentAttempt'] is True


def test_listening_has_ordered_script_evidence_and_no_fake_audio_readiness():
    data = asset('listening')
    assert len(data['parts']) == 4
    assert [q['id'] for p in data['parts'] for q in p['questions']] == list(range(1, 41))
    for part in data['parts']:
        assert len(part['questions']) == 10
        text = '\n'.join(turn['text'] for turn in part['script'])
        check_questions(part['questions'], text, reading=False)
        positions = [text.index(q['answer']['evidenceQuote']) for q in part['questions']]
        assert positions == sorted(set(positions))
        speaker_ids = {s['id'] for s in part['speakers']}
        assert all(t['speakerId'] in speaker_ids for t in part['script'])
    counts = [len(p['speakers']) for p in data['parts']]
    assert counts[0] == 2 and counts[1] == 1 and counts[2] in {2, 3} and counts[3] == 1
    delivery = data['delivery']
    assert delivery['status'] == 'audio_pending' and delivery['assetId'] is None
    assert delivery['attemptPolicy']['playCount'] == 1
    assert delivery['attemptPolicy']['learnerStimulus'] == 'approved_audio_only'
    assert delivery['productionPlan']['status'] == 'provisional_unmeasured'
    assert delivery['missingRequirements']


def test_general_reading_uses_daily_work_and_long_article_sections():
    data = json.loads((ROOT / 'general-01-reading.json').read_text())
    assert data['examTrack'] == 'general_training'
    assert data['durationMinutes'] == 60
    assert data['teacherReview']['status'] == 'pending'
    sections = data['sections']
    assert len(sections[0]['texts']) in {2, 3}
    assert [len(s['texts']) for s in sections[1:]] == [2, 1]
    assert [q['id'] for s in sections for q in s['questions']] == list(range(1, 41))
    total = 0
    for section in sections:
        text = '\n'.join(t['text'] for t in section['texts'])
        total += len(words(re.sub(r'(?m)^[A-H]$', '', text)))
        check_questions(section['questions'], text)
    assert 2150 <= total <= 2375
    # Section 2 is actual workplace onboarding/development; Section 3 is one
    # coherent general-interest article, not three Academic passages relabelled.
    assert 'leadership' in sections[1]['texts'][0]['text']
    assert 'resignation' in sections[1]['texts'][1]['text']
    assert len(words(sections[2]['texts'][0]['text'])) > max(
        len(words(t['text'])) for s in sections[:2] for t in s['texts']
    )
    assert data['delivery']['status'] == 'text_ready_teacher_review'


def test_general_writing_has_letter_purpose_points_and_complete_essay():
    data = json.loads((ROOT / 'general-01-writing.json').read_text())
    assert data['examTrack'] == 'general_training'
    assert data['durationMinutes'] == 60
    assert data['teacherReview']['status'] == 'pending'
    one, two = data['tasks']
    assert one['taskType'] == 'letter' and one['register'] in {'formal', 'semi_formal', 'informal'}
    assert len(one['bullets']) == 3 and all(one['bullets'])
    assert 'manager' in one['prompt']
    assert [one['minimumWords'], two['minimumWords']] == [150, 250]
    assert [one['suggestedMinutes'], two['suggestedMinutes']] == [20, 40]
    assert [one['weight'], two['weight']] == [1, 2]
    for task, guidance in zip(data['tasks'], data['teacherOnly']['taskGuidance'], strict=True):
        assert guidance['taskId'] == task['id']
        exemplar = guidance['exemplar']
        assert len(words(exemplar['text'])) >= task['minimumWords']
        for annotation in exemplar['annotations']:
            assert annotation['quote'] in exemplar['text']
            assert annotation['comment']
    assert data['delivery']['status'] == 'text_ready_teacher_review'


@pytest.mark.parametrize('filename', [
    'academic-01-reading.json', 'academic-01-listening.json',
    'academic-01-writing.json', 'academic-01-speaking.json',
    'general-01-reading.json', 'general-01-writing.json',
])
def test_each_rebuilt_mock_resolves_substantive_source_mappings(filename):
    data = json.loads((ROOT / filename).read_text())
    index = json.loads((ROOT.parent / 'source-index.json').read_text())
    entries = {entry['id']: entry for entry in index['entries']}
    provenance = data['provenance']
    assert provenance['origin'] == 'source_based_original'
    assert provenance['territory'] == 'Iran'
    assert data['version'] >= 2  # Full prior stimuli were replaced, not edited in place.
    assert provenance['sourceRefs'] and set(provenance['sourceRefs']) <= entries.keys()
    mappings = provenance['sourceMappings']
    assert mappings
    for mapping in mappings:
        assert mapping['sourceLearningPoint'].strip()
        assert mapping['taskTransformation'].strip()
        assert mapping['sourceRefIds'] and set(mapping['sourceRefIds']) <= entries.keys()
        node = data
        for token in mapping['targetPointer'].lstrip('/').split('/'):
            token = token.replace('~1', '/').replace('~0', '~')
            node = node[int(token)] if isinstance(node, list) else node[token]
        assert node
        for ref in mapping['sourceRefIds']:
            entry = entries[ref]
            assert entry['pdfPages'] and all(isinstance(n, int) and n > 0 for n in entry['pdfPages'])
            assert re.fullmatch('[a-f0-9]{64}', entry['fileSha256'])
            assert re.fullmatch('[a-f0-9]{64}', entry['excerptSha256'])


def test_source_completion_keys_cover_equivalent_words_present_in_context():
    listening = asset('listening')
    lqs = {q['id']: q for p in listening['parts'] for q in p['questions']}
    assert {'diagrams', 'illustrations'} <= set(lqs[28]['answer']['acceptedAnswers'])
    assert {'quickly', 'efficiently'} <= set(lqs[17]['answer']['acceptedAnswers'])
    general = json.loads((ROOT / 'general-01-reading.json').read_text())
    gqs = {q['id']: q for s in general['sections'] for q in s['questions']}
    # A three-item list supplies voice and timing in addition to expression.
    assert {'voice', 'timing'} <= set(gqs[33]['answer']['acceptedAnswers'])
    # The unrestricted 'one public use' stem accepts each listed example.
    assert {'advertising', 'clothing', 'entertainment', 'creative work'} <= set(
        gqs[36]['answer']['acceptedAnswers']
    )


def test_listening_provisional_budget_does_not_double_count_final_checking():
    plan = asset('listening')['delivery']['productionPlan']
    sequence = plan['openingInstructionsSeconds'] + sum(
        part['targetSpeechSeconds'] + part['checkingSeconds']
        + sum(pause['seconds'] for pause in part['readingPauses'])
        for part in plan['parts']
    )
    assert sequence == plan['targetListeningSequenceSeconds'] == 1800
    assert plan['finalReviewSeconds'] == 120
    assert plan['finalReviewIncludedInListeningSequence'] is False
    assert plan['targetTotalSeconds'] == sequence + plan['finalReviewSeconds']
    assert plan['status'] == 'provisional_unmeasured'
