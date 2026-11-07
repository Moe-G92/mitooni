import type { Json } from "./contracts";
const names: Record<string, string> = {
  answerKey: "Answer key · کلید پاسخ",
  teacherNotes: "Teacher notes · یادداشت مدرس",
  rationale: "Rationale · دلیل",
  rubric: "Rubric · معیار ارزیابی",
  stimulus: "Stimulus · متن",
  questions: "Questions · پرسش‌ها",
  script: "Transcript · متن گفتار",
  transcript: "Transcript · متن گفتار",
  provenance: "Source provenance · منشأ محتوا",
  source: "Source · منبع",
  syllabus: "Syllabus · برنامهٔ درسی",
  learningObjectives: "Learning objectives · هدف‌های یادگیری",
};
const fieldLabel = (key: string) =>
  names[key] ??
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
export function SourceTree({
  value,
  depth = 0,
}: {
  value: Json;
  depth?: number;
}) {
  if (depth > 18) return <p>…</p>;
  if (value === null) return <span className="text-muted-foreground">—</span>;
  if (typeof value !== "object")
    return (
      <p dir="auto" className="whitespace-pre-wrap break-words">
        {String(value)}
      </p>
    );
  if (Array.isArray(value))
    return (
      <ol className="space-y-3 ps-5 list-decimal">
        {value.map((item, i) => (
          <li key={i}>
            <SourceTree value={item} depth={depth + 1} />
          </li>
        ))}
      </ol>
    );
  return (
    <dl className="space-y-4">
      {Object.entries(value).map(([key, item]) => (
        <div
          key={key}
          className={
            depth === 0 ? "border-b border-border pb-4 last:border-0" : ""
          }
        >
          <dt className="mb-1 font-semibold" dir="auto">
            {fieldLabel(key)}
          </dt>
          <dd className="min-w-0 ps-3">
            <SourceTree value={item} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
