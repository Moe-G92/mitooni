# Independent S0 port acceptance

2026-11-04. Reviewer: independent baseline/UX validation specialist, gpt-6.1-sol, medium. Reviewed receiving `platform/frontend/` on `codex/foundation-review-20261104`, source BarEx `af57036ad18a45a0aa20a81202c9e0939ebd99d5`; Mo reference `d2266e8e4b92869d857c6d19d4d635509a960fab`. Exact receiving source/provenance hashes are in `platform/frontend/PORT_MANIFEST.json`. No application changes by this reviewer.

## Preflight and scope

1. A top reviewer independently exercises the actual corrected artifact, including open drawers and production entry, rather than accepting source-test counts or static layout alone.
2. Raw evidence: copied/adapted files, provenance hashes, Vite/build graph, built output and fresh synthetic Chrome interactions. Source shell was inspected read-only; no source app/env/content was executed/read.
3. Use source/hash/graph checks, receiving build/lint/tests, one runtime dependency audit, Playwright CLI/Chrome, axe 4.14.0, DOM geometry/contrast and four-width screenshots. Security reviewer covers deeper backend/security boundaries; do not duplicate that suite.
4. Evidence independent of opinion: all hashes match, graph separation, explicit production denial, recorded attempted network destinations, persistence/focus assertions, settled axe scans and reviewed screenshots.

This is acceptance of a BarEx-derived local shell preview and fail-closed production placeholder. It is not acceptance of authentication, connected backend UI, IELTS practice/assessment, notes service, coach workflow, AI/retrieval or learner pilot. Those remain subsequent port tranches. Existing useful source features remain intended for staged reuse.

## Checks actually executed

From `platform/frontend/`, independently ran `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run build:preview`, `node scripts/import-closure.mjs`. All passed after the first correction batch: 5 focused tests, 2 production source modules and 27 preview source modules; production separation scan passed, 8 output artifacts. After the final active-label/dialog correction, independently repeated build/graph (passed) and affected browser states (passed), without repeating unchanged tests. Final production JS `index-CGGwQyrZ.js` ~223kB; preview JS ~479kB. These sizes are not a Lighthouse/performance verdict.

One `npm audit --omit=dev --json` succeeded: 0 reported vulnerabilities in the runtime dependency audit (19 production dependencies). This does not cover dev-only vulnerabilities or establish comprehensive software-security assurance. No dependency changes made by reviewer.

Python SHA256 comparison independently checked all 21 source/target manifest rows against admitted source files and current receiving files. Final rows matched; an intermediate AppLayout mismatch during active correction was reported and resolved by the owner's refreshed manifest. Inspected new composition list, graph checker and production check. Source `git status --short` was clean at `af57036...`; receiving `git diff --exit-code HEAD -- web` passed, preserving Mo's reference. `git diff --check` passed. Receiving `.gitignore`, README, AGENTS, foundation records and platform additions are the coordinator/implementers' changes.

Chrome driven through `/Users/arashshahrokhi/.codex/skills/playwright/scripts/playwright_cli.sh -s=mitooni-port`, with approved escalation for local browser/server. Used architecture-owned `http://127.0.0.1:5187/preview/` without stopping it. Reviewer separately served production using `npm exec vite preview -- --host 127.0.0.1 --port 5188 --strictPort`.

## Independent behavioral evidence

