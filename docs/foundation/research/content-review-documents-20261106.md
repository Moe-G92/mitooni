# Teacher review documents checkpoint

Owner: review_documents specialist. Model: gpt-6.1-sol, medium. Date: 2026-11-06. Scope: reproducible private editable Word review packs, generator and this record only. Read root and application AGENTS.md and documents SKILL.md. No unrelated Word brief read or edited.

## Preflight

1. A professional content reviewer needs lossless source coverage, a frozen package identity, usable English/Persian typography and an honest distinction between reviewable content and functioning exam delivery. Check these before handing the packs to a teacher.
2. Raw evidence is the original authored JSON under content/ielts-academic/2026-11-06/units and mocks. Existing summaries are navigation only. No adjacent licensed resource corpus, existing Word brief, learner data or environment files are inputs.
3. Use bundled Python and python-docx for editable paragraphs and semantic headings; explicit fa-IR language and right-to-left paragraphs for Persian; deterministic source hashing and leaf-content coverage checks; the documents skill renderer with bundled LibreOffice for pagination and glyph inspection.
4. Evidence independent of reviewer preference is matching source hashes, every source leaf represented, exactly six units and one mock per skill, structurally correct Word headings/language/direction, and all rendered page images free of clipping, overlap, missing glyphs and awkward pagination. This does not establish teacher approval or runtime delivery.

## Design and plan

Produce four skill manuals. Use Letter portrait, readable 11 point body text, black Word titles/headings, 0.75 inch margins and simple prose sections. Retain source field order and every value, with readable labels and question identifiers. Semantic headings provide Word navigation. Teacher-only answer keys, rationales, scripts, criteria, delivery requirements and original provenance remain inside the private packs. Each unit/mock ends with blank decision and comment fields; never manufacture reviewer identities or signatures.

The opening records PENDING teacher review and the exact source package SHA256. A deterministic fallback package hash binds every JSON relative path and exact file bytes, including manifest/evaluation if present; it is explicitly a review source snapshot hash, distinct from any pipeline-defined package hash. The manifest hash or package identity present in source is also preserved. The generator refuses incomplete skill counts or an invocation without an explicit frozen-input flag. Final generation waits for the coordinator content freeze.

Template tooling is unavailable and the coordinator supplied the manual design. No template search or external upload is required. No implementation pattern was copied from another project.

## Runtime and validation boundaries

Listening scripts are private teacher review material; actual audio, playback and transcript release require separate delivery implementation. Speaking prompts and criteria do not implement recording/transcription or calibrated scoring. Word review does not prove active learner delivery, full mock timing, official band calibration or teacher validity.

Authoritative runtimes resolved by workspace dependency loader: `/Users/arashshahrokhi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3` and `/Users/arashshahrokhi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`. Bundled LibreOffice: `/Users/arashshahrokhi/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/MacOS/soffice`. Do not substitute desktop LibreOffice. The once-only document-operation marker will run immediately before first DOCX creation, expected output count four.

## Current checkpoint

Generator preparation only. Original source files not yet complete at intake. No DOCX authored; rendering and visual inspection pending frozen inputs. Next action: inspect settled schemas, finish schema mapping if needed, then stop for coordinator freeze instruction before final generation.

## Expanded scope checkpoint

Coordinator relayed the user's Academic and General Training expansion. Four manuals remain the output: Reading and Writing each contain separate Academic and General Training sections, with six units and one mock per track; Listening and Speaking each contain six shared units and one shared mock. The generator now requires 36 units and six mocks in total and validates track counts. Explicit exam/track metadata takes precedence, with a General Training filename fallback for authoring compatibility. No document creation has occurred.

The review snapshot now hashes **every file** below the edition directory, with relative path + NUL + exact bytes + NUL in sorted path order. This binds syllabus, mock blueprint, evaluation, manifest and later media bytes to the reviewed edition. Cover companion hashes make those identities inspectable. Declared local raster figure paths can be inserted as editable-document images, with traversal and symlink rejection; source metadata remains fully represented. No images or audio are fetched externally. Later media schemas will be inspected against actual files before freeze.

Validation at this checkpoint: bundled Python `py_compile` and `--help` passed before the expansion; repeat compilation on the expanded generator before generation. Four-DOCX operation marker, final generation, rendering and full page inspection remain pending coordinator freeze and final hash.

## Frozen edition and semantic manual revision

Coordinator authorized final authoring from the self-contained edition `85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095`. `load_package` independently reproduced that package hash and 22 assessment holds. Exact-byte snapshot of all 82 files: `6128d7e47c35d15cb4b26748e1fa93db6bb93b994ea89ace3d1586ac69853f3d`. The document-operation marker succeeded exactly once before the first create command, expected count four.

Initial generic rendering produced 394 pages because of per-field metadata and repeated structural labels. The coordinator rejected that density before delivery. Replaced it with semantic teaching/task/question/private-review sections. Operational fields remain in the accompanying complete `content-graph.json` and `source-snapshot.json`; human manuals retain unit/version/hash, source IDs and pages, concise transformation context, relevant exposure holds, actual stimuli, teaching, criteria, questions/options and private feedback/keys/scripts. This explicitly supersedes the earlier all-JSON-leaf-in-the-human-manual design.

