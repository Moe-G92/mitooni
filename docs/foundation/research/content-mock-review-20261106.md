# Independent mock content review — 6 November 2026

Current outcome: final semantic source review completed; 18 static tests pass. Human teacher approval and operational readiness remain pending. Academic Reading has a disclosed blind-review contamination limitation. See final checkpoint and hashes below.

Owner: independent content reviewer; branch `codex/ielts-content-20261106`. Scope: four original Academic mock JSON files plus independent static content tests. Root and app AGENTS.md read explicitly. No runtime, database, environment, external upload, learner or licensed resources touched.

## Preflight and evidence plan

1. An assessment professional independently answers questions before reading keys, challenges distractors/absence claims and separates paper validity from recorded delivery, examiner interaction and psychometric calibration. These foundations are necessary; no extra product scope is implied.
2. Raw materials are original mock stimuli and questions with keys, evidence and rationales stripped before first inspection, plus current official IELTS format and assessment specifications. Existing author summaries are leads, not validation.
3. Use a sanitising Python projection before displaying Reading/Listening; record independent answers with supporting words in scratch and this review, then compare keys; inspect ambiguity, task terminology, answer limits and ordered listening evidence. Use pytest against actual JSON artifacts for structural and evidence-integrity regression protection. Independently inspect Writing visual data and Speaking delivery requirements. No external corpus or source content reused.
4. Independent evidence is reproducible blind answer agreement with exact source support; 3 Reading passages and 2150–2750 words/40 questions; 4 Listening parts and ordered 40 items; complete Writing tasks/data; Speaking 3 parts and 11–14 minutes with human interaction. Audio, teacher review and response-level calibration require future evidence and cannot be established by static JSON tests.

## Design checkpoint

Choose direct source review and a small static suite, rather than importing runtime validators (which could repeat the same defect). Missing assets must fail tests, not skip. Save sanitized views and blind answers under `/private/tmp/mitooni-mock-review-*`; content corrections belong to authors. Initial observed state: four mock JSONs not yet present. Stop before key reveal until the independent answers are saved. Pending: author completion, sanitized blind solves, key reconciliation and actual schema-based checks.

## Official evidence checked 6 November 2026

- [Reading](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading): three sections; 2150–2750 words; 40 questions, 60 minutes; factual information uses TRUE/FALSE/NOT GIVEN, writer views/claims YES/NO/NOT GIVEN; do not substitute external knowledge for missing evidence.
- [Listening](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening): four parts of ten, answer evidence follows item order, heard once; everyday dialogue/monologue then education dialogue/academic monologue; recorded duration and acoustic validity cannot be inferred from script counts.
- [Writing](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing): two tasks, 60 minutes; Task 1 describes displayed visual information, minimum 150 words; Task 2 minimum 250 words and twice the weighting; assessment requires task achievement/response, coherence/cohesion, lexical resource and grammatical range/accuracy.
- [Speaking](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking): examiner interview, recorded, three parts, 11–14 minutes; Part 2 preparation and long turn; interaction matters, so script-only practice is not a complete simulation. Fluency/coherence, lexical resource, grammar and pronunciation are distinct criteria.

Status: review in progress; no approval. Human IELTS teacher/examiner review remains pending.

## Academic independent findings

Observed: sanitized Reading and Listening projections were read before answer fields. The sanitizer recursively removed keys containing answer/evidence/rationale/explanation/teacher and literal key/keys. Independent responses plus source spans were saved before key reveal. Reading and transcript-based Listening each agreed on all 40 keys. This is no claim of final-audio listening performance.

Reading Q26 originally combined comfort and concentration as if recorded on one scale. Reported to coordinator; author corrected to `Comfort was recorded on a ______ from concentration.` The answer remains `separate scale`; reinspection accepts the correction. NG item 3 supplies equipment purpose but no supplier; NG item 29 allocates discussion time but gives no pay view. Other factual/author-view response categories, heading non-reuse and completion limits are consistent.

Writing: all three table columns independently total100%; car55→38 remains largest; bicycle8→20 largest increase12points; bus25→28; walking12→14→14; non-car45→62. Full table data, two task prompts,60min,150/250minimums and1:2weighting are present. Rendering/runner untested. Speaking: three parts,660–840seconds,60s preparation,120s maximum long turn; familiar interview, personal object cue and related abstract discussion are coherent. Responsive human interviewer and original audio explicitly required; runtime unsupported. No timed administration observed.

