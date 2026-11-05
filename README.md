# Mitooni

A learning platform for IELTS Academic using Mo's UI/UX and brand, with missing capabilities adapted from BarEx. Persian is the default interface with an English option. An AI tutor delivers the teacher-designed learning sequence, with expert coaching available alongside it, across learner levels and target bands.

The current local integration adds accounts, a durable study workspace, a server-controlled planner and an AI tutor adapter beneath Mo's interface. Reading and Writing fixtures exercise the full learning flow; they are engineering examples, not an approved curriculum or evidence of all-level coverage. Current authority, verification and remaining work are in `docs/foundation/CHECKPOINT-TUTOR-2026-11-05.md`.

## Application

- `web/`: Mo's interface and the active frontend integration, with explicit prototype and configured-account modes.
- `platform/frontend/`: the earlier BarEx-derived shell retained as historical/reuse evidence, not Mitooni's visual direction.
- `platform/backend/`: the BarEx-derived FastAPI foundation, account and study persistence, scoped tutor tools, durable turn execution and explicit provider composition. Local review uses synthetic authentication and tutor responses with real PostgreSQL storage.
- `docs/foundation/CHECKPOINT-TUTOR-2026-11-05.md`: current authority, ownership and checkpoint. `CHECKPOINT-2026-11-05.md` records the earlier account foundation; `DECISIONS.md` retains prior decisions.
- `docs/foundation/research/port-manifest.md`: source admission and staged migration plan. Each receiving module also records its source provenance.

Use Node 22.12 or newer. From `web/`:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run lint
npm test
npm run build
npm run dev:account-local
```

The account and study preview is at `http://127.0.0.1:5191/sign-in`. Start its isolated local API/database first using [the local backend instructions](platform/backend/local/README.md). It uses synthetic identities with real local HTTP and PostgreSQL persistence. Authentication itself is a fixture, not a live provider check. The local accounts are `a@example.invalid` and `b@example.invalid`, with password `local-preview`; these selectors are not real credentials. Sessions are deliberately memory-only, so reload requires sign-in and then retrieves saved work.

From Today or Practice, open a learning step, save or submit work, request tutor help, review feedback and explicitly accept a proposed next step. Independent attempts keep tutor help unavailable until the learner switches to supported work or reaches permitted post-submission review. Previous submissions and feedback remain attributable when a new revision is created. Navigation and reload do not generate tutor responses automatically.

`npm run dev` serves the configured entry on port 5192. Missing configuration shows an unavailable state and does not activate mocks. Explicit public configuration variables are `VITE_MITOONI_AUTH_URL`, `VITE_MITOONI_AUTH_PUBLISHABLE_KEY` and optional `VITE_MITOONI_API_BASE`; no source credentials or environment files are imported. [Receiving deployment preparation](platform/backend/deployment/README.md) describes explicit server composition. Hosted identity, enrollment, database and provider behavior still require validation.

`npm run dev:prototype` serves Mo's original simulated learning prototype separately on port 5190. `npm run build:prototype` creates separate prototype output. The production build excludes the mock worker, sample authentication and canned learning results. Never deploy a local or prototype artifact as an authenticated service.

The earlier `platform/frontend/` shell remains available for reuse inspection with its own commands and `/preview/topics` route. It is historical evidence, not the active Mitooni frontend.

The backend has its own locked environment and commands in `platform/backend/README.md`. It supports Python >=3.11,<3.14; Python 3.13.11 was exercised for this checkpoint, while 3.11/3.12 have dependency-resolution evidence only. Its default `/api/me` refuses access until a receiving configuration is explicitly supplied. Identity verification alone does not grant product membership. The actual Agents SDK adapter is tested with a local mock transport; no paid model call or live teaching-quality validation is implied by the local preview.

## IELTS reference work

Mo's `web/` is the UI/UX and brand authority. Its original prototype uses a simulated API and remains explicit during integration. `docs/handoff/`, `docs/mockups/`, `docs/research/` and `docs/ui-research.md` describe the original revision; current account contracts supersede unsafe mock implementation assumptions without replacing the design. The market plan is research input, not approved claims or provider arrangements.

The supplied books, audio and descriptors stay outside this checkout. Original Mitooni packs will retain source/edition/territory lineage and IELTS teacher/examiner review. BarEx's licensed legal materials, learner data and credentials do not belong in this repository.

The current human review brief is [Mitooni learning proposal](docs/foundation/briefs/Mitooni-learning-proposal-2026-11-05.docx). It proposes an AI-delivered objective/skill sequence with alternative entry paths, all-level support/challenge variants and separate learning, assessment and service modes. Research and independent review are recorded under `docs/foundation/research/`; this is a curriculum proposal, not evidence of learning efficacy or calibrated band scoring.
