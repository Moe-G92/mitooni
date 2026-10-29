import type { QuestionType } from "@/api/schemas";

/** Practice page filtered to one question type; the page offers that type's sets. */
export function practiceHref(type: QuestionType): string {
  return `/app/practice?type=${type}`;
}

export function startHref(testId: string, mode: "exam" | "practice" = "exam"): string {
  return `/exam/new/${testId}${mode === "practice" ? "?mode=practice" : ""}`;
}
