# Content review beta backend — 6 November 2026

Owner: review_beta_backend, gpt-6.1-sol / medium. Source: `2a0191e6274af6443da5207d461c7902e77d10c1`, existing feature checkout; direct Arash scope, no Lumi handoff. Checkpoint: DESIGN, awaiting coordinator approval. Explicitly read root and application AGENTS, CHECKPOINT-TUTOR, current content contracts/pipeline and PostgreSQL/account/auth source. Existing uncommitted work is preserved.

## Preflight

1. A professional would distinguish blind response evidence from after-key commentary, lock revocation against replay and writes, and pin every decision to the actual canonical content reviewed. A teacher beta cannot silently become learner publication or calibrated assessment.
2. Raw materials are actual 36-unit manifest and companion JSON, pipeline canonicalization and loader, verified identity dependency, PostgreSQL grants/RLS and transaction patterns, synthetic local identities, source SQL and tests. Existing prose reports are leads only.
3. Use existing `get_current_user`, exact trusted configured package loading, explicit allowlist projections, bounded strict Pydantic inputs, PostgreSQL owner/assignment locks, CAS and idempotency, real isolated PostgreSQL tests plus HTTP denial/error probes. No provider or production call is required.
4. Independent evidence is tests reproducing cross-reviewer denial, self-assignment denial, revoked-replay denial, stale package/unit rejection, private-field exclusion before reveal, durable submitted attempt and reveal timestamps after restart, conflict/retry handling and absence of publication writes/browser grants.

## Observed foundations and reuse

The existing identity dependency verifies bearer credentials against a configured issuer; it intentionally grants no role. Account repository binds issuer/subject using server configuration and RLS. Study repository serializes member authority before state/replay; reuse those receiving-project patterns without copying source corpus. Existing content loader validates exact units and companions but companion bodies are free-form, so blind projection must explicitly construct fields by each known mock shape. All content remains server-only. Existing HTTP classifier excludes the proposed route and needs its narrow extension (coordinator approval requested).

## Design proposal

Separate reviewer authority and state from learner work. Admin-only `content_review_assignments` uses product, issuer, subject, exact package hash, active/revoked status and fixed `review:use`; API has SELECT plus UPDATE of a harmless lock column only, no INSERT/DELETE/status/scope grant. Each transaction locks assignment before reading replay/state. Owner-scoped state stores independent target records with revisions, typed rehearsal draft, immutable blind submission, explicit reveal timestamp, review dispositions/comments, and operation replay. Reviewer cannot author roster, impersonate another reviewer, or publish learner content. Export includes only this verified reviewer's records, exact hashes and provenance. No approval field in these endpoints is consumed by learner publication.

Trusted startup config supplies root Path and expected canonical package hash. Use `load_package` then compare exact expected hash, and revalidate on requests to detect changed files; mismatch fails closed before replay/write. API never accepts a path. GET catalog reveals metadata only, not tasks/keys/scripts. Target GET returns allowlisted task projection and own state. Reveal is an explicit mutation; it persists a timestamp even without blind attempt, labels subsequent response evidence exposed, and only then returns private target material. No fake audio/recording or grading. Listening blind mode hides transcript and reports media pending; Speaking draft is typed rehearsal, pronunciation unavailable. Review syllabus/blueprint available via explicit reveal and same version-bound comments.

One state row per reviewer+package+target bounds data per target and prevents package-sized responses/replay. Each mutation includes `packageHash`, `targetHash`, `expectedRevision`; UUID `Idempotency-Key` and `X-Expected-User-Id` match existing account mutation guard. Operation hashing binds action/target/body. Revocation and hash checks precede replay; changed body/key conflicts; accepted retries return original response with current authority. Revision starts 0; first write becomes 1. Saving after submission is denied; review comments editable via CAS after reveal.

## Exact API proposal

Prefix `/api/content-review` (private, no-store; sanitized errors).

