# Isolated learner engineering database

Checkpoint 7 November 2026. Owner: learner_schema_local, gpt-6.1-sol / medium. Scope is additive learner SQL and an independent synthetic local PostgreSQL lifecycle. Explicitly read root/app AGENTS.md, CHECKPOINT-LEARNER-MVP-2026-11-07.md and docs/foundation/research/learner-mvp-backend-20261107.md. Source branch: codex/ielts-content-20261106. No hosted changes, environment files, provider calls or real data.

Preflight answers:

1. A database specialist would enforce immutable submissions and owner isolation at the SQL boundary, and ensure setup cannot reset the existing preview.
2. Raw evidence is receiving-schema.sql, local/manage.py and actual PostgreSQL catalog/role behavior. Existing summaries are not grants evidence.
3. Additive SQL, bounded JSONB records, composite membership owners, transaction-setting RLS, append-only submission trigger, and independently labelled Docker resources preserve the receiving repository pattern without growing its single study JSON.
4. Independent evidence is actual API-role SQL rejecting foreign-owner writes, hiding foreign/unscoped reads, rejecting frozen submission changes, and catalog verification of RLS, browser grants and non-BYPASSRLS. Repository/HTTP concurrency and provider semantics are separate integration checks.

From platform/backend:

```sh
.venv/bin/python -m local.learner_manage start
.venv/bin/python -m local.learner_setup
.venv/bin/python -m local.learner_manage status
.venv/bin/python -m local.learner_manage stop
```

Container/network/volume: `mitooni-learner-20261107`, label `owner=mitooni-learner-local`. Database binds only 127.0.0.1:55440. Reserved API port is8011. Initial creation checks both ports are free. No lifecycle command addresses existing account resources on55439/8009/5191. Stop retains the volume; no destructive lifecycle command is supplied. Restart is explicit and should be coordinated with learner users.

Pinned image is imported from existing local/manage.py, digest742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193. Reused pattern: dedicated trust-auth synthetic PostgreSQL, non-BYPASSRLS API role and fixed no-password connection options. This receiving-project check does not inherit the old database's approval or tests. Trust authentication permits local processes and is only for synthetic engineering data.

learner_setup.CONFIG is LocalPostgresConfig(port=55440); admin_connection() is available for synthetic fixtures. Setup applies receiving-schema.sql only when memberships is absent, then additive learner-schema.sql. Existing synthetic memberships are preserved on rerun; no canonical work is deleted. A/B have learner:use, study:use, tutor:use, profile:write and study:independent. Inactive/readonly fixtures remain restricted. There is no provider policy seed or paid allocation.

All candidate entities are bounded JSON objects with relational owner/revision/identity. Attempts in submitted/expired status reject all updates/deletes, including status reset; frozen inserts require SHA256-shaped body_hash. Feedback belongs in jobs/evidence. API cannot delete attempts. The queue exposes only job/owner identifiers across owners, while jobs and reservation payloads remain owner scoped. Provider policy bodies are API read-only; totals are API lock/update counters, and the repository must enforce policy caps under their shared row lock.

Observed checks,7 November2026: both ports were free before creation; own resources started; fresh setup and rerun both passed. Real PostgreSQL synthetic checks passed:13 learner/provider tables have RLS; API role neither superuser nor BYPASSRLS; browser has no table grants; unscoped/foreign reads reveal no attempt; foreign insert fails; submitted-body update and reopening fail. Temporary synthetic attempt was removed through explicitly scoped admin fixture cleanup, restoring its trigger in the same transaction. Python syntax compile passed. Initial lifecycle attempt exposed case variations in Docker missing-resource errors; corrected safe absent detection and reran successfully. Existing account resources were never addressed by a write command.

Limits: no hosted, API/worker, restart-recovery, budget-race or browser claim is established by these schema checks. Independent reviewer must inspect the actual schema and reproduce relevant SQL checks. Coordinator owns release verdict.

Additional security checkpoint: learner_publications is an admin-owned catalogue-hash authority with approved/withdrawn status, allowedUses and withdrawnTaskIds. API may SELECT and lock via UPDATE(lock_revision), but cannot alter data, insert or delete publication. Explicit publish_catalog(hash, withdrawn_task_ids=None) is local admin-only and is never automatically called; defaults allow learner_delivery with no withdrawn tasks. Production schema contains no publication seed. anon/authenticated/service_role grants are explicitly revoked on all learner/provider tables and helper functions when those roles exist. Evidence, recording and plan history API UPDATE grants are revoked, and recordings additionally reject all UPDATE/DELETE through a trigger.

Additional synthetic fixtures in local.learner_setup.SUBJECTS: acceptance-a101, acceptance-b102, browser-a103, browser-b104, formatted 00000101-0000-4000-8000-000000000000 and incrementing the initial eight-digit group. These and A/B carry learner:tutor in addition to learner:use/profile:write. No verification behavior in the preexisting local.fixtures was changed. Setup explicitly updates synthetic fixture entitlements, preserving other member attributes/work.

Observed additional real PostgreSQL checks passed: API SELECT FOR SHARE on the new registry succeeds, publication body updates/deletes fail permission checks, append-only history tables lack API UPDATE privilege, and all four new fixture entitlements include learner:tutor. Synthetic publication used for this test was removed. There are now14 learner/provider RLS tables. Independent security reviewer received an exclusive additive-fixture window after these checks; this agent makes no database writes during that review.
