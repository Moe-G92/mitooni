# Baseline and interface validation

Date: 2026-11-04. Specialist: independent baseline/UX validation, gpt-6.1-sol, medium. Checkpoint: intake and evidence, complete; awaiting coordinator review. Reviewed application revision: `d2266e8e4b92869d857c6d19d4d635509a960fab`, branch `codex/foundation-review-20261104`. No application or lockfile edits.

Latest coordinator direction: BarEx shell/platform is the implementation base; Mo's scaffold is an IELTS reference for selective integration. This report audits that reference and defines transferable acceptance constraints. It does not recommend repairing or shipping Mo's app as the product base.

## Preflight

1. A top professional would test lost connectivity and reload independently of happy-path counts, inspect both document overflow and clipped internal panes, and distinguish prototype demonstrations from production evidence. These are necessary foundations, not added product scope.
2. Raw materials: actual `web/src/` implementation, package lock/configuration, 44 unit tests, 19 browser tests and fresh synthetic browser sessions. README descriptions and green counts are claims to challenge.
3. Run the locked install, TypeScript/build, ESLint, Vitest and existing Playwright suite; use Playwright CLI/Chrome for synthetic failure injection, keyboard and Persian/English inspections; use axe 4.14.0 and design-taste-frontend render/lint tools. These provide reproducible behavior and geometry alongside source tracing. No real backend, learner data or microphone recording required.
4. Independent evidence: executable command outcomes, explicit 503 injection and reloaded values, DOM dimensions/ARIA attributes, axe violations, screenshots at defined widths, and exact source locations. Scoring validity, learning outcomes and Iranian connectivity cannot be inferred from these checks.

## Commands actually run

Working directory for npm commands: `app/web/`. Node `v26.9.0`; npx available at `/opt/homebrew/bin/npx`; installed Google Chrome available.

- `npm ci --ignore-scripts --no-audit --no-fund`: passed, 570 packages installed in 7 seconds. Install emitted deprecation/security warnings for tar/glob and deprecation warnings for eslint/boolean. No dependency audit was performed; do not infer a clean dependency-security result.
- `npm run build`: passed (`tsc --noEmit && vite build`), 3,196 modules, Vite 7.3.7. Warnings: coach fixture both static/dynamic import; chunks over 500 kB, including ~711 kB main and ~513 kB mock/browser chunk. This is not a performance measurement.
- `npm run lint`: passed, zero warnings permitted by script.
- `npm test`: passed, 4 files / 44 tests, 1.94 seconds. Node emitted an experimental localStorage warning.
- `npm run e2e`: first two attempts failed before tests because sandbox denied binding `::1:5174` (`EPERM`). Approved escalated rerun passed all 19 tests in 52.1 seconds, using Chrome and mock API. No app/config alteration to obtain the pass.
- `npm run dev -- --port 5175 --strictPort`: local review server started. For independent browser work, `npm run dev -- --host 127.0.0.1 --port 5176 --strictPort` started with approved escalation.
- From `app/`: `node /Users/arashshahrokhi/.codex/skills/design-taste-frontend/scripts/lint.mjs web/src`: exit 1, 179 FAIL / 42 WARN. This is a broad style heuristic, not 179 functional defects: it also flags legitimate form/table/app borders and exam clock formatting.
- `node /Users/arashshahrokhi/.codex/skills/design-taste-frontend/scripts/inspect.mjs http://localhost:5175 --out review/baseline/landing --widths 1440,768,360`: initial sandbox Chrome launch failed; approved escalated run completed, exit 1, 13 FAIL / 6 WARN.
- `node /Users/arashshahrokhi/.codex/skills/design-taste-frontend/scripts/inspect.mjs http://127.0.0.1:5176/sign-in --app --out review/baseline/auth --widths 1440,768,390`: completed, exit 1, 3 FAIL / 5 WARN.
- `npm exec --yes --package=@axe-core/cli -- axe --version`: initial sandbox attempt eventually failed `ENOTFOUND registry.npmjs.org`; approved escalated run returned `4.14.0`. Injected its cached `axe.min.js` using Playwright `page.addScriptTag`, then `axe.run()` on the routes below. A non-escalated Playwright CLI request likewise eventually failed registry resolution; escalated browser requests succeeded. App dependencies/lock unchanged.
- Browser driver: `/Users/arashshahrokhi/.codex/skills/playwright/scripts/playwright_cli.sh -s=mitooni-independent`, using `open`, `snapshot`, `fill`, `click`, `run-code`, `eval`, and `reload` against `127.0.0.1:5176` only. Sign-in used the documented synthetic seeded identity and local test password.

## Observed behavior and consequential findings

### Save failure silently discards the latest answer on reload