Eight static tests passed using `.venv/bin/python -m pytest tests/test_content_assets.py -q` in platform/backend. An earlier edit command used an incorrect relative path and failed before changing anything; corrected path and full rerun passed. Tests use artifact JSON directly, no runtime validator/database/providers.

### Blind responses and independent support

**Reading**

- 1: TRUE — was about to close.
- 2: FALSE — a missing photograph does not prevent a donation.
- 3: NOT GIVEN — equipment was designed to avoid high temperatures.
- 4: FALSE — It does not show whether those seedlings would survive pests.
- 5: TRUE — asks successful growers to contribute a small share.
- 6: accession number — a unique accession number.
- 7: mesh trays — spread on mesh trays.
- 8: workbench — remain on a workbench.
- 9: early renewal — marked for early renewal.
- 10: introductory session — New members attend an introductory session.
- 11: pollen — plants can exchange pollen.
- 12: use notes — a field called 'use notes'.
- 13: school — moved one collection day to a school.
- 14: i — Sound level describes one property.
- 15: ii — same average sound level.
- 16: iii — explanation attached to a sound could influence judgement.
- 17: iv — merely displaying a control was sufficient.
- 18: B — unmeasured differences between them remained a possible explanation.
- 19: A — Half heard the ventilation first.
- 20: C — opportunity to withdraw their responses.
- 21: B — both heard the same pump.
- 22: A — A different activity.
- 23: paper log — Volunteers used a paper log.
- 24: notification sounds — avoid notification sounds interrupting.
- 25: activity — the activity they were attempting.
- 26: separate scale — comfort on a separate scale from concentration.
- 27: YES — which information will change a future decision.
- 28: NO — Completeness is a poor goal.
- 29: NOT GIVEN — protect time for workers to discuss difficult cases.
- 30: NO — rather than the automatic release of every file.
- 31: YES — uncertainty is a reason to design a careful trial.
- 32: C — twice as many faults after a shorter form.
- 33: D — help people find a relevant colleague.
- 34: F — hinge.
- 35: G — more durable but initially costly intervention.
- 36: B — has no bearing on the joint.
- 37: C — method of collecting information could change the number.
- 38: A — without being handed details that expose unresolved vulnerabilities.
- 39: D — retrieve a relevant earlier case and make sense.
- 40: B — start with one category of equipment.
**Listening**

- 1: shelf — put me down for a shelf.
- 2: Sunday — next class is on Sunday.
- 3: 9.30 — workshop starts at 9.30.
- 4: 35 — costs 35 pounds.
- 5: apron — What you must bring is an apron.
- 6: Varden — It's Varden.
- 7: studio — Go to the studio.
- 8: courtyard — please use the courtyard.
- 9: picnic — bring a picnic.
- 10: 3 — at least 3 days.
- 11: B — main aim is to help residents keep possessions in use.
- 12: A — every new volunteer must do is attend a safety session.
- 13: C — use mornings to prepare the equipment.
- 14: B — damaged battery.
- 15: A — owners can learn how to care for the item.
- 16: badge — Sign your name and collect a badge.
- 17: month — one mentor for your first month.
- 18: register — record the repair in the register.
- 19: mug — Bring your own mug.
- 20: calendar — use the calendar to cancel it.
- 21: C — different experiences of the same building.
- 22: B — treating a longer stay as evidence.
- 23: A — noise and crowding need separate questions.
- 24: C — recruit students as they leave the library.
- 25: B — Choose different times of day.
- 26: 2 — use only 2 floors.
- 27: colour — Use colour codes.
- 28: Maya — I'll revise the questionnaire tonight.
- 29: task — comparison should be by task.
- 30: outline — Bring an outline of the report.
- 31: evaporation — cooling through evaporation.
- 32: soil — soil had often been compacted.
- 33: density — crown density.
- 34: angle — fixed the camera angle.
- 35: 6 — every 6 weeks.
- 36: species — same species.
- 37: photographs — example photographs were more effective.
- 38: decay — reveal decay inside a trunk.
- 39: roadworks — recorded roadworks.
- 40: neighbourhood — grouped trees by neighbourhood.

## General Training extension

