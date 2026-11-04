# Mitooni foundation decisions

Date: 2026-11-04, Europe/London. Coordinator: Codex. Status: S0 shell and S1 backend foundation accepted at the bounded local port checkpoint. Production and learner pilot not approved.

## Confirmed direction

Arash commissioned engineering and product leadership; Mo and Arash own the business, service and domain decisions. IELTS Academic leads the first pilot, with both independent study and expert coaching, for all learner levels and target bands. Persian is the default interface with an English option. An IELTS teacher/examiner will review the original packs and assessments. The supplied resources have Arash-confirmed commercial/distribution rights for an Iranian audience; the product will use original packs/tests derived from them. Preserve the territory and content lineage. No full resource corpus has been added to the application or sent to an external processor.

The reviewed scaffold is `Moe-G92/mitooni` at `d2266e8e4b92869d857c6d19d4d635509a960fab`. The read-only reuse source is `sqe-cracker/sqe-tutor` at `af57036ad18a45a0aa20a81202c9e0939ebd99d5`. Local work is on `codex/foundation-review-20261104`. The existing `web/` and source learning materials remain unchanged; new port implementation lives under `platform/`.

## Decision 1: port BarEx's shell and useful platform

Arash's latest explicit instruction supersedes the initial proposal to retain Mo's shell: port everything useful from BarEx and fill that shell with the new Mitooni corpus. BarEx is the product/platform base. Mo's current scaffold remains preserved as IELTS-specific reference work, content contracts and candidate exam interactions to bring into the BarEx-derived shell.

Reuse the existing React/Vite frontend, FastAPI/Python backend and suitable BarEx assets, services, integrations, hosting and AI. Source inspection identifies Supabase Auth/Postgres/private Storage, OpenAI SDK/Agents/ChatKit/realtime, Railway backend configuration, Vercel frontend configuration, Resend and Turnstile. Stripe integration exists but Mitooni payments remain undecided. These are source-observed arrangements; live account configuration and Iranian eligibility have not been verified. No Redis dependency is established; the source has Postgres-backed leased jobs.

Prepare an exact port allowlist/import inventory, adapt product/domain configuration, and test the receiving application. Separate Mitooni data, content, retrieval, storage, jobs and authorization. Existing provider accounts, infrastructure and hosting can be reused where permitted and appropriately isolated; no categorical ban on shared accounts/deployments is intended. Prefer an independent Mitooni workload on that infrastructure unless verified tenancy makes a shared runtime safe. No BarEx learners, private coaching, corpus or secrets are copied. Build a staged port without overwriting Mo's existing files, then choose the final directory cutover after verification.

BarEx's existing auth-only browser SDK plus Bearer-authenticated BFF is the starting session architecture. Mo's exam components currently expect cookie calls and a different error shape; adapt that boundary deliberately rather than mixing protocols. Retain default-deny RLS and backend-mediated data operations. Review token lifecycle, allowed origins, account recovery and runtime schemas in the adapted shell. No service credential belongs in browser code. Provider use still depends on permitted and reachable service for the intended end users.

Alternatives considered:

- A blind filesystem copy would bring unrelated legal-exam data, migrations, integrations and content risks. Reject that method, not the requested BarEx platform port. Carry over all useful components through an inspected allowlist and adapted domain boundaries.
- A literal implementation of Mo's mock API preserves missing ownership, unsafe mutable fields, non-idempotent submissions and unvalidated scoring. Reject.
- A separate greenfield frontend/backend would contradict the requested BarEx base and recreate useful work. Do not pursue it. A universal multi-exam platform is also premature.

Port useful implementations, not only inspiration: shell/navigation/UI, auth and API plumbing, tutor/voice workflow, practice/mock/progress patterns, coaching, content publication/jobs and operational controls where the manifest confirms suitability. Replace SQE taxonomy, answer assumptions, source paths, prompts and corpus bindings with reviewed Mitooni equivalents. Stage modules rather than pretending everything is portable in one copy. Reuse does not transfer security or release approval.

