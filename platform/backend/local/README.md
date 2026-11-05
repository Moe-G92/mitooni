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

It changes only synthetic A's profile and restarts only this labelled container, then checks the acknowledged profile through a newly constructed application. Unit tests without `--local-postgres` explicitly skip integration cases; skipped tests are not durable evidence. The complete integration suite reseeds membership and resets synthetic fixture profiles/operations, so coordinate ownership before running it during browser review.

Lifecycle/cleanup, only for these labelled resources:

```sh
.venv/bin/python -m local.manage status
.venv/bin/python -m local.manage stop
.venv/bin/python -m local.manage start
# Explicitly discard only this synthetic database after review:
.venv/bin/python -m local.manage destroy
```

Stop retains the named volume; start restores it. Destroy removes this synthetic container/network/volume and refuses differently labelled resources. No production provisioning occurs. Direct local Psycopg tests establish transactional Postgres behavior; hosted Supabase role/exposure/SDK parity and actual provider Auth remain unproved.
