import { z } from "zod";

/*
 * The single data contract between the frontend and the backend.
 * Every MSW handler returns these shapes, and the real API must too.
 * `npm run export:schemas` writes them as JSON Schema to docs/handoff/schemas.
 */

export const Locale = z.enum(["en", "fa"]);
export const Theme = z.enum(["system", "light", "dark"]);
export const Skill = z.enum(["listening", "reading", "writing", "speaking"]);
export const Band = z.number().min(0).max(9).multipleOf(0.5);

/** Text shown to the learner in both languages. Exam content itself is English only. */
export const Localized = z.object({ en: z.string(), fa: z.string() });

/* ------------------------------------------------------------------ */
/*  Learner                                                            */
/* ------------------------------------------------------------------ */

export const Targets = z.object({
  overall: Band,
  listening: Band,
  reading: Band,
  writing: Band,
  speaking: Band,
});

export const Profile = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  locale: Locale,
  theme: Theme,
  targets: Targets,
  /** ISO date (YYYY-MM-DD) of the booked test, or null. */
  testDate: z.string().nullable(),
  currentLevel: Band.nullable(),
  weeklyHours: z.number().int().min(0).max(60),
  /** Extra time multiplier for timed sections, recorded on every attempt. */
  accommodation: z.union([z.literal(1), z.literal(1.25), z.literal(1.5), z.literal(2)]),
  /** Show the flag-for-review control in the exam shell (not in the official demo). */
  showFlag: z.boolean(),
  onboarded: z.boolean(),
  /** ISO timestamp of the next full mock the learner has scheduled, or null. */
  scheduledMock: z.string().nullable(),
  plan: z.enum(["standard", "coach"]),
  notifications: z.object({ email: z.boolean(), reminders: z.boolean() }),
});

/* ------------------------------------------------------------------ */
/*  Test content                                                       */
/* ------------------------------------------------------------------ */

/** Official question type names from ielts.org (Reading 14, Listening 10, some shared). */
export const QuestionType = z.enum([
  "multiple-choice",
  "tfng", // Identifying information: TRUE / FALSE / NOT GIVEN
  "ynng", // Identifying writer's views: YES / NO / NOT GIVEN
  "matching-information",
  "matching-headings",
  "matching-features",
  "matching-sentence-endings",
  "sentence-completion",
  "summary-completion",
  "note-completion",
  "table-completion",
  "flow-chart-completion",
  "diagram-label-completion",
  "short-answer",
  "matching", // Listening
  "plan-map-diagram-labelling", // Listening
  "form-completion", // Listening
]);

/** The seven ways a learner answers. One interaction can serve several question types. */
export const Interaction = z.enum([
  "single", // radio: multiple choice, TFNG, YNNG
  "multi", // checkboxes: Choose TWO / THREE
  "gap", // inline text inputs inside notes, tables, flow charts, sentences
  "drag", // drag a chip into a slot (matching headings), with click-to-place
  "select", // dropdown per item from a shared list
  "grid", // radio grid, rows = items, columns = letters (Listening matching, map labelling)
  "diagram", // image with positioned text inputs
]);

export const Option = z.object({ key: z.string(), text: z.string() });

/**
 * Text supports two inline tokens:
 *   **bold**        bold text
 *   {{12}}          the answer box for question 12 (gap and diagram interactions)
 */
export const ContentBlock = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("heading"), text: z.string() }),
  z.object({ kind: z.literal("paragraph"), text: z.string() }),
  z.object({ kind: z.literal("list"), items: z.array(z.string()) }),
  z.object({ kind: z.literal("table"), header: z.array(z.string()).optional(), rows: z.array(z.array(z.string())) }),
  z.object({ kind: z.literal("flow"), steps: z.array(z.string()) }),
]);

export const Item = z.object({
  id: z.string(),
  /** Usually one number. "Choose TWO" items carry two, e.g. [18, 19], shown as "18–19". */
  numbers: z.array(z.number().int().min(1).max(40)).min(1),
  /** Question text (single, multi, select, grid). Gap items live in the group content instead. */
  prompt: z.string().optional(),
  /** Per-item options (single choice). */
  options: z.array(Option).optional(),
  /** Accepted answers. Gap: any variant matches (case-insensitive). Multi: the set of correct keys. */
  answer: z.array(z.string()).min(1),
  /** Diagram interaction: where the box sits on the image, in percent. */
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  explanation: Localized,
  /** Name of the trap the question sets, e.g. "Paraphrase". */
  trap: Localized.optional(),
  /** The passage sentence or transcript line that proves the answer. */
  evidence: z.string().optional(),
});

