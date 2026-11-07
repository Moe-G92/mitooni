# Listening and speaking author checkpoint — 6 November 2026

Owner: author_listening_speaking, specialist assignment; gpt-6.1-sol / medium. Base 2a0191e, branch codex/ielts-content-20261106. Scope: twelve original JSON units and this record only. Read root and app AGENTS.md explicitly. No source books, licensed exercises, private data, environment files or external model/audio calls used.

## Preflight (saved before authoring)

1. A top assessment author would check that answers depend on an audible utterance, not world knowledge; keep correction distractors temporally clear; require audio for speech evidence; and separate supported practice from a previously unseen transfer family. Domain review and media review remain real gates.
2. Raw material: official IELTS format pages accessed 2026-11-06, not sample questions or textbook adaptations. Original invented situations and utterances will be authored from scratch. Receiving approved JSON contract is the coordinator's assignment.
3. Methods: create a six-context listening coverage map, evidence-linked deterministic keys and distinct speaking prompt families; bilingual teaching/instructions; Python JSON/word-count/referential checks. Human content review and actual-media listening tests are necessary beyond these checks.
4. Independent evidence: a reviewer can locate each listening answer in the script, reject alternatives, verify strict word limits, check official-format correspondence, and assess actual recordings against four qualitative dimensions. JSON checks cannot prove intelligibility, teaching efficacy or IELTS band calibration.

## Design decision

Use short part-focused drills, not abbreviated tests claiming bands. Listening: foundation train Part 1 repair-workshop booking, foundation transfer Part 2 community garden orientation; intermediate train Part 3 fieldwork planning, intermediate transfer Part 1 equipment hire; advanced train Part 4 urban thermal research, advanced transfer Part 3 museum study discussion. Each script 400–700 words, five ordered items, at least one correction/distractor, private teacher-only stimulus; audio asset initially null. Supported training permits an explicit second playback; independent transfer has one playback with no advance teaching. No text substitute counts as listening.

Speaking: foundation train/transfer familiar-topic Part 1 (routines / local places), intermediate train/transfer Part 2 long turns (learning a practical skill / changing a plan), advanced train/transfer linked Part 2–3 (shared spaces / useful public information). Train anchors teach a process using note fragments rather than memorisable model speeches; transfer anchors empty until submission. Four qualitative criteria; no automatic bands; pronunciation and temporal fluency require recording. Audio consent, recording failure, accessibility adjustments and exposure recovery belong in teacher review notes.

Alternative rejected: uniform form completion for all levels would miss viewpoint and argument tracking; full simulated tests exceed the small first-set scope and need more media/rater validation. No portfolio content/code reuse is needed for these domain artifacts.

## Sources

- https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening — verified four contexts, question order, single playback and word limits.
- https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking — verified three parts, long-turn preparation/response timing and four criteria.

Official sources specify format only; no task wording is copied. All new content remains pending teacher review and audio production.

## Authored evidence and checks

Twelve original units authored, six listening and six speaking, with examTrack `shared` following Arash’s expansion to Academic and General Training. Every file remains teacherReview pending. English assessed content has Persian instructions, teaching anchors and feedback guidance; this has author review only, not a Persian-language teacher sign-off. All six train families differ from their transfer families.

- adv-listening-train: 498 whitespace-delimited script words; five items; script SHA-256 `11135de6f1501fcb40969159c95f1eba4d6602eed104a22378b31d202b34ea31`.
- adv-listening-transfer: 498 whitespace-delimited script words; five items; script SHA-256 `c3d4a78646b2434326ba6ba0fa9d52359376eb548e92d116c068c8aef35a7432`.
- fnd-listening-train: 474 whitespace-delimited script words; five items; script SHA-256 `d8dbf154765f8e3b309001475c3d24fb370422a7fbafb85ce67380368715e852`.
- fnd-listening-transfer: 482 whitespace-delimited script words; five items; script SHA-256 `a6716cd1f43cb342173c5f7a41bd078d4d4712dd83c3ca9bea1616117dedbc1c`.
- int-listening-train: 484 whitespace-delimited script words; five items; script SHA-256 `13413f03cda21398de462dcc62b3808819ee5c490ff6ce059ae527f2e05038f1`.
- int-listening-transfer: 497 whitespace-delimited script words; five items; script SHA-256 `7316047c05a85bfe9255ae3ef9a2570b25028a96e79a897d3d13d074e390dc45`.

