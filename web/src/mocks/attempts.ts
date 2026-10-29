import type { Attempt, Profile, Section, SectionState, Test } from "@/api/schemas";
import { uid } from "@/lib/utils";

export function firstNumber(section: Section): number {
  for (const p of section.parts) for (const g of p.groups) for (const i of g.items) return i.numbers[0];
  return 1;
}

export function emptySectionState(section: Section, accommodation: Profile["accommodation"]): SectionState {
  return {
    sectionId: section.id,
    status: "not-started",
    remainingSec: Math.round(section.durationSec * accommodation),
    currentPart: 0,
    currentNumber: firstNumber(section),
    answers: {},
    flags: [],
    highlights: [],
    notes: [],
    essays: {},
    recordings: {},
    partTime: {},
    startedAt: null,
    submittedAt: null,
  };
}

export function createAttempt(
  test: Test,
  mode: Attempt["mode"],
  accommodation: Profile["accommodation"],
  startedAt = new Date().toISOString(),
): Attempt {
  return {
    id: uid("att"),
    testId: test.id,
    testTitle: test.title,
    kind: test.kind,
    mode,
    accommodation,
    status: "in-progress",
    sectionIndex: 0,
    sections: test.sections.map((s) => emptySectionState(s, accommodation)),
    startedAt,
    submittedAt: null,
  };
}
