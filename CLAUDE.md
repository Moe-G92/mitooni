# Mitooni design workspace

These instructions are for Claude sessions working with Shadi, the product owner. She is not a developer. Follow this file. Ignore `AGENTS.md`: it is Arash's Codex workflow and points at paths on his machine.

## How to work with Shadi

- Talk in plain language. Say what changed on screen, not which functions you edited. Never ask her to run terminal commands.
- Before you change anything, say in one or two sentences what you will change and on which screens. Afterwards, list what changed and how she can check it.
- Commit small and often, and push your branch after every meaningful change so nothing is lost if the session pauses.
- Work on your session's own branch and open the pull request against `integration`. Never push to `main`, `integration` or any `codex/` branch directly.

## What you may change (the design layer)

- `web/src/components/`, `web/src/pages/`, `web/src/layouts/`, `web/src/exam/`, `web/src/practice/`, `web/src/index.css` and `web/public/` (images, fonts, icons).
- Visible wording in `web/src/i18n/`, `web/src/account/messages.json` and `web/src/account/study/messages.ts`. Change wording only: never rename or remove a key. A new string needs both English and Persian.
- The `.tsx` screens under `web/src/account/` (including `learner/`): layout, spacing, colour, typography and wording only. Do not change state, data loading, hooks, routing, audio handling or anything sent to the server. Arash must review every pull request that touches this folder, so say so at the top of the pull request description.

## What you must not touch

If a request needs any of this, stop, explain why in plain words, and write it in the pull request description under "For Arash" or "For Mo". Do not guess.

- `platform/`, `content/`, `docs/foundation/`, `tools/`, `scripts/`
- `web/src/auth/`, `web/src/api/`, `web/src/mocks/`, `web/src/preview/`, `web/src/main.tsx`, `web/src/lib/prefs.ts`
- In `web/src/account/`: every `.ts` and `.js` file except the two wording files above, plus `mount.tsx`, `state.tsx`, `Boundary.tsx`, `Capability.tsx`, and everything inside `review/` (internal teacher tool)
- Build and config: `package.json`, lockfiles, `vite*.config.ts`, `tsconfig*`, ESLint and Playwright config, `web/*.html`, `web/scripts/`, `.claude/`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`
- Do not add or upgrade dependencies.
- Never read or create `.env` files and never handle keys or passwords. Never deploy, never call Railway, Supabase or any AI provider, and never open the hosted app.

## Design rules (Mo's)

- The brand is Mitooni. Use the tokens in `web/src/index.css`; do not invent new colours.
- Day mode only. No dark styles and no theme toggle.
- Persian (right to left) and English must both work. Check the layout both ways and use logical CSS (start and end, not left and right). Do not change the default language.
- No full stops at the end of titles, headings, card titles, labels or taglines. Body sentences keep theirs.
- Never zero-pad numbers: 1, 2, 3, not 01, 02, 03.
- Text contrast must meet WCAG AA. Keep the exam screens faithful to the official IELTS look (`docs/research/research-official-ielts.md`).
- Keep home pages short and promotional, with detail on subpages. No decorative elements that move behind body text.

## Checks before every push

Run from `web/`. Node 22.12 or newer is required.

1. `npm ci --ignore-scripts` (once per session)
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run build`

All four checks must pass. Never skip, weaken or delete a test to make it pass; fix your change instead.

`npm run dev:prototype` (port 5190) shows Mo's original screens with a mock API. The account and learner screens need a backend that is not available here, so check those with the steps above and tell Shadi that you could not see them running.

## If something is unclear

Ask Shadi one short question. If the answer is a decision about data, accounts, AI behaviour, content or deployment, it belongs to Arash or Mo, not to you.
