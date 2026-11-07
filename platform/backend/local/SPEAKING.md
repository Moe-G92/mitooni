# Synthetic private Speaking rehearsal

This opt-in engineering harness uses synthetic identities and WAV bytes. It does not assess speech or call a model. Existing review setup must already be complete for the exact immutable package.

Apply only additive schema and explicitly grant the fixed synthetic reviewer speaking permission:

```sh
.venv/bin/python -m local.upgrade_speaking_review --package-root ABSOLUTE_PACKAGE_ROOT --package-hash EXACT_PACKAGE_HASH --grant-synthetic-speaking
.venv/bin/python -m local.serve --review-package-root ABSOLUTE_PACKAGE_ROOT --review-package-hash EXACT_PACKAGE_HASH --speaking-synthetic
```

No profile, original corpus, roster or existing work is reset. A revoked assignment is not reactivated. Without the opt-in runner, Speaking POST fails503 and accepts no job/reservation. The local runner returns explicitly synthetic insufficient-evidence feedback on all four criteria. No provider availability or scoring validity follows from this rehearsal.

Routes require verified bearer identity, current exact-package review assignment and both `review:use` and `review:speaking-evaluate`. Submission also requires expected-user/idempotency and immutable package/target/task/audio hash headers. POST only `audio/wav` uncompressed16-bit mono/stereo PCM,8–48kHz,0.25–180seconds, actual body at most18MiB. Server IDs replace caller paths/URLs. GET returns owned private summaries; authenticated audio fetch returns complete WAV (Range not supported). Browser creates/revokes local Blob URLs; bearer tokens never enter media URLs.

The pilot stores at most8 recordings/48MiB per owner/package. Configured call-unit ceiling at most8 is cumulative per owner/package, not a monetary estimate. A job reserves one unit atomically. Completed/uncertain dispatched work consumes that unit; predispatch failure releases it. No automatic retry follows dispatch uncertainty. Current authority gates every replay/playback/dispatch/commit. Revocation can leave a hidden immutable record and conservative reservation; its scheduler metadata is removed when claimed without authority, preventing repeated dispatch and queue starvation. Restoring such work requires an explicit administrative reconciliation policy; this harness does not reactivate assignments or automatically refund uncertain calls.

The exact raw-WAV POST alone receives the18MiB ASGI streamed-body bound; all other review routes keep512KiB. The middleware buffers before route authentication, and decoding occurs only after identity/assignment preflight. Bound host/proxy request concurrency and request timeout before any exposed beta: for example one worker and four concurrent in-flight requests, body cap18MiB, plus capacity for a48MiB private list read and one base64 provider request. Proxy/orchestrator enforcement and actual peak-memory measurement remain deployment acceptance items, not proven by local unit tests. Avoid unbounded workers or exposing the local harness.

Actual database tests use random synthetic owners and additive schema only:

```sh
.venv/bin/python -m pytest -q --local-postgres tests/test_speaking_review_runtime.py
```

Coordinate this window with other database users. Tests verify reopen/new-connection byte persistence, assignment/privacy/revocation, idempotency races, quota, fenced lease recovery, one-shot worker completion and post-dispatch unknown state. No test restarts or resets PostgreSQL. A separately coordinated restart can strengthen evidence; it is not implied by new-connection checks.