- `GET /catalog`: `{packageHash, title, targets:[{id, targetHash, version, kind:'unit'|'mock'|'syllabus'|'mock_blueprint', title, skill:null|string, examTrack:null|string, stage:null|string, deliveryStatus:'text'|'audio_pending'|'recording_pending'|'document', revision, revealed, submitted, decision:null|'comment'|'changes_needed'|'ready_for_editor'}]}`. No arbitrary teacher approval semantics.
- `GET /targets/{id}`: `{packageHash,targetHash,target:{metadata as above},revision,draft:{answers:[{questionId,text}]},submission:null|{answers,submittedAt,conditions:'blind'|'exposed_typed_rehearsal'},revealedAt:null|string,task:{instructions:string|list[string],sections:[{id,title,text:null|string,questions:[{id,prompt,responseType,options:[{id,text}],wordLimit:null|int}]}]},review:null|{decision,comment,itemComments:[{itemId,comment,decision:'comment'|'changes_needed'|'ready_for_editor'}]},privateContent:null|object,limitations:[string]}`. Before reveal `privateContent` null. `task` constructed allowlist per source shape. Syllabus/blueprint task empty; explicit reveal opens actual document.
- `PATCH /targets/{id}/draft`: body `{packageHash,targetHash,expectedRevision,answers:[{questionId,text}]}`. Return target snapshot. Answers at most 100, each <=20,000 chars, total <=100,000; known IDs only; mocks writing/speaking use task/question identifiers.
- `POST /targets/{id}/submit`: body `{packageHash,targetHash,expectedRevision}`. Freeze current typed draft; no mark/band. Return target snapshot.
- `POST /targets/{id}/reveal`: same body. Persist deliberate exposure, return target snapshot with full exact target source under `privateContent`. Does not backdate blind submission or require pretending media exists.
- `PATCH /targets/{id}/review`: body `{packageHash,targetHash,expectedRevision,decision:'comment'|'changes_needed'|'ready_for_editor',comment:string,itemComments:[{itemId,comment,decision}]}`. Require reveal. <=100 item comments, <=4,000 chars each, combined <=40,000; known item IDs or unit root only; plain text.
- `GET /export`: `{schemaVersion:1,packageHash,reviewerId,exportedAt,records:[{targetId,targetHash,revision,submission,revealedAt,review}]}`. Own/authorized only; no drafts, no other identities, no automatic approval import.

All mutations return sanitized 403 for assignment denial, 409 for revision/key/stale hash conflict, 422 for bounded input/unknown IDs, 503 for invalid/unavailable configured content/storage. Unconfigured hosted composition omits routes (failclosed); configured repository must match account target and auth issuer. Request middleware bounds total body at 512 KiB, including absent/false Content-Length using ASGI receive counting, with private sanitized 413. Typed text always inert frontend text.

## Alternatives and acceptance

Rejected public static bundle and frontend role switches because they leak keys and do not establish authority. Rejected routing through study repository because review is not learner entitlement, exposure or publication. Bounded reviewer state reuse is smallest robust change; normalized per-answer history is unnecessary beyond frozen submission and durable reveal/review revision here.

Implementation owns new review contracts/service/repository/router/SQL/tests, narrow main/composition/local serve integration. Request ownership additionally for `app/http_security.py` and additive separate local reviewer identity provision; avoid modifying existing local identities or resetting data. Hosted SQL is a reviewed artifact only, not executed. Local upgrade computes final package hash and inserts synthetic reviewer identity/assignment additively; existing assignments/status never overwritten. Current package is being edited by content authors, so seed must happen only after coordinator freeze.

Acceptance: focused pure projection/state tests; actual PostgreSQL grants/RLS/CRUD/CAS/replay/revocation tests; HTTP auth/route/body/error/no-store tests; regression backend suite. No evidence yet, no implementation begun. Stop for design approval.

## Implementation and owner validation checkpoint

