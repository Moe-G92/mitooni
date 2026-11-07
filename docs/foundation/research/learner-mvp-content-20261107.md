# Learner MVP content adapter — design checkpoint

Date: 2026-11-07. Owner: `/root/learner_content_adapter`, gpt-6.1-sol / medium. Source checkout: `/Users/arashshahrokhi/Projects/mitooni/app`, branch `codex/ielts-content-20261106`, assigned revision `0a79be2`. Instructions read: `/Users/arashshahrokhi/Projects/AGENTS.md` and `app/AGENTS.md`. Scope is design only; no runtime, database, source, account, deployment or model-call changes. No SQE materials inspected or reused. Stop at this checkpoint until coordinator approval.

## Preflight

1. A strong learning-content engineer would verify what the learner actually sees/hears, preserve answer/semantic exposure boundaries across tracks, reserve a genuine full-length form, and distinguish content availability from calibrated assessment. These are necessary foundations; a comprehensive new curriculum and generated question bank are future work.
2. Rawest available evidence: read-only `review/corpus-20261106/store.sqlite3` source pages, occurrences, extraction revisions, media metadata and import payloads; exact frozen edition files under `review/content-20261106/editions/85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095/`; actual serving contracts and projection functions. Existing research notes are leads, not proof.
3. Used `rg`, source reads, Python JSON inspection/counting and SQLite URI `mode=ro`; no initializing helper was called because authoring helpers can mutate the store. Compare exact questions, anchors, family/group mappings, key location, media bindings and timers against runtime DTOs. These methods expose concrete mapping losses without new generation or paid processing.
4. Independent evidence of correctness: deterministic source/hash reconciliation; typed projection validation; negative HTTP tests for keys, transcript and raw provenance; full multi-question completion/reload/retry tests; source-audio/form alignment audition; observable distinct plans from different profiles/errors; and an independent reviewer running the actual learner flow. Passing JSON shape checks alone is insufficient.

## Observed current assets

The frozen edition has 36 units, six mock companions, six track/level pathways and 28 curated media assets. There are 174 response prompts across units, 54 teaching anchors (three per train unit), and English exam material plus Persian instructional/anchor/feedback fields. This is representative coverage, not an entire general-English course or unlimited bank.

| Track | Skill | Units (train + transfer) | Questions | Teaching anchors |
|---|---|---:|---:|---:|
| Academic | Reading | 6 | 48 | 9 |
| Academic | Writing | 6 | 12 | 9 |
| General Training | Reading | 6 | 46 | 9 |
| General Training | Writing | 6 | 8 | 9 |
| Shared | Listening | 6 | 30 | 9 |
| Shared | Speaking | 6 | 30 | 9 |

Each row spans foundation, intermediate and advanced. Pathway IDs are `foundation`, `intermediate`, `advanced`, `gt-foundation`, `gt-intermediate`, `gt-advanced`; shared listening/speaking must resolve to the same content/exposure identity. Source levels are demand/navigation branches, not diagnostic band cutoffs. Train and transfer have exact `objectiveIds`, private `provenance.objectiveMappings`, assessment criteria and source-based meaning; use these rather than a new generic AI syllabus.

Primary implementation evidence: `platform/backend/app/contracts/content.py` (`AuthorUnit`, `Question`, `Assessment`, `Provenance`, `Locale`); edition `manifest.json`, all 36 `units/*.json`, `syllabus.json` (`units[].activityExposureMappings`, 69 semantic groups), and six `mocks/*.json`.

Private SQLite observations: 59 imports total; 42 current `anchors_resolved` and 17 historical `held`; zero `bank_candidates`. Therefore do not pretend the new dispatch/admission harness has authored or admitted content. Source location resolution does not itself grant publication. The authoring corpus contains 75 integrity holds (42 confirmed source damage, 33 render warnings), 249,360 proposed source entities, 244,845 proposed edges, and 15,316 `licensed-book-candidate` transcript links marked `unaligned-edition-candidate`. They are not a ready learner graph or aligned audio bank. Keep them private.

