# IELTS Academic simulator, UI research and recommendation

Date: 26 October 2026. Scope: frontend shell only (React, TypeScript, Tailwind, shadcn/ui). Backend and data by Arash later.

Full research notes with every source URL are in `docs/research/`:

- `research-official-ielts.md` : the real IELTS on computer interface (measured from the official Inspera demo)
- `research-ielts-platforms.md` : 12 existing IELTS prep platforms
- `research-exam-simulators.md` : Bluebook, LawHub, UWorld, Duolingo English Test, TOEFL, GMAT, PTE, Khan, Brilliant and others
- `research-ui-references.md` : the four 21st.dev references and dashboard, theme, type and accessibility guidance

## 1. The answer in short

The platform needs two different UIs living in one product, and they must not look alike.

1. **Exam shell**: a faithful clone of the official IELTS on computer interface (Inspera). White, Arial-like sans at 16px, passage left and questions right, timer top centre, Part tabs and a numbered question navigator along the bottom. No app navigation, no brand colour, no animation. Fidelity is the whole value of a simulator, and the candidates on every platform we looked at praise exactly this and complain when it is missing.
2. **Learning dashboard**: a calm, theme aware (light and dark) bento overview built on the structure of the Analytics Bento reference, with charts drawn by shadcn/ui charts on Recharts so Arash can bind real data. Headline tile is the predicted band as a range against the target band. Supporting tiles are band per skill, accuracy by question type, time per question, and one "do this next" action.

Between them sit two explicit transitions: a full screen "Start section" interstitial with the rules, and an end of section review screen that leads to a results page in the dashboard look.

Of the four references you sent, use Analytics Bento as the dashboard base, Content Block for the public site and onboarding, Finance Bento only as art direction, and do not adopt the swapy draggable grid.

## 2. What the real test looks like

Measured on 26 October 2026 from the official familiarisation tests at demo-ielts.inspera.com (same build as the live test). These are the facts the exam shell must reproduce.

| Element | Official value |
|---|---|
| Page, header, footer | white `#FFFFFF`, Arial 16px, text `#000000` |
| Header (56px) | red IELTS logo left, "Test taker ID" or candidate name, right icons: connection, messages, options, show notes; countdown clock top centre in the live test |
| Part rubric banner | background `#F1F2EC`, border `#D5D5D5`, "Part 1" bold then the instruction line |
| Footer navigator (54px) | Part tabs; current part expanded into numbered buttons, other parts collapsed to "Part 2  0 of 13" |
| Question button | 21 by 27px, radius 3, text `#333333`; active = 2px `#418FC6` outline; answered = 3px green `#358E14` bar above the number; grouped items shown as "18–19" |
| Previous and Next | 56px squares, Previous grey `#DDDDDD`, Next black `#000000`, white arrows |
| Finish | tick button `#EFEFEF`, aria label "Review your answers", leads to the submission page |
| Options menu | red "Go to submission page", Contrast (black on white, white on black, yellow on black), Text size (regular, large, extra large) |
| Reading layout | passage left, questions right, independent scrollbars, draggable 2px divider with a 36px handle |
| Highlight and notes | select text, popover "Note / Highlight"; notes live in a 300px right sidebar |
| Answer widgets | radios for TFNG and multiple choice (selected row light blue `#CFE0F3`), checkboxes for "Choose TWO", drag and drop chips into dashed boxes for matching headings, inline text inputs 144px wide with the question number as placeholder |
| Listening | single column, pre audio modal with headphones icon and "To continue, click Play", then "Audio is Playing" in the header, no player controls, 4 parts of 10 |
| Writing | Part 1 and Part 2 tabs, prompt left, plain textarea right with no spellcheck, "Words: N" right aligned under the box |
| Timer behaviour | minutes only, flashes at 10 and 5 minutes left, locks at zero and auto submits; 2 minutes to check Listening answers at the end |

Test structure the UI must carry: Listening 4 parts, 40 questions, about 32 minutes. Reading 3 passages, 40 questions, 60 minutes, 14 official question types. Writing Task 1 at least 150 words in about 20 minutes, Task 2 at least 250 words in about 40 minutes, four criteria each. Speaking 3 parts, 11 to 14 minutes, four criteria. Bands 0 to 9 in half steps, with raw to band tables for Listening and Reading in the notes.

