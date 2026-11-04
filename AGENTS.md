# Mitooni project instructions

Read `/Users/arashshahrokhi/Projects/AGENTS.md` explicitly before project work. This is Arash and Mo's project; global Lumi handoff procedures do not apply without a separate assignment.

## Ownership and scope

- Codex leads product, engineering, architecture and validation. Arash and Mo own business, services and domain decisions. Arash retains external release/spending approval.
- IELTS Academic is the first pilot. Both self-study and human coaching are in scope, for all learner levels and target bands. Persian is default with an English option. An IELTS teacher/examiner reviews content and assessments. TOEFL/GRE expansion is future work, not a reason to build a universal exam platform now.
- Use `docs/foundation/CHARTER.md` for authority and `docs/foundation/DECISIONS.md` for the current foundation checkpoint. Older market/design documents contain proposals and prototype assumptions, not blanket implementation or publishing authority.
- Delegate substantial specialist work to `gpt-6.1-sol` at `medium` effort, with disjoint ownership, explicit evidence and checkpoints. Save internal project records under `docs/foundation/`; do not expose diligence labels in customer interfaces.

## Source and data boundaries

- The application checkout is `app/` under the local Mitooni project folder. The adjacent IELTS resource directories are source material, not web assets. Do not add them to Git, public assets or model uploads by default.
- Arash confirmed commercial/distribution rights to the supplied resources for an Iranian audience on 2026-11-04 and intends original packs/tests derived from them. Preserve source, edition, territory and usage provenance; do not broaden that authority to worldwide distribution or unspecified external AI processing.
- sqe-cracker is a read-only code/pattern source unless explicitly assigned otherwise. Read its own instructions. Never copy BarEx licensed materials, learner data, credentials or domain-bound datasets into Mitooni. Record source revision and receiving-project tests for reused code.
- Do not read `.env` files. Use synthetic identities, essays and audio for engineering checks. No real learner data or recording uploads during foundation work.

## Engineering baseline

- The existing `web/` app is a Vite/React prototype with an MSW API and browser-local data. Its simulated authentication, scores, coach responses and entitlements are not production implementations.
- The product shell and useful platform functionality must be ported from BarEx, per Arash's latest direction. Preserve Mo's scaffold as IELTS reference work and selectively integrate its exam components; it is not the primary shell. Reuse existing BarEx code, safe assets, infrastructure, services, hosting, integrations and AI where applicable. Payments remain undecided. Follow a reviewed port manifest, contract and recovery design; never copy a full corpus, live data or environment files along with the code.
- Learner data, answer keys, final timing, entitlements and role authorization must be controlled by the server. Every attempt pins its content and assessment versions; retries must not duplicate submission or coach work.
- Keep practice accuracy, expert feedback and validated band estimates distinct. Never derive an official-sounding band from a short drill or include dummy/unmarked skills in an overall prediction.
- Retain English exam content and mixed-direction accessibility within the Persian-default application, with an English interface option.
- Inspect package scripts before installing dependencies. Receiving frontend commands in `platform/frontend/`: `npm ci --ignore-scripts`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run build:preview`. Receiving backend commands in `platform/backend/`: `uv sync --frozen`, `uv run pytest -q`. The local shell is at `/preview/topics`; its fixture entry is separate from production. `web/` has the reference prototype's own lint/test/build/e2e suite. Report actual failures and mocked/live boundaries; passing these tests is not release approval.
- Work on a feature branch. No push to main, merge, deploy, production configuration change, provisioning or external messaging without existing explicit authority.
