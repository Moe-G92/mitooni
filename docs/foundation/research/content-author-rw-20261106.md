# Reading and Writing authoring checkpoint

Owner: reading/writing author specialist. Model: gpt-6.1-sol, medium. Date: 2026-11-06. Branch: codex/ielts-content-20261106. Scope: twelve original Reading/Writing JSON units only; no source-resource derivation, public release, learner data or external model calls.

## Preflight, before authoring

1. A specialist would separate supported learning from independent transfer, examine ambiguous distractors and unsupported inference, and reserve explicit teacher review rather than equating structural validity with educational validity. Necessary here: evidence-specific keys and criterion-specific revision guidance. Optional future scope: calibrated bands and efficacy experiments.
2. Raw evidence: original authored passages and synthetic data, plus current IELTS primary format pages accessed 2026-11-06. No adjacent licensed resources or BarEx content read. Existing learning-pathways-20261105.md is a contextual lead only.
3. Methods: hand-author six distinct 400–700-word passages and six writing units; trace every reading key to paragraph evidence; use Python JSON parsing and structural/word-count assertions; manually inspect answer-option consistency, numeric data, independent topics and Persian support. Methods fit deterministic reading and qualitative writing; automated checks cannot prove pedagogy.
4. Independent evidence: reviewer can solve each reading item from supplied passage alone, reproduce data comparisons and inspect criterion alignment; strict pipeline checks can reject malformed assets. IELTS teacher/examiner review remains pending, with no band validity or learner-efficacy claim.

## Design decision

Use shorter practice sets, explicitly not full Reading sections. Foundation: concrete chronology and direct contrasts; intermediate: qualified interpretations and methodological limits; advanced: competing claims and inference boundaries. Each has at least seven questions, varied families, and explicit Yes/No/Not given evidence. Training has sequenced teaching anchors; transfer has no advance anchors, distinct topic/family and altered key pattern. Writing uses self-contained accessible synthetic tables, process and map descriptions plus distinct Task 2 demands, with full response tasks and gradual planning in anchors. The schema's wordLimit is a maximum: extended writing therefore uses null, with minimum lengths in English prompt. Feedback exemplars and analysis remain assessment-only, for after submission; no numeric bands. Plain text is accessible but does not verify interpreting a rendered visual.

Alternatives rejected: tiny fixtures lack meaningful evidence; full exams exceed the unit scope; diagrams as inaccessible-only images lose self-contained access. No implementation reuse beyond the approved schema; receiving-language conventions and provenance are shared patterns.

## Primary sources

- https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading — verified distinctions between factual information and writer views, varied question families and completion limits.
- https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing — verified Academic task demands, minimum lengths, connected prose and four assessment criteria.

Observed: official pages available. Inference: graded demand is plausible, not calibrated. Remaining evidence: independent content reviewer and IELTS teacher/examiner approval, learner comprehension testing, rendered chart equivalence and full exam assembly.

## Authoring checkpoint reached

Twelve files authored with `examTrack: academic`. Reading passage word counts (whitespace tokens including paragraph letters): foundation train 445, transfer 443; intermediate train 454, transfer 463; advanced train 476, transfer 477. Each has seven items (42 total). Families represented across the set: multiple choice, factual identification, writer-view identification including YES/NO/NOT GIVEN, matching headings, matching paragraph information, completion and matching sentence endings. Each key cites paragraph-specific evidence. Every reading unit objective is `reading-evidence`.

Writing: six units with two full-response questions each (12 responses), objective `writing-task-fulfilment`. Foundation train: user-count table and discuss-both-views essay; foundation transfer: branching fabric-to-bag process and extent-of-agreement essay. Intermediate train: centre maps and discuss-both-views essay; transfer: journey shares chart and problems/measures essay. Advanced train: related count/share tables and a restrictive-rule agreement essay; transfer: threshold/retest process and advantages-outweigh-disadvantages essay. All figures, places and processes are explicitly synthetic; no inferred real-world evidence. Exact usable chart data are in accessible text. These are individual practice tasks, not a full Reading section or calibrated assessment.

