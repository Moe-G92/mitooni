"""Offline adversarial evidence; all content/reviewer fixtures are synthetic."""

from copy import deepcopy
from hashlib import sha256
import json
import io
import wave
import zipfile
import shutil
import subprocess
import sys
import time

import pytest
from pydantic import ValidationError

from app.contracts.content import AuthorUnit, CASE_KINDS, DEMAND_BRANCHES, EXPECTED_UNIT_IDS
from app.services.content_pipeline import (
    ContentError, build_metadata, canonical, digest, evaluate, learner_unit, load_package,
    publish_teacher_edition, safe_file, validate_teacher_evidence, json_pointer,
    intake_media, rename_exclusive, decoded_audio_duration, measured_media,
)
from scripts.content_pipeline import main


def unit(uid):
    parts = uid.split("-")
    gt = parts[0] == "gt"
    level, skill, stage = parts[1:] if gt else parts
    key = skill in {"reading", "listening"}
    anchor = dict(id="evidence", label="Evidence", text="Use the supplied evidence.")
    return dict(
        schemaVersion=1, id=uid, version=1, skill=skill, stage=stage,
        examTrack="general_training" if gt else "shared" if skill in {"listening", "speaking"} else "academic",
        pathwayIds=[("gt-" if gt else "") + DEMAND_BRANCHES[level]], objectiveIds=["evidence"], familyId=uid,
        title="Original synthetic fixture", instructions="Answer the question.",
        stimulus=dict(kind="script" if skill == "listening" else "passage", text=f"Synthetic private script or passage for {uid}."),
        questions=[dict(id="q1", prompt="Which option is supported?", responseType="single_choice" if key else "spoken_response" if skill == "speaking" else "extended_text", options=[dict(id="A", text="First option"), dict(id="B", text="Second option")] if key else [], wordLimit=None)],
        teachingAnchors=[anchor],
        assessment=dict(kind="deterministic" if key else "qualitative", criteria=[dict(id="evidence", label="Evidence", description="Use grounded evidence.")], answerKey=[dict(questionId="q1", acceptedAnswers=["B"], rationale="PRIVATE_RATIONALE")] if key else [], feedbackGuidance="PRIVATE_GUIDANCE"),
        delivery=dict(kind="audio_required" if skill == "listening" else "recording_required" if skill == "speaking" else "text", assetId=None),
        provenance=dict(origin="source_based_original", sourceRefs=["TEST-SOURCE"], territory="Iran", rightsNote="Synthetic original fixture only.", transformationNotes="Synthetic transformation mapping for negative contract tests only.", objectiveMappings=[dict(objectiveId="evidence",sourceRefIds=["TEST-SOURCE"],sourceLearningPoint="Synthetic source learning point.",unitTeachingConnection="Synthetic connection to evidence skill.",taskTransformation="Synthetic source-guided new task transformation.")]),
        teacherReview=dict(status="pending", notes=[]),
        locale=dict(instructionsFa="پاسخ دهید", teachingAnchorsFa=[dict(anchor, label="شواهد", text="از شواهد استفاده کنید")], feedbackGuidanceFa="راهنمای معلم"),
    )


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(canonical(data))


