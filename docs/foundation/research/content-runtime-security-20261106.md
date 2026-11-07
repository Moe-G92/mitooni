# Independent content and Speaking runtime security review

Owner: runtime_security_review. Scope: actual backend, media, SQL and delivery diff; implementation remains owned by other workers. No external actions, real identities, credentials, recordings or provider calls.

## Preflight and plan

1. A leading reviewer would challenge cross-layer assumptions: revocation at dispatch and replay; exact binary evidence versus declared hashes; worker ambiguity after network execution; private provenance leakage; deny-by-default packaging. These are necessary checks within the assigned scope.
2. Raw materials are actual uncommitted Python/SQL/Docker code, curated package structure and synthetic HTTP/provider transactions. Other workers’ reports are leads, not proof. No source originals or environment files are needed.
3. Use source inspection and SHA-256 snapshots; isolated Python/pytest adversarial probes; HTTPX MockTransport for SDK requests; direct ASGI messages for actual streamed-body limits; read-only schema review. Request a coordinated exclusive window before additive PostgreSQL probes. No resets/restarts.
4. Independent evidence means reproducible rejected requests and preserved private headers, no duplicate dispatch, strict provider/schema/binary binding, database enforcement rather than UI restrictions, and a documented exact reviewed revision. Passing mocked checks does not establish live provider quality, receiving-host configuration, UI readiness or legal clearance.

Plan: inspect authority/data-flow and compare minimal robust designs; send substantive findings early; execute fresh adversarial probes and relevant existing tests; inspect actual PostgreSQL only with coordinated access; record file hashes, observed results and evidence limits. Verdict pending.

## Initial design challenge

The narrow explicit configuration, server-only projections, current assignment read locks, immutable package hashes and one-shot durable dispatch are appropriate foundations. Verify all paths actually use them, especially error/replay/playback and post-revocation scheduler recovery. RLS must combine owner restrictions with revoked table/column grants; assignment permission/status columns must remain unwritable by the API role. Audio evidence must bind actual admitted bytes and frozen task/rubric. A known dispatch cannot return to automatic retry.

Supabase skill read: `/Users/arashshahrokhi/.agents/skills/supabase/SKILL.md`. Current official RLS documentation inspected 2026-11-06: https://supabase.com/docs/guides/database/postgres/row-level-security (page updated 2026-11-03). Initial web fetch of changelog markdown failed with unsupported content type; alternate retrieval pending. No Supabase hosted access or mutation performed.

## Independent evidence reproduced

- Selected existing tests: `uv run pytest -q tests/test_content_review.py tests/test_content_review_http.py tests/test_content_review_assets.py tests/test_activity_media.py tests/test_speaking_evaluator.py tests/test_speaking_review_runtime.py deployment/content-review-beta/test_entrypoint.py`: **112 passed, 9 PostgreSQL skipped**, one Starlette/httpx deprecation warning. Skips are not database proof.
- Fresh separately authored `/private/tmp/mitooni-runtime-review-security/test_independent.py`: **7 passed** with `PYTHONPATH=. .venv/bin/python -m pytest -q ...`. Concurrent calls against the same prepared Speaking dispatch cause exactly one mocked SDK request; other call is rejected. HTML/javascript model strings remain ordinary schema text; frontend JSX interpolation was inspected separately, with no HTML injection sink in this feature. Ancillary WAV bytes participate in exact hash; duplicate fmt and malformed alignment rejected. New private sourceMappings/transformationNotes/answer fields stay absent before reveal. False Content-Length, duplicate Content-Length and chunked overflow reject 413 with private headers. Host path/userinfo/fragment/percent/control/port and duplicate-authority attacks reject.
- Actual canonical curated package `/Users/arashshahrokhi/Projects/mitooni/app/review/content-20261106/editions/85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095` independently loaded against exact hash `85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095`. Exactly 44 reviewer targets. Recursively checked every blind snapshot excludes provenance/keys/scripts/rubrics/filesystem paths. All sixteen runtime-exposed assets (six 1280 PNG, ten MP3) were read and SHA-verified, using bound relative authenticated URLs with package/target hashes and no bearer. A copy of one asset was corrupted only under the owned temporary directory; reopen rejected 503. No original source or package file was changed.
- During coordinator-granted exclusive PostgreSQL window, independently authored `pg_probe.py` exercised random synthetic owner rows only: API role cannot change assignment permissions/status or INSERT an assignment; role is neither SUPERUSER nor BYPASSRLS; same-owner/exact-body replay succeeds, changed-body and other-owner fail; incorrect worker fence fails; expired already-marked dispatch becomes dispatch_unknown and cannot redispatch; committed revocation blocks exact replay, list, playback and worker claim; database RLS hides revoked own state. All passed; owned rows cleaned; no schema upgrade/reset/restart performed. Initial sandbox TCP denial is retained as an unsuccessful check; authorized execution outside that network sandbox succeeded.
- Initial attempted real-package test used the uncompiled author input directory and correctly failed because no manifest exists there. Coordinator supplied the canonical compiled edition; successful evidence above applies to that edition only.
- Shell `python` was unavailable, so artifact writing used python3. An attempted `uv run python` hit unwritable UV cache; direct project `.venv/bin/python` worked. These are environment limitations, not passing checks.

## Findings and integration holds

1. **Private unexpected-500 response boundary missing (reproduced).** A repository RuntimeError through actual TestClient with server exceptions disabled returned status500 and plain `Internal Server Error`, with no Cache-Control, Vary, nosniff or request ID. Exception marker was not returned. `/private/tmp/mitooni-runtime-review-security/probe.py` reproduces. Coordinator assigned main/http_security owner; correction and independent retest pending.
2. **Hosted artifact remains a staged earlier edition/configuration (confirmed by coordinator).** Original Dockerfile copies author-input path without compiled manifest/media, while entrypoint passes no speaking_provider. This cannot deliver canonical curated media+Speaking evaluation. Coordinator assigned beta_hosting to explicit compiled package context and explicit optional Speaking provider configuration. No deployment approval; correction and independent packaging/entrypoint retest pending.

## Official guidance and limits

Supabase changelog markdown could not be fetched by web (unsupported content type), and shell network DNS was unavailable. Official HTML changelog https://supabase.com/changelog was then inspected successfully (2026-11-06). Latest relevant entry is CLI v3 local-by-default/hosted confirmation semantics (2026-11-04); no Supabase CLI or hosted mutation is used in these probes. Flutter breaking change (2026-11-06) does not affect this Python/React adapter. Official RLS guidance https://supabase.com/docs/guides/database/postgres/row-level-security explains separate grants/policies and need to enable RLS on exposed tables; actual local grants/RLS were tested above. Hosted role ownership, exposure, TLS/Auth and revocation configuration are not established by local PostgreSQL tests.

No live provider calls, real recordings, model-quality/calibration claims, hosted build/HTTP execution, production configuration, publication or external sends. Speaking results are qualitative rehearsal feedback with estimated unverified timestamps; synthetic acceptance proves transport/contracts, not actual assessment correctness. Human teacher and legal/business decisions remain separate. Overall release verdict remains pending/CHANGES NEEDED until integration holds resolve and coordinator validates actual UI/host requirements.

## Correction validation checkpoint

The unexpected-500 finding is resolved in actual main/http_security implementation, independently retested. Original runtime exception now returns sanitized JSON500 with requestId, private/no-store, Vary Authorization and nosniff. Four fresh direct ASGI probes independently exercise midstream exception, incomplete response, response overflow and cancellation: partial marker bytes are not released; cancellation propagates with no response. New private boundary buffers at most32MiB plus bounded headers, with cancellation/transport failure semantics inspected; current routes have no streaming SSE response to regress. Fresh probe count is now11 passed; combined with content HTTP suite19 passed. A mistyped nonexistent `tests/test_http_security.py` selection first produced no-tests/exit4; corrected selection passed. Hosting integration remains pending.

## Runtime validation snapshot

Branch `codex/ielts-content-20261106`, base HEAD `2a0191e6274af6443da5207d461c7902e77d10c1`; reviewed source is uncommitted and hashes below define this runtime checkpoint. Selected integration regression plus fresh probes: **151 passed,9 PG skipped**, one known Starlette/httpx deprecation warning. Independent actual PostgreSQL evidence is the separate additive probe above, not the skipped cases.

