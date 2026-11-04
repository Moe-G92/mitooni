# Mitooni backend foundation

BarEx-derived FastAPI foundation. This stage exposes verified identity only. It does not implement application membership, profiles, content, business routes, jobs or media.

From this directory:

```sh
uv sync --frozen
uv run pytest -q
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The default app has no authentication configuration. `/health` returns `{"status":"ok"}`; `/api/me` returns 503 until a receiving-workload factory explicitly supplies `BackendConfig`. No environment file or source deployment configuration is loaded. `BackendConfig` requires an explicit workload, environment, service origin, expected project and server-only credential. Development/test configurations are loopback-only. Hosted production is intentionally configurable with HTTPS and a matching Supabase project reference; no provider calls occur until a protected request is verified. Credentials must be supplied through a future deployment-specific factory; never put them in code or browser config.

Configured `/api/me` requires `Authorization: Bearer …` and returns `{"id":"…","email":null}` (email may be a string). Identity and authentication-error responses use `Cache-Control: private, no-store`. Bearer schemes are case-insensitive. Errors use FastAPI's `{"detail":"…"}` envelope. A verified shared-project identity is not proof of Mitooni membership; future content routes need product-scoped membership and ownership enforcement. This app has no such routes and returns no roles. No CORS origins are enabled by default.

The injected verifier seam requires explicit `environment="test"` configuration and is server-side test composition only. Tests use synthetic identities, ASGI requests and local fake transports, not a running Supabase instance. Service credentials bypass RLS; default-deny database permissions and receiving-product authorization remain prerequisites for adding data APIs.

`PORT_PROVENANCE.json` records source revision/hashes. The `uv.lock` is independently generated with exact source-installed compatible constraints; it does not include the full BarEx application or unrelated integrations. The Supabase SDK itself brings its transitive dependencies.

Lazy SDK initialization and shutdown are lock-guarded. Failed initialization closes its transport; shutdown resets references, allowing a fresh client in a later application lifespan. The lock protects construction/cleanup, not arbitrary concurrent service calls; ASGI shutdown must continue to drain in-flight requests before closing resources.
