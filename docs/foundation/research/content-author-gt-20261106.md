# General Training original-content checkpoint — 6 November 2026

Owner: author_general_training specialist, gpt-6.1-sol / medium. Branch: codex/ielts-content-20261106. Read ~/Projects/AGENTS.md and app/AGENTS.md. Assigned only twelve gt reading/writing unit files and this record. No resource corpus, learner data, environment files, external model, publication or database actions.

## Preflight before authoring

1. A professional author would audit every claim against exact text, distinguish absent evidence from contradiction, and check each letter’s reader, purpose, register and all three requirements. Independent transfer must test a new situation without teaching scaffolds or a repeated key sequence.
2. Rawest material: official IELTS General Training Reading and Writing format specifications, fetched 2026-11-06, and actual existing unit JSON/schema design. All passages, prompts and examples are newly authored. No licensed questions are adapted.
3. Methods: primary-source format check; original stimulus and item authoring with explicit evidence rationales; contrastive train/transfer topics; private annotated exemplars and revision prompts; JSON parsing, question/key and word-count checks. These test both instructional integrity and importability.
4. Independent evidence: another reviewer can derive each key solely from its passage, reproduce the structural checks, verify official task formats and inspect all letter bullets/registers. IELTS teacher/examiner judgment remains pending; no band claims.

## Design and plan

Foundation: daily notices plus personal letters. Intermediate: two workplace texts per reading unit plus semi-formal letters. Advanced: general-interest arguments with writer-view questions plus formal letters and a separate Task 2 essay. Reading units are deliberately shorter preparatory sets, not full sections. Every transfer has a new topic and family; teaching anchors absent. Writing criteria follow Task achievement/Task response, Coherence and cohesion, Lexical resource, Grammatical range and accuracy. No scores or invented bands.

Reused pattern: existing fnd-reading-train.json exact structural envelope only, adapted with General Training track/pathway metadata and original content. No cross-project code/data reused.

## Primary evidence

- https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-reading — everyday, workplace and longer general-interest texts; factual and writer-view distinctions; matching, headings and bounded completion.
- https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing — Task 1 letters vary by relationship/register, have three requirements and a 150-word minimum; Task 2 requires at least 250 words. Four criteria distinguish Task achievement from Task response.

Observed: official format pages accessible on the research date. Inference: the proposed progression offers increasing preparatory demand; it is not calibrated to bands. Unavailable: teacher review and learner trials. Publication/approval are outside this assignment.

## Validation

Authored and frozen for independent review: twelve units; six Reading stimuli of 426–472 whitespace-delimited words, seven items each (42 total); six Task 1 letters covering personal, semi-formal and formal relationships in three train/transfer pairs; advanced units also contain separate Task 2 essays (eight writing responses total). Every transfer has a distinct family/topic and no teaching anchors. Teacher status remains pending with empty notes.

Checks actually run: Python parsed all twelve JSON files; exact top-level envelope and question keys; IDs/file names and track; question/key coverage, valid option IDs, exact text presence and word limits for completion keys; 400–650-word reading range; three letter bullets and 150-word instructions; advanced second response with 250-word instructions; distinct train/transfer families and stimuli; corresponding Persian anchor IDs and empty transfer anchors. All passed. No runtime ingestion, browser display, learner trial or teacher calibration was run by this author.

Independent blind Reading review reported 42/42 agreement with the keys. Reviewer identified a material ambiguity in gt-int-reading-transfer/q3: the original shared-action wording could include the shift-exchange form as well as cash counting. Changed prompt to “Which text requires two employees to count money together?”; key remains Text B. This limits the claim to explicit evidence. Requested independent reinspection and Writing review; final reviewer decision pending.

Restart: inspect only assigned gt files, rerun structural checks after any edit, and request reinspection of changed items. Coordinator owns package integration and engineering verdict. These are original preparatory units, not full exam sections, calibrated bands, teacher approval or public release.

Independent Writing review found purpose/register/compound coverage and Task 1/2 criteria substantive and no band fabrication. Reviewer identified one Persian train anchor carrying examples from the separate transfer topic; replaced gt-int-writing-train plan anchor with exact missed-lessons task demands (work change, missed sessions, coursework effect, practical catch-up request). This preserves bilingual alignment and transfer separation. Reviewer notified for final hash verification.

## Corrected intake — source-based requirement

