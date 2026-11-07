# Learner activity widgets — implementation checkpoint

Owner: learner_widgets, gpt-6.1-sol / medium. Branch codex/ielts-content-20261106; baseline 0a79be2. Instructions: Projects/AGENTS.md, app/AGENTS.md, learner MVP checkpoint and frontend research; frontend skill/app-screen rules read. Scope is new learner/widgets only plus this record. Mo's existing identity governs; no random visual direction.

## Preflight

1. A professional would make keyboard operation, stale-owner microphone cancellation, resource bounds and media revocation explicit before integrating player screens. These are necessary foundations, not an expanded service.
2. Raw evidence: actual Mo exam/practice paths, account Button and review capture/WAV/media source at 0a79be2. No source corpus, learner data, environment files or provider credentials used.
3. Use native controlled inputs/fieldset/select, React ownership guards and object URL cleanup; adapt the already bounded AudioWorklet/PCM16 encoder into learner-owned files. Focused Testing Library keyboard checks and injected capture environments verify behaviors without a real microphone or API call.
4. Independent evidence: native keyboard input changes exact JSON responses; malformed WAV/empty/oversize/timeout/cancelled permission are rejected and close resources; replaced/unmounted media URLs are revoked. Parent integration and independent real browser checks remain required.

## Design

Presentation-only widgets receive candidate projection, controlled response, authorized media Blobs and callbacks. They never fetch or import reviewer APIs, prototype banks, answers or MSW. IELTS content is lang=en/dir=ltr while recording/status chrome follows passed locale. Native matching select replaces pointer-only drag. Parent owns authentication, media validation/fetching, durable draft/save/submit and uploaded recording references.

Reuse: account/review/{capture.ts,wav.ts,recorder.worklet.js} at 0a79be2 copied into learner-owned presentation mechanics to keep candidate graph independent of reviewer endpoints; existing account Button reused. Capture currently shares the reviewed 180-second, PCM16 mono, 8–48 kHz bound; upload validation admits at most 18 MiB and PCM16 mono/stereo 0.25–180 seconds. No BarEx code or data copied.

## Evidence and limits

Implemented: `web/src/account/learner/widgets/{ActivityFields,StimulusBlocks,SpeakingRecorder}.tsx`, exported types/index, learner-owned capture/WAV/worklet and focused tests. Controlled gap, radio, bounded multi, single/multi-row matching, ordered native selects and essay are supported. Dict values support matching wire responses. English task content stays LTR; passed fa/en selects recorder/media chrome. Parent adapter maps wire question responseType/options text to these generic presentation props; no endpoint schemas duplicated. Feedback stays parent-owned.

Actual checks: `npx vitest run src/account/learner/widgets` passes 12 tests across keyboard JSON edits, duplicate ordering exclusion, owner-change media revocation, SVG MIME rejection, permission denial and late permission cleanup; capture checks actual worklet tail ACK/channel mixing/frame bounds, PCM16 bytes, bad/trailing/truncated WAV, flush timeout, cancellation and failed processor cleanup. `npx eslint src/account/learner/widgets --max-warnings=0` passes. Final `npm run typecheck` passes (initial run identified then-concurrent peer errors and one local null narrowing error, subsequently fixed). Boundary text scan finds no reviewer endpoint, fetch, MSW/bank imports or innerHTML.

No live microphone, learner API, provider call or hosted/browser visual validation executed. jsdom synthetic audio tests are engineering evidence, not real recording quality. Parent must clear response/media on owner changes, provide ownerKey to recorder/media and verify authenticated media signatures/hash before passing blobs. PCM16 bounds remain fixed as above; no size/duration authority invented by UI. Stop at implementation checkpoint for coordinator integration and independent browser review. No environment/auth/DB/provider/dependency/deploy changes; no commit made in the shared checkout.
