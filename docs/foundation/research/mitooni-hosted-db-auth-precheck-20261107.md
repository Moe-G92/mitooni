# Mitooni hosted database and Auth precheck — 7 November 2026

Owner: review_beta_backend, gpt-6.1-sol / medium. Checkpoint: PRECHECK/DESIGN. Root coordinator owns remote application and credential bootstrap; this worker performed read-only inspection only. Explicitly reread `/Users/arashshahrokhi/Projects/AGENTS.md`, application `AGENTS.md`, and Supabase skill. New separate project only: `syczumdwgabypxkopkpn`, Mitooni, organization `ivbgukjqhifelflavwbg`, eu-west-2. SQE project/database/Auth/settings/users/credentials are excluded. Local API8009, database volume and frontend5191 remain untouched by this task.

## Four preflight answers

1. A professional would separate nonsecret schema preparation from credential delivery, avoid unnecessary elevated Auth credentials, verify runtime transport/role privileges independently of a healthy project badge, and keep teacher Auth identity distinct from exact-version reviewer authorization. No teacher identity means no invite, enrollment, role metadata shortcut or automatic assignment.
2. Raw material is the three actual SQL artifacts, installed Python Supabase/Auth client code, TargetSupabaseClient/SupabaseIdentityVerifier and ReceivingPostgresTarget implementations, deployment readiness/configuration source, exact immutable855...095 package, new-project catalog metadata and current official Supabase docs. Prior local evidence informs checks but is not hosted parity proof.
3. Methods: exact artifact hashes; read-only project/schema/role inspection through explicitly targeted MCP; installed real SDK with deny-egress MockTransport to inspect Auth request headers; fresh official key/connection/logging docs; separate role/schema DDL review and later secure credential validation. No environment files or other-project credential discovery. Root applies reviewed SQL, not this worker.
4. Independent evidence: actual remote13 tables/RLS/column grants and explicit browser-role denies; runtime effective role non-superuser/non-BYPASSRLS/no creation rights over verified TLS; public-key gateway acceptance plus invalid-user-token denial; eventually actual authorized teacher sign-in/session and exact-hash assignment/revocation denial. Credential binding must demonstrate no sensitive SQL/log/tool/stdout/history exposure. Until then roles stay NOLOGIN and hosted readiness may correctly remain unavailable.

## Observed primary evidence

Read-only MCP `get_project` confirms Mitooni ACTIVE_HEALTHY, host `db.syczumdwgabypxkopkpn.supabase.co`, PostgreSQL17.11.0.018. Initial `list_tables` for mitooni_app returned empty. A later read while root independently progressed setup confirms mitooni_api and mitooni_browser both NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS. No remote mutations were made by this worker. Do not infer completed schema/password binding from those role attributes.

Public DNS direct endpoint currently resolves only IPv6 `2a05:d01c:1b7:9301:f96a:4ac5:a151:2edc`. This is public connection metadata, not a credential; re-resolve immediately before deployment and independently prove Railway egress can reach it. Runtime currently requires the literal login/effective role mitooni_api. Supavisor session pooler wire usernames normally include the project suffix, so current target config cannot simply be pointed at a pooler without a reviewed narrow adapter. Prefer current direct TLS path if supported. Do not purchase an IPv4 add-on or silently change DB user to postgres.

## Approved nonsecret SQL application

Only an empty new dedicated receiving schema is eligible for the account section (plain CREATE TABLE); do not replay it on an initialized project. Create roles with NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS, then apply these exact existing SQL artifacts in order:

```text
89276ffbe890fae0d0452ae12d6577dba0480feae5f706dcca9115102ed0e265  platform/backend/deployment/receiving-schema.sql
8150853a928ce221ee5e441f1b27f85b9c92805f7fe210d5dad23c0d05da7ae9  platform/backend/deployment/content-review-schema.sql
e4b437a175bee8be922c8d390f12e699426750332a5424380d310ef247500e72  platform/backend/deployment/speaking-review-schema.sql
```

