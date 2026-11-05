# BarEx history and production evidence — 5 November 2026

Owner: archive/production specialist, gpt-6.1-sol / medium. Checkpoint: evidence complete; no application changes or release approval. Receiving revision c82d9a6dcf7b00d3d2b66759352dba397152a41f; BarEx source af57036ad18a45a0aa20a81202c9e0939ebd99d5. Archive files are a read-only directory snapshot with dated documents, not a verified Git revision.

## Preflight

1. A top professional would separate a coherent teaching system, reliable content delivery, and demonstrated learner benefit. They would examine failed and superseded approaches, account for exposure and test accounts, and reject a content-evaluator accuracy score as evidence of learner progress.
2. Rawest permitted sources: current implementation; dated archive design/process records; production schema metadata and database-computed nonidentifying aggregates. Licensed questions/textbooks, learner messages/answers/recordings, environment files and private coaching records were excluded from extraction or reuse. Archive reports are historical claims, not independently rerun content judgments.
3. Methods: instruction discovery, targeted source reads and static tracing; Supabase metadata followed by bounded SELECT aggregates. Queries select only needed scalar metadata; no arbitrary/custom functions, production writes, schema changes, auth exports or log reads. Exact analytical SQL is saved beside this report.
4. Independent proof: query grain, null/range checks, repeated exposure, immutable revision references, actual code paths and cautious comparison against dated history. No claim of learning efficacy passes without independent, unseen transfer tasks and delayed measurement reviewed by the IELTS expert.

## Authority, scope and provenance

Read root Projects/AGENTS.md, sqe-cracker/AGENTS.md, Mitooni app/AGENTS.md and CHECKPOINT-2026-11-05.md. Nested archive instruction discovery found waves/pack-refresh-2026-recovery-20260910/payload/AGENTS.md; that payload and its content were not read. SQE Material, lead_assessment_batch_outputs, .opencode, worker question/sheet outputs and learner coaching files were excluded. No downstream source-subtree AGENTS.md/CLAUDE.md was discovered in the targeted sqe-tutor search.

Project identity was verified without environment files: current source docs/COACHING_RELEASE_VALIDATION.md identifies production qvyuuiyueqbquvjhidgb, and Supabase get_project returned AI Tutor for SQE Exam, ACTIVE_HEALTHY, eu-west-2, PostgreSQL 17.6.1.063. The connector itself is the authorized read path; no credentials were requested or inspected.

Supabase and Data index/product-business-analysis/data-quality guidance informed the analysis. The assigned internal evidence checkpoint is the selected output; no additional dashboard, public artifact or uploads were created.

## What evolved and what is reusable

**Observed historical design, February–March 2026.** Archive memory-bank/projectbrief.md and productContext.md describe lead-first learning: select subject/lead, load a precomputed pack, follow up with tutoring, then practice or mock. Packs combine question-triggered teaching/mistakes with study-driven gap coverage. memory-bank/progress.md records the February transition from generic mock labels to canonical practice-topic leads, server-side scoring, no-repeat practice and atomic mock assembly before timing. March records separate self-study and guided routing, with a planner owning sequence and a tutor owning the current lead.

**Observed current implementation.** backend/app/routers/study_reel.py:1–18 projects one versioned teaching object into multiple formats with stable anchors, zero model calls on open and cached/lazy projection. docs/STUDY_SPACE_DESIGN.md:17 explains one anchor denominator across formats; :510 explicitly calls chat/voice coverage heuristic. The useful reuse is source/version/anchor identity and a coherent continuation state. Seeing, scrolling past or hearing an anchor is exposure; changing format must not manufacture additional learning credit.

backend/app/services/guided_learning.py:1076 loads up to 400 recent attempts, attaches current topic metadata and computes heuristic weakness from error rate and attempt count. :1257 ranks leads using unseen-coverage preference, weakness signals, exam scope, urgency and traps. Tutorial summaries also influence priority. These are inspectable scheduling heuristics, not a calibrated knowledge-state model or validated IELTS diagnostic. Current question-topic joins also do not establish historical topic/version identity for every past attempt.

backend/app/services/_guided_learning_replan.py:383 chooses insert_review/complete/stay from session weak/mastered points, readiness and weekly adherence. Its word “mastery” is an implementation label; the heuristic does not establish durable mastery. backend/app/services/coaching_workspace.py:161 validates versioned plan items, statuses, due dates and optional journey references, with authorized participant access elsewhere in that service. Reuse plan revision/conflict/access mechanics, adapting teacher prescription to IELTS tasks and rubrics.

