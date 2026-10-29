import type { Skill } from "@/api/schemas";

/*
 * Raw score to band conversion, from docs/research/research-official-ielts.md.
 * IELTS adjusts these by about one mark per test version, so the backend
 * should own the final tables; these are the widely published averages.
 */

type Row = [minRaw: number, band: number];

const LISTENING: Row[] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5],
  [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0],
];

const ACADEMIC_READING: Row[] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5],
  [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0],
];

/** Band for a raw score out of 40. Shorter practice sets are scaled to 40 first. */
export function rawToBand(skill: Extract<Skill, "listening" | "reading">, raw: number, total = 40): number {
  const scaled = total === 40 ? raw : Math.round((raw / Math.max(total, 1)) * 40);
  const table = skill === "listening" ? LISTENING : ACADEMIC_READING;
  for (const [min, band] of table) if (scaled >= min) return band;
  return 0;
}

/**
 * Overall band: mean of the four skills rounded to the nearest half band,
 * with .25 rounding up to .5 and .75 rounding up to the next whole band.
 */
export function overallBand(bands: number[]): number {
  if (bands.length === 0) return 0;
  const mean = bands.reduce((a, b) => a + b, 0) / bands.length;
  const whole = Math.floor(mean);
  const frac = mean - whole;
  if (frac < 0.25) return whole;
  if (frac < 0.75) return whole + 0.5;
  return whole + 1;
}

/** Round any number to the nearest half band (for averaged criteria). */
export function toHalfBand(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Writing: Task 2 counts twice as much as Task 1. */
export function writingBand(task1: number, task2: number): number {
  return toHalfBand((task1 + task2 * 2) / 3);
}

export const BAND_LABELS: Record<number, string> = {
  9: "Expert",
  8: "Very good",
  7: "Good",
  6: "Competent",
  5: "Modest",
  4: "Limited",
  3: "Extremely limited",
  2: "Intermittent",
  1: "Non-user",
  0: "Did not attempt",
};