Coordinator expanded scope to General Training Reading/Writing candidates. Same preflight method applies: independent projection/solve before keys, GT-specific length and daily/work/general section conventions, letter scenario/purpose/bullets/register and essay timing/weights. No assets available at extension intake. Official GT [Reading](https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-reading) and [Writing](https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing) pages inspected 6 November 2026. Review pending.

## General Training independent findings

Sanitized GT Reading first, saved all40responses plus support before key reveal.39/40agreed; item33 independently NOT GIVEN versus authored FALSE. Giving names and retaining names are different claims: the original source only says answers were kept without names. Author notified; rewording/source repair pending at this checkpoint. Items9,17,35 are proper absence cases (towel hire, supplier,wage comparison). Three daily short notices,two actual workplace texts and one longer general-interest article satisfy the distinct form structure.

GT Writing has an identifiable formal recipient, practical schedule-change purpose and three meaningful required points; personal examples/details may vary. Its formal letter exemplar covers identification/reason,conflict and conditional transfer/refund request with appropriate salutation/sign-off. Essay discusses both investment views and supports a conditional priority; task/annotation facts align.60minutes,150/250minimums,1:2weights and qualitative four-criterion guidance are coherent.

Ten static tests passed after adding GT checks (`platform/backend/.venv/bin/python -m pytest platform/backend/tests/test_content_assets.py -q` from app). Structural tests do not detect every semantic defect: item33 was found through the blind solve.

- 1: C — cannot accept microwave ovens.
- 2: B — Music is switched off.
- 3: A — document showing your current address.
- 4: C — level entrance through the courtyard.
- 5: A — must not be left in the outdoor book return box.
- 6: FALSE — only when nobody else has reserved.
- 7: TRUE — borrower present.
- 8: FALSE — not swimming lessons.
- 9: NOT GIVEN — towel hire not discussed.
- 10: TRUE — decline to proceed after hearing the cost.
- 11: ten minutes — allow ten minutes.
- 12: collection basket — collection basket.
- 13: one object — booking covers one object.
- 14: final slot — request the final slot.
- 15: FALSE — rather than going directly.
- 16: FALSE — induction alone does not provide that authorisation.
- 17: NOT GIVEN — training boxes contain copies; supplier not discussed.
- 18: FALSE — Do not change a label.
- 19: task board — check the task board.
- 20: locker — Personal pens must remain in your locker.
- 21: handover log — record any unfinished request in the handover log.
- 22: B — before written approval.
- 23: C — following meeting.
- 24: A — not based on length of service.
- 25: receipts — Keep receipts.
- 26: learning note — submit a learning note.
- 27: review date — a trial and a review date.
- 28: vi — carrying equipment as part of the service.
- 29: i — walked both routes with loaded trolleys.
- 30: ii — could not tell them whether journeys had actually changed.
- 31: iii — test three alternatives with the same load.
- 32: FALSE — three afternoons a week.
- 33: NOT GIVEN — answers were kept without names; collection requirement not stated.
- 34: TRUE — preferred a slightly heavier model.
- 35: NOT GIVEN — no hourly wage comparison supplied.
- 36: collection code — by a collection code.
- 37: purchasing habits — do not know whether it changes purchasing habits.
- 38: C — irregular availability made advertised hours unreliable.
- 39: D — different carriers / different hours.
- 40: B — observing ordinary journeys and correcting small failures.

## Remaining cross-source objection

Blueprint Listening finalComputerCheckingSeconds120 conflicts with Listening productionPlan.finalReviewSeconds20 unless these denote separately explained intervals. Reported to coordinator and Listening author. Audio budgets are provisional, not measured delivery. Pending reconciliation.

## Scope correction — supplied-source grounding required

Coordinator conveyed Arash's correction: all content must be based on supplied licensed materials, and processing selected excerpts is explicitly authorized. The current original-only drafts are HELD. The Academic80/80 and GT39/40 blind results above are historical observations of superseded drafts, not acceptance of the revised task. Current static passes do not establish source grounding.

Revised evidence plan: wait for authors' frozen revised files with sourceRefs/sourceMappings and exact mapped primary pages. Read mapped original Cambridge/Mindset source excerpts locally (never copy whole source files to assets); inspect actual language facts, pedagogical mechanisms and task demands against new questions/stimuli, not merely official format citations. Then perform fresh sanitized independent solve before new key reveal and compare revised keys. Distinguish original invented surface scenarios from source-grounded learning/assessment mechanics; source citations alone are insufficient. Verify retained source/edition/territory provenance and no licensed originals in delivery artifacts. Existing no-environment/no-runtime/no-DB restrictions remain. Stop at checkpoint until new frozen author artifacts arrive.