Coordinator approved the proposal and narrow HTTP security extension. Implemented the specified endpoints, trusted explicit receiving composition, separate synthetic reviewer verifier and additive seed, bounded strict inputs, current assignment locks, per-owner/package advisory serialization, canonical package/target hash binding, frozen submission, deliberate reveal, editorial comments and own export. Every request reloads validated server-only source; altered package blocks reads and replay. No API can assign reviewers or publish content. Assignment remains independent from learner membership/profile. No real reviewer or learner was provisioned.

API amendments coordinated with frontend: metadata `pathwayIds`; section `instructions`, `minimumWords`, and `table` (explicit null except safe normalized candidate tables); every question has `instructions`. GT section texts and letter bullets, Academic table data and Speaking cue-card/Part 3 prompts survive blind projection. Source scripts, answers, interviewer guidance and teacher rubric remain absent before explicit reveal. Blind labels record this app's reveal state only, not a claim of unseen content elsewhere. Target export also includes exact `targetVersion`; evidenceKind is reviewer_editorial_feedback and learnerPublicationAuthorized is false.

Actual checks: `.venv/bin/python -m pytest -q tests/test_content_review.py tests/test_content_review_http.py tests/test_http_authority.py tests/test_receiving_composition.py`: **120 passed**, inherited Starlette/httpx test-client deprecation warning. Synthetic pure checks cover projection, source-shaped mock projection, submission/exposure, input/identity guards, hash/CAS conflicts and no approval decision. Actual ASGI checks cover hidden configuration, authentication, sanitized validation/errors, expected-account guard, no-store, and actual streamed 413 with omitted/false Content-Length.

Coordinator provided exclusive PostgreSQL window; `.venv/bin/python -m pytest -q tests/test_content_review_postgres.py --local-postgres`: **5 passed**. Additive schema applied to isolated local DB, random reviewer rows only, then cleaned own rows. Actual receiving API role cannot insert assignments or change status; own RLS and browser zero grants verified. Durable state survives new repository/connection; exact retry, changed-body conflict, frozen blind submission, reveal and review/export tested. Revocation blocks reads/export/exact replay; two concurrent same-revision reveals produce one revision 1 and one conflict. No reset, restart, browser fixture/profile mutation, provider call, production schema or external action. Window closed. This proves actual local SQL behavior, not hosted execution or actual teacher review.

The broad non-PG suite at an earlier moving content snapshot had 276 pass / 68 skipped / 3 failures in other owners' stale asset expectations (Academic table percent versus people, GT text counts, GT register). Coordinator and mock reviewer notified; no other owners' files changed. Read-only actual package load was unavailable while authors updated manifest/source dependencies. Local full-content seed and browser integration await frozen canonical hash.

Remaining: independent backend/security review, final content freeze + exact-hash seed, browser integration, hosted configuration and actual authorized human invitation. No APPROVED FOR GO-LIVE claim.

Owned reviewed source inventory (documentation itself excluded):

```text
3b0efe4ca9a33b73ff62af2848f2f3ca0d889e206b78524d2f2a68ec0847245f  platform/backend/app/composition.py
141d87b30ace0acbbbccabf49c3ccf64d65ff9b872ea25a08c708a1685a0e7cf  platform/backend/app/contracts/content_review.py
6cb1445e47a0bcacb88e0580a0b95aa2fdae3fca0e110019f4ee9538191a3b4d  platform/backend/app/http_security.py
5cce39ab86efeb2ab08b22b0aa291d7645648d83e564fa59efddb21b27d3554a  platform/backend/app/main.py
71610fbf385dfd1d766006224724e8d8513a80f7e8a84112f8f34526ae121b0e  platform/backend/app/repositories/postgres_content_review.py
65e0416aadcca3358edb719cd0ccc851e7fc15f006e7e73b2f4e39eb7849852f  platform/backend/app/routers/content_review.py
3d6e1154ff739611517da6049c97bb919ea68b233d589891966f0831e9a5c39a  platform/backend/app/services/content_review.py
8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9  platform/backend/deployment/content-review-schema.sql
8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9  platform/backend/local/content-review-upgrade.sql
efbb3e4b11e7566dd90f0bb1ea86c91b14a2779ac45f2a9218bc0f677038a7a7  platform/backend/local/review_fixtures.py
859503b8116c77cf5cca903a0e6f60b82358daa256813c791f61c50f6652c58a  platform/backend/local/serve.py
b8b60446f27c0905d7df36bf1c90518826d45b8e907c9baf49683e0aa432d5ef  platform/backend/local/upgrade_content_review.py
4de816b95273aa3fcdb32a99439cb3faff6c58c8263756dfb9d3c10e93923327  platform/backend/tests/test_content_review.py
4b3fd0285662fa01c5dfa0dc072d628271a8f02d65d2d4e9469082dd4adcec32  platform/backend/tests/test_content_review_http.py
34cc11a5305d28fff32cf06d2a8a9825a1fcfa6b681b8cdc19798c577c97b8a3  platform/backend/tests/test_content_review_postgres.py
```