```text
141d87b30ace0acbbbccabf49c3ccf64d65ff9b872ea25a08c708a1685a0e7cf  platform/backend/app/contracts/content_review.py
3ddbd5890f3f7729cd646dced33a1af7076c25f71f0e855473b364709186b7f5  platform/backend/app/contracts/speaking.py
67a57755a918549b9356df4493a0bf978878a6114c04e819332f36e65f0f1b04  platform/backend/app/services/content_review.py
f8c854a1c6f59b3821b07c0d84dd4e66eca3de85d9c4ad368ea362300e4fa0b2  platform/backend/app/services/speaking_review.py
8a282b0b64e3584042637c71b3cc3c380df2d3797f00bb6353ba760850e4b76e  platform/backend/app/services/content_pipeline.py
222d4a293ff4f03005d740b279d64c963e91167c563798b23a401f9b8f0f9c46  platform/backend/app/repositories/postgres_content_review.py
b56143fcce522ceef09786934f0bf9c8e57903de1f2af3f16646ba51eecb52cf  platform/backend/app/repositories/postgres_speaking_review.py
67f4ca5d2491373c3fbe277c0572f5769efddd3977673ecfcab9e5c80e6baebe  platform/backend/app/providers/speaking_runner.py
abc4b06fb78b33793a19f6dcad5d9969f1894141228679c78e5e676616d796b0  platform/backend/app/routers/content_review.py
a2fd6c4485bfa8fc9c63f16de987c07107ebc8f18f13d9726a9daa3aa3eec04a  platform/backend/app/routers/speaking_review.py
8c3feab07ba071991b51857b59a3fca27b6db463a6306dfdbc4c6d4701bfeb90  platform/backend/app/workers/speaking_review.py
17f200b3c35eb2b39195d9f476bfedf8d2fd12e8932c2cb03534aeedd466eeb3  platform/backend/app/media/registry.py
813c7726ed89201cc0ed2aac50e769dc15d719f0caf886168b37a7333bf52961  platform/backend/app/media/charts.py
adf4bf10a769c53b0a8c063b7a0690393bce3ce69fe4fe1cfd5b2e6d438d442d  platform/backend/app/media/contracts.py
5d4103b88f355c942c75a770d31f4f0d2700e1111f93a3200fac2edb5cec3f44  platform/backend/app/media/speaking.py
464fbc85ca31200497b101e7e0c0855109af85beb849ebf13edba8bca285540a  platform/backend/app/main.py
d9a1afec50d8d6bd4556116c8f627f68e765c8423ebab1c868c6767a3b25a2ce  platform/backend/app/composition.py
19c7dd095fc833f074ea1ceb0715dfe6456c8d9bf98bcc7f97d95add89511a68  platform/backend/app/http_security.py
47f443a473809141b6d71cbdcfc1104ca0246e2f87f98ad1799bed59278a1a8c  platform/backend/app/dependencies.py
fc4fb1b13917d3e4b97971ff4734ce624ef7f46fc590d0f7bf91ae99bd0a1256  platform/backend/app/repositories/postgres_target.py
027eda6d7331913e47257fa7cb50f443ca2c02db3745bec20bffc728a28591ce  platform/backend/local/serve.py
8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9  platform/backend/deployment/content-review-schema.sql
e4b437a175bee8be922c8d390f12e699426750332a5424380d310ef247500e72  platform/backend/deployment/speaking-review-schema.sql
67f1db747eb260f08c28e5a3343bdbe58c5d011979a00eca71685210795e108c  web/src/account/review/SpeakingPanel.tsx
```

Runtime verdict: agreement on the reviewed authorization, private projection, audio admission, immutable binding, one-shot worker and corrected private error boundary within the local/synthetic evidence limits. No unresolved runtime security defect found in this checkpoint. Hosting package/build/provider wiring remains an integration hold; this is not APPROVED FOR GO-LIVE. Material source changes require re-review.

## Deployment context checkpoint

Independently executed revised prepare_context.py against exact canonical855516...095 edition into owned `/private/tmp/mitooni-runtime-review-security/context`: 376 admitted files,28 assets (18PNG,10MP3), all manifest hashes independently recomputed. Context copy revalidates exact canonical package. No environment/SQLite/PDF/DOCX/MP4/archive files admitted; exact Dockerignore starts denyall and lists only declared hashed files. Source inspected: Docker now copies only generated private-review and installs ffmpeg/CA; entrypoint forwards optional all-or-none model/key/budget1–8 Speaking configuration, no implicit provider; readiness checks six RLS tables plus exact assignment column types. These resolve original source-level omissions. Actual image build/run is still hosting-owner evidence pending; local assembled-context validation is not image execution.

A small additional delivery issue was sent to hosting owner: invalid-Host early400 bypassed runtime private middleware and lacked Vary/nosniff/requestId; no host echo/private data was present. Await correction/retest. No implementation edited by reviewer.

## Final local deployment review checkpoint

The early invalid-Host private-header issue is resolved by actual revised delivery middleware. Fresh independent TestClient requests used ordinary hostile authority, authority containing `/assets/`, and authority containing `?x=/assets/`: all400 responses carried sanitized envelope/requestId, no-store, VaryAuthorization and nosniff, with no Host echo. Suggested scope-path consistency rather than URL reconstruction remains a maintenance recommendation; these probes did not demonstrate a cache omission.

Final incremental deployment plus fresh adversarial probes: **18 passed**, one known deprecation warning. Final fresh-probe count12. Context assembly/hash verification is separate actual evidence above. Hosted image build/run is still outside this worker’s reproduced evidence; no live provider/model-quality or hosted Auth/DB evidence is asserted.

Deployment source hashes at this checkpoint (subsequent material source changes require re-review):

```text
cb1a4c4ed6d938054b3d38b5e12cdf0d3ba633991c25d3f94550d85b1a21a777  platform/backend/deployment/content-review-beta/prepare_context.py
4585cc129f30b9ffed4172820f7d123b95e76eb0bd64f4dd8ac478688e8b7182  platform/backend/deployment/content-review-beta/entrypoint.py
4db3b1b165eda54ce4183769ea09be8c775fa48ee8466c614e942d3a260bdd9c  platform/backend/deployment/content-review-beta/Dockerfile
78dbc4af54eb8d50ef7defec926aeb97051fe837f470b7ac090c3973b584c72c  platform/backend/deployment/content-review-beta/Dockerfile.dockerignore
c807501a22fdbc13b0b8e31ebfccbcca9b2d0f9c4d41965979dfaeb1d4c3a656  platform/backend/deployment/content-review-beta/railway.json
```

Final scope agreement: reviewed local runtime and explicit deployment-context design satisfy the tested security boundaries. No unresolved reproduced security finding remains in this snapshot. **Not APPROVED FOR GO-LIVE**: actual image/host/UI validation and accountable release approval remain coordinator-owned. Report is complete at this checkpoint; only this report and owned temporary probes were written by the independent reviewer.

## Hosting-owner cross-platform blocker (2026-11-07)

Hosting owner reports actual Linux image builds but fails canonical package load: Linux ffprobe5.1.9 audio duration differs from Mac-authored measured metadata. This is new actual image evidence from the implementer, not independently reproduced here. **Deployment integration remains CHANGES NEEDED** until measured metadata/tooling parity is explained and exact corrected package/image independently revalidated. Do not silently relax admission tolerance. Source pipeline hashes and canonical package evidence above remain the exact earlier local checkpoint; a changed package needs new hash/projection/media validation. Source delivery middleware now classifies cache/Vary from scope path consistently.

Updated entrypoint hash: `4585cc129f30b9ffed4172820f7d123b95e76eb0bd64f4dd8ac478688e8b7182`. Runtime security agreement does not imply Linux image readiness or release approval.

## Decoded-sample correction and actual Linux image validation (2026-11-07)

Coordinator explicitly requested independent follow-up after the cross-platform duration blocker. Actual reviewed pipeline SHA256 `229fce38a5ff12bcbb24f5bd63e18183863ed11e50224400efe9d23a30de089c`; focused test file SHA256 `34fc5ec6fac7f69239a665c071b9f89bfdaeb45265f562d29d0bca58b59eb936`. This supersedes the earlier pipeline source snapshot only.

Source inspection: ffprobe still validates one actual audio stream, codec, sample rate and channel count. Duration now counts decoded signed16bit little-endian bytes divided by two*channels*sample_rate, excluding MP3 encoder padding. Reads64KiB at a time with a monotonic15second deadline and a7200second PCM ceiling. Input geometry is8000–192000Hz and one/two channels. Decoder uses file/pipe whitelist, no stdin, error/explode flags and one decoding thread. Nonzero exit, empty output and incomplete total PCM frame reject. Finally kills still-running process, waits/reaps and closes pipe; raw bytes are neither rewritten nor logged. Exact binary SHA, package hash and existing25ms duration tolerance are unchanged.

Reproduced checks:

- Entire affected content_pipeline suite: **65 passed**. Initial focused `-k` invocation:4 passed/73 deselected; not represented as full coverage.
- Existing independent adversarial suite against corrected source: **12 passed**; this includes canonical package44targets16servingassets, byte corruption, private response failure/cancellation and invalid-Host envelope.
- Separately authored `/private/tmp/mitooni-runtime-review-security/decode_probe.py` passed actual child-process byte arithmetic, split pipe chunks ending in complete frames, stereo sample duration, stderr flooding/nonzero exit, stalled deadline, sample ceiling, kill/reap and closed-pipe checks. No network or source mutations.
- Independently executed exact Linux/arm64 image **sha256:9dc80e90bdb8d085ef5cc2809dff89075e38a6980459740cac15d67fb0faaeea** with `docker run --rm --interactive --network none --entrypoint /srv/backend/.venv/bin/python ... - < /private/tmp/mitooni-runtime-review-security/image_probe.py`. Container UID10001, ffmpeg5.1.9-0+deb12u1. Canonical package `85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095` loads unchanged,28assets22assessmentHolds. All44target HTTP blind snapshots succeeded; all16projected asset HTTP responses had independently verified SHA256 and private/no-store,VaryAuthorization,nosniff. Source/raw private paths remain outside public assets. Unauthenticated media denied. Missing/tampered media in disposable writable copies rejected503 and actual hosted startup order stopped before any DB access. Default provider remains unavailable.
- Initial image run failed because hosting-owner smoke selected a360PNG from the28canonical assets while runtime intentionally projects only1280PNG. Corrected only the owned temporary harness to choose1280 and to chmod disposable copies for fault injection; complete image probe then passed. Hosting owner separately corrected their excluded-from-image harness. This failure was a harness defect, not relaxed runtime admission.
- Initial default-sandbox Docker socket access was denied. Authorized network-disabled local Docker execution succeeded. No PostgreSQL mutation/window used for follow-up; no hosted deployment, real Auth/DB or provider calls.

Independently recorded source hashes inside the actual image:

```text
229fce38a5ff12bcbb24f5bd63e18183863ed11e50224400efe9d23a30de089c  app/services/content_pipeline.py
464fbc85ca31200497b101e7e0c0855109af85beb849ebf13edba8bca285540a  app/main.py
19c7dd095fc833f074ea1ceb0715dfe6456c8d9bf98bcc7f97d95add89511a68  app/http_security.py
3b0952ae02308831c4a557fd043ac4d1ae1c9f004763e8ce1d8a5973600a16a4  beta_entrypoint.py
```

