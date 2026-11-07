# Learner secondary screens — 7 November 2026

Owner: learner_secondary; model gpt-6.1-sol, medium. Branch codex/ielts-content-20261106. Owned scope: account/learner/secondary and this record. Read Projects/AGENTS.md, receiving AGENTS.md, learner MVP checkpoint/wire/design record and design-taste-frontend app-screen instructions. No global Lumi assignment.

## Intake and preflight

1. A professional verifies provenance and missing evidence before displaying attractive score trends. This scope separates deterministic item accuracy, assistance conditions, feedback and unassessed skills; it must not derive IELTS bands.
2. Primary material: Mo Results, ProgressPage, Vocabulary and Coach source; actual frozen learner wire and receiving transport/UI primitives. Prototype hooks and simulated scores/bookings are excluded.
3. Use Mo tokens, restrained white panels and list composition with parent authenticated resource hook. Inspect TypeScript/lint and actual route rendering when integration exists. This preserves receiving identity rather than dealing an unrelated style.
4. Independent evidence: actual HTTP persisted candidate results/vocabulary, canonical review links, no prototype imports, keyboard and mobile route review, transport-failure recovery. Static checking alone cannot prove those journeys.

## Design decision

Results: chronological submitted attempts with skill, conditions, date and raw correct/item counts only where present. Full review uses canonical workspace. Progress: four-skill aggregates; missing evidence stays missing; no trend chart is invented from aggregate data. Vocabulary: candidate-owned list and optional local reveal review, never claims spaced-repetition persistence without server support. Coach: operational unavailable state and existing request information; no invented slots or request success.

Reuse is receiving-project Mo panel/list patterns and parent learner UI, not prototype query modules. Known contract gap: vocabulary write requires expectedRevision while initial wire lacks revision output; requested backend clarification before enabling saves. Independent browser validation remains pending parent route wiring.

## Implementation checkpoint

Backend owner confirmed vocabulary GET/POST aggregate revision starts at0, increments after append and expectedRevision must match. Implemented five route components plus shared attempt rows. Results detail reads owned result then redirects canonical learner workspace; parent route parameter must be `attemptId`. Vocabulary saves are candidate-owned, optional meaning/example, exact-operation key/body retained on network failure, saved-version reload preserves current form fields. Reveal review is ephemeral and claims no grading or schedule. Backend unavailable coaching is represented without request action; persisted requests are listed if present.

Observed checks: `npm run typecheck` passed. `npx eslint src/account/learner/secondary --max-warnings=0` passed. `npx vitest run src/account/learner/secondary/secondary.test.tsx` passed4 tests: raw zero correct-item score/assistance and review link; missing skill evidence; lost-response exact vocabulary retry; coaching unavailable without action. Initial retry test exposed a form submit caused by untyped Retry buttons; error block moved outside vocabulary form and rerun passed. No prototype/API query/MSW data imports admitted.

Limits: component tests use synthetic resource-hook fixtures, not HTTP/PostgreSQL or provider evidence. Parent owns routes, canonical workspace, client and schemas. Independent browser, mixed-direction visual, keyboard and axe validation remains with integrated frontend review. No go-live verdict, commit, push, deploy, dependency installation, backend write or external action performed. Current checkpoint: IMPLEMENTED; awaiting parent integration/reviewer. Restart with parent routing and actual local learner API.

## Recall extension intake

Parent returned with root's explicit request for persisted vocabulary recall. The four preflight answers remain applicable with a narrower acceptance addition: server revision/owner/idempotency and persisted due state must determine review, rather than local revealed cards. Requested typed again/known review operation and server-computed due flag from backend owner. No mastery/band inference or automatic dictionary generation is added. Compare smallest options: local reveal cannot satisfy persistence; server-owned recall event/schedule with aggregate revision reuses existing guarded transport and is chosen pending exact contract. Evidence criteria: due-only queue, reveal before recall action, saved returned schedule after reload, failed operation exact replay, stale revision preserving visible card and explicit recovery. No external action/provider work needed.

## Persisted recall implementation checkpoint

Backend confirmed `POST /vocabulary/{id}/reviews` body `{recall:again|known,expectedRevision}` uses aggregate revision; full Vocabulary response includes `serverNow` and item `reviewRevision,dueAt,lastReviewedAt,lastRecall,due`. Server computes due status; known is scheduled next day and again now. Parent added shared validated schema and nested client response dispatch. New `VocabularyReview.tsx` replaces ephemeral reveal-only review: server-due queue, reveal gate, explicit Again/Remembered actions, pending guard, exact-operation replay, retained revealed content on failure, canonical reload recovery and immediate returned schedule projection. Recall records describe self-reported recall; no mastery inference.

Checks rerun:8/8 scoped component tests passed; scoped ESLint passed; TypeScript passed. Four added recall tests cover server-due filtering/reveal gate, lost-response exact key/body/revision replay, saved future schedule on remount, and again retaining due status with meaning hidden. Button switching is disabled while uncertain recall error exists, leaving explicit Retry or Reload recovery. These remain mocked hook tests. Actual backend persistence/schedule/ownership and integrated browser checks remain parent/backend acceptance evidence, not claimed here. No backend/shared files changed by this worker.

## Source-context save checkpoint

Parent requested compact workspace/tutor save UI. Added `SaveWord.tsx` default `{taskId,context}` native details. Opening mounts authenticated vocabulary read lazily once, closing keeps child state mounted so failed operations remain recoverable. Candidate types the word; optional meaning stays empty; editable example starts with at most1000 context characters. Save binds `sourceTaskId`, aggregate revision and exact UUID operation; frozen wire has no content-version input, so none is invented. Parent owns placement below lesson/tutor. Pending/failed/loading controls, retry, saved-version reload and confirmed success are explicit.

Checks:9/9 focused component tests passed, including lazy form presence, source-task/editable-context payload and identical operation retry after lost response. Typecheck and scoped ESLint passed. Actual HTTP and browser integration are still separate parent acceptance work.
