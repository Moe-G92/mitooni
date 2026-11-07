# Independent frontend review — 7 November 2026

Status: intake/evidence; reviewer owns this record and ignored synthetic probes only.
Reviewed scope: teacher content review beta in Mo's authoritative web interface; local synthetic authentication and real controlled local PostgreSQL. No publication, actual microphone, real learner data or external model/provider calls.

## Preflight

1. A professional reviewer would challenge ownership changes during asynchronous work, private answer/media exposure before permission, retry duplication and keyboard/RTL access using actual browser journeys as well as source. These are necessary foundations of the assigned review, not added product scope.
2. Raw material is the actual 27-file source inventory, its source and tests, current HTTP responses/browser DOM, and actual captured pixels. Author reports are leads, not independent evidence.
3. Use SHA-256 verification, source tracing of session/media/attempt transitions, fresh Playwright local browser probes, bounded axe scans if locally available, keyboard navigation, responsive measurements and direct screenshot inspection. Keep fixtures synthetic and preserve shared database state.
4. Independent evidence is reproducible browser outcomes, HTTP results, exact hashes and axe/DOM measurements, with fixtures versus real local services explicitly distinguished. Hosted Iranian network/provider evidence is unavailable in this assignment.

## Revision

Base Git HEAD: `2a0191e6274af6443da5207d461c7902e77d10c1`; working tree has substantial pre-existing edits. Review is bound to inventory `review/frontend-review-source-20261107.sha256`, digest `a3399fca4534efd7f131338ede4897253526fe238d82e1ebc1d471d2310d3c0a`. All 27 entries independently verified OK before review. Backend canonical revision supplied by coordinator: `85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095` (not independently recomputed by this frontend reviewer).

## Independent evidence and outcomes

Actual local browser, synthetic reviewer, real HTTP to controlled API/PostgreSQL:

- Profileless synthetic reviewer deep link reached the review route after sign-in without learner onboarding. Catalog showed 44 actual targets with human titles/levels. Academic Writing displayed Task 1/Task 2; Speaking displayed Part 1/2/3 rather than backend numeric identifiers.
- Housing writing task and catalog captured at 360, 768, 1280 and 1920 in English and Persian. Housing task document overflow was false at all eight combinations. Captures are in ignored `review/frontend-independent-20261107/`; both eight-image contact sheets were visually opened. Actual 360px Academic Writing semantic-table crop was also opened: 1990/2000/2010 and 65000/85000/80000 remain intact, row labels wrap without splitting numbers.
- Local axe-core (existing CLEW installation, no installation/network download) scanned actual catalog, housing writing task, Speaking mock, and revealed Academic Writing at WCAG 2 A/AA, 2.1 AA and 2.2 AA tags: zero violations on each bounded scan. This is automated rule coverage, not a claim of complete WCAG certification.
- Keyboard focus progressed through Catalog/Platform, export, Filters, native selects; all observed focus outlines were visible (2px). Native disclosure responds to Enter. Account menu dismissed using Escape; keyboard Enter on Sign out completed signout and removed prior task. English exam text remains English/LTR inside the Persian shell; forms have associated labels and the task heading receives route focus.
- Existing actual private housing image was served as a blob URL after authenticated fetch. A temporary URL-revocation observer confirmed that exact blob URL was revoked on keyboard signout and its image disappeared. Browser was then closed, removing instrumentation.
- Actual pre-reveal Reading GET returned 200 to the synthetic reviewer, with `privateContent=null`, `revealedAt=null`, no answerKey in task. Synthetic learner A and read-only identity received 403 `review_denied` for the same endpoint. No customer identity or content was used.
- Invalid WAV file selection in the real Speaking mock produced the Persian PCM WAV format/rate/duration/size recovery message. No microphone permission requested and no recording uploaded by this reviewer.
- Fresh browser route challenge intercepted only the synthetic `fnd-reading-transfer/draft` mutation before HTTP delivery: first 503, then 409. The first response produced explicit unknown-result recovery and disabled the response field; Retry sent exactly the same serialized body and Idempotency-Key (two intercepted requests); 409 preserved edits with copy-before-reload guidance; Load saved version restored the unchanged empty real draft. No review mutation reached PostgreSQL. Routes were removed afterward. Console HTTP errors in this probe are expected injected 503/409 responses, not unexplained runtime faults.

Fresh actual-source module probes (synthetic transport/capture environment; no provider/database), reproducible by `browser_run_code_unsafe` with `review/frontend-independent-20261107/boundary-probe.js`: five passed. Wrong media SHA rejected; foreign asset URL rejected before transport; oversized stream cancelled; cancelling before synthetic microphone permission resolves stopped the late-arriving track exactly once and closed context; an editorial operation prepared for A was rejected before transport after a session change to B. The durable probe was executed separately after initial exploratory checks and again passed 5/5.