Arash's latest clarification governs: supplied licensed material is already reviewed/validated for this MVP; do not impose redundant teacher approval on existing licensed material. Existing authored edition metadata remains an honest historical record, rather than silently rewriting `teacherReview:pending`. Serving readiness, faithful extraction, exact media matching, exposure and runtime evidence still require verification. Generated adaptations and existing licensed originals are separate identities.

## Options and recommendation

A raw PDF/reviewer tree exposes authoring structure, private answers and source administration rather than teaching. Reject it as the learner product. A fresh full-corpus semantic/generation pipeline is disproportionate to the first complete journey and requires unapproved external/paid execution. Do not make it a dependency.

Use a bounded, source-first publication adapter: existing licensed teacher sequence and exact selected tasks become learner lessons, practice and full forms; retain the transformed 36-unit edition as compatible authored content where its media/use authority is satisfied. Keep content loading independent of Mo's UI. The same source adapter interface can later accept generated bank output without rebuilding the learner journey.

Do not flatten a unit into one opaque string or one untyped answer. Recommended immutable bundle: `bundleId/version`, edition/source revision, adapter version; track and demand branch; objective/prerequisite refs; activity/stage; public localized instruction/anchors; typed sections/stimuli/questions; explicit media references; private assessment/evaluator package; private lineage and semantic group identities; separate publication capabilities. Per-question answers belong to one unit/form attempt with ordered question IDs. All unit questions must remain answerable, selectable and recoverable.

An alternative question-level pack projection can bridge the current pilot, but only if it retains unit/form parent, ordered slots, common stimulus, group-union exposure and atomic submission. It must not accidentally call eight reading questions eight independent unseen lessons. A real multi-question unit/form DTO is the smallest robust destination.

Existing receiving runtime is insufficient unchanged: `contracts/study.py` restricts steps to reading/writing, task kinds to reading/task2, string stimulus/prompt and text draft; `services/study_state.py` is a two-task lifecycle. `study_editions.public_content_hash` currently only hashes its small allowlist. Expand explicit allowlisted public hashing to questions, option IDs/text, stimuli/media identities and locale; immutable private manifest attestation must include keys/evaluator/rubrics/lineage. Reuse `PostgresStudyRepository.pack_valid`, exact version pinning, `status/allowed_uses`, publication revocation and original/revised attempt mechanics. Preserve those checks while adding content types.

## Concrete first content catalog

For each `fnd|int|adv` use `{level}-{reading|writing|listening|speaking}-train` and `-transfer` for Academic; substitute `gt-{level}-{reading|writing}-train|transfer` for GT. That is six complete pathway skeletons with all four skills. Exact selected mapping (examples): foundation routine comprehension/controlled completion; intermediate skim/scan/paraphrase and housing comparison; advanced heading qualifiers/reference and feature synthesis; GT everyday conditions, workplace completion, long-text heading/views, letters with audience/register and full bullet development. These are actual objective IDs/teaching connections in the edition, not invented labels for unrelated content.

For immediate original listening/form use, the following bounded licensed set exists in the private corpus. Paths are relative to the adjacent resource root, never public URL paths:

| Form component | Exact source | Physical PDF pages / files | Private answers / important visual |
|---|---|---|---|
| Shared Listening Test 1 | `Cambridge Questions/Cambridge 19/Cambridge-IELTS-19-General.pdf` | PDF10–15 (four parts, 40 questions) | PDF121 keys; PDF12 map must be preserved as a selected diagram, not inferred from OCR |
| Original listening audio | `Cambridge Questions/Cambridge 19/Cambridge-IELTS-19-Audio/` | `Test1 Part1.mp3` … `Test1 Part4.mp3` in order | Stored durations 472.633469, 437.211429, 420.231837, 414.772245 seconds (1,744.84898s total); metadata measured, direct audition still needed |
| Academic Reading Test 1 | `Cambridge Questions/Cambridge 19/Cambridge-IELTS-19-Academic.pdf` | PDF16–29, three passages/40 questions | PDF121 keys; preserve matching and multi-select semantics |
| Academic Writing Test 1 | same Academic PDF | PDF30–31, two tasks | PDF30 social-centre line graph must be actual selected visual; private samples/rubric separately |
| Shared Speaking Test 1 | same Academic PDF32, equivalent General PDF31 | Three-part prompt set | International food; law long turn; school rules/law discussion. Timed speaking/recording, not a typed placeholder |
| GT Reading Test 1 | same General PDF | PDF16–28, three sections/40 questions | PDF122 keys |
| GT Writing Test 1 | same General PDF | PDF29–30, letter and essay | Study/reduced-work-hours letter; photographs at famous places essay |

Academic source SHA256 `41554091b1a953e76b0d037cdb78c175bbcc0bf3f7f3e086c78b8345f2421715`, active extraction `0e023e1f75953a58fe8382826db654f0515aaa02d58891285db12e9a9df44a91`. General source SHA256 `846ae061aeb56ee6636bd20166623bb621379b0053c451985f38b0cc12443251`, active extraction `4079497110c9e6882a06f50790347d28c2a470ece603dba00555cb4f4a2159d0`. Both are complete/source-hash-verified with zero source integrity holds in this store. Confirm exact selected answer rows visually during adapter implementation; OCR order is not reliable enough to publish keys automatically.

Audio content-addressed identities, in order: `9297b29a5f03fe7a61220ae4efe1998fe7cfcaae1a2d5d4f3e52b4d41db8753c`, `a1d2e490e8fa649ab0dce108c0ee4ccb9e173f34fa8288c8961ce4b05c2d9d6a`, `b43379f7c9d26e6e06dc8e52a9ffa66bb4bfae25823ad83cfe0d845efffac47b`, `a125a0b8de00cdbae3f877500bd0234afdaec351e007db8764e4116d09175159`. The stored metadata remains transcript-pending; filename and matching source topics support a concrete binding candidate, not proof of complete alignment. Original audio is not interchangeable with an adapted prompt/key set. Do not bind C19 audio to the C21-derived authored mock.

This single reserved C19 Test1 set supports an Academic form and a GT form with shared L/S; it does not provide two independent unseen forms to a learner switching track. Reserve its semantic groups across both tracks. Existing current-unit GT training includes C19 Test1-derived material, so such learners may use the form as timed familiar practice, not an unseen benchmark. For a fresh form, select a different complete C19 test and repeat exact question/key/media binding; no fabricated unseen label.

## Existing six mock companions: full length versus operational

They are not short drill fixtures. `academic-01-reading` has three passages of 821/860/849 words, 13/13/14 questions and a key on every question. `general-01-reading` has three sections with 14/13/13 questions and explicit keys. Both writing companions contain two tasks with 150/250-word minima and 60-minute total timing. Speaking has a real three-part prompt structure and 11–14-minute timing range. Listening has four parts of ten questions, scripts and actual curated MP3s with summed duration 1,589.690249s (~26m30), plus separately required question-reading/check pauses.

They are structurally full-form candidates; they are not yet operational mocks. Current blueprint explicitly says `not_a_full_mock`; server full-form timing, recording, playback, resumability, marking and final-audio alignment are not implemented. The authored audio is local narration/internal-test media; do not extend its use authority by relabeling it existing licensed audio. Prefer the bounded original C19 set for the first actual licensed-audio form. Public content must never show pending authoring notes, review decisions, source IDs or mock-production plans.

## Journey projection and evidence

Onboarding: capture chosen track, self-described skill strengths, target, date/hours and language. Use ordinary selected starting practice for each skill if no distinct diagnostic exists; say it is a starting profile with uncertainty. Record full stimulus exposure before returning any bytes. No fabricated four-skill band or global level from one response.

