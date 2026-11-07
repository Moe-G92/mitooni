# Private learner beta packaging

Current consolidated local candidate is image07, including timer semantics, consecutive-job polling and direct `/learn/UUID` reload repairs. Actual hosted deployment remains under root control. The key/nonsecret bindings and correct Amsterdam service configuration are already applied by root; do not repeat credential creation or configuration mutation. The next source upload is root-only after exact07 independent review and no active hosted job.

This is a candidate app image for the existing dedicated Mitooni Railway service and Supabase project. It does not create resources, apply SQL, bootstrap credentials, bind configuration, upload images or deploy. The older `content-review-beta` artifact remains unchanged. Candidate `/app` is the primary application; the image does not attach the teacher-only content package. Existing reviewer routes remain inaccessible without an explicitly configured internal review repository.

Build from a new explicit context only. `prepare_context.py` accepts a validated candidate catalogue/hash and copies `catalog.json` plus exactly validated hash-named assets into private `/srv/private/learner`, outside `/srv/web`. Original books, private authoring databases, `.env`, credentials, corpus execution modules and Word documents are excluded. The generated Docker ignore admits exact files only, and the local context manifest records hashes. Context output must be new and outside both source and catalogue trees.

From `platform/backend/`:

```sh
.venv/bin/python deployment/learner-beta/prepare_context.py \
  --catalog ../../review/learner-mvp-20261107/catalog \
  --catalog-hash REVIEWED_CATALOG_SHA256 \
  --output /private/tmp/mitooni-learner-context-NEW
```

Build inside that context with `--platform linux/amd64`, Dockerfile `platform/backend/deployment/learner-beta/Dockerfile`, and only the public build args `VITE_MITOONI_AUTH_URL` / `VITE_MITOONI_AUTH_PUBLISHABLE_KEY`. Never pass provider or database credentials as build args. The existing production import boundary excludes the prototype, MSW, dummy banks and fixture auth. The exact CMD is `/srv/backend/.venv/bin/python /srv/backend/beta_entrypoint.py`; no shell/start override is required. UID/GID is10001. Private files/source are read-only; durable candidate state is PostgreSQL.

Runtime names, values never recorded here:

- Existing receiving values: `PORT`, `MITOONI_BETA_HOST`, `MITOONI_AUTH_URL`, `MITOONI_AUTH_PROJECT`, `MITOONI_AUTH_SERVICE_KEY`, `MITOONI_DB_HOST`, `MITOONI_DB_HOSTADDR`, `MITOONI_DB_NAME`, `MITOONI_DB_PORT`, `MITOONI_DB_PASSWORD`. Preserve current dedicated API role credentials in Railway. The legacy `AUTH_SERVICE_KEY` name takes the dedicated public publishable key, not an elevated service key.
- New immutable source binding: `MITOONI_LEARNER_CATALOG_HASH`.
- Optional local AI group: `MITOONI_AI_API_KEY`, `MITOONI_AI_TEXT_MODEL`, `MITOONI_AI_AUDIO_MODEL`, `MITOONI_AI_BUDGET_POLICY_ID`. All four or none; partial/blank/invalid configuration stops startup. Complete credentials do not create a budget. The explicit admin-owned PostgreSQL policy must supply authorized global cap, rates/model binding and price revision. Missing provider returns unavailable rather than simulated feedback. Final private activation requires the coordinator's approved bounded allocation and secure key binding.

`bind_runtime.py` is operator-only and not copied to the context/image. It restricts keys and the exact existing service, sends values through stdin with `--skip-deploys`, and suppresses provider output. It is reviewable tooling, not authority to execute a binding.

Strict `sslmode=verify-full`, hostname and non-BYPASSRLS identity checks stay in `ReceivingPostgresTarget`. The existing public Supabase Root2021 certificate remains pinned to SHA256 `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`; Docker installs it in the OS bundle and sets `SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt`. Do not disable TLS or replace credentials to debug connectivity.

Startup verifies catalogue bytes, receiving build origin, host, metadata/RLS/grants and immutable-attempt trigger. `/ready` repeats these checks without learner records. It is not proof of authenticated journey, useful AI feedback, teacher validation or Iranian-network accessibility. Startup never migrates. Apply reviewed learner schema separately only after coordinator approval.

Requests are no-store except public built assets; unknown API/private/dot paths never fall back to HTML. Host acceptance is exact service hostname plus Railway health hostname. Proxy headers and detailed access/exception logs remain disabled. Network-disabled image smoke uses explicit synthetic test fixtures and does not establish real hosted Auth/PostgreSQL/provider behavior.

## Exact existing-service activation handoff

These are reviewable operator instructions, not actions performed by packaging. Freeze the final context/manifest and independently approve code/configuration/schema/provider cap before running mutations. Preserve the existing receiving DB password and the new API key in Railway; do not list variable values or rebind credentials. `check_ai_key_presence.py --cli /private/tmp/railway-tooling-20261104/railway` selects only variable metadata through GraphQL and returns `keyPresent`/`keySealed` booleans. It never requests a value. It cannot prove that a present key is nonblank, valid or authorized for a paid model; check actual configured startup and bounded evaluation separately. Tests cover absence, other-service names, pagination and refusal of unexpected server fields.

