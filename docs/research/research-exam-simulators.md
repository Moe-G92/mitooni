# UI/UX research: digital exam simulators and test-prep platforms (non-IELTS)

Purpose: extract transferable UI patterns for a new IELTS Academic simulator web app.
Date: 2026-10-26. Sources are linked inline; claims without a URL are from product knowledge and are marked (unverified).

## 1. College Board Bluebook (digital SAT / PSAT / AP)

Sources: https://bluebook.collegeboard.org/students/tools , https://satsuite.collegeboard.org/psat-nmsqt-student-guide/test-taking-information/introducing-bluebook , https://www.applerouth.com/blog/cracking-the-digital-sat-bluebook-tips-tools-and-strategies-for-success , https://www.edisonos.com/digital-sat/digital-sat-test-interface

Test shell
- Timer: centred at the top of the screen, shows time remaining for the current module. Can be hidden ("Hide") until 5 minutes remain, then it reappears with an alert and can no longer be hidden. (Official: "You can hide it until 5 minutes remain, then you'll get an alert.")
- Mark for Review: bookmark icon beside the question number; flagged state is mirrored in the question menu.
- Question Menu (navigator): bottom-centre pill button "Question N of M" opens a popover grid of all question numbers; legend shows Current / Unanswered / For Review. Official wording: "See which questions you skipped or marked for review and navigate to any question in the section."
- Highlights & Notes (annotate): select passage text, choose a highlight colour, optionally attach a note; only in Reading & Writing, not Math.
- Option Eliminator ("ABC" toggle): once on, each answer choice gets a small strike-through button; reversible.
- Calculator: Desmos graphing calculator in a draggable, resizable floating panel (Math only).
- Reference sheet: formula sheet opens as a floating panel on all Math modules.
- Line Reader: a masking tool to focus on one line of text.
- Zoom: keyboard shortcut / pinch zoom, no in-app font slider for standard testers.
- Layout: Reading & Writing uses a two-pane layout, passage left, question + choices right; Math is single column with the calculator/reference as overlays.
- End-of-module Review page: when the student presses "Next" on the last question (or picks the module name in the navigator), a full-screen review page shows the same numbered grid (answered / unanswered / for review) with "Back" and "Next" so the student can revisit anything before time expires. The module auto-submits when time is up.
- Exam-mode visual language: near-monochrome shell, black top and bottom bars with white text, large white content area, sparse icons with labels, strong focus on the question; no dashboard chrome at all during the test. Preview mode in the app ("Test Preview") lets students try every tool before test day.

Results
- Scores come from College Board's separate "My Practice" web app (not Bluebook): total score and section scores, a per-question review table (your answer, correct answer, difficulty, skill/domain tag, "Review" link to explanation), and a "Knowledge and Skills" bar breakdown with Khan Academy links.

Transferable to IELTS
- Hide-timer-until-5-min is the gold standard for timer anxiety management.
- Numbered grid navigator with three statuses + a mandatory end-of-section review page.
- Annotate/highlight in reading passages with notes attached to highlights.
- Strip the UI bare in exam mode; keep analytics in a separate, richer "practice" app.

## 2. LSAC LawHub (digital LSAT)

Sources: https://www.lsac.org/blog/update-new-lsat-user-interface-2026-2027-testing-cycle , https://www.lsac.org/how-highlighting-works-new-lsat-testing-user-interface , https://www.pastpaperhero.com/resources/lsac-lsat-digital-lsat-interface-lawhub-navigation-features , https://www.kaptest.com/study/lsat/digital-lsat-2019-tips-strategies/

Test shell
- Question bar (navigator) at the bottom: 2026 redesign shows ALL questions in a section at once (previously 10 at a time), with separators marking which question numbers belong to each Reading Comprehension passage; flagged items are shown on the bar for quick navigation (live for Aug 2026+ PrepTests).
- Flag: per-question flag for review; also an answer-eliminator (strike-out) and a "Reset Response" button that clears selections and eliminations in one click.
- Highlighting/underlining: four highlight options, each pairing a colour with a distinct underline style (so it survives in greyscale / colour-blind users); apply via a pop-up on text selection, remove via a pop-up on re-selection; keyboard highlighting from a right-hand menu bar. Covers stimulus, question stem AND answer choices.
- Word search within the passage (since Aug 2023).
- Timer: on-screen, can be shown/hidden; 5-minute warning; display settings allow font size, line spacing, brightness/contrast changes at any time during the test (Kaplan 2019 description of the digital LSAT).
- Split pane: passage on the left, questions on the right, each independently scrollable.
- LSAC's blog explicitly separates "UI changes" from "test format changes" and publishes a changelog, a transparency pattern worth copying for a simulator's release notes.