Listening contexts: Part 1 conversation (foundation train, intermediate transfer); Part 2 everyday monologue (foundation transfer); Part 3 educational discussion (intermediate train, advanced transfer); Part 4 academic lecture (advanced train). Thirty keyed items cover detail, correction, decision, reason and qualified inference. Speaking: eight Part 1 questions across foundation; two long-turn cue cards plus follow-ups across intermediate; two long-turn cards plus follow-ups and eight related Part 3 questions across advanced. Supported anchors provide strategy fragments rather than model speeches; independent transfer supplies no teaching anchors before submission.

Checks actually run: Python 3 JSON parse and exact top-level field set; filename/id/version consistency; 12 unique families; six scripts 400–700 whitespace-delimited words; five listening items each; key/question correspondence; choice keys exist; accepted short responses fit two words; Persian/English anchor IDs match; transfer anchors empty; delivery assets null; all four qualitative speaking criteria present; speaking keys empty. All passed. The first command used unavailable `python`; reran successfully with `python3`. No test suite or media playback was claimed.

Independent blind reviewer/coordinator feedback was applied after inspecting the actual prompts: intermediate listening train now contains exact spoken wording “three days” to match its key; valid article/numeral variants were added within the two-word limit where grammar permits. Media worker and reviewer were notified of the script change before freeze. Final independent verdict belongs to that reviewer, not this author record.

Remaining gates: independent final item review; named IELTS teacher/examiner review of pedagogy, difficulty, keys, cultural suitability and Persian; production and actual audition of audio; supported replay versus once-only exposure controls; private script/key isolation in runtime; functioning consented recording and interruption handling; real interaction review for Speaking Part 3; no band-calibration evidence. Audio/recording assets remain null in these authored files until the coordinating media/runtime workflow supplies verified assets. No learner release or domain approval is claimed.

## Revised intake: supplied-resource authoring (before revision 2)

Arash clarified that the entire set must be based on the supplied licensed materials and expressly authorized selected-excerpt AI processing. Revision 1 is held and its earlier original-only design is superseded. PDF skill applied. Original situations/scripts may remain only where the source-derived teaching objective and task operation fit; adding citations alone is insufficient. No source PDF/image/audio is copied to public/build/content assets.

Actual source reading on 2026-11-06: local pdftotext bounded extraction of Mindset Foundation PDF11–17 (printed10–16), Level1 PDF17–24 (printed16–23), Level2 PDF22–28 (printed21–27), Level3 PDF21–31 (printed19–29). Truncated combined extraction was followed by separate complete Level1/2 and Level3 listening reads. Four representative pages rendered locally under /tmp/mitooni-ls-source-review and visually inspected: Foundation PDF17, Level1 PDF23, Level2 PDF28, Level3 PDF29. PDF offsets differ: +1 for Foundation/1/2, +2 for Level3. Canonical source-entry IDs/pages/hashes supplied by source-review specialist and validated centrally; no claim of reading whole books or hearing supplied book audio.

Observed learning sequence:

- Foundation: concrete daily-activity vocabulary and collocations → present simple/frequency → short meaning matches → listening association with paraphrase/distractor cues → keywords rather than complete scripts → peer feedback on comprehensibility, relevance and duration. Implication: novice units need real language practice, not just test tips.
- Level1 Listening: identify context and speaker roles before details; distinguish number forms and corrected values; match paraphrased meanings in ordered multiple choice. Speaking: collocations and frequency → distinguish fact/preference/habit questions → add a reason/detail using appropriate conjunctions → third-person verb-ending practice → spoken retry. Source’s fixed sentence/count advice is a practice scaffold, not an official assessment rule.
- Level2 Listening: identify information type before gap filling, decode complex numbers, reject options that are true but fail to answer the reason requested. Speaking: organise topic vocabulary by meaning → distinguish WH, why, yes/no and hypothetical questions → generate own questions from a topic map → identify syllable stress → concise extended Part1 responses. Existing intermediate Part2-only drafts do not demonstrate this sequence; revision adds a meaning-focused WH/why/would bridge before the long turn and maps the adaptation explicitly.
- Level3 Listening: discriminate synonyms from near-synonyms, predict gap meaning, use exact audible forms, track multiple-choice paraphrases and delayed decisions, distinguish condition/result in future-time clauses. Speaking: distinguish personal Part1, developed Part2 and abstract Part3; classify prediction/comparison/hypothesis/cause-effect/past-present functions; connect evidence to all four criteria; use future-time clauses and compare the meaning of time/condition links. Revision will make these language operations observable instead of only describing confidence or generic argument structure.