Semantic v5 renders: Reading 57 pages / 23,632 words; Writing 38 / 13,001; Listening 28 / 14,005; Speaking 18 / 6,937. A whitespace-normalized substantive-string coverage audit checked 1,207 Reading, 272 Writing, 498 Listening and 155 Speaking values: zero missing prompt/text/instruction/teaching/criterion/feedback/answer/rationale/evidence strings. Full page review follows the coordinator's density checkpoint. The six Writing figures use actual 1280-pixel catalog bindings at their corresponding stimulus pointers, with native image alt text and source SHA256. Local audio IDs, filenames and durations are visible beside their activity; MP3 bytes remain in the frozen edition rather than embedded in Word.

Observed rendering repairs: removed inherited blue title-style border; kept review fields together; grouped teaching labels with content; verified logical `w:jc=start` plus `w:bidi` physically right-aligns Persian in bundled LibreOffice, whereas physical `right` was mirrored left. Persian is readable using available fallback fonts; bundled Python lacks FontTools, so Vazirmatn conversion was not available and no dependency was installed. Existing licensed source originals were not read or attached.

Independent v2 review was paused on coordinator request before semantic replacement: Reading pages 1–72, Writing 1–72, Listening 1–56 individually inspected. These are superseded observations, not final-page approval. No clipping/overlap/missing glyphs observed there; pagination and Persian alignment feedback informed the semantic renderer. All generated attempts are preserved, total document workspace about 317 MB at this checkpoint, under the 1 GB budget. No other worker's artifacts were removed.

## Completed teacher review deliverables

Final output directory: `review/content-20261106/documents/85551608ca70-accessible/`.

- Reading: 43 pages; 1,207 substantive source values verified.
- Writing: 28 pages; 276 substantive source values verified; six actual 1280 PNG figures with alt descriptions and correct stimulus bindings.
- Listening: 25 pages; 498 substantive source values verified; all ten audio IDs, durations and local MP3 references retained; private scripts follow questions.
- Speaking: 14 pages; 183 substantive source values verified; topic headings and full interview guide retained.

All four editable DOCX outputs total approximately 762 KB. The complete content graph and exact 82-file snapshot are accompanying private sidecars. `verification.json` records package identity, output checksums, source coverage counts and every final page-image SHA256. The package remains `85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095`; no content, media or source files were changed.

Final semantic corrections were bounded: identical option sets print once with explicit question-ID mappings; raw unit hashes and mechanical transformation essays moved to sidecars; each unit retains meaningful source book/pages, version and exposure disposition. Continuous flow avoids empty pages and isolated review-only pages. Standalone passage labels stay with their text; duplicate adjacent titles are suppressed. The source's May 2023 Writing rubric version is explicit, separate from the supplied historic descriptor PDF source anchor.

### Actual checks and evidence

The bundled Python generator ran with `--frozen`, exact `--expected-package` and `--expected-snapshot`. All source coverage assertions passed. Negative checks reproduced refusal without freeze confirmation and refusal to overwrite an existing document directory, both expected exit code 2.

`render_docx.py` rendered every final document using bundled LibreOffice; page counts are 43/28/25/14, 110 total. Independent gpt-6.1-sol medium reviewers inspected all Reading 1–43, Writing 1–28, Listening 1–25 and Speaking 1–14 page PNGs individually at original detail. They explicitly agreed on layout/readability and correct figures, with no final clipping, overlap, missing glyphs, blank pages or stranded review fields. Implementer additionally inspected all 14 Speaking pages of the preceding semantic version; the final Speaking review was independent. Earlier orphan-label and choice-splitting findings were repaired and re-reviewed; superseded evidence is not presented as final approval.

A final heading-semantic correction preserved the reviewed typography while eliminating skipped heading levels. All four documents were re-rendered. Every one of the 110 resulting PNG files is byte-identical to its already individually inspected counterpart, verified programmatically. The documents skill `scripts/a11y_audit.py` reports **zero high, medium and low findings** on all four final DOCX files. Native semantic headings, language/RTL paragraph properties and all six image alt descriptions are present.

All generations, review PNGs, intermediate PDFs and records remain local and ignored; total document work area is approximately 653 MB, below the requested 1 GB budget. No cleanup of other artifacts, external upload/send, source-corpus processing, proposal edit or public application change occurred.

### Decision and remaining limits

Document engineering and presentation: ready for teacher review. Teacher review remains **PENDING**; all decision/reviewer/date fields are blank. The 22 assessment holds remain effective and these manuals do not imply unseen assessment admission, calibrated band scores, legal clearance, functional media delivery, audio quality approval or learner release. Rendered Persian uses available fallback font support; it is visibly legible and right aligned, but Vazirmatn installation/conversion was not available through the authoritative runtime. Audio references bind supplied local files; this document task did not listen to or validate the audio recordings. Rebuilding against any changed edition requires new hashes, fresh generation and renewed review.