Transferable to IELTS
- Colour + underline-style pairing for highlights (accessibility by redundancy).
- Passage-segmented navigator bar: IELTS Reading has 3 passages with 13-14 questions each, Listening has 4 parts; show the segment separators.
- Reset Response and answer eliminator as low-cost additions.
- Persistent display settings (font size, line spacing, contrast) changeable mid-test.

## 3. UWorld (USMLE / NCLEX / CPA / MCAT QBanks)

Sources: https://medical.uworld.com/usmle/usmle-step-1/ , https://medical.uworld.com/blog/medical/review-of-uworld-american-board-of-internal-medicine-qbank/ , https://elitemedicalprep.com/how-i-counsel-students-based-on-their-uworld-step-1-and-step-2-qbank-performance-analysis/ , https://katalystprep.com/blog/is-uworld-worth-it/ , https://www.edisonos.com/alternatives/uworld-review , https://splitmetrics.com/apps/uworld-medical-exam-prep/id991621303

Test shell
- Test creation form: Tutor mode (immediate feedback, no clock) vs Timed mode; pick subjects/systems; pick question pool (unused / incorrect / marked / all); choose question count (max 40 per block). "Create a test from incorrect + marked" is the core weak-area loop.
- Question screen deliberately mimics the real vendor shell (Prometric for CPA, NBME/FRED for USMLE, AAMC for MCAT). Top bar: question N of M, block timer (can hide), Mark (flag) checkbox, Previous/Next; tools: multicolour highlighter, strike-out answer choices, calculator, Lab Values side panel, Notes, Feedback, "enhanced exhibit" image viewer, text zoom, settings (colour theme incl. night/dark mode in the modern UI, unverified in official docs).
- Left-side vertical question number list with marked/answered state (unverified exact styling).

Review mode (the famous part)
- After answering (tutor) or after the block (timed), each question shows: correct/incorrect banner, the % of users choosing each option beside each choice, time spent vs average, a long illustrated explanation ("why right / why each other option is wrong"), an "Educational Objective" summary line at the end, references, and buttons to add to flashcards (SmartCards/ReadyDecks) or My Notebook (clip any text/image from the explanation).
- Explanations reuse the same chart/diagram across related questions, which reinforces recall.
- Reviewer complaints: the Lab Values overlay covers question text and loses scroll position; highlight in explanations broke on iPad. Lesson: overlays must be docked or resizable, not modal.

Performance analytics
- Performance page: cumulative stacked bar of Correct (green) / Incorrect (red) / Omitted (blue) with exact counts; Test Count; Percentile Rank vs all users; bell curve of score distribution; "Your Average Time Spent (sec)" vs others; Answer Changes table (correct->incorrect, incorrect->correct, incorrect->incorrect) to surface second-guessing; QBank Usage pace tracker (are you on pace to finish by test date).
- Reports tab: table by subject / system / topic with % correct, usage, counts; sortable and filterable; can create a test straight from a weak row.
- Graphs tab: performance by calendar date or by test block, with date-range picker.
- Self-assessments give a projected 3-digit score and "equated percentage correct".

Visual language
- Dense, utilitarian, high-information UI; light theme default, dark theme available in app; colour is reserved for status (green/red/blue) and highlighter colours. The exam shell is intentionally dated-looking because fidelity to the real exam matters more than aesthetics; the dashboard and explanation pages are richer and more modern.

Transferable to IELTS
- Per-option "% of users chose this" and time-spent-vs-average per question.
- Answer-changes table (second-guessing diagnostic).
- Build a drill from "incorrect + flagged" in one click; sortable topic table with "Practice this" action.
- Pace tracker: questions/tests completed vs planned by exam date.
- Clip-to-notebook and make-flashcard from explanation panels.

