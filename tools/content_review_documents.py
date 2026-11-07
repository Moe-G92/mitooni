#!/usr/bin/env python3
"""Build private editable teacher review manuals from a frozen original JSON set.

Use the Codex bundled Python runtime. This tool never approves or publishes content.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

SKILLS = ("reading", "writing", "listening", "speaking")
TRACKS = ("academic", "general_training")
PERSIAN = re.compile(r"[\u0600-\u06ff]")
LABELS = {
    "answerKey": "Teacher only answer key", "privateKey": "Teacher only answer key",
    "script": "Teacher only script", "scripts": "Teacher only scripts",
    "rationale": "Teacher only rationale", "rationales": "Teacher only rationales",
    "feedbackGuidance": "Teacher feedback guidance", "teacherReview": "Teacher review status",
    "teachingAnchors": "Teaching anchors", "sourceRefs": "Source references",
    "missingRequirements": "Unresolved delivery requirements",
}


def label(key: str) -> str:
    return LABELS.get(key, re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", key).replace("_", " ").capitalize())


def scalar(value) -> str:
    if value is None:
        return "None"
    if isinstance(value, bool):
        return "Yes" if value else "No"
    return str(value)


def leaves(value):
    if isinstance(value, dict):
        for child in value.values():
            yield from leaves(child)
    elif isinstance(value, list):
        for child in value:
            yield from leaves(child)
    else:
        yield scalar(value)


def paragraph(document, text: str, *, style=None, bold=False):
    p = document.add_paragraph(style=style)
    rtl = bool(PERSIAN.search(text))
    if rtl:
        bidi = OxmlElement("w:bidi")
        bidi.set(qn("w:val"), "1")
        p._p.get_or_add_pPr().append(bidi)
        # Logical start is the right edge in an RTL paragraph. Physical right
        # is mirrored by LibreOffice when bidi is set and renders on the left.
        justification = OxmlElement("w:jc")
        justification.set(qn("w:val"), "start")
        p._p.get_or_add_pPr().append(justification)
    run = p.add_run(text)
    run.bold = bold
    run.font.color.rgb = RGBColor(0, 0, 0)
    run.font.name = "Vazirmatn" if rtl else "Arial"
    rp = run._element.get_or_add_rPr()
    fonts = rp.rFonts
    for attr in ("ascii", "hAnsi", "cs", "eastAsia"):
        fonts.set(qn("w:" + attr), "Vazirmatn" if rtl else "Arial")
    lang = OxmlElement("w:lang")
    lang.set(qn("w:val"), "fa-IR" if rtl else "en-GB")
    lang.set(qn("w:bidi"), "fa-IR" if rtl else "en-GB")
    rp.append(lang)
    if rtl:
        direction = OxmlElement("w:rtl")
        direction.set(qn("w:val"), "1")
        rp.append(direction)
        size = OxmlElement("w:szCs")
        size.set(qn("w:val"), "22")
        rp.append(size)
    return p


def heading(document, text, level):
    # Identifiers/content titles retain their original punctuation; generated headings are plain.
    requested = min(level, 4)
    previous = 0
    for p in reversed(document.paragraphs):
        if p.style.name.startswith("Heading "):
            previous = int(p.style.name.split()[-1])
            break
    actual = min(requested, previous + 1)
    p = paragraph(document, text, style="Heading " + str(actual))
    # Correct navigation semantics without changing the reviewed visual scale.
    size = document.styles["Heading " + str(requested)].font.size
    for run in p.runs:
        run.font.size = size
    return p




def snapshot(source: Path):
    files = sorted(path for path in source.rglob("*") if path.is_file())
    hasher = hashlib.sha256()
    records = []
    for path in files:
        if path.is_symlink():
            raise ValueError("Symlink input is forbidden: " + str(path))
        relative = path.relative_to(source).as_posix()
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        hasher.update(relative.encode("utf-8") + b"\0" + data + b"\0")
        records.append({"path": relative, "sha256": digest})
    return hasher.hexdigest(), records


def load_items(source: Path, folder: str):
    result = {skill: [] for skill in SKILLS}
    for path in sorted((source / folder).glob("*.json")):
        item = json.loads(path.read_text(encoding="utf-8"))
        skill = item.get("skill")
        if skill not in result:
            raise ValueError("Missing or unknown skill in " + str(path))
        result[skill].append((path, item))
    return result


def track_for(path, item):
    if item.get("skill") in ("listening", "speaking"):
        return "shared"
    raw = str(item.get("exam") or item.get("examType") or item.get("track") or item.get("examTrack") or "").lower()
    normalized = raw.replace("-", "_").replace(" ", "_")
    filename = path.stem.lower()
    if "general" in normalized or "general" in filename or filename.startswith(("gt-", "gt_")):
        return "general_training"
    if "academic" in normalized or not normalized:
        return "academic"
    raise ValueError("Unrecognised track in " + str(path))






OMIT = {"id", "schemaVersion", "version", "skill", "stage", "pathwayIds", "objectiveIds", "familyId", "examTrack", "exam", "kind", "type", "taskType", "responseType", "assetId", "wordLimit", "sourceRefIds", "semanticExposureGroupIds", "transformationNotes", "sourceRefs", "provenance", "teacherReview", "delivery", "intendedUse", "language", "sourceMappings", "contentBindings", "rubricVersion", "policyVersion"}


def prose(doc, text, bold=False):
    for line in str(text).splitlines():
        if not line.strip():
            continue
        p = paragraph(doc, line, bold=bold)
        if len(line) < 100 and (line.endswith(":") or re.match(r"^(Task|Part) \d", line) or re.fullmatch(r"[A-Z]", line.strip()) or re.match(r"^[A-Z]\s+[—–-]\s+", line)):
            p.paragraph_format.keep_with_next = True


def semantic_value(doc, value, name="", level=3):
    """Render teaching content, while operational metadata stays in the sidecar."""
    if value is None or value == [] or value == {}:
        return
    if isinstance(value, dict):
        if "speakerId" in value and "text" in value:
            prose(doc, str(value["speakerId"]) + ": " + value["text"])
            return
        if "label" in value and ("text" in value or "description" in value):
            prose(doc, value["label"] + " — " + str(value.get("text", value.get("description"))))
            return
        title = value.get("title") or value.get("topic")
        if title:
            heading(doc, title, level)
        for key, child in value.items():
            if key in OMIT or key in {"title", "topic", "questions", "answer", "answerKey", "script"}:
                continue
            semantic_value(doc, child, key, min(level + 1, 4))
    elif isinstance(value, list):
        if all(not isinstance(x, (dict, list)) for x in value) and sum(len(str(x)) for x in value) < 170:
            prose(doc, (label(name) + ": " if name and name not in {"instructions", "points", "bullets", "opening"} else "") + "; ".join(scalar(x) for x in value))
        else:
            for child in value:
                semantic_value(doc, child, name, level)
    elif isinstance(value, bool) or isinstance(value, (int, float)):
        prose(doc, label(name) + ": " + scalar(value))
    elif name in {"text", "description", "instructions", "prompt", "opening", "points", "bullets", "explain", "question", "followUpPrompts", "roundingOffQuestions"}:
        prose(doc, value)
    else:
        prose(doc, (label(name) + ": " if name else "") + str(value))


def questions(doc, records, answers):
    previous = None
    option_groups = {}
    for index, q in enumerate(records, 1):
        if q.get("options"):
            identity = json.dumps(q["options"], ensure_ascii=False, sort_keys=True)
            option_groups.setdefault(identity, []).append(str(q.get("id", "")))
    shown_groups = set()
    for index, q in enumerate(records, 1):
        instruction = q.get("instructions")
        if instruction and instruction != previous:
            prose(doc, instruction, bold=True)
            doc.paragraphs[-1].paragraph_format.keep_with_next = True
            previous = instruction
        number = str(q.get("id", index))
        options = q.get("options", [])
        identity = json.dumps(options, ensure_ascii=False, sort_keys=True)
        shared = len(option_groups.get(identity, [])) > 1
        if shared and identity not in shown_groups:
            prose(doc, "Options for questions " + ", ".join(option_groups[identity]), bold=True)
            doc.paragraphs[-1].paragraph_format.keep_with_next=True
            for ix, option in enumerate(options):
                if isinstance(option, dict):
                    prose(doc, str(option.get("id", "")) + "  " + str(option.get("text", "")))
                else:
                    prose(doc, option)
                doc.paragraphs[-1].paragraph_format.keep_with_next=ix < len(options)-1
            shown_groups.add(identity)
        p = paragraph(doc, number + ". " + q.get("prompt", q.get("question", "")))
        if options and not shared:
            p.paragraph_format.keep_with_next = True
            for ix, option in enumerate(options):
                if isinstance(option, dict):
                    prose(doc, str(option.get("id", "")) + "  " + str(option.get("text", "")))
                else:
                    prose(doc, option)
                doc.paragraphs[-1].paragraph_format.keep_with_next = ix < len(options) - 1
        if q.get("answer"):
            answers.append((number, q["answer"]))
        for key in ("neutralProbes", "followUps"):
            if q.get(key):
                semantic_value(doc, q[key], key)


def semantic_manual(skill, items, source, snapshot_hash, records, package, package_hash):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    sec.top_margin = sec.bottom_margin = Inches(.65)
    sec.left_margin = sec.right_margin = Inches(.7)
    style = doc.styles["Normal"]
    style.font.name, style.font.size = "Arial", Pt(11)
    style.paragraph_format.line_spacing = 1.02
    style.paragraph_format.space_after = Pt(3)
    for name, size in (("Title", 22), ("Heading 1", 16), ("Heading 2", 13), ("Heading 3", 11), ("Heading 4", 11)):
        st = doc.styles[name]
        st.font.name, st.font.size = "Arial", Pt(size)
        st.font.color.rgb = RGBColor(0, 0, 0)
        st.font.italic = False
        st.paragraph_format.space_before = Pt(8)
        st.paragraph_format.space_after = Pt(3)
        st.paragraph_format.keep_with_next = True
    for st in doc.styles:
        if st.element.pPr is not None:
            for b in list(st.element.pPr.findall(qn("w:pBdr"))):
                st.element.pPr.remove(b)
    doc.core_properties.author = doc.core_properties.last_modified_by = ""
    doc.core_properties.title = "IELTS " + skill + " teacher review"
    footer = sec.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    field = OxmlElement("w:fldSimple");field.set(qn("w:instr"), "PAGE");footer._p.append(field)
    paragraph(doc, doc.core_properties.title, style="Title")
    prose(doc, "PENDING teacher review", bold=True)
    prose(doc, "Teacher only. Review the teaching, tasks, questions and private guidance. Academic and General Training Reading and Writing are separate; Listening and Speaking are shared. Record decisions and corrections after each unit and mock. No calibrated band or learner release approval is claimed.")
    prose(doc, "Content package SHA256: " + package_hash)
    prose(doc, "Exact file snapshot SHA256: " + snapshot_hash)
    prose(doc, "The accompanying source snapshot and content graph preserve all edition metadata and hashes. This manual presents the teaching and review material. Source-based adaptations are for the Iranian audience; named source pages identify the selected teaching basis, without reproducing complete source books.")
    if skill == "listening":
        prose(doc, "Local review audio is supplied with the frozen edition. IDs, filenames and durations appear beside each activity. Scripts are private. Teacher listening review, app playback and timed administration remain separate requirements.")
    if skill == "speaking":
        prose(doc, "Review pronunciation and fluency against actual audio. Recording, transcription, media controls and responsive interview delivery remain separate requirements.")
    heading(doc, "Contents", 1)
    contents_track = None
    for path, item in items:
        if track_for(path, item) != contents_track:
            contents_track = track_for(path, item)
            prose(doc, {"academic":"Academic", "general_training":"General Training", "shared":"Academic and General Training shared"}[contents_track], bold=True)
        prose(doc, item.get("title", item["id"]) + "  ·  " + item["id"])
    entries = {x["id"]: x for c in package["companions"].values() if c.get("kind") == "source_index" for x in c["entries"]}
    current_track = None
    for path, item in items:
        track = track_for(path, item)
        if track != current_track:
            heading(doc, {"academic":"Academic", "general_training":"General Training", "shared":"Academic and General Training shared"}[track], 1)
            current_track = track
        h = heading(doc, item.get("title", item["id"]), 1)
        h.paragraph_format.space_before = Pt(18)
        prose(doc, {"academic":"Academic", "general_training":"General Training", "shared":"Academic and General Training shared"}[track] + " · " + item["id"] + " · Version " + str(item["version"]) + (" · " + item["stage"] if "stage" in item else " · Mock"))
        doc.paragraphs[-1].paragraph_format.keep_with_next = True
        record = next(r for r in records if r["path"] == path.relative_to(source).as_posix())
        for ref in item.get("provenance", {}).get("sourceRefs", []):
            if ref in entries:
                e = entries[ref]
                prose(doc, ref + " · " + Path(e["relativePath"]).name + " · PDF pages " + ", ".join(str(x) for x in e["pdfPages"]))
        holds = [h for h in package["assessmentHolds"] if item["id"] in h.get("unitIds", [])]
        if holds:
            related = sorted({uid for h in holds for uid in h["unitIds"] if uid != item["id"]})
            prose(doc, "Unseen assessment held for source or semantic overlap with " + ", ".join(related) + ". Review prior exposure before independent assessment.", bold=True)
        semantic_value(doc, item.get("instructions"), "instructions")
        if item.get("durationMinutes"):
            prose(doc, "Duration: " + str(item["durationMinutes"]) + " minutes")
        if item.get("timing"):
            semantic_value(doc, item["timing"], "timing")
        locale = item.get("locale", {})
        semantic_value(doc, locale.get("instructionsFa"), "instructions")
        media = [a for a in package["assets"] if any(b["targetId"] == item["id"] for b in a["contentBindings"])]
        for asset in media:
            if asset["mediaType"] == "audio/mpeg":
                prose(doc, "Audio " + asset["id"] + " · " + str(round(asset["durationSeconds"], 2)) + " seconds · " + asset["path"])
        if item.get("teachingAnchors"):
            heading(doc, "Teaching", 2)
            semantic_value(doc, item["teachingAnchors"])
            semantic_value(doc, locale.get("teachingAnchorsFa"))
        answers = []
        def content_block(block, pointer, depth=2):
            if block.get("title"):
                if not doc.paragraphs or doc.paragraphs[-1].text != block["title"]:
                    heading(doc, block["title"], depth)
            elif block.get("topic"):
                heading(doc, block["topic"], depth)
            elif block.get("part"):
                heading(doc, "Part " + str(block["part"]), depth)
            for key in ("instructions", "context", "text", "prompt", "bullets", "minimumWords", "weight", "register", "suggestedMinutes", "opening", "cueCard", "roundingOffQuestions", "followUpPrompts", "interviewerGuidance", "response"):
                if key in block:
                    semantic_value(doc, block[key], key)
            for key in ("stimulus", "texts", "topicSets"):
                value = block.get(key)
                if key == "stimulus" and isinstance(value, dict) and value.get("kind") == "script":
                    continue
                if value:
                    if isinstance(value, list):
                        for ix, child in enumerate(value):
                            content_block(child, pointer + "/" + key + "/" + str(ix), min(depth + 1, 3))
                    else:
                        semantic_value(doc, value)
                target = pointer + "/" + key
                for asset in media:
                    if asset["mediaType"] == "image/png" and asset["width"] == 1280 and any(b["targetPointer"] == target for b in asset["contentBindings"]):
                        pic = doc.add_picture(str(source / asset["path"]), width=Inches(6.5))
                        if pic.height > Inches(5.8):
                            ratio=Inches(5.8)/pic.height;pic.width=int(pic.width*ratio);pic.height=Inches(5.8)
                        pic._inline.docPr.set("descr", asset["alt"])
                        pic._inline.docPr.set("title", asset["id"])
                        prose(doc, "Figure " + asset["id"] + " · SHA256 " + asset["sha256"])
            if block.get("questions"):
                heading(doc, "Questions", min(depth + 1, 3))
                if isinstance(block["questions"][0], str):
                    semantic_value(doc, block["questions"])
                else:
                    questions(doc, block["questions"], answers)
        if item.get("stimulus") or item.get("questions"):
            content_block({k:v for k,v in item.items() if k in {"stimulus","questions"}}, "")
        for key in ("passages", "parts", "tasks", "sections"):
            for index, block in enumerate(item.get(key, [])):
                content_block(block, "/" + key + "/" + str(index))
        heading(doc, "Teacher only review", 2)
        assessment = item.get("assessment", {})
        if assessment.get("criteria"):
            heading(doc, "Criteria", 3);semantic_value(doc, assessment["criteria"])
        for answer in assessment.get("answerKey", []):
            answers.append((answer["questionId"], answer))
        if answers:
            heading(doc, "Answers and rationales", 3)
            for number, a in answers:
                accepted = "; ".join(str(x) for x in a.get("acceptedAnswers", []))
                text = number + ": " + accepted + ". " + a.get("rationale", "")
                if a.get("evidenceQuote"):
                    text += " Evidence: “" + a["evidenceQuote"] + "”"
                prose(doc, text)
        semantic_value(doc, assessment.get("feedbackGuidance"))
        semantic_value(doc, locale.get("feedbackGuidanceFa"))
        for key in ("parts", "sections", "passages"):
            for block in item.get(key, []):
                if block.get("script"):
                    heading(doc, "Private script " + block.get("title", block["id"]), 3)
                    semantic_value(doc, block.get("speakers"))
                    semantic_value(doc, block["script"])
        if item.get("stimulus", {}).get("kind") == "script":
            heading(doc, "Private script", 3)
            # The source script text is not an audio substitute.
            semantic_value(doc, item["stimulus"].get("text"))
        semantic_value(doc, item.get("teacherOnly"))
        if item.get("delivery", {}).get("notes"):
            heading(doc, "Delivery notes", 3);semantic_value(doc, item["delivery"]["notes"])
        if doc.paragraphs:
            doc.paragraphs[-1].paragraph_format.keep_with_next = True
        heading(doc, "Teacher decision", 2)
        paragraph(doc, "Decision: ____________________   Reviewer: ____________________   Date: ____________").paragraph_format.keep_with_next=True
        paragraph(doc, "Comments: ___________________________________________________________________").paragraph_format.keep_with_next=True
        paragraph(doc, "_____________________________________________________________________________")
    required = {"instructions", "text", "prompt", "question", "rationale", "evidenceQuote", "description", "feedbackGuidance", "instructionsFa", "feedbackGuidanceFa", "label", "acceptedAnswers", "sourceVersion", "topic", "points", "explain", "bullets", "opening", "neutralProbes", "followUpPrompts", "roundingOffQuestions", "interviewerGuidance"}
    combined = " ".join(" ".join(p.text.split()) for p in doc.paragraphs)
    checked = []
    def audit(value, location):
        if isinstance(value, dict):
            for key, child in value.items():
                if key in required:
                    for leaf in child if isinstance(child, list) else [child]:
                        if isinstance(leaf, str) and len(leaf) > 2:
                            if " ".join(leaf.split()) not in combined:
                                raise ValueError("Missing substantive source text at " + location + "/" + key)
                            checked.append(location + "/" + key)
                if key not in {"provenance", "teacherReview", "delivery"}:
                    audit(child, location + "/" + key)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                audit(child, location + "/" + str(index))
    for path, item in items:
        audit(item, path.name)
    print(skill + ": " + str(len(checked)) + " substantive source values verified")
    return doc


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--frozen", action="store_true", help="Coordinator confirmed input freeze")
    parser.add_argument("--expected-snapshot", required=True, help="Expected frozen exact-byte snapshot SHA256")
    parser.add_argument("--expected-package", required=True, help="Content pipeline package SHA256")
    args = parser.parse_args()
    if not args.frozen:
        parser.error("Final authoring requires coordinator-confirmed --frozen inputs")
    source = args.source.resolve(strict=True)
    package_hash, records = snapshot(source)
    if package_hash != args.expected_snapshot:
        parser.error("Source snapshot changed or does not match expected hash")
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "platform" / "backend"))
    from app.services.content_pipeline import load_package
    package, pipeline_hash = load_package(source)
    if pipeline_hash != args.expected_package:
        parser.error("Validated content package hash does not match frozen edition")
    units, mocks = load_items(source, "units"), load_items(source, "mocks")
    for skill in SKILLS:
        expected_units, expected_mocks = (12, 2) if skill in ("reading", "writing") else (6, 1)
        if len(units[skill]) != expected_units or len(mocks[skill]) != expected_mocks:
            parser.error(f"{skill} requires {expected_units} units and {expected_mocks} mocks; got {len(units[skill])} and {len(mocks[skill])}")
        if skill in ("reading", "writing"):
            for track in TRACKS:
                if sum(track_for(p, i) == track for p, i in units[skill]) != 6 or sum(track_for(p, i) == track for p, i in mocks[skill]) != 1:
                    parser.error(f"{skill} {track} requires six units and one mock")
    args.output.mkdir(parents=True, exist_ok=True)
    destinations = [args.output / (skill + "-teacher-review.docx") for skill in SKILLS]
    if any(path.exists() for path in destinations):
        parser.error("Refusing to overwrite existing review documents; choose a fresh output directory")
    for skill, output in zip(SKILLS, destinations):
        ordered = []
        for track in TRACKS if skill in ("reading", "writing") else ("shared",):
            ordered.extend((p, i) for p, i in units[skill] if track_for(p, i) == track)
            ordered.extend((p, i) for p, i in mocks[skill] if track_for(p, i) == track)
        semantic_manual(skill, ordered, source, package_hash, records, package, pipeline_hash).save(output)
        print(output)
    (args.output / "source-snapshot.json").write_text(json.dumps({"sha256": package_hash, "files": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output / "content-graph.json").write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
