import type { ItemResult, Part, Result, Section, Skill, TypeStat } from "@/api/schemas";

/*
 * Pure helpers for the result page. They join a stored Result (marks, answers,
 * evidence) with the test content the exam client already loads (transcripts,
 * passages, question groups), so every number on the page comes from the same
 * marked items and adds up.
 */

export const isRight = (i: ItemResult) => i.marks === i.maxMarks;

export function strengthOf(acc: number) {
  return acc < 0.55 ? "weakness" : acc < 0.78 ? "fair" : "strength";
}

/** One row per question type for one skill, weakest first. */
export function typeRows(result: Result, skill: Skill): TypeStat[] {
  return result.byType.filter((x) => x.skill === skill && x.total > 0).sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total);
}

export type NumberStatus = { n: number; right: boolean; item: ItemResult };

/**
 * Status for each question number. A "Choose TWO" item covers two numbers and
 * earns one mark per correct letter, so its first `marks` numbers count as right.
 */
export function numberStatuses(items: ItemResult[]): NumberStatus[] {
  const out: NumberStatus[] = [];
  for (const item of items) {
    const nums = [...item.numbers].sort((a, b) => a - b);
    const perNumber = item.maxMarks === nums.length;
    nums.forEach((n, idx) =>
      out.push({
        n,
        right: perNumber ? idx < item.marks : isRight(item),
        item,
      }),
    );
  }
  return out.sort((a, b) => a.n - b.n);
}

export type PartStat = {
  part: Part;
  items: ItemResult[];
  first: number;
  last: number;
  correct: number;
  total: number;
};

/** Marks per part (Listening part or Reading passage), from the items whose ids live in that part. */
export function partStats(section: Section, items: ItemResult[]): PartStat[] {
  const byId = new Map(items.map((i) => [i.itemId, i]));
  return section.parts.map((part) => {
    const own = part.groups.flatMap((g) => g.items.map((i) => byId.get(i.id))).filter((i): i is ItemResult => !!i);
    const nums = own.flatMap((i) => i.numbers);
    return {
      part,
      items: own,
      first: nums.length ? Math.min(...nums) : 0,
      last: nums.length ? Math.max(...nums) : 0,
      correct: own.reduce((n, i) => n + i.marks, 0),
      total: own.reduce((n, i) => n + i.maxMarks, 0),
    };
  });
}

export type Span = {
  text: string;
  mark?: { items: ItemResult[]; right: boolean };
};

/**
 * Splits text around the evidence quoted by each item. Overlapping evidence
 * merges into one highlight carrying every question badge; the highlight is
 * green only when all of those questions were answered correctly.
 */
export function splitByEvidence(text: string, items: ItemResult[]): Span[] {
  const hits = items
    .map((item) => ({
      item,
      start: item.evidence ? text.indexOf(item.evidence) : -1,
    }))
    .filter((h) => h.start >= 0)
    .map((h) => ({ ...h, end: h.start + h.item.evidence!.length }))
    .sort((a, b) => a.start - b.start || a.item.numbers[0] - b.item.numbers[0]);
  const merged: { start: number; end: number; items: ItemResult[] }[] = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (last && h.start < last.end) {
      last.end = Math.max(last.end, h.end);
      last.items.push(h.item);
    } else merged.push({ start: h.start, end: h.end, items: [h.item] });
  }
  const spans: Span[] = [];
  let at = 0;
  for (const m of merged) {
    if (m.start > at) spans.push({ text: text.slice(at, m.start) });
    spans.push({
      text: text.slice(m.start, m.end),
      mark: { items: m.items, right: m.items.every(isRight) },
    });
    at = m.end;
  }
  if (at < text.length) spans.push({ text: text.slice(at) });
  return spans;
}

/**
 * Gives each item to the first block of text (transcript line or paragraph)
 * that quotes its evidence, so an answer is highlighted once.
 */
export function assignEvidence(texts: string[], items: ItemResult[]): ItemResult[][] {
  const out: ItemResult[][] = texts.map(() => []);
  for (const item of items) {
    if (!item.evidence) continue;
    const idx = texts.findIndex((t) => t.includes(item.evidence!));
    if (idx >= 0) out[idx].push(item);
  }
  return out;
}

/**
 * A short title for a Listening part from the narrator's opening line,
 * e.g. "Part 1. You will hear a woman phoning a ceramics studio..." gives
 * "A woman phoning a ceramics studio...". No full stop: it is a title.
 */
export function listeningPartTitle(part: Part): string | null {
  const first = part.audio?.transcript.find((l) => l.speaker.toLowerCase() === "narrator")?.text;
  const m = first?.match(/You will hear (.+?)\./);
  if (!m) return null;
  const s = m[1].trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