## 4. Duolingo English Test (DET) Readiness / Practice Test

Sources: https://englishtest.duolingo.com/readiness , https://blog.englishtest.duolingo.com/duolingo-english-test-readiness/ , https://blog.englishtest.duolingo.com/det-subscores , https://englishtest-static.duolingo.com/media/resources/DET_Scoring%20Guide%20for%20Teachers%20(2026).pdf , https://lumetest.com/blog/det/estimated-score-in-det

Test shell
- Practice test is a ~45 min, adaptive, full-screen, one-question-at-a-time flow: large question card, big friendly type, a thin progress indicator, per-item countdown bar rather than a global clock, "Next" as the only primary action. No navigator, no going back (matches the adaptive real test). The whole product is mobile-first-feeling even on desktop, with illustration, rounded cards and Duolingo's green/blue palette.
- Readiness hub: question-type explainers with sample items, rules, scoring explainer, and "Practice test" CTA.

Results
- Result card after a practice test: a single "estimated score range" (e.g. "115-135") on the 10-160 scale, shown as a range bar, not a point score; official reports add four integrated subscores (Literacy, Comprehension, Conversation, Production) plus four individual skill subscores; the practice test estimate is explicitly labelled unofficial and framed as "reduce uncertainty before test day".
- The range framing manages expectations and avoids false precision; third-party sites spend a lot of words explaining the gap between estimate and real score, which shows how much attention a predicted score attracts.

Transferable to IELTS
- Predicted band as a RANGE with a confidence note, drawn on a band scale (e.g. 6.0-7.0), not a single number.
- Per-item timers for Speaking/Listening-style tasks; linear "no going back" mode as a realism toggle.
- Friendly, low-density "study mode" look vs stricter exam shell.

## 5. ETS TOEFL iBT TestReady (and TOEFL Practice Online)

Sources: https://www.in.ets.org/preparation-toefl/testready.html , https://www.ets.org/content/ets-org/ca/en/home/toefl/china/toefl/toefl-testready.html , https://www.ets.org/s/toefl/pdf/toefl_tpo_faq.pdf , https://www.ets.org/s/toefl/free-practice/listening.html

Study loop
- 5-question onboarding survey generates a free interactive study plan "to fit your schedule", with progress tracking and a focus on skills to boost.
- Three practice modes: Full test (TPO, scored within 24 h, timed or untimed), Section test (timed, estimated section score + CEFR level), Section practice (untimed, by question type, immediate feedback). Untimed mode allows audio replay and answer checking, which the real test does not; ETS flags this explicitly.

Results and review
- Reading/Listening: review correct and incorrect answers with explanations of why each option is right or wrong.
- Speaking: automated feedback on speech rate, rhythm, pronunciation, grammar, plus a transcript of your response and an exemplar response to compare.
- Writing: feedback on grammar, usage, mechanics, with exemplar essays.
- Scores shown as estimated section score (0-30) with CEFR band label.

Test shell
- Classic ETS shell: dark header bar with section name, "Volume", "Help", "Review", "Back/Next"; a Review screen lists every question with Answered / Not Answered / Not Seen status and lets you jump back; a timer top-right with a "Hide Time" toggle (TPO legacy UI).

Transferable to IELTS
- Mode triad (full / section / question-type) with a clear "untimed = not realistic" warning.
- Speaking feedback dimensions (rate, rhythm, pronunciation, grammar) + transcript + exemplar side by side.
- Survey -> auto-generated study plan with progress.

## 6. GMAT Official Practice (mba.com, GMAT Focus Edition)

Sources: https://www.mba.com/exams/gmat/after-the-exam/gmat-scores-and-score-reports/enhanced-score-report , https://www.mba.com/gmatfocusprep , https://test-ninjas.com/gmat-question-review-and-edit-feature , https://open-exam-prep.com/study-guides/gmat-verbal/exam-mechanics-and-strategy/review-and-edit-strategy , https://blog.targettestprep.com/gmat-focus-edition-complete-guide/

