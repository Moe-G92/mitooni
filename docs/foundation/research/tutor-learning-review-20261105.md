# Independent tutor runtime learning review

2026-11-05. Reviewer: learning/assessment methodology specialist, gpt-6.1-sol / medium. Receiving base `2c667827b4729312820a059ce0ad7f359559c8a0`, branch `codex/foundation-review-20261104`. **Initial actual-code review; state implementation is still in progress.** Owns this record only. No source changes, database actions, provider requests or external processing.

**Current scoped verdict: AGREED with the corrected joined learning/runtime structure on read-only review; independent database/browser learning-flow reproduction remains pending.** The initial defects below were corrected and rechecked in the joined-source follow-up. Actual generated qualitative tutoring is the intended product. The superseded IDs-only proposal is not an acceptance condition. No perfect semantic filter, numeric accuracy target or validated learning-effect claim is required or asserted here.

## Preflight

1. A leading learning-runtime reviewer would trace the exact task, learner response, stage, support conditions and permitted next choices all the way into actual model input, then trace attributable feedback back to the frozen work. A synthetic runner can conceal missing context if it hardcodes task facts; adapter-only tests therefore cannot certify the teaching loop.
2. Rawest permitted evidence: original receiving instructions/context/DTO/tool code, actual state-to-provider binding, original local synthetic catalog and existing deny-egress SDK tests. Pinned source mechanics and accepted runtime contracts establish intended boundaries. No source-domain prompts, legal corpus, learner data or environment files are needed.
3. Methods: static read of actual prompt and safe projection; contract-to-code trace for T1–T8/P1–P4; focused existing SDK/converter test reproduction without database reset; distinguish enforceable data/state invariants from prose quality needing later domain evaluation. No new SDK research or live-provider behavior claim is needed for this review.
4. Independent evidence: captured real-SDK mock requests containing the exact permitted task/policy/work context; meaningful multi-turn state-to-adapter traces; forbidden-key/family/context denial; exact quote/criterion/reference checks; honest unavailable branches; final durable/retry/failure checks. Expert-reviewed actual generated outputs are a separate later source of pedagogic-quality evidence.

Read root `/Users/arashshahrokhi/Projects/AGENTS.md`, receiving `AGENTS.md`, `CHECKPOINT-TUTOR-2026-11-05.md`, current learning contract, backend design, provider implementation record and latest generated-prose correction in the security review. Earlier fixed-ID release requirements are superseded. Existing legal/business authority is not reopened by this engineering review.

## Actual scope and checks

Inspected `platform/backend/app/agents/{context,tutor,planner,tools}.py`, `providers/agents_runner.py`, `db/thread_item_converter.py`, `contracts/{tutor_runtime,study}.py`, `services/{study_state,tutor_output}.py`, `repositories/postgres_study.py`, `workers/tutor_turns.py`, `providers/synthetic_runner.py` and `local/study_catalog.py`, plus the two existing provider/converter test files. State source was still changing; findings below identify the observed snapshot, not a final backend verdict.

Independently ran in `platform/backend`:

`.venv/bin/python -m pytest -q tests/test_agents_runner.py tests/test_thread_item_converter.py`

**15 passed in 0.87 seconds**, five named-widget deprecation warnings. No database fixture/reset or real model request was used. Tests exercise actual pinned Agents SDK over process-local `httpx.MockTransport`, including multiple tool/model iterations, output shape, private-field projection, refusal, bounded calls, timeout/cancellation, duplicate dispatch and converter allowlisting. This proves orchestration/serialization for supplied frames; fixture prose is not generated-model behavior.

Reviewed adapter/agent snapshot SHA-256:

- `app/providers/agents_runner.py`: `798ab7f819539e5eccf5c8919b385930a0093489642b3ed1fdef4915ec565898`.
- `app/agents/tutor.py`: `c6ad410add1d11b0c2925071a192d5eb02b09d8f97a7d6e67ba456f8e38fa662`.
- `app/agents/planner.py`: `5bdbb2b2029055843274e82096528f3a31a805f5f734da92cade4cf813b1c5fe`.
- `app/contracts/tutor_runtime.py`: `06e8beb948b57e59b9c33c98e1abae1443ef1292931d866d67a083e9f692f78e`.
- `local/study_catalog.py`: `8f8fa2b050c7169f66479bb06229ffa9fa7c5f2b3c3cbe553882e75b3dabf172`.