Training units contain three English/Persian teaching anchors: model a decision method, guided planning or item analysis, then independent completion. Transfer has no advance teaching anchors, novel topics and distinct family IDs. Reading key patterns differ across train and transfer. Writing feedback contains original partial exemplar snippets and concrete analysis under all four current criteria, separate from learner stimulus and questions. No numeric band or human approval claim.

Checks actually run: Python 3 JSON parse of all twelve; exact top-level schema fields; unique IDs/families; academic track; teacher pending; seven reading items each; 400–700-word passage range; key/question mapping; all keyed options exist; completion text occurs verbatim and respects maximum; three training anchors and matched Persian IDs; empty transfer anchors; two writing responses, four criteria, empty deterministic key and null maximum word limits. All passed. Initial `python` command was unavailable; reran successfully as `python3`. Author self-check is not independent validation.

Remaining issues for domain review: demand labels are not CEFR/band calibrated; accessible text descriptions do not validate visual interpretation; short passages do not reproduce full-section timing/endurance; seven-item sets do not cover every official question family or every answer class in each family; model snippets are partial, not full benchmark essays. Persian translation and pedagogical progression need teacher review. Pipeline must enforce server-only assessment and post-submission feedback; authoring alone cannot verify that access boundary. No external release, source-resource ingestion or existing Word document edit was performed.

## Substantive revision after independent challenge

Reviewer correctly identified that all six initial Reading passages shared a measurement/confound template. That made transfer narrower than its labels suggested. Replaced all three transfer passages and their entire question sets, preserving unit IDs. This supersedes their initial coverage above. Foundation is now a concrete narrative about a station assistant recovering a notebook and adapting a photograph display (443 words). Intermediate is a descriptive account of a seed house, including spatial organisation, catalogue links and public/working-room functions (479 words). Advanced is an actual argumentative dispute over a missing museum wheel, authenticity, the limit of a functioning reconstruction as evidence, and reversible versus irreversible intervention (479 words). The advanced transfer requires following concessive and conditional reasoning; advanced training remains the original narrower environmental-pilot argument, so its ceiling is still a teacher-review question rather than a calibrated claim.

Each transfer now has eight items; Reading total is 45. New demands include pronoun/reference tracking, narrative chronology/detail, spatial description, main idea and argumentative function, as well as explicit stance. YES/NO/NOT GIVEN remains represented but no longer provides the whole inferential design. All three transfer keys and response order are newly authored. The ambiguous foundation garden q2 no longer exists. The replacement items refer to explicit writer propositions and a genuinely absent universal recommendation.

Refined objectives: all three training units use reading-scan, reading-detail, reading-gist, reading-stance. Foundation transfer uses reading-detail, reading-reference, reading-gist, reading-stance. Intermediate transfer adds reading-scan to that set. Advanced transfer uses reading-reference, reading-gist, reading-stance, reading-detail. Writing remains writing-task-fulfilment. Curriculum owner informed to integrate exact emitted IDs.

Repeated Python checks after revision: all six Reading JSON files parse; passage ranges pass; 45 question/key mappings pass; every keyed option exists; all completion answers occur verbatim within their limits. Independent reviewer informed to redo blind keys against these final transfer texts. Awaiting their substantive response; author self-check does not close independent review.

Independent correction review received: content_independent_review solved all 24 rewritten transfer items blind and agreed with every key. Reviewer found the narrative, spatial/reference and nuanced argument materially diverse, and advanced museum condition/reversibility reasoning substantive with no new key objections. Remaining reviewer limitation: foundation is a 443-word mixed-type strategic practice draft, not verified lower-level calibration. This closes the specific transfer/key objection, not teacher approval, calibration or release approval.

## User correction: licensed-source basis (supersedes earlier approval basis)

The earlier official-format-only authoring was not the requested content basis. Its independent key review cannot approve the new source-derived curriculum. Re-read PDF skill and inspected actual licensed selections read-only. Foundation extraction by pypdf failed because AES support dependency was absent; Poppler extracted the selected pages successfully. Cambridge19 and Cambridge13 selected pages were image-only, so text extraction yielded watermarks only; awaiting/rendering actual page map rather than treating that output as content.