Status: HELD, revised-source review pending. No candidate approval or operational readiness. Human IELTS teacher review remains pending.

## Revised Listening v2 selected-source check

Read actual local selected pages, not summaries: Cambridge21AcademicPDF12–17 (printed10–15); MindsetLevel2PDF22–24,40–42,139–143 (printed21–23,39–41,138–142). Text extracted only those ranges to permitted scratch; visually inspected CambridgePDF12 rendering. Its split table/notes and clear group limits are observed source demands. MindsetPDF23 separates anticipated gap categories and number detail; PDF24 explicitly contrasts true-but-wrong-reason distractors against meaning-equivalent keys. PDF42 grounds ordered category completion; PDF143 requires following directional alternatives in student/tutor conversation. These are actual pedagogical mechanisms, not just external format citations.

Observed v2 implements these mechanisms: Q3/4/10/26/35 now require a number and remove written-number alternatives; Q11 distinguishes main aim from a true subordinate learning benefit, Q13 distinguishes morning cause from true simultaneous circumstances; Q23 now requires following Maya's proposed deletion and tutor's correction; Part4 groups notes by lecture topic. These are concrete revisions prompted by source review. Cambridge source Part3 uses multi-select/matching rather than this draft's single MCQ/completion: it supports selective benchmark demand study, not a claim to reproduce that form's full task balance. Mindset map/diagram work in the inspected spans is not adopted; absence of a map claim is correct. No local source originals moved to assets.

Reconstructed all40answers from a new sanitized v2 projection before inspecting new answer fields;40/40agree. Prior-v1 exposure prevents calling this a naive blind attempt. This is independent source/script reasoning with prior keys known, not unseen-learner or acoustic evidence. Numeric limits and revised true distractors remain resolvable. Timing objection resolved in current draft:1800second provisional listening sequence plus120separate computer answer-checking=1920total, final review explicitly excluded from sequence. No recording measured. Canonical source IDs/mappings and final frozen hash still pending.

## Further correction — semantic source content required

Coordinator clarified that borrowing pedagogical methods alone does not meet Arash's request. The fictional workshop/repair/library/tree Listening v2 remains HELD; the source-mechanism observations above are factual but provide no acceptance. Required new rebuild uses actual supplied semantic content (e.g. selected sailing/makeup/marine/rubber sources), with facts, relationships and questions reconciled against original primary pages. Full-corpus processing/ingest is now authorized and owned by other assigned workers; this review does not perform that ingest or alter its infrastructure. Await semantically source-based rebuilt mocks and canonical mappings, then repeat independent reconstruction and evidence review. Current tests establish structural safeguards only; no source-grounding or teacher approval conclusion follows.

## Semantic rebuild: independent source observations

Actual primary excerpts inspected locally: Cambridge21AcademicPDF18–30 Reading,99–104Test1Listening scripts (excludeTest2after opening boundary),32–33Writing/Speaking; Cambridge19GeneralPDF16–30Reading/Writing; Mindset3PDF17visual graph and18corrected discussion,27–31Speaking,40–43paragraph/cohesion. Earlier Mindset2 selected pages remain methodological context only. The new mock domains and concrete facts now derive from actual supplied semantic source content.

Academic Reading reconstructs Davies biography, silence research and sugar-review history. Named dates/inheritances, dealers/artwork subjects, wartime canteen sequence/Bath destination, fifty-person self-report versus forty-eight-person scan study, consent/quiet-garden distinctions, and sugar labour/policy/technology/livelihood relationships agree with source. New evaluative prose is recognisable synthesis, not a purported quotation of the book itself. Q18 originally lost Feinstein attribution in paraphrase; reported and author restored it explicitly, consistent with originalPDF23. Current passage length2509;40reconstructed answers agree, with no approval inferred. Important procedure limitation: initial sanitized source-rewrite projection retained item transformationNotes, which contain answer-equivalent rationale. This contaminated the claimed blindness; the coordinator was promptly informed. Treat this as independent semantic reconstruction and source verification, not a naive blind solve. New worker using strict whitelist is required for truly unseen solving.

