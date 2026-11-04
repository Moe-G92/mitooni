# S0 BarEx shell implementation

Date: 2026-11-04. Owner: scaffold/architecture specialist, gpt-6.1-sol / medium. Receiving branch: `codex/foundation-review-20261104`; source revision: BarEx `af57036ad18a45a0aa20a81202c9e0939ebd99d5`; Mitooni base `d2266e8e4b92869d857c6d19d4d635509a960fab`. Scope: `platform/frontend/` plus this record. No commit, push, publishing or production action.

## Preflight and authority

1. A top professional would port the real shell and its lifecycle, then prove source separation, rather than recreate a similar sidebar or let fixture authentication enter a production bundle. This is the necessary S0 foundation; tutor/content/assessment functionality remains later work.
2. Raw material was the actual BarEx AppLayout, entry/provider graph, tokens, motion/primitives and package source at the recorded revision. The approved port manifest/plan and current CHARTER/DECISIONS govern the receiving adaptation. Source corpus, learner records and environment files were not needed or read.
3. Read source/imports, copy only admitted paths with source hashes, adapt seams in the receiving tree, typecheck/lint/build, trace static imports, scan production artifacts and test synthetic browser state/failure flows. Use the design-taste frontend app-screen workflow with BarEx design explicitly retained; no random redesign or new service architecture.
4. Independent evidence is the exact import/hash manifest, source worktree preservation, isolated production graph/artifacts, passing state/failure tests and independent browser/security acceptance. Source success or the author's judgment does not constitute receiving approval.

Coordinator explicitly authorized S0 local implementation. Latest root, source-workspace and receiving instructions, CHARTER/DECISIONS, port manifest and shell plan were read. No `port-review.md` existed at the initial read; reviewer corrections were received directly and implemented. Only `platform/frontend/` and this record were written by this specialist. Mo's `web/` and BarEx source remain unchanged (receiving `git diff --exit-code -- web` and source `git status --short` produced no changes on final preservation check).

## What is implemented

`platform/frontend/src/components/AppLayout.tsx` is an adapted copy of the actual BarEx layout, retaining its desktop collapsible rail, mobile drawer/header, page header/back/header-slot/exam-mode contexts, navigation geometry, viewport-change behavior and profile composition. It is not a substitute static sidebar. Source PageTransition, motion store/delayed flags, Theme provider lifecycle/rollback, toast mechanics, chunk-recovery behavior and admitted UI primitives were copied or adapted in the same receiving tree.

Removed source-only referral, rename-modal, guided-tour and book-transition closures. Replaced brand/navigation/profile/bootstrap seams and source assets with Mitooni text identity, Lucide package icons and a neutral runtime interface. Preserved BarEx green/cream/dark tokens and layout; adapted physical layout properties to logical inline direction. Persian is default, English is available in Profile, and locale/theme preferences survive reload. RTL Back icon/hover direction and reduced-motion press behavior are adapted. Navigation/header targets are at least 44px where the independent review identified source deficiencies.

Skills, Notes, Practice, Mock and Profile routes are genuine shell destinations. Skills displays IELTS taxonomy and one grouped unpublished-content state. Notes/Practice/Mock are honest empty states with a working return-to-skills action; no notes engine, corpus, statistics, assessment, purchase or coach service is fabricated. Profile supports language/theme and sign-out. The shell carries one essential local-preview disclosure on every authenticated destination. A test-only synthetic sign-in route allows restoring the local sample session.

RootLayout retains Outlet plus BarEx's delayed-loading/shell-mounted mechanics. Its closure is explicitly reduced to React Router, receiving locale and source motion helpers. No acquisition, referral, pixel, analytics or inactive consent dock is registered; necessary-only consent state is retained without optional vendors or consent storage writes. This matches the approved option to omit inactive dock registration rather than accidentally import its broader side-effect graph.

## Preview versus production