Final independent agreement: **the Linux duration integration blocker is resolved at this exact package/image/source snapshot**. Runtime and explicit deployment artifact satisfy the tested security boundaries; no unresolved reproduced security defect remains. Actual external hosting/Auth/DB/provider evaluation and UI acceptance/release approval remain distinct, unproved by these synthetic network-disabled checks. This review is not APPROVED FOR GO-LIVE and grants no deployment permission. Any material code/configuration/package change reopens the corresponding review scope.

## Replacement TTS helper independent preflight (2026-11-07)

Assignment: read-only security review of tools/content_provider_audio.py and synthetic tests; only append this record and own temporary probes. No paid calls, real credentials, environment files, old edition/media mutations or provider/network execution. Re-read root/app AGENTS.md explicitly. OpenAI Docs skill applied for model/rate/deadline facts; installed SDK source is primary implementation evidence.

1. A top professional would challenge crash ambiguity across processes, spend reservations before sockets, hidden SDK logging, exact source/text/model plan binding and safe receipt replay. Necessary foundation within this assignment, not authority to spend.
2. Raw materials: actual helper and installedSDK2.21 source, frozen plan/source hashes, SQLite transactions and synthetic local generatedWAV/MockTransport responses. No real keys or licensed script output in logs is needed.
3. Inspect actual diff and execute existing11unittest checks plus fresh temporary subprocess/SQLite/SDKlogging adversarial probes. Use SDK HTTPXMockTransport only; use official docs search+fetch for model facts.
4. Independent correctness evidence: one global durable claim under concurrent processes, retained reservations after unknown outcome, no SDK request on cap/source/replay denial, credential/input absent from diagnostics, exact filehashes and unchanged oldmanifest. Passing synthetic checks does not establish actual voice quality/billing or authorize generation.

Existing11synthetic tests passed. Official pages searched and fetched 2026-11-07: https://developers.openai.com/api/docs/pricing confirms tts-1-hd $30 per1Mcharacters; https://developers.openai.com/api/docs/deprecations#2026-10-01-text-to-speech-models confirms shutdown2027-01-06. Helper refuses on/after thatdate. Pricing and deadline assertions are factual checks, not a recommendation to change the frozen one-off model or execute.

Initial helper SHA5417af83c0910cc47be6db4c10cb82575cb42d5b1304772df582071cd5ae8487; testsSHA1c126c37d5dfe8a85107d22fb281eeb2a76519e05bce781513b3dbb84e95f999. New plan reported cd7591638528064c04336456643142cdebdf54fed40dc5b7b4bf6ad16a9712ae; independently rebuilt exact138requests/43652characters/reservation1,310,220microUSD via owner test. Proposed cap2,000,000microUSD remains unapproved execution scope.

Reproduced finding sent immediately to listening_media/root: installed SDK DEBUG Requestoptions log captures full synthetic private text. Probe `/private/tmp/mitooni-runtime-review-security/tts_log_probe.py` returned private_input_in_sdk_debug_log=True using fake key/MockTransport only. Receipt exception sanitization does not suppress underlying SDK loggers. Correction and independent retest pending.

### Replacement TTS correction and final independent checkpoint

SDK diagnostic defect resolved by namespace LogRecordFactory suppression before injectedSDK options/calls and before CLI SDK import/client construction. It suppresses messages, args, exception/stack details for openai/httpx/httpcore, including future child loggers. Original own installedSDK+MockTransport probe now prints private_input_in_sdk_debug_log=False. Owner added actualSDK debug regression; **12 synthetic unittests passed**. No real key, API request or voice generation used.

Additional independently authored probes:

- `/private/tmp/mitooni-runtime-review-security/tts_ledger_probe.py`: two simultaneously contending independentSQLite connections/runs yield exactly one global claim and one reservation; reopen preserves in_flight and blocks resend; changed body with old hash rejects; terminal unknown cannot transition through finish to completed; full reservation remains charged against local cap. Temporary synthetic ledger only, not real global ledger.
- `/private/tmp/mitooni-runtime-review-security/tts_cli_probe.py`: altered prepared-source plan and wrong spend cap rejected before ledger/client; explicit regular-file FD0 rejected before credentials/client (synthetic mocked CLI preflight), preserving FIFO-only credential boundary.
- Existing meaningful cases reproduced: stream failure becomes durable unknown; no cross-run retry; malformed MIME/size caps deny; exact byte hashes revalidated on completed replay; source plan and shutdown guard reject drift/expiry; symlink/traversal deny.

Source inspected: completed receipts never create another provider request; in_flight/unknown/invalid states require manual reconciliation; reservations commit synchronously before provider invocation and are never refunded on uncertain outcomes. Explicit CLI client fixes official baseURL, no redirects, no env transport, empty organization/project/webhook config and zero retries; key comes only from bounded FIFO0, is not an argv/environment value or receipt field. Plan now includes current helper SHA. All new receipt writes/final receipt paths are checked; output new-file semantics protect existing edition/media. Global SQLite stores no key/body; private per-turn request/receipt artifacts remain under private review output. Source helper and media derivatives are not automatically published.

Independently rebuilt current plan: SHA256 **390a499d608e5382b72c418f74519de398da77284eae663a1bca79e3b82b809b**,138requests,43652characters,maximum3033UTF8bytes/3025characters perrequest; all use tts-1-hd and voices echo/nova/onyx. Conservative reservation **1,310,220microUSD**, proposed cap **2,000,000microUSD** excluding taxes/unrelated activity. This supersedes original cd759... plan because helper changed. Final stored plan must match new frozen helper/hash; do not execute using an old approved-plan digest.

Reviewed source hashes:

```text
a41da3a4ee56eceba52dc2a40499d0231e18d3e68cff4a4ff995633aa293b6db  tools/content_provider_audio.py
2db1fe08bb7454d40dbde152331dfc6b90ecd530753b6a1799d2e07e4fc606a9  tools/test_content_provider_audio.py
6f8153e10d2a5ec0eaf468563dca4f1e1611ec0ec790e51dfda1b11b5a2a7da2  tools/content_review_audio.py
```

Limits: syntheticSDK injection proves protocol/ledger behavior, not real billing or audio naturalness/fidelity. HTTP per-read timeout plus elapsed-time checks after each received chunk provide bounded failure behavior but are not a strict asynchronous120second interruption of an actively blocked socket read; local transcoding uses existing300second subprocess timeouts. Recheck price/model availability near any future paid execution; approval reference is supplied by an accountable operator, not independent evidence of human consent. No paid cap/credential execution authorization is inferred. No remaining reproduced security defect in this helper snapshot; agreement is **engineering readiness for an explicitly approved bounded future run**, not permission to spend, use credentials or release audio. Current internal855edition review remains independent of future replacement generation.

## Final serving-only image refresh (2026-11-07)

Coordinator/hosting-owner requested bounded follow-up after question-ID/headings correction and exclusion of private authoring code. Reviewed `content_review.py` SHA **7ef56f3dc08bd056596a4716c18dc435a4c5c4b35a594538e70df869ddf7233f**: positive exact Python integers normalize to authored string IDs; booleans/floats/zero/negative/malformed values reject503; request contracts remain strict strings; duplicate resulting question IDs reject rather than collide. Titles are deterministic display headings for mock/curriculum/blueprint; no authority or private-content widening. Media/package/target hashes remain based on unchanged actual author content.

Controlled context `/private/tmp/mitooni-review-beta-context-85551608-v4` independently checked: manifest SHA **58c4eee07f06fdd0aecc7a484188d3bc32d7e9f189d8acd0e966ca9b5f93c080**,370 admitted files, every declared file hash recomputed; no platform/backend/app/corpus tree or manifest path. Exact canonical855...095,28assets unchanged. Assembler explicitly excludes app/corpus and rootguard Dockerignore denies it. Focused affected content/review/HTTP/deployment-context suites **42 passed**, one known Starlette/httpx deprecation warning.

Independently executed final exact image **sha256:0fbd49a9a48425f807718d187ca6b354412e582d609d6dea0b9bef65f064e802** via `docker run --rm --interactive --network none --entrypoint /srv/backend/.venv/bin/python ... - < /private/tmp/mitooni-runtime-review-security/image_v4_probe.py`. This supersedes earlier9dc80image checkpoint. Current hosting harness plus independently authored assertions passed: UID10001; all45actual serving Python modules import; app.corpus cannot be found; all44target HTTP blind snapshots succeed; all16served media assets have verified SHA and private headers; missing/tampered media reject and actual startup fails before DB; provider default unavailable. Added independent actual-image checks: positive authored integer conversion works, bool/zero/negative/float/None/object reject, numeric client questionId still rejects, in-image content_review source SHA matches reviewed7ef56...7233f.

No database, network, provider, real credentials, old media or release operation used. Image verification uses synthetic fixture identity/storage, not live hosted Auth/database proof. Internal evaluation fixture only, as clarified by user; no public-release/rights inference.

Updated bounded source hashes:

```text
7ef56f3dc08bd056596a4716c18dc435a4c5c4b35a594538e70df869ddf7233f  platform/backend/app/services/content_review.py
901e634d6de953fd18e23a1134b42c39b11944bf04f0d8a83222b283bff2ed28  platform/backend/deployment/content-review-beta/prepare_context.py
8b7bc02319835546d41e57e8c62c112f68e7aeef2852098166d6b8185dc1d3be  platform/backend/deployment/content-review-beta/Dockerfile.dockerignore
5041b7e13ebe24dc709ba4df3bf690c25f47a4869becdba81d26ba48ffd8d807  platform/backend/deployment/content-review-beta/image_smoke.py
```

