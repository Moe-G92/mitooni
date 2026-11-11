# Mitooni: Shadi's experiment branch

These instructions are for Claude sessions working with Shadi, the product owner. She is not a developer. This is her branch (`shadi`), and she can try anything here. Nothing reaches `main`, `integration` or the hosted app unless Mo reviews and merges it. Ignore `AGENTS.md`: it is Arash's Codex workflow and points at paths on his machine.

## How to work with Shadi

- Talk in plain language. Say what changed on screen, not which functions you edited. Never ask her to run terminal commands.
- Before you change anything, say in one or two sentences what you will try. Afterwards, list what changed and how she can check it.
- Experiments are welcome and may touch any file in the repo: screens, flows, wording, data shapes, even the backend. Prefer the smallest change that answers her question. Keep each experiment on its own branch so she can compare experiments or drop them.
- Commit small and often, and push after every meaningful change so nothing is lost when the session pauses.
- Open pull requests into `shadi`, never into `main` or `integration`. If the Create PR button would target another branch, tell Shadi to change the base to `shadi` on GitHub before she confirms. Say in the description what the experiment tries and what it would affect if kept.

## Branch rules

- Work only on the branch your session started from (`shadi`) and branches made from it. If the session started from `main`, `integration` or a `codex/` branch, stop and tell Shadi to switch the branch to `shadi`.
- Never push to `main`, `integration` or any `codex/` branch. Never force-push, and never delete a branch you did not create in this session.

## Other hard limits

- Never read or create `.env` files and never handle keys or passwords.
- Never deploy, and never call Railway, Supabase, the hosted app or any AI provider. The cloud machine has no backend or database, so anything that needs one cannot be tested here. Say so instead of faking a result.
- Never copy licensed books, audio or learner data into the repo.

## Flag, don't hold back

An experiment that goes beyond design should still be built. Mention it in the pull request description so the right person can decide when it is promoted:

- "For Arash" if it changes data shapes, accounts, sign-in, the AI tutor, content or anything under `platform/`.
- "For Mo" if it breaks one of the design defaults below.

## Design defaults (Mo's)

Follow these unless Shadi asks for something different. If she does, do it and name the rule it breaks.

- The brand is Mitooni. Use the tokens in `web/src/index.css` rather than new colours.
- Day mode only. No dark styles and no theme toggle.
- Persian (right to left) and English both work. Use logical CSS (start and end, not left and right). Keep the default language as it is.
- No full stops at the end of titles, headings, card titles, labels or taglines. Body sentences keep theirs.
- Never zero-pad numbers: 1, 2, 3, not 01, 02, 03.
- Text contrast meets WCAG AA. Exam screens stay faithful to the official IELTS look (`docs/research/research-official-ielts.md`).
- Home pages are short and promotional, with detail on subpages. No decorative elements that move behind body text.

## Checks before every push

Run from `web/`. Node 22.12 or newer is required.

1. `npm ci --ignore-scripts` (once per session)
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run build`

These should pass. If an experiment intentionally breaks a test, say which test and why. Never delete or weaken a test just to make it pass.

`npm run dev:prototype` (port 5190) shows the original screens with a mock API. The account and learner screens need a backend that is not available here, so check those with the steps above and tell Shadi you could not see them running.

## If something is unclear

Ask Shadi one short question. Decisions about data, accounts, AI behaviour, content or deployment belong to Arash or Mo, so flag them as above.