Candidate complaints to respect in exam mode and optionally relieve in practice mode: losing your place when scrolling, small default text, clunky highlighting, hidden notes, no audio pause, no spellcheck, surprise auto submit, mis clicks on drag targets.

## 3. What existing IELTS platforms do

Twelve platforms were reviewed: IELTS Online Tests, E2 Test Prep, Magoosh, IELTS Ready (British Council), Road to IELTS, IELTS by IDP, Cambridge One, TestGlider, ieltstestsimulation, GlobalExam, Leap Scholar and recent AI scoring apps.

Common patterns

- A Practice mode (untimed, answers visible) and a Test mode (timed, submit at end) on every test.
- Results as score out of 40, converted band, per question answer key, highlighted transcript for Listening.
- Timed and untimed toggles, section tests and full tests, question type practice as a separate section.
- Writing and Speaking feedback structured by the four official criteria.

Gaps nobody fills well

- Nobody tracks band or accuracy per question type across attempts. Every review says so.
- Most test screens are "functional rather than exam realistic". The two sites that clone the official look (ieltstestsimulation, IELTS Ready) are the ones users praise for CBT preparation.
- Results pages stop at right or wrong. Explanations are missing or paywalled.
- Ads, banners and booking flows mixed into the study area.
- Dated portal visuals (dense grids, thumbnails, zero padded step numbers, small type).

What users value most: realism of the mock, a trusted band conversion, clear feedback on why an answer is wrong, and seeing progress toward their target band. Nobody offers dark mode inside the test screen.

The five best ideas worth copying

1. Practice or Exam toggle on every test, with Exam mode as a faithful clone of the official interface.
2. Band shown as a range on a 0 to 9 gauge, with each question type labelled Weakness, Fair or Strength and one "Focus here" action.
3. Review cards named after the trap (paraphrase miss, distractor, word limit) with the quoted passage evidence and a highlighted transcript.
4. A calibration note beside every AI band ("we grade about half a band more conservatively than the real test").
5. Today's tasks plus coverage bars per skill, so learners see what they have not touched.

## 4. What best in class simulators do

The ten most reusable patterns and who does each best.

1. Hide able timer that forces itself back at 5 minutes (Bluebook), per section timers with their own final warning.
2. Numbered navigator with shape plus colour states, not colour alone, segmented by part or passage (LawHub 2026, Cambridge).
3. Mandatory end of section review screen with jump back and a statement of what can still be changed (GMAT).
4. Highlight and note popover, each colour paired with a distinct underline style, plus answer eliminator and reset (LawHub).
5. Split pane reading with independent scrolling and in passage search (LawHub).
6. Bare exam lock shell: header with timer and tools, footer with navigator, nothing else, Enter and Escape mapped, display settings changeable mid test (Bluebook, Exxat pattern).
7. Per question review: your answer vs correct, percent of users per option, your time vs average, full explanation, clip to notebook, "explain more" AI panel (UWorld).
8. Score report layered as results, meaning, next step: band as a range (Duolingo English Test), pacing by section quarter (GMAT), a private skills profile with rows of icon, bar and expandable advice (PTE), one "practice this next" button so the page is never a dead end.
9. Analytics: stacked correct, incorrect, omitted bar; answer changes table; trend by date and by mock; sortable question type table with one click drill; pace tracker to exam date (UWorld); skill grid with four named mastery levels (Khan Academy).
10. Study loop: short survey to an auto study plan to exam date (TOEFL TestReady), minimal daily unit with grace mechanisms if a streak exists at all, spaced repetition vocabulary with a due count (Anki, Achievable).

The visual rule that all of them share: exam mode is near monochrome with status colour only in the navigator; study mode is colourful with cards and charts; the switch between them is explicit.

## 5. Verdict on the four references

| Reference | What it is | Theme | Use for |
|---|---|---|---|
| Finance Bento (Vasnev) | fixed black bento, lime accent, dot matrix number, charts drawn imperatively in effects, `@ts-nocheck` | dark only | art direction only: grid rhythm, count up band number, mono numerals |
| Analytics Bento (Vasnev) | four token based cards (`bg-card`, `rounded-[28px]`), segmented control, line, wave, treemap, radar | light and dark | dashboard base: keep the card shell, grid and segmented control, redraw charts with shadcn/ui charts |
| Draggable grid (swapy) | drag to swap widget grid | widgets hard coded colours | do not adopt: GPL 3 with paid commercial licence, no release since January 2025, no keyboard path (WCAG 2.5.7), learners rarely rearrange dashboards |
| Content Block (Tailark) | editorial features section with hairline dividers | light and dark | public site, onboarding "how the simulator works", empty states |