## Decision 2: make submitted work recoverable and authoritative

Separate authoring content, private answers/transcripts and learner delivery into different schemas. Delivery uses positive allowlists. Pin content revision, rubric version and assessment policy to every attempt. Source edits cannot alter an existing attempt or returned review.

Server transitions own start/deadline, current section, submission and review state. Client time is display information. Define practice interruption and exam interruption separately. Use per-attempt writer ownership/revision checks, serialized client saves, durable queued edits and an atomic submission barrier. Repeated requests must return the same logical outcome; network delivery is allowed to repeat. Do not report saved until the authoritative write is acknowledged.

Model feedback as pending, returned, failed or unavailable, with author and revision. A learner's profile patch cannot alter identity, coaching entitlement, reviewer assignment or marking. Expert access is scoped to explicit assignments and revocable. Returned feedback refers to the frozen submission; learner revision creates a new response version.

Speaking requires a separate media proof: persist each take, reconcile uploads, validate bytes/container/size/duration, verify playback and deletion, then test microphone denial, device loss and reload. Browser-memory recordings and concatenated containers are not a safe pilot storage design.

## Decision 3: prove practice and coaching before predicting bands

The first internal vertical slice contains one original Reading passage with raw accuracy and evidence-linked explanations, and one original Writing Task 2 with self-review, expert review and learner revision. This is Academic practice, not a full mock or the entire pilot.

Why two task kinds: Reading proves independent checked practice and deterministic marking; Writing proves durable free response and the asynchronous human service. A Writing-only slice is technically smaller but does not establish the automatically checked practice experience already present in the scaffold. The second task kind is a bounded, purposeful addition rather than expansion to another exam.

No short-drill band conversion, numeric Writing/Speaking prediction, composite score from unmarked skills, or go/postpone advice is justified by this slice. Preserve accurate raw results and plain assessment state. Add validated estimates only after a separately agreed, blinded evaluation against independent expert judgments on held-out responses; expert disagreement and subgroup error must be measured too. A target copied from the market plan is not an established accuracy result.

The original pack pipeline needs source/edition/territory lineage, current exam blueprint and rubric, original task authorship, answer/evidence checks, independent domain review, immutable publication, and withdrawal/version correction. Keep practice content separate from held-out evaluation content. Old descriptors and book editions may inform study but do not determine current marking policy.

The first full pilot still needs Listening, Speaking and full-form timing/marking acceptance. The two-task internal slice does not silently remove them from the IELTS scope. Exact service promises, learner level, coaching capacity and assessment policy remain domain/business decisions.

## Decision 4: validate service feasibility independently of the code

Iran-based access, permitted provider use, business/operator structure, processing location and payment arrangements are separate constraints. A UK intermediary, reseller or alternate host does not itself establish lawful/contractually permitted service. A provider documentation page also does not establish real-network availability. The existing market plan is research input, not authority to adopt those routes.

Adapt existing identity, storage and AI integrations; keep their boundaries inspectable and replaceable without creating speculative multi-provider infrastructure. Payments are unresolved. Local synthetic engineering and content design can continue while service-specific operational evidence remains open. No live learner collection, processor uploads, provisioning or release follows from this checkpoint.

## Sequenced checkpoints and evidence

### C1 — baseline and foundation design (current)

Owners: coordinator and five specialists. Evidence: source audits, resource inventory, official exam/provider sources and synthetic browser baseline. Close only after specialist reports and independent challenge have been inspected. Existing tests are fixture evidence; no learning efficacy, provider authorization, Iranian reachability or production-security claim is implied.

### C2 — contracts and first-pack specification

