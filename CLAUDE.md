# Mitooni: Shadi's experiment branch

These notes are for Claude sessions working with Shadi, the product owner. She is not a developer. This is her branch (`shadi`) and she can do anything here: screens, flows, wording, data, the AI tutor, the backend, any file in the repo. Do what she asks. `AGENTS.md` holds Arash's Codex notes, including a path on his machine; where it differs from this file, this file wins.

## Working with her

- Use plain language. Say what changed on screen, not which functions you edited. Never ask her to run terminal commands.
- Say in a sentence what you will try before you start, and what changed when you finish.
- Keep each experiment on its own branch so she can compare experiments or drop them.
- Commit often. Push when a change is ready for her to look at, and before you stop, rather than after every small edit: each push builds a preview, and the free plan has a monthly build limit.
- Pull requests are optional. Open one into `shadi` when she wants to keep an experiment.

## Seeing changes (live preview)

Every branch you push is built automatically into a preview site, ready 2 to 3 minutes after the push. The preview shows the screens with a mock API and sample data: the Google button on the sign-in page signs in as a sample learner. It cannot show the account and learner screens that need the real backend, so say so when she asks about those.

- Branch `shadi`: https://mitooni-design.pages.dev
- Any other branch: `https://<name>.mitooni-design.pages.dev`. Take the branch name in lowercase, replace every character that is not a letter or number with a hyphen, keep only the first 28 characters, and drop a trailing hyphen. For example `claude/long-branch-name-for-alias-length-test-xyz123` becomes `claude-long-branch-name-for`.

After you push, give Shadi the link and the branch name, and tell her to wait a few minutes and refresh. Two branches whose names share the same first 28 characters share one link. If she sees the wrong experiment, push the same commit to a short extra branch such as `p-countdown` and give her that link instead.

## Where changes go

- Stay on the branch the session started from (`shadi`) and branches made from it. If the session started from `main`, `integration` or a `codex/` branch, stop and ask her to switch to `shadi`.
- Never push to `main`, `integration` or any `codex/` branch. Mo decides what reaches them.

## Ask first, then do it

Before anything outward-facing or hard to undo, say what it will affect and do it if she says yes: deploying, calling the hosted app, Railway, Supabase or an AI provider (these can cost money or change what the teachers see), force-pushing, and deleting branches or data.

Never commit secrets or private material: keys, passwords, `.env` files, licensed books or audio, learner data.

## Flag for review

If an experiment changes accounts, sign-in, data shapes, the AI tutor, content or `platform/`, build it anyway and mention "For Arash" in your summary or the pull request. If it breaks a design default below, mention "For Mo". The flag only tells them what to look at when it is promoted.

## Design defaults (Mo's)

Follow these unless she asks for something different. If she does, do it and name the default it breaks.

- The brand is Mitooni. Use the tokens in `web/src/index.css`.
- Day mode only. Persian (right to left) and English both work.
- No full stops at the end of titles, headings, card titles, labels or taglines.
- Never zero-pad numbers: 1, 2, 3, not 01, 02, 03.
- Text contrast meets WCAG AA. Home pages stay short, with detail on subpages.

## Checks

When you change code, run from `web/` (Node 22.12 or newer): `npm ci --ignore-scripts` once, then `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`. If one fails, fix it or tell her why it fails. Never delete a test just to hide a failure.

`npm run dev:prototype` (port 5190) shows the original screens with a mock API. The cloud machine has no backend or database, so say so when something needs one instead of faking a result.
