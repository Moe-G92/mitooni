# API contract

Every request the frontend makes, matching the mock handlers in `web/src/mocks/handlers.ts` one to one. Types are the zod schemas in `web/src/api/schemas.ts`. JSON Schema copies are in `docs/handoff/schemas/` (regenerate with `npm run export:schemas`).

All paths are under `/api`. Requests send cookies (`credentials: "include"`). Errors return a non-2xx status with `{ "error": "message" }`. A `401` on `GET /api/me` sends the learner to sign in.

## Auth and profile

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| POST | `/auth/lookup` | `{ email }` or `{ phone }` | `{ exists, name }` | Step 1 of the unified page: decides between "Welcome back" and "Create your account". Rate-limit it, because it tells a caller whether an account exists |
| POST | `/auth/sign-in` | `{ email, password, keep? }` | `Profile` | Sets the session cookie; `keep` means a long-lived session |
| POST | `/auth/otp/send` | `{ phone }` | `{ ok, exists }` | Sends a 6-digit SMS code. Phone may be `09…`, `+989…` or `00989…`, with Persian digits; normalise to `09…` |
| POST | `/auth/otp/verify` | `{ phone, code, name? }` | `Profile` or `{ needsName: true }` | Known number: signs in. New number without `name`: returns `needsName`, then the app sends the same call again with the name |
| POST | `/auth/google` | none in the prototype | `Profile` | Real build: Google OAuth redirect. Google sign-in is often blocked in Iran, so email and mobile stay first-class |
| POST | `/auth/sign-up` | `{ name, email, password }` | `Profile` | New profiles have `onboarded: false`, so the app opens onboarding |
| POST | `/auth/sign-out` | none | `{ ok }` | |
| POST | `/auth/forgot` | `{ email }` | `{ ok }` | Always succeeds, so it never reveals which emails exist |
| GET | `/me` | none | `Profile` | `401` when signed out |
| PATCH | `/me` | `Partial<Profile>` | `Profile` | `targets` is merged, not replaced. Onboarding sends `onboarded: true` |

## Learner pages

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/dashboard` | `Dashboard` | Computed from results; see `web/src/mocks/derive.ts` for every rule |
| GET | `/progress` | `Progress` | |
| GET | `/practice` | `PracticeCatalog` | Sets per skill and question type, with the learner's accuracy |

## Tests and attempts

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/tests?kind=full\|section\|practice` | none | `TestSummary[]` | |
| GET | `/tests/:id` | none | `Test` | **Must not include answer keys, explanations, traps or evidence.** The mock replaces `answer` with `["hidden"]` |
| GET | `/attempts?status=in-progress\|submitted` | none | `Attempt[]` | Newest first |
| POST | `/attempts` | `{ testId, mode: "exam"\|"practice" }` | `Attempt` (201) | Copies the learner's `accommodation` and sets each section's `remainingSec` |
| GET | `/attempts/:id` | none | `Attempt` | Used to resume after a reload |
| DELETE | `/attempts/:id` | none | `{ ok }` | Discard an unfinished attempt |
| PATCH | `/attempts/:id/state` | `SectionPatch` | `{ ok, savedAt }` | Autosave, about every 0.4 s while answering and every 10 s for the clock. Any subset of one section's state. The first patch sets `status: "in-progress"` and `startedAt`. Ignored for submitted sections |
| POST | `/attempts/:id/check` | `{ itemId, value }` | `CheckResult` | Practice mode only, `403` in exam mode |
| POST | `/attempts/:id/sections/:sectionId/submit` | none | `{ attempt, resultReady }` | Moves to the next section. When the last section is submitted, scores the attempt, stores the `Result`, adds a notification and returns `resultReady: true` |
| POST | `/attempts/:id/speaking/:partId/recording` | multipart: `audio` (webm or mp4), `durationSec` | `{ key, durationSec }` | One file per Speaking part |
| GET | `/recordings/:key` | none | audio bytes | For playback on the feedback page |

### Timing

The client clock is for display. The server should own the limit: store when each section started and refuse answers after `start + duration × accommodation + grace`. The client already auto-submits at zero in exam mode, and in practice mode it lets the learner continue.

### Scoring

- Listening and Reading: one mark per question; "Choose TWO" items give one mark per correct letter. Gap answers match any accepted variant, ignoring case, extra spaces, curly apostrophes and a trailing full stop (`normaliseAnswer` in `web/src/lib/utils.ts`). Raw score to band uses the tables in `web/src/lib/bands.ts`; practice sets shorter than 40 are scaled.
- Writing: Task 2 counts twice as much as Task 1. Overall: the mean of the four skills, with .25 rounding up to .5 and .75 up to the next band.
- Writing and Speaking feedback in the prototype comes from fixtures and has `dummy: true`. The real marking service fills the same `WritingFeedback` and `SpeakingFeedback` shapes.
- Score breakdown (added 29 Oct 2026, all optional so older results still parse): each `Criterion` can carry `metrics` (sub-skills such as Pace, Pausing and Hesitations, each with a 0–100 `score`, a `verdict` of `needs-work` / `acceptable` / `good` / `strong`, a `note` and an optional `example` quoted from the learner's text) and `tips` (most useful first). Each Speaking part can carry its own `band`. The client works out "what raising this criterion by one band is worth" to the skill and overall band itself (`web/src/lib/breakdown.ts`), so the backend does not send that.

## Results

| Method | Path | Returns |
|---|---|---|
| GET | `/results` | `ResultSummary[]`, newest first |
| GET | `/results/:attemptId` | `Result` with every item, explanation and feedback |

## Vocabulary

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/vocab` | none | `VocabCard[]` | |
| GET | `/vocab/summary` | none | `VocabSummary` | |
| GET | `/vocab/due` | none | `VocabCard[]` | Cards whose `due` is now or earlier |
| POST | `/vocab` | `{ term, partOfSpeech, meaning, example }` | `VocabCard` (201) | `custom: true` |
| DELETE | `/vocab/:id` | none | `{ ok }` | |
| POST | `/vocab/:id/review` | `{ grade: "again"\|"good" }` | `VocabCard` | Again: due in 10 minutes, interval 0. Good: interval 1 day, then × 2.5 |

## Coach

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/coach` | none | `CoachState` | Open slots in the future, bookings, review threads |
| POST | `/coach/bookings` | `{ slotId }` | `Slot` (201) | `409` if the slot was just taken |
| DELETE | `/coach/bookings/:slotId` | none | `{ ok }` | |
| POST | `/coach/reviews` | `{ kind, title, attemptId, message }` | `CoachReview` (201) | |
| POST | `/coach/reviews/:id/messages` | `{ text }` | `CoachReview` | The mock adds a canned coach reply 4 seconds later |

## Notifications

| Method | Path | Returns |
|---|---|---|
| GET | `/notifications` | `Notification[]` |
| POST | `/notifications/read-all` | `{ ok }` |
| POST | `/notifications/:id/read` | `{ ok }` |

## Prototype only

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/dev/reset` | `{ mode: "demo"\|"empty" }` | Rebuilds the in-browser data. Not needed in the real backend |