Listening v3 uses sailing beginner courses, makeup trainee work, marine-biodiversity seminar evaluations and rubber-supply constraints. Source values120/110/two-day/year,weather/dictionary/certificate/towel/videos/lockers match actual script. Makeup travel-cost conditions, diverse people,impatient directors,shyness,essential kit,permission and continuity duties retain source meaning. Marine long-term/global threat emphasis,interdisciplinary team/robots and six distinct resource judgements match. Rubber latex,eight-to-ten-year delay,equatorial conditions,recycling,genetic vulnerability/fungus,palm oil,roots/soil distinctions match; no claim of updated real-world engineering data. Strict whitelisted new projection excluded all metadata/derivation/transformation notes;40answers saved before new keys,40agree. Valid script alternatives diagrams/illustrations and quickly/efficiently were reported and accepted by author. Final narration removes internal source-case framing;eight changed evidence quotes individually reinspected. Actual audio remains absent.

GT Reading is based on transport FAQ/customer reviews,two management/resignation texts and emojis/language,matching inspected Cambridge19General actual topics and relationships. Source names,garment and some timetable details are adapted; this is not a facsimile of original source facts. All40reconstructed answers agree case-insensitively. Unrestricted completion stems revealed legitimate alternatives:voice/timing,advertising/clothing/entertainment/creative work; reported to author. Documentation/instructions ambiguity also reported. Superseded parcel-library item33no longer exists. GT Writing retains work-study manager-letter relationship and photographic self-focus at attractions with cause/evaluation demands; source Task1originally reduces hours while rewrite requests a temporary schedule rearrangement,an explicit semantic adaptation rather than claiming exact source wording. Actual Mindset3paragraph development/source functions read and applied to current original exemplar explanations. New letter covers allthreepoints and realistic colleague approval;essay develops causes and conditional negative judgement without universal claims.

Academic Writing source graph was independently rendered:65000/85000/80000cost,20000/35000/60000traffic,20000/30000/40000lifestyle. Every transcribed value and associated teacher fact matches. It remains a count table,not percentages; categories are not established mutually exclusive. Housing Task2preserves best-solution/degree-agreement demand from Cambridge21PDF32. Speaking actual source topics and cue points remain local leisure/countryside,haircuts,tourist information and holidays/attractions; source relationships and abstract Part3demands preserved. All timing/minimums/weights/interviewer gates retained. W/Snow version2after reviewer flagged version1collision.

### Canonical source reproducibility

Verified all14referenced source fileSHA256values against actualPDFbytes. All14excerptSHA256values reproduce using each entry’s documented algorithm:sevenPyMuPDFper-pageget_text(sort=True),U+000Cjoin;sevenPopplerper-page-layoutstdout concatenation. An initial uniformPopplerattempt failedsevenanchors because I wrongly assumed one common algorithm; reading per-entryexcerptBoundary and rerunning correct algorithm resolved every mismatch. No source-index defect remains. Source originals remain outside application assets; no corpus copies or source-page images delivered. Full ingestion validation belongs to other workers.

### Rebuilt independent responses

**Academic Reading (metadata-contaminated reconstruction)**

- 1: TRUE — shipping and mining.
- 2: FALSE — greater part to sisters.
- 3: NOT GIVEN — Corot purchase location not supplied.
- 4: TRUE — 1916 and1917.
- 5: FALSE — returned buying in1930s.
- 6: cultural subjects — emphasised cultural subjects.
- 7: journals — Their journals indicate.
- 8: canteen — canteen serving troops.
- 9: conference venue — became a conference venue.
- 10: Jane Blaker — journeys with governess Jane Blaker.
- 11: Venice — Monet showing Venice.
- 12: Bath — sent toBath.
- 13: Wales — National Museum Wales.
- 14: i — willingness to takepart.
- 15: ii — London DC NY measures.
- 16: iii — protective response vs longterm burden.
- 17: iv — brain response to missing stimulation.
- 18: B — Feinstein adjacent tank paragraph; explicit E attribution missing.
- 19: D — Pfeifer garden comparison.
- 20: A — Antonio noise standards.
- 21: B — Feinstein breathing.
- 22: C — Ben-Soussan awareness.
- 23: questionnaire — fifty participants completed questionnaire.
- 24: reclining chair — resting in recliningchair.
- 25: brain scans — obtained beginningandend.
- 26: depression — network linked depression.
- 27: NO — not simpleethical progression.
- 28: NO — mistake farm size proofeasy work.
- 29: YES — essentialtohistory.
- 30: NOT GIVEN — no specificreplacementpolicy view.
- 31: YES — gives tensions room together.
- 32: C — Java smallfarm cane/rice.
- 33: D — subsidies lower beetprices.
- 34: E — Cuba railways workers/cane.
- 35: F — poor livelihoods dependon sugar.
- 36: C — beyondtropicalplantations.
- 37: A — ethicaleasystory hardersustain.
- 38: D — politicalassistance notjustnaturalconditions.
- 39: B — cost not settles socialvalue.
- 40: C — connectionswithout resolvingconsequences.
**GT Reading (fresh sanitized reconstruction)**

