# BarEx-first shell port manifest

Date: 2026-11-04. Owner: reuse/backend specialist, gpt-6.1-sol medium. Checkpoint: allowlist for coordinator review; no copies performed. Governing instructions: `/Users/arashshahrokhi/Projects/AGENTS.md`, `/Users/arashshahrokhi/Projects/sqe-cracker/AGENTS.md`, foundation CHARTER and latest explicit user direction.

**Current verdict: adopt the BarEx shell and reusable platform as Mitooni's primary base, populated with a new Mitooni corpus.** Mo's `web/` is preserved as an IELTS interaction/schema/reference source, not the primary shell. This supersedes the earlier frontend-retention recommendation in reuse-audit.md. “Bring over everything useful” is implemented through an explicit dependency closure and adapted modules; it does not require dormant legal-domain or privacy-sensitive code in the new runtime.

Source `/Users/arashshahrokhi/Projects/sqe-cracker/sqe-tutor` at `af57036ad18a45a0aa20a81202c9e0939ebd99d5`, clean on recheck. Receiver `/Users/arashshahrokhi/Projects/mitooni/app` at `d2266e8e4b92869d857c6d19d4d635509a960fab` with ongoing foundation documents. No nested instruction files found at initial inventory. Source paths below are relative to sqe-tutor. Proposed target: `platform/frontend/` and `platform/backend/`, coordinated with shell_architecture; leave existing `web/`, assets/resources and history untouched.

## Preflight

1. A top professional would inspect the shell's real import closure before copying, then preserve recognizable layout/interactions while replacing domain configuration and unsafe startup dependencies. Necessary: no licensed corpus or legacy production side effects in a shell build. Future: complete platform capability migration after isolated seams pass.
2. Raw material: exact source entrypoints, imports, primitive implementations, manifests, deployment config and schema code. No learner data, env or corpus is needed.
3. Methods: numbered source reads and import searches through App/layout/providers/auth/UI and backend entrypoint/client/services. Compare actual dependencies against desired shell. No code generators, app startup, production calls or broad directory copy.
4. Evidence: explicit file allowlist, every import resolved to allowed/adapted local code, clean build with no original routes/data, synthetic auth/role boundaries, screenshot/keyboard checks, network audit and source asset provenance. Implementation tests remain future evidence; this manifest does not claim them passed.

## Stage 0: runnable BarEx-derived shell

No directory glob is a copy authorization. Exact entries below form the first allowed source set. D = straightforward source copy after file/license check; A = adapt in target while preserving useful source behavior; N = new small composition needed to break source coupling. D does not mean previously tested in Mitooni.

### Entrypoint and shell composition

- A `frontend/src/main.tsx` → same suffix under `platform/frontend/`: preserve React mounting/chunk recovery; remove public prerender lifecycle until equivalent target build exists.
- A `frontend/src/App.tsx`: retain provider composition/RouterProvider structure; bind only target allowlisted providers/routes. No import of original `routes.tsx`.
- A `frontend/src/components/AppLayout.tsx`: retain source navigation layout, collapsible sidebar, mobile controls, page-header/back/exam-mode context and primary application composition. Replace source brand, nav, icons, profile/bootstrap adapters and domain tour wiring. Its imports at lines 2–31 show why copying layout alone fails: AppBootstrap, Tour, BookTransition, BrandIntro, plan/profile API and source navigation all enter the graph.
- A `frontend/src/components/RootLayout.tsx`: retain routing/loading shell; replace acquisition/referral/pixel hooks with absent integrations until explicitly configured for Mitooni. Do not enable source analytics by importing the root.
- A `frontend/src/components/AuthGuard.tsx`: preserve route protection/loading states, bind Mitooni bootstrap states. Internal fixture provider is isolated to a local preview/test entry, never a production auth bypass.
- N target `src/routes.tsx`, `src/lib/appNavigation.ts`, `src/brand/brand.ts`, profile/bootstrap DTO adapter and empty route components for skill catalogue/notes/practice/mock/profile. Use BarEx layout and interaction conventions with Mitooni primary labels. No invented prices, claims or corpus.
- A `frontend/src/index.css`: port the source token/layout system, selecting sections referenced by the allowed shell; rebrand identifiers and remove asset URLs outside the asset allowlist. Preserve reduced-motion/focus states. Review CSS imports/fonts separately before copying any binary file.

### Narrow source closure

