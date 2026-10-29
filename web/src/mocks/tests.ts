import type { Part, QuestionGroup, QuestionType, Section, Skill, Test, TestSummary } from "@/api/schemas";
import { listeningSection as rawListening } from "./fixtures/academic-1/listening";
import { readingSection } from "./fixtures/academic-1/reading";
import { speakingSection, writingSection } from "./fixtures/academic-1/writing-speaking";
import { audioDurations } from "./fixtures/academic-1/audio-durations";

/*
 * The test catalogue the mock API serves. One full original Academic test,
 * section tests cut from it, and practice sets cut from each question group.
 */

export const TYPE_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Multiple choice",
  tfng: "True, False, Not Given",
  ynng: "Yes, No, Not Given",
  "matching-information": "Matching information",
  "matching-headings": "Matching headings",
  "matching-features": "Matching features",
  "matching-sentence-endings": "Matching sentence endings",
  "sentence-completion": "Sentence completion",
  "summary-completion": "Summary completion",
  "note-completion": "Note completion",
  "table-completion": "Table completion",
  "flow-chart-completion": "Flow chart completion",
  "diagram-label-completion": "Diagram label completion",
  "short-answer": "Short answer",
  matching: "Matching",
  "plan-map-diagram-labelling": "Plan, map, diagram labelling",
  "form-completion": "Form completion",
};

/** Persian type names for text the mock API writes itself (titles of recommendations). */
export const TYPE_LABELS_FA: Record<QuestionType, string> = {
  "multiple-choice": "چندگزینه‌ای",
  tfng: "درست/نادرست/ذکر نشده",
  ynng: "بله/خیر/ذکر نشده",
  "matching-information": "تطبیق اطلاعات",
  "matching-headings": "تطبیق عنوان‌ها",
  "matching-features": "تطبیق ویژگی‌ها",
  "matching-sentence-endings": "تطبیق پایان جمله‌ها",
  "sentence-completion": "تکمیل جمله",
  "summary-completion": "تکمیل خلاصه",
  "note-completion": "تکمیل یادداشت",
  "table-completion": "تکمیل جدول",
  "flow-chart-completion": "تکمیل فلوچارت",
  "diagram-label-completion": "تکمیل برچسب‌های نمودار",
  "short-answer": "پاسخ کوتاه",
  matching: "تطبیق",
  "plan-map-diagram-labelling": "برچسب‌گذاری نقشه و نمودار",
  "form-completion": "تکمیل فرم",
};

export function typeLabel(type: QuestionType): string {
  return TYPE_LABELS[type];
}

const CHECK_SEC = 120;

/** Listening timing comes from the generated audio files plus 2 minutes to check. */
function withAudioDurations(section: Section): Section {
  const parts = section.parts.map((p) =>
    p.audio ? { ...p, audio: { ...p.audio, durationSec: audioDurations[p.audio.src] ?? p.audio.durationSec } } : p,
  );
  const audioSec = parts.reduce((s, p) => s + (p.audio?.durationSec ?? 0), 0);
  return { ...section, parts, durationSec: Math.ceil(audioSec) + CHECK_SEC };
}

const listeningSection = withAudioDurations(rawListening);

export const FULL_TEST: Test = {
  id: "academic-1",
  title: "Academic test 1",
  kind: "full",
  sections: [listeningSection, readingSection, writingSection, speakingSection],
};

const SKILL_TITLES: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

const sectionTests: Test[] = FULL_TEST.sections.map((s) => ({
  id: `academic-1-${s.skill}`,
  title: `Academic test 1 ${SKILL_TITLES[s.skill]}`,
  kind: "section",
  sections: [s],
}));

/** One practice set per question group: the passage or audio part with only that group. */
function practiceFromGroup(section: Section, part: Part, group: QuestionGroup): Test {
  const questions = group.items.reduce((n, i) => n + i.numbers.length, 0);
  const durationSec =
    section.skill === "listening" ? Math.ceil(part.audio?.durationSec ?? 240) + 60 : Math.max(300, questions * 90 + 240);
  const narrowedPart: Part = { ...part, groups: [group], rubric: `Answer questions ${group.title.replace("Questions ", "")}.` };
  return {
    id: `practice-${group.id}`,
    title: `${typeLabel(group.type)}, ${group.title.toLowerCase()}`,
    kind: "practice",
    questionType: group.type,
    sections: [{ ...section, id: `${section.id}-${group.id}`, durationSec, parts: [narrowedPart] }],
  };
}

function practiceFromPart(section: Section, part: Part, label: string): Test {
  return {
    id: `practice-${part.id}`,
    title: label,
    kind: "practice",
    sections: [{ ...section, id: `${section.id}-${part.id}`, durationSec: Math.round((part.writing?.minutes ?? 5) * 60), parts: [part] }],
  };
}

const practiceTests: Test[] = [
  ...[listeningSection, readingSection].flatMap((s) =>
    s.parts.flatMap((p) => p.groups.map((g) => practiceFromGroup(s, p, g))),
  ),
  ...writingSection.parts.map((p) => practiceFromPart(writingSection, p, `Writing task ${p.writing?.task}`)),
  ...speakingSection.parts.map((p) => ({
    ...practiceFromPart(speakingSection, p, `Speaking part ${p.speaking?.part}`),
    sections: [{ ...speakingSection, id: `${speakingSection.id}-${p.id}`, durationSec: 300, parts: [p] }],
  })),
];

export const ALL_TESTS: Test[] = [FULL_TEST, ...sectionTests, ...practiceTests];

export function getTest(id: string): Test | undefined {
  return ALL_TESTS.find((t) => t.id === id);
}

export function questionCount(test: Test): number {
  return test.sections.reduce(
    (n, s) => n + s.parts.reduce((m, p) => m + p.groups.reduce((k, g) => k + g.items.reduce((j, i) => j + i.numbers.length, 0), 0), 0),
    0,
  );
}

export function summarise(test: Test): TestSummary {
  return {
    id: test.id,
    title: test.title,
    kind: test.kind,
    skills: test.sections.map((s) => s.skill),
    questionType: test.questionType,
    minutes: Math.round(test.sections.reduce((n, s) => n + s.durationSec, 0) / 60),
    questions: questionCount(test),
  };
}

/** What the exam client receives: no answer keys, explanations or evidence. */
export function stripAnswers(test: Test): Test {
  return {
    ...test,
    sections: test.sections.map((s) => ({
      ...s,
      parts: s.parts.map((p) => ({
        ...p,
        groups: p.groups.map((g) => ({
          ...g,
          items: g.items.map((i) => ({
            id: i.id,
            numbers: i.numbers,
            prompt: i.prompt,
            options: i.options,
            position: i.position,
            answer: ["hidden"],
            explanation: { en: "", fa: "" },
          })),
        })),
      })),
    })),
  };
}