Revised design: each pair receives source-mapped language and task objectives, genuine graded train micropractice plus new independent application. Foundation retains novel repair/garden listening and routine/place speaking, but trains activity-meaning, question type, frequency, reason and spoken verb endings before the assessment. Intermediate retains novel research/hire listening with revised reason-sensitive questions; speaking explicitly builds WH/why/would handling into the skill/plan sequence. Advanced revises actual recorded wording/items to assess paraphrase/condition-result, and speaking prompts to sample comparison, prediction and hypothetical reasoning. All original surface texts remain novel; no source stories, model answers, question keys or recordings are transplanted. Every objective mapping will explain this transformation and its bounds.

## Revision 2 authored result and validation

All twelve units now version 2, examTrack shared, origin source_based_original. Revision 1 scripts, keys, coverage details and hashes above are historical and not a freeze candidate. Six complete new scripts and item sets replace every prior listening scenario. Source-derived semantic areas now are celebration reservation (Part1), exchange-host-family activities (Part2), student property-comparison project (Part3), accessible-home viewing (Part1), museum city-history interpretation (Part4 lecture), and educational museum-visit planning (Part3). These adapt actual source content domains while authoring new wording/details/questions. Final unit source mappings record each objective once, its exact source IDs, learning point, teaching connection and transformation.

Speaking: Foundation/MS1 routines/family activity language, frequency, because/so extension and third-person endings; MS2 hometown/accommodation vocabulary, WH/why/would response focus, mindmap and syllable stress; MS3 urban/rural place narratives, functional abstract discussion and time/condition meaning. Intermediate Part2 is transparently an extension after a source-grounded three-question Part1 bridge; selected source pages do not themselves establish full Part2 teaching coverage. Full MS3 PDF30–31 extraction was repeated to verify the time-clause meaning contrast and final integrated exam practice; no relative-clause objective is asserted from these pages.

Canonical source IDs: foundation listening MSF-L01/MS1-L01; foundation speaking MSF-S01/MS1-S01; intermediate listening MS2-L01; intermediate speaking MS2-S01; advanced listening MS3-L01; advanced speaking MS3-S01/MS3-L01. Central source-index owner records exact file/excerpt hashes and boundaries.

- adv-listening-train: 477 words; script SHA-256 `1b3cbf8ec21f642e61d5186f3858a044ae4e8ed1e011d4428c202b7d45ae81f1`.
- adv-listening-transfer: 498 words; script SHA-256 `1a2f3367fbb4d82b7e1891d821e801a8138658cec64d9d0ffaa5f6b18b0a5675`.
- fnd-listening-train: 475 words; script SHA-256 `4c66ae3f6e2c6a897b810daf198e2438047fbc2f9c9f9bdbe4ec8f1efc8c8552`.
- fnd-listening-transfer: 488 words; script SHA-256 `b677147ab1099c9008ac8b271492bfbc06f9d976c17932d2cf8a9f57b230c14c`.
- int-listening-train: 503 words; script SHA-256 `7ed5c25cabae1b3570a1075ed14bdd60d485293e89959fc6f48c57f450935204`.
- int-listening-transfer: 490 words; script SHA-256 `d4af5bf17715f91fd20e2b9ebb8592d6c25b06e4eff6fdc3a82c9faa5fc295a4`.

Executed receiving contract validation using platform/backend/.venv/bin/python and app.contracts.content.AuthorUnit.model_validate on all twelve revised files: PASS. Additional assertions: v2/shared/source_based_original; objective/mapping bijection and sourceRef subset; transfer anchors empty/train nonempty; teacher pending/media null; six scripts 400–700 words/five ordered keyed questions; numeric and short-answer word limits; uppercase valid choice IDs; all four speaking criteria and no deterministic spoken keys. All passed. Validation runs did not exercise delivery/recording/audio, rater calibration or learning impact. Independent reviewer and media worker notified; all old media hashes invalidated and no freeze until reviewer findings resolved.