15-file review set SHA-256: `ce7b73a88abd3c6d969322c3bbd3dbe3ab29b9d1829705530f1f2f892af02f57`. Changes after this snapshot require revalidation.

## Activity media extension — design checkpoint

Coordinator authorizes target-bound authenticated PNG/audio assets in reviewer beta, preserving current auth/reveal/publication boundaries. Current preflight refinement: a professional prevents source-PDF publication, stale-tab asset substitution, active SVG origin execution and hidden transcript/answer disclosure in metadata. Raw material is actual media spec/rendition hashes, canonical source content bindings, curated immutable bundle, current assignment transaction/RLS and actual HTTP responses. Methods: reuse media worker's registry parser/config (no parallel parser), bind registry to exact current canonical package and target hash, verify bytes on read, allowlist PNG/MPEG/WAV only, construct own API URLs and bounded full binary response. Independent proof: synthetic PNG/MP3 HTTP tests demonstrate wrong-owner/revoked/stale-hash/missing/tampered denial and private/nosniff headers; actual source bundle integration independently reviewed later.

No edits to main/composition/http_security/local serve: now speaking_runtime-owned. Planned `ReviewPackageConfiguration` gets optional registry configuration; every load validates existing source package then asks registry to bind exact package/hash. `task.assets` always exists, empty without registry. Asset URLs carry exact packageHash/targetHash queries and accept asset ID only. Repository fetch first loads trusted current content, locks assignment, checks caller hashes/target membership, obtains verified allowed rendition bytes while authority lock held, then returns full response. No raw filenames, raw corpus URLs, provider calls, user uploads or SVG. Metadata title/alt must be candidate stimulus only; Listening scripts remain hidden until explicit reveal. Audio readiness is distinct from pronunciation/recording readiness. Runtime registry contract is owned by activity_media and curated bundle preparation by content_pipeline, pending their exact interfaces. No implementation of an alternate parser authorized.

## Activity media implementation and final owner checkpoint

Coordinator resolved one canonical runtime authority: existing ReviewPackageConfiguration(root, expectedPackageHash), final package.assets from pipeline load_package, and activity_media's sole bind_package_assets helper. No secondary manifest config or duplicated parser was adopted. Registry verifies target/spec/byte bindings; repository reads verified bytes while current assignment lock is held; full binary Response avoids reopening a file after checks. PNG, MP3 and WAV only; no SVG route, original source files, arbitrary path or public static fallback. Size limit 32 MiB is enforced by registry before reading and checked again before response. Range requests return sanitized 416 after assignment/hash validation.

Every projected task includes assets:[], or sanitized metadata with own relative /api/content-review/targets/{target}/assets/{assetId}?packageHash=...&targetHash=... URL. Returned fields are id,kind,mediaType,sha256,width,height,alt,url; audio uses safe generic alt, never transcripts. Listening media readiness becomes audio_ready only with actual registered audio; blind projection still excludes script/key. Speaking limitation now says typed rehearsal cannot establish speaking ability and recording availability is separate. At speaking owner's request repository projects task.speaking only for Speaking: current DB permission review:speaking-evaluate and explicitly validated server runtime flag determine permissionGranted/available, including replay; neither affects canonical content hash. Speaking owner owns additive schema permission expansion and main/composition/http_security/serve seams.

