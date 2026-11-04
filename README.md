# Mitooni

A BarEx-based learning platform for IELTS Academic, with Persian as the default interface and an English option. The intended service combines independent study and expert coaching across learner levels and target bands.

The current implementation is the first local foundation port. It is not a learner pilot or a complete port of the platform's services.

## Application

- `platform/frontend/`: the BarEx-derived shell, with an explicit synthetic local preview and a separate production entry that refuses unconfigured access.
- `platform/backend/`: the BarEx-derived FastAPI identity and guarded client foundation. No learner/content/coaching APIs are connected yet.
- `docs/foundation/DECISIONS.md`: current product/architecture decisions, evidence, ownership and next checkpoints.
- `docs/foundation/research/port-manifest.md`: source admission and staged migration plan. Each receiving module also records its source provenance.

Run the local shell from `platform/frontend/`:

```sh
npm ci --ignore-scripts
npm run dev
```

Open the server's `/preview/topics` path. This uses synthetic state and no external services. `npm run build` creates the production entry; `npm run build:preview` creates separate preview output. Never deploy preview output as an authenticated service.

The backend has its own locked environment and commands in `platform/backend/README.md`. Its default `/api/me` refuses access until a receiving configuration is explicitly supplied. Identity verification alone does not grant product membership.

## IELTS reference work

Mo's original `web/` prototype remains intact for selective integration of IELTS interactions and contracts. Its tests use a simulated API. `docs/handoff/`, `docs/mockups/`, `docs/research/` and `docs/ui-research.md` describe that reference revision; current foundation decisions supersede conflicting implementation assumptions. The market plan is research input, not approved claims or provider arrangements.

The supplied books, audio and descriptors stay outside this checkout. Original Mitooni packs will retain source/edition/territory lineage and IELTS teacher/examiner review. BarEx's licensed legal materials, learner data and credentials do not belong in this repository.