Before re-authoring, observed teaching sequence and chosen transformations: MSF-R01 physical11–15/printed10–14 builds routine vocabulary, simple-present forms and frequency language, skims parallel short profiles then cross-text selects details, controlled completion and synonym recognition. Foundation Reading is therefore being rebuilt as new parallel familiar-routine profiles, with language recognition before matching and completion; the former long inference passage will be removed. MSF-W01 physical15–16/printed14–15 moves from reading/model language into a supported routine description and peer correction. Foundation Writing will start with a short routine paragraph, then provide a separate process-description bridge using MS1-W01 physical13–17/printed12–16: equipment/action language→ordering→present passive→introduction/overview→model analysis→independent150-word task.

MS1-R01 physical9–12/printed8–11 explicitly teaches keyword selection, scan then read around evidence, short answers and correcting wrong/overlong/misspelled responses. MS2-R01 physical9–14/printed8–13 adds skim versus scan, paragraph paraphrase/synonyms and controlled completion before independent task. Intermediate Reading will replace the question sequence with skim/title, paraphrase matching, targeted details and limit-sensitive completion. MS2-W01 physical15–21/printed14–20 starts diagram terminology and key-feature selection, checks inaccurate data/speculation, then teaches change verbs, time forms and adjective/adverb choices. Intermediate Writing will use new chart data with feature selection/data-error repair, then complete report, instead of map work unsupported by these selected chapters.

MS3-R01 physical10–15/printed8–13 teaches topic sentences, whole-paragraph main ideas, qualifier-sensitive distractor elimination, paragraphs without explicit topic sentences and prefixes. Advanced Reading will be rebuilt around those operations with new heading distractors and contrastive qualification, not reuse a generic causal-inference set. MS3-W01 physical16–20/printed14–18 evaluates flawed/revised graph responses, TA omissions/inaccuracy/speculation and objective adjective/adverb choice. MS3-W02 requested physical40–43/printed38–41 actually inspected: prioritise advantage/disadvantage ideas, develop topic/support sentences by function, repair cohesion markers, state/weigh position and complete a250-word response. Advanced Writing will explicitly analyse/repair a new flawed report and produce an independent report plus an argument requiring developed support.

Rendered and visually inspected selected pages Foundation15, Level1 15, Level2 16, Level3 12 at1200px, verifying the actual tables, exercise grouping, highlighted frequency words, overview/model distinction and heading-qualifier tasks. Only selected temporary PNGs/excerpts in /private/tmp; no originals copied into repo/assets. Canonical source-index will own SHA and exact boundaries; per-unit provenance records specific transformations, not retrofitted bibliography. No source passages, source task answers or source illustration assets will be copied; new surface contexts are authored from the observed progression. Publisher bands are not equivalence/calibration claims for our units.

## Final actual-semantic source rebuild (supersedes both earlier drafts)

The source-domain fiction was also rejected during independent challenge: using a similar subject did not preserve the actual licensed example relationships. Replaced it with faithful paraphrases/adaptations of actual selected source content. This section is the current authoring basis. Earlier unrelated fiction and source-topic-only drafts are not the reviewed edition.

Reading now uses actual Nina/Ava/Michael profiles; Dan and household chores; Antilia; Hearst Castle; Auroville/Longyearbyen/Marloth/Hallstat relationships; and Cahokia. Actual names, routines, figures, property features, contrasting views, source uncertainty and causal limits are retained. New questions, grouping and wording are authored. Dated source accounts are labelled as course accounts, not updated travel/regulatory/property/archaeological evidence. Foundation no longer carries an unsupported400-word demand: it uses short integrated language profiles. All six sets contain eight items (48total). Advanced has surplus headings with independently ordered keys and plausible qualifier/inference errors.