Reproduced twice in an Academic Reading attempt. Filled Question 6 with `baseline-confirmed`, waited 900 ms for successful save. Wrapped only browser `fetch` calls with method PATCH and URL containing `/state` to return a synthetic HTTP 503 JSON error. Filled Question 6 with `baseline-lost-on-reload`, waited 1,200 ms. Measurement: `failedPatches: 1`; alert/status text was empty; visible text contained no unsaved/save-failure/retry message. On reload the textbox contained `baseline-confirmed`. Earlier independent repetition restored `baseline-saved` instead of `baseline-unsaved`.

This is loss of the latest unpersisted edit during a known failed save, not evidence that all successful saves fail. The normal reload/resume e2e passes. Source explains the failure: `web/src/exam/engine/session.tsx:152` catches save errors, retains pending data only in memory and resolves `flush()`; its `saving` state has no UI consumer. `web/src/pages/exam/ExamPage.tsx:110` submits after awaiting that resolving flush, and `:148` leaves after it. Submitting stale state under a failed flush is therefore a material source-level risk; this review reproduced reload loss, not the entire failure/submission sequence. Retry scheduling depends on later changes/timer ticks, not a demonstrated durable recovery contract.

Acceptance gate: persist a recoverable local draft/outbox or equivalent; show saved/pending/failure state with recovery; block final submission/unsafe exit until required state is acknowledged or user explicitly resolves it; test offline/503, reload, retry and duplicate submission.

### Mobile exam does not fit the learning task

At 360×800, document `scrollWidth` equals 360, but this alone misses the defect: the candidate name and centered timer collide in the 56px header, while both passage and questions remain side by side. The passage becomes a narrow strip and question tables extend beyond the visible right pane. `SplitPane.tsx:19` always uses flex side-by-side panes, initially 46%; no mobile alternate mode. At 768×1024 the two-pane arrangement is substantially more usable.

Measured 360px targets: Connected/Messages/Options/Show notes each 36×36; question navigation buttons mostly 21–26×27; Part 1 approximately 44×24. These fail the project's 44px house target criterion. This is not a blanket claim of WCAG target-size failure, whose exceptions and spacing require separate assessment.

Acceptance gate: define deliberate phone exam behavior (single pane/tab switching or an explicit supported-device boundary), resolve header collision and meet house touch targets. Test internal clipping, not just document overflow.

### Focused accessibility scans find serious issues

Axe 4.14.0 on current Persian preference, desktop unless stated:

- `/app`, 360px: serious `label-content-name-mismatch`, 2 nodes (account control and last-result link).
- `/`: serious `color-contrast`, 1 node.
- `/sign-in`: serious `autocomplete-valid`, 1 node; moderate `region`, 1 node. Source `Auth.tsx:226` sets email autocomplete to `username email`, an invalid combination for the purpose field.
- `/practice/reading` and `/practice/writing`: moderate `region`, 1 node each.
- Running Academic Reading exam: serious `listitem`, 15 nodes. `QuestionGroupView.tsx:180` makes a `ul` a radiogroup while leaving its children as listitems; semantic ownership needs review.

Keyboard spot checks: Tab from Question 6 reaches Question 7; pane separator focus has a visible 2px blue outline, and ArrowRight changes `aria-valuenow` from 46 to 50. The existing widget test also exercises keyboard heading matching. These are useful spot checks, not a complete keyboard-only journey or screen-reader audit. A zero-serious/critical accessibility gate is not met.

### Useful existing behavior worth preserving

- All four exam/practice skill flows exercised by the existing suite pass, including successful reading reload, timer expiry, recorded synthetic audio playback, result evidence jumps and Persian mobile practice.
- Persian app has `html dir=rtl lang=fa`; exam root retains `dir=ltr lang=en`. Fresh mixed-direction captures show Persian labels with English skill names/content and Persian numbers. At 1440px measured document width equals viewport. Existing 375px practice assertions also pass, although their final `isVisible()` call does not assert its Boolean result.
- Synthetic microphone denial in Persian speaking practice presents an understandable no-device/permission message, keeps planning usable and offers a sample take. Existing e2e checks denial/sample distinction. This is simulated denial, not physical microphone or OS-permission validation.
- Brand, English/Persian switching, responsive public navigation, answer widgets, result evidence and scoring-total reconciliation form reusable frontend work. Preserve these while replacing prototype infrastructure.

### Prototype boundaries and missing release evidence

`web/src/main.tsx:12` enables MSW by default unless explicitly disabled, including production build configuration; `web/src/mocks/db.ts` stores the entire mock database in browser localStorage and silently falls back to memory if persistence fails. Existing tests therefore prove behavior of a single-browser simulated product. Authentication, coach messaging/booking, entitlements and score/feedback do not establish a working production service. No production/real API calls were made here.