- Local preview: `npm run dev -- --port 5187 --strictPort`, then `/preview/topics`. Vite is bound to `127.0.0.1`. The `/preview/*` HTML rewrite exists only in the development plugin, preserving reload/deep links under a router basename.
- Explicit preview artifact: `npm run build:preview` writes `dist-preview/preview.html`. It is a synthetic internal artifact, not an approved hosting destination.
- Production: `npm run build` writes `dist/index.html` and a fail-closed service-unavailable page. Production does not load the preview router, fixture session, Runtime provider or provider SDK. Missing backend/provider integration never silently becomes an authenticated demo. This S0 has deliberately not implemented live sign-in or a production learner flow.

The preview dependency graph never imports live `AuthContext` or `supabase.ts`; neither file was copied. The neutral `RuntimeContext` accepts only the explicitly supplied local fixture adapter. No browser SDK client or provider is initialized at import time. No `.env`, source origins, source project IDs, production account configuration, payment URL, AI thread/vector-store identifiers or credentials were copied. Vite sets `envDir: false`, `publicDir: false`, no proxy and a receiving-only filesystem allowlist. Source prerender/IndexNow/brand scripts are absent.

`IMPORT_CLOSURE.json` is generated by `node scripts/import-closure.mjs`: 2 production TypeScript modules and 27 preview TypeScript modules. The script rejects receiving-relative imports escaping `src`, preview modules reachable from production and live provider SDK packages in the preview graph. This is a static check, supplemented by emitted-artifact and actual browser request observations; it is not a full security proof for future integrations.

## Provenance, assets and installation

`PORT_MANIFEST.json` records original source SHA-256, adapted target SHA-256, source/target import lists, new compositions, asset provenance and explicit exclusions. Each copied/adapted source file has a source entry, including recomposed provider/root/auth composition. No public/assets directory was copied, no symlinks point to source and no runtime dependency on the source checkout exists.

Vazirmatn Variable is loaded from the receiving npm package, with its SIL OFL 1.1 notice copied into `licenses/Vazirmatn-OFL.txt` and emitted in both builds. Lucide icons come from their ISC-licensed package. Runtime dependency notices are preserved in `licenses/THIRD_PARTY_NOTICES.txt` and emitted in both builds. Mitooni wordmark/compact text mark are receiving text compositions; no source BarEx logo or event/legal document was imported. No remote imagery, font CDN or media asset is used.

Reviewed package scripts before installation. `npm install --ignore-scripts --offline` could not resolve an uncached package. An initial restricted network install stalled and was interrupted; the approved network-capable install with `--ignore-scripts`, receiving-only cache under `/private/tmp`, no audit/fund requests, completed with 250 packages. npm reported its installed ESLint 9 release deprecated; this is a tooling maintenance note, not a hidden successful audit. No dependency vulnerability audit is claimed. Install scripts remained disabled. Target lockfile is new; source and Mo lockfiles were not changed.

## Checks and corrections

Completed in the receiving frontend:

- `npm run typecheck`: pass.
- `npm run lint`: pass, zero warnings.
- `npm test`: 5 tests pass. Tests cover Persian default/English switch/persistence and denied network; bootstrap failure/retry without granting shell access; theme/save/toast/sign-out/protected-route behavior; failed-theme rollback; route-error retry preserving `/preview` basename.
- `npm run build`: pass; production output scan passes with 8 artifacts, no fixture session/preview/provider references in HTML/JS/CSS.
- `npm run build:preview`: pass; explicit synthetic artifact remains separate.
- `node scripts/import-closure.mjs`: pass, production 2 modules / preview 27 modules.
- Browser: real navigation with animations retains `/preview`; theme/English selection survive reload; phone drawer Escape restores opener focus; 390px page has no horizontal overflow; resource inventory has zero requests outside the local origin. These are local/synthetic observations, not live-provider evidence.

