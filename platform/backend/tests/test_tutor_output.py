import pytest
from app.services import study_state as s
from app.services.tutor_output import validate_output
from app.repositories.account import AccountError
from local.study_catalog import packs


@pytest.fixture
def output():
    st = s.empty_state("issuer", "subject")
    w = s.resolve(
        st,
        packs(),
        dict(
            stepId="writing-reasons",
            conditionPreset="supported",
            expectedJourneyRevision=1,
        ),
        ["study:use"],
    )
    ws = st["workspaces"][w["id"]]
    t = dict(
        id="turn",
        intent="feedback",
        workRef={"kind": "attempt", "id": "a", "revision": 2},
        workText="A library can serve readers.",
        runnerKind="provider",
        bundleRef=ws["bundleRef"],
        contextId=ws["contextManifestId"],
    )
    c = dict(
        kind="feedback",
        text="Explain how this example supports your reason.",
        citations=[{"anchorId": "writing-reason"}],
        workSpans=[dict(start=0, end=9, quote="A library")],
        observations=[
            dict(
                criterionId="support",
                text="Connect this example to the reason.",
                workSpanIndexes=[0],
            )
        ],
    )
    return st, ws, t, c


def test_valid_generated_feedback(output):
    st, w, t, c = output
    m, p = validate_output(c, t, w, st)
    assert m["text"] == c["text"] and m["provenance"]["runnerKind"] == "provider"


@pytest.mark.parametrize(
    "change",
    [
        {"citations": [{"anchorId": "secret"}]},
        {"workSpans": [{"start": 0, "end": 4, "quote": "fake"}]},
        {"kind": "question"},
        {"text": "Your band score is 8"},
        {"score": 8},
        {"observations": []},
        {"citations": []},
    ],
)
def test_invalid_output_never_candidate_publication(output, change):
    st, w, t, c = output
    c.update(change)
    with pytest.raises(AccountError):
        validate_output(c, t, w, st)


def test_prework_explanation_does_not_require_fake_quote(output):
    st, w, t, c = output
    t["intent"] = "explain"
    t["workText"] = ""
    t["workRef"]["kind"] = "draft"
    c.update(kind="explanation", workSpans=[], observations=[])
    assert validate_output(c, t, w, st)[0]["kind"] == "explanation"


def test_inert_quote_is_data_not_action(output):
    st, w, t, c = output
    quote = "<script>run()</script>"
    t["workText"] = quote
    c["workSpans"] = [dict(start=0, end=len(quote), quote=quote)]
    m, _ = validate_output(c, t, w, st)
    assert (
        m["workSpans"][0]["quote"] == quote
    )  # UI must render plain text, never innerHTML.


def test_public_content_hash_excludes_private_key_or_rationale():
    from app.services.study_editions import public_content_hash, manifest_hash
    from copy import deepcopy

    p = packs()[0]
    changed = deepcopy(p)
    changed["privateKey"] = "A"
    changed["privateRationale"] = "A private explanation"
    assert public_content_hash(p) == public_content_hash(changed)
    assert manifest_hash(p) != manifest_hash(changed)