- Fresh browser default is Persian/RTL. Switching to English gives `lang=en dir=ltr` and survives reload; dark appearance survives reload. Storage keys observed: `mitooni-locale`, `mitooni-appearance-theme`; source keys absent in that fresh run.
- Reduced-motion browser context reports its media query active; receiving CSS reduces animation/transition durations and BackButton explicitly suppresses travel. No claim of exhaustive vestibular/accessibility testing.
- Mobile drawer initial focus enters close control, Tab from last control wraps to first, Escape closes and returns focus to opening menu control. Desktop sidebar expands to 216px and collapses to the source-derived 76px rail. Focus outline visible in drawer capture.
- Preview signout shows signed-out heading and denies navigation within that running synthetic session. Hard navigation reloads the synthetic preview identity by design; it is explicitly disclosed and does not represent persistent real authentication.
- A fresh request-intercepted browser run exercised profile, locale/theme change, reload, signout and direct preview route. Zero outside-origin attempts and zero fetch/XHR application API calls were observed. Only localhost Vite HMR WebSocket connections occurred; no provider/service/analytics calls. This is bounded journey evidence, not proof over every theoretical execution.
- Built production at `/preview/topics?preview=1`, including synthetic-looking localStorage flags and reload, showed only Persian service-unavailable content, zero buttons and no synthetic learner. Production graph has only main/unavailable source modules; preview graph has no Supabase/OpenAI/ChatKit SDK imports. Config explicitly sets `envDir:false`, `publicDir:false`, receiving-root filesystem scope; no inherited parent loader/proxy.
- A probe expecting a New note action timed out because the owner correctly reduced Notes to an empty-state route before final acceptance. No note-write/reload guarantee is claimed. Existing notes-service implementation is a later tranche; preview does not advertise a working service.

## Visual/accessibility review and corrections

Initial independent checks found a sub-44px Home breadcrumb, serious logo accessible-name mismatch and low breadcrumb text contrast. Coordinator also identified low nav/profile icon contrast and repeated no-content copy. Owner corrected these. Final catalogue shows one grouped empty-state message and primary skill labels; source shell geometry/header/back contexts/navigation remain recognizable, with Persian logical direction, receiving mark and self-hosted font. Structural fidelity is based on actual source/target code and synthetic receiving render, not live BarEx screenshots or transferred source approval.

Final settled catalogue scans at 360×800, 768×900, 1280×900 and 1920×900 returned axe violations `[]`; document scrollWidth exactly matched each width. Visible interactive target measurements had no item below the 44px house target after the breadcrumb fix. Final desktop notes/practice/mock/profile and English dark-profile scans returned `[]`. Screenshots were opened and inspected. This is focused axe/keyboard evidence, not a comprehensive WCAG conformance audit.

Additional open-drawer scan found a real serious active-link text contrast defect (#fb923c on #2d4f4e, 3.96:1), plus minor unsupported `aside role=dialog`. Owner raised active labels to the source gold-light token and changed the drawer element to `div role=dialog`. Final settled English dark open-drawer and expanded-desktop rechecks returned axe `[]`; exact final selected text computed #fdba74. Icon contrast and text contrast are separate requirements. All identified acceptance blockers are resolved.

Measured inactive profile icon #d4dfdc against #103736 is 9.49:1. Active orange icon already exceeded the 3:1 non-text requirement; active text required the separate correction above. Source green/cream shell styling is deliberately retained for this BarEx-base tranche; this reviewer did not redesign or copy Mo's shell.

Final screenshot directory: `/Users/arashshahrokhi/Projects/mitooni/app/review/port/` (ignored). Coordinator should inspect `accepted-shell-fa-360.png`, `accepted-shell-fa-768.png`, `accepted-shell-fa-1280.png`, `accepted-shell-fa-1920.png`; additional English/dark/profile/drawer/expanded screenshots and `production-denied.png` are there. Earlier `shell-*` and `final-shell-*` files are intermediate evidence, not the accepted final render. `.playwright-cli/` contains snapshots/console records; only synthetic local data used.

## Verdict and limits

**APPROVED for the bounded local S0 shell-port checkpoint.** Four-width and open-state evidence, production separation, fresh synthetic behavior, source preservation and dependency status support this scoped verdict. No learner/public release approval. Backend identity-only acceptance is independently owned by the security reviewer; this reviewer did not rerun its full suite or infer a working connected learner service. Reviewer stopped the separately owned production preview server at checkpoint; architecture-owned preview server was left alone.

Remaining implementation gates are live auth/session integration, original corpus admission, durable/versioned Reading/Writing attempts, ownership and coach isolation, media, AI/provider eligibility and full learning/pilot validation described in DECISIONS. No secrets, env or raw resources read; no external send/deploy/spend/provider call. No need for new architecture or procurement to continue the authorized staged port.