Final security-scope agreement applies to exact0fbd49...e802 image, canonical855...095 package and reviewed source hashes. No unresolved reproduced security defect remains within this scope. External hosting/Auth/DB/provider quality and full UI/release acceptance remain outside this evidence; no APPROVED FOR GO-LIVE or deployment permission is issued.

## Dedicated Mitooni database credential bootstrap design review (2026-11-07)

Scope: read-only review for new dedicated Supabase syczumdwgabypxkopkpn, not SQE/shared infrastructure. Root/app instructions re-read. No secret, crypto key, role password, configuration or remote resource generated/changed by reviewer. Existing receiving/content/speaking SQL and operator binding helper inspected.

Preflight:
1. A top professional would threat-model server logs/query statistics and failure context, not only plaintext crossing agent tools; verify least-privilege role ownership/membership, crypto compatibility and unknown-result recovery before creating any credential.
2. Raw evidence: actual schema/binder sources, current official provider/PostgreSQL documentation, coordinator-observed nonsecret logging settings/permission probes. No real credentials/environment files needed.
3. Inspect direct data flow and exact source hashes; execute only existing mocked binder tests; compare documented Management/API/JIT and SQL-suppression routes. No live SQL/key generation in reviewer scope.
4. Independent acceptance: provider-supported custom-role credential path with no recoverable secret in logs/tool IO, actual same-session safeguards before generation, synthetic failed-operation log/stat checks, actual TLS mitooni_api non-BYPASSRLS connection and current grants/RLS proof after binding. Source review alone does not establish live controls.

Candidate encrypted-return DO is **CHANGES NEEDED**. Encrypting only the return value does not protect a password interpolated into inner ALTERROLE SQL. Official Supabase security guidance (updatedNov4) identifies statement/error-context/statistics exposure and prioritizes nonSQL provisioning. Its documented narrow fallback requires transaction-local suppression of statement/error/detail/statistics/audit logging. Coordinator observed current_userpostgres; log_statementddl, error_statementerror, messageswarning, pg_stat_statementstracktop, pgauditnone. A nonsecret set_config(log_statement,none,true) capability probe failed42501 before any secret generation. Therefore that fallback is unavailable through current MCP authority and must not be attempted with a real password. No secret was generated by the failed probe.

Official sources inspected: https://supabase.com/kb/troubleshooting/provisioning-credentials-without-log-exposure ; https://www.postgresql.org/docs/17/pgcrypto.html ; https://supabase.com/docs/reference/api/v1-update-database-password ; https://supabase.com/docs/guides/platform/temporary-access ; https://supabase.com/docs/guides/database/postgres/roles ; https://www.postgresql.org/docs/17/config-setting.html . Changelog markdown fetch again failed unsupported type; prior official HTML changelog review remains recorded above.

No verified published ManagementAPI custom-role password endpoint was found; documented database/password route is project postgres password and cannot be substituted for runtime least-privileged login. Ordinary psql\password protects plaintext and sends a verifier, but verifier log exposure is still unacceptable under the stated strict no-secret-logs criterion. Do not expand runtime to postgres/service_role or replace proven direct-PG/RLS architecture merely to bypass provisioning.

### Exact bounded role-default fallback proposal — NOT execution approval

New evidence resolves the apparent SETLOCAL/role-setting contradiction: Supabase documents reserved logging changes through supautils at ROLE-default level, whereas the observed session setter was denied. This makes a controlled fallback potentially feasible, but role defaults persist after disconnect. A Python/JS finally alone cannot cover process death, task cancellation or control-plane loss. No suppression is allowed until an independently running server watchdog and exact restoration have actually been proved on the new isolated project.

Proposed sequence for implementation-owner challenge:

