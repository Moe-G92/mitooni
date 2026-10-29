import type { AnswerValue, Attempt, QuestionGroup, Section } from "@/api/schemas";

/** One navigator button: a single question, or a grouped "Choose TWO" item like 18–19. */
export type NavEntry = {
  itemId: string;
  numbers: number[];
  partIndex: number;
  group: QuestionGroup;
};

export function buildIndex(section: Section): NavEntry[] {
  const out: NavEntry[] = [];
  section.parts.forEach((p, partIndex) =>
    p.groups.forEach((g) => g.items.forEach((i) => out.push({ itemId: i.id, numbers: i.numbers, partIndex, group: g }))),
  );
  return out.sort((a, b) => a.numbers[0] - b.numbers[0]);
}

export function isAnswered(v: AnswerValue | undefined): boolean {
  if (v === undefined) return false;
  if (Array.isArray(v)) return v.some((x) => x.trim() !== "");
  return v.trim() !== "";
}

export function entryForNumber(index: NavEntry[], n: number): NavEntry | undefined {
  return index.find((e) => e.numbers.includes(n));
}

/** Questions in a part, counted by question number (a Choose TWO item counts as two). */
export function partProgress(index: NavEntry[], partIndex: number, answers: Record<string, AnswerValue>) {
  const entries = index.filter((e) => e.partIndex === partIndex);
  const total = entries.reduce((n, e) => n + e.numbers.length, 0);
  const done = entries.reduce((n, e) => {
    const v = answers[e.itemId];
    if (!isAnswered(v)) return n;
    return n + (Array.isArray(v) ? Math.min(e.numbers.length, v.filter(Boolean).length) : e.numbers.length);
  }, 0);
  return { total, done };
}

/** DOM id of a question's first input, so the navigator can focus it. */
export const questionDomId = (n: number) => `q-${n}`;

/** Split "text with **bold** and {{12}} gaps" into tokens for rendering. */
export type RichToken = { kind: "text"; text: string; bold: boolean } | { kind: "gap"; n: number };

export function tokenize(text: string): RichToken[] {
  const out: RichToken[] = [];
  const re = /\*\*(.+?)\*\*|\{\{(\d+)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index), bold: false });
    if (m[1] !== undefined) out.push({ kind: "text", text: m[1], bold: true });
    else out.push({ kind: "gap", n: Number(m[2]) });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last), bold: false });
  return out;
}

/** Stable six-digit candidate number derived from the attempt id. */
export function candidateNumber(attempt: Attempt): string {
  let h = 0;
  for (const ch of attempt.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return String(100000 + (h % 900000));
}