Lesson: show the current source-designed objective through a primary lesson title and substantive localized teaching blocks. AI explains the exact anchor, elicits a purposeful response, gives response-specific feedback, asks for repair, then selects a next step. Do not expose internal objective/source IDs or add decorative helper copy. Model context receives the relevant published teaching slice and actual learner work, not the corpus database or arbitrary raw pages.

Guided practice: retain all questions/options/limits, source stimulus and image/audio. Deterministic R/L marking is server-only against the exact keyed question version; preserve multi-select and accepted spelling/word limits. W/S gets criterion-specific formative feedback. Pronunciation/temporal fluency require usable actual audio; a transcript permits only appropriate text evidence. Teacherless operation must not mean unobserved recording is described as assessed pronunciation.

Repair: retain immutable original and a child revision. Feedback identifies the learner's actual error and points back to an applicable teaching anchor, then requests a specific repair. A repeated same-family answer is improvement evidence, not transfer evidence. Failed audio/AI/network submission preserves the draft and offers retry without a duplicate attempt or charge.

Independent transfer: no pre-submit anchors, hints, scripts, model answer or key. Apply both `familyId` and every semantic exposure group, across units/skills/tracks, using the union when a whole stimulus is released. Current package has 22 assessment holds; do not drop them in the adapter. Held overlap does not prevent ordinary practice, but prevents claiming a new unseen task. Opening a lesson, audio, transcript or review records exposure; returning a new version cannot erase it.

Mock: pin every section and media version; server enforces section order/timing and final submission; reconnect resumes the same timer/answers. L/R accuracy and W/S criterion evidence remain distinct. No official band claim or overall prediction from unmarked/audio-missing skills. Keys/transcripts may be available in authorized post-submit review only, and that release permanently changes future eligibility.

## Publication boundaries and acceptance

Publication is an explicit reviewed server operation producing learner bundles, not a mutation of raw authoring status. Record authorized use/territory, exact source revisions/pages/chunks, adapter transform, key verification, graph/media hashes and capability (`learner_delivery`, `model_context`, assessment scope) privately. Existing licensed-content validation is accepted; do not restart a teacher review cycle as an MVP gate. Source/OCR ambiguity, missing graphics or unaligned audio are concrete engineering tasks to fix, not reasons to delay for full-corpus reprocessing.

No source SQLite, source PDFs, full-book transcripts, answer keys, examiner comments or authoring JSON go in the frontend build. Selected original passages/diagrams/audio become authenticated learner assets with explicit exact bindings. URLs use opaque bundle/media identities, never local paths; media authorization binds learner attempt, content version and mode. Independent asset requests enforce the same publication/exposure boundary as task requests.

Acceptance before claiming the learner content loop complete:

- All six pathways contain all four skill entries and preserve every selected question, ordered option, limit, criterion and localized instruction. Track switching reuses shared L/S exposure.
- One actual learner completes baseline/lesson/guided response/feedback/repair/eligible transfer in a coherent source sequence; another profile or changed error alters the selected objective/repair with stored reasons.
- One Academic and one GT complete licensed full-length form run, including original listening audio/map, reading40, writing2, speaking3. Direct audio/form/key alignment and visual question/key checks are recorded. A 5-question drill is never labeled a full mock.
- No task, pre-submit model context, URL, cache, error or bundle hash reveals keys, scripts, raw lineage or private evaluator notes. Independent help request cannot retrieve them. Post-submit review records exposure before release.
- Hash/version mismatch, withdrawn publication, unavailable media, malformed key mapping or missing selected visual fails closed with recoverable learner state. Timers, drafts, retries and submissions survive reload; replay does not duplicate submission/provider work.
- Audio-based speaking judgment is withheld without audio; actual provider feedback is clearly distinguished from synthetic/local tests. No newly paid/external AI call is authorized by this design.

