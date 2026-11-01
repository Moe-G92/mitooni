import type {
  AnswerValue,
  Attempt,
  Item,
  ItemResult,
  QuestionGroup,
  Result,
  Section,
  SkillScore,
  SpeakingFeedback,
  Test,
  TypeStat,
  WritingFeedback,
} from "@/api/schemas";
import { overallBand, rawToBand, writingBand } from "@/lib/bands";
import { formatNumber } from "@/lib/format";
import { countWords, normaliseAnswer } from "@/lib/utils";
import { speakingFeedback, writingFeedbackTask1, writingFeedbackTask2 } from "./fixtures/feedback";
import { typeLabel, TYPE_LABELS_FA } from "./tests";

/*
 * Prototype scoring. Listening and Reading are marked for real against the
 * answer keys. Writing and Speaking return fixture feedback marked dummy:
 * the real marking service replaces this.
 */

export function asArray(v: AnswerValue | undefined): string[] {
  if (v === undefined) return [];
  return (Array.isArray(v) ? v : [v]).filter((s) => s.trim() !== "");
}

/** Marks for one item: gap answers match any accepted variant; multi gets one mark per correct key. */
export function markItem(group: QuestionGroup, item: Item, given: AnswerValue | undefined): number {
  const values = asArray(given);
  if (group.interaction === "multi") {
    const picked = values.slice(0, item.numbers.length);
    return picked.filter((k) => item.answer.includes(k)).length;
  }
  const value = values[0];
  if (!value) return 0;
  if (group.interaction === "gap" || group.interaction === "diagram") {
    const v = normaliseAnswer(value);
    return item.answer.some((a) => normaliseAnswer(a) === v) ? 1 : 0;
  }
  return item.answer.includes(value) ? 1 : 0;
}

function itemPrompt(group: QuestionGroup, item: Item): string {
  if (item.prompt) return item.prompt;
  const n = item.numbers[0];
  for (const block of group.content ?? []) {
    const texts =
      block.kind === "table" ? block.rows.flat() : block.kind === "flow" ? block.steps : block.kind === "list" ? block.items : [block.text];
    const hit = texts.find((t) => t.includes(`{{${n}}}`));
    if (hit) return hit.replace(`{{${n}}}`, "_____").replace(/\{\{\d+\}\}/g, "…").replace(/\*\*/g, "");
  }
  return `${typeLabel(group.type)} ${n}`;
}

function sectionSeconds(attempt: Attempt, section: Section): { used: number; allowed: number } {
  const state = attempt.sections.find((s) => s.sectionId === section.id);
  const allowed = Math.round(section.durationSec * attempt.accommodation);
  if (!state) return { used: 0, allowed };
  const partSum = Object.values(state.partTime).reduce((a, b) => a + b, 0);
  return { used: Math.min(allowed, Math.round(partSum || allowed - state.remainingSec)), allowed };
}

function markSection(section: Section, answers: Record<string, AnswerValue>) {
  const items: ItemResult[] = [];
  for (const part of section.parts) {
    for (const group of part.groups) {
      for (const item of group.items) {
        const given = answers[item.id];
        items.push({
          itemId: item.id,
          numbers: item.numbers,
          sectionId: section.id,
          skill: section.skill,
          type: group.type,
          prompt: itemPrompt(group, item),
          given: asArray(given),
          correct: group.interaction === "multi" ? item.answer : item.answer.slice(0, 1),
          marks: markItem(group, item, given),
          maxMarks: group.interaction === "multi" ? item.numbers.length : 1,
          explanation: item.explanation,
          trap: item.trap,
          evidence: item.evidence,
        });
      }
    }
  }
  return items;
}

function writingFor(section: Section, essays: Record<string, string>): WritingFeedback[] {
  return section.parts.flatMap((part) => {
    if (!part.writing) return [];
    const fixture = part.writing.task === 1 ? writingFeedbackTask1 : writingFeedbackTask2;
    const essay = essays[part.id] ?? "";
    return [
      {
        ...fixture,
        partId: part.id,
        essay,
        words: countWords(essay),
        // Sample notes only make sense where the learner's essay contains the same words.
        annotations: fixture.annotations.filter((a) => essay.includes(a.quote)),
        dummy: true,
      },
    ];
  });
}

