/*
 * Where each seeded Academic Word List word earns marks, for the "Useful for"
 * line on the review card (Vocabulary review canvas). Words for describing
 * charts belong to Writing Task 1, words that turn up mostly in research texts
 * to Reading, and the rest to Writing Task 2 and Speaking Part 3. Words the
 * learner adds themselves have no hint.
 *
 * Client-side for now: when the API grows a field for this on VocabCard, read
 * it from the card instead.
 */
export type VocabUse = "task1" | "task2" | "reading";

const TASK1 = [
  "significant", "decline", "fluctuate", "approximately", "proportion", "trend", "estimate", "relatively", "substantial",
  "considerable", "predominantly", "subsequently", "dominate", "accumulate", "shift", "indicate", "comprise", "undergo",
  "expand", "maintain", "distribute", "allocate", "evident",
];
const READING = ["hypothesis", "phenomenon", "variable", "principle", "interpret", "demonstrate", "obtain", "emerge", "assess"];

const USE = new Map<string, VocabUse>([...TASK1.map((w) => [w, "task1"] as const), ...READING.map((w) => [w, "reading"] as const)]);

/** Hint for a card, or null for a word the learner added. */
export function vocabUse(term: string, custom: boolean): VocabUse | null {
  if (custom) return null;
  return USE.get(term.toLowerCase()) ?? "task2";
}
