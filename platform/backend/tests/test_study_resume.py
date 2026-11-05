from copy import deepcopy
from app.services.study_state import empty_state, resolve, journey
from local.study_catalog import packs


def test_own_independent_stimulus_preserves_matching_resume():
    catalog = packs()
    state = empty_state("synthetic", "owner")
    workspace = resolve(
        state,
        catalog,
        dict(
            stepId="reading-evidence",
            conditionPreset="independent",
            expectedJourneyRevision=1,
        ),
        ["study:use", "study:independent"],
    )
    metadata = next(
        step
        for step in journey(state, catalog)["steps"]
        if step["stepId"] == "reading-evidence"
    )
    assert metadata["conditionPresets"] == ["independent"]
    resumed = resolve(
        state,
        catalog,
        dict(
            stepId="reading-evidence",
            conditionPreset=metadata["conditionPresets"][0],
            expectedJourneyRevision=1,
        ),
        ["study:use", "study:independent"],
    )
    assert (
        resumed["id"] == workspace["id"]
        and resumed["attempt"]["id"] == workspace["attempt"]["id"]
    )
    later = deepcopy(catalog)
    later[0]["bundleRef"]["packVersion"] = 2
    assert journey(state, later)["steps"][0]["bundleRef"] == workspace["bundleRef"]


def test_exposed_sibling_has_no_new_independent_offer():
    catalog = packs()
    state = empty_state("synthetic", "owner")
    resolve(
        state,
        catalog,
        dict(
            stepId="reading-evidence",
            conditionPreset="supported",
            expectedJourneyRevision=1,
        ),
        ["study:use"],
    )
    sibling = deepcopy(catalog[0])
    sibling["stepId"] = "reading-sibling"
    steps = journey(state, catalog + [sibling])["steps"]
    assert next(step for step in steps if step["stepId"] == "reading-sibling")[
        "conditionPresets"
    ] == ["supported"]