Coordinator explicitly limited teacher review targets to unit/mock/syllabus/mock_blueprint (44 for this edition). source_index/media_catalog/corpus_lineage remain canonical hash-bound internal validation inputs and are not independent browser targets. This overrides pipeline's earlier all-companion teacher-view proposal. Unit/mock revealed provenance remains inspectable.

Final focused command: .venv/bin/python -m pytest -q tests/test_content_review_assets.py tests/test_content_review.py tests/test_content_review_http.py tests/test_http_authority.py tests/test_receiving_composition.py: **129 passed**, inherited Starlette/httpx deprecation warning only. New self-contained valid PNG and synthetic silent MP3 fixtures exercise actual HTTP binary body/MIME/private/nosniff/no-range behavior; wrong owner, revocation, stale package/target hashes, cross-target/missing asset, spec/byte drift rejection and bytes changed after registry construction. The ordinary HTTP asset suite uses a synthetic assignment adapter plus real config/registry/repository asset method; it does not claim RLS itself.

Second coordinator-approved exclusive DB window: .venv/bin/python -m pytest -q tests/test_content_review_postgres.py --local-postgres: **6 passed**, including actual HTTP PNG+MP3 through actual receiving PostgreSQL current assignment authority/locks and real registry. Cross-owner 403, stale package 409, cross-target 404, revoked 403 and private/nosniff headers passed. Additive schema + random fixture owner only; own rows cleaned, no reset/restart/profile changes. Window immediately closed and speaking owner notified. No subsequent DB changes or tests were run.

Independent review and final frozen actual edition/browser integration remain pending. Hosted execution, live provider calls, human content review and learner publication have not been performed. Source record below covers review-owned files only; shared seams now belong to speaking_runtime and media/pipeline code to their specialists, so previous aggregate is superseded for this narrowed scope.

```text
141d87b30ace0acbbbccabf49c3ccf64d65ff9b872ea25a08c708a1685a0e7cf  platform/backend/app/contracts/content_review.py
222d4a293ff4f03005d740b279d64c963e91167c563798b23a401f9b8f0f9c46  platform/backend/app/repositories/postgres_content_review.py
abc4b06fb78b33793a19f6dcad5d9969f1894141228679c78e5e676616d796b0  platform/backend/app/routers/content_review.py
67a57755a918549b9356df4493a0bf978878a6114c04e819332f36e65f0f1b04  platform/backend/app/services/content_review.py
8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9  platform/backend/deployment/content-review-schema.sql
8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9  platform/backend/local/content-review-upgrade.sql
efbb3e4b11e7566dd90f0bb1ea86c91b14a2779ac45f2a9218bc0f677038a7a7  platform/backend/local/review_fixtures.py
b8b60446f27c0905d7df36bf1c90518826d45b8e907c9baf49683e0aa432d5ef  platform/backend/local/upgrade_content_review.py
e72e966e4debf83c66bd64f70d1a43f2f82745ee74f11c838828645b62a50ef7  platform/backend/tests/test_content_review.py
efcb1466494f93047436c4529f0b19dfa7d6421f0c7de454cd57e6db9782ac18  platform/backend/tests/test_content_review_assets.py
4b3fd0285662fa01c5dfa0dc072d628271a8f02d65d2d4e9469082dd4adcec32  platform/backend/tests/test_content_review_http.py
81e86013208ee4efee6c82f4f9d71e906fa51bff92e5cac156876ec6b327d4a5  platform/backend/tests/test_content_review_postgres.py
```

Review-owned 12-file SHA-256: `e27e1e4c0b2068763d19dc6589d6698ce24fedab44ccd8eb29ff0933ad979e48`.

