import { describe, expect, it } from "vitest";
import { Section, Test } from "@/api/schemas";
import { ALL_TESTS, FULL_TEST, stripAnswers } from "./tests";
import { markItem } from "./scoring";
import { buildSeed } from "./seed";
import { buildDashboard } from "./derive";

/* Content and mock-backend integrity: these protect the handoff contract. */

describe("test content", () => {
  it("every test matches the API schema", () => {
    for (const t of ALL_TESTS) expect(() => Test.parse(t)).not.toThrow();
  });

  for (const skill of ["listening", "reading"] as const) {
    it(`${skill} has questions 1 to 40, each once`, () => {
      const section = FULL_TEST.sections.find((s) => s.skill === skill)!;
      Section.parse(section);
      const nums = section.parts.flatMap((p) => p.groups.flatMap((g) => g.items.flatMap((i) => i.numbers)));
      expect([...nums].sort((a, b) => a - b)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    });

    it(`${skill} gap tokens match items and evidence is quoted exactly`, () => {
      const section = FULL_TEST.sections.find((s) => s.skill === skill)!;
      for (const part of section.parts) {
        const source = part.passage
          ? part.passage.paragraphs.map((p) => p.text).join("\n")
          : (part.audio?.transcript.map((l) => l.text).join("\n") ?? "");
        for (const g of part.groups) {
          const text = JSON.stringify(g.content ?? []);
          for (const item of g.items) {
            if (g.interaction === "gap") expect(text).toContain(`{{${item.numbers[0]}}}`);
            if (item.evidence) expect(source).toContain(item.evidence);
          }
        }
      }
    });
  }

  it("covers all 14 Reading and 10 Listening question types", () => {
    const types = (skill: string) =>
      new Set(FULL_TEST.sections.find((s) => s.skill === skill)!.parts.flatMap((p) => p.groups.map((g) => g.type)));
    expect(types("reading").size).toBe(14);
    expect(types("listening").size).toBeGreaterThanOrEqual(10);
  });

  it("never sends answer keys to the exam client", () => {
    const stripped = JSON.stringify(stripAnswers(FULL_TEST));
    expect(stripped).not.toContain('"evidence"');
    expect(stripped).not.toMatch(/"answer":\["(?!hidden)/);
  });
});

describe("marking", () => {
  const reading = FULL_TEST.sections.find((s) => s.skill === "reading")!;
  const groups = reading.parts.flatMap((p) => p.groups);

  it("accepts any listed variant of a gap answer, ignoring case and spacing", () => {
    const g = groups.find((x) => x.interaction === "gap")!;
    const item = g.items[0];
    expect(markItem(g, item, `  ${item.answer[0].toUpperCase()} `)).toBe(1);
    expect(markItem(g, item, "definitely wrong")).toBe(0);
    expect(markItem(g, item, "")).toBe(0);
  });

  it("gives one mark per correct choice in Choose TWO", () => {
    const g = groups.find((x) => x.interaction === "multi")!;
    const item = g.items[0];
    const wrong = g.options!.find((o) => !item.answer.includes(o.key))!.key;
    expect(markItem(g, item, item.answer)).toBe(2);
    expect(markItem(g, item, [item.answer[0], wrong])).toBe(1);
    expect(markItem(g, item, [wrong])).toBe(0);
  });
});

describe("demo data", () => {
  it("seeds four full mocks with the trend 5.5, 6.0, 6.0, 6.5", () => {
    const db = buildSeed("demo");
    const bands = Object.values(db.results)
      .filter((r) => r.kind === "full")
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
      .map((r) => r.overall);
    expect(bands).toEqual([5.5, 6, 6, 6.5]);
  });

  it("drives the dashboard to the approved mockup's numbers", () => {
    const d = buildDashboard(buildSeed("demo"));
    expect(d.predicted).toMatchObject({ low: 6, high: 7, mocks: 4 });
    expect(d.skills.map((s) => s.band)).toEqual([7, 6.5, 6, 6.5]);
    expect(d.readingTypes[0].type).toBe("matching-headings");
    expect(d.daysToTest).toBe(34);
  });

  it("an empty start has no results and a first-mock prompt", () => {
    const d = buildDashboard(buildSeed("empty"));
    expect(d.predicted).toBeNull();
    expect(d.next.href).toBe("/app/mocks");
  });
});