backend/app/services/srs.py:1–25 and :77 implement a pure deterministic SM-2 variant with Again/Hard/Good/Easy, lapse/relearning states, bounded intervals and explicit algorithm identity. Stability/difficulty fields are reserved for a future FSRS upgrade; they do not mean FSRS is deployed. backend/app/services/flashcard_bank.py binds cards to pack versions and rejects stale banks. Reuse scheduling/state reliability where appropriate, then validate language-task suitability. Recall cards cannot stand in for productive writing/speaking.

## Failed, superseded and unproved approaches

**Historical finding, not a new legal review:** archive review-artifacts/2026-09-05-material-refresh/REVIEW.md explicitly supersedes an earlier all-approved report and rejects scaling its workflow unchanged. Its early check table distinguishes linter/serving-length passes and 302 focused tests from substantive content correctness. Later sections document unsafe schema assumptions, dependency loss, identity/exposure lineage gaps, context leakage in supposedly blind assessment and evaluation reuse after repair. The review itself has a scope correction: its proposed external-authority ledger was superseded by SOURCE_REFRESH.md. None of its legal examples or licensed content is transferred here.

**Historical process evidence:** waves/subscription-refresh/audits/process-background-20260908.md reports missing broad-topic mock routing, source comparisons performed without actual current bodies, acceptance triggered by file existence before worker completion, stale accepted hashes and a whitespace-only source extraction passing file/hash checks. These failures generalize: completeness must be explicit; usable source content matters beyond file presence; final acceptance binds to completed immutable artifacts. They do not prove an individual learner was harmed.

**Historical successful mechanics, explicitly limited:** waves/pack-refresh-2026-stage2/PREPARATION_REPORT.md reports 24 controller tests and 30 selector rehearsals passing while no native assessment/generation had run. Model loading, context capacity, substantive quality, deployed transactions and long-run capacity remained unproved. Preserve this distinction rather than treating a durable report or green test count as pedagogical approval.

**Design implication:** keep a canonical versioned skill/task model, explicit prerequisite and gap coverage, artifact integrity, immutable attempt references, independent expert/content evaluation, and separate learning versus unseen-assessment pools. Do not transplant SQE taxonomy, corpus, legal feedback, timing or question-derived priority weights into language teaching.

## Production observations

All results are database-computed aggregates. User IDs are used only inside grouping/counts and never returned. Accounts are not verified human learners. No profile columns matching test/internal/synthetic/staff/admin/role/fixture were found in the targeted metadata check, so synthetic/internal-account contamination is UNKNOWN. No email/domain heuristic or raw profile read was attempted.

The database confirmed UTC and execution time **2026-11-05 01:05:33.554471+00** at the final metadata check. Earlier aggregates were executed during this same research session before that checkpoint; exact per-query timestamps were not returned. Activity bounds are **2026-08-01 00:00 UTC inclusive to 2026-11-06 00:00 UTC exclusive**, over records present when queried. This includes a partial current day and a future upper bound; it is not complete observation through 6 November. It is an inventory of recorded activity, not a longitudinal efficacy cohort. No pre/post or retention comparison is claimed.

- question_attempts: **2,282 rows, 59 distinct accounts**, no null is_correct; **1,511 rows** have null mock_session_id (practice classification used here). **Seven account/question pairs** have multiple attempts within the window. These are pairs, not people or excess-attempt counts; repeats may be intentional review or retries. They are not proof of gain, retention or a no-repeat defect.
- mock_sessions, by created_at in the same bounds: **25 sessions, 15 accounts; 19 with completed_at**, one retake reference, one missing assessment_version. Question payloads, answers and scores were not returned. A missing version limits reproducibility; no score trend or pass prediction is inferred.
- All-time current lead_study_progress snapshot: **720 account/lead rows, 130 accounts**, including **99 zero-anchor rows**. A semantic follow-up confirmed coverage_pct is a **fraction from 0 to 1**, not a 0–100 percentage; all 720 had non-null, in-range coverage, with no ratio discrepancy above 0.001 for positive denominators. Zero-anchor visits cannot establish content coverage.
- All-time lead_anchor_progress: **32,678 account/lead/anchor rows, 100 accounts**; **37 stale rows**, five without covered_at. The row model supports bookmarks without coverage. Stale rows and nulls are not automatically corruption. Exposure totals do not count distinct skills mastered and should not be summed across learners as proficiency.
- study_journeys, journey_steps, journey_execution_blocks and journey_replan_reviews returned **zero rows**. exam_result_uploads returned **zero rows**. These tables contain no recorded evidence of that activity/outcome; this does not mean no learning/coaching occurred outside them.
- Coaching-engagement and flashcard-review cohorts are **below 10 accounts and suppressed**; no cohort size, performance, timing, rating or participant identities are exported. Such cohorts cannot support comparative coaching/SRS efficacy claims. The instrumentation query returned an unsuppressed aggregate engagement row count internally; it is intentionally withheld here and from derivative outputs.
- lead_packs all-version inventory: ready 198 versions/198 leads; staged 267/159; tutor_ready 922/206. These lead counts overlap across statuses and versions. After selecting highest version per lead, **206 leads are tutor_ready**, of which **18 have no cached study_projection**. Source tracing at study_reel.py:238 confirms deterministic lazy projection on open; missing cache is not equivalent to broken content. “tutor_ready” is a publication/workflow status, not independent educational certification.
- lead_assessment_question_results returned **zero rows in the selected August–November bounds**, despite nonzero catalog estimates for the table. This is neither a missing-table finding nor zero all-time content assessment. Its grain is model/content-evaluator question results, not learner attempts; any model pass rate would remain separate from learner outcomes.