Receiving SQL creates account3 + study4 tables; review adds3; Speaking adds3. All13 enable RLS. API receives only required grants; row locks use UPDATE of harmless revision/lock_revision columns instead of assignment/publication control. No content, membership, teacher roster or Auth users are seeded. Speaking DDL remains necessary even with provider NONE because hosted readiness verifies the six review/Speaking tables. Provider NONE means no live or synthetic evaluator in production.

Recommended final explicit Supabase browser/Data API denial fence after the three artifacts:

```sql
REVOKE ALL ON SCHEMA mitooni_app FROM anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA mitooni_app FROM anon, authenticated, service_role;
```

Keep mitooni_app outside exposed Data API schemas. Browser authorization is never an auth.jwt/user_metadata policy; verified user issuer/subject is transaction scope and server-owned assignment is the authority. No extension, trigger, function, security-definer routine, storage bucket or Auth schema change is required. SQL artifacts are existing reviewed deployment preparation, not invented CLI migration filenames. Root remote application remains separately recorded/verified.

## Auth key and configuration decision

**Public publishable key is sufficient. A service-role/secret API key is unnecessary for this verifier.** Official [API key docs](https://supabase.com/docs/guides/getting-started/api-keys) distinguish application key from user JWT. Installed `supabase._sync.client.Client` accepts a nonempty publishable key; installed `SyncGoTrueClient.get_user(jwt)` explicitly passes the user bearer to GET user. Actual TargetSupabaseClient + SupabaseIdentityVerifier with ServiceHttpClient/httpx.MockTransport passed: GET `/auth/v1/user`, application publishable value in apikey, explicit synthetic user token in Authorization, verified UUID returned. Deny-egress synthetic test only; no real token/key/user or remote call was used.

Retain existing configuration names to avoid unrelated architecture work:

- MITOONI_AUTH_URL = `https://syczumdwgabypxkopkpn.supabase.co`; MITOONI_AUTH_PROJECT = `syczumdwgabypxkopkpn`.
- MITOONI_AUTH_SERVICE_KEY binds the new project's public publishable key despite its historical variable name. No elevated key required or requested. Frontend build uses the same Auth origin/publishable key via hosting worker's existing public-key build path.
- MITOONI_DB_HOST = `db.syczumdwgabypxkopkpn.supabase.co`; DB_NAME = postgres; DB_PORT =5432; DB_HOSTADDR = independently resolved numeric direct address; user fixed mitooni_api; DB_PASSWORD separately secure bound only after reviewed credential setup.
- MITOONI_REVIEW_PACKAGE_HASH remains `85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095`; private package at `/srv/private/review`.
- MITOONI_BETA_HOST is hosting's exact selected domain. All Speaking provider variables absent; provider NONE, no synthetic production fallback.

No real Auth account is necessary to validate gateway accepts the publishable app key and rejects an invalid JWT. Root may perform safe live invalid-token check; require Auth-specific bad-JWT denial rather than mistaking invalid-API-key401 for success. Actual valid-user hosted verification remains unavailable until human supplies/authorizes teacher identities. No invitations, signup calls or emails are implied. Exact package reviewer assignment comes later from independently verified Auth UUID and matching issuer; no learner profile is necessary.

## Credential binding boundary and remaining checks

No password/verifier belongs in these SQL files, chat, tool output, shell arguments, env files, generated report or image. New role remains NOLOGIN until secure binding is independently reviewed. Official [credential logging guidance](https://supabase.com/kb/troubleshooting/provisioning-credentials-without-log-exposure), updated4 November2026, documents exposure via failed statements, dynamic SQL and statistics. The PGP/dynamic DO proposal is rejected; encrypting returned output does not prevent inner plaintext SQL/log leakage. No custom-role Management API password endpoint has been independently confirmed here, so do not claim that route exists from the generic project-password recommendation.

If a reviewed direct admin credential operation becomes necessary, it must use a verified TLS session, non-echoing secret transport, narrowly scoped logging suppression proven effective before generating/setting a real credential, and restore transaction settings. Multiple MCP calls cannot be assumed to share a connection; a single concatenated batch containing a credential can be logged before its first SET runs. This task does not authorize implementing or executing that fallback. Runtime password then goes only to hosting's secure stdin/native secret binding and runtime environment; root owns this flow. Do not bind postgres/admin/owner credentials as the app runtime shortcut.

Post-application readbacks for root/security: expected13 table names and RLS; expected role caps and no inherited owner/elevated memberships; mitooni_app usage false and all table privilege false for anon/authenticated/service_role/mitooni_browser; API sensitive-column writes denied; no reviewer assignments/memberships seeded; Advisors security review. Post-binding runtime `_connect()` must prove actual current_user=mitooni_api, database=postgres, TLS, schema usage and no superuser/BYPASSRLS. `/ready` validates frozen package and current schema metadata; a health200 alone does not prove these.

Current official [connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres) supports direct IPv6 or session pooler for IPv4-only persistent applications. Changelog markdown fetch failed unsupported content-type; [HTML changelog](https://supabase.com/changelog) was read, including CLIv3 local-by-default/hosted confirmation behavior and current PostgreSQL updates. No CLI, schema change or stack upgrade was run.

Checkpoint decision: **nonsecret role/schema setup approved for the exact new project/artifacts above; credential provisioning and hosted activation remain separate uncompleted gates.** Root and hosting/security workers have the concrete hashes/config/key evidence. Local actual reviewer work remains preserved and running.

## Coordinator's applied SQL checkpoint

Root reports successful application of the exact three SQL artifacts in the stated order, both roles NOLOGIN/NOINHERIT and the explicit browser/Data API revokes, on the dedicated Mitooni project only. Root's actual readback:13 RLS tables, expected API SELECT privileges, anon/authenticated/service_role table denies; both roles have all elevated flags false, NOLOGIN/NOINHERIT, and mitooni_api has no member_of privileges. Root's security advisor returned no lints. No content, Auth users, reviewer assignments or passwords were created. This paragraph records coordinator-provided execution evidence; this worker did not reapply or independently repeat it.

Root's credential logging SET LOCAL precheck failed42501. Runtime password remains unbound and role NOLOGIN. No dynamic SQL, credential generation or insecure fallback was attempted by this worker. Security reviewer owns the next supported credential recommendation; do not implement a new flow from this precheck. Installed SDK publishable-key header proof remains the deny-egress synthetic validation documented above, not a live valid-user sign-in claim.

Final checkpoint: **nonsecret database preparation complete per root's verified remote execution; Auth/public-key compatibility demonstrated with installed SDK; runtime credential and hosted activation blocked pending a reviewed supported secure route.** Stop here. Do not retest unchanged local reviewer data, stop the running local services, invite users or change another project.

## Local encrypted credential handoff — design checkpoint

Coordinator narrowed approved implementation to new operator-only bootstrap_credential.py and focused tests. No remote SQL generator, settings/watchdog mutation or autonomous credential generation is implemented here. Security reviewer owns the SQL/watchdog sequence and root alone invokes MCP after review. Local API/database/frontend remain untouched.

Preflight refinement: (1) A professional validates ciphertext context and recipient independently, bounds decryption and subprocess failures, prevents uncertain-operation replay, and never treats encrypted transport as proof server logging was safe. (2) Raw inputs are existing bind_runtime.py's fixed Railway project/service stdin binding, actual local GPG option support, pgcrypto/GPG packet compatibility requirements and security review's strict envelope/expiry contract. (3) Implement small strict JSON/context parser, fixed GPG binary with max-output/timeout/machine status, isolated0700 local key home and one-use nonsecret nonce receipt, then call existing binder with password only. Unit tests use synthetic decrypted markers/status and fake provider processes; actual key generation/PGP compatibility follows independent test review. (4) Evidence is rejection of wrong project/role/nonce/expiry/key/corrupt or oversized content, unchanged strict fields and JSON duplicate rejection, enforced GPG integrity/key status, timeout/error redaction, and verification password appears only in provider stdin, never CLI argv/stdout/stderr/files.

Security agreed plaintext envelope exact fields: schemaVersion1, projectRef syczumdwgabypxkopkpn, role mitooni_api, canonical UUID4 nonce, second-resolution UTC expiresAt, password96lowerhex (48 random bytes). Outer ciphertext input exact fields: schemaVersion,projectRef,role,nonce,expiresAt,recipientFingerprint,ciphertextBase64. Independently supplied local context requires exact nonce/expiry and both RSA encryption-subkey and signing/certification-primary40uppercasehex fingerprints. Require machine DECRYPTION_KEY to match both, successful integrity/decryption status and exit0. Whole-second UTC expiry must be future and at most5minutes, not extended by either envelope. Decrypted password remains in process memory only and goes to fixed existing Railway binder stdin. Public/nonsecret receipt consumes nonce before uncertain dispatch; failed or duplicate attempts fail closed. No actual GPG private key or password is created during initial tests.

Remote prerequisites remain security-owned: a proved durable server watchdog and exact role-default restoration, effective logging gates before generation, same-call lease/context/role checks, sanitized exception result including query_canceled/assert_failure, and synthetic logging canary/actual nonsecret PGP roundtrip. This local helper cannot prove or bypass those remote gates. SQL mismatch or missing watchdog stops upstream before any real credential.

## Local cipher helper implementation checkpoint

Implemented only `platform/backend/deployment/content-review-beta/bootstrap_credential.py` and focused tests. It executes no SQL, changes no remote setting/role, creates no database password, generates no keys automatically, and never reads environment files. Input is bounded encrypted JSON; context is independently supplied public CLI metadata. It requires exact new Mitooni project/role, UUID4 nonce, exact UTC expiry with at most300s TTL and at least50s remaining before GPG and binding (existing binder timeout45s), encryption-subkey plus primary fingerprints, strict no-extra/duplicate fields, canonical bounded base64,96lowerhex decrypted password and GPG successful integrity/key status. GPG output cap4096, timeout15s, no options/key retrieval/import/interactive prompt; fixed executable. Private existing homedir must be owned0700 and not a symlink. A0600 public nonce receipt is atomically consumed before an uncertain dispatch. Only the password is passed in memory to the existing fixed-target Railway stdin binder; provider/GPG raw errors and output are suppressed. No claim of secure erasure of Python string copies.

Command `.venv/bin/python -m pytest -q deployment/content-review-beta/test_bootstrap_credential.py deployment/content-review-beta/test_bind_runtime.py`: **36 passed in0.24s**, synthetic only. Cases verify wrong outer/inner context, expiry extension/insufficient budget, malformed JSON/duplicate fields/base64, wrong/missing/integrity-failed GPG status, output cap/timeout, private directory checks, exact subprocess stdin versus argv, sanitized provider failures, one-use nonce behavior and safe CLI parser failure. No keys or actual credentials created by tests.

Root then authorized actual nonsecret GPG compatibility. Initial sandbox attempt failed before key creation; public key listing confirmed no fingerprints. Approved local escalation generated new keys in owned `/private/tmp/mitooni-credential-20261107-07` mode0700 using explicit `/opt/homebrew/bin/gpg --no-options --homedir ...`, never the user keyring. RSA3072 certification/signing primary plus RSA3072 encryption subkey,1day expiry. Public primary fingerprint `0457BA23FC7E25CA24B053F168414F12BC1AF5D9`; encryption-subkey fingerprint `A00114919CA995D33F07BB807BCC32BDCE2E4402`. Armored public key only is saved as `public.asc` mode0600 inside this home. Private key was neither read nor output.

A synthetic envelope using static marker c repeated96 was locally encrypted with AES256/MDC to that exact subkey, then decrypted by the actual helper with exact primary/subkey and GOODMDC checks: passed. No real database password, server-side pgcrypto claim, Railway binding, role login or remote mutation resulted. Root may reuse the isolated public key for the required actual server nonsecret pgcrypto compatibility after independent review; helper cannot substitute for server watchdog/logging gates. Keep private key home private and do not include it in any build/context/report export; coordinator owns final key/agent cleanup after bootstrap completes.

Reviewed source hashes:

```text
15519a751114f3e5d8e30294c9c8024ededea388606e09fce8f6a861543e9b96  platform/backend/deployment/content-review-beta/bootstrap_credential.py
decdd8f07d84ac284086e04c517374485f1339dbd13dac5aa11f76f47614a4cb  platform/backend/deployment/content-review-beta/test_bootstrap_credential.py
```

Stopped for root and security reviewer inspection. No secret step may run based solely on these local tests; actual server recovery/log canary/PGP compatibility and runtime target checks remain separate prerequisites. Local reviewer API/DB/frontend remain unchanged.

## Directory durability correction and independent SQL challenge

Security reviewer found nonce receipt file fsync alone did not persist its parent directory entry before an uncertain external bind. Corrected consume_nonce to open the validated private home directory with O_DIRECTORY/O_NOFOLLOW, fsync that directory after file flush/fsync, and close it before decryption/binding. Failure remains generic and does not delete the marker. New injected-directory-fsync-failure test proves file sync precedes directory sync, no GPG/provider call happens, marker remains nonsecret and error output cannot expose a synthetic password. Focused helper + binder suite: **37 passed in0.23s**.

New hashes supersede prior helper snapshot:

```text
1f93bdd4308880a9892614bd4d80790e8b3e52557a6c3b6b523b9d45f6282ebe  platform/backend/deployment/content-review-beta/bootstrap_credential.py
fc54c21ddb51a0c15252ff5e3cc68896ee757951e936f7e59879e8122539b28c  platform/backend/deployment/content-review-beta/test_bootstrap_credential.py
```

Independent source review of security-owned credential_guard.sql SHA045da6e711fec5c5286647244d425748d19eba1d01eee775fbe9d5558b2cbbec: AGREED within its explicit seven-preexisting-overrides-absent, fixed-project, single-operator boundary. Invoker functions require postgres/postgres, fixed private schema/search_path and revoke runtime/browser/Public access. Proof and credential leases are separate; fresh actual scheduler job/PID evidence and heartbeat are required, armed uniqueness prevents simultaneous suppression, stale restored callback exits before resets, exact hash detects unrelated roleconfig drift, and restoration precedes nested unschedule cleanup so cleanup error cannot roll it back. Actual effective logging/slow-query/statistics/role caps and lease gates run before secret operations. Root reports real independent heartbeat/restoration proof; this worker reviewed source, not re-executed those effects. Concurrent prepare invocations are outside the explicitly serialized root operator flow; do not run parallel bootstrap phases.

Independent review of root/security credential_issue.sql SHAf7328791a7863317abb7a7f3859b20d12e3ade080c034c98410606317eb1b10f: lease/settings/SCRAM/public-marker gates precede randomness, PGP encryption precedes ALTER ROLE, and generic caught failure rolls back the block without SQLERRM/detail exposure. One concrete objection remains: expires_value is computed from server now+240, so an operator cannot supply the helper's exact expected expiry independently of the returned outer envelope. Recommended narrow correction is a precommitted public __EXPIRES_AT__ marker, strict UTC/future/max300 validation before randomness, and the same independently recorded value as the local expected context. Sent this to root and security reviewer before any real lease/secret issuance. No live secret or remote mutation performed here.

Issuer objection resolved before secret issuance: security/root patched credential_issue.sql to SHA`dc8da6f00865c6cf64d9ff0284bad211011058bf232b1aa8b585aa2fd63b737f`. Independently reread and rehashed: precommitted public __EXPIRES_AT__, strict UTC syntax/calendar cast/exact roundtrip, >70s and <=300s future gates now precede RNG. This meets helper's independently supplied exact expiry and leaves room for its15s GPG cap/min50s binding budget. AGREED for exact patched issuer plus frozen guard under the previously stated serialized root procedure, proved durable watchdog and fresh effective-settings/role/nonce/fingerprint gates. No remaining substantive source objection within that scope.

Security reviewer independently inspected directory fsync correction and reports45 combined helper/guard contract tests passed with source hashes verified, no remaining helper blocker. This worker's direct helper/binder result remains37 passed. Root alone owns any actual real lease, secret issuance, encrypted handoff and exact restoration; this worker performed no remote change or real credential generation. Stop at this reviewed checkpoint.