Test shell
- Question Review & Edit: unlimited bookmarks during a section; after the last question a review screen lists all question numbers with a bookmark icon on flagged ones; clicking a number jumps back; you may change up to 3 answers per section; the review screen is skipped if the section clock hits zero. The section clock keeps running on the review screen.
- Shell: sparse, white, one question per screen, timer top-right (toggle), question count, Next/Confirm with a confirmation dialog (because answers lock on an adaptive test).

Results
- Practice exam score report mirrors the Official/Enhanced Score Report: total and section scores with percentile rankings, insights by section, question type and content domain, time management/pacing (time spent per question vs average, performance by quarter of the section), plus practice-only extras (per-question review with your answer, correct answer, difficulty, time).

Transferable to IELTS
- A "review before submit" screen with jump-back, and an explicit rule-set about what can be changed.
- Pacing by section quarter (first/second/third/fourth quarter of the section): shows where time was lost.
- Percentile alongside the score.

## 7. Pearson PTE Academic scored practice tests

Sources: https://www.pearsonpte.com/preparation/scored-practice-tests , https://www.pearsonpte.com/articles/everything-you-need-to-know-about-the-new-pte-score-report-and-skills-report

Test shell
- Browser-delivered, 2-hour, same timing/format as the real test; single-use, versions 1-3 fixed; scored by the same AI engine as the real test.
- Shell (PTE real/practice): white page, blue header with item type and a countdown "Time remaining" plus item count; audio items show a recording status box ("Recording... / Current status") with a progress bar; no back navigation; "Next" confirms.

Results
- Overall 10-90 plus Speaking/Writing/Reading/Listening 10-90, aligned to the Global Scale of English.
- Skills Profile (test-taker-only, not shared with institutions): eight categories (Open Response Speaking and Writing; Reproducing Spoken and Written Language; Extended Writing; Short Writing; Extended Speaking; Short Speaking; Multiple-skills Comprehension; Single-skill Comprehension). Each row has skill-area icons in the middle and a blue performance bar on the right; clicking a row opens a description plus GSE-based recommendations.

Transferable to IELTS
- Separate "shareable score" from "private skills profile with recommendations".
- Row = skill name, icons for skills involved, horizontal bar, expandable advice. Very reusable for IELTS question-type breakdown (e.g. True/False/Not Given, Matching Headings).
- Recording status box with level meter for Speaking tasks.

## 8. Khan Academy (mastery / progress UI, and the SAT "My Practice" loop)

Sources: https://support.khanacademy.org/hc/en-us/articles/47078681852045 , https://support.khanacademy.org/hc/en-us/articles/48431088309645-Update-How-mastery-percentage-is-calculated-on-Khan-Academy , https://support.khanacademy.org/hc/tr/articles/18735142028045 (mastery progress visualization, Aug 2023) , https://satsuite.collegeboard.org/practice/my-practice-101

Mastery UI
- Four mastery levels per skill, each with its own icon: Attempted, Familiar, Proficient, Mastered (plus Not started). Mastery % of a course/unit counts only Proficient + Mastered skills (e.g. 5 of 20 = 25%). Each skill is worth 100 mastery points.
- Unit page "mastery progress visualization" (2023): a row of small squares, one square per skill, filled by current level; hover previews the skill, click opens the exercise; lightning-bolt icon = quiz, star icon = unit test, placed inline in the row. Unit mission cards summarise as "3 of 22 skills to Proficient". Course page shows % mastered and mastery points fraction, ending with a Course Challenge card.
- Post-activity result shows the level change for that skill ("Leveled up to Proficient").
- Users of the older crown-based bars complained the newer single-box design lost the per-topic progress bar, a reminder that a compact grid must still communicate "how much more".

SAT loop (Bluebook -> My Practice -> Khan)
- Scorecard list (newest first, scroll right for older), downloadable PDF score report, Score Details page listing every question with your answer, correct answer and a "Review" button per question, performance across content domains, a "Practice on Khan Academy" button that opens a matching review course for that specific practice test, and "Get Tailored Practice" that generates a question set from the Student Question Bank based on your results.

Transferable to IELTS
- Skill-square grid per section (e.g. 14 Reading question types) with 4 named levels and icons, not just a %; quiz/test markers inline.
- Results page must link straight to targeted practice ("Get tailored practice") and to a per-question explanation walkthrough.

