# Local account/profile integration implementation

Date: 2026-11-05. Owner: reuse/backend specialist, gpt-6.1-sol medium. Authorized paths: `platform/backend/` and this record. Starting receiving revision `c82d9a6dcf7b00d3d2b66759352dba397152a41f`; source `af57036ad18a45a0aa20a81202c9e0939ebd99d5`, still clean on final check. Read applicable root/source/app instructions and current checkpoint. Mo `web/` governs UI/UX; this work supplies missing backend capability and does not revive the historical BarEx visual direction.

Verdict pending final independent review: **local account implementation ready, with real isolated PostgreSQL evidence**. No hosted Supabase/Auth, production, pilot or release approval implied. No provider configuration, real learner/corpus/secret/env transfer, outside message or production query occurred.

## Four preflight answers

1. A top professional would prove product admission, account-switch safety, transactional retry/revocation and storage durability before wiring a profile-shaped view. Necessary: issuer/subject/product boundary and honest unavailable states; future: real admission policy, production Auth/storage adapter and delivery integrations.
2. Raw material: actual source identity/transport/profile/bootstrap code, Mo's profile/form contracts, the accepted receiving foundation and a new synthetic-only PostgreSQL instance. No source learner or private material is needed.
3. Methods: retain exact source transport and adapted verified identity, add strict receiving DTOs plus a narrow local transactional repository, run actual role/RLS/concurrency/restart checks and independent security/browser validation. These test storage mechanisms without claiming provider authenticity from a fake verifier.
4. Independent correctness evidence: denied nonmember/inactive/other-user changes, exact CAS/replay results, unchanged source42 tests, corrupt-state safe recovery, real database restart retention and reviewer reproduction. Mock UI success alone is insufficient.

## What changed and why

Retained the BarEx-derived FastAPI/Supabase verified-identity and HTTP retry foundation. The verbatim source transport remains unchanged. `app/dependencies.py` now distinguishes rejected/expired provider credentials401 from unavailable/misconfigured provider503: SDK Auth API401/403 and known invalid-session/JWT400 codes reject, transport/retryable/rate/server/unknown configuration failures preserve the browser session with503. No provider token, raw exception or app_metadata role is logged/returned. Existing `/api/me` remains `{id,email}` only with its compatibility error shape.

`app/contracts/account.py` defines strict account/profile DTOs rather than copying legal plans or letting `Partial<Profile>` write authority. `app/routers/account.py` adds GET `/api/account`, POST `/api/profile/onboarding` and PATCH `/api/profile`, only when an explicit non-production repository is composed. Default foundation remains two routes; no silent database or fixture activation. `app/main.py` adds structured, sanitized errors and private/no-store plus `Vary: Authorization` on account/profile responses/errors. Machine-readable schemas are `local/account-contract.json`.

Account response: `{identity:{id,email},membership:{status,roles,entitlements},state,profile}`. Valid shared-issuer identity never self-enrols. None/inactive memberships return routing state with no profile/grants; protected writes403. A complete first onboarding creates revision1; profile is null beforehand. Name/preferences/goals/self-reported level are editable; identity email, plan, role, entitlements, accommodation and onboarding state are not. Stored notification choices activate no email/reminder service. No real enrollment/invitation/payment policy was silently chosen.

Mutations reject an expected-user mismatch **before repository access**, then require active membership and `profile:write`. A membership row lock serializes profile operations and conflicts with revocation. Profile CAS prevents lost updates. Owner/route/key/hash-scoped idempotency returns one logical result even after a committed write loses its acknowledgement. Replay composes CURRENT identity/membership with a historical validated profile snapshot; the frontend must not regress a newer cached profile revision. Request keys are replay-valid24hours; storage is limited to256 recent operations/member and16KiB/outcome. Expired entries are physically removed on the next successful new mutation, not by an unimplemented background purge.

Malformed/version-drift stored profiles/outcomes now produce generic `store_unavailable`503 without raw Pydantic input in response or logs, including null/string/list replay snapshots. This was a real independent-review finding corrected before final acceptance. The backend does not fabricate default learner names/targets/profiles or use a store-outage memory fallback.

## Isolated datastore and security boundary

New resources only: container/network/volume `mitooni-account-20261105`, all labelled `owner=mitooni-local`; database `mitooni_local`, dedicated127.0.0.1:55439 binding; cached image pinned `postgres@sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193`, observed PostgreSQL17.10. Source container names/ports were inspected to avoid collision; no existing container, volume, network or configuration was changed.

Initial Docker `--internal` network suppressed the requested loopback publishing on this daemon; only our new container/network were recreated as a dedicated normal bridge, retaining its own volume. The final port maps only127.0.0.1 and shares no network with another workload. Synthetic-only trust authentication has no password and is not a production security configuration: another local process can access this synthetic database. No actual credential was copied/generated/logged. Connection configuration pins host AND hostaddr to loopback, explicit target database/role/timeouts and a nonexistent password-file path, avoiding inherited source connection/password configuration.

`local/schema.sql` is a new local-only schema script, not a production/Supabase migration. Composite product/issuer/subject ownership spans memberships/profiles/operations; product is constrained to Mitooni. RLS is enabled; browser/public privileges revoked. `mitooni_api` has scoped reads/profile writes/operation dedupe only; row locking requires column-level UPDATE on membership revision, without UPDATE on state/roles/entitlements. Trusted membership seeding is a separate local admin CLI, not an HTTP route. Tests confirm denied role/state/insertion escalation and default-deny RLS even when a synthetic browser read grant is temporarily added/rolled back. The trusted API role sets transaction-local owner scope; these credentials must never be exposed to a browser.