Writing uses actual Dan routine and Julia Grant Fiji picture activities; stringhopper and cherry-jam stages; actual international and European housing-size values; actual migration-reason graph1990/2000/2010; and actual free-health-care/life-expectancy Task2 topics. No compote/soup, synthetic housing data or future migration projections remain. Julia activity pictures were directly rendered atphysical16; clock times/frequency are not invented. Source housing means were reconstructed as tables because separate country averages are not component shares; that source-visual repair is explicitly stated. Foundation short paragraph plus fullTask1 bridge, intermediate preparation+fullreport, advanced train fullTask1+Task2 and advanced transfer paragraph-development+fullTask2 remain separately labelled.

Additional inspection: Cambridge21Academic physical18/printed16 Reading page and physical31/printed29 Task1 page rendered and inspected for authentic presentation/task limits. They are supplementary format evidence, not falsely credited as semantic inputs to these units. BD-W01physical1–2 inspected: older UCLES2005 public descriptors, used for four qualitative dimensions only; not represented as current calibrated band descriptors. Current official IELTS format/criteria verified earlier remain the current check.

Final strict check: backend .venv Python validated all12against AuthorUnit, including objective/source mappings and deterministic-key coherence; all completion answers occur verbatim and respect limits. A first run exposed questionId spacing introduced by a text-spacing cleanup; repaired identifiers and reran successfully. No learner attempt or efficacy evidence, band calibration or teacher approval is implied.

### Frozen unit hashes for fresh review

- fnd-reading-train v2: `ab7cfcb23edf7a63d3e8522c28fb01a5f224072fd465943f8299bc03c3f8285f`; family `source-msf-three-student-routines`.
- fnd-reading-transfer v2: `1304ca055c7b884ec04c72da88038886027f8c9b09ccce2a6aed8a74a57e0011`; family `source-msf-dan-and-household`.
- fnd-writing-train v2: `acaadee1c9a4187eb56b7b3d8eb52329a2e7747ddbeb87b6c24f080a46f7a7fa`; family `source-msf-dan-ms1-stringhoppers`.
- fnd-writing-transfer v2: `0157eadfec9028fa62291bcc24e3d7bcf65796a02cb82b1d38937f28ec8e682e`; family `source-msf-julia-ms1-cherry-jam`.
- int-reading-train v2: `cb8682e1391123d6405bbad3f019afb692e8de1de7253afb9c2b8e12653e244a`; family `source-ms2-antilia`.
- int-reading-transfer v2: `285359d320afacda0e001e47504d2027836bc67db99d814256185adb00584813`; family `source-ms2-hearst-castle`.
- int-writing-train v2: `c7c1fc5704e1ae7e984d94dff507c8698beb553364a0e81dfea0e55fecdcd24e`; family `source-ms2-world-housing-means`.
- int-writing-transfer v2: `211d321f6c0cd325f5bee4d9727a1742124f2db43058fed3cc8e8d554611e0bd`; family `source-ms2-europe-housing-means`.
- adv-reading-train v2: `0f5c0708658b671a8b6d2f60cc23bf21f9e82d14ed4a410af369925d6fb3dcf9`; family `source-ms3-unusual-places`.
- adv-reading-transfer v2: `9cfd406c1581c33bead37ab879edc1573281d737f8c6bf26de5540fc9f0441d5`; family `source-ms3-cahokia`.
- adv-writing-train v2: `86887ae1b86297d470769252664c0df9ca8b5018f0ed05f0dfd9bce681d1ebd4`; family `source-ms3-migration-free-healthcare`.
- adv-writing-transfer v2: `3cbb6710117ae4b2b312578b398b8480758c4236826ef77dbf633422326351b9`; family `source-ms3-life-expectancy`.

### Canonical selected source identity snapshot