## 9. Achievable

Sources: https://app.achievable.me/study/achievable/learn/the-achievable-method , https://achievable.me/exams/usmle-step-1/overview/ , https://www.educationalappstore.com/website/achievable

Study loop
- Linear online textbook; every chapter ends with a "Take quiz" button (flashcard-style quiz); passing the quiz marks the topic complete on the dashboard and injects its concepts into a personal memory model.
- Spaced-repetition review queue: dashboard shows "memory progress" and "upcoming workload" (reviews due); advice is 70%+ before moving on, and not to let reviews pile up.
- Dashboard: study progress chart (content seen) + memory strength shown by block colour per topic (trend upward with dips on hard topics) + an exam-readiness indicator; practice exams feed the same model.

Transferable to IELTS
- "Memory strength by block colour" heatmap of topics; upcoming-workload counter; readiness indicator that combines coverage and retention rather than only mock scores.

## 10. Kaplan (Qbank + study plan)

Sources: https://www.kaptest.com/usmle/free/usmle-step-1-flextrack-trial , https://www.kaptest.com/study/lsat/digital-lsat-2019-tips-strategies/ , https://www.prnewswire.com/news-releases/thea-wins-best-online-study-tool-in-2026-edtech-breakthrough-awards-program-302798187.html (Kaplan "Test Prep Solution of the Year" 2026) ; third-party descriptions (unverified): https://partnernews.mambu.com/filedownload.ashx/B13TCI/999560/Kaplan%20Qbank%20Pance.pdf

What is documented
- Qbank mirrors the real exam shell (NCLEX alternate formats: SATA, hotspot, drag-and-drop, fill-in-the-blank); timed tests and full-length simulations; performance reports by content area, question type and cognitive level; time-per-question metrics; custom quizzes from weak areas.
- Kaplan's course products add a personalised study plan/calendar keyed to test date with daily assignments and a progress bar (product knowledge, unverified in fetched pages).
- Kaplan's 2019 digital-LSAT guidance highlighted the value of adjustable font size, line spacing, brightness and timer settings during the test.

Transferable to IELTS
- Reports by cognitive level (e.g. locate / infer / paraphrase) in addition to question type.

## 11. Brilliant (streaks, learning path, celebrations)

Sources: https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations , https://brilliant.org/help/features/what-is-a-streak , https://builtformars.com/company/brilliant , https://screensdesign.com/showcase/brilliant-learn-by-doing , https://www.apkmirror.com/apk/brilliant-org/brilliant/brilliant-7-1-0-release

Patterns
- Streak = a day counts after 3 problems or 1 lesson; miss a day -> reset unless a "streak charge" (freeze) is held. After a 1-day streak the app immediately proposes a 3-day target (goal-gradient / foot-in-the-door). Streak animation is synced to a rising number counter so the reward feels caused by the learner.
- Colour-coded branching learning path: nodes and connecting lines coloured per topic, multiple node types (lesson, practice, checkpoint), the current node highlighted, next steps visible. 2023 "game mechanics" redesign; animations built in Rive with state machines so the same file runs on web/iOS/Android.
- Lesson UI: one bite-sized interactive problem per screen, immediate explanation with interactive elements after a wrong answer, XP counter and celebration animation on completion, playful tangram loading animations instead of spinners, leagues unlock later.
- Onboarding: goal-setting step pre-completed; curiosity-gap lesson previews.

Transferable to IELTS
- Streak with freeze, a minimum daily unit (e.g. 1 Listening part or 10 Reading questions), the "next small target" nudge, a visible path to exam date, and completion animations only in study mode (never in exam mode).

## 12. Anki and Quizlet (study loops)

Sources: https://docs.ankiweb.net/stats.html , https://forums.ankiweb.net/t/how-to-prevent-users-from-misusing-hard-ideas-are-welcome/49092 , https://forums.ankiweb.net/t/full-screen-a-small-feature-id-love-to-see-in-anki/70464 , https://www.notelyn.com/de/blog/quizlet-spaced-repetition , https://www.fast.io/resources/best-ai-study-tools-2026.md