function speakingFor(section: Section, attempt: Attempt): SpeakingFeedback {
  const state = attempt.sections.find((s) => s.sectionId === section.id);
  const parts = section.parts.map((p) => {
    const fixturePart = speakingFeedback.parts.find((fp) => fp.part === p.speaking?.part);
    const rec = state?.recordings[p.id];
    return {
      part: p.speaking?.part ?? 1,
      partId: p.id,
      band: fixturePart?.band,
      recordingKey: rec?.key ?? null,
      durationSec: rec?.durationSec ?? 0,
      transcript: fixturePart?.transcript ?? "",
    };
  });
  return { ...speakingFeedback, parts, dummy: true };
}

const DRILL_SKILLS = new Set(["listening", "reading"]);

export function buildResult(test: Test, attempt: Attempt, completedAt = new Date().toISOString()): Result {
  const skills: SkillScore[] = [];
  const items: ItemResult[] = [];
  let writing: WritingFeedback[] = [];
  let speaking: SpeakingFeedback | null = null;

  for (const section of test.sections) {
    const state = attempt.sections.find((s) => s.sectionId === section.id);
    const { used, allowed } = sectionSeconds(attempt, section);
    if (section.skill === "listening" || section.skill === "reading") {
      const marked = markSection(section, state?.answers ?? {});
      items.push(...marked);
      const raw = marked.reduce((n, i) => n + i.marks, 0);
      const total = marked.reduce((n, i) => n + i.maxMarks, 0);
      skills.push({ skill: section.skill, raw, total, band: rawToBand(section.skill, raw, total), usedSec: used, allowedSec: allowed });
    } else if (section.skill === "writing") {
      writing = writingFor(section, state?.essays ?? {});
      const t1 = writing.find((w) => w.task === 1)?.band;
      const t2 = writing.find((w) => w.task === 2)?.band;
      const band = t1 !== undefined && t2 !== undefined ? writingBand(t1, t2) : (t1 ?? t2 ?? 0);
      skills.push({ skill: "writing", raw: null, total: null, band, usedSec: used, allowedSec: allowed });
    } else {
      speaking = speakingFor(section, attempt);
      skills.push({ skill: "speaking", raw: null, total: null, band: speaking.band, usedSec: used, allowedSec: allowed });
    }
  }

  // Keyed by skill and type: Listening and Reading share type names (multiple choice,
  // note completion...), and merging them made each skill's rows add up wrongly.
  const byTypeMap = new Map<string, TypeStat>();
  for (const i of items) {
    const key = `${i.skill}:${i.type}`;
    const s = byTypeMap.get(key) ?? { type: i.type, skill: i.skill, correct: 0, total: 0 };
    s.correct += i.marks;
    s.total += i.maxMarks;
    byTypeMap.set(key, s);
  }
  const byType = [...byTypeMap.values()];

  const overall = skills.length === 4 ? overallBand(skills.map((s) => s.band)) : null;
  const weakest = byType
    .filter((s) => DRILL_SKILLS.has(s.skill) && s.total > 0)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)[0];

  const next: Result["next"] = weakest
    ? {
        skill: weakest.skill,
        questionType: weakest.type,
        title: { en: `${typeLabel(weakest.type)} drill`, fa: `تمرین ${TYPE_LABELS_FA[weakest.type]}` },
        detail: {
          en: `You scored ${weakest.correct} of ${weakest.total} on this question type. A short drill is the fastest gain.`,
          fa: `در این نوع سؤال به ${formatNumber(weakest.correct, "fa")} از ${formatNumber(weakest.total, "fa")} سؤال درست جواب دادید. یک تمرین کوتاه سریع‌ترین راه پیشرفت است.`,
        },
      }
    : writing.length
      ? {
          skill: "writing",
          title: { en: "Rewrite with fewer grammar slips", fa: "بازنویسی با خطای دستوری کمتر" },
          detail: {
            en: "Take one paragraph from this essay and fix each highlighted sentence.",
            fa: "یک پاراگراف از همین نوشته را بردارید و هر جملهٔ مشخص‌شده را درست کنید.",
          },
        }
      : {
          skill: "speaking",
          title: { en: "Record Part 2 again", fa: "بخش ۲ را دوباره ضبط کنید" },
          detail: {
            en: "Use the pronunciation notes and aim to speak for the full two minutes.",
            fa: "از نکته‌های تلفظ استفاده کنید و سعی کنید دو دقیقهٔ کامل صحبت کنید.",
          },
        };

  return {
    attemptId: attempt.id,
    testId: test.id,
    testTitle: test.title,
    kind: test.kind,
    mode: attempt.mode,
    accommodation: attempt.accommodation,
    completedAt,
    overall,
    skills,
    byType,
    items,
    writing,
    speaking,
    next,
  };
}