Canonical source-index resolution check subsequently passed for all eight L/S source IDs: MSF-L01/S01 PDF11–17; MS1-L01 PDF17–19/S01 PDF20–24; MS2-L01 PDF22–24/S01 PDF25–28; MS3-L01 PDF21–26/S01 PDF27–31. These match the ranges actually read. All three Listening train instructions now explicitly put language micropractice before timed preview. Independent reviewer reports blind solutions supported for all thirty revised Listening items, including numeric normalization to 2.6/265000, and directly confirms housing/museum semantic derivation from raw MS2/MS3 pages. Remaining independent speaking/source checks belong to the reviewer. No source audio/transcript was reviewed and no source-answer or audio fidelity is claimed: new values, details and keys are Mitooni-authored adaptations requiring teacher/media review.

## Final semantic exposure correction

The earlier statement that every train/transfer family is distinct is superseded. All twelve familyId values now identify conservative semantic scenario groups, with shared IDs across actual train/transfer and cross-skill overlap. No script, question or key changed for this integration. A changed unit name, numeric value or surface wording does not establish fresh transfer. Full Listening script exposure shares its scenario group across every question; finer groups additionally record the requested concept. Shared source book/method alone is not the exposure criterion.

Source alignment versus authored variation: MS1 celebration booking supplies guest/date/time correction semantics and some overlapping small numeric alternatives; this is not falsely described as entirely novel source facts. Cafe graduation celebration, dietary check and candle request are newly authored variation. MSF/MS1 supply host-family routines, member-activity matching, shared chores/outings and frequency/preference language; basketball, repair and household meal/outdoor activity concepts remain recognisable adaptations. New host roles, travel instructions and picnic plan are authored details. MS2 supplies measured rooms, garden access through a sun room, appliance inclusion, asking/offer and viewing-choice semantics; our sun-room route deliberately retains that source fact type, while dimensions/prices, project framing, access need and calendar decisions are authored variations. MS3 supplies city-history museum eras/exhibits/booking/tour conditions and urban/rural living/transport change; our evidence lecture, notebooks/headphones/staffing rules and educational comparison project are original elaborations within that semantic scope, not claimed source transcript facts. The two advanced speaking cards remain exposed urban/quieter-living variants, not fresh solely because details change.

Per-question groups and final authored-file hashes (before any later delivery-asset attachment; compiled artifacts must bind their actual final bytes):