- 1: FALSE — first tram thirty minutes later.
- 2: FALSE — terminates at railway station.
- 3: NOT GIVEN — overnight bus route not supplied.
- 4: TRUE — fare depends on journey.
- 5: FALSE — Neither drivers nor inspectors sell tickets.
- 6: FALSE — not a guarantee of space.
- 7: NOT GIVEN — event restrictions do not establish extra trams.
- 8: B — considerably darker.
- 9: A — ordered one size larger than usual.
- 10: C — exchanged it for a larger one.
- 11: E — In the end I kept both.
- 12: D — can catch a thread.
- 13: C — doubted whether shape would suit me.
- 14: E — casual trousers or smarter clothes.
- 15: trust — Trust cannot be demanded.
- 16: goals — Set goals that are ambitious.
- 17: strategy — every new strategy.
- 18: deadline — agree a deadline.
- 19: trial — A limited trial can reveal problems.
- 20: pride — create pride.
- 21: future — connect that history with a credible future.
- 22: meeting — Arrange a meeting.
- 23: leaving date — agree a leaving date.
- 24: reference — fuller account of contribution / reference.
- 25: documentation — Leave documentation.
- 26: final date — agreed final date.
- 27: disruption — reduces disruption.
- 28: i — emotional meaning uncertain.
- 29: ii — communities change.
- 30: iii — software repeatedly revised.
- 31: iv — selection cultural presence / datedness.
- 32: v — advertising clothing entertainment creativework.
- 33: voice — voice expression timing.
- 34: belonging — express belonging.
- 35: software — software repeatedly revised.
- 36: advertising — advertising clothing entertainment creativework.
- 37: message — surrounding message.
- 38: B — restore emotional context.
- 39: C — word not redesigned when buys phone.
- 40: D — changing ways of connecting.
**Listening v3 (strict-whitelist reconstruction)**

- 1: 120 — singleplace120pounds.
- 2: 110 — twopeople110each.
- 3: 2 — course2days.
- 4: year — throughouttheyear.
- 5: weather — weatherand tides.
- 6: dictionary — dictionaryincluded.
- 7: certificate — receiveacertificate.
- 8: towel — needatowel.
- 9: videos — trainingvideosonline.
- 10: lockers — lockersinchangingrooms.
- 11: B — transportexpensescovered.
- 12: C — differentethnicbackgrounds/ages.
- 13: A — directorsimpatientdissatisfied.
- 14: B — shyconversationdifficult.
- 15: C — essentials.
- 16: approval — Obtainapprovalfrommakeupdesigner.
- 17: quickly — quicklyenoughtoavoiddelaying.
- 18: continuity — continuityrecords.
- 19: flexibility — usefulattitudeflexibility.
- 20: extras — applyingmakeuptoextras.
- 21: A — attentiontolongtermthreats.
- 22: C — worldwidethreats.
- 23: B — rangeofspecialisms.
- 24: A — robotsinvestigatethreats.
- 25: C — lackofevidence.
- 26: outdated — forseminarfeltoutdated.
- 27: predictable — founditpredictabletoo.
- 28: diagrams — diagramshelped.
- 29: specialist — specialistknowledge.
- 30: one-sided — gaveaone-sidedaccount.
- 31: latex — liquidcalledlatex.
- 32: 8 — 8to10years.
- 33: climate — suitableclimate.
- 34: equator — closetoequator.
- 35: recycle — difficulttorecycle.
- 36: diversity — lowgeneticdiversity.
- 37: fungus — fungusseriousthreat.
- 38: oil — palmoil.
- 39: roots — foundinroots.
- 40: soil — donotrequirerichsoil.

