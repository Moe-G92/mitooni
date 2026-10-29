# IELTS Academic simulator: frontend prototype

For Arash and the product team. This is the full learner-facing frontend with dummy data. Every button works. No backend exists yet: a mock API runs inside the browser and answers the same requests the real backend will.

## Run it

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173 and sign in with any email and password. The demo learner, Sara Rahimi, has four past mocks, so every page has data. Settings has "Reset demo data" and "Start with no history" to see empty states.

Node 20.19 or newer is needed. `web/.npmrc` sets `legacy-peer-deps`, which works around an npm crash with vitest's optional peer dependencies.

## What is in it

| Area | Routes | Notes |
|---|---|---|
| Public site | `/`, `/how-it-works`, `/coaching` | Short home page, details on subpages, no prices |
| Auth and onboarding | `/sign-in` and `/sign-up` (one identifier-first page: email or mobile, then password, new account or SMS code), `/forgot-password`, `/onboarding` | Target bands, test date, study hours, level, language, theme |
| Dashboard | `/app` | The approved mockup, computed from results |
| Practice | `/app/practice` | Sets by skill and question type, in Practice mode or timed Test mode |
| Mock exams | `/app/mocks` | Full mock, section mocks, scheduling, resume and discard |
| Exam shell | `/exam/new/:testId`, `/exam/:attemptId` | Listening, Reading, Writing and Speaking. Light, English, left to right, always |
| Results | `/app/results`, `/app/results/:id` and the Writing and Speaking feedback pages | Layered report, answer review with explanations, essay notes, recordings |
| Progress | `/app/progress` | Trends, every question type, pace to test day, study calendar |
| Vocabulary | `/app/vocabulary`, `/app/vocabulary/review` | Spaced repetition with Again and Good |
| Coach | `/app/coach` | Coach tier: calls, review requests, message threads |
| Settings | `/app/settings` | Profile, targets, extra time, language, theme, Review box, notifications |

English is the default language and Persian is the second, switched from the top bar. Persian uses Vazirmatn (the `@fontsource-variable/vazirmatn` package), self-hosted with the build. B Nazanin was tried first and dropped: it ignores the zero-width non-joiner, so words such as «صفحه‌ها» rendered joined and looked misspelled. Persian text never gets letter-spacing or uppercase, uses line height about 1.8 and Persian digits. The public pages use Archivo and Gabarito, from the reasonal.co teardown in `docs/research/2026-10-29-reasonal-teardown.md`. Nothing loads from a third-party CDN, so the app works where Google services are blocked.

## The exam shell

The four sections copy the official computer-delivered IELTS (the Inspera player). Measured colours, sizes and behaviour are in `docs/research/research-official-ielts.md`, and the approved mockup is `docs/mockups/exam-shell.html`.

- Header: IELTS mark, candidate name, clock top centre with warnings at 10 and 5 minutes, connection, messages, Options and notes icons.
- Footer: Part tabs, question buttons (green bar when answered, blue outline for the current one), Previous, Next, and the tick that opens the submission page.
- Options: Go to submission page, Contrast (black on white, white on black, yellow on black) and Text size, as in the real test.
- Reading and Writing: passage or prompt on the left, questions or the answer box on the right, with a draggable divider. Select text to highlight it or add a note.
- Listening: a headphones notice, then the recording plays once with "Audio is Playing" in the header, and 2 minutes to check at the end.
- Speaking: an IELTS Online style video call with an examiner tile, the candidate's camera, a Part 2 cue card with 1 minute to prepare and 2 minutes to talk. Each part is recorded. The examiner moves on after the candidate stops talking.
- Every answer autosaves. A reload resumes at the same question with the same time left.

Additions that are not in the official demo, and are labelled in the app:

- A "Review" box to mark questions, which can be switched off in Settings.
- Practice mode: Check answers, pause and rewind audio, no time limit, examiner captions.
- "Leave test, progress is saved" in Options, so testers are never trapped.

## Moving to the real backend

1. Build the endpoints in `docs/handoff/api.md`. The shapes are `web/src/api/schemas.ts`, with JSON Schema copies in `docs/handoff/schemas/`.
2. Run the frontend against it:
   ```bash
   VITE_USE_MOCKS=false API_TARGET=http://localhost:8000 npm run dev
   ```
   `API_TARGET` proxies `/api` to the backend in development. No screen code changes.
3. `web/src/mocks/` can then be deleted. It is the reference implementation of every rule: scoring in `scoring.ts`, dashboard maths in `derive.ts`, seeding in `seed.ts`.

Things the backend must get right:

- `GET /api/tests/:id` must never return answers, explanations or evidence. Practice mode asks for them one item at a time through `POST /api/attempts/:id/check`.
- The server owns time limits. The client clock is for display.
- `accommodation` (extra time) is copied onto each attempt and shown on its result.

## Content

All test content is original and lives in `web/src/mocks/fixtures/academic-1/`: one full Academic test with all 14 Reading and 10 Listening question types, two Writing tasks, three Speaking parts, answer keys, and explanations in English and Persian. Practice sets are cut from the same groups.

Content rules (see `ContentBlock` in `schemas.ts`):

- `**bold**` for bold words, `{{12}}` for the answer box of question 12.
- Figures (map, diagram, Task 1 chart) are SVG files in `web/public/figures/`, drawn only in `currentColor` so they follow the contrast setting. `npm run figures` rebuilds them.
- Placeholder audio is generated by `npm run audio` with Kokoro, an open-weight text-to-speech model (Apache 2.0) that runs locally. It has British and American voices only. The first run downloads the model, about 90 MB.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with the mock API |
| `npm test` | Unit and component tests (Vitest) |
| `npm run e2e` | End-to-end tests in headless Chrome (Playwright) |
| `npm run lint` | ESLint, no warnings allowed |
| `npm run build` | Type check and production build |
| `npm run audio` | Regenerate the Listening and examiner audio |
| `npm run figures` | Regenerate the exam figures |
| `npm run export:schemas` | Write the JSON Schemas to `docs/handoff/schemas/` |

The end-to-end Speaking test replaces the camera and microphone with a synthetic stream (see `e2e/helpers.ts`), because automated browsers on macOS cannot open real devices.

## Open items for the product team

- **Product name.** "Bandwidth" is a placeholder in `web/src/config/brand.ts`.
- **Persian copy.** Written for the prototype; it needs a native review before launch.
- **Audio.** Kokoro placeholders, British and American only. The real test also uses Australian and other accents, so real recordings are needed.
- **Writing and Speaking marking.** The feedback is sample data marked `dummy`.
- **The IELTS mark in the exam header.** It copies the real screen. Check trademark use before launch.
- **Payments and the coach plan.** "Add coach support" switches the plan with no payment step.
- **Recordings.** In the prototype they stay in the browser (IndexedDB). The backend stores them.