Coordinator relayed Arash’s explicit correction: the whole corpus must be grounded in supplied licensed sources, and selected-excerpt AI processing is authorized. Earlier original-only freeze is withdrawn and units held. The prior material is format-informed draft only, not accepted source-based curriculum. PDF skill read explicitly; sources remain read-only outside app and no PDF/page assets will be copied to public outputs.

Revised preflight: (1) establish a source learning point and teaching/assessment connection before adapting any question, rather than append a bibliography; (2) use selected actual Cambridge GT test pages and actual Mindset instructional pages, with file/page/excerpt hashes supplied by source reviewer; (3) inspect bounded text and rendered layouts, write source observations, then change objectives, anchors, task sequences and question mechanics with original contexts; (4) source hashes/page mappings plus independent content review can demonstrate provenance and alignment, but cannot establish teacher approval or calibrated demand. Waiting for exact page assignments before dependent authoring.

## Observed source learning points, before revised authoring

Read bounded text from Cambridge 19 General Training Test 1 PDF16–30. Reading has a service FAQ testing agreement/contradiction/absence; several comparable short reviews with re-usable matching letters; two workplace advice texts whose sentence/note completions require one word and a grammatical fit; a five-section general-interest text with a shared overcomplete headings list, one-word summary and author-purpose MC. Writing PDF29 requests a letter to a known employer with reason, a precise proposed arrangement and a benefit for that reader. PDF30 asks separately for a cause and an evaluation, so one developed opinion alone does not satisfy both. Actual pages29, Mindset Foundation14 and Mindset3 page11 rendered and visually inspected in temporary storage, not public assets. Cambridge PDF27–28 also extracted separately to check completion and final MC layout.

Read Mindset Foundation PDF11–16: everyday verb/collocation activation; skim a set of short descriptions; distinguish similar facts appearing across texts; present simple agreement/frequency; completion and sequenced description; peer correction. Foundation PDF14 visual confirms that the warning concerns cross-text ambiguity, not merely keyword lookup. Read Mindset Level2 Reading PDF9–14: differentiate global skimming from detail scanning, paraphrase before retrieval, predict grammatical answer shape and respect bounded word counts. Read Mindset Level3 Reading PDF10–15: a heading covers a paragraph’s full central claim; an opening sentence can mislead; qualifier adjectives/adverbs eliminate distractors; topic sentences may be absent. Read Mindset Level1 Writing PDF13–17 to check transferable sequencing/scaffolded-model language; its Academic process task is explicitly not a GT letter. Only temporal sequencing/controlled-to-independent practice is transferable; no process overview requirement is added to letters.

Chosen adaptation before editing: foundation retains novel practical notices but adds present-simple/frequency language work, comparative cross-notice matching and an explicit condition contrast. Intermediate replaces generic mixed items with workplace sentence/note completion whose grammar and one-word limits exercise observed GT Section2 demands. Advanced moves to a single shared list of eight headings for five labelled paragraphs plus author-view/summary items; distractors will test paragraph purpose and scope, not only nouns. New contexts, facts and evidence keys remain original. Letters will be substantively reworked around reason→precise arrangement→reader consequence, with personal/semi-formal/formal register variation and new recipient-aware compound demands. Advanced essays will adopt the observed two-part cause-plus-evaluation demand rather than retain an unrelated generic discussion format. Foundation language support starts from controlled tense/time/collocation contrasts before full letters; transfer contains no teaching anchors.

Unavailable: source-index exact final entry IDs/hashes are owned by licensed_source_review and will be linked only after confirmation. No original item is claimed teacher-approved, and novel contexts are not official Cambridge questions.

## Final semantic source reauthoring checkpoint

The first adaptation plan above was further challenged by source reviewer/coordinator: methods-only influence with unrelated invented passages was insufficient. That provisional pass is superseded. Before the final pass, directly read Cambridge19GT PDF39–53, then separately re-read PDF45–46,47–48,25–26 in bounded outputs. Corrected an initial navigation-level mistaken label: PDF45 is work-life balance, not salary negotiation. Final material uses the actual observed work-life content. Additional R02/W02 index entries requested for distinct transfer families.

