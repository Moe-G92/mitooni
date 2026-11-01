import type {
  Dashboard,
  PracticeCatalog,
  Progress,
  QuestionType,
  Result,
  ResultSummary,
  Skill,
  Strength,
  VocabSummary,
} from "@/api/schemas";
import { daysUntil, formatNumber } from "@/lib/format";
import { toHalfBand } from "@/lib/bands";
import type { DB } from "./db";
import { ALL_TESTS, FULL_TEST, summarise, typeLabel, TYPE_LABELS_FA } from "./tests";
import { writingFeedbackTask2 } from "./fixtures/feedback";

/*
 * Everything the dashboard, progress and practice pages show is computed
 * from stored results, so taking a new mock really moves the numbers.
 */

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

export function strengthOf(accuracy: number): Strength {
  if (accuracy < 0.55) return "weakness";
  if (accuracy < 0.78) return "fair";
  return "strength";
}

function byDate(results: Result[]) {
  return [...results].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function fullMocks(db: DB) {
  return byDate(Object.values(db.results).filter((r) => r.kind === "full" && r.overall !== null));
}

function typeTotals(results: Result[]) {
  // One row per skill and type: Listening and Reading share some type names.
  const map = new Map<string, { type: QuestionType; skill: Skill; correct: number; total: number }>();
  for (const r of results)
    for (const s of r.byType) {
      const key = `${s.skill}:${s.type}`;
      const t = map.get(key) ?? { type: s.type, skill: s.skill, correct: 0, total: 0 };
      t.correct += s.correct;
      t.total += s.total;
      map.set(key, t);
    }
  return [...map.values()];
}

export function summary(r: Result): ResultSummary {
  return {
    attemptId: r.attemptId,
    testTitle: r.testTitle,
    kind: r.kind,
    mode: r.mode,
    completedAt: r.completedAt,
    overall: r.overall,
    skills: r.skills,
  };
}

/** Find the practice set that drills a question type, for "Focus here" and "Do this next". */
export function practiceSetFor(type: QuestionType): string | null {
  return ALL_TESTS.find((t) => t.kind === "practice" && t.questionType === type)?.id ?? null;
}

export function buildDashboard(db: DB): Dashboard {
  const results = byDate(Object.values(db.results));
  const mocks = fullMocks(db);
  const latest = mocks[mocks.length - 1];
  const p = db.profile;

  const skills = SKILLS.map((skill) => {
    const last = [...results].reverse().find((r) => r.skills.some((s) => s.skill === skill));
    return { skill, band: last?.skills.find((s) => s.skill === skill)?.band ?? null, target: p.targets[skill] };
  });

  const reading = typeTotals(results).filter((t) => t.skill === "reading" && t.total > 0);
  const sortedTypes = reading
    .map((t) => ({ type: t.type, accuracy: t.correct / t.total, strength: strengthOf(t.correct / t.total) }))
    .sort((a, b) => a.accuracy - b.accuracy);
  // Show where marks are lost and where they are safe: the three weakest and the two strongest.
  const readingTypes = sortedTypes.length > 5 ? [...sortedTypes.slice(0, 3), ...sortedTypes.slice(-2)] : sortedTypes;

  const weakest = sortedTypes[0];
  const perTest = weakest
    ? (FULL_TEST.sections
        .find((s) => s.skill === "reading")
        ?.parts.flatMap((pt) => pt.groups)
        .filter((g) => g.type === weakest.type)
        .reduce((n, g) => n + g.items.reduce((m, i) => m + i.numbers.length, 0), 0) ?? 0)
    : 0;

  const answered = results.reduce((n, r) => n + r.items.length, 0);

  const focusSet = weakest ? practiceSetFor(weakest.type) : null;
  const next: Dashboard["next"] =
    weakest && focusSet
      ? {
          title: { en: `${typeLabel(weakest.type)} drill`, fa: `تمرین ${TYPE_LABELS_FA[weakest.type]}` },
          detail: { en: `About 10 minutes, questions from one passage`, fa: `حدود ۱۰ دقیقه، سؤال‌های یک متن` },
          href: `/exam/new/${focusSet}?mode=practice`,
        }
      : {
          title: { en: "Take your first full mock", fa: "اولین آزمون کامل را بدهید" },
          detail: { en: "2 hours 45 minutes, all four skills", fa: "۲ ساعت و ۴۵ دقیقه، هر چهار مهارت" },
          href: "/app/mocks",
        };

  // Pacing from the latest full mock.
  const pacing: Dashboard["pacing"] = [];
  let pacingNote = { en: "Take a full mock to see how you use your time.", fa: "یک آزمون کامل بدهید تا ببینید زمان را چطور مصرف می‌کنید." };
  if (latest) {
    const attempt = db.attempts[latest.attemptId];
    const lSkill = latest.skills.find((s) => s.skill === "listening");
    const rItems = latest.items.filter((i) => i.skill === "reading");
    const rAnswered = rItems.filter((i) => i.given.length > 0).length;
    const rScore = latest.skills.find((s) => s.skill === "reading");
    const perQ = rScore && rAnswered ? rScore.usedSec / rAnswered : 0;
    const overBy = Math.round(perQ - 90);
    const wSection = FULL_TEST.sections.find((s) => s.skill === "writing")!;
    const wState = attempt?.sections.find((s) => s.sectionId === wSection.id);
    const w1 = Math.round((wState?.partTime[wSection.parts[0].id] ?? 0) / 60);
    const w2 = Math.round((wState?.partTime[wSection.parts[1].id] ?? 0) / 60);
    const lItems = latest.items.filter((i) => i.skill === "listening");
    const lAnswered = lItems.filter((i) => i.given.length > 0).length;
    pacing.push(
      {
        key: "listening",
        ratio: lSkill ? 0.6 : 0,
        label: lAnswered === lItems.length ? { en: "on pace", fa: "به‌موقع" } : { en: `${lItems.length - lAnswered} blank`, fa: `${formatNumber(lItems.length - lAnswered, "fa")} خالی` },
        over: lAnswered < lItems.length,
      },
      {
        key: "reading",
        ratio: Math.min(1, perQ / 90),
        label: overBy > 0 ? { en: `+${overBy} s`, fa: `${formatNumber(overBy, "fa")} ثانیه بیشتر` } : { en: "on pace", fa: "به‌موقع" },
        over: overBy > 0,
      },
      { key: "writing1", ratio: Math.min(1, w1 / 20), label: { en: `${w1} min`, fa: `${formatNumber(w1, "fa")} دقیقه` }, over: w1 > 20 },
      { key: "writing2", ratio: Math.min(1, w2 / 40), label: { en: `${w2} min`, fa: `${formatNumber(w2, "fa")} دقیقه` }, over: w2 > 40 },
    );
    const parts: string[] = [];
    const partsFa: string[] = [];
    if (overBy > 0) {
      parts.push(`Reading runs ${overBy} seconds over per question, which is about ${Math.round((overBy * 40) / 60)} minutes across a paper.`);
      partsFa.push(`در ریدینگ برای هر سؤال ${formatNumber(overBy, "fa")} ثانیه بیشتر از زمان پیشنهادی صرف می‌کنید؛ یعنی در کل آزمون حدود ${formatNumber(Math.round((overBy * 40) / 60), "fa")} دقیقه.`);
    }
    if (w2 > 40) {
      parts.push(`Task 2 ran ${w2 - 40} minutes over.`);
      partsFa.push(`تسک ۲، ${formatNumber(w2 - 40, "fa")} دقیقه بیشتر از زمان پیشنهادی طول کشید.`);
    }
    pacingNote = parts.length
      ? { en: parts.join(" "), fa: partsFa.join(" ") }
      : { en: "You are inside the time budget in every section.", fa: "در همهٔ بخش‌ها در زمان پیشنهادی کار را تمام کرده‌اید." };
  }

  const lastWriting = [...results].reverse().find((r) => r.writing.some((w) => w.task === 2));
  const t2 = lastWriting?.writing.find((w) => w.task === 2);

  const center = latest?.overall ?? null;
  return {
    predicted:
      center !== null
        ? { low: toHalfBand(Math.max(0, center - 0.5)), high: toHalfBand(Math.min(9, center + 0.5)), mocks: mocks.length, questions: answered }
        : null,
    skills,
    readingTypes,
    focus: weakest ? { type: weakest.type, marksLost: Math.round((1 - weakest.accuracy) * perTest) } : null,
    trend: mocks.map((r) => ({ date: r.completedAt, band: r.overall!, attemptId: r.attemptId })),
    next,
    nextMock: p.scheduledMock,
    pacing,
    pacingNote,
    writing:
      t2 && lastWriting
        ? { attemptId: lastWriting.attemptId, date: lastWriting.completedAt, criteria: t2.criteria, summary: t2.summary }
        : null,
    daysToTest: p.testDate ? daysUntil(p.testDate) : null,
  };
}

export function buildProgress(db: DB): Progress {
  const results = byDate(Object.values(db.results));
  const mocks = fullMocks(db);
  const studyDays = new Set<string>(Object.keys(db.reviewLog));
  results.forEach((r) => studyDays.add(r.completedAt.slice(0, 10)));
  return {
    trend: mocks.map((r) => ({ date: r.completedAt, band: r.overall!, attemptId: r.attemptId })),
    bySkill: SKILLS.map((skill) => ({
      skill,
      points: results
        .filter((r) => r.kind !== "practice")
        .flatMap((r) => r.skills.filter((s) => s.skill === skill).map((s) => ({ date: r.completedAt, band: s.band }))),
    })),
    types: typeTotals(results)
      .filter((t) => t.total > 0)
      .map((t) => ({ ...t, strength: strengthOf(t.correct / t.total) }))
      .sort((a, b) => a.correct / a.total - b.correct / b.total),
    history: [...results].reverse().map(summary),
    studyDays: [...studyDays].sort(),
  };
}

export function buildPractice(db: DB): PracticeCatalog {
  const totals = typeTotals(Object.values(db.results));
  const practice = ALL_TESTS.filter((t) => t.kind === "practice");
  return SKILLS.map((skill) => {
    const sets = practice.filter((t) => t.sections[0].skill === skill);
    const types = new Map<QuestionType | "task", typeof sets>();
    for (const s of sets) {
      const key = s.questionType ?? "task";
      types.set(key, [...(types.get(key) ?? []), s]);
    }
    return {
      skill,
      types: [...types.entries()].map(([type, list]) => {
        const qt = type === "task" ? null : type;
        const total = qt ? totals.find((t) => t.type === qt && t.skill === skill) : undefined;
        const attempts = Object.values(db.results).filter((r) => list.some((l) => l.id === r.testId)).length;
        return {
          type: qt,
          accuracy: total && total.total ? total.correct / total.total : null,
          attempts,
          sets: list.map(summarise),
        };
      }),
    };
  });
}

export function vocabSummary(db: DB): VocabSummary {
  const now = Date.now();
  const due = db.vocab.filter((c) => new Date(c.due).getTime() <= now).length;
  return {
    due,
    learning: db.vocab.filter((c) => c.reps > 0 && c.intervalDays < 7).length,
    known: db.vocab.filter((c) => c.intervalDays >= 7).length,
    total: db.vocab.length,
    reviewDays: Object.entries(db.reviewLog)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** Used by the dashboard writing tile when there is no history yet. */
export const sampleWriting = writingFeedbackTask2;