### W/S agreement at reviewed hashes

I agree that the following source-based written candidates preserve inspected source semantics,provide coherent task demands and retain honest pending-teacher/runtime gates. This agreement is limited to static content/source review; it is neither human IELTS teacher approval nor release approval,scoring calibration,unseen-test certification,rendering QA or actual examiner administration.

- academic-01-writing.json: SHA256 `0ec870a936987a74060d480cca0b8af7cdf19d7d84dda52d0f10a6bab2427af3`;version2.
- academic-01-speaking.json: SHA256 `3242a297d23c147c28152e0ff53056f6ea03fb687e49b1fec95ef9f250943987`;version2.

Still pending: GT valid-alternative corrections/version increments; final all-file static rerun/hash record; naive blind AcademicReading review by an uncontaminated reviewer if required.

## Final static/source review checkpoint

Observed final repairs: GT Reading accepted alternatives now include documentation/instructions (25), voice/timing (33), and advertising/clothing/entertainment/creative work (36). Each fits the unrestricted stem, occurs in its passage and stays within the stated limit. Both GT files are version 2. Listening alternatives diagrams/illustrations and quickly/efficiently remain accepted; final narration evidence and source facts were rechecked. Academic Reading explicitly assigns the brain-imaging study to Feinstein’s team.

Final checks actually executed: `platform/backend/.venv/bin/python -m pytest platform/backend/tests/test_content_assets.py -q` from app: **18 passed in 0.04s**. `git diff --check`: clean. Earlier failures preserved above concerned superseded fixture assumptions and then genuine pending version/alternative corrections; they are resolved in this rerun. No backend full suite, runtime, database, media playback or deployment was performed by this reviewer.

Final measured text lengths excluding paragraph letters: Academic Reading 2,509 words; GT Reading 2,182 words. Three Academic passages and three GT sections (two everyday texts, two work texts, one longer article) contain 40 numbered items apiece. Listening has four ten-item parts, ordered exact script evidence, and valid dialogue/monologue speaker roles. Its budget sums to 1,800 seconds plus 120 separate checking seconds; this is an unmeasured production target, never proof of actual duration.

I explicitly agree with static structure, source-semantic alignment, answer/evidence integrity and correction of the reported content objections for the hashes below. Remaining limits are material: Academic Reading reconstruction was contaminated by item transformation notes and cannot be presented as a naive blind solve; human IELTS review remains pending for all six candidates; final audio, one-play delivery, independent audio solving, responsive examiner administration, rendered task accessibility, source-family exposure/holdout suitability, calibrated scoring and learner outcomes were not established. Complete corpus ingestion/DB lineage is outside this assignment and not certified here. None of this is release approval or human teacher approval.

Reviewed file hashes (SHA-256):

- academic-01-listening.json, version 3: `44eb7be000620b7f2a3aeba711dfc96090866a0334f0a1e295a425266ba154fd`.
- academic-01-reading.json, version 2: `3a0c443b399dcde4520b32191619df4de1aa234e9ff8d0f20de32b1fbd4582da`.
- academic-01-speaking.json, version 2: `3242a297d23c147c28152e0ff53056f6ea03fb687e49b1fec95ef9f250943987`.
- academic-01-writing.json, version 2: `0ec870a936987a74060d480cca0b8af7cdf19d7d84dda52d0f10a6bab2427af3`.
- general-01-reading.json, version 2: `6fd4ae5e2968e2271cc8ffc9f713cf2f8516f214decaf9f86ce7c4d766eba242`.
- general-01-writing.json, version 2: `54922dd0ebbe83c96a70fb11f0dec1dd4920b41f270605bd68ed8865c4e21a0a`.

Owned deliverables: this review record and `platform/backend/tests/test_content_assets.py` only. Scratch excerpts/projections are private local review aids, not deliverables or web assets. No source originals, environment files, learner data or licensed BarEx resources were transferred. Restart from this final checkpoint; any material change to reviewed stimuli, keys or source mapping requires renewed review. Status: static/source review agreement with stated limits; human teacher approval and operational readiness pending.