Initial failures were preserved in the work: missing offline npm cache; first test setup encountered Node 26's unavailable global localStorage and was corrected with explicit synthetic storage; source ESLint suppression directives and unused sliced skeleton helper were removed; real browser caught a CSS anchor inheritance override darkening nav icons; PageTransition required basename-aware navigation; independent security reviewer found RouteError's hard navigation escaped the preview basename, fixed with router navigation and a regression test. Independent browser reviewer identified breadcrumb size/contrast and collapsed-brand accessible-name mismatch; target size/contrast/name and semantic mobile header were corrected. Final independent axe/width results are owned by the reviewer record, not inferred here.

Source code still contains intentionally retained BarEx design choices which the marketing-oriented taste source linter flags (source palette, primitive borders/shadows/mono token, transition warnings). That linter was run and is **not reported as clean**. The explicit source design instruction and app-screen rules govern these exceptions. Actual app-screen browser inspector, run with the preserved palette allowed, reports **0 FAIL / 1 WARN** at 1440/768/390. The warning is honest empty-catalogue whitespace; adding fake content or enlarged marketing composition would contradict this S0 scope. No source screenshots could be produced safely without its provider configuration; source fidelity is established through the copied implementation/provenance and independent receiving review, not a fabricated live comparison.

## Visual review

Final shell evidence is under `platform/frontend/review/accepted/`: desktop/tablet/mobile fold and page sheets, plus inspector JSON. All six listed screenshots were opened. Earlier `desktop.png`, `mobile.png`, `taste*` and `final/` captures were intermediate, including the original contrast defects; they must not be presented as final acceptance evidence. Independent reviewer captures after the correction batch take precedence for final acceptance.

Idea: preserve BarEx's working shell and make its direction, labels and identity Mitooni's. Live controls in this scope are navigation, locale, appearance, sign-out, retry and mobile drawer/collapse. No photographs/clip credits apply; only package font/icons and receiving text identity are present.

Final screenshot critique: identity/header and navigation hierarchy are clear; margins and logical layout hold; loaded Vazirmatn covers Persian and English; selected states/profile icon are now visible; source scale/motion remain recognizable. Empty catalogue deliberately lacks content density. This is an internal shell, not a complete learning screen. Scores: design 7/10, usability 8/10, creativity 6/10, content 7/10; weighted 7.1/10. No landing-page imagery quota applies to this app-screen port. Fourteen-pass notes: first-glance identity is the shell; squint gives rail/header/content; source design is intentionally recognizable; repeated content edges align; frame/spacing are consistent but sparse; typography loads correctly; palette is inherited; no imagery is needed for unpublished records; peer skill rows share structure purposefully; phone has folded navigation; fullness remains limited by scope; information is truthful; no observed collisions/overflow; the live controls work. Top fixes made were icon contrast, repeated helper removal and accessible/touch naming/targets.

## Scoped verdict and restart

**S0 implementation accepted for the local internal-shell scope.** Independent browser validator recorded APPROVED in `port-acceptance.md`: zero axe issues across the four catalogue widths and all five routes, including final English dark drawer/expanded navigation; all 21 source/target manifest hashes matched; independent production build/8-artifact scan and 2/27 import graph passed. Final production JS is `index-CGGwQyrZ.js`; preview JS is `preview-VfGzTxNa.js`. No code changes followed those checks.

This is a runnable genuine BarEx-derived internal shell with tested synthetic-preview/production separation. It is not the full platform port, a production learner product, validated marking or go-live approval. Live auth, backend identity/profile/bootstrap integration, tutor/voice/content/coaching/jobs and corpus admission remain staged work; payments remain unresolved. Do not route real learners into this preview.

Next action: coordinator integrates independent browser/security findings for the exact target hashes, records S0 acceptance and commissions the next explicit port slice. Restart using current CHARTER/DECISIONS, port manifest, this report, target `PORT_MANIFEST.json`/`IMPORT_CLOSURE.json` and Git status. Local server :5187 is left running for review. No background implementation continues after checkpoint.
