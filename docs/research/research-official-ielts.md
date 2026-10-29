# Official IELTS on computer: UI research notes

Research date: 2026-10-26. Target: a faithful web simulator of the official computer-delivered IELTS (British Council / IDP / Cambridge).

## 1. Screen layouts (Listening, Reading, Writing)

### Global chrome (all three modules)
- Flow at start: an information screen appears first; candidate clicks a **"Start Test"** button. (IDP "How computer-delivered IELTS works")
- **Timer**: a countdown ("stopwatch") sits in the **upper middle** of the screen. It starts **flashing during the last 10 minutes** of Reading and Writing, and again during the **final 5 minutes**. When time runs out, answers are saved and the test closes automatically. (IDP)
- **Top-right controls**: **Hide** (hides the question content, e.g. for a toilet break; click **"Resume test"** to continue), **Settings** (change **font size** and **background colour**), and in Listening a **volume control bar**. (IDP)
- **Help** button on screen shows instructions for each section and question type. (IDP)
- **Bottom navigation**: a bar with a numbered button for **all 40 questions**; clicking a number jumps to that question. **Forward/backward arrows** move one question at a time. (IDP, oneielts)
- **Review**: a "Review" control in the **lower left** marks the current question for review; its number on the nav bar changes **from a square to a circle**. (IDP)
- Answers **auto-save** as you go. (IDP features article)
- Candidates can start from any question, change answers, leave blanks, move freely within a module (not within Listening across finished parts; see section 3).

### Listening
- Candidate types answers directly while the audio plays; no transfer time. Nav bar shows all 40 questions. 2 minutes at the end to check answers. (IDP)

### Reading
- **Split screen**: passage on the **left**, questions on the **right**, each scrolls independently. (IDP)
- Select text, right-click to **highlight** or add **notes**. (IDP, British Council)

### Writing
- Task prompt on the **left**, typing area on the **right**. **Word count** appears in the **lower left** (under the text area). Candidate may start with either task. Answers auto-save. (IDP)

Sources (section 1):
- https://ielts.idp.com/prepare/article-how-computer-delivered-ielts-works
- https://ielts.idp.com/nepal/about/news-and-articles/article-how-to-use-ielts-on-computer-features-to-your-advantage
- https://ielts.idp.com/canada/about/which-ielts-test/computer-delivered-ielts
- https://oneielts.com/guides/advantages-computer-delivered-ielts
- https://takeielts.britishcouncil.org/take-ielts/prepare/ielts-on-computer/about/highlighting-text

### Additional layout facts (secondary sources, consistent with IDP)
- Nav bar is a row of **40 numbered boxes**; once a question is answered, **a line (underline) appears beneath its number** (speechful.ai, widerai). Review-flagged question: number box becomes a **circle** (IDP).
- Timer counts down from 60:00 in Reading/Writing, updates every second, sits top centre; flashes at 10 min and 5 min remaining (IDP, speechful).
- "A review screen shows which questions are answered, flagged, or blank" (testmimic/widerai) - i.e. the nav bar doubles as the review overview; there is no separate summary page before submit in Listening/Reading beyond the nav bar.
- Listening volume control: top right (ieltspractice.app, IDP).
- Writing editor: plain text area, live word count, cut/copy/paste allowed, **no spell-check, no grammar suggestions** (testmimic).
- Settings (text size, background colour) can be adjusted at the start and during the test (widerai, IDP).

### The official platform is Inspera
- The official familiarisation tests launched from IDP/British Council open in the **Inspera assessment player** (`demo-ielts.inspera.com/player/...`, `ielts.inspera.com/player/...`). The real test runs on the same Inspera-based IELTS platform, so the familiarisation test is the best visual reference.
- Familiarisation launch URLs (IDP page):
  - Listening: https://demo-ielts.inspera.com/player/?assessmentRunId=131012334&context=exam#/section/128121996/question/128121965/scorableItem/1
  - Academic Reading: https://demo-ielts.inspera.com/player/?assessmentRunId=131013388&context=exam#/section/128121930/question/128121896/scorableItem/1
  - Academic Writing: https://demo-ielts.inspera.com/player/?assessmentRunId=131013741&context=exam#/section/128125100/question/128121843/scorableItem/1
  - Writing Task 1 sample: https://ielts.inspera.com/player/?assessmentRunId=205993150&context=exam#/section/197676238/question/145423613/scorableItem/1
  - Writing Task 2 sample: https://ielts.inspera.com/player/?assessmentRunId=189733431&context=exam#/section/145422651/question/145422397/scorableItem/1
  - GT Reading sample: https://ielts.inspera.com/player/?assessmentRunId=205994164&context=exam#/section/188165448/question/188165446/scorableItem/1
