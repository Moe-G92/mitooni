import type { Attempt, Profile, Progress, QuestionType, Result, ResultSummary, Skill, TestSummary } from "@/api/schemas";
import { practiceHref } from "@/lib/links";
import { addDays, sameDay, toDay } from "./dates";

/*
 * The coach's study plan, built on the client from data the app already has:
 * the latest full mock (bands, writing and speaking criteria, writing notes),
 * the question types that lose the most marks (progress), the targets and
 * test date (profile) and the words due today (vocabulary summary).
 * Nothing here is stored: the plan is recomputed whenever the data changes.
 */

export const PLAN_SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

export type ItemKind = Skill | "vocab" | "mock" | "test";

export type PlanItem = {
  kind: ItemKind;
  /** i18n key under coach.plan.items and its values. */
  key: string;
  vars?: Record<string, string | number>;
  minutes: number | null;
  href: string;
};

/** A test the learner started and has not finished, shown on the day it was started. */
export type StartedItem = {
  kind: Skill | "mock";
  /** i18n key under coach.plan.items. */
  key: "startedSkill" | "startedMock";
  minutesLeft: number;
  minutes: number | null;
  href: string;
};

export type PlanDay = { date: Date; items: PlanItem[]; started: StartedItem[]; past: boolean; today: boolean; tomorrow: boolean };

export type Basis = {
  skill: Skill;
  band: number | null;
  target: number;
  gap: number;
  biggest: boolean;
  /** Translated label of the focus: a question type or a criterion. */
  focus: { type?: QuestionType; criterion?: string } | null;
};

export type ReviewStop = {
  offset: number;
  date: Date;
  items: { kind: ItemKind; key: string; vars?: Record<string, string | number> }[];
};

export function latestFull(results: ResultSummary[]): ResultSummary | null {
  return [...results].filter((r) => r.overall !== null).sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0] ?? null;
}

/** Weakest question types for a skill, lowest accuracy first. */
function weakest(progress: Progress | undefined, skill: Skill): QuestionType[] {
  return (progress?.types ?? [])
    .filter((x) => x.skill === skill)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .map((x) => x.type);
}

function lowestCriterion(criteria: { key: string; band: number }[] | undefined): string | undefined {
  if (!criteria?.length) return undefined;
  return [...criteria].sort((a, b) => a.band - b.band)[0].key;
}

export function buildBasis(summary: ResultSummary, result: Result | undefined, progress: Progress | undefined, me: Profile): Basis[] {
  const task2 = result?.writing.find((w) => w.task === 2) ?? result?.writing[0];
  const rows = PLAN_SKILLS.map((skill) => {
    const band = summary.skills.find((s) => s.skill === skill)?.band ?? null;
    const target = me.targets[skill];
    let focus: Basis["focus"] = null;
    if (skill === "listening" || skill === "reading") {
      const type = weakest(progress, skill)[0];
      focus = type ? { type } : null;
    } else {
      const crit = lowestCriterion(skill === "writing" ? task2?.criteria : result?.speaking?.criteria);
      focus = crit ? { criterion: crit === "tr" && task2?.task === 1 ? "tr1" : crit } : null;
    }
    return { skill, band, target, gap: band === null ? 0 : target - band, biggest: false, focus };
  });
  const top = [...rows].filter((r) => r.gap > 0).sort((a, b) => b.gap - a.gap || (a.band ?? 9) - (b.band ?? 9))[0];
  if (top) top.biggest = true;
  return rows;
}

/** Saturday of the plan week (weeks run Saturday to Friday, as in Iran), so the week always holds today. */
export function planWeekStart(today: Date, offset = 0): Date {
  const saturday = addDays(today, -((today.getDay() + 1) % 7));
  return addDays(saturday, offset * 7);
}

