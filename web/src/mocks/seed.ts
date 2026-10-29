import type {
  AnswerValue,
  Attempt,
  Item,
  Profile,
  QuestionGroup,
  QuestionType,
  Result,
  Slot,
  Test,
  VocabCard,
} from "@/api/schemas";
import { overallBand, writingBand } from "@/lib/bands";
import { getPrefs } from "@/lib/prefs";
import { createAttempt } from "./attempts";
import type { DB } from "./db";
import { DB_VERSION } from "./db";
import { coachReviewsSeed, notificationsSeed } from "./fixtures/coach";
import {
  speakingFeedback,
  speakingFeedbackOlder,
  writingFeedbackTask1,
  writingFeedbackTask2,
  writingFeedbackTask2Older,
} from "./fixtures/feedback";
import { vocabSeed } from "./fixtures/vocab";
import { buildResult, markItem } from "./scoring";
import { FULL_TEST, getTest } from "./tests";

/*
 * Demo data: a learner four mocks in, so every screen has something real to show.
 * Answers are generated against the actual test so review pages are consistent.
 * Dates are relative to today so the demo never looks stale.
 */

const DAY = 86_400_000;

function daysFromNow(n: number, hour = 10): string {
  const d = new Date(Date.now() + n * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoDate(n: number): string {
  return daysFromNow(n).slice(0, 10);
}

/** Small deterministic hash so the demo is the same on every machine. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

/** How hard each type is for this learner: matching headings is their weak spot. */
const DIFFICULTY: Partial<Record<QuestionType, number>> = {
  "matching-headings": 0.95,
  "matching-information": 0.8,
  tfng: 0.7,
  ynng: 0.72,
  "plan-map-diagram-labelling": 0.68,
  "multiple-choice": 0.62,
  matching: 0.6,
  "matching-features": 0.6,
  "matching-sentence-endings": 0.55,
  "diagram-label-completion": 0.5,
  "flow-chart-completion": 0.45,
  "table-completion": 0.4,
  "short-answer": 0.38,
  "note-completion": 0.35,
  "summary-completion": 0.3,
  "sentence-completion": 0.25,
  "form-completion": 0.2,
};

function wrongGap(answer: string): string {
  const m = answer.match(/\d+/);
  if (m) return answer.replace(m[0], String(Number(m[0]) + 1));
  return answer.endsWith("s") ? answer.slice(0, -1) : `${answer}s`;
}

function wrongKey(options: { key: string }[] | undefined, right: string[]): string {
  return options?.find((o) => !right.includes(o.key))?.key ?? "A";
}

function answerFor(group: QuestionGroup, item: Item, marks: number): AnswerValue | undefined {
  const opts = item.options ?? group.options;
  if (group.interaction === "multi") {
    if (marks === item.numbers.length) return item.answer.slice(0, item.numbers.length);
    const wrong = opts?.filter((o) => !item.answer.includes(o.key)).map((o) => o.key) ?? [];
    return marks === 0 ? wrong.slice(0, item.numbers.length) : [item.answer[0], wrong[0]];
  }
  if (marks > 0) return item.answer[0];
  if (group.interaction === "gap" || group.interaction === "diagram") return wrongGap(item.answer[0]);
  return wrongKey(opts, item.answer);
}

/** Answers for one skill that score exactly `target` marks, easiest items right first. */
function answersForTarget(test: Test, skill: "listening" | "reading", target: number, seed: string, blanks = 0) {
  const section = test.sections.find((s) => s.skill === skill)!;
  const entries = section.parts.flatMap((p) =>
    p.groups.flatMap((g) =>
      g.items.map((i) => ({ group: g, item: i, score: (DIFFICULTY[g.type] ?? 0.5) + hash(i.id + seed) * 0.35 })),
    ),
  );
  entries.sort((a, b) => a.score - b.score);
  const answers: Record<string, AnswerValue> = {};
  let left = target;
  entries.forEach((e, idx) => {
    const max = e.item.numbers.length;
    const marks = Math.min(max, Math.max(0, left));
    left -= marks;
    const isBlank = marks === 0 && idx >= entries.length - blanks;
    const value = isBlank ? undefined : answerFor(e.group, e.item, marks);
    if (value !== undefined) answers[e.item.id] = value;
    // Guard: the generated answer must score what we intended.
    if (value !== undefined && markItem(e.group, e.item, value) !== marks) answers[e.item.id] = answerFor(e.group, e.item, 0)!;
  });
  return { sectionId: section.id, answers };
}

type MockPlan = { daysAgo: number; listening: number; reading: number; blanks: number; writingIdx: number | null; speakingIdx: number | null };

/** Overall 5.5, 6.0, 6.0, 6.5: L 22/26/25/30, R 19/23/23/27, W 5.5/5.5/6.0/6.0, S 6.0/6.0/6.5/6.5 */
const MOCKS: MockPlan[] = [
  { daysAgo: 45, listening: 22, reading: 19, blanks: 4, writingIdx: 0, speakingIdx: 0 },
  { daysAgo: 31, listening: 26, reading: 23, blanks: 3, writingIdx: 1, speakingIdx: 1 },
  { daysAgo: 17, listening: 25, reading: 23, blanks: 2, writingIdx: 2, speakingIdx: 2 },
  { daysAgo: 4, listening: 30, reading: 27, blanks: 3, writingIdx: null, speakingIdx: null },
];

function seededMock(plan: MockPlan, index: number, profile: Profile): { attempt: Attempt; result: Result } {
  const started = daysFromNow(-plan.daysAgo, 9);
  const attempt = createAttempt(FULL_TEST, "exam", profile.accommodation, started);
  attempt.id = `att-demo-${index + 1}`;
  const l = answersForTarget(FULL_TEST, "listening", plan.listening, `m${index}`);
  const r = answersForTarget(FULL_TEST, "reading", plan.reading, `m${index}`, plan.blanks);
  const writingSection = FULL_TEST.sections.find((s) => s.skill === "writing")!;
  const t2 = plan.writingIdx === null ? writingFeedbackTask2 : writingFeedbackTask2Older[plan.writingIdx];
  const t1Band = plan.writingIdx === null ? writingFeedbackTask1.band : t2.band;

  attempt.sections = attempt.sections.map((s) => {
    const base = { ...s, status: "submitted" as const, startedAt: started, submittedAt: started, remainingSec: 0 };
    const sec = FULL_TEST.sections.find((x) => x.id === s.sectionId)!;
    const partTime: Record<string, number> = {};
    if (sec.skill === "reading") sec.parts.forEach((p, i) => (partTime[p.id] = [1140, 1260, 1200][i] ?? 1200));
    if (sec.skill === "writing") {
      partTime[sec.parts[0].id] = 19 * 60;
      partTime[sec.parts[1].id] = 41 * 60;
    }
    if (sec.skill === "listening") sec.parts.forEach((p) => (partTime[p.id] = Math.round(sec.durationSec / sec.parts.length)));
    if (s.sectionId === l.sectionId) return { ...base, answers: l.answers, partTime };
    if (s.sectionId === r.sectionId) return { ...base, answers: r.answers, partTime };
    if (s.sectionId === writingSection.id)
      return {
        ...base,
        partTime,
        essays: { [writingSection.parts[0].id]: writingFeedbackTask1.essay, [writingSection.parts[1].id]: t2.essay },
      };
    return { ...base, partTime };
  });
  attempt.status = "submitted";
  attempt.sectionIndex = FULL_TEST.sections.length;
  attempt.submittedAt = started;

  const result = buildResult(FULL_TEST, attempt, daysFromNow(-plan.daysAgo, 12));
  // Older mocks show the learner's older essays and speaking with their own bands.
  result.writing = result.writing.map((w) =>
    w.task === 2
      ? { ...t2, partId: w.partId, dummy: true }
      : { ...writingFeedbackTask1, partId: w.partId, band: t1Band, dummy: true },
  );
  const speak = plan.speakingIdx === null ? speakingFeedback : speakingFeedbackOlder[plan.speakingIdx];
  if (result.speaking) result.speaking = { ...speak, parts: result.speaking.parts.map((p) => ({ ...p, durationSec: speak.parts.find((x) => x.part === p.part)?.durationSec ?? 0 })), dummy: true };
  result.skills = result.skills.map((s) =>
    s.skill === "writing" ? { ...s, band: writingBand(t1Band, t2.band) } : s.skill === "speaking" ? { ...s, band: speak.band } : s,
  );
  result.overall = overallBand(result.skills.map((s) => s.band));
  return { attempt, result };
}

function seededVocab(): VocabCard[] {
  return vocabSeed.map((v, i) => {
    if (i < 22) {
      const interval = 6 + (i % 5) * 6;
      return { ...v, intervalDays: interval, reps: 4 + (i % 3), due: daysFromNow(1 + (i % 9)), custom: false };
    }
    if (i < 38) {
      const interval = 1 + (i % 3);
      return { ...v, intervalDays: interval, reps: 1 + (i % 2), due: daysFromNow(i % 2 === 0 ? -1 : 1 + (i % 3)), custom: false };
    }
    // New cards arrive five a day.
    return { ...v, intervalDays: 0, reps: 0, due: daysFromNow(Math.floor((i - 38) / 5), 0), custom: false };
  });
}

function seededSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let d = 1; d <= 10; d++) {
    for (const hour of [10, 17]) {
      slots.push({ id: `slot-${d}-${hour}`, start: daysFromNow(d, hour), minutes: 30, booked: false });
    }
  }
  return slots;
}