```json
{
  "fnd-listening-train": {
    "familyId": "sem-family-celebration-booking",
    "questionExposureGroups": {
      "q1": [
        "sem-family-celebration-booking",
        "sem-celebration-headcount-correction"
      ],
      "q2": [
        "sem-family-celebration-booking",
        "sem-celebration-date-correction"
      ],
      "q3": [
        "sem-family-celebration-booking",
        "sem-celebration-meal-time"
      ],
      "q4": [
        "sem-family-celebration-booking",
        "sem-shared-meal-suitability"
      ],
      "q5": [
        "sem-family-celebration-booking",
        "sem-celebration-cake-items"
      ]
    },
    "unitSha256": "daf53edece8fd881b86cdf78fb78d9acad45034d2b27d4de3242e4c214c81ca1"
  },
  "fnd-listening-transfer": {
    "familyId": "sem-household-shared-routines",
    "questionExposureGroups": {
      "q1": [
        "sem-household-shared-routines",
        "sem-household-college-travel"
      ],
      "q2": [
        "sem-household-shared-routines",
        "sem-household-member-activities"
      ],
      "q3": [
        "sem-household-shared-routines",
        "sem-household-member-activities"
      ],
      "q4": [
        "sem-household-shared-routines",
        "sem-household-shared-tasks"
      ],
      "q5": [
        "sem-household-shared-routines",
        "sem-household-shared-outings"
      ]
    },
    "unitSha256": "f3523e96490a4735411ef9c20a2af09fe84bc20d32c052f43511cb52e93ce23e"
  },
  "fnd-speaking-train": {
    "familyId": "sem-household-shared-routines",
    "questionExposureGroups": {
      "q1": [
        "sem-household-shared-routines",
        "sem-household-shared-tasks",
        "sem-shared-meal-suitability"
      ],
      "q2": [
        "sem-household-shared-routines",
        "sem-household-shared-outings"
      ],
      "q3": [
        "sem-household-shared-routines",
        "sem-household-member-activities"
      ],
      "q4": [
        "sem-household-shared-routines",
        "sem-household-shared-outings"
      ]
    },
    "unitSha256": "5ac39ce521c04cbe35daeac5db080ee2c97a325a66ead25602dd6de045e0fa30"
  },
  "fnd-speaking-transfer": {
    "familyId": "sem-household-shared-routines",
    "questionExposureGroups": {
      "q1": [
        "sem-household-shared-routines",
        "sem-household-shared-outings"
      ],
      "q2": [
        "sem-household-shared-routines",
        "sem-household-member-activities"
      ],
      "q3": [
        "sem-household-shared-routines",
        "sem-household-shared-outings"
      ],
      "q4": [
        "sem-household-shared-routines",
        "sem-household-shared-outings",
        "sem-shared-meal-suitability"
      ]
    },
    "unitSha256": "1950362041b4449f4a1fb4e5736561fed25f87d2320e8670367cdc6966eb58f0"
  },
  "int-listening-train": {
    "familyId": "sem-accommodation-feature-choices",
    "questionExposureGroups": {
      "q1": [
        "sem-accommodation-feature-choices",
        "sem-property-feature-comparison"
      ],
      "q2": [
        "sem-accommodation-feature-choices",
        "sem-property-room-measurements"
      ],
      "q3": [
        "sem-accommodation-feature-choices",
        "sem-property-outdoor-access"
      ],
      "q4": [
        "sem-accommodation-feature-choices",
        "sem-property-included-appliances"
      ],
      "q5": [
        "sem-accommodation-feature-choices",
        "sem-property-viewing-choice"
      ]
    },
    "unitSha256": "bb97314caf44a2373a42649cb75038be955ef79756e0275434d4a73da1b5a888"
  },
  "int-listening-transfer": {
    "familyId": "sem-accommodation-feature-choices",
    "questionExposureGroups": {
      "q1": [
        "sem-accommodation-feature-choices",
        "sem-property-access-suitability"
      ],
      "q2": [
        "sem-accommodation-feature-choices",
        "sem-property-asking-price"
      ],
      "q3": [
        "sem-accommodation-feature-choices",
        "sem-property-room-count"
      ],
      "q4": [
        "sem-accommodation-feature-choices",
        "sem-property-outdoor-access"
      ],
      "q5": [
        "sem-accommodation-feature-choices",
        "sem-property-viewing-choice"
      ]
    },
    "unitSha256": "4cf647a1267e8785ec8c44b2a5c9f7d1eb6c433d5c3ed958c1d3293aaa6fa19a"
  },
  "int-speaking-train": {
    "familyId": "sem-hometown-visitor-place",
    "questionExposureGroups": {
      "q1": [
        "sem-hometown-visitor-place",
        "sem-local-place-types"
      ],
      "q2": [
        "sem-hometown-visitor-place",
        "sem-local-place-preference"
      ],
      "q3": [
        "sem-hometown-visitor-place",
        "sem-place-visit-preference"
      ],
      "q4": [
        "sem-hometown-visitor-place",
        "sem-place-visit-preference"
      ],
      "q5": [
        "sem-hometown-visitor-place",
        "sem-place-visit-preference"
      ]
    },
    "unitSha256": "61d4609b6031b6a07d59b05d9d56cedf68633cccb51e2564bbf4bebba9cf9975"
  },
  "int-speaking-transfer": {
    "familyId": "sem-accommodation-feature-choices",
    "questionExposureGroups": {
      "q1": [
        "sem-accommodation-feature-choices",
        "sem-property-feature-comparison"
      ],
      "q2": [
        "sem-accommodation-feature-choices",
        "sem-shared-accommodation-choice"
      ],
      "q3": [
        "sem-accommodation-feature-choices",
        "sem-home-location-transport"
      ],
      "q4": [
        "sem-accommodation-feature-choices",
        "sem-property-feature-comparison",
        "sem-home-location-transport"
      ],
      "q5": [
        "sem-accommodation-feature-choices",
        "sem-property-access-suitability"
      ]
    },
    "unitSha256": "4d22ad3a22d1c8ed1b1a46b3b1a22ba6e437f536011eda871ed83f2db04453ea"
  },
  "adv-listening-train": {
    "familyId": "sem-city-museum-evidence-visit",
    "questionExposureGroups": {
      "q1": [
        "sem-city-museum-evidence-visit",
        "sem-museum-historical-interpretation"
      ],
      "q2": [
        "sem-city-museum-evidence-visit",
        "sem-museum-historical-evidence"
      ],
      "q3": [
        "sem-city-museum-evidence-visit",
        "sem-museum-visit-conditions"
      ],
      "q4": [
        "sem-city-museum-evidence-visit",
        "sem-museum-historical-interpretation"
      ],
      "q5": [
        "sem-city-museum-evidence-visit",
        "sem-museum-visit-conditions"
      ]
    },
    "unitSha256": "112470934a150436b4c5e43ac939e620e70db6cca58c82e952e1129451ddb380"
  },
  "adv-listening-transfer": {
    "familyId": "sem-city-museum-evidence-visit",
    "questionExposureGroups": {
      "q1": [
        "sem-city-museum-evidence-visit",
        "sem-museum-historical-evidence"
      ],
      "q2": [
        "sem-city-museum-evidence-visit",
        "sem-museum-booking-date"
      ],
      "q3": [
        "sem-city-museum-evidence-visit",
        "sem-museum-visit-conditions"
      ],
      "q4": [
        "sem-city-museum-evidence-visit",
        "sem-museum-tour-learning-choice"
      ],
      "q5": [
        "sem-city-museum-evidence-visit",
        "sem-museum-visit-conditions"
      ]
    },
    "unitSha256": "ea1365d6e538d959d802a7291b3ab3c1fb93ffd2dbdb939734ad55f4ef2864b6"
  },
  "adv-speaking-train": {
    "familyId": "sem-urban-quieter-living-choices",
    "questionExposureGroups": {
      "q1": [
        "sem-urban-quieter-living-choices",
        "sem-place-visit-preference"
      ],
      "q2": [
        "sem-urban-quieter-living-choices",
        "sem-place-visit-preference"
      ],
      "q3": [
        "sem-urban-quieter-living-choices",
        "sem-urban-quieter-daily-life"
      ],
      "q4": [
        "sem-urban-quieter-living-choices",
        "sem-home-location-transport"
      ],
      "q5": [
        "sem-urban-quieter-living-choices",
        "sem-town-change-service-needs"
      ],
      "q6": [
        "sem-urban-quieter-living-choices",
        "sem-home-location-transport"
      ]
    },
    "unitSha256": "643dbd0ab5cd66cb010040130b7418d0768c52ef42c9bbcf1db471583f5e0207"
  },
  "adv-speaking-transfer": {
    "familyId": "sem-urban-quieter-living-choices",
    "questionExposureGroups": {
      "q1": [
        "sem-urban-quieter-living-choices",
        "sem-home-location-transport"
      ],
      "q2": [
        "sem-urban-quieter-living-choices",
        "sem-home-location-transport"
      ],
      "q3": [
        "sem-urban-quieter-living-choices",
        "sem-home-location-transport",
        "sem-urban-quieter-daily-life"
      ],
      "q4": [
        "sem-urban-quieter-living-choices",
        "sem-urban-quieter-daily-life"
      ],
      "q5": [
        "sem-urban-quieter-living-choices",
        "sem-home-location-transport",
        "sem-town-change-service-needs"
      ],
      "q6": [
        "sem-urban-quieter-living-choices",
        "sem-town-change-service-needs"
      ]
    },
    "unitSha256": "c60ae1b77b2649cffbed22830e1a5b60f2df8b9e590e64e19263198bdcc05479"
  }
}
```

Authority clarification: Arash’s processing authorization now covers full-corpus AI ingestion and synthesis, not merely selected excerpts. Actual reading for these authored units remains the recorded bounded pages; broad authorization is not evidence that all corpus pages were read. Final rights notes reflect this distinction. Post-family/rights-note AuthorUnit validation and per-question map coverage passed for all twelve files; final unit hashes above refreshed after these metadata-only changes. Script/question/key bytes remain unchanged.