export const QuestionGroup = z.object({
  id: z.string(),
  type: QuestionType,
  interaction: Interaction,
  /** e.g. "Questions 1–6" */
  title: z.string(),
  /** The rubric, with **bold** allowed. */
  instructions: z.string(),
  /** Shared options: headings list, features list, sentence endings, grid letters, Choose TWO list. */
  options: z.array(Option).optional(),
  optionsTitle: z.string().optional(),
  /** Gap interactions: the notes, table or flow chart with {{n}} boxes. */
  content: z.array(ContentBlock).optional(),
  /** Diagram and map interactions: id of an SVG drawn by the frontend (see src/exam/figures). */
  figure: z.string().optional(),
  /** "Choose TWO letters": how many choices each multi item takes. */
  choose: z.number().int().optional(),
  items: z.array(Item).min(1),
});

export const PassageParagraph = z.object({
  /** Paragraph letter (A, B, C...) when questions refer to it. */
  label: z.string().optional(),
  text: z.string(),
  /** Matching headings: the question number whose drop box sits above this paragraph. */
  slot: z.number().int().optional(),
});

export const Passage = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  paragraphs: z.array(PassageParagraph),
});

export const TranscriptLine = z.object({ speaker: z.string(), text: z.string() });

export const Audio = z.object({
  src: z.string(),
  durationSec: z.number(),
  transcript: z.array(TranscriptLine),
});

export const WritingTask = z.object({
  task: z.union([z.literal(1), z.literal(2)]),
  minutes: z.number(),
  minWords: z.number(),
  /** Paragraphs of the prompt; **bold** allowed. */
  prompt: z.array(z.string()),
  /** Task 1: id of the chart drawn by the frontend. */
  figure: z.string().optional(),
});

export const SpeakingQuestion = z.object({ id: z.string(), text: z.string(), audio: z.string() });

export const SpeakingPart = z.object({
  part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  intro: SpeakingQuestion.optional(),
  questions: z.array(SpeakingQuestion),
  cueCard: z
    .object({ topic: z.string(), bullets: z.array(z.string()), final: z.string() })
    .optional(),
  prepSec: z.number().optional(),
  talkSec: z.number().optional(),
  /** Longest answer per question before the examiner moves on. */
  maxAnswerSec: z.number(),
});

export const Part = z.object({
  id: z.string(),
  number: z.number().int(),
  /** Banner line under "Part N", e.g. "Read the text and answer questions 1–13." */
  rubric: z.string(),
  passage: Passage.optional(),
  audio: Audio.optional(),
  groups: z.array(QuestionGroup).default([]),
  writing: WritingTask.optional(),
  speaking: SpeakingPart.optional(),
});

export const Section = z.object({
  id: z.string(),
  skill: Skill,
  title: z.string(),
  /** Timed length before any accommodation. Listening = audio + 2 minutes checking. */
  durationSec: z.number(),
  parts: z.array(Part),
});

export const Test = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["full", "section", "practice"]),
  /** Practice sets only: the question type being drilled. */
  questionType: QuestionType.optional(),
  sections: z.array(Section),
});

export const TestSummary = z.object({
  id: z.string(),
  title: z.string(),
  kind: Test.shape.kind,
  skills: z.array(Skill),
  questionType: QuestionType.optional(),
  minutes: z.number(),
  questions: z.number(),
});

/* ------------------------------------------------------------------ */
/*  Attempts                                                           */
/* ------------------------------------------------------------------ */

export const AnswerValue = z.union([z.string(), z.array(z.string())]);

export const Highlight = z.object({
  id: z.string(),
  /** data-hl-root value of the text block the highlight lives in. */
  root: z.string(),
  start: z.number(),
  end: z.number(),
  noteId: z.string().optional(),
});

export const Note = z.object({ id: z.string(), quote: z.string(), text: z.string(), createdAt: z.string() });

