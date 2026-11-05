# Receiving deployment preparation

Nothing in this directory runs on import/startup or has been applied remotely.
Use the existing BarEx provider/hosting infrastructure with a separately named
Mitooni deployment, dedicated receiving database/schema/role, scoped credentials
and product membership. Shared issuer verification never grants membership.

`receiving-schema.sql` is a SQL review artifact, not a Supabase CLI migration.
It assumes an administrator has prepared dedicated `mitooni_api` and
`mitooni_browser` roles without superuser/BYPASSRLS privileges. The account
section applies once to an empty dedicated schema; where account tables exist,
apply only the idempotent study upgrade after review. Do not expose this schema
to browser/Data API roles. No source data, live credentials or synthetic fixture
membership/catalog is included. A published, rights/processing-authorized pack
and trusted product membership/entitlement provisioning remain explicit inputs.

Compose `create_receiving_app(BackendConfig(...),ReceivingPostgresTarget(...),
ProviderConfiguration(...))` in the receiving deployment's server entrypoint.
Pass configuration explicitly from that deployment's secret binding; no `.env`
is read by application code. Target requires matching verified issuer, product,
role/schema, remote TLS verify-full and explicit credential. Provider requires
explicit model/key and a positive `call_budget`. Missing provider leaves account
and study storage available but tutor admission503; no synthetic fallback.
Synthetic auth/runner exists only in `local.serve`, never production composition.

The budget is an operational ceiling in model-call units, not a subscription or
price. Each accepted turn atomically reserves its maximum SDK model turns; a
started dispatch conservatively settles the entire reserved ceiling even when
reported usage is smaller. Queued cancellation returns an unused reservation.
Unknown dispatch retains conservative usage and is never automatically retried.
Output-token, input-size, tool-count and wall-time limits separately bound each
call. Actual provider billing reconciliation and exact token-cost estimates are
not implemented; no exactly-once billing claim is made. Restart does not reset
owner usage. Budget changes require explicit trusted operational policy.

The worker uses the API deployment lifespan and durable queue metadata. Multiple
instances serialize on membership/owned state; fencing and dispatch markers stop
late/duplicate publication. Queue metadata contains owner/turn IDs only and is
server-only; worker authority and data reads recheck membership/current scope.
Revoked users cannot poll, execute tools or commit output; pending revocation
cleanup/reconciliation needs trusted operational handling, never redispatch.

Before hosted activation independently verify actual PostgreSQL roles/grants,
RLS denies, connection identity/TLS/host policy, Auth issuer behavior, migration
procedure, backups/retention, pack validation/processing permission and provider
model/limits. Direct local PostgreSQL plus SDK MockTransport does not prove
hosted Supabase/Data API/Auth/provider parity or educational quality. No resources
are provisioned or deployment/payment authority implied by these artifacts.

Supply a numeric `hostaddr` explicitly with the expected TLS `host`; the network
address cannot inherit `PGHOSTADDR`. Local target always pins loopback. libpq
service discovery (`PGSERVICE`, `PGSERVICEFILE`, `PGSYSCONFDIR`) is rejected by
presence without reading/logging values. Explicit connection parameters pin
client identity/TLS files, system root certificates, minimum TLS, database,
role, application name and search path. Connection verification checks actual
role/database/schema privilege, non-superuser/non-BYPASSRLS and production TLS,
in autocommit before the application's isolation transaction. Actual hosted
network/certificate behavior remains untested.

Publication columns (`status`, `fixture`, `allowed_uses`) require trusted
publisher/admin authority. The runtime may update only a non-authority
`lock_revision` column, enabling PostgreSQL row locks; its UPDATE policy is
restricted to approved, manifest-attested delivery rows. It cannot edit content,
versions, status, fixture flag or uses. Browser has no schema/table privileges.
The broad pack UPDATE `USING/WITH CHECK true` policy proposed during development
was automatically rejected and never applied; the narrower policy and denied
sensitive-column writes passed local PostgreSQL tests.

Publisher must attest the full immutable payload/bundle/next-step graph with
`manifest_hash`; mutable publication is separately checked. Real receiving packs
must carry `public_content_hash()` over the explicit public projection, excluding
private key/rationale; the private manifest attests the complete payload. The
legacy synthetic fixture hash format is accepted only as fixture history and
production rejects every fixture. Withdrawal blocks new starts, proposals,
provider dispatch, tool release and terminal publication, but does not erase old
owned work. An exact old edition must remain stored for interpretable history.

Job claims quarantine unauthorised/orphaned queue entries without releasing
output; stale cancel requests become terminal. Expired leases cannot dispatch,
execute tools or commit, even before another worker claims them. These guards
are local transactional evidence, not proof of provider exactly-once execution.
