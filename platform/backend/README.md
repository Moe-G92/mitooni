# Mitooni backend

FastAPI account, planner, workspace and AI tutor integration beneath Mo's `web/` interface. The local slice persists learner drafts, frozen submissions, supported revisions, attributable tutor turns and accepted next steps in isolated PostgreSQL. Its original Reading and Task 2 activities are engineering fixtures, not a complete or teacher-approved IELTS curriculum.

## Setup and checks

Python `>=3.11,<3.14` is required. The final runtime checks used Python 3.13.11; Python 3.11/3.12 have lock-resolution and advisory coverage, without executed runtime validation.

From `platform/backend/`:

```sh
uv sync --frozen
.venv/bin/python -m pytest -q
```

The default test command skips PostgreSQL integration cases. To prepare the dedicated synthetic database and run the full suite:

```sh
.venv/bin/python -m local.manage start
.venv/bin/python -m local.initialize
.venv/bin/python -m local.upgrade_study
.venv/bin/python -m pytest -q --local-postgres
.venv/bin/python -m local.prove_study_restart
```

Wait for database readiness before initialization as described in [local/README.md](local/README.md). Coordinate an exclusive window for the full suite and restart proof: pause browser writes and the task API worker, then restore the API before releasing the window. Tests use disposable owners; publication checks temporarily alter and restore the synthetic catalog. The restart proof restarts only the labelled local database and verifies acknowledged work without resetting it or redispatching generation.

The final suite was independently reproduced with 271 passing tests and an actual PostgreSQL restart. SDK tests use the real Agents SDK with process-local mocked HTTP; they do not call a paid model. One Starlette TestClient/httpx deprecation warning remains. Exact dependency and review evidence is under `docs/foundation/research/` from the repository root.

## Application entrypoints

The default entry exposes `/health` and verified-identity `/api/me` only:

```sh
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Without explicit receiving configuration, protected identity returns 503. Identity is separate from membership, profile and entitlements; no account repository, worker or provider is activated by this default entry.

The explicit local entry serves synthetic authentication and a synthetic tutor runner with real local account/study PostgreSQL storage:

```sh
.venv/bin/python -m local.serve
```

It binds only `127.0.0.1:8009`. Database resources, fixture selectors, initialization and lifecycle are documented in [local/README.md](local/README.md). This entry provides no real Auth signup or live AI capability.

A receiving deployment composes `create_receiving_app` from `app.composition` with explicit matching production `BackendConfig`, `ReceivingPostgresTarget` and optional `ProviderConfiguration`. It verifies identity through the receiving Supabase issuer and uses dedicated PostgreSQL roles/schema and current product membership. A configured provider selects the actual Agents adapter and lifespan worker. Missing provider configuration leaves account/study storage available but rejects tutor admission with 503; it never selects the synthetic runner. Configuration is supplied explicitly; application code reads no environment files. See [deployment/README.md](deployment/README.md) for unactivated SQL and receiving configuration requirements.

## Study behavior and boundaries

The server owns content/assessment versions, access, draft revisions, submission conditions and next-step acceptance. Workspaces pin their first admitted edition. Independent work has no tutor dispatch before an explicit supported-help switch or permitted post-submit review; its own stimulus exposure does not prevent resuming the same attempt. Family exposure prevents offering new independent work on an exposed sibling.

Tutor requests reserve bounded model-call capacity and enter a durable queue. Polling provides status until validated output is committed; raw model candidates are never public. Completed messages retain captured-work attribution, citations, exact learner spans and qualitative feedback. The planner proposes only permitted next steps; learner acceptance and server validation control transitions. Lost acknowledgements recover through canonical snapshots and retained operation identity. Uncertain external dispatch is never automatically repeated. Cancellation prevents late publication but does not guarantee remote provider cancellation or a refund.

Account/study mutations require verified ownership, expected-user assertions, operation keys and revision checks. Membership, entitlements, RLS and current publication authority are rechecked server-side. Private API responses and errors use private/no-store headers; malformed Host authorities are rejected without echoing private input. Wire schemas are in `local/account-contract.json` and `local/study-contract.json`.

Reading's fixture check is raw practice accuracy. Tutor feedback is qualitative formative support, not a calibrated IELTS band, mastery result or human review. Structural/reference validation does not prove prose truth, pedagogic usefulness or complete curriculum coverage.

## Evidence and remaining limits

`PORT_PROVENANCE.json` records immutable BarEx source revision/hashes, adapted mechanics and receiving file hashes. No BarEx users, licensed content, secrets or business routes were copied. The independent `uv.lock` retains the reviewed SDK/runtime closure; final installed and universal dependency audits recorded zero known findings and no skips at review time.

Local PostgreSQL durability, authority and recovery checks do not establish hosted Supabase Auth/Data API/RLS parity, deployed TLS/network behavior, production retention/backups, live model availability/cost or teaching quality. Receiving SQL has not been applied remotely. Published non-fixture content, processing authority, domain evaluation and separate release approval remain inputs to hosted activation.