Engineering: approve the BarEx port manifest and import/dependency boundaries, then stage the useful shell and services. Define authoritative IELTS DTOs, state transitions, error envelope, save/submit concurrency, session adaptation, coach assignment and deletion/retention policy. Produce executable synthetic contract fixtures and an isolated API/database spike using the existing stack. Domain team: confirm first-pack level coverage/sequence, name and allocate the teacher/examiner, and review the original pack outline. Coordinator integrates and independent reviewer challenges before implementation of the learner flow.

Acceptance: traceable safe-source port with no BarEx corpus/data/secrets; no key/transcript in learner delivery; impossible profile/role mutations rejected; explicit pending/failed review states; old content/attempt versions remain interpretable; recorded threat boundaries; local synthetic proof on the existing stack. Agree calendar, human owner, capacity and any budget before a learner experiment; none is invented here.

### C3 — durable self-study and coach review

Implement the bounded Reading/Writing slice, using synthetic/original fixtures until content is domain-approved. Acceptance: acknowledged work survives reload/server restart; unsent work remains visibly queued; stale/reordered/duplicated saves do not silently overwrite; duplicate submit returns one result; session expiry and conflicts recover; one learner cannot access another learner's artifact; unassigned/revoked coaches cannot access it; feedback/revision preserve prior versions. Run against a real isolated backend/database, not MSW alone.

### C4 — media and complete IELTS simulation

Prove Speaking take durability and supported-codec playback with synthetic audio first. Add domain-reviewed Listening, Speaking, complete Writing and full Reading forms with appropriate timing, separate practice/test modes, and accommodation handling. Test resource interruption, media permission denial, corrupted uploads, replay authorization and retention/deletion. Match a selected current exam delivery format; do not claim every official mode has identical mechanics.

### C5 — controlled learner pilot and release review

Arash/Mo establish operator, reachable/permitted service arrangements, domain reviewers, cohort, support, schedule, budget, success/stop criteria and approved public claims. Test actual Iranian device/network journeys with permitted synthetic checks before collecting learner data. Validate responsive and mixed-direction UI, keyboard/accessibility, failure recovery and necessary legal/payment flows. A blinded learning/marking evaluation is separate from usability. Coordinator gives an engineering verdict for the exact revision/configuration; Arash's release approval remains a separate gate.

Stop/rework rules: any cross-account disclosure, unexplained acknowledged-work loss, silent stale submission, unauthorized provider use or unsupported grading claim prevents pilot release. If selective reuse pulls in substantial unrelated domains, reopen the architecture comparison. Do not manufacture precise dates or numeric study targets without cohort and reviewer evidence.

## Open decisions from Arash and Mo

- First-pack sequence and representative level/target coverage within the confirmed all-level product; intended exam delivery modes.
- Named teacher/examiner, availability, independent review/adjudication roles, coaching workflow and capacity (reviewer type is confirmed).
- Operator/partner, exact existing service configuration and Iranian end-user eligibility; payment arrangement.
- Before a learner pilot: age range, cohort, accountable human, schedule, budget, approved promises and measurable success/stop criteria.

These do not block local source analysis or a synthetic technical specification. They do block choosing dependent operating arrangements or making learner-facing promises. No repeated rights confirmation is required for the already-authorized local work.

## Review and restart

All specialists use gpt-6.1-sol with medium effort. Architecture and reuse specialists agree with the latest BarEx-first direction, staged exact-file admission, retained source Auth/BFF architecture and separate Mitooni data boundaries. The learning specialist agrees with Reading + Task 2 as a technical integration slice, clarifying that the product still serves all levels/targets and the slice does not validate them all. Security agrees with reuse of existing accounts/infrastructure where isolated and permitted, without asserting live provider eligibility. Independent validation accepted local S0 design with concrete import/preview/auth/asset corrections in `research/port-review.md`. The coordinator accepted those corrections and assigned disjoint frontend/backend implementation.

Observed reference baseline: Mo's build/lint passed; 44 unit tests and 19 browser tests passed against its simulated API. Independent failure injection reproduced silent loss of an unsaved answer after a rejected save and reload. Focused scans found serious accessibility issues and phone exam clipping. These findings constrain selective exam-component integration; the green counts are not evidence for the new port or a live service. The receiving port must earn its own validation.