/** Unfinished tests, as timetable entries keyed by the day they were started (YYYY-M-D). */
export function startedByDay(open: Attempt[], tests: TestSummary[]): Map<string, StartedItem[]> {
  const out = new Map<string, StartedItem[]>();
  for (const a of open) {
    const test = tests.find((x) => x.id === a.testId);
    const section = a.sections[a.sectionIndex];
    const full = a.kind === "full";
    const item: StartedItem = {
      kind: full ? "mock" : (test?.skills[0] ?? "reading"),
      key: full ? "startedMock" : "startedSkill",
      minutesLeft: Math.max(1, Math.ceil((section?.remainingSec ?? 0) / 60)),
      minutes: test?.minutes ?? null,
      href: `/exam/${a.id}`,
    };
    const k = dayKey(new Date(a.startedAt));
    out.set(k, [...(out.get(k) ?? []), item]);
  }
  return out;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** The next full mock day (a Saturday) on or after today, if it comes before test day. */
export function nextMockDay(today: Date, testDate: Date | null): Date | null {
  const d = addDays(today, (6 - today.getDay() + 7) % 7);
  return testDate && d.getTime() >= testDate.getTime() ? null : d;
}

export function buildWeek({
  start,
  today,
  testDate,
  basis,
  progress,
  result,
  due,
  started,
}: {
  start: Date;
  today: Date;
  testDate: Date | null;
  basis: Basis[];
  progress: Progress | undefined;
  result: Result | undefined;
  due: number;
  started?: Map<string, StartedItem[]>;
}): PlanDay[] {
  const biggest = basis.find((b) => b.biggest)?.skill ?? "writing";
  const listening = weakest(progress, "listening");
  const reading = weakest(progress, "reading");
  const writingFocus = basis.find((b) => b.skill === "writing")?.focus?.criterion ?? "gra";
  const task2 = result?.writing.find((w) => w.task === 2) ?? result?.writing[0];
  const writingHref = result && task2 ? `/app/results/${result.attemptId}/writing/${task2.partId}` : "/app/practice";
  const drill = (skill: "listening" | "reading", i: number): PlanItem => {
    const list = skill === "listening" ? listening : reading;
    const type = list[i] ?? list[0];
    return type
      ? { kind: skill, key: "drill", vars: { type }, minutes: 20, href: practiceHref(type) }
      : { kind: skill, key: "practiceSet", minutes: 20, href: "/app/practice" };
  };
  const mainFor = (skill: Skill, writingMain: PlanItem): PlanItem =>
    skill === "writing" ? writingMain : skill === "speaking" ? { kind: "speaking", key: "cueCards", minutes: 25, href: "/app/practice" } : drill(skill, 0);
  let vocabFirst = true;
  const vocab = (d: Date): PlanItem => {
    const upcoming = d.getTime() >= today.getTime();
    const first = upcoming && vocabFirst && due > 0;
    if (first) vocabFirst = false;
    return first
      ? { kind: "vocab", key: "vocabDue", vars: { n: due }, minutes: 10, href: "/app/vocabulary/review" }
      : { kind: "vocab", key: "vocab", minutes: 10, href: "/app/vocabulary/review" };
  };

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    let items: PlanItem[];
    if (testDate && sameDay(date, testDate)) items = [{ kind: "test", key: "testDay", minutes: null, href: "/app/settings" }];
    else if (testDate && date.getTime() > testDate.getTime()) items = [];
    else {
      const writingMain: PlanItem = { kind: "writing", key: "writingFocus", vars: { criterion: writingFocus }, minutes: 40, href: writingHref };
      // Saturday is mock day, Sunday a light day after it, then the week's main work.
      const days: PlanItem[][] = [
        [{ kind: "mock", key: "fullMock", minutes: 165, href: "/app/mocks" }],
        [vocab(date)],
        [mainFor(biggest, writingMain), vocab(date)],
        [drill("reading", 0), drill("listening", 0)],
        [{ kind: "speaking", key: "cueCards", minutes: 25, href: "/app/practice" }, vocab(date)],
        [{ kind: "writing", key: "task1", minutes: 30, href: "/app/practice" }, drill("reading", 1)],
        [drill("listening", 1), vocab(date)],
      ];
      items = days[i];
    }
    const past = date.getTime() < today.getTime() && !sameDay(date, today);
    const begun = started?.get(dayKey(date)) ?? [];
    // A past day that went on an unfinished test shows that test instead of the plan.
    if (past && begun.length) items = [];
    return { date, items, started: begun, past, today: sameDay(date, today), tomorrow: sameDay(date, addDays(today, 1)) };
  });
}

/** Average study minutes on a normal day of the week (mock and test days left out), to the nearest 5. */
export function dailyMinutes(week: PlanDay[]): number | null {
  const days = week.filter((d) => d.items.length && d.items.every((x) => x.kind !== "mock" && x.kind !== "test"));
  if (!days.length) return null;
  const total = days.reduce((s, d) => s + d.items.reduce((m, x) => m + (x.minutes ?? 0), 0), 0);
  return Math.round(total / days.length / 5) * 5;
}

/** Spaced review stops: today, then 1, 3, 7 and 14 days later, up to test day. */
export function buildReviews({
  today,
  testDate,
  result,
  progress,
  due,
  mockDate,
}: {
  today: Date;
  testDate: Date | null;
  result: Result | undefined;
  progress: Progress | undefined;
  due: number;
  mockDate: string;
}): ReviewStop[] {
  const task2 = result?.writing.find((w) => w.task === 2) ?? result?.writing[0];
  const grammar = (task2?.annotations ?? []).map((a, i) => ({ a, n: i + 1 })).filter((x) => x.a.kind === "grammar").map((x) => x.n);
  const firstNotes = grammar.slice(0, 3);
  const laterNotes = grammar.slice(3, 6);
  const reading = weakest(progress, "reading")[0];
  const listening = weakest(progress, "listening")[0];
  const speakingCrit = lowestCriterion(result?.speaking?.criteria) ?? "fc";
  const stops: ReviewStop[] = [
    {
      offset: 0,
      date: today,
      items: [
        ...(due > 0 ? [{ kind: "vocab" as const, key: "wordsDue", vars: { n: due } }] : []),
        ...(firstNotes.length ? [{ kind: "writing" as const, key: "grammarFirst", vars: { notes: firstNotes.join(",") } }] : []),
      ],
    },
    { offset: 1, date: addDays(today, 1), items: reading ? [{ kind: "reading", key: "typeWrong", vars: { type: reading, date: mockDate } }] : [] },
    {
      offset: 3,
      date: addDays(today, 3),
      items: [
        ...(laterNotes.length ? [{ kind: "writing" as const, key: "grammarSecond", vars: { notes: laterNotes.join(",") } }] : []),
        { kind: "vocab" as const, key: "wordsSecond" },
      ],
    },
    {
      offset: 7,
      date: addDays(today, 7),
      items: [
        ...(listening ? [{ kind: "listening" as const, key: "typeAnswers", vars: { type: listening, date: mockDate } }] : []),
        { kind: "speaking" as const, key: "speakingNotes", vars: { criterion: speakingCrit } },
      ],
    },
    {
      offset: 14,
      date: addDays(today, 14),
      items: [
        { kind: "writing", key: "allGrammar" },
        { kind: "vocab", key: "wordsHard" },
      ],
    },
  ];
  return stops.filter((s) => s.items.length && (!testDate || s.date.getTime() <= testDate.getTime()));
}

export { toDay };