Initial in-progress seam snapshots: `postgres_study.py` `0b2d9af1ce6b6234255b9804ee68a98b59d313bc5b3747af5c67c2a6627b09b6`; `tutor_output.py` `9e954a492951c110d90bb4728e5342b051eff74a5a4b884e709573f275cdf816`; `tutor_turns.py` `e41cfc5ebeda5e7d510f6757dc9cbbe4105cf7b1d114e70d912da247a096b70d`. Later edits require a focused recheck, not assumption that these findings still apply.

## What is already supported

The original Mitooni instructions explicitly request meaningful qualitative explanation, purposeful checks, response-linked repair and waiting for the learner. They do not restrict all model delivery to fixed phrases. Typed candidates permit real bounded prose, anchor citations, exact work spans, qualitative observations and a read/propose-only next step. Instructions distinguish untrusted content, authority and calibrated score claims; no source legal instructions or foreign corpus appear in the reviewed files.

The adapter excludes bundle internals/identity from its explicit model projection, prevents independent dispatch, uses fresh stateless requests without continuation IDs, and keeps raw deltas private. The converter excludes widgets and substituted/nonallowlisted hidden content while preserving the current user quote. Scope/authority is delegated to receiving server tool callbacks, not model-chosen actor IDs. These are useful BarEx mechanics with Mitooni bindings; they do not establish truth or helpfulness.

The current original catalog contains a walking-path causal-inference Reading item and a libraries discuss-both-views Writing prompt, with generic causation/reason anchors and synthetic criteria. They differ from the contract's illustrative library-hours/parks examples, which is acceptable if tests bind to the actual catalog. These are two tiny engineering activities, not an authentic IELTS form, approved curriculum or all-level bank. No Listening/Speaking, separate advanced family, novice prerequisite activity or sealed/fresh-family fixture is present in this catalog snapshot. Their absence must be represented honestly rather than inferred from labels or invented by a model.

## Concrete findings sent to coordinator/backend

**1. Follow-up history projection mismatches the adapter.** Initial `PostgresStudyRepository.worker` constructs history items with `role` and `content`; `AgentsRunner.prepare` requires exactly `role` and `text`. Once a committed assistant message enters the current context, the next provider preparation fails `invalid_context`. Existing adapter tests provide no state-produced history and therefore miss this. Remedy: align the shared seam and reproduce a state-produced two-turn conversation through the actual adapter without external network.

**2. Actual task demand/stimulus is missing from model input.** `BoundTurnInput` supplies bundle IDs, work, generic anchors, intent/message and criterion IDs; adapter payload has no permitted task prompt, stimulus, objective description or criterion definitions. Reading work such as `B` cannot tell the model what the choice/passage says; a Writing draft does not state whether the task requires both views. The local synthetic runner hardcodes the passage/task facts, masking this defect. Remedy: an explicit server-filtered task/objective/policy projection with no private key/rationale, captured in real-SDK mock request tests. Include only actual stage/support/language/branch information, not fictitious coverage. This is necessary grounding, not a request for an additional agent engine.

**3. Planner has no real permitted choices.** Current `AuthorizedTools.next_options` returns `options=[]` unconditionally. The model is told to select server choices but cannot see an available next step/evidence; the final proposal/continuation part of T5 and the teaching loop is not implemented by that callback. Remedy: a bounded current-state choice/evidence projection or honest unavailable result, with deterministic acceptance remaining server-owned. Do not permit arbitrary model target IDs to bypass the absent choice catalog.

**4. Release validation checks supplied references but not minimum stage/evidence structure.** Initial `validate_output` accepts empty citations/spans/observations and does not map turn intent/stage to permissible candidate kind. Consequently a feedback candidate can structurally pass for prework explain intent, and substantive Task 2 feedback need not carry any captured-work/criterion linkage. Remedy: reviewed intent/stage rules and minimum reference requirements appropriate to the action. An explanation before work needs approved anchor/task grounding, not fabricated response quotes; substantive submitted-work feedback needs captured work/criterion linkage. This is a finite structural contract, not proof that prose entails its citation or a perfect semantic filter.