@pytest.fixture
def authoring(tmp_path):
    refs = []
    cases = []
    for uid in sorted(EXPECTED_UNIT_IDS):
        data = unit(uid)
        write_json(tmp_path / "units" / f"{uid}.json", data)
        refs.append(dict(id=uid, path=f"units/{uid}.json", sha256=digest(data)))
        for kind in CASE_KINDS:
            cases.append(dict(id=f"{uid}-{kind.replace('_', '-')}", unitId=uid, pathwayId=unit(uid)["pathwayIds"][0], kind=kind,
                              mode="independent" if kind == "independent_transfer" else "supported",
                              syntheticResponse="" if kind == "empty_response" else "Synthetic response",
                              expectedChecks=["Teacher evaluates the specified behavior."], prohibitedClaims=["No numeric band claim."]))
    companions = []
    for kind, skill in [("syllabus", None), ("mock_blueprint", None), ("source_index", None)] + [("mock", sk) for sk in ["reading", "writing", "listening", "speaking"]]:
        cid = kind.replace("_", "-") + ("-" + skill if skill else "")
        data = dict(schemaVersion=1, id=cid, version=1, kind=kind, teacherReview=dict(status="pending", notes=[]))
        if kind == "source_index":
            data["territory"] = "Iran"
            data["rightsNote"] = "Synthetic source evidence only; actual source authoring not claimed."
            data["entries"] = [dict(id="TEST-SOURCE", relativePath="synthetic/source.pdf", fileSha256="a"*64, pdfPages=[1], excerptSha256="b"*64,learningObjectives=["Synthetic evidence skill"],excerptBoundary="Synthetic parser fixture; no real source used.")]
        if skill:
            data["skill"] = skill
            data["tasks"] = [dict(id="task1", prompt="Synthetic fixture task")]
            data["provenance"] = dict(origin="source_based_original",sourceRefs=["TEST-SOURCE"],territory="Iran",rightsNote="Synthetic only.",transformationNotes="Synthetic transformation.",sourceMappings=[dict(targetPointer="/tasks/0",sourceRefIds=["TEST-SOURCE"],sourceLearningPoint="Synthetic source point",taskTransformation="Synthetic task transformation")])
        path = "companions/" + cid + ".json"
        write_json(tmp_path / path, data)
        companions.append(dict(id=cid, path=path, sha256=digest(data), kind=kind))
    manifest = dict(schemaVersion=1, id="first-edition", version=1, title="Synthetic test edition", units=refs, companions=companions,
                    pathways=[dict(id=("gt-" if track == "general_training" else "")+branch, examTrack=track, demandBranchId=branch, title=branch, entryProfile="Synthetic entry profile", targetIntent="Review supported and transfer candidates", orderedUnitIds=[uid for uid in sorted(EXPECTED_UNIT_IDS) if DEMAND_BRANCHES[uid.removeprefix("gt-").split("-")[0]] == branch and unit(uid)["examTrack"] in {"shared",track}]) for branch in DEMAND_BRANCHES.values() for track in ["academic","general_training"]],
                    mockBlueprint=dict(status="blueprint", sections=[dict(skill=s, durationMinutes=30, requiredItems=40, unitIds=[], missingRequirements=["Full mock content not authored in this fixture."]) for s in ["reading", "writing", "listening", "speaking"]], claim="not_a_full_mock"))
    write_json(tmp_path / "manifest.json", manifest)
    write_json(tmp_path / "evaluation/cases.json", dict(schemaVersion=1, cases=cases))
    return tmp_path


def change_unit(root, uid, mutate):
    path = root / "units" / f"{uid}.json"
    data = json.loads(path.read_text())
    mutate(data)
    write_json(path, data)
    manifest = json.loads((root / "manifest.json").read_text())
    next(r for r in manifest["units"] if r["id"] == uid)["sha256"] = digest(data)
    write_json(root / "manifest.json", manifest)


def evidence(root, package, package_hash):
    artifact = b"Synthetic test reviewer evidence; not a human approval."
    (root / "review-evidence.txt").write_bytes(artifact)
    target_ids = list(package["units"]) + [cid for cid, c in package["companions"].items() if c["kind"] in {"mock", "syllabus", "mock_blueprint"}]
    data = dict(schemaVersion=1, actorKind="human_teacher", reviewerId="test-reviewer", packageHash=package_hash,
                reviewedAt="2026-11-06T12:00:00Z", evidencePath="review-evidence.txt", evidenceSha256=sha256(artifact).hexdigest(),
                dispositions=[dict(targetId=uid, decision="approved", rationale="Synthetic parser test only.") for uid in target_ids])
    write_json(root / "teacher-evidence.json", data)
    return data


def test_complete_package_and_evaluation_are_not_teacher_or_model_results(authoring):
    package, h = load_package(authoring)
    report = evaluate(package, h)
    assert len(package["units"]) == 36 and len(report["cases"]) == 288
    assert report["actorKind"] == "automated_validation"
    assert all(c["teachingResult"] == "pending_teacher_evaluation" for c in report["cases"])


def test_actual_authored_path_ids_have_six_complete_track_routes(authoring):
    package, h = load_package(authoring)
    routes = {p["id"]: p for p in package["manifest"]["pathways"]}
    assert set(routes) == {"foundation", "intermediate", "advanced", "gt-foundation", "gt-intermediate", "gt-advanced"}
    assert all(len(p["orderedUnitIds"]) == 8 for p in routes.values())
    for uid, authored in package["units"].items():
        memberships = [p for p in routes.values() if uid in p["orderedUnitIds"]]
        assert len(memberships) == (2 if authored["examTrack"] == "shared" else 1)
        if authored["examTrack"] == "shared":
            assert {p["examTrack"] for p in memberships} == {"academic", "general_training"}
    shared_case = next(c for c in evaluate(package, h)["cases"] if c["unitId"] == "fnd-listening-train")
    assert shared_case["deliveryPathwayIds"] == ["foundation", "gt-foundation"]


