# Isolated synthetic account integration

This is a local engineering harness, not a real Auth signup service or production enrollment policy. No original resources, learner data or actual provider credentials are used. PostgreSQL image17 is pinned by digest; the observed server reports17.10.

From `platform/backend/`:

```sh
uv sync --frozen
.venv/bin/python -m local.manage start
.venv/bin/python -m local.initialize
.venv/bin/python -m pytest --local-postgres -q
.venv/bin/python -m local.serve
```

`initialize` waits for an accepting database only through normal connection handling; if called immediately after a fresh start before PostgreSQL is ready, retry it after `docker exec mitooni-account-20261105 pg_isready -U mitooni_admin -d mitooni_local` succeeds. It applies `schema.sql` only when the local membership table is absent, then explicitly seeds synthetic memberships. No production migration or Supabase project linking is involved.

Resources: container/network/volume all `mitooni-account-20261105`, labelled `owner=mitooni-local`; database `mitooni_local`, API role `mitooni_api`, admin role `mitooni_admin`; database bound only127.0.0.1:55439. The dedicated Docker bridge is shared with no other workload. Local trust authentication deliberately has no password and is suitable only for this synthetic database; any local process could access it. It is not a production security configuration. Nothing reads `.env` or a source DSN/password; database options explicitly override credentials/passfile lookup. No source containers, networks or volumes are changed.

HTTP harness:127.0.0.1:8009. Synthetic tokens: `local-a`, `local-b`, `local-inactive`, `local-nonmember`, `local-readonly`. These are fixture selectors, not provider credentials. Names/emails are A/B/etc at `example.invalid`; UUID mapping is in `fixtures.SUBJECTS`. `local-unavailable` produces503; other unrecognized tokens such as `expired` produce401. A/B have active learner membership and `profile:write`; readonly is active without that permission; inactive/nonmember writes fail403. Auth email/name metadata never self-enrols anyone. No password/OTP/Google signup capability is claimed.

The new routes are GET `/api/account`, POST `/api/profile/onboarding`, PATCH `/api/profile`. Send `Authorization: Bearer local-a`. Mutations also need `X-Expected-User-Id` equal to that verified synthetic subject and a UUID `Idempotency-Key`. Wrong expected identity is rejected before repository access. `account-contract.json` contains exported JSON schemas (`python -m local.export_contract`). No wildcard CORS is enabled; the Mo integration entry must proxy API calls from its own local origin.

A profile is null before onboarding. A complete, validated POST with `expectedRevision:0` creates revision1 and server-owned onboarded state. PATCH `{expectedRevision,changes}` edits an existing profile only. `name`, locale/theme, targets, nullable testDate/currentLevel, weeklyHours, showFlag and notification choices are the only editable fields. currentLevel is self-reported; notification values activate no delivery service. No plan, role, entitlement, email or exam-accommodation mutation is admitted.

Membership and mutations are serialized on the member row, profile CAS protects stale writes, and database roles/grants/RLS scope every row to the configured product/issuer/subject. The trusted API role can set transaction scope; it is not a browser credential. Identity is not product membership. Admin revocation commits before waiting writes and is checked before idempotent replay.

These are local operational safeguards, not subscription/plan limits or an unlimited replay guarantee. Idempotency key/hash/outcome scope includes product, issuer, subject and route. Replay is valid for24hours; stored outcome contains only historical profile, with CURRENT identity/membership authority composed at return. The client must not regress a newer profile revision when an old snapshot is replayed. Profile outcomes are DB-size-limited16KiB; at most256 recent operations per member, then429. Expired rows become replay-ineligible at24hours and are physically removed on the next successful new mutation; no automatic background purge is claimed. After replay expiry, an old expected revision still conflicts through CAS (409); expiry does not permit a duplicate profile creation or overwrite. A client must resolve/refetch rather than retry indefinitely. Profile persists across application signout/lifecycle/restarts; no fake user-delete endpoint is provided.

Owner-only actual database restart proof (do not run while another reviewer is using the API/database):

```sh
.venv/bin/python -m local.prove_restart
```

It changes only synthetic A's profile and restarts only this labelled container, then checks the acknowledged profile through a newly constructed application. Unit tests without `--local-postgres` explicitly skip integration cases; skipped tests are not durable evidence. The complete integration suite uses disposable owner IDs and preserves browser A/B fixture profiles; publication checks temporarily alter the synthetic catalog and restore it. Pause browser writes and the task API worker for exclusive queue/restart checks, then restore the API before releasing the window.