Router `web/src/app/App.tsx` and public footer have no Terms/Privacy routes, operator identity or contact route/link. Visible prototype language is present in auth/footer. Marketing promises Academic & General and a trustworthy band while the charter confirms Academic first; these promises require scope/content/assessment reconciliation, not automatic migration to backend requirements.

No Lighthouse run, performance 90+ evidence, 1920px check, real Iranian-device/network/browser coverage, full keyboard or screen-reader pass, production security audit, payment sandbox flow, recording-upload failure flow, coach-service validation or independent scoring-validity assessment occurred. No named-portfolio side-by-side parity verdict is asserted.

## Test strength and limits

The 44 tests meaningfully cover schema shape, question numbering/evidence, marking variants, totals, common widgets, keyboard matching, successful autosave, date/digit utilities and fixture-derived dashboard counts. The 19 e2e flows cover more than static rendering. Preserve them as regression protection.

However mock fixtures and client code share the same source of truth. Tests that seed a trend or approved mockup numbers establish consistency, not assessment validity. Successful autosave mocks never reject; the suite lacks the reproduced failed-save reload case. Camera/microphone are fake; coach replies/bookings/auth are simulated. Timer fast-forward is not server timing. No browser-service agreement, tenancy/security boundary or billing outcome follows from green counts.

## Render critique (review only, no redesign)

ROUND 1

Seen in one second: IELTS book, large purple title and red practice action; dashboard greeting/calendar before work.

Idea (one sentence): an IELTS practice paper becomes the visual link between rehearsal and a marked result.

Live thing: create a synthetic attempt and answer/receive mock feedback.

Layout words by section: landing=split book / features=alternating panels / mock=colour field / report=sheet / close=split; dashboard=greeting/calendar / drill banner / skill cards / analysis pair.

Scores: design 6.5 · usability 5 · creativity 6 · content 5 → overall 5.9.

Caps applied: inspector failures cap overall at 6; interface mobile collision/clipping caps usability at 5. Picture-count marketing heuristic is not a reason to replace working app UI with stock photographs. Existing mock art is specific and should be judged as illustration.

Top three changes, subject to reviewed implementation scope:

1. Make failed save and recovery explicit before any cosmetic work (`autosave-failed-1440.png`, `autosave-failed-360.png`); a learner must know whether their work survives.
2. Compose exam phones deliberately (`exam-360.png`, `exam-768.png`): current candidate/timer collision and permanent split interfere with reading and answering.
3. Let the next practice action lead the dashboard and reduce competing greeting/calendar/goal glow, redundant explanations, eyebrows and small repeated badges (`dashboard-1440.png`, `dashboard-fa-360.png`). Preserve essential instructions and accessible names. Public copy must reflect actual Academic pilot and evidence-backed feedback.

Inspector caveats: at width 360 its unlisted-height fallback produces a 225px-tall viewport. Its mobile `no-title` and `blank-gap` findings are not accepted as realistic phone defects. Independent 360×800 captures/measurements were used for actual mobile findings. Some full-page Chrome captures repeat fixed content; DOM measurements show only one exam header. Do not treat screenshot stitching repetition as duplicate DOM. All inspector-listed screenshots were opened; no changes or redraws were made.

## Evidence, diff and restart

Evidence root: `/Users/arashshahrokhi/Projects/mitooni/app/review/baseline/`, ignored by a local `*` rule in that directory. Includes `landing/report.json` and all listed landing sheets, `auth/report.json` and all auth sheets; `dashboard-{1440,768,360}.png`, `dashboard-fa-{1440,768,360}.png`, `exam-{1440,768,360}.png`, `exam-keyboard-focus.png`, `autosave-failed-{1440,360}.png`, `microphone-denied-fa-1440.png`, and `.playwright-cli/` snapshots/console records. Screenshots contain only mock content and synthetic identity.

`git diff --stat` after checks was empty for tracked files. Git status showed coordinator-owned untracked `AGENTS.md` and `docs/foundation/`; no application/lockfile changes. Generated `node_modules`, `dist`, test results and review evidence are ignored. No env files read, no original resource ingestion, no external messages or publishing. No source-project reuse or changes performed by this specialist.

Restart: install is present; rerun npm scripts from `web/`; start localhost-only Vite with port 5176 (review servers were stopped at checkpoint); use a fresh browser session to avoid existing preferences. Follow exact failed-save recipe above with synthetic text only. Report source/content remains at d2266e8 unless coordinator integrates later work.

Verdict: **CHANGES NEEDED for release. Baseline reproduction complete; suitable as frontend prototype evidence, not production approval.** Highest priority is recoverable attempts, followed by mobile exam behavior and serious accessibility findings. Stop at this checkpoint and await coordinator direction.