function seededReviewLog(): Record<string, number> {
  const log: Record<string, number> = {};
  for (let d = 1; d <= 42; d++) {
    if (hash(`day${d}`) < 0.62) log[isoDate(-d)] = 5 + Math.round(hash(`n${d}`) * 20);
  }
  return log;
}

function nextSaturday(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function seedProfile(): Profile {
  return {
    id: "user-demo",
    name: "Sara Rahimi",
    email: "sara@example.com",
    locale: getPrefs().locale,
    theme: getPrefs().theme,
    targets: { overall: 7, listening: 7, reading: 7, writing: 7, speaking: 7 },
    testDate: isoDate(34),
    currentLevel: 6,
    weeklyHours: 8,
    accommodation: 1,
    showFlag: true,
    onboarded: true,
    scheduledMock: nextSaturday(9),
    plan: "standard",
    notifications: { email: true, reminders: true },
  };
}

export function buildSeed(mode: "demo" | "empty"): DB {
  const profile = seedProfile();
  const db: DB = {
    version: DB_VERSION,
    signedIn: false,
    profile,
    attempts: {},
    results: {},
    vocab: seededVocab(),
    reviewLog: mode === "demo" ? seededReviewLog() : {},
    slots: seededSlots(),
    reviews: mode === "demo" ? coachReviewsSeed : [],
    notifications: mode === "demo" ? notificationsSeed : [],
    accounts: [{ email: profile.email, phone: "09121234567", name: profile.name }],
  };
  if (mode === "empty") {
    db.vocab = db.vocab.map((c) => ({ ...c, intervalDays: 0, reps: 0, due: daysFromNow(0, 0) }));
    return db;
  }
  MOCKS.forEach((plan, i) => {
    const { attempt, result } = seededMock(plan, i, profile);
    db.attempts[attempt.id] = attempt;
    db.results[attempt.id] = result;
  });
  // One unfinished Reading section to show "Resume".
  const readingTest = getTest("academic-1-reading");
  if (readingTest) {
    const open = createAttempt(readingTest, "exam", profile.accommodation, daysFromNow(-1, 20));
    open.id = "att-demo-open";
    open.sections[0] = { ...open.sections[0], status: "in-progress", startedAt: open.startedAt, remainingSec: 2460, currentNumber: 8 };
    db.attempts[open.id] = open;
  }
  return db;
}