@pytest.mark.parametrize("wrong_uid", ["fnd-reading-train", "gt-int-reading-train"])
def test_cross_track_or_level_route_misuse_rejected(authoring, wrong_uid):
    path = authoring / "manifest.json"
    manifest = json.loads(path.read_text())
    route = next(p for p in manifest["pathways"] if p["id"] == "gt-foundation")
    route["orderedUnitIds"][route["orderedUnitIds"].index("gt-fnd-reading-train")] = wrong_uid
    write_json(path, manifest)
    with pytest.raises(ContentError, match="Cross-level or cross-track"):
        load_package(authoring)


def test_honest_shared_listening_family_is_held_instead_of_relabelled(authoring):
    change_unit(authoring, "fnd-listening-transfer", lambda u: u.update(familyId="fnd-listening-train"))
    package, h = load_package(authoring)
    assert package["units"]["fnd-listening-transfer"]["familyId"] == "fnd-listening-train"
    hold = next(h for h in package["assessmentHolds"] if h["groupId"] == "fnd-listening-train")
    assert hold["unseenAdmission"] == "held"
    assert evaluate(package, h)["assessmentHolds"] == package["assessmentHolds"]


def test_default_cli_is_read_only(authoring, capsys):
    before = sorted(p.relative_to(authoring) for p in authoring.rglob("*"))
    assert main([str(authoring)]) == 0
    assert "pending" in capsys.readouterr().out
    assert before == sorted(p.relative_to(authoring) for p in authoring.rglob("*"))


def test_immutable_teacher_only_edition(authoring, tmp_path):
    add_review_audio(authoring)
    package, h = load_package(authoring)
    out = tmp_path.parent / (tmp_path.name + "-private-output")
    target = publish_teacher_edition(package, h, out, source_root=authoring)
    assert publish_teacher_edition(package, h, out, source_root=authoring) == target
    text = (target / "units/fnd-reading-train.json").read_text()
    assert "PRIVATE_RATIONALE" in text and "pending" in text
    assert load_package(target)[1] == h
    with zipfile.ZipFile(target.with_suffix(".zip")) as archive:
        for relative in archive.namelist():
            assert archive.read(relative) == (target / relative).read_bytes()
    (target / "units/fnd-reading-train.json").write_text("tampered")
    with pytest.raises(ContentError):
        publish_teacher_edition(package, h, out, source_root=authoring)


