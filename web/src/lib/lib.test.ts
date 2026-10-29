import { describe, expect, it } from "vitest";
import { overallBand, rawToBand, writingBand } from "./bands";
import { countWords, normaliseAnswer, numbersLabel } from "./utils";
import { daysUntil, formatBand, formatDate, formatNumber } from "./format";
import { tokenize } from "@/exam/engine/model";

describe("raw score to band", () => {
  it("matches the published Listening anchors", () => {
    expect(rawToBand("listening", 16)).toBe(5);
    expect(rawToBand("listening", 23)).toBe(6);
    expect(rawToBand("listening", 30)).toBe(7);
    expect(rawToBand("listening", 35)).toBe(8);
    expect(rawToBand("listening", 40)).toBe(9);
    expect(rawToBand("listening", 0)).toBe(0);
  });
  it("matches the published Academic Reading anchors", () => {
    expect(rawToBand("reading", 15)).toBe(5);
    expect(rawToBand("reading", 23)).toBe(6);
    expect(rawToBand("reading", 27)).toBe(6.5);
    expect(rawToBand("reading", 30)).toBe(7);
    expect(rawToBand("reading", 35)).toBe(8);
  });
  it("scales short practice sets to 40", () => {
    expect(rawToBand("reading", 3, 4)).toBe(7); // 30/40
    expect(rawToBand("reading", 0, 5)).toBe(0);
  });
});

describe("overall band rounding", () => {
  it("rounds .25 up to .5 and .75 up to the next band", () => {
    expect(overallBand([6.5, 6.5, 6, 6])).toBe(6.5); // 6.25
    expect(overallBand([6, 6, 6, 6.5])).toBe(6); // 6.125
    expect(overallBand([4, 4, 3.5, 4])).toBe(4); // 3.875
    expect(overallBand([7, 7, 6.5, 6.5])).toBe(7); // 6.75
    expect(overallBand([7, 6.5, 6, 6.5])).toBe(6.5);
  });
  it("weights Writing Task 2 twice as much as Task 1", () => {
    expect(writingBand(7, 6)).toBe(6.5); // 6.33
    expect(writingBand(6, 6)).toBe(6);
  });
});

describe("text helpers", () => {
  it("counts words like the exam counter", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  The chart   shows\nthree years. ")).toBe(5);
  });
  it("normalises typed answers", () => {
    expect(normaliseAnswer("  Liquid   Tin. ")).toBe("liquid tin");
    expect(normaliseAnswer("Bird’s nest")).toBe("bird's nest");
  });
  it("labels grouped questions", () => {
    expect(numbersLabel([18, 19])).toBe("18–19");
    expect(numbersLabel([7])).toBe("7");
  });
  it("splits bold text and answer boxes", () => {
    expect(tokenize("Fee: £{{6}} **per year**")).toEqual([
      { kind: "text", text: "Fee: £", bold: false },
      { kind: "gap", n: 6 },
      { kind: "text", text: " ", bold: false },
      { kind: "text", text: "per year", bold: true },
    ]);
  });
});

describe("locale formatting", () => {
  it("uses Persian digits in Persian", () => {
    expect(formatNumber(34, "fa")).toBe("۳۴");
    expect(formatBand(6.5, "en")).toBe("6.5");
    expect(formatBand(6.5, "fa")).toMatch(/^۶.۵$/);
    expect(formatBand(null, "en")).toBe("–");
  });
  it("uses the Solar Hijri calendar in Persian", () => {
    // 26 October 2026 is 4 Aban 1405.
    expect(formatDate("2026-10-26", "fa")).toContain("آبان");
    expect(formatDate("2026-10-26", "en")).toBe("26 October 2026");
  });
  it("counts days to the test", () => {
    expect(daysUntil("2026-11-29", new Date("2026-10-26T09:00:00"))).toBe(34);
  });
});
