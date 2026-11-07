# Learner policy implementation checkpoint — 7 November 2026

Owner: learner_policy_finish specialist, gpt-6.1-sol / medium. Scope: pure learner policy and focused synthetic tests only; parent coordinates integration. Instructions read: `/Users/arashshahrokhi/Projects/AGENTS.md`, project `AGENTS.md`, learner MVP checkpoint and frozen learner wire. No source corpus, credentials, database or provider operations.

## Preflight

1. A professional would test counterfactual profiles and repair ancestry, not accept a visually different plan that selects the same activities. Also check duplicate unordered answer slots against source-style marking.
2. Raw materials: actual policy scaffold, learner request DTOs, current private catalogue loader and frozen wire. Only synthetic tasks, responses and evidence used for execution.
3. Pure deterministic ranking, objective-local latest submission observations, explicit condition checks, complete catalogue retention, date/weekly-budget scheduling and typed key comparison. Bipartite matching handles unordered distinct groups without greedy assignment errors. These keep authority inspectable without calling a model.
4. Independent evidence: reproducible focused tests covering progression past eight tasks, zero-hour manual practice, repeated child repair, distinct per-skill branches, later unrelated attempts superseding older child repairs, track/target/time/date counterfactuals, prerequisite restrictions, structured response marking and duplicate B/B prevention. Parent/reviewer must inspect actual diff and integrate with real HTTP evidence.

## Chosen design and limits

All admitted matching-track nonmock activities remain in the plan. Availability does not depend on time budget. Prerequisites alone can lock otherwise available activities. Completed activities consume no schedule capacity. Explicit recommendedStepId points at the first available ranked activity; scheduled/scheduledDate describe commitment separately. Test date bounds prorated weekly time budgets; indivisible activities cannot overflow an individual week even when the full horizon has spare capacity; absent a date, schedule seven days. The policy knows no preferred study days or daily availability, so dates express effort allocation, not appointments.

Latest objective submissions replace lifetime error accumulation. Supported success clears the historic error and prioritizes transfer; exact independent success prioritizes the next teacher-mapped branch. No band, mastery percentage or model scoring is inferred. AI observations remain nonauthoritative factual records. Teacher mappings currently use foundation/intermediate/advanced names. Qualitative writing/speaking without deterministic checks remain missing objective evidence; qualitative model prose cannot advance branches.

mark accepts optional questions metadata for word limits, preserving its two-argument signature. Flat scalar multi-select keys describe the required set; nested arrays/dictionaries describe alternative complete structured responses. Group declarations override slot alternatives and enforce distinct maximum matching. Full answerKey remains the denominator, including omitted answers.

## Evidence

`.venv/bin/python -m pytest -q tests/test_learner_policy.py` from platform/backend: 11 passed. Initial invocation from project root had incorrect import path; corrected by using backend working directory. `uv run` first failed on unwritable global cache; used existing virtual environment without installation.

Checkpoint: implementation ready for parent review. No release verdict or provider/DB proof claimed.