def add_review_audio(root):
    """Actual tiny synthetic WAVs, not mocked ffprobe metadata or real recordings."""
    mock_path = root / "companions/mock-listening.json"
    mock = json.loads(mock_path.read_text())
    mock.pop("tasks")
    mock["parts"] = [dict(id=f"part-{i}", script=f"Synthetic audio script {i}") for i in range(4)]
    original = mock["provenance"]["sourceMappings"][0]
    mock["provenance"]["sourceMappings"] = [dict(original, targetPointer=f"/parts/{i}") for i in range(4)]
    write_json(mock_path, mock)
    output = io.BytesIO()
    with wave.open(output, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(24000)
        wav.writeframes(b"\x00\x00" * 2400)
    raw = output.getvalue()
    targets = [(uid, "/stimulus/text", json.loads((root / f"units/{uid}.json").read_text())) for uid in sorted(EXPECTED_UNIT_IDS) if "listening" in uid]
    targets += [(mock["id"], f"/parts/{i}/script", mock) for i in range(4)]
    assets = []
    for index, (target, pointer, body) in enumerate(targets):
        aid = f"synthetic-audio-{index}"
        path = f"media/{aid}.wav"
        (root / "media").mkdir(exist_ok=True)
        (root / path).write_bytes(raw)
        assets.append(dict(id=aid, path=path, sha256=sha256(raw).hexdigest(), mediaType="audio/wav", sizeBytes=len(raw), width=None, height=None, durationSeconds=0.1, sampleRateHz=24000, channels=1, sourceAssetId=aid, sourceRefs=["TEST-SOURCE"], contentBindings=[dict(targetId=target, targetPointer=pointer, targetValueSha256=digest(json_pointer(body, pointer)))], specPath=None, specSha256=None, alt=None))
    catalog = dict(schemaVersion=1, kind="media_catalog", id="synthetic-media", version=1, teacherReview=dict(status="pending", notes=[]), assets=assets, upstreamManifestHashes=["e"*64])
    write_json(root / "media-catalog.json", catalog)
    manifest = json.loads((root / "manifest.json").read_text())
    next(c for c in manifest["companions"] if c["id"] == mock["id"])["sha256"] = digest(mock)
    manifest["companions"].append(dict(id="synthetic-media", path="media-catalog.json", sha256=digest(catalog), kind="media_catalog"))
    manifest["assets"] = assets
    write_json(root / "manifest.json", manifest)


def test_public_projection_never_contains_private_fields_or_listening_script(authoring):
    package, _ = load_package(authoring)
    public = canonical([learner_unit(u) for u in package["units"].values()]).decode()
    assert "PRIVATE_RATIONALE" not in public and "PRIVATE_GUIDANCE" not in public
    assert "answerKey" not in public and "feedbackGuidance" not in public
    for u in package["units"].values():
        if u["skill"] == "listening":
            assert u["stimulus"]["text"] not in public


def test_key_change_does_not_create_public_hash_oracle(authoring):
    package, h = load_package(authoring)
    original = package["units"]["fnd-reading-train"]
    public_hash = digest(learner_unit(original))
    change_unit(authoring, "fnd-reading-train", lambda u: u["assessment"]["answerKey"][0].update(acceptedAnswers=["A"]))
    changed, h2 = load_package(authoring)
    assert h != h2
    assert public_hash == digest(learner_unit(changed["units"]["fnd-reading-train"]))


@pytest.mark.parametrize("mutation", [
    lambda u: u.update(teacherReview=dict(status="approved", notes=[])),
    lambda u: u.update(publication="approved"),
    lambda u: u["assessment"].update(band=7),
    lambda u: u["assessment"]["answerKey"][0].update(acceptedAnswers=["Z"]),
    lambda u: u["assessment"]["answerKey"][0].update(rationale=""),
    lambda u: u["assessment"].update(answerKey=[]),
    lambda u: u["questions"].append(deepcopy(u["questions"][0])),
    lambda u: u["questions"][0].update(wordLimit=0),
    lambda u: u["locale"]["teachingAnchorsFa"][0].update(id="foreign"),
])
def test_malformed_content_is_rejected(mutation):
    data = unit("fnd-reading-train")
    mutation(data)
    with pytest.raises(ValidationError):
        AuthorUnit.model_validate(data)


def test_stale_manifest_rejected(authoring):
    path = authoring / "units/fnd-reading-train.json"
    data = json.loads(path.read_text())
    data["instructions"] = "Changed after review"
    write_json(path, data)
    with pytest.raises(ContentError, match="hash"):
        load_package(authoring)


def test_partial_set_rejected(authoring):
    data = json.loads((authoring / "manifest.json").read_text())
    data["units"].pop()
    write_json(authoring / "manifest.json", data)
    with pytest.raises(ValidationError):
        load_package(authoring)


def test_transfer_family_collision_is_an_assessment_hold(authoring):
    change_unit(authoring, "fnd-reading-transfer", lambda u: u.update(familyId="fnd-reading-train"))
    package, _ = load_package(authoring)
    assert package["assessmentHolds"] == [dict(kind="semantic_family_overlap",groupId="fnd-reading-train",unitIds=["fnd-reading-train","fnd-reading-transfer"],unseenAdmission="held")]


def test_partial_and_duplicate_eval_rejected(authoring):
    path = authoring / "evaluation/cases.json"
    data = json.loads(path.read_text())
    data["cases"][-1] = deepcopy(data["cases"][0])
    write_json(path, data)
    with pytest.raises(ContentError, match="Duplicate"):
        load_package(authoring)
    data["cases"].pop()
    write_json(path, data)
    with pytest.raises(ValidationError):
        load_package(authoring)


@pytest.mark.parametrize("relative", ["../outside.json", "/etc/passwd", "units\\outside.json"])
def test_path_escape_rejected(authoring, relative):
    with pytest.raises(ContentError):
        safe_file(authoring, relative)


def test_symlink_rejected(authoring):
    path = authoring / "units/fnd-reading-train.json"
    path.rename(authoring / "original.json")
    path.symlink_to(authoring / "original.json")
    with pytest.raises(ContentError, match="symlink"):
        load_package(authoring)


@pytest.mark.parametrize("failure", ["missing", "foreign", "stale", "rejected", "partial", "tampered", "automated"])
def test_teacher_gate_fails_closed(authoring, failure):
    package, h = load_package(authoring)
    data = evidence(authoring, package, h)
    if failure == "missing":
        (authoring / "teacher-evidence.json").unlink()
    elif failure == "foreign":
        data["reviewerId"] = "foreign-reviewer"
    elif failure == "stale":
        data["packageHash"] = "0" * 64
    elif failure == "rejected":
        data["dispositions"][0]["decision"] = "rejected"
    elif failure == "partial":
        data["dispositions"].pop()
    elif failure == "tampered":
        (authoring / "review-evidence.txt").write_text("tampered")
    elif failure == "automated":
        data["actorKind"] = "automated_validation"
    if failure != "missing":
        write_json(authoring / "teacher-evidence.json", data)
    with pytest.raises((ContentError, ValidationError)):
        validate_teacher_evidence(package, h, authoring, "teacher-evidence.json", {"test-reviewer"})


def test_complete_synthetic_attestation_parses_but_does_not_publish(authoring):
    package, h = load_package(authoring)
    evidence(authoring, package, h)
    result = validate_teacher_evidence(package, h, authoring, "teacher-evidence.json", {"test-reviewer"})
    assert result.reviewerId == "test-reviewer"
    assert not (authoring / "learner").exists()


def test_duplicate_json_keys_rejected(authoring):
    (authoring / "manifest.json").write_text('{"schemaVersion":1,"schemaVersion":1}')
    with pytest.raises(ContentError, match="Duplicate JSON"):
        load_package(authoring)


def test_public_boundaries_reject_invalid_or_falsely_attested_package(authoring, tmp_path):
    package, h = load_package(authoring)
    for operation in [evaluate, lambda p, digest: publish_teacher_edition(p, digest, tmp_path / "review")]:
        with pytest.raises(ContentError):
            operation({"units": {}, "evaluation": {"cases": []}}, "0" * 64)
        with pytest.raises(ContentError, match="attestation"):
            operation(package, "0" * 64)
        malformed = deepcopy(package)
        malformed["evaluation"]["cases"].pop()
        with pytest.raises(ValidationError):
            operation(malformed, digest(malformed))


@pytest.mark.parametrize("target_link", [False, True])
def test_teacher_output_rejects_all_symlink_components(authoring, tmp_path, target_link):
    package, h = load_package(authoring)
    outside = tmp_path / "outside"
    outside.mkdir()
    if target_link:
        out = tmp_path / "output"
        out.mkdir()
        (out / h).symlink_to(outside, target_is_directory=True)
    else:
        linked = tmp_path / "linked"
        linked.symlink_to(outside, target_is_directory=True)
        out = linked / "nested"
    with pytest.raises(ContentError, match="Symlink"):
        publish_teacher_edition(package, h, out)
    assert not list(outside.iterdir())


def test_unlisted_json_is_not_omitted_from_review(authoring):
    write_json(authoring / "mocks/unlisted.json", {"content": "Unreviewed"})
    with pytest.raises(ContentError, match="inventory"):
        load_package(authoring)


def test_cross_level_transfer_family_overlap_is_held(authoring):
    change_unit(authoring, "adv-reading-transfer", lambda u: u.update(familyId="fnd-reading-train"))
    package, _ = load_package(authoring)
    assert package["assessmentHolds"][0]["unseenAdmission"] == "held"


def test_cross_skill_exact_stimulus_collision_rejected(authoring):
    source = json.loads((authoring / "units/fnd-reading-train.json").read_text())["stimulus"]["text"]
    change_unit(authoring, "adv-writing-transfer", lambda u: u["stimulus"].update(text="  " + source.upper() + "  "))
    with pytest.raises(ContentError, match="duplicate unit stimulus"):
        load_package(authoring)


def test_companion_changes_invalidate_whole_package(authoring):
    package, h = load_package(authoring)
    path = authoring / "companions/mock-reading.json"
    data = json.loads(path.read_text())
    data["tasks"] = ["New original question"]
    write_json(path, data)
    with pytest.raises(ContentError, match="companion hash"):
        load_package(authoring)
    manifest = json.loads((authoring / "manifest.json").read_text())
    next(c for c in manifest["companions"] if c["id"] == "mock-reading")["sha256"] = digest(data)
    write_json(authoring / "manifest.json", manifest)
    _, changed = load_package(authoring)
    assert h != changed


def test_build_metadata_is_explicit_complete_and_replayable(authoring):
    (authoring / "manifest.json").unlink()
    (authoring / "evaluation/cases.json").unlink()
    package, h = build_metadata(authoring)
    loaded, loaded_hash = load_package(authoring)
    assert loaded == package and loaded_hash == h
    assert build_metadata(authoring)[1] == h
    assert len(package["evaluation"]["cases"]) == 288
    assert all(c["syntheticResponse"] == "" for c in package["evaluation"]["cases"] if c["kind"] == "empty_response")


def test_builder_refuses_partial_content_and_changed_existing_metadata(authoring):
    original = (authoring / "manifest.json").read_bytes()
    with pytest.raises(ContentError, match="differs"):
        build_metadata(authoring)
    assert (authoring / "manifest.json").read_bytes() == original
    (authoring / "units/gt-fnd-reading-train.json").unlink()
    with pytest.raises(ContentError, match="36"):
        build_metadata(authoring)


def test_empty_transfer_anchors_allowed_but_training_requires_them():
    transfer = unit("fnd-reading-transfer")
    transfer["teachingAnchors"] = []
    transfer["locale"]["teachingAnchorsFa"] = []
    AuthorUnit.model_validate(transfer)
    transfer["stage"] = "train"
    with pytest.raises(ValidationError, match="Training"):
        AuthorUnit.model_validate(transfer)


def test_invented_original_without_source_traceability_is_held():
    data = unit("fnd-reading-train")
    data["provenance"] = dict(origin="original", sourceRefs=[], territory="Iran", rightsNote="Original invented fixture")
    with pytest.raises(ValidationError):
        AuthorUnit.model_validate(data)


def test_unknown_source_and_unmapped_objective_rejected(authoring):
    change_unit(authoring, "fnd-reading-train", lambda u: u["provenance"].update(sourceRefs=["FOREIGN"], objectiveMappings=[dict(u["provenance"]["objectiveMappings"][0], sourceRefIds=["FOREIGN"])]))
    with pytest.raises(ContentError, match="licensed source index"):
        load_package(authoring)
    data = unit("fnd-reading-train")
    data["provenance"]["objectiveMappings"] = []
    with pytest.raises(ValidationError):
        AuthorUnit.model_validate(data)


def test_source_index_changed_after_review_is_stale(authoring):
    path = authoring / "companions/source-index.json"
    data = json.loads(path.read_text())
    data["entries"][0]["excerptSha256"] = "c" * 64
    write_json(path, data)
    with pytest.raises(ContentError, match="companion hash"):
        load_package(authoring)


def test_mock_unbound_source_mapping_rejected(authoring):
    path = authoring / "companions/mock-reading.json"
    data = json.loads(path.read_text())
    data["provenance"]["sourceMappings"][0]["targetPointer"] = "/tasks/1"
    write_json(path, data)
    manifest = json.loads((authoring / "manifest.json").read_text())
    next(c for c in manifest["companions"] if c["id"] == data["id"])["sha256"] = digest(data)
    write_json(authoring / "manifest.json", manifest)
    with pytest.raises(ContentError, match="requires exactly one"):
        load_package(authoring)


def mutate_catalog(root, mutate):
    catalog_path = root / "media-catalog.json"
    catalog = json.loads(catalog_path.read_text())
    mutate(catalog)
    write_json(catalog_path, catalog)
    manifest = json.loads((root / "manifest.json").read_text())
    manifest["assets"] = catalog["assets"]
    next(c for c in manifest["companions"] if c["kind"] == "media_catalog")["sha256"] = digest(catalog)
    write_json(root / "manifest.json", manifest)


def test_actual_binary_hash_and_size_rechecked(authoring):
    add_review_audio(authoring)
    package, _ = load_package(authoring)
    (authoring / package["assets"][0]["path"]).write_bytes(b"changed")
    with pytest.raises(ContentError, match="hash/size"):
        load_package(authoring)


def test_actual_audio_metadata_not_caller_claim(authoring):
    add_review_audio(authoring)
    mutate_catalog(authoring, lambda c: c["assets"][0].update(durationSeconds=8.0))
    with pytest.raises(ContentError, match="duration"):
        load_package(authoring)


def test_audio_does_not_pass_without_actual_probe(authoring, monkeypatch):
    add_review_audio(authoring)
    monkeypatch.setattr("app.services.content_pipeline.shutil.which", lambda _: None)
    with pytest.raises(ContentError, match="ffprobe"):
        load_package(authoring)


def test_stale_asset_pointer_fails_even_with_rehashed_catalog(authoring):
    add_review_audio(authoring)
    mutate_catalog(authoring, lambda c: c["assets"][0]["contentBindings"][0].update(targetValueSha256="f"*64))
    with pytest.raises(ContentError, match="content binding"):
        load_package(authoring)


def test_undeclared_binary_cannot_hide_outside_manifest(authoring):
    (authoring / "unexpected.mp3").write_bytes(b"not an actual MP3")
    with pytest.raises(ContentError, match="inventory"):
        load_package(authoring)


def test_actual_media_required_before_teacher_edition(authoring, tmp_path):
    package, h = load_package(authoring)
    with pytest.raises(ContentError, match="actual audio"):
        publish_teacher_edition(package, h, tmp_path / "no-media", source_root=authoring)


def test_atomic_directory_publication_never_overwrites_existing_target(tmp_path):
    source, target = tmp_path / "stage", tmp_path / "target"
    source.mkdir()
    target.mkdir()
    (source / "source.txt").write_text("stage")
    with pytest.raises(ContentError, match="already exists"):
        rename_exclusive(source, target)
    assert source.exists() and not list(target.iterdir())


def test_intake_rejects_arbitrary_output_and_media_manifest(authoring, monkeypatch, tmp_path):
    # Arrange canonical source-index location used by the real intake command.
    original = authoring / "companions/source-index.json"
    (authoring / "source-index.json").write_bytes(original.read_bytes())
    trusted = tmp_path.parent / (tmp_path.name + "-trusted")
    monkeypatch.setattr("app.services.content_pipeline.TRUSTED_REVIEW_ROOT", trusted)
    with pytest.raises(ContentError, match="fixed private staging"):
        intake_media(authoring, tmp_path / "elsewhere", visual_manifest=tmp_path / "outside.json")
    (tmp_path / "outside.json").write_text("{}")
    with pytest.raises(ContentError, match="fixed private review"):
        intake_media(authoring, trusted / "staging/edition", visual_manifest=tmp_path / "outside.json")


def test_actual_mp3_intake_is_self_contained_and_keeps_source_paths_private(authoring, monkeypatch, tmp_path):
    executable = shutil.which("ffmpeg")
    if executable is None:
        pytest.skip("Actual local ffmpeg is needed for synthetic MP3 fixture")
    from app.services.content_pipeline import measured_media
    add_review_audio(authoring)
    catalog = json.loads((authoring / "media-catalog.json").read_text())
    trusted = tmp_path.parent / (tmp_path.name + "-trusted-review")
    audio_root = trusted / "audio/synthetic-run"
    audio_root.mkdir(parents=True)
    example = authoring / catalog["assets"][0]["path"]
    mp3 = audio_root / "synthetic.mp3"
    subprocess.run([executable, "-nostdin", "-loglevel", "error", "-i", str(example), "-codec:a", "libmp3lame", "-b:a", "64k", str(mp3)], check=True, timeout=15)
    raw = mp3.read_bytes()
    metadata = measured_media(mp3, "audio/mpeg")
    records = []
    for old in catalog["assets"]:
        records.append(dict(id=old["id"], path=str(mp3), sha256=sha256(raw).hexdigest(), mediaType="audio/mpeg", sizeBytes=len(raw), durationSeconds=metadata["durationSeconds"], sampleRateHz=metadata["sampleRateHz"], channels=metadata["channels"], sourceRefs=old["sourceRefs"], contentBindings=old["contentBindings"]))
    manifest_path = audio_root / "asset-catalog.json"
    write_json(manifest_path, dict(schemaVersion=1, kind="teacher_review_audio_catalog", assets=records))
    # Input authoring layer contains only authored JSON, never generated binaries.
    shutil.rmtree(authoring / "media")
    (authoring / "media-catalog.json").unlink()
    (authoring / "companions/source-index.json").rename(authoring / "source-index.json")
    monkeypatch.setattr("app.services.content_pipeline.TRUSTED_REVIEW_ROOT", trusted)
    target, package_hash = intake_media(authoring, trusted / "staging/first-set", audio_manifest=manifest_path)
    package, h = load_package(target)
    assert h == package_hash and len(package["assets"]) == 10
    assert str(trusted) not in canonical(package).decode()
    assert "sourcePath" not in canonical(package).decode()
    assert all((target / a["path"]).is_file() for a in package["assets"])
    assert all(a["mediaType"] == "audio/mpeg" for a in package["assets"])


def test_duration_is_decoded_samples_not_version_dependent_container_padding(tmp_path, monkeypatch):
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        pytest.skip("Actual ffmpeg is required for MP3 padding regression")
    source, mp3 = tmp_path / "source.wav", tmp_path / "encoded.mp3"
    with wave.open(str(source), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(24000)
        output.writeframes(b"\x00\x00" * 2400)
    subprocess.run([ffmpeg, "-nostdin", "-v", "error", "-i", str(source), "-codec:a", "libmp3lame", str(mp3)], check=True, timeout=15)
    run = subprocess.run
    def padded_probe(*args, **kwargs):
        response = run(*args, **kwargs)
        value = json.loads(response.stdout)
        # Reproduce the Linux 5.1.x interpretation without changing PCM bytes.
        value["format"]["duration"] = "0.168"
        response.stdout = json.dumps(value).encode()
        return response
    monkeypatch.setattr("app.services.content_pipeline.subprocess.run", padded_probe)
    assert measured_media(mp3, "audio/mpeg")["durationSeconds"] == 0.1


@pytest.mark.parametrize("script,message", [
    ("import sys;sys.stdout.buffer.write(b'x'*3)", "incomplete decoded frames"),
    ("import sys;sys.stdout.buffer.write(b'x'*48);sys.exit(1)", "decoding failed"),
    ("pass", "empty or incomplete"),
])
def test_decoder_failure_empty_and_partial_frames_fail_closed(tmp_path, monkeypatch, script, message):
    popen = subprocess.Popen
    children = []
    def decoder(_command, **kwargs):
        child = popen([sys.executable, "-c", script], **kwargs)
        children.append(child)
        return child
    monkeypatch.setattr("app.services.content_pipeline.subprocess.Popen", decoder)
    with pytest.raises(ContentError, match=message):
        decoded_audio_duration(tmp_path / "fixture.mp3", 24000, 1)
    assert children and all(child.poll() is not None for child in children)


def test_decoded_sample_ceiling_kills_and_reaps_overlong_media(tmp_path, monkeypatch):
    popen = subprocess.Popen
    children = []
    def decoder(_command, **kwargs):
        child = popen([sys.executable, "-c", "import sys;sys.stdout.buffer.write(b'x'*10000000)"], **kwargs)
        children.append(child)
        return child
    monkeypatch.setattr("app.services.content_pipeline.subprocess.Popen", decoder)
    with pytest.raises(ContentError, match="sample limit"):
        decoded_audio_duration(tmp_path / "fixture.mp3", 24000, 1, max_duration_seconds=0.001)
    assert children[0].poll() is not None


def test_stalled_decoder_deadline_kills_and_reaps_process(tmp_path, monkeypatch):
    popen = subprocess.Popen
    children = []
    def decoder(_command, **kwargs):
        child = popen([sys.executable, "-c", "import time;time.sleep(30)"], **kwargs)
        children.append(child)
        return child
    monkeypatch.setattr("app.services.content_pipeline.subprocess.Popen", decoder)
    started = time.monotonic()
    with pytest.raises(ContentError, match="time limit"):
        decoded_audio_duration(tmp_path / "fixture.mp3", 24000, 1, timeout_seconds=0.05)
    assert time.monotonic() - started < 2
    assert children[0].poll() is not None


def test_malformed_audio_fails_actual_decode(tmp_path):
    fake = tmp_path / "malformed.mp3"
    fake.write_bytes(b"ID3" + b"\x00" * 200)
    with pytest.raises(ContentError):
        measured_media(fake, "audio/mpeg")