## Actual local browser bootstrap — 7 November 2026

Coordinator assigned bootstrap of frozen edition for frontend actual HTTP/PostgreSQL browser journey. No runtime service implementation changes made in this task. Canonical configuration:

- Edition root `/Users/arashshahrokhi/Projects/mitooni/app/review/content-20261106/editions/85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095`; expected package hash `85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095`.
- Existing dedicated database/container/volume `mitooni-account-20261105`, loopback PostgreSQL `127.0.0.1:55439`, database `mitooni_local`. Initial direct connection sandbox-denied; approved escalation then showed connection refused. Docker daemon socket was unavailable; after reversible Docker Desktop launch, existing correctly labelled container was found exited. Hosting worker confirmed no custom endpoint/PG mutation or conflicting workload. Started that existing container, retaining its volume; no reset, restart, initialization or global seed.
- Synthetic reviewer only: UUID `00000006-0000-4000-8000-000000000000`, backend selector `local-reviewer`. This is not a real credential. Existing frontend account-local fixture mapping is owned by frontend; no learner profile/onboarding was added.

Commands from `platform/backend/`, explicitly authorized local DB access:

```text
.venv/bin/python -m local.manage start
.venv/bin/python -m local.upgrade_content_review --package-root /Users/arashshahrokhi/Projects/mitooni/app/review/content-20261106/editions/85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095 --package-hash 85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095
.venv/bin/python -m local.upgrade_speaking_review --package-root /Users/arashshahrokhi/Projects/mitooni/app/review/content-20261106/editions/85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095 --package-hash 85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095 --grant-synthetic-speaking
.venv/bin/python -m local.serve --review-package-root /Users/arashshahrokhi/Projects/mitooni/app/review/content-20261106/editions/85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095 --review-package-hash 85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095 --speaking-synthetic
```

Observed: local package validation passed 44 targets in 0.309s. Additive review schema/assignment and Speaking schema/explicit synthetic permission commands passed. Loopback API `http://127.0.0.1:8009` started in execution session `57263`, process `46020`. Actual HTTP catalog returned 200, exact frozen hash and 44 targets. Sample Reading/Listening/Speaking/Writing target GETs all returned 200; Listening had one actual audio asset, Writing one visual; Speaking task capability was permissionGranted=true/available=true under explicit synthetic runner. Reviewer `/api/account` returned access-required, confirming profileless review with no learner membership/profile requirement. Synthetic speaking feedback is plumbing evidence and cannot assess speech.

Frontend worker received the URL/fixture selector and confirmed fresh actual-source browser at account-local `localhost:5191` proxies API8009. No HTTP stubs/getUserMedia mocks transfer from its preceding controlled checks. Existing synthetic reviewer work is preserved. No DB test/reset/restart window may overlap the browser journey. Do not delete assignments/work while frontend is using them; this bootstrap's ON CONFLICT commands intentionally preserve existing assignment/work, so ownership of earlier rows must not be assumed for cleanup. Keep DB volume intact. Stop only the owned API session when frontend and coordinator confirm completion; do not stop Docker or delete shared synthetic data by default. API lifecycle was active at this checkpoint; frontend completion/cleanup is pending.

No environment files, real identities, provider configuration/calls, production mutations, outside messages or release were used. Failed initial sandbox/default-daemon checks are retained above; they are not application failures.

## Actual browser defect correction — 7 November 2026

Frontend actual frozen-edition journey found numeric authored question IDs in Academic Listening/Reading and GT Reading. All three HTTP200 payloads failed the strict frontend Snapshot schema because the server projected integer IDs. Coordinator authorized narrow projection/mutation admission correction, preserving source bytes and package hash.