Why redraw the charts: the Vasnev bentos build SVG with DOM mutation inside `useEffect`, so data is not a prop, there are no tooltip, legend or axis primitives, no empty or loading states, and reduced motion is hand coded. shadcn/ui charts on Recharts v3 give all of that with `--chart-1` to `--chart-5` tokens, a `.dark` override and an `accessibilityLayer` prop. Keep one bespoke declarative SVG component for the band number or gauge.

## 6. Recommended UI

### Two modes

| | Exam shell | Dashboard and practice |
|---|---|---|
| Route group | `ExamLayout`, no app shell | `AppLayout` with sidebar |
| Theme | light locked, plus the official accommodations (white on black, yellow on black, three text sizes) | follows OS, manual override, WCAG AA in both |
| Type | Inter or Geist at 16 to 17px for fidelity, Geist Mono for the timer | Geist for UI, Geist Mono for tabular band numbers, Literata or Source Serif 4 for passages in review mode |
| Colour | white, black, `#418FC6` active, `#358E14` answered, one red for submit | neutral surfaces, one brand accent, chart tokens only in charts |
| Motion | none; timer warning as colour plus text, not flashing, when reduced motion is set | count ups and card entrances, all behind `motion-reduce` |
| Chrome | header (part, timer, options, notes), footer (navigator, prev, next, finish) | sidebar, top bar, bento grid |

### Page map

- Public: landing (Content Block sections), pricing, sign in.
- Onboarding: target band, exam date, variant lock (Academic only in this product), 5 question survey to a study plan.
- Home (overview): hero tile predicted band range vs target, band per skill radar, question type accuracy treemap or bar list, time per question, next mock, one recommended drill.
- Practice: by skill, then by question type, Practice mode (untimed, check answers, audio replay allowed with a "not in the real test" note) or Test mode.
- Mock exams: full Academic mock (Listening, Reading, Writing back to back, 2 hours 40), section mocks, Speaking simulator with per part timers and recording.
- Exam shell: start interstitial, section screens, end of section review, submission.
- Results: layered report (band range, meaning, next step), per question review with explanation panel, Writing feedback by criterion with highlighted sentences, Speaking transcript with exemplar.
- Progress: trend by mock, question type table with "drill this", pace to exam date, vocabulary due count.
- Settings: accommodations (time multiplier recorded on results), display, account.

### Components to build first

1. Exam header with timer (hide until 5 minutes, warnings at 10 and 5).
2. Question navigator with part tabs and four states (not visited, unanswered, answered, flagged, plus current), keyboard operable.
3. Split pane with draggable divider and independent scroll.
4. Answer widgets: radio group, checkbox group, inline gap input, dropdown, drag and drop with a select then place alternative.
5. Highlight and note popover with notes sidebar.
6. Listening audio gate (headphones modal, play once, status line).
7. Writing editor with live word count and no spellcheck.
8. Start interstitial and end of section review screen.
9. Band range tile, skill radar, question type bar list, trend line (shadcn/ui charts).
10. Per question review card with explanation panel.

### Data the shell will need from Arash

Test packages (sections, parts, passages, items with type, options and answer keys), attempt state with autosave per answer, timing and accommodation per attempt, scoring (raw, band, per question type), Writing and Speaking feedback by criterion, study plan and recommendation records. Design the frontend with typed mock fixtures in these shapes so the API contract is already drawn when Arash starts.

## 7. What to avoid

- A dark, acid accent dashboard as the default. Positive polarity reads better for long text and the real test is white.
- Any brand colour, toast, animation or navigation inside the exam shell.
- Colour only status in the navigator.
- Streaks or minutes studied as headline metrics. Khan Academy removed streaks; Duolingo users quit when they break them.
- Drag only interactions without a single pointer alternative.
- Results pages that end at right or wrong.
- Zero padded step numbers, full stops in titles, uppercase tracked labels.
- Mixing booking, ads or marketing into the study area.