export const SectionState = z.object({
  sectionId: z.string(),
  status: z.enum(["not-started", "in-progress", "submitted"]),
  /** Seconds left, saved with every autosave. */
  remainingSec: z.number(),
  currentPart: z.number().int(),
  currentNumber: z.number().int(),
  /** Keyed by item id. */
  answers: z.record(z.string(), AnswerValue),
  flags: z.array(z.number().int()),
  highlights: z.array(Highlight),
  notes: z.array(Note),
  /** Writing: essay text by part id. */
  essays: z.record(z.string(), z.string()),
  /** Speaking: recording key (stored in the browser in the prototype) by part id. */
  recordings: z.record(z.string(), z.object({ key: z.string(), durationSec: z.number() })),
  /** Seconds spent with each part on screen, for pacing feedback. */
  partTime: z.record(z.string(), z.number()),
  startedAt: z.string().nullable(),
  submittedAt: z.string().nullable(),
});

export const Attempt = z.object({
  id: z.string(),
  testId: z.string(),
  testTitle: z.string(),
  kind: Test.shape.kind,
  mode: z.enum(["exam", "practice"]),
  accommodation: Profile.shape.accommodation,
  status: z.enum(["in-progress", "submitted"]),
  sectionIndex: z.number().int(),
  sections: z.array(SectionState),
  startedAt: z.string(),
  submittedAt: z.string().nullable(),
});

/** Body of PATCH /api/attempts/:id/state. Any subset of a section's state. */
export const SectionPatch = SectionState.partial().extend({ sectionId: z.string() });

/** Practice mode "Check answer". The exam never receives answer keys up front. */
export const CheckResult = z.object({
  itemId: z.string(),
  correct: z.boolean(),
  answer: z.array(z.string()),
  explanation: Localized,
  trap: Localized.optional(),
  evidence: z.string().optional(),
});

/** Response of POST /api/attempts/:id/sections/:sectionId/submit */
export const SubmitResponse = z.object({ attempt: Attempt, resultReady: z.boolean() });

/* ------------------------------------------------------------------ */
/*  Results and feedback                                               */
/* ------------------------------------------------------------------ */

/**
 * One sub-skill inside a criterion, for the score breakdown (for example Pace,
 * Pausing and Hesitations inside Fluency and coherence).
 */
export const CriterionMetric = z.object({
  key: z.string(),
  label: Localized,
  /** 0–100: how close this sub-skill is to band 9 performance. */
  score: z.number().min(0).max(100),
  verdict: z.enum(["needs-work", "acceptable", "good", "strong"]),
  note: Localized,
  /** Words from the learner's own essay or transcript that show it (English). */
  example: z.string().optional(),
});

export const Criterion = z.object({
  key: z.enum(["tr", "cc", "lr", "gra", "fc", "p"]),
  band: Band,
  comment: Localized,
  /** Sub-skills for the breakdown view. Optional: older results have none. */
  metrics: z.array(CriterionMetric).optional(),
  /** Concrete things to do to raise this criterion, most useful first. */
  tips: z.array(Localized).optional(),
});

export const Annotation = z.object({
  /** The exact words in the essay or transcript this note is about. */
  quote: z.string(),
  kind: z.enum(["grammar", "vocabulary", "cohesion", "task"]),
  note: Localized,
  fix: z.string().optional(),
});

export const WritingFeedback = z.object({
  partId: z.string(),
  task: z.union([z.literal(1), z.literal(2)]),
  words: z.number(),
  essay: z.string(),
  band: Band,
  criteria: z.array(Criterion),
  annotations: z.array(Annotation),
  summary: Localized,
  /** True while scores come from fixtures, not a real marker. */
  dummy: z.boolean(),
});

export const SpeakingFeedback = z.object({
  band: Band,
  criteria: z.array(Criterion),
  parts: z.array(
    z.object({
      part: z.number().int(),
      partId: z.string(),
      /** Band for this part on its own, shown on the part tabs. Optional. */
      band: Band.optional(),
      recordingKey: z.string().nullable(),
      durationSec: z.number(),
      transcript: z.string(),
    }),
  ),
  pronunciation: z.array(z.object({ word: z.string(), note: Localized })),
  annotations: z.array(Annotation),
  summary: Localized,
  dummy: z.boolean(),
});