Anki
- Review screen: card front, "Show answer", then 4 graded buttons Again / Hard / Good / Easy with the next interval shown above each; known design risks: Again and Hard colours too similar, interval previews can confuse, so a 2-button mode (Again/Good) is debated. Users ask for a distraction-free full-screen review (menu bar hidden).
- Stats: Today summary; Future Due bar chart with "daily load"; Calendar heatmap of past reviews; Reviews by day with mature/young/learning colour blocks and cumulative line; Card Counts pie; Review Intervals and Ease distributions; Hourly breakdown; Answer Buttons chart; True Retention table (pass/fail by card maturity). Anki's interface is widely described as "functional rather than polished".

Quizlet
- Learn mode: cards move Not yet learned -> Familiar -> Mastered (1 then 2+ correct), session-based rounds with a progress bar, no visible per-card schedule; "Long-Term Learning" (paid) recommends when to come back. Flashy but shallow scheduling is the common critique.

Transferable to IELTS
- Vocabulary/collocation decks with a 2-button grading default (Again/Good) and an optional 4-button mode; calendar heatmap of study days; "future due" load chart so the learner sees tomorrow's workload; retention % as a trust metric.

## 13. AI tutor exam apps, 2025-2026

Sources: https://www.prnewswire.com/news-releases/thea-wins-best-online-study-tool-in-2026-edtech-breakthrough-awards-program-302798187.html , https://www.theastudy.com/post/thea-s-new-mobile-app-is-here-study-smarter-with-ai-on-the-go , https://apps.apple.com/app/id6742800289 , https://www.edtechdigest.com/2026-finalists-winners/ , https://fabric.so/comparison/best-ai-study-app , https://www.fast.io/resources/best-ai-study-tools-2026.md

- Thea Study (EdTech Breakthrough "Best Online Study Tool" 2026; ETIH AI-tutor shortlist): upload notes/PDF/video -> auto study kit; adaptive practice that targets weak spots and ramps difficulty; flashcards + games with spaced repetition; a "Test mode" that simulates exam conditions and tracks progress; teacher analytics. No Apple Design Award or Google Play design award for a test-prep app was found for 2025-2026; design praise for this category is sparse and mostly feature-driven.
- Compass Education Group "Academic & AP Exam Practice" was an EdTech Awards 2026 finalist (SAT/ACT/AP practice with Bluebook-style shell).
- 2026 roundups (Fabric, Fast.io) rank study tools by "builds understanding vs memorisation"; the recurring UI expectation is: one home screen with "what to do today", an AI explain-this panel attached to every wrong answer, and spaced-repetition surfaced as a due-count badge.

Transferable to IELTS
- An "Explain / Ask the tutor" side panel anchored to each reviewed answer; a daily "do this next" card at the top of home.

## 14. Exam-shell conventions from assessment vendors (useful cross-check)

Sources: https://help.cambridgeinternational.org/hc/en-gb/article_attachments/23807366091794 , https://www.hkicpa.org.hk/-/media/Document/EandT/ExamTeam/CBE-Guide-M1-9.pdf , https://help.testlify.com/en/articles/9595972-utilizing-the-question-palette-option-in-your-assessments , https://synap.ac/docs/platform/quizzes/experience-and-instructions , https://cdn.jsdelivr.net/npm/@exxatdesignux/ui@0.6.50/consumer-extras/patterns/focus-workflow-pattern.md , https://docu.ilias.de/go/wiki/wpage_6102_1357 , https://www.flexiquiz.com/Help/proctoring/full-screen-mode

- Navigator status taxonomy in the wild: Not visited (dotted circle) / Viewed, unanswered (solid outline) / Partially answered (half-filled) / Answered (filled) / Flagged (separate flag layer, combinable with any of the above) / Current (ring). Cambridge uses shape (dotted, half, solid) rather than colour only; HKICPA ships a colour-scheme + cursor switcher because colour-only status failed some candidates.
- Timer rules (Synap): visibility and enforcement are separate concerns; "hide timer" never removes the timer; section-level timers need their own timeout, final-warning and refresh behaviour; forcing full time is rarely right for practice.
- Tools: flag-for-self vs report-a-problem are two different actions and should not share an icon.
- "Exam lock" shell pattern (Exxat design system): render only the exam route with a lock header (title, tools, timer, avatar) and an optional progress bar flush to the top of an inset rounded content card; no sidebar, no command menu, no banners, no toasts (use inline confirmation or a blocking dialog on submit); Enter = primary action with a key hint, Esc = cancel.
- Kiosk view (ILIAS): only test title, collapsible question list and remaining time; the only exit is Finish.
- Full-screen enforcement (FlexiQuiz) warns and blocks on exit while the clock keeps running; good for a "strict mode" toggle, bad as the default for practice.