No cohort breakdowns by subject, individual journey or narrow time bucket were exported. The k=10 threshold is a minimum privacy rule, not a statistical sufficiency rule.

## Fitness and limitations

**Observed activity; outcome limitations:** recorded question activity exists and correctness is populated in the window, but account selection, item difficulty, repeat-family exposure, assessment versions, delayed transfer, external scores and allocation mechanisms are insufficient for a causal learning/retention claim. No experiment assignment was established. Content evaluator output is categorically different from learner outcome.

**Observed instrumentation; sequence evidence unavailable:** empty journey instrumentation and suppressed coaching/SRS cohorts mean production cannot adjudicate which sequence is best. Test the Mitooni sequence prospectively with expert-defined transfer/delayed criteria; do not select it by BarEx completion volume.

**Observed coverage semantics; mastery not measured:** coverage has meaningful denominator/staleness semantics and a consistent current fraction calculation. It measures coverage of renderable anchors. A scorecard must keep exposure, practiced performance, expert rubric judgment and validated band estimate separate.

**Scope limits:** targeted metadata and aggregate profiling, not exhaustive database audit. No attempt→served question reconciliation, family/provenance join, orphan audit, full current content review, baseline reproduction, browser test or content generation was performed. Queries use LIMIT 100000 per bounded relation; returned totals are below the ceiling. No production timeout setting was altered; database query-plan/runtime load was not benchmarked. Catalog reltuples are estimates and were not used as exact learner totals.

Reported grains describe the source row model; unique keys and referential integrity were not tested. A result below the row ceiling does not establish either property. Latest-pack selection orders by version and created_at; deterministic resolution of tied values was not verified. No conclusion depends on choosing among such ties.

Two targeted source filename searches failed because guessed lead_study filenames did not exist; file discovery located study_state.py and study_reel.py instead. The initial coverage check used a too-wide 0–100 numeric bound; current source semantics prompted and passed a separate correct 0–1 range/ratio check. No failing check was silently reclassified.

## Recommendations to the learning-product owner

1. Use a teach → guided task → independent task → feedback/repair → delayed transfer loop as a proposal to validate, with explicit skips/repair routes for baseline proficiency and target skill. BarEx supports the engineering pattern, not its IELTS efficacy.
2. Preserve Mo's interface and brand. Reuse state/version/exposure/coach mechanics beneath it rather than its SQE shell, taxonomy or source content.
3. Separate deliberate retrieval repetition from unseen assessment. Preserve family/exposure lineage across revised items; a new UUID must not make a familiar scenario “unseen.”
4. Require teacher/examiner review of task coverage, rubric fit, prerequisite assumptions and acceptable progression evidence before exposing progression rules. Include all four IELTS skills and all target profiles without implying every learner follows every pack.
5. Instrument a modest pilot: content/assessment/rubric version, skill/task construct, first versus repeat/family exposure, assisted versus independent task, elapsed and active time separately, feedback/coach prescription, and delayed unseen follow-up. Track consent and synthetic/test status explicitly server-side. This is a design recommendation, not authorization to change production.
6. Validate quality and learner outcomes separately: source/task correctness, rendering/integrity and held-out item evaluation first; then prospective independent task performance and delayed transfer. Do not infer official band or overall readiness from coverage, SRS self-grade or a short drill.

## Restart

Read this report and evidence-sql-20261105.sql; keep the same project identity and read-only/privacy limits. Do not rerun aggregates merely to chase a moving number. Independent reviewer should verify SQL definitions against the source references, suppression, partial-day caveats and conclusions; content and learning specialists must challenge curricular recommendations. No provider configuration, live content changes or research claims are approved by this checkpoint.