export const ItemResult = z.object({
  itemId: z.string(),
  numbers: z.array(z.number()),
  sectionId: z.string(),
  skill: Skill,
  type: QuestionType,
  prompt: z.string(),
  given: z.array(z.string()),
  correct: z.array(z.string()),
  marks: z.number(),
  maxMarks: z.number(),
  explanation: Localized,
  trap: Localized.optional(),
  evidence: z.string().optional(),
});

export const SkillScore = z.object({
  skill: Skill,
  raw: z.number().nullable(),
  total: z.number().nullable(),
  band: Band,
  /** Seconds used and allowed, for the pacing view. */
  usedSec: z.number(),
  allowedSec: z.number(),
});

export const TypeStat = z.object({ type: QuestionType, skill: Skill, correct: z.number(), total: z.number() });

export const Result = z.object({
  attemptId: z.string(),
  testId: z.string(),
  testTitle: z.string(),
  kind: Test.shape.kind,
  mode: Attempt.shape.mode,
  accommodation: Profile.shape.accommodation,
  completedAt: z.string(),
  overall: Band.nullable(),
  skills: z.array(SkillScore),
  byType: z.array(TypeStat),
  items: z.array(ItemResult),
  writing: z.array(WritingFeedback),
  speaking: SpeakingFeedback.nullable(),
  next: z.object({ title: Localized, detail: Localized, questionType: QuestionType.optional(), skill: Skill }),
});

export const ResultSummary = Result.pick({
  attemptId: true,
  testTitle: true,
  kind: true,
  mode: true,
  completedAt: true,
  overall: true,
  skills: true,
});

/* ------------------------------------------------------------------ */
/*  Dashboard and progress                                             */
/* ------------------------------------------------------------------ */

export const Strength = z.enum(["weakness", "fair", "strength"]);

export const Dashboard = z.object({
  predicted: z.object({ low: Band, high: Band, mocks: z.number(), questions: z.number() }).nullable(),
  skills: z.array(z.object({ skill: Skill, band: Band.nullable(), target: Band })),
  readingTypes: z.array(z.object({ type: QuestionType, accuracy: z.number(), strength: Strength })),
  focus: z.object({ type: QuestionType, marksLost: z.number() }).nullable(),
  trend: z.array(z.object({ date: z.string(), band: Band, attemptId: z.string() })),
  next: z.object({ title: Localized, detail: Localized, href: z.string() }),
  nextMock: z.string().nullable(),
  pacing: z.array(
    z.object({
      key: z.enum(["listening", "reading", "writing1", "writing2"]),
      ratio: z.number(),
      label: Localized,
      over: z.boolean(),
    }),
  ),
  pacingNote: Localized,
  writing: z
    .object({
      attemptId: z.string(),
      date: z.string(),
      criteria: z.array(Criterion),
      summary: Localized,
    })
    .nullable(),
  daysToTest: z.number().nullable(),
});

export const Progress = z.object({
  trend: Dashboard.shape.trend,
  bySkill: z.array(z.object({ skill: Skill, points: z.array(z.object({ date: z.string(), band: Band })) })),
  types: z.array(
    z.object({ type: QuestionType, skill: Skill, correct: z.number(), total: z.number(), strength: Strength }),
  ),
  history: z.array(ResultSummary),
  studyDays: z.array(z.string()),
});

export const PracticeCatalog = z.array(
  z.object({
    skill: Skill,
    types: z.array(
      z.object({
        /** null for Writing and Speaking, which practise by task or part instead of question type. */
        type: QuestionType.nullable(),
        accuracy: z.number().nullable(),
        attempts: z.number(),
        sets: z.array(TestSummary),
      }),
    ),
  }),
);

/* ------------------------------------------------------------------ */
/*  Vocabulary, coach, notifications                                   */
/* ------------------------------------------------------------------ */

export const VocabCard = z.object({
  id: z.string(),
  term: z.string(),
  partOfSpeech: z.string(),
  meaning: Localized,
  example: z.string(),
  /** ISO timestamp when the card is next due. */
  due: z.string(),
  intervalDays: z.number(),
  reps: z.number().int(),
  custom: z.boolean(),
});

export const VocabSummary = z.object({
  due: z.number(),
  learning: z.number(),
  known: z.number(),
  total: z.number(),
  reviewDays: z.array(z.object({ date: z.string(), count: z.number() })),
});