Approved desired region is **Amsterdam, `europe-west4-drams3a`, one replica on the same service**. The proposal/evidence is in the config contract. Existing CPU/memory limits and IPv6 remain. `stage_existing_service.graphql` is a mutation review artifact with the exact service/environment and desired candidate Dockerfile/CMD/readiness/region; it is not copied into the image. The mutation takes the non-secret JSON input in `activation-variables.json` through GraphQL variables. The equivalent input and target are recorded in `activation-plan.json`. No key values are included.

The prepared stage command (mutates configuration; **not run**) is:

```sh
/private/tmp/railway-tooling-20261104/railway api \
  --file /Users/arashshahrokhi/Projects/mitooni/app/platform/backend/deployment/learner-beta/stage_existing_service.graphql \
  --variables @/Users/arashshahrokhi/Projects/mitooni/app/platform/backend/deployment/learner-beta/activation-variables.json --compact
```

Live schema validation found that `Builder` does **not** admit `DOCKERFILE`; the prepared input preserves the existing builder and sets only explicit Dockerfile path. This differs from the earlier historical review manifest. The new candidate `railway.json` has no invalid builder field and records one Amsterdam replica, but the deprecated Config-as-Code selector is not activated.

After root's exact activation review, the intended source-upload command is:

```sh
/private/tmp/railway-tooling-20261104/railway up /private/tmp/mitooni-learner-context-20261107-07-receiving \
  --path-as-root --project 6687f485-a208-49d9-a6da-e9cd323ce14e \
  --environment 54ed21ac-3ceb-44b9-a791-591747debfcb \
  --service 775a8fd8-9f44-443b-bb0b-58b8344c8a87 --detach
```

Use the new reviewed context, not repository root or the first synthetic image. Exact project/service/environment selectors prevent accidental creation on an unlinked path; no `--new`, source connect, Git push or SSH is involved. Detach avoids raw build/runtime logs; return is not deployment success. Poll only selected deployment status/region metadata and run actual readiness/Auth/candidate/media/AI checks. Read back deployed Amsterdam placement and one replica; a null legacy region field is insufficient. Do not claim improved latency until measured. No DNS, billing, production SQE or additional service is required.

### Preserve a UI-staged API key

A key visible in the Variables UI can remain staged and therefore absent from the committed names-only metadata query. Do not delete/recreate it or request values. The live schema exposes only whole value-bearing `EnvironmentPatch.patch` scalar; it provides no staged-variable-name-only selection. Root's safe UI name observation supplies the key-specific staged evidence; a narrow `environmentStagedChanges { id status environmentId }` query confirms only that a changeset exists.

Root-approved coherent sequence (operator actions, **not executed by packaging**):

1. Keep final image04 blocked until the nullable Listening DTO and native Speaking anchor fixes are independently reviewed. Do not promote image02.
2. Commit the existing UI-staged key **without redeploy** using `commit_staged_without_deploy.graphql`. It fixes the exact existing environment and `skipDeploys:true`; no value is requested or supplied. This commits all staged changes, so first confirm the staged scope remains only root-approved edits. The official UI equivalent is Alt+Deploy. Do not click ordinary Deploy while the old review image is selected.
3. Run the existing names-only presence helper. Require `keyPresent:true`; it still does not prove key validity. Verify the old active deployment ID remains unchanged, so no partial-config old image was restarted.
4. Bind only `candidate-nonsecret-bindings.json` through the reviewed `bind_runtime.py --skip-deploys` mechanism. This file supplies catalogue hash, exact text/audio models and the existing approved US$10 shared policy ID; it intentionally omits API/DB/Auth secrets. Preserve all existing credentials and the just-committed API key.
5. Stage the reviewed exact service settings/one Amsterdam replica, then upload only the final image04 context with explicit existing project/environment/service selectors. Verify the resulting candidate deployment's readiness and bounded actual journeys.

Prepared no-redeploy commit command:

```sh
/private/tmp/railway-tooling-20261104/railway api \
  --file /Users/arashshahrokhi/Projects/mitooni/app/platform/backend/deployment/learner-beta/commit_staged_without_deploy.graphql --compact
```

Prepared non-secret binding command:

```sh
/Users/arashshahrokhi/Projects/mitooni/app/platform/backend/.venv/bin/python \
  /Users/arashshahrokhi/Projects/mitooni/app/platform/backend/deployment/learner-beta/bind_runtime.py \
  --cli /private/tmp/railway-tooling-20261104/railway \
  < /Users/arashshahrokhi/Projects/mitooni/app/platform/backend/deployment/learner-beta/candidate-nonsecret-bindings.json
```

Do not assume `railway up` commits existing UI-staged variable edits. The reviewed CLI upload code delegates source upload/deployment; that client source establishes no staged-commit behavior. The explicit no-redeploy commit above avoids relying on an undocumented server-side implication. Source: [Railway staged changes](https://docs.railway.com/deployments/staged-changes), [environment API](https://docs.railway.com/integrations/api/manage-environments), checked7November2026, plus live mutation-schema `skipDeploys` description. No staged patch values, encrypted values or raw variable lists were fetched.