1. **Pin scope and prepare before touching logging.** Operator/orchestrator fixes MCP projectref syczumdwgabypxkopkpn and fixed Railway project/environment/service IDs from reviewed bind_runtime.py; no caller-selected project. Exclusive bootstrap owner; no concurrent privileged jobs, deployment or AI. Read only whitelisted logging entries from postgres.rolconfig, preserving PRESENT(value) versus ABSENT; do not print arbitrary rolconfig (could contain unrelated secrets). Snapshot actual pg_settings and relevant extension/role flags. Save nonsecret restore plan locally and in restricted server bootstrap metadata. Review actual restore statements before activation. Prepare ephemeral GPG homedir0700 under owned temp, explicit classic RSA signing/cert primary plus RSA encryption subkey (not defaultECC unsupported by pgcrypto), isolated options/keyring, no external key lookup. Send/export only public key; never export private key. Prove pgcrypto-to-GnuPG compatibility on a NONSECRET string first, with decrypted result compared locally and only boolean proof returned.
2. **Watchdog before suppression.** If pg_cron is absent, installation/scheduling must be explicitly authorized for this new project and verified; do not assume it exists. Private admin-owned bootstrap schema/table stores only nonce/projectref/whitelist snapshot/phase/deadline/jobid/heartbeat; revoke schema/table/function access from PUBLIC,anon,authenticated,service_role,mitooni_api,mitooni_browser. Restore function runs as cron's postgres invoker (no SECURITYDEFINER needed), fixed pg_catalog search_path, fixed role postgres and fixed GUC allowlist; no caller-supplied SQL or role. Minutely job calls restore(nonce). It restores each originally present GUC via ALTERROLEpostgresSEToldvalue, otherwise RESET that individual GUC; never RESETALL. No passwords, user data or API keys in function/job/snapshot. Idempotent repeated restore is safe. Failure to unschedule must not rollback a completed restoration: cleanup is nested/separate and repeat-safe. Cron owner/database/command/jobid must be exact; no public execution privilege.
3. **Prove restoration while logging still normal.** Create only harmless explicit role overrides equal to current baseline values, including a property previously absent; let the real independent cron job restore exact prior rolconfig presence/value automatically. Verify job execution/heartbeat and exact roleconfig equality plus actual settings on a fresh backend. This proves scheduler, privilege and restoration semantics without suppressing logging or creating a credential. Any failure stops. Do not call this watchdog-ready from only a mocked unit test. Arm real lease only after successful proof, with short fixed deadline (proposed90seconds), root finally owner and prewritten manual restore contingency. Minutely scheduler may add up to60seconds plus job runtime before restoration, so maximum window is not exactly90seconds. Require actual scheduler heartbeat, no queued backlog and bounded job runtime.
4. **Activate reviewed role defaults only.** Required effective values: log_statement=none; log_min_error_statement=panic; log_min_messages=fatal; pg_stat_statements.track=none; pgaudit.log=none. Also inspect log_min_duration_statement,log_min_duration_sample,auto_explain.log_min_duration: present loggers must be disabled(-1); do not ignore alternate statement logging. Bind/error parameter logging should be0 where available. Snapshot/restore every additionally changed GUC. Only change postgres role defaults on new project, never database/global configuration or another role/project. Supautils may reject individual settings; stop and restore any earlier changes. Do not generate a password in this step.
5. **Fresh effective-state proof plus nonsecret failure canary.** A new connection must report all actual required values and expected role/deadline/active cron lease; roleconfig alone is insufficient because pooled/old sessions retain old settings. Use a known NONSECRET unique canary through the same dynamic ALTERROLE format path against a deliberately nonexistent canary role, catch its ordinary error without raw detail, and return a bounded boolean/errorcode only. Check Postgres log stream and pg_stat_statements for the canary with query timing/ingestion limits recorded. Avoid an own search statement falsely matching itself. Absence in asynchronously ingested logs is supporting evidence, not the sole security proof. Stop on leak, permission gap, unknown scheduler state or expired/near-expired lease; no real secret exists yet.
6. **One atomic same-call secret operation.** Before ANY gen_random_bytes, in the SAME SQL call assert current_user=postgres,current_database=postgres; matching restricted lease row projectref/nonce/phase and at least10seconds lease margin; exact active scheduler metadata; every actual logging value from step4; expected existing mitooni_api NOLOGIN,non-superuser,NOCREATEDB,NOCREATEROLE,NOINHERIT,NOREPLICATION,NOBYPASSRLS and no privileged memberships. Fixed MCP projectref remains mandatory because current_database alone cannot identify a Supabase project. Set a short user-context statement_timeout. Only then generate48random bytes encodedhex into a local variable. Encrypt a bound JSON envelope(projectref,role,nonce,password) with verified public key/AES256 before ALTERROLE. Execute fixed identifier mitooni_api and quoted password with server-side format. Clear local plaintext variable immediately. Store/return only armored ciphertext through a transaction-local custom GUC and final SELECT (fits tool's last-result-set behavior). Source SQL has no plaintext or verifier literal. Ordinary failures and query cancellation must be caught into generic failure status without exception text/context; block-level subtransaction rollback prevents partial role changes. No RAISEDETAIL/NOTICE or unhandled secret-bearing SQL. Runtime role gains LOGIN/password only inside this successful atomic block. Unknown commit/transport result is a STOP/reconciliation state, not automatic password reset/retry.
7. **Restore regardless of outcome, before normal work.** Root orchestrator finally issues exact whitelist restoration (SEToriginal or RESETifabsent), verifies stored roleconfig equality and actual normal settings on a genuinely fresh connection; watchdog remains armed until proof. Existing sessions may keep suppressed settings after role-default restore, so close bootstrap sessions and establish the MCP connection lifecycle; one normal backend does not prove every pooled session was recycled. Failure to restore/recycle is an operational blocker, with exact prewritten manual recovery. No further deployment/queries under lingering unknown suppression. Watchdog is backup, not an excuse to skip finally. Remove own job/private bootstrap metadata only after restored proof; leave clear nonsecret operator status if cleanup cannot finish.
8. **Local handoff with no plaintext output/files.** Ciphertext may be stored0600; only private GPG homedir contains private key. One isolated local Python process decrypts via subprocess stdoutPIPE/stderr captured, validates GPG success plus exact envelope nonce/projectref/role and96hex password, then calls reviewed bind_runtime.bind with only MITOONI_DB_PASSWORD in memory. Do not use tee, echo, command substitution, argv/env interpolation, shell tracing, printing decrypted JSON, or plaintext temp files. CLI receives value on stdin and all provider output remains suppressed. On partial binding failure preserve ciphertext/key for authorized recovery; do not rotate/retry server password. Delete private bootstrap key/handoff only after actual TLS mitooni_api connection and private runtime binding are verified. No postgres/admin credential is bound to app. No provider keys or AI calls involved.

Implementation/testing prerequisites not yet met by this design record: exact helper with fixed project/role/GUC whitelist; injected MCP/CLI/GPG failure tests at every phase; tested restore-on-handled-error; actual independent server watchdog proof; real observed setting gates and canary controls; actual GPG RSA/pgcrypto compatibility; masked-only output inspection. Reviewer has not executed this sequence and does not label it safe-to-run yet. If scheduler/setting support or fresh-session lifecycle cannot be established, use a provider-supported temporary-access flow or a concrete human secure binding step instead of weakening controls.

### Dashboard feasibility, verified from current official source

Current official RoleRow source has reset enabled only for non-system canLogin roles. Expanding existing NOLOGIN mitooni_api and toggling User can login (without saving) reveals RolePasswordField; no preliminary ALTERLOGIN is necessary. Source: https://raw.githubusercontent.com/supabase/supabase/master/apps/studio/components/interfaces/Database/Roles/RoleRow.tsx . This is a real UI path, not proof of secret-log safety. Official database-role-update-mutation computes getRolePasswordForSql then pgMeta.roles.update, whose SQL is DO+EXECUTE with verifier literal: https://raw.githubusercontent.com/supabase/supabase/master/apps/studio/data/database-roles/database-role-update-mutation.ts and https://raw.githubusercontent.com/supabase/supabase/master/packages/pg-meta/src/pg-meta-roles.ts . Therefore the browser hides plaintext but does not meet the strict no-secret/verifier-in-server-logs requirement without additional controls. Root was told not to save a real password on that assumption.

Schema/binder review hashes, agreeing with backend reviewer:

- receiving-schema.sql89276ffbe890fae0d0452ae12d6577dba0480feae5f706dcca9115102ed0e265
- content-review-schema.sql8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9
- speaking-review-schema.sqle4b437a175bee8be922c8d390f12e699426750332a5424380d310ef247500e72
- bind_runtime.pycacabcbfa010a34aa3f609d4c51d7115fcf4cf77ba715684e204d75cbaa876ef

Two existing mocked binding tests passed: secret markers only in subprocess stdin, not argv/output; failed CLI output suppressed. Source restricts binding names and fixed Mitooni service IDs, skip-deploys and no provider key binding. Runtime role must own no protected tables/schema, hold no admin membership or BYPASSRLS, and get only reviewed per-table/per-column grants; no browser/API self-enrollment. Remote13RLS/no-advisor-lints evidence was coordinator-reported, not independently run by this worker.

### Concrete nonsecret SQL phases for root review (new project only; not executed)

This draft assumes root-confirmed postgres.rolconfig has only the existing search_path entry and all five changed logging GUCs are absent. If that changes, stop and regenerate exact restoration; the static RESET sequence below is not a general snapshot restorer. Extra capture settings must first be observed safe; this draft must be extended/re-reviewed if any extra setting needs modification. Replace each PUBLIC_NONCE/BASE_HASH placeholder with validated nonsecret UUID/hash from fixed new-project metadata; never interpolate a password. Every MCP call must explicitly pin project syczumdwgabypxkopkpn.

Nonsecret metadata precheck:

```sql
SELECT name,setting,context FROM pg_settings
WHERE name=ANY(ARRAY[
 'log_statement','log_min_error_statement','log_min_messages',
 'log_min_duration_statement','log_min_duration_sample',
 'log_parameter_max_length','log_parameter_max_length_on_error',
 'auto_explain.log_min_duration','auto_explain.log_nested_statements',
 'log_statement_stats','log_parser_stats','log_planner_stats','log_executor_stats',
 'pg_stat_statements.track','pgaudit.log','shared_preload_libraries','cron.database_name']);
SELECT name,default_version,installed_version FROM pg_available_extensions WHERE name='pg_cron';
SELECT md5(COALESCE(array_to_string(rolconfig,E'\n'),'')) AS original_roleconfig_hash
FROM pg_roles WHERE rolname='postgres';
```

Required additional effective controls: present log_min_duration_statement/log_min_duration_sample/auto_explain.log_min_duration are -1; log_statement_stats/log_parser_stats/log_planner_stats/log_executor_stats are off. Parameter logging is considered with canonical logging controls; root must inspect defaults and disable any separate active capture before admitting real data. Missing optional auto_explain settings mean its logger is not registered in that session, not permission to ignore a later session that loads it. The same-operation gate must recheck all present capture paths.

Watchdog prerequisite DDL, after extension availability/preload and root approval:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE SCHEMA mitooni_bootstrap AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA mitooni_bootstrap FROM PUBLIC,anon,authenticated,service_role,mitooni_api,mitooni_browser;
CREATE TABLE mitooni_bootstrap.leases (
 nonce uuid PRIMARY KEY,
 project_ref text NOT NULL CHECK(project_ref='syczumdwgabypxkopkpn'),
 purpose text NOT NULL CHECK(purpose IN ('proof','credential')),
 phase text NOT NULL CHECK(phase IN ('prepared','armed','restored','restore_mismatch')),
 original_roleconfig_hash text NOT NULL CHECK(original_roleconfig_hash ~ '^[a-f0-9]{32}$'),
 deadline timestamptz,
 job_id bigint UNIQUE,
 heartbeat_at timestamptz,
 restored_at timestamptz,
 cleanup_failed boolean NOT NULL DEFAULT false
);
ALTER TABLE mitooni_bootstrap.leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE mitooni_bootstrap.leases FROM PUBLIC,anon,authenticated,service_role,mitooni_api,mitooni_browser;
CREATE FUNCTION mitooni_bootstrap.restore(p_nonce uuid,p_force boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql SET search_path=pg_catalog AS $restore$
DECLARE l record; actual_hash text;
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Bootstrap owner mismatch'; END IF;
 SELECT * INTO l FROM mitooni_bootstrap.leases
  WHERE nonce=p_nonce AND project_ref='syczumdwgabypxkopkpn' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Bootstrap lease unavailable'; END IF;
 UPDATE mitooni_bootstrap.leases SET heartbeat_at=clock_timestamp() WHERE nonce=p_nonce;
 IF l.phase='prepared' THEN RETURN false; END IF;
 IF l.phase NOT IN ('restored','restore_mismatch')
    AND NOT p_force AND (l.deadline IS NULL OR clock_timestamp()<l.deadline) THEN RETURN false; END IF;
 -- Exact prior-absence restoration: does not touch search_path or any other role entry.
 ALTER ROLE postgres RESET log_statement;
 ALTER ROLE postgres RESET log_min_error_statement;
 ALTER ROLE postgres RESET log_min_messages;
 ALTER ROLE postgres RESET "pg_stat_statements.track";
 ALTER ROLE postgres RESET "pgaudit.log";
 SELECT md5(COALESCE(array_to_string(rolconfig,E'\n'),'')) INTO actual_hash
  FROM pg_roles WHERE rolname='postgres';
 UPDATE mitooni_bootstrap.leases
  SET phase=CASE WHEN actual_hash=l.original_roleconfig_hash THEN 'restored' ELSE 'restore_mismatch' END,
      restored_at=clock_timestamp()
  WHERE nonce=p_nonce;
 IF actual_hash=l.original_roleconfig_hash THEN
  BEGIN
   PERFORM cron.unschedule(l.job_id);
  EXCEPTION WHEN OTHERS THEN
   UPDATE mitooni_bootstrap.leases SET cleanup_failed=true WHERE nonce=p_nonce;
  END;
 END IF;
 RETURN actual_hash=l.original_roleconfig_hash;
END $restore$;
REVOKE ALL ON FUNCTION mitooni_bootstrap.restore(uuid,boolean)
 FROM PUBLIC,anon,authenticated,service_role,mitooni_api,mitooni_browser;
```

No SECURITYDEFINER, secret, cipher or dynamic restore SQL is present. The function is private, admin-owned, RLS owner-admin only, and only resets the specifically confirmed absent entries. Failed cleanup cannot roll back prior restoration because unschedule has its own exception block. Cron scheduling names are unique per nonce and must be checked absent first because Supabase cron.schedule overwrites an existing job sharing its name. Root must verify runtime/browser roles cannot use bootstrap schema/function or cron schema.

For proof lease, insert a prepared row with purpose proof and actual baseline hash; schedule `SET statement_timeout='5s'; SELECT mitooni_bootstrap.restore('PUBLIC_NONCE'::uuid,false);` minutely under postgres/database postgres, record returned job_id, then observe an independently scheduled heartbeat while still prepared. Apply ONLY baseline-valued five role overrides, never suppression; set proof phase armed with a past deadline. Observe actual scheduled restoration to original absence/hash and normal effective settings on a new backend. Failure means STOP. This is the permission/scheduler/exact-restore acceptance test. No password or private GPG key is needed for this proof.

For real lease, use a fresh nonce/purpose credential, new unique scheduled job and independent heartbeat; then arm deadline=clock_timestamp()+interval '90 seconds'. Require at least10seconds before deadline on secret-operation admission. Activate only the reviewed five role defaults:

```sql
ALTER ROLE postgres SET log_statement='none';
ALTER ROLE postgres SET log_min_error_statement='panic';
ALTER ROLE postgres SET log_min_messages='fatal';
ALTER ROLE postgres SET "pg_stat_statements.track"='none';
ALTER ROLE postgres SET "pgaudit.log"='none';
```

These statements contain no credential. A fresh same-project connection must show actual expected values, active exact scheduled command/owner/database and valid nonce/lease. Synthetic dynamic-failure canary and log/statistics checks happen next. Secret generation remains forbidden until proof and local helper/GPG tests are complete. Root finally calls `SELECT mitooni_bootstrap.restore('PUBLIC_NONCE'::uuid,true);`, confirms return true and exact roleconfig hash, verifies fresh effective settings and closes/recycles bootstrap sessions; only then removes its own job/lease/function/schema as authorized. The independent job remains active on mismatch/failure to preserve recovery.

Secret SQL design must use a local plaintext variable only after the same-call gates. Backend reviewer and root own final syntax/test review; no untested executable secret block is provided as approval. Envelope is exact schemaVersion/projectRef/role/nonce/expiresAt/password;96lowerhex password from48randombytes; exact second-resolution UTCZ expiry <=300seconds and independently expected by local helper. Encrypt raw binary PGP with verified RSA encryption-subkey public packet, cipher-algo=aes256/compress-algo=0; return single-line base64 (remove Postgres encode newline wrapping) inside public outer envelope with recipientFingerprint=encryption-subkey fingerprint. GPG must verify DECRYPTION_KEY first=subkey/second=expectedprimary plus DECRYPTION_OKAY/GOODMDC. Query cancellation and assert_failure need explicit handlers because OTHERS excludes them. Generic failure status/new generic error only, no SQLERRM/DETAIL/original exception propagation; whole secret subtransaction rolls back on failure. Local helper's expected nonce/expiry/fingerprints are supplied independently, not trusted solely from encrypted outer input.

### Implemented nonsecret credential guard and issuer review

Root expanded ownership to new `platform/backend/deployment/content-review-beta/credential_guard.sql` and focused `test_credential_guard.py`, then delegated actual `credential_issue.sql` template review/patch. Guard SHA **045da6e711fec5c5286647244d425748d19eba1d01eee775fbe9d5558b2cbbec**: eight SECURITYINVOKER functions, private admin/RLS metadata, fixed role/project and seven-GUC allowlist. Added auto_explain.log_min_duration=-1 because actual baseline was10000 and log_parameter_max_length=0 because baseline was-1; all seven overrides originally absent. Scheduler10seconds, harmless baseline proof20seconds, credential lease90seconds, same-call actual-state guard >=10seconds remaining. Separate actual cron PID/job_run_details evidence is required for heartbeat and automatic proof restoration. Old restored-lease callbacks return before changing settings, preventing a stale callback resetting a newer lease. Cleanup failure is isolated after restoration; exact resets preserve existing search_path. Guard contains no random-password generation/encryption/password statement.

Eight focused static security-contract tests passed after issuer test addition. They verify executable SQL boundaries and no-secret guard source, exact changed/reset whitelist, stale-callback safety, real scheduler PID evidence, baseline/credential separation, privilege/current-setting/deadline gates and generic issuer rollback. These are static regressions, not actual SQL execution proof.

Coordinator independently applied only new-project guard DDL. Actual harmless proof: noncee9f81bc3-5398-4744-a3e0-4d69ef452811/job1; scheduled heartbeat PID10272 matched successful job_run_details; automatic restore2026-11-07T01:32:25.519193Z; original roleconfig hash equalitytrue; cleanup_failedfalse; jobinactive; fresh PID10302 seven effective settings exactly baseline. This is coordinator-reproduced nonsecret server evidence, not a secret operation by this reviewer. Root also independently proved real pgcrypto→GPG AES256/compress0 roundtrip using only a synthetic96hex envelope, correct RSA encryption-subkey/primary fingerprints and boolean output. No actual password existed at that checkpoint.

Actual issuer template reviewed/modified SHA **f7328791a7863317abb7a7f3859b20d12e3ade080c034c98410606317eb1b10f**. Added actual password_encryption=scram-sha-256 and canonical UUIDv4/encryptionFingerprint syntax gates BEFORE gen_random_bytes48. assert_ready is first; bound JSON encrypts before fixed-role ALTER; local plaintext cleared; assert_failure/query_canceled/OTHERS handler returns only failed status and rolls back the enclosing block, never SQLERRM/context/detail. Final SELECT returns public encrypted envelope only. Root must verify DO→transaction-local GUC→lastSELECT transport behavior and generic handler with the EXACT UNSUBSTITUTED template (invalid nonce guarantees no generation), then actual suppressed-state nonsecret dynamic-failure/log/stat canary before substituting real context. No execution approval is inferred merely from source review.

Local cipher helper inspection SHA15519a751114f3e5d8e30294c9c8024ededea388606e09fce8f6a861543e9b96 plus binder:36focused tests independently passed. Own `/private/tmp/mitooni-runtime-review-security/handoff_probe.py` passed two-caller nonce race (one bind only), public receipt privacy, unknown-binding exception redaction and no-repeat after uncertainty, using mocked decrypt/bind and temporary synthetic home. Requested one durability correction: fsync the containing directory after public nonce receipt creation, before decrypt/bind; file fsync alone does not durably establish a newly created directory entry across crash. Final helper verdict pending that small fix/retest. No real GPG/CLI/provider operation in own fresh adversarial probe.

### Dedicated public-Auth AMD64 image evidence

Independently ran exact **sha256:4ae1f9bf6e93873161b6b48ef66373039f85a2fbbdb95f0664dd2eccb0bab0c2**, networknone, UID10001, Linux/amd64 on local ARM host(emulation warning recorded). Public build-auth JSON exactly matches https://syczumdwgabypxkopkpn.supabase.co. Current excluded smoke harness reads that public origin for synthetic startup fixtures, so missing/tampered media failure is attributed to the actual loader before database access rather than an earlier mismatched-auth gate.45serving modules import, app.corpus absent; canonical855...095/28assets/22holds unchanged,44targets/16servingassets; actual PNG/MP3 fixture HTTP privacy and invalidmedia startup gates passed. No real Auth/database credentials, network, provisioning or deployment used in this independent image probe. This supersedes earlier image identity only, not a claim of live hosted operation.

### Final local handoff and fixed-expiry closure

Backend corrected directory-entry durability before decrypt/bind. Independently inspected helper SHA **1f93bdd4308880a9892614bd4d80790e8b3e52557a6c3b6b523b9d45f6282ebe** and test SHA **fc54c21ddb51a0c15252ff5e3cc68896ee757951e936f7e59879e8122539b28c**: newly created nonce receipt is file-fsynced and its O_DIRECTORY/O_NOFOLLOW directory descriptor is fsynced before uncertain external action. Failure leaves the consumed receipt and produces a generic failure. Independently reran helper/binder/guard selected tests: **45 passed**. Own concurrent/uncertain handoff probe reran against this source and passed; first invocation used the wrong working directory and failed to import without executing the probe, corrected to app root. This is mocked transport evidence only.

Backend independent reviewer accepted guard045da under the fixed-seven-originally-absent defaults and single-operator boundary, but correctly objected that server-chosen now+240 expiry could not satisfy independently supplied helper context. Root delegated the correction: issuer SHA **dc8da6f00865c6cf64d9ff0284bad211011058bf232b1aa8b585aa2fd63b737f** pins public __EXPIRES_AT__ BEFORE arm. Strict UTC-second syntax, calendar cast, exact formatting roundtrip, >now70seconds and <=now300seconds checks precede RNG; the exact same public value feeds both envelopes and independently supplied helper arguments. No returned envelope supplies its own trusted expiry. No helper source-level blocker remains at this checkpoint.

Coordinator additionally reports real new-project nonsecret transport proof: DO transaction-local canary returned through final SELECT, next fresh call returned NULL; SCRAM enabled; exact unsubstituted issuer returned only failed status with no RNG. Baseline WARNING observability positive-control marker appeared once in query_logs; all five runtime/browser/public roles lacked cron/admin-schema capabilities. These are coordinator remote observations, not independent SQL execution by this reviewer. Actual suppressed-state nested dynamic-failure + WARNING log/statistics canary remains required before secret generation; a failed/unknown canary or expired lease requires immediate forced exact restoration and no generation. Source agreement is conditional on those already-defined operational gates and fixed new empty project, not approval for go-live/deploy/paid calls.

### Coordinator-executed credential operation — completed checkpoint

Root reports the reviewed operation completed on dedicated new project syczumdwgabypxkopkpn only, using issuer dc8da6f00865c6cf64d9ff0284bad211011058bf232b1aa8b585aa2fd63b737f, guard045da6e711fec5c5286647244d425748d19eba1d01eee775fbe9d5558b2cbbec and helper1f93bdd4308880a9892614bd4d80790e8b3e52557a6c3b6b523b9d45f6282ebe. This section attributes remote operation evidence to the coordinator; this reviewer did not independently execute remote credential SQL or inspect plaintext.

Root observed baseline positive WARNING marker count1, then armed credential lease nonce7cc18140…/job2. A fresh connection passed same-call assert_ready with actual hardened settings; nested dynamic missing-role failure was caught and WARNING canaries issued without private data. pg_stat_statements canary matches0; query_logs canary matches0 after10seconds. Log ingestion is asynchronous: the zero-match observation alone is not proof of exhaustive log absence. Actual same-call effective logging gates, disabled statistics capture and reviewed generic error handling are the primary controls.

Issuer returned only encrypted envelope matching precommitted expiry/nonce/context. Immediate finally restoration returned true. Fresh backend PID11721 showed all seven effective settings at baseline, original roleconfig hash equalitytrue, phaseRESTORED, cleanup_failedfalse and jobinactive. Root further checked no postgres backend begun within the suppression window remained open, runtime LOGINtrue with super/bypassfalse, and no API memberships/elevated capabilities.

Actual GPG handoff bound only MITOONI_DB_PASSWORD through the existing fixed Railway stdin binder with --skip-deploys. Root reports successful binding without plaintext in files/tool output/logs, no raw private key or secret context shown. No provider AI calls occurred. Root authorized private internal beta source/config activation and hosting upload; this is separate from this scoped security evidence and does not turn it into a public go-live verdict. Temporary private key home is retained only until root verifies actual TLS operation and performs the agreed cleanup. No additional source changes, permission gate or repeated unchanged-source tests are requested by this checkpoint.

### Bounded public CA integration review — intake/preflight

Scope: independent read-only review of hosting-owned Docker/context public CA addition, exact rebuilt image and network-none serving smoke. No database/role/password/config mutation by this reviewer. Root/app AGENTS explicitly reread; Supabase skill applies. Four preflight answers: (1) verify certificate identity, CA constraints, OS trust placement and strict hostname verification independently, rather than treating a TLS error workaround as sufficient; (2) start from actual downloaded public certificate bytes, actual repository diff/context manifest and exact image filesystem; (3) use SHA256/openssl certificate inspection, source-level allowlist/path review, adversarial temporary fixtures and network-none exact-image probes; (4) pinned PEM+DER fingerprints, wrong/private/symlink certificate rejection, effective root in OS trust and existing package/privacy smoke on the new image provide independent evidence. Actual cloud strict TLS startup must be proved by the coordinator after approved activation; old image smoke is not that evidence.

Observed public file /private/tmp/mitooni-supabase-public-ca-20261107.crt SHA256700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7; DER SHA256807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA. OpenSSL shows self-issued Supabase Root2021CA, critical CA:TRUE, CertificateSign/CRLSign, validity2021-04-28 through2031-04-26; self-signature verification succeeds. These are public trust-anchor bytes, not credentials. Root independently located the exact download URL in actual dedicated-project dashboard settings: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt . This reviewer did not repeat authenticated dashboard use or cloud connection.

Actual ReceivingTarget.connection_options remains sslrootcert=system and sslmode=verify-full for production, with no code change requested. Current official connection guide https://supabase.com/docs/guides/database/connecting-to-postgres (updated2026-10-27, accessed2026-11-07) was fetched; skill-required changelog.md fetch failed browser unsupported text/markdown then shell DNS resolution, recorded as unavailable rather than silently verified. No long research expansion needed for this pinned-byte packaging change. Root reports three consistent cloud probes distinguishing successful TCP/PGTLS negotiation from system trust error verifyCode19 and strict PG OperationalError/nullSQLSTATE; diagnostic command override was restored. These are coordinator observations and not independent cloud proof by this reviewer.

### Public CA integration — independent source/context/image agreement

Reviewed Dockerfile SHA97057b4f55439f1a70cf15f078cb26f89297ccc52d8108c5dd62dbcdc3ae69ca and assembler SHAa02d172ac842298c00446b2b56bf7daf8ab1108420d48fb84168d19eafe2b81f. Assembler copies only fixed public filename through safe_file/no_symlinks and rejects anything differing from the pinned PEM SHA. Docker independently checks that SHA before update-ca-certificates, preserving the base trust store. This exact-byte boundary rejects other CAs, private-key replacement and appended private keys without broadening accepted PEM types. Own three synthetic negative probes passed; focused assembler/entrypoint tests15passed with one existing Starlette deprecation. Hosting's17 count additionally includes binder tests; no count disagreement.

Independently hashed all371 admitted files in actual /private/tmp/mitooni-review-beta-context-dedicated-20261107-v2-ca. Manifest SHA **c9626b635609de0c32c8d3da4ff6dde133de5ce5d8520ba12bd711882f3a3927**. Compared to prior dedicated370-file context: only added supabase-root-2021.crt and changed Dockerfile; removednone, runtime/frontend/edition bytes unchanged. Private keys, environment files, credential SQL/helpers and private app/corpus code absent. Actual unchanged postgres_target.py SHAfc4fb1b13917d3e4b97971ff4734ce624ef7f46fc590d0f7bf91ae99bd0a1256.

Independent network-none run of exact frozen Linux/amd64 image **sha256:92d0685af8479b19c5f17af558022b61d45992f823036db638237e6f2bda5a8e** completed exit0, UID10001 on ARM-host emulation (architecture warning recorded). Own probe checked copied PEM and DER exact fingerprints; Python default OS trust includes that DER while retaining >100 roots, check_hostname=true/CERT_REQUIRED; OpenSSL verifies the public root using /etc/ssl/certs/ca-certificates.crt. Actual ReceivingPostgresTarget production options remain sslrootcert=system/sslmode=verify-full with empty client certificate/key and synthetic password only. Public buildAuth exactly dedicated syczumdwgabypxkopkpn origin. Existing smoke independently rerun on this exact image:45imports, private authoring code absent, canonical855...095 unchanged28assets22holds, fixture private PNG/MP3 HTTP, missing/tampered media rejection and actual startup stop before DB, default providerunavailable. Probe /private/tmp/mitooni-runtime-review-security/image_ca_probe.py was passed on stdin and excluded from runtime image.

Scoped source/context/image AGREED; no remaining substantive objection. This proves pinned trust installation and private serving regression boundaries, not actual cloud server-chain/hostname verification or authenticated teacher journeys. Coordinator-authorized strict hosted DB startup/readiness then anonymous denial is the appropriate next actual integration proof. No database/role/password/config mutations, live AI, private credentials, deploy or external action were performed by this reviewer. No public go-live verdict is implied.

### Final PostgreSQL driver trust-path closure

Root's actual cloud follow-up distinguished Python system trust from psycopg_binary's bundled crypto defaults. Root reports explicit /etc/ssl/certs/ca-certificates.crt with verify-full successfully connected and ReceivingTarget.verify_connection passed restricted API identity/TLS/schema/role checks; default system mode had failed because bundled crypto compiled default /host/tmp/libpq.build/cert.pem does not exist. These live connection observations are coordinator-attributed, not reproduced over network by this reviewer.

Hosting's minimal correction is Docker ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt. Independently compared actual v3-ca-path context to reviewed v2-ca: same371admittedpaths, all file hashes verified, ONLY Dockerfile changed by this ENV continuation. Context manifest **3fff2792e248c1faed24dcc9debe110768b097e1924b89781c031a537d7e8bb8**; Dockerfile **ad35c99b691e138978f570b7a82fee1ac8289b5c1d1926f67efe2db8b748dc15**. No application/API/ReceivingTarget/schema/Auth/package changes; prior private serving smoke remains source-equivalent.

Independent network-none probe on exact frozen image **sha256:4e8a67b68d74a8e0bc4d15b0b97bfd56933443cf59d8e4dce9d1a9ccb59f3043** completed exit0 as UID10001 (AMD64-on-ARM warning). Direct ctypes loading of actual psycopg_binary.libs/libcrypto-15969dba.so.3 confirms X509_get_default_cert_file=/host/tmp/libpq.build/cert.pem and X509_get_default_cert_file_env=SSL_CERT_FILE. Actual bundled-library X509_STORE_set_default_paths followed by X509_STORE_CTX_init/X509_verify_cert successfully verified the exact pinned public root using effective ENV OS bundle. This directly verifies the driver's crypto trust path rather than inferring it from Python ssl. Canonical package hash/28assets and dedicated public Auth origin also passed. First probe import failed because psycopg_binary requires psycopg imported first; corrected import then completed successfully, no credential/network actions. Own probe /private/tmp/mitooni-runtime-review-security/driver_ca_path_probe.py is excluded from shipped image. Scoped final source/context/image agreement sent to root and hosting; strict production verify-full/system remains unchanged.

Root also reports cleanup after successful actual strict TLS validation: terminated only its own ephemeral GPG agent and removed entire owned0700home07 including private-key/revocation material; retained only public consumed-nonce receipt review/content-20261106/credential-handoff-receipt-20261107.json mode0600. No password/private-key read/output reported. No further mutation, generic research or unchanged-source retest requested. Final hosted readiness and teacher-authenticated journeys remain coordinator evidence to obtain; this bounded review makes no public go-live claim.

### Independent hosted public boundary proof — 2026-11-07

Root reports deployment95e98a94-7a38-474e-ae4e-5929fc686657 SUCCESS at02:00:35Z. Independently performed actual read-only HTTPS from this reviewer's execution environment against https://teacher-review-production.up.railway.app with no Authorization, cookies, valid tokens, identity/customer inputs or provider calls. This is hosted evidence distinct from earlier network-none fixture tests; deployment ID is coordinator-attributed, not derived from the public HTTP response.

Observed exact HTTP results: /ready200 application/json; /200 and /app/content-review200 HTML. All three carried Cache-Control:private,no-store and X-Content-Type-Options:nosniff. The shell's referenced public JavaScript was fetched in memory only; dedicated https://syczumdwgabypxkopkpn.supabase.co origin present, sb_secret_ and service_role markers absent; no bundle or public key bytes printed/saved. This marker check is bounded evidence, not an exhaustive secret scan.

/api/content-review/catalog401. Chose actual projected PNG and MP3 IDs plus exact canonical packageHash/targetHash from the immutable local reviewed package and requested those real hosted asset routes anonymously: both401, JSON rather than binary. All three protected denials carried Cache-Control:private,no-store, Vary:Authorization and X-Content-Type-Options:nosniff.

/private/review/manifest.json404; /content/source-index.json404; /.env404; /deployment/entrypoint.py404; /app/corpus/404; /review/content-20261106/editions/85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095/manifest.json404. All six were JSON with private,no-store/nosniff, not SPA HTML or file content. No environment file content was opened: /.env was only an unauthenticated external deny-boundary request returning404.

Probe /private/tmp/mitooni-runtime-review-security/hosted_public_probe.py completed exit0. First two local setup attempts failed before network due missing import path and relative package root; PYTHONPATH plus absolute resolved package root corrected them. No implementation change or authenticated action occurred. Scoped hosted readiness/anonymous boundary AGREED. This does not prove valid teacher content access, teacher revocation journey, three pending human password forms, Iranian-network reachability, assessment calibration or public go-live readiness. Stopped at requested read-only checkpoint.

### Bounded media measurement-cache review — design preflight

Root observed actual /ready6.863seconds and three concurrent200 responses12.865/12.892/13.253seconds against a15second client abort, before additional Auth latency. These are coordinator measurements, not reproduced by this reviewer. Scope is measurement memoization only; no package/body/authority cache or DB/Auth/credential change. Four preflight answers: (1) challenge cache poisoning and invalidation before treating warm speed as success; (2) start from actual verify_package_assets/measured_media byte-validation flow and actual hosted timings; (3) inspect exact source change, use synthetic decode counters/thread barriers/tamper fixtures plus actual canonical-package cold/warm concurrent timings; (4) unchanged percall safe-path/size/SHA checks, independent warm tamper/missing/symlink/expectedmetadata-drift rejection and demonstrably reduced decode work provide external evidence. No claim that this eliminates all request/Auth/DB cost.

Design constraints sent to backend before implementation: key resolvedpath+actual verified digest+MIME, bounded thread-safe singleflight, copied immutable scalar results, no failed-result memoization, decode failure unblocks waiters, first decode rehash before publishing. Everyload must still verify actual bytes and compare caller metadata outside cache, including unchanged25ms duration tolerance. Authority/package/assignment/revocation checks must stay live. Root must approve design checkpoint before implementation; reviewer owns probes/researchrecord only.

### Media measurement cache — independent source/probe agreement

Agreed smallest process-local measurement-only design before implementation: OrderedDict128scalar entries keyed resolvedpath+verifiedactualSHA+MIME, one globalcold mutex, no pending dictionary/negativecache/packagebody/binary/authority cache. Constraint explicitly accepted for this fixed immutable edition and one-CPU beta: a cold decode can block warm lookups and there is no strict total queue-latency bound; eager startup warming makes normal fixed-edition traffic warm. This is not approval for arbitrary request-controlled paths or general multi-tenant caching.

Frozen implementation independently reviewed/hashverified: app/services/content_pipeline.py **ece33ca2ea27d556f0e5b246f67f205fa41e4537068d10ab8d2661343b60a98a**; tests/test_content_media_cache.py **c22b5ee9c8e82c8aa61c04ef0dd5021ae20e83d16902e1fd1ed9b860d50ab036**. Every verify_package_assets call still checks safe_file and current actual size/SHA before lookup. On a cold miss, measurement is followed by safe_file/containment/resolvedpath/current-size/SHA recheck before publication. Cache contains immutable tuple-of-flat-scalars; callers receive fresh dictionaries. Expected size/duration/rate/channels/dimensions and source/spec/binding checks remain live; exact25ms tolerance unchanged. measured_media authoring/intake remains uncached. Lock context releases on exception; failed results never published;128LRU bound enforced. No authority or package-object reuse.

Own /private/tmp/mitooni-runtime-review-security/cache_probe.py passed warm same-size tamper/missing/symlink denial, expected width/rate/channels/duration drift denial despite warm results, first-decode concurrent byte mutation rejection and retry without poisoning, eight concurrent cold callers one measurement, failed measurement unlock/retry, and cached duration +24ms accepted/+26ms denied. Synthetic fixtures/mock counters establish boundaries without database/provider calls. Independently reran owner cache+pipeline suites: **82passed8.33seconds**. Owner separately reports119affected tests; this reviewer does not relabel that as its own execution.

Own actual immutable855...095 package timing (real bytes/ffmpeg; local Mac, no Auth/HTTP/DB): cold2.4511seconds with18PNG+10MP3measurements; warm0.0824seconds; three concurrent warm calls0.2881/0.2864/0.2855seconds. No additional measurement calls across those warm/concurrent loads; canonical package hash/28assets unchanged. These show measured local improvement, not hosted1CPU latency or Iranian-network success. Exact new image/context and hosted timings require coordinator integration evidence. Scoped cache source/probe agreement sent to coordinator and backend; no remaining substantive objection within fixed-edition boundary. No source/DB/Auth/secret changes made by this reviewer; teacher-authenticated flow remains pending human password forms.

### Exact cache image integration — independent bounded agreement

Independently verified actual v4-cache context /private/tmp/mitooni-review-beta-context-dedicated-20261107-v4-cache:371paths, every admitted file hash matches, manifest **8ed37e805e4bc6c4e13e9b5680d12db4ac4bcaf6ad9ed76ddce4c4618babe88e**. Compared against approved v3-ca-path: ONLY app/services/content_pipeline.py changed, exact previously reviewed SHAece33ca2ea27d556f0e5b246f67f205fa41e4537068d10ab8d2661343b60a98a. No Docker/CA/ENV/frontend/Auth/authority/package changes.

Own network-none exact-image probe **sha256:3c132dc6b542325134b88c31407db263f060d85a443b1642cc19a4d103252e43** completed exit0, UID10001, Linux/amd64 emulated on ARM warning recorded. Actual installed source hash matches reviewed source. Reused bundled-driver ctypes default-store certificate verification, not merely PythonSSL: actual psycopg libcrypto successfully verifies pinned Supabase public root through preserved SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt; dedicated public Auth origin/canonical package hash/28assets pass. No network/credentials used.

Disposable exact-edition copy loaded cold and warm:28cold measurements, zero warm repeats; warm MP3 same-size actual byte flip denied by Binary asset hash/size mismatch with no new decode. Cold8.317seconds, warm0.153seconds under local architecture emulation; these are not cloud1CPU timings. Copy-only permission adjustments were for synthetic tamper/cleanup; immutable packaged source untouched. Probe /private/tmp/mitooni-runtime-review-security/cache_image_probe.py excluded from image. Exact-image scoped AGREED sent to root/hosting; actual hosted benchmark is next coordinator evidence. No database/Auth/provider/config changes or deploy by this reviewer; stopped at bounded checkpoint.

### Three-account assignment checkpoint — independent aggregate database proof

Source revision45a4f27 verified; root/app instructions explicitly reread. Bounded preflight refinement: a professional checks effective grants/RLS and joins assignments to confirmed usable Auth users rather than trusting admin insertion success; primary material is live dedicated database catalog and aggregate rows; tools are one read-only SELECT via project-specific Supabase connector with fixed syczumdwgabypxkopkpn project ID; independent acceptance is aggregate3/3 exact-context usable assignments, no elevated runtime roles or roster-writing privileges. Named-account matching remains root's human-authorized check; no names/contacts/UUIDs/tokens/passwords were selected or returned by this reviewer.

Actual independent aggregate result: Auth total_users3/confirmed_usable_users3 (email_confirmed_at present, not deleted, no current ban). Assignment total3/exact_active_use_only3: productmitooni, issuerhttps://syczumdwgabypxkopkpn.supabase.co/auth/v1, packageHash85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095, statusactive and permission array exactly[review:use]. Non-use-only assignments0; assignments without confirmed-usable joined Auth user0. Assignment table RLS enabledtrue.

Effective privileges independently queried: mitooni_api assignment SELECTtrue and lock_revision column UPDATEtrue (existing concurrency mechanism), table INSERT/DELETE/UPDATEfalse and UPDATE on every roster/authority column (product_id,issuer,subject_id,package_hash,status,permissions)false. mitooni_browser/anon/authenticated/service_role assignment SELECT/INSERT/DELETE/tableUPDATE/roster-columnUPDATE/lock_revisionUPDATEallfalse. Runtime/browser elevatedflags(superuser/createdb/createrole/replication/bypassrls)0 and role memberships0. No DB/Auth changes, other-project/SQE access or provider calls performed.

Scoped aggregate-account/assignment/grant checkpoint AGREED. This proves three usable confirmed Auth rows and three exact-edition use-only assignments plus effective least-privilege catalog boundaries, not successful human teacher sign-in/session/content delivery. Valid teacher login still awaits human sign-in; no Iranian-network claim or public release verdict. Stopped at requested checkpoint.

### Hosted signed-in engineering smoke — independent aggregate persistence proof

Root reports human sign-in succeeded, real44-target catalog and fnd-reading-train opened; root entered eight synthetic engineering answers, blind-submitted, revealed notes and saved a comment expressly identifying engineering-only evidence rather than a teacher verdict/learner assessment. Browser observations belong to root. This reviewer performed two independent read-only aggregate SELECTs on dedicated syczumdwgabypxkopkpn only; no state bodies, answer/comment contents, contacts, UUIDs/tokens or passwords selected into tool output, no writes.

Observed1state/1owner. Exact smoke predicate count1 verifies dedicated issuer, canonical855...095 package, fnd-reading-train, revision4,8draftanswers/8submissionanswers, blind submission, nonnull reveal timestamp and engineering-only/nonteacher/nonlearner disclaimer predicates. Decisioncomment-only count1; emptyitemComments count1. Four operations/1owner, exactly one each draft:fnd-reading-train, submit:fnd-reading-train, reveal:fnd-reading-train, review:fnd-reading-train; stored outcome revisions[1,2,3,4]. No state without active exact use-only assignment; no operation without matching state owner. Other two assignments have no state.

Actual state/operation tables both RLSenabled; existing policy expressions include issuer+subject scope and current assignment checks. This proves aggregate persisted owner/context alignment and catalogued isolation predicates; it is not an authenticated cross-account adversarial read attempt. Scoped engineering persistence checkpoint AGREED. Root reports reload signed out consistently with original persistSession:false; human re-sign-in is still needed to verify recovered UI/export. Neither DB persistence nor a synthetic engineering comment is a teacher content verdict, learner score or authenticated recovery/export observation. Stopped at requested aggregate-only checkpoint.