D exact files: `frontend/src/lib/utils.ts`; `frontend/src/context/ToastContext.tsx`; `frontend/src/hooks/useToast.ts`; `frontend/src/components/ui/ToastNotification.tsx`; `frontend/src/components/ui/button.tsx`; `frontend/src/components/ui/input.tsx`; `frontend/src/hooks/useCloseOnViewportChange.ts`; `frontend/src/lib/motion.ts`; `frontend/src/components/ui/back-button.tsx`.

Their inspected imports close over React, React Router, Framer Motion, Lucide, Radix Slot, cva and the listed local utility/context. Button default sizes at `ui/button.tsx:24–27` are below 44px; enforce minimum touch targets at the shell/component adaptation before acceptance.

A exact files: `frontend/src/components/ui/skeleton.tsx` (retain generic loading states, omit source subject/card-specific sections if unused); `frontend/src/components/motion/PageTransition.tsx` (depends only on target skeleton/motion/router after adaptation); `frontend/src/lib/chunkRecovery.ts` and `frontend/src/chunkRecoveryBootstrap.ts` (namespace reload/storage behavior and test target chunk lifecycle); `frontend/src/components/ui/loader.tsx` (replace BarexMark import); `frontend/src/context/ThemeContext.tsx` (preserve theme behavior, replace profile API/storage key); `frontend/src/context/ConsentContext.tsx` plus `frontend/src/lib/consent.ts` (namespace/version Mitooni consent, no inherited vendor declarations or trackers); `frontend/src/context/AppBootstrapContext.tsx` (preserve state orchestration interface, replace source plan catalogue/profile redirects with target DTOs).

Do not import the source tour/book/intro closure merely to make compilation pass. Source `components/books/BookTransition.tsx` imports `ui/book`, and source AppLayout imports TourOverlay/BrandIntro; if those interactions are wanted, inspect/allowlist their complete visual-only closure in a later manifest revision. Stage 0 can remove those hooks while preserving the source shell's actual navigation structure. No recursive UI/assets folder copy.

### Auth and API adapter

A exact files: `frontend/src/context/AuthContext.tsx`, `frontend/src/lib/passwordReset.ts`, `frontend/src/lib/supabase.ts`; N target `src/lib/config.ts` with only required public identifiers and origin settings. Source AuthContext imports only Supabase/passwordReset/React but uses six `sqe_*` intent keys (`:13–18`); replace them with target names, do not import checkout intentions. Preserve account-change handling and signout cleanup.

A code ranges `frontend/src/lib/api.ts:293–305`, `:327–504`: extract the error class, options/error helpers, access-token resolution, authenticated request and wrappers. Adapt out checkoutAttemptId/pattern fields, bind API_BASE_URL in target config and preserve expectedUserId checks. Authentication retry currently replays after a 401; target mutation handlers must reject before any commit and preserve operation IDs. New operation IDs must be created once per user operation, not for every network retry. Do not copy the monolithic `api.ts`, which imports plans, gifts and acquisition types at lines 1–4 and exposes domain endpoints. Prefer the BarEx Bearer/Supabase Auth boundary now that its shell is primary; Mo's cookie-only API is a reference to adapt, not a reason to replace source auth with a new framework. The final auth protocol remains a concrete C2 contract decision with origin/session tests.

Not yet allowlisted: source login/signup/social page components. They require a separate closure pass before reuse; stage 0 may use target route stubs or small source-derived forms using the above auth API, with synthetic local sessions only in the preview/test seam. No consumer flow should advertise unverified OAuth/SMS capability.

### Stage 0 dependency allowlist

Derive target manifest from source versions; do not copy lockfiles wholesale. Runtime: React/ReactDOM ^19.2.0; React Router ^7.13.1; Supabase JS ^2.97.0; Radix Slot ^1.2.4; cva ^0.7.1; Framer Motion ^12.38.0; Lucide ^0.575.0; Zod ^4.4.3 only when DTO validation is wired. Tooling: Node >=20.19, npm >=9, Vite ^7.1.9, React SWC plugin ^3.5.0, TypeScript ^5.6.3, Tailwind/PostCSS v4, source-compatible ESLint/Vitest/Testing Library versions from `frontend/package.json`. Exact lock resolution happens inside target and is reviewed; no install at this checkpoint.

A source `frontend/tsconfig.json`, `tsconfig.node.json`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `vite.config.ts` are configuration templates, not verbatim copies. Build must be plain target Vite initially; exclude source prerender/indexnow/brand-generation commands. N target index.html/package.json. OpenAI ChatKit/agents-realtime, Ark UI, Excalidraw, GSAP, shaders/OGL and brand-art generation tools remain available later on the same source stack, but are not required to render this exact Stage 0 closure.

## Stage 1: reusable backend foundation without source boot side effects