Completed ownership: scaffold_architecture implemented `platform/frontend/`; reuse_audit implemented `platform/backend/`; baseline_validation independently reviewed receiving functionality/UI and security_feasibility reviewed actual import/auth/bundle boundaries. The coordinator inspected actual backend code, requested concurrency/cache fixes, reviewed final desktop/mobile screenshots and integrated the evidence. All five specialists are stopped at their delivered checkpoints; the local shell server remains available for review. The coordinator owns shared records and integration.

### Accepted artifacts and evidence

- `platform/frontend/`: genuine adapted BarEx AppLayout, navigation/mobile drawer, header contexts, motion, theme/toast/recovery and UI primitives; Persian default/English option. Local synthetic preview at `/preview/topics`; separate production entry denies unconfigured access. Catalogue/notes/practice/mock routes are honest empty shell states, not functioning learning services.
- `platform/backend/`: BarEx-derived FastAPI verified-identity seam, explicit receiving configuration and guarded lazy Supabase client/read-only retry transport. Only health and identity routes. No product membership, profile, content, job or coaching service is claimed.
- Receiving frontend typecheck/lint/build/preview build and 5 focused tests passed. Independent runtime dependency audit reported zero vulnerabilities in 19 runtime dependencies (dev dependencies not covered). Final four widths were 360, 768, 1280 and 1920; focused axe scans returned no violations for the five routes and inspected dark/open-drawer states. Keyboard/focus, locale/theme reload and bounded no-external-request checks passed.
- Receiving backend has its own frozen environment; 42 tests passed and were independently reproduced. Client initialization/close is synchronized and cleans up failures; private identity/error responses are no-store. Denied-egress SDK construction/close probes passed. No actual Auth-server token verification or database/RLS integration ran.
- All 21 frontend source/target provenance rows match. Production source graph excludes preview/auth fixture modules; query/storage attempts did not unlock a sample production session. BarEx source remains clean and Mo's `web/` is unchanged. Source licensed materials, learner data and credentials were not transferred.

The independent records are `research/port-acceptance.md` and `research/port-security-review.md`; implementation records and exact manifests preserve commands, corrections, failures and limits. Security reviewer's browser launch attempts failed; the separate independent browser reviewer supplied the successful runtime evidence. Source fidelity is established by copied code/provenance and inspected receiving renders, not a live BarEx side-by-side run. No Lighthouse score, full WCAG conformance, full learning flow, real-network Iranian access or live provider validation is claimed. All substantive objections within this local checkpoint were resolved; the coordinator agrees with scoped local acceptance. This is not APPROVED FOR GO-LIVE.

### Next bounded assignment

Continue the authorized BarEx port with source auth/session and bootstrap/profile integration inside the new shell, backed by an isolated receiving data model. First specify and test product membership separately from shared-provider identity, explicit account/configuration boundaries, default-deny data policies, profile fields and session/account-change recovery. Reuse the source transport and auth-only browser SDK; use supported Node 22+ when adding that SDK (see coordinator compatibility note). No new permission is needed for this internal work.

Then port study/workspace/notes, tutor/voice, coaching and content/job modules in inspected slices, replacing their SQE domain bindings with Mitooni's versioned corpus and assessment contracts. Connect the original Reading/Task 2 review-and-revision slice only after its content blueprint and expert review. Teacher/examiner identity/capacity, first-pack level coverage, full four-skill validation, provider eligibility and payments remain the recorded domain/operational gates; they are not reasons to reconstruct the platform from scratch or to stop unrelated local work.

Start a continuation by reading this record and CHARTER, checking Git status and the two source revisions, then selecting the next explicit checkpoint. Exact source admission, remaining feature waves and evidence requirements are in `research/port-manifest.md` and `research/shell-port-plan.md`. No autonomous background implementation is implied after this checkpoint.