export const Coach = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  credentials: Localized,
  bio: Localized,
});

export const Slot = z.object({ id: z.string(), start: z.string(), minutes: z.number(), booked: z.boolean() });

export const CoachMessage = z.object({ author: z.enum(["coach", "me"]), text: z.string(), at: z.string() });

export const CoachReview = z.object({
  id: z.string(),
  kind: z.enum(["essay", "recording"]),
  title: z.string(),
  attemptId: z.string().nullable(),
  status: z.enum(["requested", "in-review", "returned"]),
  submittedAt: z.string(),
  messages: z.array(CoachMessage),
});

export const CoachState = z.object({
  coach: Coach,
  slots: z.array(Slot),
  bookings: z.array(Slot),
  reviews: z.array(CoachReview),
});

export const Notification = z.object({
  id: z.string(),
  title: Localized,
  body: Localized,
  at: z.string(),
  read: z.boolean(),
  href: z.string().nullable(),
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Locale = z.infer<typeof Locale>;
export type ThemeChoice = z.infer<typeof Theme>;
export type Skill = z.infer<typeof Skill>;
export type Localized = z.infer<typeof Localized>;
export type Targets = z.infer<typeof Targets>;
export type Profile = z.infer<typeof Profile>;
export type QuestionType = z.infer<typeof QuestionType>;
export type Interaction = z.infer<typeof Interaction>;
export type Option = z.infer<typeof Option>;
export type ContentBlock = z.infer<typeof ContentBlock>;
export type Item = z.infer<typeof Item>;
export type QuestionGroup = z.infer<typeof QuestionGroup>;
export type Passage = z.infer<typeof Passage>;
export type Audio = z.infer<typeof Audio>;
export type WritingTask = z.infer<typeof WritingTask>;
export type SpeakingPart = z.infer<typeof SpeakingPart>;
export type SpeakingQuestion = z.infer<typeof SpeakingQuestion>;
export type Part = z.infer<typeof Part>;
export type Section = z.infer<typeof Section>;
export type Test = z.infer<typeof Test>;
export type TestSummary = z.infer<typeof TestSummary>;
export type AnswerValue = z.infer<typeof AnswerValue>;
export type Highlight = z.infer<typeof Highlight>;
export type Note = z.infer<typeof Note>;
export type SectionState = z.infer<typeof SectionState>;
export type SectionPatch = z.infer<typeof SectionPatch>;
export type Attempt = z.infer<typeof Attempt>;
export type CheckResult = z.infer<typeof CheckResult>;
export type Criterion = z.infer<typeof Criterion>;
export type Annotation = z.infer<typeof Annotation>;
export type WritingFeedback = z.infer<typeof WritingFeedback>;
export type SpeakingFeedback = z.infer<typeof SpeakingFeedback>;
export type CriterionMetric = z.infer<typeof CriterionMetric>;
export type ItemResult = z.infer<typeof ItemResult>;
export type SkillScore = z.infer<typeof SkillScore>;
export type TypeStat = z.infer<typeof TypeStat>;
export type Result = z.infer<typeof Result>;
export type ResultSummary = z.infer<typeof ResultSummary>;
export type Strength = z.infer<typeof Strength>;
export type Dashboard = z.infer<typeof Dashboard>;
export type Progress = z.infer<typeof Progress>;
export type PracticeCatalog = z.infer<typeof PracticeCatalog>;
export type VocabCard = z.infer<typeof VocabCard>;
export type VocabSummary = z.infer<typeof VocabSummary>;
export type Coach = z.infer<typeof Coach>;
export type Slot = z.infer<typeof Slot>;
export type CoachReview = z.infer<typeof CoachReview>;
export type CoachState = z.infer<typeof CoachState>;
export type Notification = z.infer<typeof Notification>;

/** Every schema, for the JSON Schema export. */
export const allSchemas = {
  Profile,
  Test,
  TestSummary,
  Attempt,
  SectionPatch,
  CheckResult,
  Result,
  ResultSummary,
  WritingFeedback,
  SpeakingFeedback,
  Dashboard,
  Progress,
  PracticeCatalog,
  VocabCard,
  VocabSummary,
  CoachState,
  CoachReview,
  Notification,
};