Unavailable evidence: no audio audition, visual key reconciliation, learner-serving adapter, fully timed form execution or actual provider learner feedback was run in this design task. No release verdict follows from this checkpoint.

## Coordination and next action

`learner_journey_intake` confirms baseline can be ordinary starting practice with uncertainty, provided exposure is recorded; profile time/targets plus objective error evidence must materially affect plan/repair. Coordinator owns architecture choice and permission to implement. `learner_mvp_backend` independently recommends a `licensed_curated` adapter, typed multi-item tasks (`reading_items`, `listening_items`, `academic_task1`, `gt_task1`, `task2`, `speaking_turn`) and response unions including choice, short text, multi-select, matching, essay and recording, with catalog/assessment/policy/family pinned per attempt. This matches the recommended destination; question-level bridging is not the full-form architecture. Original licensed content must retain `licensed_curated` identity rather than falsely claiming `source_based_original`. Next work after approval: extract a bounded licensed C19 Test1 serving bundle with exact keys/media/visuals; map a representative source-based four-skill lesson loop through the expanded receiving runtime; independently validate it before scaling coverage. Existing corpus harness remains a replaceable future authoring input, not a blocker.

## Implementation checkpoint — assembled private learner catalogue

Coordinator approved implementation in `CHECKPOINT-LEARNER-MVP-2026-11-07.md`. The earlier design stop is superseded for the owned adapter work. Source originals and private SQLite were read only; no serving DB, provider, environment, deployment or account changes were made by this specialist.

Implemented:

- `platform/backend/app/contracts/learner_content.py`: strict public task/section/question/asset/anchor models; typed choices, text, essay and spoken responses; explicit public table columns/scalar rows; rejects hidden fields and duplicate identities.
- `platform/backend/app/services/learner_content.py`: independent `LearnerCatalog(root, expected_hash)` exposing `catalog_hash`, `root`, `list_tasks`, `metadata`, `get_task`, `assessment`, `lineage`, `asset`. `metadata`, assessments and lineage are server-private selection/evaluation APIs. Public HTTP must use its own summary allowlist. `get_task` is the strict learner projection. Exact file inventory, no symlinks/traversal, canonical content-addressed asset paths, bounded sizes, task/catalog hashes, real MIME signatures and every deterministic item/key/group binding are checked. Asset bytes are rechecked on access.
- `platform/backend/scripts/prepare_learner_catalog.py`: offline assembly from frozen unit hashes and a private, visually checked original-source seed; source file/extraction/hold checks; selected-page rendering and accessible extracted text; exact audio copies; no raw book or answer-page assets. Uses the existing backend Python environment plus a local `python3` with PyMuPDF for rendering. No package installation or network needed in this run. Writes private 0700 directories / 0600 files and refuses overwriting a different artifact.
- `platform/backend/tests/test_learner_content.py`: 17 focused boundary/contract tests.

Final assembled root: `/Users/arashshahrokhi/Projects/mitooni/app/review/learner-mvp-20261107/catalog`. Canonical catalogue SHA256: `4f96e87d94e9188c76287a28c6a5201eee8b201a7a0098a9e8d69a5cb44569f9`. There are exactly 54 deployable files: `catalog.json` and 53 listed content-addressed media files. QA renders and private `verified-seed.json` are siblings outside this deployable root. Originals, source database and old review edition are unnecessary at runtime. The deployment specialist has this freeze; changes require a new hash/rebuild.

Counts: 42 available tasks, 301 response slots, 53 assets. The 36 source-based units retain 174 prompts. The six original licensed form components contain 40 Listening + 40 Academic Reading + 40 GT Reading + two Academic Writing + two GT Writing + three recorded Speaking part responses = 127 slots. Both tracks have four train and four transfer skill entries in each of the three branches, plus four full-form skill components (shared L/S). Task IDs for the original set are `c19-01-listening`, `c19-01-academic-reading`, `c19-01-general-reading`, `c19-01-academic-writing`, `c19-01-general-writing`, `c19-01-speaking`.