Source lint command: `node /Users/arashshahrokhi/.codex/skills/design-taste-frontend/scripts/lint.mjs --app web/src/account/review` → 0 FAIL / 1 WARN. Warning is `padStart(2,"0")` in cryptographic hexadecimal digest generation; this is required byte encoding, not decorative UI numbering. The standalone inspector was not run against a misleading unauthenticated redirect: these synthetic sessions deliberately do not persist into its fresh browser. An attempt to import its measurement modules in the connector hit `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`; actual authenticated screenshots, DOM overflow, axe and keyboard measurements above were used. No claim of a successful standalone inspector run.

## Source challenge

Traced actual integration, session ownership and response schemas rather than accepting author summaries:

- Review route bypasses learner-profile Gate but checks authentication; content/review APIs enforce independent reviewer permission. Epoch-keyed review subtrees and guarded transport capture/assert discard former-account work.
- Mutation operations clone body once and retain exact owner, key, package hash, target hash and revision; uncertain mutations freeze further work and retry the same operation. Conflicts retain local edits until explicit reload. Dirty answer/editorial state disables return-to-catalog until saved/discarded. This is in-page protection; browser/tab closure can still lose unsaved edits, as with the existing application.
- Strict Snapshot validation rejects unknown projected fields, pre-reveal private content, duplicate/unknown question bindings, mismatched target/revision and inconsistent submitted/revealed states. Private content is inert React text, not HTML evaluation.
- Media paths are canonical receiving paths bound to target/package hashes; redirect handling is error, request credentials omitted, cache no-store. Actual bytes have type/signature/SHA checks, bounded reads, owner assertions and abort handling before blob creation. Disposal revokes object URLs on unmount/account change.
- Recorder lifecycle uses ownership counters and WavCapture generation invalidation; late permission streams stop without attaching nodes. Audio capture is bounded and cancellation/stop closes tracks/context. Speaking preparation validates actual section/task membership and permission, copies/revalidates WAV bytes, and records immutable bindings/owner/key. Playback rechecks WAV, size/duration and SHA. Evidence timestamps are explicitly model-estimated/unverified and feedback remains qualitative rehearsal, with typed rehearsal pronunciation excluded.
- No new dependency or model/provider path was introduced by this review. The owner-reported 122-test/type/lint/build results were not relabelled as independently rerun evidence; this review used its own boundary and browser challenges instead.

## App-screen critique (Mo identity retained)

Screen questions: catalog “Which task should I review?”; detail “What does this exact task ask, and what did I observe before seeing notes?” The Mitooni mark, existing Persian type and Midnight Iris/Deep Wisteria tokens remain visible; no style draw or redesign is appropriate under the authoritative Mo instruction.

1. Catalog title/list and detail task are largest/read first. The frequent Open action is present per row; blind response/reveal actions are primary workflow controls.
2. Main panels share the canvas edges. Desktop detail uses two columns; mobile stacks complete task before response. No clipped screen or accidental dead strip observed. Long revealed teacher source is deliberately long, not an empty panel.
3. Colour remains the existing Mo brand on headings/actions, with quiet white surfaces and neutral metadata. Existing tokens/radii/borders are preserved rather than imposing generic skill prohibitions.
4. Catalog count is rendered from filtered targets (44 initially). Housing source values and semantic Academic Writing figures are legible and consistent with adjacent descriptions. No invented KPI or band estimate.
5. Empty submission fields are empty; absent private notes have an explicit deliberate reveal action. The count has its task/content noun.
6. The source-derived table is the actual task object; numbers are right aligned and use tabular figures. There are no ambiguous chart legends.
7. Phone navigation stays compact and task/response controls stack without horizontal page scroll. Required exam instructions and reveal exposure notice remain, rather than being removed as “helper text”.

Top remaining observations are non-blocking within this internal teacher-review scope: long English prompts repeat beside response fields to provide complete accessible names; a revealed source document can require substantial scrolling; the 360px raster housing table relies on the adjacent full textual values for comfortable reading. These are not redesign requests or claims of a failed control. No material frontend/security/accessibility defect found in reviewed scope.

## Review checkpoint decision

Agreement: reviewed frontend scope is suitable for the **local controlled teacher-review beta checkpoint**, on the exact inventory above. No material objection remains from this independent frontend review. This is not APPROVED FOR GO-LIVE, publication, hosted deployment, assessment calibration or legal/business clearance. Original task/user scope remains internal testing/evaluation narration only; OpenAI TTS replacement and Realtime design remain separate later work.

Unavailable evidence: real microphone/device diversity, external model/provider operation, hosted Iranian access/latency, production auth/deployment, full teacher/examiner content validation and complete WCAG manual audit. Existing synthetic worker/PG recording evidence belongs to the author's report; not independently replayed or erased here. Shared controlled database, Academic Writing revision 4 and the two synthetic recordings were preserved.

Restart: retain processes owned by backend/frontend authors, rerun inventory checksum after any source changes, then rerun targeted independent probes for affected paths. This reviewer changed only this report and ignored review evidence. Stop at independent-review checkpoint; coordinator owns integration and engineering verdict.