- MSF-R01: `Mindset for IELTs Books/Mindset-For-IELTS-Level_Foundation [www.languagecentre.ir].pdf`; file SHA256 `b7fc05cf7eeb8bbf42563e3b1c36d2ed82778120f05020f266d65caf312d12e5`; physical PDF pages 11,12,13,14,15. Canonical source-index records excerpt SHA/boundary.
- MSF-W01: `Mindset for IELTs Books/Mindset-For-IELTS-Level_Foundation [www.languagecentre.ir].pdf`; file SHA256 `b7fc05cf7eeb8bbf42563e3b1c36d2ed82778120f05020f266d65caf312d12e5`; physical PDF pages 15,16. Canonical source-index records excerpt SHA/boundary.
- MS1-R01: `Mindset for IELTs Books/Mindset-For-IELTS-Level_1 [www.languagecentre.ir].pdf`; file SHA256 `0ab70afb6fa6ef387edf57459e180054052a4e468e36bc6a56ebc3a012b4eb3a`; physical PDF pages 9,10,11,12. Canonical source-index records excerpt SHA/boundary.
- MS1-W01: `Mindset for IELTs Books/Mindset-For-IELTS-Level_1 [www.languagecentre.ir].pdf`; file SHA256 `0ab70afb6fa6ef387edf57459e180054052a4e468e36bc6a56ebc3a012b4eb3a`; physical PDF pages 13,14,15,16. Canonical source-index records excerpt SHA/boundary.
- MS2-R01: `Mindset for IELTs Books/Mindset-For-IELTS-Level_2 [www.languagecentre.ir].pdf`; file SHA256 `393720e617f31940e5da07e94b7ce5f44e77120f7e2d9d75c67b15c3c7e041fc`; physical PDF pages 9,10,11,12,13,14. Canonical source-index records excerpt SHA/boundary.
- MS2-W01: `Mindset for IELTs Books/Mindset-For-IELTS-Level_2 [www.languagecentre.ir].pdf`; file SHA256 `393720e617f31940e5da07e94b7ce5f44e77120f7e2d9d75c67b15c3c7e041fc`; physical PDF pages 15,16,17,18,19,20,21. Canonical source-index records excerpt SHA/boundary.
- MS3-R01: `Mindset for IELTs Books/Mindset-For-IELTS-Level_3 [www.languagecentre.ir].pdf`; file SHA256 `529e37b5094aeb010cffaeee8ca05b743e672d26549c17585e707d58432e4f53`; physical PDF pages 10,11,12,13,14,15. Canonical source-index records excerpt SHA/boundary.
- MS3-W01: `Mindset for IELTs Books/Mindset-For-IELTS-Level_3 [www.languagecentre.ir].pdf`; file SHA256 `529e37b5094aeb010cffaeee8ca05b743e672d26549c17585e707d58432e4f53`; physical PDF pages 16,17,18,19,20. Canonical source-index records excerpt SHA/boundary.
- MS3-W02: `Mindset for IELTs Books/Mindset-For-IELTS-Level_3 [www.languagecentre.ir].pdf`; file SHA256 `529e37b5094aeb010cffaeee8ca05b743e672d26549c17585e707d58432e4f53`; physical PDF pages 40,41,42,43. Canonical source-index records excerpt SHA/boundary.
- BD-W01: `Band Descriptors/IELTS_Writing_Band_Descriptors.pdf`; file SHA256 `470cbcb8e4128763e3cd4d27215bb51511616ba50ef2c7c2fcc64ed33a40bc44`; physical PDF pages 1,2. Canonical source-index records excerpt SHA/boundary.

Physical/printed offsets: Foundation/Levels1–2 physical minus1; Level3 physical minus2. BD-W01 has two physical pages labelled Task1/Task2 rather than running page numbers. Per-unit objective mappings contain observed learning point, teaching connection and task transformation. All mappings refer only to canonical inspected sources.

### Semantic exposure map

Foundation Readingtrain: Nina, Ava, Michael; transfer: Dan + household chores. Foundation Writingtrainq1 reuses Dan from Readingtransfer, q2stringhoppers; Writingtransferq1JuliaGrantFiji, q2cherryjam. Intermediate ReadingtrainAntilia/transferHearst; Writingtraininternational housing means, transferEuropean housing means. Advanced Readingtrainfour unusual places/transferCahokia; Writingtrainq1migration graph, q2freehealthcare; Writingtransferbothquestionslifeexpectancy. Migration graph also appears in the Writing mock, so it cannot be treated as unseen after this unit. Same source semantics across activities must share exposure groups even when unit family composites differ. Curriculum owner received per-question map; no fresh-transfer or heldout claim may be inferred from changed wording alone.