Implemented trusted authored positive integer ID normalization to decimal strings in question projection. Source bool/float/null/negative/zero/invalid IDs fail closed; duplicate IDs after normalization (including integer1/string1) fail closed. Draft admission and review item references derive the same projected task IDs. Request Pydantic contracts remain strict: numeric client questionId is rejected rather than coerced. No stored content or frozen edition was rewritten. Frontend relayed coordinator's parallel primary-copy correction: mock titles are human track/form/skill titles and Writing section headings default Task1/Task2 instead of internal taskType enums. Canonical author titles and IDs remain unchanged.

Validation: focused review/projection/HTTP/assets suite **37 passed** with inherited test-client deprecation warning. Regression fixtures cover normalized draft/submission IDs, strict client numeric rejection, semantic collision and malformed authored IDs. Actual frozen edition projected all44 snapshots into a local0600 temporary JSON file; `node --import tsx` invoked the existing `web/src/account/review/contracts.ts` Snapshot.safeParse on each: **44 passed,0 failed** after final title corrections. No schema weakening.

Coordinated frontend idle window: `.venv/bin/python -m pytest -q tests/test_content_review_postgres.py::test_actual_frozen_numeric_mock_save_submit_roundtrip --local-postgres`: **1 passed in17.37s**, exercising all three affected actual frozen mocks against the actual receiving PostgreSQL repository. Created a disposable random reviewer assignment only; each target saved a string-ID synthetic answer, submitted blind, and recovered identical submitted work through a new repository/connection; privateContent stayed null. Finally removed only that random owner's operations/state/assignment. No schema DDL, reset, DB restart, real identity, profile mutation or provider execution.

Stopped only owned API session57263 at frontend idle, started session52346 for numeric fix, then title-only correction restarted ownedAPI again while frontend waited. Final API session **74254**, loopback8009, same immutable edition855...095 and explicit synthetic Speaking. Actual Writing GET returned200, title Academic01·Writing, Task1/Task2. Frontend received ready notice and resumed real browser mutations. Preserve UUID6 reviewer work and current API until journey finishes. One earlier old-process Writing GET503 appeared during the coordinated source/update window; final new process actual GET200 and final direct44 projections passed. No claim that transient error was a learner-content failure.

This material server projection change supersedes prior backend inventory digest and requires hosting fresh context/image plus bounded independent security validation after actual journey. New review-owned inventory:

```text
141d87b30ace0acbbbccabf49c3ccf64d65ff9b872ea25a08c708a1685a0e7cf  platform/backend/app/contracts/content_review.py
222d4a293ff4f03005d740b279d64c963e91167c563798b23a401f9b8f0f9c46  platform/backend/app/repositories/postgres_content_review.py
abc4b06fb78b33793a19f6dcad5d9969f1894141228679c78e5e676616d796b0  platform/backend/app/routers/content_review.py
7ef56f3dc08bd056596a4716c18dc435a4c5c4b35a594538e70df869ddf7233f  platform/backend/app/services/content_review.py
8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9  platform/backend/deployment/content-review-schema.sql
8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9  platform/backend/local/content-review-upgrade.sql
efbb3e4b11e7566dd90f0bb1ea86c91b14a2779ac45f2a9218bc0f677038a7a7  platform/backend/local/review_fixtures.py
b8b60446f27c0905d7df36bf1c90518826d45b8e907c9baf49683e0aa432d5ef  platform/backend/local/upgrade_content_review.py
82fb2dc11f73d76edc93b589f2729742b932c514dc18c7608c9cabd2ecc56543  platform/backend/tests/test_content_review.py
efcb1466494f93047436c4529f0b19dfa7d6421f0c7de454cd57e6db9782ac18  platform/backend/tests/test_content_review_assets.py
4b3fd0285662fa01c5dfa0dc072d628271a8f02d65d2d4e9469082dd4adcec32  platform/backend/tests/test_content_review_http.py
7368d272c6f5f1ff2859928fc3bc608a2fe23bb127c8b31b9e93dd9cb1685c0d  platform/backend/tests/test_content_review_postgres.py
```

Review-owned12-file SHA-256: `cc89bab53f6e32c9d02a8f41e473463defddf649efd9af1f6c27939156da96cd`.