## 15. Design case studies and community critiques (Behance / Dribbble / Medium / forums)

Note: Medium, Behance and Coroflot block automated fetching (403 / bot check), so Medium and Coroflot items are summarised from search snippets and listings; open the URLs manually to see the screens.

1. "UX/UI Case study: Test-taking platform" (Medium Design Bootcamp, c. 2023) https://medium.com/design-bootcamp/ux-ui-case-study-test-taking-platform-9227ed4987e7 : the core decision is a progress bar that tracks questions completed during the test, plus a clean single-question layout; it argues for always-visible progress and a single primary action.
2. "Exam Portal Design: A UX Case Study" (UX Planet, Shriya Shekhar) https://uxplanet.org/student-exam-portal-design-a-ux-case-study-486d9b9e2418 : examiner-side portal in Singapore built with design sprints inside Scrum; the stated hard problem is fitting many question types under one consistent UI; prototypes were tested with stakeholders before any build.
3. "Designing a complete Online Examination Portal from scratch" (Medium, Diksha Saxena) https://medium.com/@diksha.saxena78/designing-a-complete-online-examination-portal-from-scratch-ui-ux-case-study-c58fda5764d4 and "Online examination system: UX case study" (Vijayraj Honnur) https://medium.com/@vijayrajhonnur/online-examination-system-ux-case-study-4411faae440d : student exam screen with a colour-coded question palette (answered / not answered / marked for review / not visited / answered + marked, the standard Indian CBT palette), timer top-right, and a proctoring/activity-log module.
4. "Quill: the Padhai app" (UX Planet) https://uxplanet.org/quill-the-padhai-app-design-case-study-925a9f77e9ed : usability tests with students found confusion about difficulty selection (fixed with a difficulty filter + "mixed") and about how subject progress was computed (fixed by moving progress bars onto each book card); recommends an end-of-test report with accuracy by chapter/unit, a radar chart of weak vs strong units, and average time per question.
5. Gurully test-prep redesign concept (GitHub/Figma, 2025) https://github.com/MSJAYASURIYA/gurully-ux-case-study : goal-first dashboard (target score, gap to target, one recommended next activity); results screen leads with overall score and gap to target, then skill scores, weakest skill, and a prominent "practice this" CTA. Principle quoted: "The results screen should not become a dead end."
6. "UI/UX Design for Gamified Exam Platform" (Contra) https://contra.com/community/bHyEfnar-uiux-design-for-gamified-exam-platform : deep violet gradient background with frosted-glass overlays, clear exam navigation grid, prominent progress tracking, unmistakable Submit; the designer's stated goal is minimising cognitive load.
7. Dribbble tag "exam" https://dribbble.com/tags/exam : recurring 2024-2025 shots include "Exxam.io, AI-powered exam dashboard" (Caraka), "Skillsphere: E-course dashboard, Exam Quiz" (Keitoto), "Scoofield: Quiz, Quiz Summary and Leaderboard" (Agensip), "Exam Preparation App" (Purrweb). Common visual grammar: light neutral canvas, one accent colour, soft cards with 16-24 px radius, a left rail, big score number with a ring gauge on the summary screen, small sparkline trend, leaderboard or badge strip; exam screens drop the left rail and keep a top bar (timer, progress) + bottom bar (prev/next, number grid).
8. "Student Score Reports" (Coroflot, Ryan Elizabeth) https://www.coroflot.com/RyanElizabethDesign/Student-Score-Reports : structure a score report as results first, then what they mean, then next steps; a good skeleton for the IELTS mock-result page.
9. Community critiques: 7Sage thread on the new LawHub UI https://7sage.com/discussion/58361/new-lawhub-interface-aug-2026 : modal switching between "select" and "eliminate" cost 15-30 s per question; removing highlight inside answer choices broke a flagged-question workflow; praise for colour filters and font controls. UWorld app reviews https://splitmetrics.com/apps/uworld-medical-exam-prep/id991621303 : a reference overlay that covers the question and loses scroll position makes timed mode unusable. Anki forum https://forums.ankiweb.net/t/how-to-prevent-users-from-misusing-hard-ideas-are-welcome/49092 : Again/Hard colours too similar, grading labels confuse newcomers. Khan Academy forum: removing per-topic progress bars in favour of a single box lost "how much is left" information.