The original receptive tasks retain complete selected-page text and exact page images, including complete instructions, passages, question groups, options, map and visual context; typed item identities and answer inputs sit alongside that material. Some original table/completion item labels refer to the numbered blank in the complete source section rather than pretending every source layout was converted into a standalone question card. Source choice-letter options remain tied to their complete source option text. This is a bounded task display, not a whole-book reader or reviewer JSON tree.

Arash's internal-testing clarification was confirmed by the coordinator: the six existing temporary MacTTS unit narrations may serve this same private learner preview to the three authorized teachers. They are available in the catalogue with temporary narration/internal purpose provenance retained privately. This does not extend their authority to production/public learners. Original Cambridge audio is used for the full listening practice form; no audio was bound to changed adapted scripts. Existing licensed validation is accepted; no redundant teacher review was imposed. Existing historical author review metadata remains private.

Timing/assessment honesty: Listening uses an explicit fixed 30-minute practice window around the actual 29m04.849s original audio, with no claim that it implements an independently verified official computer checking/paper transfer rule. Speaking title is `Recorded speaking practice · Test 1`; it is a three-part recorded source-based rehearsal, not a live examiner interview. No calibrated/official band or unsupported overall score is produced by this catalogue. Full writing task 1 and task 2 carry separate private `questionCriteria` descriptions for the appropriate task demand.

Semantic identity: source-unit activity groups/overlap holds survive privately. The original GT reading/writing set deliberately shares group identities with derived C19 Test1 training (`cg19-t1-*`), so changing wrapper/family/track cannot make already released source meaning unseen. Backend confirmed it compares group unions. Full-stimulus releases consume the union; source reading, key or transcript release cannot restore eligibility. Original answer pairs have explicit `answerGroups`, including order independence and distinctness, rather than accepting the same correct letter twice.

Checks actually run:

- `platform/backend/.venv/bin/python -m pytest -q platform/backend/tests/test_learner_content.py platform/backend/tests/test_learner_policy.py`: **28 passed** (17 owned adapter tests plus 11 policy tests).
- `py_compile` of the three owned Python implementation files: passed.
- Actual catalogue load with the final expected hash: passed; validates exact file inventory, every asset digest, task public hash, question/option/key identity and group policy.
- Actual catalogue coverage probe: both tracks × three branches have train/transfer in all four skills; each track exposes exactly four full-form skill components.
- Actual source keys through the receiving `learner_policy.mark`: all 40 answers correct on each of Listening, Academic Reading and GT Reading. Reversed paired letters still yield 40/40; duplicating the same valid letter in the first pair yields 39/40. These are private extraction/marking checks, not learner performance claims.
- Full decode with local `ffmpeg -v error` of all four original C19 Test1 MP3s: each returned zero with empty stderr.
- Direct visual inspection of rendered original answer pages Academic120/121 and General121/122: all key rows reconciled, including any-order pairs and authored alternate spelling. Inspected General12 map, Academic30 graph and Academic32 Speaking source; selected-page PNGs retained in the private QA sibling. Map gets a spatial text alternative; graph gets clearly approximate plotted-point text alternative alongside the actual graphic. No answer-page PNG is in the candidate inventory.
- Public projection canary on every actual task: no `answerKey`, `privateScript`, source path or source-hash field is returned. Negative synthetic tests reject injected public scripts/table keys, unknown assets, changed bytes, unsafe inventory, wrong publication/hash and missing/doubled item keys.

Remaining evidence is owned by integration/independent review: browser usability of the complete original page+item composition, full timed session/reconnect, recording capture and genuine audio/provider feedback, authorized-account HTTP isolation, screen-reader/keyboard journey and final hosted deployment. This specialist did not audition all audio or claim an official live examiner mock. No go-live verdict is implied. Current content checkpoint is assembled and available for integration, not a static review panel or future-generation plan.