`LocalPostgresConfig` supports only the explicit receiving local database/issuer and non-production environment. Factory rejects production local-repository/fake-verifier composition. `local.serve` is an opt-in loopback-only entry absent from default production imports, with deterministic synthetic A/B/inactive/nonmember/readonly selectors. Source SDK/Auth-only browser + Bearer BFF remains the eventual real identity pattern; this slice uses a direct PostgreSQL local repository for proof and does not establish hosted Supabase role/exposure/SDK parity.

## Reproduction and actual checks

Full commands, fixture mapping and cleanup are in `platform/backend/local/README.md`. From `platform/backend/`:

```
uv sync --frozen
.venv/bin/python -m local.manage start
.venv/bin/python -m local.initialize
.venv/bin/python -m pytest --local-postgres -q
.venv/bin/python -m local.prove_restart
.venv/bin/python -m local.serve
```

Wait for local PostgreSQL readiness before first initialize. These resource commands check the dedicated owner label; stop retains its named volume, destroy explicitly deletes only this synthetic workload. The integration suite resets synthetic fixture profiles/operations, so coordinate database ownership before running during browser review.

- Final implementer full suite: **94 passed in2.64s**, including the accepted42 foundation tests,21 new unit boundary cases and31 actual PostgreSQL cases. No integration cases silently skipped on this run. Unit-only63 cases also passed independently before final integration.
- Actual owner-only `local.prove_restart`: **PASS**, acknowledged profile survived real database-container restart and construction of a new application/connection lifecycle on PostgreSQL17.10. This is beyond in-memory repository evidence.
- Coverage includes shared-issuer nonmember/inactive/permission denial; cross-user/profile SQL isolation; denied authority mass assignment; expected-user guard before side effects; initial and patch idempotency, key/payload conflict, historical snapshot revisions/current authority; competing CAS/onboarding; revocation-before-waiting-write; grant/RLS checks; expiry/count limits; safe401/503; store outage; corrupted stored GET/PATCH/replay shapes without input leak; commit-then-lost-ack retry producing one result.
- `uv lock --offline --check`: passed,61 package records. Psycopg binary3.2.13 is the only new direct dependency; existing exact source-compatible runtime pins retained. Offline resolution initially lacked the driver; pinned artifact was downloaded and locked. No alternate provider or live database was provisioned.
- `compileall` of app/local/tests passed. Source working tree clean. Source provenance/hashes and final receiving app snapshot hashes are in `PORT_PROVENANCE.json`.
- Early checks failed because of Docker sandbox socket access, the internal-network publishing behavior, and two test-only assertions (UUID helper/type and RLS catalogue query including indexes). Corrected and rerun; none was reported as successful evidence before correction. A misplaced initial source-writing working directory was corrected by moving only the newly created files into the assigned target and removing empty scratch directories; no existing work overwritten.

Local HTTP harness is running127.0.0.1:8009, latest process session23260, restarted after final file corrections. This is explicitly synthetic Auth, not real Supabase login. Frontend specialist received exact DTOs/error codes/fixture selectors/proxy requirements and revision-replay warning. No wildcard CORS, cookie façade, advertised SMS/OAuth feature or mock fallback was introduced here.

## Review and handoff state

Security reviewer identified and challenged the corrupt stored-profile/outcome error path; fixes and null/string/list cases passed the final real suite. Final mutating database test ownership was explicitly handed to security after94 tests and the database-restart proof; implementer will not mutate/reset fixtures during independent review. Frontend/browser review coordinates subsequent reseeding through that owner. Independent final results will be appended below when received.

Remaining limits: synthetic verifier is not provider auth; local PostgreSQL is not hosted Supabase parity; no production membership/enrollment/admin API, full profile/email recovery, notification delivery, account deletion, content/attempt/coach service or Iranian network/service eligibility is proven. Source transport redirect-follow policy remains an acknowledged future service-boundary review item. Product data/processor/release gates from the foundation record remain. Stop at the reviewed local integration checkpoint; no deploy/push/production claim.


## Final review and local operational-policy clarification

Coordinator independently inspected the DTOs/routes/repository and accepted the scoped local design. Coordinator relayed final independent security reproduction: **94 tests and actual database-restart proof passed after the corruption fixes**. This is independently reported reviewer evidence; no live provider claim follows.

The24-hour replay window,256 recent operations/owner and16KiB outcome bound are **local operational safeguards**, not subscription limits or an infinite replay promise. After expiry, a stale expected revision still yields409 through CAS; an expired onboarding retry cannot create a duplicate profile. The real PostgreSQL expiry test exercised that conflict. Clients retain the operation snapshot for bounded retry, then refetch/resolve instead of retrying forever. `platform/backend/local/README.md` states the same actual limits and recovery behavior. No further code change or test expansion was needed for this clarification.

Final verdict: **scoped local account integration accepted for coordinator handoff**, with94 passing receiving tests, real PostgreSQL lifecycle proof and independent security agreement. Synthetic API remains127.0.0.1:8009 for coordinated frontend review; security owns subsequent database reseed/reset coordination. No further implementer mutations are running.