Lifecycle/cleanup, only for these labelled resources:

```sh
.venv/bin/python -m local.manage status
.venv/bin/python -m local.manage stop
.venv/bin/python -m local.manage start
# Explicitly discard only this synthetic database after review:
.venv/bin/python -m local.manage destroy
```

Stop retains the named volume; start restores it. Destroy removes this synthetic container/network/volume and refuses differently labelled resources. No production provisioning occurs. Direct local Psycopg tests establish transactional Postgres behavior; hosted Supabase role/exposure/SDK parity and actual provider Auth remain unproved.

## Durable study slice

After the existing isolated database/account initialization, run the explicit
additive upgrade; it preserves profiles, drafts, attempts and completed turns:

```sh
uv run python -m local.upgrade_study
uv run python -m local.export_study_contract
uv run python -m local.serve
```

Only `127.0.0.1:8009` is served. Existing `local-a` and `local-b` synthetic
identities receive local `study:use`, `tutor:use`, `study:independent` grants.
No source credential/account, provider key, teacher approval or real learner is
involved. The local runner is explicitly synthetic; configured production uses
the real Agents adapter and never falls back to it.

`reading-evidence` and `writing-reasons` are original engineering fixtures.
Reading has a one-item raw check released after submission; Writing receives
qualitative formative feedback, never a fabricated band. DTO schemas are in
`study-contract.json`. Draft text uses `changes.text`; submit freezes the existing
OPEN attempt. Independent tutor requests fail until an explicit help switch or
permitted post-submit review. A supported revision creates a child attempt.

Polling without a cursor returns a canonical snapshot. Raw model candidates are
never public. Only a committed validated message contains generated prose,
server-validated citations/spans, source work revision and paired `requestText`.
`latestTurnId` survives completion so lost acceptance acknowledgements recover
without reposting generation. Failed/canceled/unknown turns have no terminal
message. Prose-policy checks are imperfect; no teaching-quality claim follows.

```sh
uv run pytest -q --local-postgres
uv run python -m local.prove_study_restart
```

Coordinate the restart proof with browser/reviewer activity: it restarts only
the labelled local PostgreSQL container and preserves existing data. The account
and study test suites now use disposable owner IDs and never reset browser A/B
profiles. Publication tests temporarily change local catalog authority/version
rows and restore them; pause browser writes while running the full suite.
No automatic fixture wipe or source database action occurs. Cleanup remains
`local.manage stop` to retain the volume; `destroy` deliberately deletes this
synthetic volume and must not be used during a review needing saved work.

The study state is bounded (8 workspaces, 32 turns, 512 exposure records per
owner), with 24-hour/256-operation replay retention. These are local operational
limits, not subscription entitlements. Canonical work remains durable after
operation expiry; old expected revisions still conflict. The worker polls the
cancel/authority state independently every 100 ms while healthy, so a stalled
provider iterator does not delay local cancellation until its next delta.
Database lock/connection deadlines can delay observation; remote provider stop
or refund is not guaranteed. Expired fences/leases cannot publish output.

Publication approval, fixture status and permitted uses are separate trusted
SQL columns. Full immutable manifest attestation includes bundle and graph;
withdrawal stops new work/provider/tool/final publication while old owned work
remains readable. Production rejects fixtures even when approved. Existing
legacy fixture content hashes are retained for historical pins and are never
production eligible; real receiving content must use the public projection hash
which excludes private keys/rationales. The private manifest still attests them.

See `deployment/README.md` for the unactivated receiving composition and SQL
review artifact. No hosted Supabase/Auth/Data API/provider parity is established.

## Final dependency compatibility checkpoint

The frozen Python project supports `>=3.11,<3.14`; the final actual regression
ran on Python3.13.11 with FastAPI0.133.0 and Starlette1.3.1. The complete local
suite passed271 tests, including raw-ASGI malformed Host rejection/private
headers and matching independent-attempt resume after stimulus exposure. The
only warning is Starlette's deprecated httpx TestClient backend; production
HTTP behavior is not dependent on that test backend. Python3.11/3.12 marker
resolution/audits are evidence about the lock, not an executed interpreter test.
Exact dependency versions/audit evidence are recorded in
`docs/foundation/research/tutor-backend-dependencies-20261105.md` from the repo root.