### Fresh actual-source independent review and transfer correction

Independent reviewer re-solved all48Reading items blind and agreed with all48keys, and traced actual semantic facts to raw selections. Writing values/process/health topics were independently checked against raw source with no data/arithmetic objection; reviewer agreed the housing-average table repair was appropriate. Reviewer found teaching leaked into transfer passage prose despite empty anchors. Removed task-directed paraphrase/heading-elimination comments from intermediate and advanced Reading transfer; retained expository source facts/uncertainty. Removed all planning/idea suggestions from advanced Writing transfer stimulus. No question/key changed. Awaiting confirmation of these specific removals.

Superseding hashes after transfer correction: int-reading-transfer `3b9aab54c7f1aa3888453f1d985536e4290c57d6ccc95de431acae67b189bfba` (420words); adv-reading-transfer `cfb5f67047c0038bdaa1d0ed8cf9a93a44c2ec892dbb7a15ac2d0dfbfb4a469f` (409words); adv-writing-transfer `80b654b085b6dac77d0f9e81167c9b4c996549a45d27091e794dc186fba25cec`. Other frozen hashes above remain current. Repeated all12 strict AuthorUnit checks after removal: PASS. Independently recomputed SHA256 for all five actual licensed files behind ten used source refs: all match the canonical index. Foundation text lengths238/195words intentionally follow source-based developmental design; longer practice texts are not forced onto beginners. No claim of fullmock coverage, band calibration or human teacher approval.

Julia visual review correction: replaced an unsupported classroom setting with “working or studying at a table”; the open-sided laptop/table image does not establish a classroom. Independent visual reviewer requested this correction.

### Current final12hash snapshot (supersedes every earlier hash)

- fnd-reading-train: `ab7cfcb23edf7a63d3e8522c28fb01a5f224072fd465943f8299bc03c3f8285f`
- fnd-reading-transfer: `1304ca055c7b884ec04c72da88038886027f8c9b09ccce2a6aed8a74a57e0011`
- fnd-writing-train: `acaadee1c9a4187eb56b7b3d8eb52329a2e7747ddbeb87b6c24f080a46f7a7fa`
- fnd-writing-transfer: `daf2bf4e8bbc91622394f71f3ca3c23bc79b976103ee7d1a35b4db9e2e791130`
- int-reading-train: `cb8682e1391123d6405bbad3f019afb692e8de1de7253afb9c2b8e12653e244a`
- int-reading-transfer: `3b9aab54c7f1aa3888453f1d985536e4290c57d6ccc95de431acae67b189bfba`
- int-writing-train: `c7c1fc5704e1ae7e984d94dff507c8698beb553364a0e81dfea0e55fecdcd24e`
- int-writing-transfer: `211d321f6c0cd325f5bee4d9727a1742124f2db43058fed3cc8e8d554611e0bd`
- adv-reading-train: `0f5c0708658b671a8b6d2f60cc23bf21f9e82d14ed4a410af369925d6fb3dcf9`
- adv-reading-transfer: `cfb5f67047c0038bdaa1d0ed8cf9a93a44c2ec892dbb7a15ac2d0dfbfb4a469f`
- adv-writing-train: `86887ae1b86297d470769252664c0df9ca8b5018f0ed05f0dfd9bce681d1ebd4`
- adv-writing-transfer: `80b654b085b6dac77d0f9e81167c9b4c996549a45d27091e794dc186fba25cec`

Independent review closed the correction checkpoint in `content-independent-review-20261106.md`, section “Final actual-source revision: bounded agreement”. Reviewer confirms all48AcademicReading blind answers and final source-semantic relationships, Writing process/data/task fidelity, and final removal of transfer coaching/unsupported Julia classroom interpretation. Reviewed final hashes match the latest snapshot above. Agreement applies only to the internal teacher-review edition; teacher approval, calibrated level/band evidence, complete media/visual equivalence and full-corpus coverage remain outstanding. No go-live or release approval is claimed by this authoring assignment.