D candidates after target imports resolve: `backend/app/db/read_retry_transport.py` (HTTPX/Supabase only); `backend/app/services/srs.py` (stdlib only; optional vocabulary feature). A: `backend/app/db/supabase_client.py` (target env binding/loopback guards); `backend/app/dependencies.py` (verified identity, narrow internal authority; update import paths and avoid source environment allowlists implicitly granting Mitooni privileges); `backend/app/services/turnstile.py` (target origins/config/log minimization when public forms are enabled).

N target `backend/app/main.py` explicitly registers only target health/profile/bootstrap routes and inert local test seams initially. **Do not copy source main.py:** lines 32–59 import every business/domain router, server and worker; lines 69–73 require Stripe/Resend/Turnstile for source production startup; lifespan lines 100–105 starts source revision/CV/email workers. Payments undecided must not block target boot. Never copy `.env`/`.env.local`/production variables or source `scripts/sync-local-supabase-env.mjs` blindly.

Dependency foundation: Python >=3.11, FastAPI >=0.114,<0.116, Uvicorn >=0.36,<0.37, Supabase >=2,<3 and explicit HTTPX compatible with source lock, plus pytest development tooling. Reuse `backend/railway.toml` deployment recipe with target path/health config; preserve existing accounts/hosting. New target pyproject/lock must contain imported dependencies only. No automatic source boot, remote database initialization or migrations at import.

Later adapted modules, **not yet file-copy allowlisted**: `services/coaching.py`, `services/coaching_workspace.py`, corresponding routers and source coach SQL; `routers/mock.py`/`practice.py` transaction and served-answer boundaries; `db/supabase_store.py` ChatKit thread persistence; `openai_models.py`; realtime/media/job runtime. These source modules are useful and intended for staged port, but their transitive imports, source table names, entitlement/billing gates and corpus-backed server tools must be separated first. Source `generated_question_worker.py:19–26` imports prompt package/loading and source generation service; do not copy it as a supposedly generic queue. Reuse its lease/heartbeat pattern against target jobs. Existing service/provider account baseline is documented in reuse-audit.md; no new vendor discovery required.

## Exclusion boundary and assets

Exclude from every stage's transfer until explicitly reviewed: all `SQE Material` references/contents; textbook/SRA/question originals; generated legal questions/explanations/lead packs; original/generated corpus assets; learner/coaching casework, contacts, reports, CVs, photos, user submissions, snapshots, backups, exports, logs, session stores; env/secrets, production links/checkout identifiers and operational tokens; `frontend/public/docs/`, `blog_posts`, build outputs; source `data/` wholesale; source prompt/example directories; all SQL seed data and blanket migration replay. Exclusion is about material/data, not refusing reusable owned infrastructure.

No binary/brand asset is currently copy allowlisted: safe source assets can be adopted after per-file ownership/license and import review. Replace logo marks with Mitooni-owned identity; do not invent a rule that all source fonts/icons are unusable. Font licenses and third-party UI attribution must accompany actual copied assets. Existing source public configuration contains historical payment links; do not reproduce them in target configuration/docs.

## Import and receiving test seam

Before copying: coordinator reviews this allowlist and adapted target map. At implementation, generate an import-closure listing rooted in target main/App, reject unresolved imports and paths outside target allowlist, and review dynamic imports/CSS URLs/public assets separately. Run without production env, remote provider startup or original content fixtures. Source working tree remains read-only; all adaptations in new target paths.

Stage 0 acceptance: frontend typecheck/build, isolated unit checks for auth logout/account-switch, theme/consent namespace and failed API response, synthetic route navigation, no tracking calls, mobile 360/768/1280 layouts, keyboard/focus and axe; inspect resulting bundle/public file list for source domain, corpus/payment routes and accidental data. First screenshot review compares source shell structure with target adaptations; no live learner screenshots.

Stage 1 acceptance: isolated local stack only; no service secret client-side; default-deny schema/grants; cross-product and learner/coach deny fixtures; worker disabled unless target queue configured; auth expiry/failure and startup missing-config behavior; test that source webhook/financial routes are absent. C2/C3 retains recoverable Reading/Writing/coach objectives, but runs inside BarEx-derived shell/platform. Mo IELTS components are integrated only through their own isolated allowlist and authoritative DTO adapter.

Checks at this checkpoint: safe source import inspection and manifest/config reads only. No code copies, installs, app executions, production inspection or provider changes. Open items: coordinator approves exact target layout and auth contract, then implementation closes adapted-file import graphs and independent reviewer checks allowlist/bundle evidence. No extra user permission is required for authorized internal port work.
