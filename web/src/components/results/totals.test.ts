import { describe, expect, it } from "vitest";
import { buildSeed } from "@/mocks/seed";
import { FULL_TEST } from "@/mocks/tests";
import { assignEvidence, numberStatuses, partStats, splitByEvidence, typeRows } from "./review-data";

/* The result page's numbers must add up: parts, passages and question types all sum to the section score. */

const result = buildSeed("demo").results["att-demo-4"];
const section = (skill: "listening" | "reading") => FULL_TEST.sections.find((s) => s.skill === skill)!;
const items = (skill: "listening" | "reading") => result.items.filter((i) => i.skill === skill);

describe("seeded 28 October mock", () => {
  it("scores Listening 30/40 and Reading 27/40", () => {
    expect(result.skills.find((s) => s.skill === "listening")).toMatchObject({
      raw: 30,
      total: 40,
    });
    expect(result.skills.find((s) => s.skill === "reading")).toMatchObject({
      raw: 27,
      total: 40,
    });
  });

  it("Listening parts sum to 30 out of 40", () => {
    const parts = partStats(section("listening"), items("listening"));
    expect(parts.map((p) => [p.correct, p.total])).toEqual([
      [10, 10],
      [2, 10],
      [8, 10],
      [10, 10],
    ]);
    expect(parts.reduce((n, p) => n + p.correct, 0)).toBe(30);
  });

  it("Reading passages sum to 27 out of 40", () => {
    const parts = partStats(section("reading"), items("reading"));
    expect(parts.reduce((n, p) => n + p.correct, 0)).toBe(27);
    expect(parts.reduce((n, p) => n + p.total, 0)).toBe(40);
    expect(parts.map((p) => [p.first, p.last])).toEqual([
      [1, 13],
      [14, 26],
      [27, 40],
    ]);
  });

  for (const [skill, raw] of [
    ["listening", 30],
    ["reading", 27],
  ] as const) {
    it(`${skill} question-type rows cover exactly 40 questions and sum to ${raw}`, () => {
      const rows = typeRows(result, skill);
      expect(rows.reduce((n, r) => n + r.total, 0)).toBe(40);
      expect(rows.reduce((n, r) => n + r.correct, 0)).toBe(raw);
      expect(new Set(rows.map((r) => r.type)).size).toBe(rows.length);
    });

    it(`${skill} jump strip has 1 to 40 with ${raw} right`, () => {
      const st = numberStatuses(items(skill));
      expect(st.map((s) => s.n)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
      expect(st.filter((s) => s.right).length).toBe(raw);
    });

    it(`${skill} highlights every answer exactly once`, () => {
      for (const p of section(skill).parts) {
        const texts = p.passage ? p.passage.paragraphs.map((x) => x.text) : p.audio!.transcript.map((l) => l.text);
        const own = partStats(section(skill), items(skill)).find((s) => s.part.id === p.id)!.items;
        const assigned = assignEvidence(texts, own);
        const marked = texts.flatMap((t, i) => splitByEvidence(t, assigned[i]).flatMap((s) => s.mark?.items ?? []));
        expect(marked.map((i) => i.itemId).sort()).toEqual(own.map((i) => i.itemId).sort());
      }
    });
  }
});

describe("splitByEvidence", () => {
  it("merges overlapping evidence and keeps the text intact", () => {
    const a = {
      itemId: "a",
      numbers: [1],
      marks: 1,
      maxMarks: 1,
      evidence: "brown fox",
    };
    const b = {
      itemId: "b",
      numbers: [2],
      marks: 0,
      maxMarks: 1,
      evidence: "fox jumps",
    };
    const spans = splitByEvidence("The quick brown fox jumps over", [a, b] as never);
    expect(spans.map((s) => s.text).join("")).toBe("The quick brown fox jumps over");
    const marks = spans.filter((s) => s.mark);
    expect(marks).toHaveLength(1);
    expect(marks[0]).toMatchObject({
      text: "brown fox jumps",
      mark: { right: false },
    });
  });
});