- Familiarisation test caveats (IDP): **untimed**; "timing, highlighting and notes functions work differently" from the live test; Listening = 4 recordings/40 Qs, Reading = 3 texts/40 Qs, Writing = 2 tasks; answer keys at bottom of page; YouTube playlist "Explaining IELTS on Computer".

Sources:
- https://ielts.idp.com/about/ielts-familiarisation-tests
- https://ieltsidpindia.com/information/computer-delivered-ielts-familiarisation-test
- https://speechful.ai/blog/computer-based-ielts-reading-practice-test-interface
- https://www.widerai.us/blog/ielts-reading-computer-based
- https://testmimic.com/guides/ielts/computer-delivered-ielts-complete-guide
- https://ieltspractice.app/learn/computer-delivered-ielts-listening

## 1b. Direct inspection of the official familiarisation test (Inspera player, demo-ielts.inspera.com) - PRIMARY SOURCE

Inspected 2026-10-26 in a browser at 1024x768 viewport. These are measured values from the live DOM/CSS of the official demo (release 3.60.0 of the Inspera player, body class `fjord-theme`).

### Global look
- **Font**: `Arial, sans-serif`, base **16px**, black `#000` text on **white** `#fff` background. No blue header: the whole chrome is white/light grey. Headings (passage title, "Questions 1-6") are 16px **bold**, not larger.
- **Top header**: 56px tall, white, no border/shadow. Left: red **IELTS** logo (SVG, `images/logo/ielts.svg`), then the label **"Test taker ID"** (in the live test this shows the candidate's name/ID). Right side icons (Font Awesome): **Wi-Fi icon = connection status ("Connected")**, **bell = "Messages"**, **hamburger = "Options"**, **pencil-in-square = "Show notes"** (aria-label). No timer in the demo (untimed); in the live test the countdown sits in this header, top centre (IDP).
- **Part rubric banner**: full-width `<section>` under the header, background **rgb(241,242,236) `#F1F2EC`**, 1px border **`#D5D5D5`**, ~72px tall, bold "Part 1" on line 1 and "Read the text and answer questions 1–13." on line 2 (italic class present but renders normal weight).
- **Bottom footer**: ~54px tall, white, text colour **`#535353`**. Contains, left to right: part tabs with question buttons; prev/next arrow buttons; a tick (finish) button.
  - **Part tabs**: "Part 1", "Part 2", "Part 3" buttons. The **current part is bold** (weight 600) and its question numbers are expanded inline; other parts are collapsed to "Part 2  0 of 13" (screen-reader text: "Part 2. 0 of 13 questions attempted."). Clicking a part tab expands it and shows its question buttons.
  - **Question buttons**: `<button class="subQuestion scorable-item">`, 21x27px, radius 3px, 16px text `#333`, 2px transparent border. **Active (current) question**: 2px solid **rgb(65,143,198) `#418FC6`** border, bold. **Attempted (answered)**: class `attempted`, a **3px green bar rgb(53,142,20) `#358E14` drawn ABOVE the number** (`::before`, absolute, top -16px, same width as the button). Unanswered questions show a faint grey dash above instead (progress track). Multi-answer questions appear as grouped buttons labelled **"18–19", "20–21", "22–23"**. Screen-reader text per button: "Question 1 / Not attempted / Active".
  - **Prev/Next**: two 56x55px square buttons at the right end of the question area: **Previous** = light grey `#DDDDDD` background with white left-arrow, **Next** = **black `#000`** background with white right-arrow (`fa-arrow-left/right`, 40px).
  - **Finish/submit**: far right, 77x54px, background `#EFEFEF`, a check icon (`fa-check`), id `deliver-button`, aria-label **"Review your answers"**. It opens the submission page.
- **Options menu** (hamburger): opens a full-screen white page titled **"Options"** with a close "X" top-right. Items: a **red** button **"Go to submission page"** (paper-plane icon, the IELTS red ~ `#D7282F`-ish), then a card list with **"Contrast"** and **"Text size"**, each with a chevron.
  - **Contrast** sub-page: **"Black on white"** (default, ticked), **"White on black"**, **"Yellow on black"**.
  - **Text size** sub-page (route `/options/zoom-factor`): **"Regular"** (default), **"Large"**, **"Extra large"**.
- **Notes sidebar** ("Show notes" icon): a **300px right sidebar** titled **"Notes"** with a close X ("Hide notes"), grey body, empty state text: "Your private notes will show here" and "Select text to highlight or create a note." Opening it narrows the main content area (body gets `sidebarOpened`).

### Reading screen (demo)
- Two panes: **passage left, questions right**, each with its own vertical scrollbar (custom grey scrollbar track visible at the inner edge of each pane).
- **Resizable divider**: a 2px vertical line `rgba(0,0,0,0.5)` plus a 16px invisible drag strip (`react-draggable`), with a **36x36px handle** (background `#F9F9F9`, Font Awesome `fa-arrows-h` left-right arrows icon, `role="separator" aria-orientation="vertical"`) centred vertically on the divider. Drag to resize panes.
- Default split at 1024px wide: divider at ~x=362 (passage ~35%, questions ~65%) with notes sidebar closed the passage pane was ~390px.
- **Highlight / notes**: implemented with the **Hypothesis annotator**. Selecting text pops a small white toolbar (arrow-up) with two buttons: **"Note"** (speech-bubble icon, shortcut (a), aria "Create note") and **"Highlight"** (highlighter icon, shortcut (h), aria "Create highlight"). It appears on mouse selection (right-click also works in the live test per British Council: "right click and select the 'highlight' option"; removal via right-click "clear all"). Notes are stored in the Notes sidebar.
- **Question types seen and how they are answered**:
  - True/False/Not Given: radio buttons, options listed vertically as "TRUE / FALSE / NOT GIVEN"; the selected option's row gets a **light blue background (approx `#CFE0F3`)**.
  - Matching headings (Part 2): **drag and drop**. "List of Headings" rendered as white bordered draggable chips in the question pane; the passage has **dashed-border drop boxes** labelled with the question number (e.g. a box containing "14") at the top of each section. A small **"Help"** link with a keyboard icon sits above the passage title (keyboard-accessible drag-drop instructions). Rubric: "The text has four sections. Choose the correct heading for each section and move it into the gap."
  - The question number badge next to each question is a small bordered square (e.g. "1" in a 1px box) for the active question, plain bold number otherwise.
- Instruction text is in the question pane: "Questions 1–6" bold, then the rubric with key words in bold ("Choose **TRUE** if...").

### Reading demo, continued
- **Multi-select questions** (e.g. "Questions 18–23: Choose TWO correct answers." / "18–19 Which TWO options describe ...?"): rendered as **checkboxes** (5 options each); nav bar groups them as a single button "18–19".
- **Gap-fill / sentence completion** (Questions 34–40): inline `<input type="text" class="textEntryInteractionValue">`, **144x22px** in Reading (104px in Listening), **1px solid `#535353` border, radius 3px**, white background; the **placeholder is the question number** (e.g. "34") centred-ish in black; focused/active input border turns **blue `#418EC8`**; maxlength 500 (no enforced word limit, as sources say the box accepts over-limit text).
- Rubric for gap-fills: "Complete the notes. Write **ONE WORD AND/OR A NUMBER** for each answer."
- **No `<select>` dropdowns appear in the Academic Reading demo**; matching is drag-and-drop. (Other IELTS items do use dropdowns, e.g. matching sentence endings per speechful.ai; the Inspera item bank supports "inline choice" dropdowns.)
- **Finish flow**: tick button or Options > "Go to submission page" leads to route `#/delivering`: a mostly empty page with the text **"Click next to continue"** and a black **"Next"** button (paper-plane icon) at top right; the footer still shows all parts with "x of 13" attempted counts (screen-reader label "Table of contents"). Clicking Next in the demo exits to ielts.org (in the live test it submits the section). Prev/next arrows are disabled (greyed) on this page.

### Listening demo (official)
- **Single-column layout** (no split): rubric banner "Part 1 / Listen and answer questions 1–10.", then "Questions 1–10" bold, instruction line, a bold title ("Phone call about second-hand furniture") and the note-completion form with inline numbered input boxes. Page scrolls vertically; questions 1–10 all on one page per part.
- **Pre-audio modal**: before the audio starts a centred overlay shows a large white **headphones icon**, the text **"You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions."**, then **"To continue, click Play."** and a black **"Play"** button (white text, `fa-play-circle` icon, radius 3px, class `btn-play-audio`). The page content behind is dimmed/blurred.
- **While audio plays**: a status line **"Audio is Playing"** with a speaker icon (`fa-volume-up`) appears in the header directly under "Test taker ID". **No visible audio player, progress bar, pause button or seek control.** (Volume control: IDP says a volume bar is top right in the live test; the demo shows none at 1024px.)
- Part tabs: **Part 1, Part 2, Part 3, Part 4**, each "0 of 10". Question buttons 1–10 per part.
- Answers typed directly into the gap boxes while listening; nav lets you move between questions within the part.

### Writing demo (official)
- Rubric banner: **"Part 1 / You should spend about 20 minutes on this task. Write at least 150 words."** and **"Part 2 / You should spend about 40 minutes on this task. Write at least 250 words."** (The two tasks are labelled **Part 1 / Part 2** in the footer, not "Task 1/Task 2".)
- **Split layout with resizable divider** (same `fa-arrows-h` handle): **task prompt + chart/image on the left**, **answer box on the right**.
- Answer box: a plain `<textarea>` (class `plainTextWrapper__plainText`), **1px solid `#595959` border**, white, Arial 16px, **spellcheck="false"**, `resize: none`, ~420x193px at this viewport (fills available width of right pane). No formatting toolbar.
- **Word count**: text **"Words: 0"** (class `WordCountText__wordCountText`) **right-aligned directly beneath the answer box**, updates live as you type ("Words: 13" after a 13-word sentence). (IDP's article says lower-left; the live Inspera build shows it under the box, right-aligned.)
- Task 1 prompt text is bold: "The chart below shows ... Summarise the information by selecting and reporting the main features, and make comparisons where relevant." Task 2: "Write about the following topic:" + bold topic + "Give reasons for your answer and include any relevant examples from your own knowledge or experience."
- Once a task has text, the footer tab shows a **green tick before "Part 1"** and a green progress bar across the top edge of that tab (the attempted indicator for whole-part items).

### Colour tokens observed (official Inspera IELTS theme)
| Element | Value |
|---|---|
| Page/background, header, footer | `#FFFFFF` |
| Body text | `#000000`; footer/secondary text `#535353`; nav numbers `#333333` |
| Part rubric banner | bg `#F1F2EC`, border `#D5D5D5` |
| Active question outline / focused input | `#418FC6` (rgb 65,143,198) |
| Answered indicator bar (3px, above number) | `#358E14` (rgb 53,142,20) green |
| Selected radio row | light blue ≈ `#CFE0F3` |
| Next button | `#000000` bg, white arrow |
| Previous button | `#DDDDDD` bg, white arrow |
| Finish (tick) button | `#EFEFEF` bg, `#535353` icon |
| Divider line | `rgba(0,0,0,0.5)` 2px; handle `#F9F9F9` 36px |
| Text inputs | border `#535353` 1px, radius 3px |
| IELTS logo / "Go to submission page" button | IELTS red (logo SVG; approx `#E31837`/`#D7282F`) |
| Font | Arial, sans-serif, 16px base, 1.5 line-height approx |

Sources (1b): direct inspection of https://demo-ielts.inspera.com/player/?assessmentRunId=131013388 (Reading), ...=131012334 (Listening), ...=131013741 (Writing), 2026-10-26.

### Header DOM (official demo) for reference
`header > topbar > [logo img ielts.svg] [subToolbar: connectionStatus (fa-wifi, sr "Connected") | #messagesMenuButton (fa-bell-o, sr "Messages") | #optionsMenuButton (fa-bars, sr "Options") | #toggleSidebarButton (fa-pencil-square-o, aria "Show notes")] [centralBar > #candidate-info > name "Test taker ID"] [statusColor]`
- The header has a `header__statusColor` strip and `header__centralBar` where the live test places candidate name and the countdown clock.
- Font Awesome 4 icons used throughout: wifi, bell-o, bars, pencil-square-o, arrows-h, arrow-left, arrow-right, check, close, paper-plane-o, play-circle, volume-up.
- **No "flag/review" control exists in the Inspera demo**: there is no checkbox, no circle marker. The nav bar states are only: not attempted (grey dash above), attempted (green bar above), active (blue outline). The "Review" checkbox / square-to-circle behaviour described by IDP articles belongs to the **previous (pre-Inspera) CD-IELTS platform**; British Council's platform blog says IELTS "is using a new platform for its on-computer test" (Inspera). British Council tutorial videos still mention "how to flag questions you want to return to" so a flag may exist in the live build but it is not in the public demo. The Messages (bell) button requires a logged-in session (demo redirects to "Welcome to Candidate login!").

## 2. Interaction features (summary)
- **Highlight**: select text with mouse -> popover "Note | Highlight" (Hypothesis). British Council: "left click and drag ... then right click and select the 'highlight' option"; remove via right-click "clear all". Highlights persist across questions. Examiner cannot see them.
- **Notes**: select text -> "Note" -> typed note attached to the selection, listed in the right-hand **Notes** sidebar (300px, toggle via pencil icon; can be hidden/shown any time). Notes are "less visible" than on paper: you must click the highlighted text/sidebar entry to read them (candidate blog).
- **Drag and drop**: matching headings / matching features: drag chips from a list into dashed drop boxes; keyboard alternative via "Help" (keyboard icon) link.
- **Dropdowns**: used for some matching items (matching sentence endings, matching features) - "choose the correct ending from a dropdown list" (speechful). Not in the Academic demo.
- **Radio buttons**: multiple choice (one answer), T/F/NG, Y/N/NG. **Checkboxes**: "Choose TWO" multi-select.
- **Typed gap fills**: inline text boxes with the question number as placeholder; word limit NOT enforced by the box.
- **Copy/paste**: Ctrl+C/Ctrl+V works in Reading answers and in Writing (British Council: "copy and paste directly from your text and notes"); one candidate reported copy/paste blocked in Writing at her centre.
- **Tab / Shift+Tab** move focus between answer boxes (candidate reports).
- **Settings**: Options > Contrast (Black on white / White on black / Yellow on black) and Text size (Regular / Large / Extra large). British Council lists "adjustable font sizes, colours and volume control".
- **Hide**: IDP (old platform) describes a Hide button + "Resume test" for toilet breaks; timer keeps running during Reading/Writing breaks; no breaks during Listening.
- **Help**: IDP (old platform) describes a Help button with instructions per question type; Inspera shows a contextual "Help" link for drag-drop keyboard use.
- **Volume**: a volume bar/control top right in Listening (IDP, ieltspractice.app).
- **No spell-check / grammar check** in Writing; no search/find in Reading.

Sources (2): demo inspection; https://takeielts.britishcouncil.org/take-ielts/prepare/ielts-on-computer/about/highlighting-text ; https://ieltsliz.com/computer-delivered-ielts-pros-cons/ ; https://speechful.ai/blog/computer-based-ielts-reading-practice-test-interface ; https://takeielts.britishcouncil.org/blog/ielts-on-computer-changes-updates

## 6 (partial). Band score tables
### Band scale and overall
- Bands 0-9 with half bands. Labels: 9 Expert, 8 Very good, 7 Good, 6 Competent, 5 Modest, 4 Limited, 3 Extremely limited, 2 Intermittent, 1 Non-user, 0 Did not attempt.
- Overall = mean of the four section bands rounded to nearest half band; .25 rounds up to next half, .75 rounds up to next whole (6.25 -> 6.5; 6.125 -> 6.0; 3.875 -> 4.0). (ielts.org)
- Official anchor points (ielts.org, "average" thresholds out of 40): Listening 16=5, 23=6, 30=7, 35=8. Academic Reading 15=5, 23=6, 30=7, 35=8. GT Reading 15=4, 23=5, 30=6, 35=7.
- Writing criteria: Task achievement (T1) / Task response (T2), Coherence and cohesion, Lexical resource, Grammatical range and accuracy (equal weight; Task 2 weighs double Task 1). Speaking criteria: Fluency and coherence, Lexical resource, Grammatical range and accuracy, Pronunciation.

### Listening raw -> band (same for Academic and GT; widely published, consistent with ielts.org anchors)
| Raw | Band |
|---|---|
| 39–40 | 9.0 |
| 37–38 | 8.5 |
| 35–36 | 8.0 |
| 32–34 | 7.5 |
| 30–31 | 7.0 |
| 26–29 | 6.5 |
| 23–25 | 6.0 |
| 18–22 | 5.5 |
| 16–17 | 5.0 |
| 13–15 | 4.5 |
| 10–12 | 4.0 |
| 8–9 | 3.5 |
| 6–7 | 3.0 |
| 4–5 | 2.5 |
| 2–3 | 2.0 |
| 1 | 1.0 |
| 0 | 0.0 |

### Academic Reading raw -> band
| Raw | Band |
|---|---|
| 39–40 | 9.0 |
| 37–38 | 8.5 |
| 35–36 | 8.0 |
| 33–34 | 7.5 |
| 30–32 | 7.0 |
| 27–29 | 6.5 |
| 23–26 | 6.0 |
| 19–22 | 5.5 |
| 15–18 | 5.0 |
| 13–14 | 4.5 |
| 10–12 | 4.0 |
| 8–9 | 3.5 |
| 6–7 | 3.0 |
| 4–5 | 2.5 |

### General Training Reading raw -> band
| Raw | Band |
|---|---|
| 40 | 9.0 |
| 39 | 8.5 |
| 37–38 | 8.0 |
| 36 | 7.5 |
| 34–35 | 7.0 |
| 32–33 | 6.5 |
| 30–31 | 6.0 |
| 27–29 | 5.5 |
| 23–26 | 5.0 |
| 19–22 | 4.5 |
| 15–18 | 4.0 |
| 12–14 | 3.5 |
| 9–11 | 3.0 |
Note: ielts.org states thresholds vary by test version by about one mark; ielts.org lists GT band 7 at 35 (tables above give 34–35).

Sources (6 band tables): https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail ; https://ielts.com.au/results/ielts-band-scores/listening-band-score ; https://prepedu.com/en/blog/ielts-listening-band-scores ; https://resources.cathoven.com/ielts-reading/band-scores ; https://ielts.com.au/results/ielts-band-scores/reading-band-score

## 3. Listening audio rules, timer warnings, pre-test flow
- **Audio plays once only**, through individual headphones; it **cannot be paused, rewound or replayed** (official demo modal: "You will not be permitted to pause or rewind the audio while answering the questions. To continue, click Play."). No progress bar or seek control is shown; only an "Audio is Playing" status with a speaker icon in the header. A volume control (top right) is the only audio control.
- The recording still contains the usual spoken pauses ("time to look at questions...") before each part and short review pauses after each part; IDP: "Before each Listening part, candidates get time to read the questions. After each part, candidates get time to review their answers."
- **At the end: 2 minutes to check answers** (replaces the 10-minute paper transfer time); "The test stops automatically at the end of this time period." Total Listening 30–34 min. Part 1–4, 10 questions each. Candidates may navigate freely among the 40 questions (nav bar) but should not expect to go back once the module auto-submits.
- **Timer**: countdown clock at top centre of the header ("XX minutes left" style, minutes only; seconds visible on hover per a candidate; seconds not shown in the final minute per IELTS Liz). It **flashes (red) when 10 minutes and 5 minutes remain** in Reading and Writing; one third-party guide claims 5 and 1 minutes. When it hits zero the screen locks "at the precise second", answers are auto-saved and the section ends.
- **Pre-test flow (test centre)**: check-in (ID, photo, finger scan), seated at a workstation with headphones; staff give login credentials; an **information/instructions screen** is shown; a **sound check** ("Confirm you can hear the audio") is done before Listening; candidate confirms name/DOB/candidate number on screen ("if your details are not correct, please inform the invigilator"); then click **"Start Test"**. Listening, Reading and Writing run back to back with no scheduled break; toilet breaks only in Reading/Writing with the timer running (use "Hide"/"Resume test"). IELTS Online adds Inspera Integrity Browser install + pre-system checks 72h before and a remote proctor.

Sources: demo inspection; https://ielts.idp.com/prepare/article-how-computer-delivered-ielts-works ; https://ielts.idp.com/canada/about/which-ielts-test/computer-delivered-ielts ; https://www.ieltspodcast.com/listening/computerbased-listening/ ; https://ieltsliz.com/computer-delivered-ielts-pros-cons/ ; https://www.ielts.ca/?p=22929 ; https://ieltsidpindia.com/blog/exam-day-guide-for-ielts-on-computer ; https://takeielts.britishcouncil.org/what-is-ielts/how-it-works/test-modes/ielts-online ; https://computer.ieltsessentials.com/listening/

## 5. Candidate complaints (keep for realism; optional fixes in practice mode)
- **Reading on screen is tiring**; "losing your place after every scroll is the single most reported annoyance"; detailed reading harder than paper. Fix in practice mode: optional larger text / line focus; keep the two independently scrolling panes in exam mode.
- **Small default text (16px Arial)** and narrow passage pane on small monitors; candidates often do not know the Text size / Contrast options exist. Keep defaults; surface the Options menu in the tutorial.
- **Highlighting is clunky** ("a few clicks", select then click Highlight; some reported it not working, e.g. on certain machines/Macs or if the selection crosses a gap box). **Notes are hidden**: you must open the sidebar or click the highlighted text to read them. Practice mode could show note badges inline.
- **No pause/replay of audio** and only 2 minutes at the end; "attention split between typing and paper notes"; typing-while-listening is hard. Practice mode could allow replay/pause with a clear "not available in the real test" warning.
- **Writing editor**: no spell/grammar check, no visible formatting; one report of **no visible text cursor** and of **copy/paste disabled** at a centre; keyboard layout may be local, not UK/US; noise of other candidates typing.
- **Timer**: minutes only, no seconds in the last minute; screen locks exactly at zero; some are surprised by auto-submit. Practice mode could show seconds and a 1-minute warning.
- **Mis-clicks** on radio buttons/drag targets, and **time lost "working out where to click"** on first attempt (drag-and-drop, "Choose TWO" checkboxes). Keep identical widgets so practice transfers.
- The divider handle is small (36px) and easy to miss; many never resize. Keep it but mention it in the tutorial.

Sources: https://ieltsliz.com/computer-delivered-ielts-pros-cons/ ; https://www.goodreads.com/author_blog_posts/22227003-computer-delivered-or-paper-based-ielts-which-is-better ; https://www.widerai.us/blog/ielts-reading-computer-based ; https://speechful.ai/blog/computer-based-ielts-reading-practice-test-interface ; https://testmimic.com/guides/ielts/computer-delivered-ielts-complete-guide ; https://ielts.idp.com/srilanka/about/news-and-articles/article-mistakes-to-avoid-during-ielts-on-computer

## 6 (rest). IELTS Academic structure facts
- **Listening**: ~30 min audio + 2 min check (CD) ; 4 parts x 10 = 40 questions; 1 mark each. Part 1 everyday dialogue, Part 2 everyday monologue, Part 3 academic dialogue (2–4 speakers), Part 4 academic lecture monologue. Accents: British, Australian, NZ, North American.
  - **Official question types (ielts.org)**: 1 Multiple choice; 2 Matching; 3 Plan/map/diagram labelling; 4 Form completion; 5 Note completion; 6 Table completion; 7 Flow-chart completion; 8 Summary completion; 9 Sentence completion; 10 Short-answer questions. (ielts.org groups 4–8 as "Form, note, table, flow-chart, summary completion".)
- **Academic Reading**: 60 min, 3 passages (2,150–2,750 words total), 40 questions, 1 mark each; no extra transfer time.
  - **Official question types (ielts.org)**: 1 Multiple choice; 2 Identifying information (True/False/Not Given); 3 Identifying writer's views/claims (Yes/No/Not Given); 4 Matching information; 5 Matching headings; 6 Matching features; 7 Matching sentence endings; 8 Sentence completion; 9 Summary completion; 10 Note completion; 11 Table completion; 12 Flow-chart completion; 13 Diagram label completion; 14 Short-answer questions.
  - Word-limit instructions e.g. "NO MORE THAN TWO WORDS AND/OR A NUMBER"; hyphenated words count as one; contractions not tested; capitals accepted.
- **Academic Writing**: 60 min total. **Task 1**: describe a visual (graph/chart/table/diagram/process), **at least 150 words**, suggested 20 min. **Task 2**: essay, **at least 250 words**, suggested 40 min; Task 2 carries twice the weight. On-screen rubric: "You should spend about 20 minutes on this task. Write at least 150 words." / "...40 minutes... at least 250 words." Criteria: Task Achievement (T1) / Task Response (T2), Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy (each 25%).
- **Speaking**: 11–14 min, face-to-face (or video call) with an examiner, recorded. **Part 1** Introduction and interview, 4–5 min. **Part 2** Individual long turn: cue card, **1 min preparation** (pencil and paper), talk **1–2 min**, 1–2 rounding-off questions; 3–4 min total. **Part 3** Two-way discussion, 4–5 min. Criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation (each 25%).
- **Band scale**: 0–9 in half bands per section; overall = mean rounded to nearest 0.5 (.25 up, .75 up). Raw-to-band tables: see section 6 above.
- Results: CD test typically 1–5 days (BC says 1–2 days). From mid-2026 IELTS is computer-only (optional "Writing on Paper" in some markets).

Sources: https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening ; https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading ; https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail ; https://ielts.org/news-and-insights/three-parts-of-ielts-speaking-and-what-to-look-out-for ; https://ielts.org/news-and-insights/updates-to-ielts-test-delivery ; demo Writing rubric

## 4. Official familiarisation resources (summary)
- **IDP/British Council "IELTS on computer familiarisation test"** = Inspera demo (links in 1b): untimed; Listening (4 recordings/40 Q), Academic Reading (3 texts/40 Q), Academic Writing (2 tasks); answer keys below the launcher page; timing, highlighting and notes "work differently" from the live test. Flow: open link -> player loads straight into Part 1 (no login/instructions in the demo) -> Listening shows the headphones modal then "Play" -> answer -> tick button -> "Click next to continue" -> Next exits.
- **British Council video tutorials** (YouTube embeds on takeielts "IELTS on computer" page): Introduction (4_dCncUPBO4), Listening (9E6b55d67sI), Reading (IDYfKnGcei4), Writing (oUCRoj8bBk8), Help button (aAAFFbgWKm0), Highlighting (XQOjhdEg5tg), Making notes (8ZUY2eMFbRc), plus 0hd5GQSBP-s. IELTS Online tutorials: oQQTj6DNCNg, NLyiF897JWE, 9CUhAUe1aYc. Pages: https://takeielts.britishcouncil.org/what-is-ielts/how-it-works/test-modes/ielts-on-computer and https://www.britishcouncil.org.np/exam/ielts/prepare/computer-delivered-tips
- **IELTS Ready Premium** (British Council, free with booking): 40 scored practice tests, model answers, dashboard; a separate web app, not the Inspera look. Cambridge sells CD practice tests via its own platform; no public UI description found.
- **ielts.org sample questions**: https://www.ielts.org/about-ielts/ielts-on-computer/sample-test-questions