Final source-to-unit substance:
- Foundation train: CG19 PDF16–17 tram FAQ. Retains reviewed schedules, machine failure/reporting, ticket constraints and bicycle permissions. New paraphrased prose and cross-section/gap/factual statements. Transfer: PDF18–19 sweater accounts, preserving colour expectation, usual/purchased/exchanged sizes, abandoned return intention and possible animal damage. New questions and evidence. No old community-centre/ferry/parcel facts remain.
- Intermediate train: PDF20–23 leadership/resignation. Retains trust, clear goals/strategy/deadlines, pride/history/risk; manager meeting, task statuses, reference, documentation and handover. Transfer: PDF43–46 care-worker visits and work-life advice. Retains dressing/conversation/housework/meals/outings/medication and workstation/break/target/prioritisation/holiday relationships. Sixteen newly written one-word sentence/note questions, preserving actual source relationships. No old repair-workshop/visitor-centre policies remain.
- Advanced train: PDF24–28 emoji argument. Retains early expansion/cultural visibility, identity/concepts, emotional framing, update-linked limitation and societal significance. Transfer: PDF47–51 historical Leeds/Henry report, distinguishing repeated measurements from uncertain causation, bounded choice, participant experience and preventive support. New shared eight-heading lists, view items and one-word summary gaps. No old shopping-street/repair-cafe essay remains.
- Writing: CG19 PDF29 work/study-hours request and PDF52 international food-event offer supply actual scenarios, bullet functions and reader relevance. Relationship/register is deliberately varied; the foundation study-schedule letter transparently reverses the source work/study timetable conflict for a friend. Advanced essays paraphrase actual PDF30 photographic-tourism and PDF53 outsourcing two-part questions. Earlier six unrelated letter contexts and generic essays removed.

Mindset contributions: Foundation routine/collocation→cross-text discrimination→present-simple/frequency→completion→sequenced description is instantiated in controlled original examples before full task practice. Level2 skim/scan/paraphrase/grammar-fit support shapes intermediate completions. Level3 full-paragraph/topic/qualifier teaching shapes advanced headings. Every unit now has three source-to-objective mappings, plus one essay mapping in each advanced Writing unit (38 total). Every source ref is a source-index entry ID. No invented scores, source answer keys, source scans or audio are included.

Checks executed after final semantic rewrite: current AuthorUnit Pydantic model accepts all12; all38 declared objectives have exactly one mapping; 46 Reading items have complete key bindings; short-text answers occur verbatim in passage and fit stated limits; Reading stimuli 426–462 words after subtitle correction; six letters retain three compound bullets/150 minimum and two essays retain two questions/250 minimum; transfer anchors empty, distinct source subfamilies. Package-level source-ref resolution awaits R02/W02 index integration.

Independent blind re-solve reported all46 Reading keys agree. Reviewer found advanced paragraph subtitles leaked heading answers; removed all semantic subtitles in both advanced texts, retaining A.–E. only. Keys unchanged and new word counts428/447. Independent raw-source comparison and final reviewed hashes pending. Teacher review still pending; this is no release/teacher approval.

## Source-pool allocation challenge, before final letter diversification

Coordinator/reviewer correctly rejected reusing two letter scenarios across six units: different names, relationship or unit IDs do not make a semantically unseen transfer. Earlier two-scenario letter pass held. Arash now explicitly authorizes full supplied-corpus model processing; selected-anchor boundaries describe actual reading, not an artificial cap on source discovery. No whole-corpus-read claim is made here.

Before another letter rewrite, examined the broader actual task pool: Cambridge19GT Test3 letter is physical/printed74 (rental extension after five months of a six-month agreement; requested duration, changed plans, apartment problem); Test4 letter physical/printed97 (two years in current job; learning so far, company benefit of internal department move, wish to stay). Embedded text for these pages is image-only, so rendered and read the actual task pages. Navigation initially rendered75/98, which are the adjacent essay pages; corrected to74/97 before choosing letter objectives. Cambridge18GT Test1 letter physical31/printed29 (friend’s college project on New Year, importance/customs/personal preference); Test2 letter physical56/printed54 (upcoming three-month work experience, gratitude/learning goals/questions). Read text and visually verified both Cambridge18 pages, including the +2 physical/printed offset.

Allocated six different actual letter scenario families before authoring: foundation train food event CG19T2; foundation transfer New Year friend’s project CG18T1; intermediate train study/work hours CG19T1; intermediate transfer rental extension CG19T3; advanced train internal department move CG19T4; advanced transfer work experience CG18T2. Preserve real task semantic demands rather than substitute unrelated fiction. Advanced secondary essay families remain separate: CG19T1 selfie tourism versus CG19T2 outsourced tasks. Request new exact hashed index anchors from licensed_source_review. Distinct first-set source families do not prove an individual learner has never seen the licensed source; exposure history must still gate independent mode.

## Diversified letter implementation and final author checks