## Traceability and remaining evidence

T1/P1/P2 need the exact original Reading prompt/stimulus and meaningful explain → check → wait → response → repair sequence through the joined runtime, not only a prewritten fake response. T4/P3 need exact frozen Writing context, before/after response contrasts, revision attribution and no invented position/reason. P4/T8 need real supported/advanced-absent behavior, Persian/English handling and honest missing content; the catalog cannot establish all-level learning coverage. T2/T3 require family exposure and no independent dispatch until explicit switch. T5 requires actual allowed choices and owned evidence. T6/T7 require the final durable/replay/version/access implementation, which this initial review has not independently exercised.

The server can enforce ownership, stage, field exclusion, exact spans, reference membership and durable status. It cannot infer meaningful comprehension from model compliance, certify a causal diagnosis from a wrong letter, or prove essay feedback is useful through JSON validity. Later actual-model/domain evaluation must contrast misunderstanding/correct reasoning, sparse/full Writing work, Persian support, advanced demand, learner quotations and injection-like requests. No invented numeric quality threshold or blanket claim of safe/accurate prose is made.

**Stop gate:** initial actual review delivered. Await backend/provider stable correction handoff and final learning-flow assignment. Then recheck the changed seam and reproduce focused final state/SDK traces without interfering with another worker's local database. No full-state acceptance, live-model quality, teacher validation, calibrated scoring or go-live approval follows from this record.

## Joined-source follow-up — corrections verified

Coordinator reactivated a bounded read-only review while backend formatting/final tests continued. No database writes/resets or browser/provider actions were authorised in this subpass. Re-read actual provider projection/instructions, shared strict models, state/worker/output code, original synthetic catalog and Mo study UI; inspected the owner's three-turn real-state→actual-SDK mock-request test. Removed unused ChatKit converter is not a missing capability: canonical owned role/text history supplies the bounded replay required by this slice, without retaining a dependency solely to demonstrate reuse.

All four initial defects are corrected in source:

1. History now uses exact `role/text` pairs and includes prior learner requests as well as assistant prose. It selects the last three completed exchanges from the owned workspace and exact context, excluding unfinished/failed/foreign contexts. Following a further reviewer challenge, each historical user message carries an explicit `historical_exchange_not_current_work` envelope with its captured workRef, bundle and context; the final input separately supplies current captured work. Prior draft comments therefore have attributable revision context rather than implicitly becoming evidence about a later draft. This is bounded continuity, not unrestricted transcript replay or proof the model uses it correctly.
2. `task_projection` and strict `TaskContext` supply actual task ID/kind/title/stimulus/prompt/objective description and permitted public options. `LearningControl` supplies stage, support mode, locale, self-reported current level explicitly as a preference, permitted feedback kinds and next-step IDs. No private key/rationale or actor identity is included by this explicit projection. The current fixture objective description falls back to its approved teaching anchor; this suffices for the toy objective, not full IELTS rubric coverage.
3. `learning_snapshot` now returns actual bounded controls; `next_options` provides the configured policy next step and owned evidence only when evidence exists. Deterministic validation/learner acceptance remains the transition authority. A next-step offer is not proof of mastery. Final target availability/publication/authority checks are source responsibilities and covered by owner tests; independent database reproduction is still outstanding here.
4. Release validation maps feedback intent to feedback kind, frozen attempt, nonempty captured spans and observations; other intents permit explanation/question. All candidates need approved citations, with exact quote bounds and rubric membership checked. A further reviewer challenge added at least one work-span index per observation. Prework explanation still needs no invented learner quotation. These checks enforce structure/attribution, not semantic entailment or educational quality.

Independently reran `.venv/bin/python -m pytest -q tests/test_agents_runner.py tests/test_tutor_output.py`: **36 passed in 0.84 seconds** after the final precision changes. This is a focused non-database suite using actual SDK with process-local transport, including task/control projection, locale/self-report distinction, history order, private input fields, failures and output references. The prior 15-test result remains historical evidence, not a claim the removed converter is still an active path. No live output was generated or assessed.

