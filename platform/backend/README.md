# Mitooni backend

BarEx-derived FastAPI identity/transport foundation with an explicitly composed local account/profile integration. Mo's `web/` remains the UI/UX authority. Hosted Supabase account storage and real provider authentication have not been validated by this local slice.

```sh
uv sync --frozen
uv run pytest -q
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Default `app.main:app` exposes only `/health` and verified-identity `/api/me`; protected identity returns503 until an explicit receiving `BackendConfig` is composed. It never reads env files or source credentials/allowlists. `/me` returns `{id,email}` only, not membership, entitlements or a fabricated profile. Service credentials stay server-side; the source service client bypasses RLS. Initialization/close are lock-guarded and no worker or provider activates at startup.

The synthetic account HTTP harness is a separate opt-in `local.serve` entry, described in [local/README.md](local/README.md). Its account repository and fake verifier cannot be injected into a production-configured factory. There is no production fixture flag or header bypass. Auth-only browser Supabase SDK plus Bearer BFF remains the production integration pattern; cookie auth is not introduced.

New account paths use `{detail:{code,message,fields?},requestId}`. Invalid/expired credentials return401; provider/connection/configuration failures503 preserve the browser session. `/me` retains the earlier string-detail shape. Identity/account/profile responses and errors are private/no-store. New account writes require a matching expected-user assertion and operation key; fields, revision and membership are authoritative server-side.

`PORT_PROVENANCE.json` records source revision/hashes and adapted paths. The independent `uv.lock` pins the source-compatible SDK/runtime closure plus Psycopg3.2.13 for the direct isolated-local PostgreSQL adapter. No BarEx users, content, secrets or business routes were copied.