Actual allocation implemented with six stable semantic family IDs (not six filenames for two topics):
- gt-fnd-writing-train/q1: cg19-t2-food-event, CG19-W02, PDF52.
- gt-fnd-writing-transfer/q1: cg18-t1-new-year-project, CG18-W01, PDF31/printed29.
- gt-int-writing-train/q1: cg19-t1-study-work-hours, CG19-W01, PDF29.
- gt-int-writing-transfer/q1: cg19-t3-rental-extension, CG19-W03, PDF74.
- gt-adv-writing-train/q1: cg19-t4-internal-transfer, CG19-W04, PDF97.
- gt-adv-writing-transfer/q1: cg18-t2-work-experience, CG18-W02, PDF56/printed54.
- Advanced q2 additional semantic exposure: cg19-t1-selfie-tourism for training (CG19-W01/PDF30); cg19-t2-outsourced-tasks for transfer (CG19-W02/PDF53).

These activity-level source families are supplied to the curriculum/exposure owner. AuthorUnit remains strict and uses familyId for the primary letter; secondary essay source refs/mappings remain explicit. Prior exposure to the original licensed source or any adaptation in the same semantic family must prevent an unseen claim. A new character or wording never resets exposure. Six distinct first-set letter families do not establish personal source-naivety.

The New Year letter preserves importance/customs/preference, rental letter preserves exact original tenancy chronology plus extension/reason/problem, internal move preserves existing learning/company benefit/staying motive, and placement letter preserves three-month future placement plus gratitude/learning/questions. New private snippets and language anchors align with each actual task. No prior food/work-study bullet remnants are used to assess these four revised letters. Foundation Reading transfer descriptive labels also removed because a label such as “customer who exchanged a size” could bypass cross-text reading. Its labels are now A.–E. only, like advanced paragraph labels.

Final author validation executed with the actual backend .venv Python and AuthorUnit/SourceIndex Pydantic models: 12/12 units accepted; all refs resolve in the 41-entry source index; all38 objectives mapped; all46 reading questions keyed; all short-text answers literal and within limits; six letter families unique; three bullets/150-word minimum in all letters and two separate essays/250-word minimum; transfer anchors empty. Reading word counts: foundation426/442, intermediate427/431, advanced428/447. These validate authoring structure and evidence bindings, not learner runtime or teacher judgment.

Independent final reinspection requested for the four new letter sources and subtitle removals. Stop at this checkpoint until reviewer/coordinator integrates evidence; no publication or teacher approval is granted here.

Independent reviewer confirmed all six current letter scenarios against actual sources, including visual CG19 physical74/97 and CG18 physical31/56; correct source demands retained with explicit relationship adjustments. Cross-path repeated-letter objection resolved for this snapshot. Reviewer also confirmed foundation review labels removed, and qualitative feedback remains bounded with no band claims. Authoring frozen pending coordinator integration and final reviewer hashes.

Final canonical unit SHA-256 (UTF-8 JSON sorted keys, compact separators, ensure_ascii=False):

- gt-adv-reading-train: 740ad7b5882b8f06bfd808ddb39d297ceed2dabead38ba9a3ca3c68bb54302e9
- gt-adv-reading-transfer: 9d80caa0a39040c29dab0094e5f37b3e0e07994d80452f31929ea99836d82b65
- gt-adv-writing-train: 0a3ef80163ab059d49f03941c0655c79a0ea79478772086510e66aca4e494c86
- gt-adv-writing-transfer: ef394a17f193d27f66ac299b01982f8d79a6696aa6e98e47faa6b5df327d67a3
- gt-fnd-reading-train: 38b72b15fc5ea2815a521941b57eb152f6e1747aba37e96e177dd2927718af7a
- gt-fnd-reading-transfer: 2cca33170de6eb0c0365799814f6cf3e7bbc490f0a12286bc40044c34528684d
- gt-fnd-writing-train: e8f60a295a5d63d3ff7bdf7f3825853544c0dcd99d28a8e26386153fd3a56c9c
- gt-fnd-writing-transfer: a7e47129999df780838ad3aa0bf360b6ca9be9c79adf13ff02d2c41a6e8561e1
- gt-int-reading-train: 9e55cc6d123fefef821477f4643c98b81f73d31361d8043581fffd56f711b54f
- gt-int-reading-transfer: 1547f9225d945e7de37f913a112d643ab4a2114f716263c7173198d04508adf5
- gt-int-writing-train: 8c098e3c67578076acb61091c4a6248b8edc69e12979b2dc5203eaa182cb1703
- gt-int-writing-transfer: 2945e5d4b7bd92746784af864ff73a8d341174b2822dbd65b856c0752c6bf838