Reviewed joined snapshot SHA-256 (paths relative to `platform/backend`):

- `app/contracts/tutor_runtime.py`: `88e7f1d16c5afbd7c78b29155fe4c6e96c07c76213922c0e6931a6637f6b313b`.
- `app/agents/context.py`: `978182e03da1d061a00795726711e94a10d1e91097f2a365e91c5ea832479c44`.
- `app/agents/tutor.py`: `8e71a5846981a38b4bf0f177e938dbaa052ddcd8c3778af971f8a7c506008d47`.
- `app/providers/agents_runner.py`: `3a3b03d4eba28433376c9f17b7f882d3d2ce820c457e8fc33027728a328bd377`.
- `app/repositories/postgres_study.py`: `ab8d80ea3121168a79ac035439b087a60a2898c8f8342213aac2c65a33556ba2`.
- `app/services/tutor_output.py`: `1c2efc5f9011ac2bf04bc67f8486aa860dda91da1482c25dcf4cdd635c7d87ae`.
- `app/services/study_state.py`: `e2c50570dbb88cca2f06c2ec44aa3b204492a788d72ef1ea5c1f00452a3601d6`.
- `local/study_catalog.py`: `c379d05f000e9148dc1af6ae0a50b0f4b81c97a2276ce4cbdc7d4ac0f12832d3`.

### Pedagogic trace and interface limits

P1/P2 now have the necessary task/anchor/learner input and paired turn continuity, and instructions allow manageable explanation/checking/repair rather than canned-only responses. The synthetic runner selects toy paths but remains explicitly synthetic. Actual model adaptation to confusion versus correct reasoning is untested. A word-count branch in the synthetic Writing runner is an engineering stub, not a diagnosis of argument quality.

P3 now has actual task demand, captured work, strict spans, criterion membership and revision provenance. The synthetic `position/support/organisation` criteria are not a complete IELTS Writing descriptor or calibrated rubric. Same-task revision remains supported child work; old submissions and feedback retain their attribution. No numeric model score or implicit overall proficiency is introduced.

P4/T8 have locale and self-reported level available to AI support; that supplies a preference signal, not validated placement or genuine authored advanced/prerequisite coverage. Only the two toy tasks exist. No fabricated Listening/Speaking scores or level-complete promise appears in the inspected study UI. The UI has honest empty/unavailable and local teacher-review-pending states; a separate advanced-bank selector is not implemented by this slice. A model must not invent marked challenge tasks to fill that gap.

Read-only traces support T1–T3's explicit supported/independent separation, family exposure ledger, no model preparation during restricted independent work, explicit irreversible help switch and frozen independent eligibility before later review. T4–T7 durability, concurrency, restart, withdrawal and membership checks have concrete owner test code; this reviewer has not independently run those database/browser traces. Reading raw `0/1` is tied to a frozen one-item check and displayed as practice accuracy; it is not an IELTS score. Model dialogue, reviewed anchors and accepted plan changes are not mastery.

Mo's inspected UI renders prose/quotes as inert React text, identifies AI/synthetic provenance and saved/submitted revision references, preserves English task direction and Persian interface choice, with explicit help-switch consequence and frozen revision actions. Current and earlier saved feedback are distinguishable. One minor copy correction was sent to frontend: the generic quotation heading says “submitted work” even when an explain/hint span cites an open saved draft; use generic “your work” or condition it on workRef kind. The actual provenance row already distinguishes saved/submitted revisions. No teacher response, official band, media capability or unseen transfer is fabricated by these screens. This source inspection does not replace the independent browser/accessibility reviewer or human evaluation of Persian wording.

**Joined-source stop:** no unresolved material learning-contract objection remains in the reviewed corrected snapshot. Await coordinator-authorised final database/browser reproduction if required; do not reset another worker's database. Scoped agreement covers structure and evidence boundaries only, not live teaching quality, authentic/all-level content, assessment calibration, provider activation or release.
