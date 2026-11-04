# Backend foundation port implementation

Date: 2026-11-04. Owner: reuse/backend specialist, gpt-6.1-sol medium. Checkpoint: runnable S1 foundation complete, independently reviewed; not a full platform or release verdict. Authorized scope: `platform/backend/` plus this report. Root/app/source instructions, latest CHARTER/DECISIONS and port manifest read. No learner/corpus/env files or production services accessed.

## Preflight and choice

1. A top professional would keep privileged SDK creation lazy, prevent inherited source environment/roles from authorizing a new product, and expose only an honest verified-identity projection until membership exists.
2. Raw evidence: source transport/client/auth modules at `af57036ad18a45a0aa20a81202c9e0939ebd99d5`, their manifests/installed package metadata and the new receiving code. No source application module was imported during tests.
3. Exact transport copy plus small adapted configuration/client/identity modules; dependency pinning from source-compatible installed versions; receiving ASGI/fake-verifier/fake-HTTP tests and an independent egress-denied review. These test failure/retry boundaries without provider access.
4. Evidence of correctness: direct source hash equality for the copied transport, receiving tests rejecting unauthenticated/spoofed requests, bounded retry counts, route-surface assertions, explicit missing-config behavior and independent reproduction. None establishes live Auth, database isolation or Iranian reachability.

## Delivered

`platform/backend/app/db/read_retry_transport.py` is verbatim BarEx code. `app/db/supabase_client.py` adapts the source to a lazy instance tied to an explicitly supplied receiving `BackendConfig`; no global source client/config is inherited. `app/dependencies.py` retains provider-verified Bearer identity while removing source developer bypass, raw exception logging, internal allowlists, financial/role logic and environment reads. `PORT_PROVENANCE.json` records source/target SHA-256 and source revision for all three source-derived files. Copied transport source and target SHA-256 are both `93ef45427bddddf8aca5fdf5cfa8aad37f847ff2773dad70e0d998f1c31b8cff`.

New `app/config.py` requires explicit `mitooni` workload, environment, server credential, origin and expected Supabase project. Local development/test permits only loopback with an explicit local project; hosted production is intentionally configurable with HTTPS and a matching project reference. It does not read `.env` or any environment variables, including source credentials/allowlists. No blanket ban on intentionally configured hosted production or shared provider accounts was introduced. Runtime deployment-secret binding is not implemented in this bounded checkpoint.

New `app/main.py` has an application factory and two GET routes only. `/health` returns `{status:"ok"}`. `/api/me` returns verified `{id,email}` with no name/profile, entitlement, role or membership inference. Default app has no verifier/config and returns 503 on protected paths. Configured missing/invalid/expired credentials return 401 with `WWW-Authenticate: Bearer`; errors are raw FastAPI `{detail:string}`. Supabase identity in a shared project is not Mitooni membership. No content/business routes exist that could confuse the two; future data routes must add product membership and ownership checks.

Test injection is admitted only by explicit test-environment config; it is not enabled by a browser header or source bypass variable. No source main/server/router/worker, migrations, Stripe/Resend/OpenAI activation, profile fiction or automatic network/database operation was ported. CORS is closed by default. Frontend specialist was directly told the Bearer, identity-only projection and error shape.

## Dependencies and checks

Created independent `pyproject.toml`/`uv.lock`: FastAPI 0.115.14, HTTPX 0.28.1, Supabase 2.28.0, Uvicorn 0.36.1, pytest 8.4.2; the resolved dependency closure is constrained to exact compatible installed source versions. SDK transitive dependencies remain, but no full source manifest/lock was copied.

- Initial system Python package metadata probe showed FastAPI absent. Initial tests used the source `.venv` interpreter solely as a library runtime: 30 passed, with FastAPI/Python 3.14 deprecation warnings; no source app imports/env loading.
- `uv lock --offline` generated the target lock, then exact installed closure constraints were applied and the lock regenerated. `uv sync --offline --frozen` installed 56 packages into a new **receiving** `.venv` using cached artifacts, no network. Target Python is 3.13.11.
- `platform/backend/.venv/bin/python -m pytest -q`: **30 passed**, 2.97s on final implementer run, no warnings. Coverage includes missing/invalid/expired auth, spoofed identity/role inputs, provider identity mapping, absent config/source-env noninheritance, permitted explicit hosted config without calls, no production verifier injection, route allowlist, guarded local config, health, no mutation/RPC/auth/bodyful-GET retry, exactly one eligible read retry and SDK timeout retention.
- `uv lock --offline --check`: passed, 58 resolved package records. A prior combined invocation encountered sandbox cache access denial; immediate standalone check succeeded. One early test-writing command used the wrong working-directory-relative path and ran no tests; corrected before any passing result was claimed.
- Source Git status remains clean. No production/database/model/email tests, migrations or deployment were executed.

## Independent review and remaining limits

Security specialist inspected actual files and independently reproduced **30/30 tests** (0.75s). Additional denied `socket.connect`/`create_connection` and `httpx.Client.send` probes passed module import, default app construction, lazy SDK construction and close with synthetic local configuration. Reviewer found no blocking S1 issue; identity-only `/me`, no environment reads and no header/fixture bypass were confirmed.

Retained source transport sets `follow_redirects=True`. Independent reviewer recommends evaluating same-origin redirect restrictions before broader API/storage traffic carrying service API keys is admitted. This inherited behavior does not block the inert foundation but must be addressed in the next service boundary review. Real Supabase token validity/expiry behavior was mocked, not live-tested. The config's expected project is an explicit binding check, not automatic discovery or proof that the account is isolated. No data models/grants/RLS/tenancy or membership are implemented yet.

Verdict: **S1 bounded foundation ready for coordinator integration**, with independent security agreement on reviewed scope. No full-platform, learner-pilot or go-live approval. Restart from `platform/backend/README.md`, provenance and tests; add a deployment-specific target secret factory and membership/data contract only in the next authorized scope. Preserve the source and Mo's existing `web/` unchanged.

## Coordinator correction and final S1 evidence

The preceding 30-test evidence is historical. Coordinator review identified a real receiving-only concurrency/lifecycle gap: sync route threads could race lazy SDK construction, and shutdown retained a closed client. `TargetSupabaseClient.get()` and `close()` now share a lock; successful initialization publishes SDK/HTTP references together, failed SDK construction closes the unpublished transport, and shutdown resets both references before closing. A later lifespan constructs fresh resources. The lock guards construction/cleanup; normal ASGI shutdown must still drain in-flight requests before closing clients.

The identity endpoint now adds `Cache-Control: private, no-store` to successful and authentication-error responses, and Bearer scheme parsing is case-insensitive. Added checks use eight simultaneous callers, injected blocked/failing SDK construction, a concurrent close, repeated TestClient application lifespans, all relevant cache statuses and case variants. No provider calls or new dependencies.

Final implementer command `.venv/bin/python -m pytest -q`: **42 passed in 0.81s**. Provenance target hashes regenerated after changes; verbatim source transport hash remains unchanged. Independent security recheck requested for the updated files; prior no-blocking review applies only to the earlier 30-test snapshot until that recheck is recorded.

Coordinator relayed the updated independent security result: **42 tests reproduced and blocked-egress two-cycle SDK construction/close probe passed**, with scoped S1 acceptance restored; reviewer hashes/evidence are saved in `port-security-review.md`. This is independently reported reviewer evidence, not an implementer live-provider test. Coordinator accepted the corrected local S1 foundation scope. Final verdict: local backend foundation ready for integration; no production, service eligibility, membership, data or learner-pilot proof implied. Stopped after fixes and review evidence.
