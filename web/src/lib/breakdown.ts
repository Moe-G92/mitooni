import type { Criterion } from "@/api/schemas";
import { overallBand } from "@/lib/bands";

/* Helpers for the score breakdown on the Writing and Speaking feedback pages. */

export type Level = "c2" | "c1" | "b2" | "b1" | "a2";

/** CEFR-style level for a band (the usual IELTS to CEFR mapping). */
export function levelOf(band: number): Level {
  if (band >= 8.5) return "c2";
  if (band >= 7) return "c1";
  if (band >= 5.5) return "b2";
  if (band >= 4) return "b1";
  return "a2";
}

/** The four criteria are equally weighted, rounded like the overall band. */
const criteriaBand = (bands: number[]) => overallBand(bands);

export type Lift = { skillFrom: number; skillTo: number; overallFrom: number | null; overallTo: number | null };

/**
 * What raising one criterion by a whole band is worth, with everything else the same.
 * `toSkill` turns this task's or test's criterion band into the skill band (Writing
 * weights Task 2 twice); `toOverall` turns a skill band into the overall band.
 */
export function liftFor(
  criteria: Criterion[],
  key: Criterion["key"],
  current: { skill: number; overall: number | null },
  toSkill: (taskBand: number) => number,
  toOverall: ((skillBand: number) => number) | null,
): Lift {
  const base = criteria.map((c) => c.band);
  const next = criteria.map((c) => (c.key === key ? Math.min(9, c.band + 1) : c.band));
  const skillBase = toSkill(criteriaBand(base));
  const skillNext = toSkill(criteriaBand(next));
  // Shift from the stored bands so the numbers match what the learner sees elsewhere.
  const skillTo = Math.min(9, current.skill + (skillNext - skillBase));
  let overallTo: number | null = null;
  if (current.overall !== null && toOverall) overallTo = Math.min(9, current.overall + (toOverall(skillNext) - toOverall(skillBase)));
  return { skillFrom: current.skill, skillTo, overallFrom: current.overall, overallTo };
}