## 16. Visual language: exam mode vs study mode (synthesis)

- Exam mode (Bluebook, LawHub, GMAT, PTE, UWorld timed): near-monochrome, white content area, dark or neutral top/bottom bars, no navigation rail, no brand colour beyond one accent, no animation, no toasts; status colours only inside the navigator; passage/question split pane for reading; floating but dockable overlays for calculator/reference; typography large (16-18 px body, generous line height) and adjustable; dark theme optional and honoured for the whole shell.
- Study/dashboard mode (UWorld dashboard, Khan, Brilliant, Achievable, Dribbble patterns): more colour, cards, charts, streaks and celebrations; light default with dark mode; density medium; progress encoded with both colour and shape/level labels.
- The transition between the two must be explicit (a "Start section" full-screen interstitial with rules and a "Begin" button; an "End of section" review screen; then a results page that returns to the dashboard look).

## Transferable patterns: the 10 most reusable, and who does each best

1. Hide-able timer that forces itself back at 5 minutes (Bluebook). Add per-section timers with their own final warning (Synap) and a per-item countdown bar for Listening/Speaking tasks (DET).
2. Numbered question navigator with a status taxonomy that uses shape + colour, not colour alone: not visited / unanswered / answered / flagged (+ current), segmented by passage or part (LawHub 2026 question bar; Cambridge shape-coded states), opened from a bottom-centre "Question N of M" pill (Bluebook).
3. Mandatory end-of-section review screen listing every question with status and flags, jump-back links, and a clear statement of what can still be changed (GMAT Question Review & Edit; Bluebook module review; ETS Review screen).
4. Highlight + note tools with a small selection popover, 3-4 colours each paired with a distinct underline style for accessibility, working across passage, question stem and options, plus answer eliminator and "Reset response" (LawHub 2026, Bluebook Annotate).
5. Split-pane reading layout with independently scrolling passage and questions, passage-only pre-read mode, and in-passage word search (LawHub).
6. Bare "exam lock" shell: only header (title, tools, timer) and footer (prev/next, navigator), no sidebar, no toasts, Enter/Esc keyboard mapping, inline confirmation on submit (Bluebook; Exxat design-system pattern), with persistent display settings (font size, line spacing, contrast/colour filters) changeable mid-test (LawHub, Kaplan guidance).
7. Review mode per question: your answer vs correct, % of users who chose each option, your time vs average, long explanation of why right and why each other option is wrong, clip-to-notebook and make-flashcard actions, and an "Explain more" AI panel (UWorld; TOEFL TestReady explanations; 2026 AI study apps).
8. Score report layered as results -> meaning -> next steps: predicted band shown as a range on the band scale with a confidence note (DET), percentile and pacing by section quarter (GMAT ESR), shareable score separated from a private skills profile of rows with icons + bar + expandable advice (PTE Skills Profile), ending in one "Practice this next" CTA so the page is never a dead end (Gurully concept; College Board "Get tailored practice").
9. Analytics dashboard: stacked correct/incorrect/omitted bar with counts, answer-changes table, trend by date and by test, sortable topic table with one-click "drill the weak rows", pace tracker vs exam date (UWorld), and a skill grid with four named mastery levels and inline quiz/test markers (Khan Academy).
10. Study loop: survey -> auto study plan to exam date with daily tasks (TOEFL TestReady), streak with a freeze and a "next small target" nudge, colour-coded path with a visible current node (Brilliant), spaced-repetition vocabulary deck with 2-button grading, due-count badge and a calendar heatmap (Anki, Achievable memory-strength blocks).
