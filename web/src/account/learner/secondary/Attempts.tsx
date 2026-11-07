import { Link } from "react-router";
import type { Results } from "../contracts";
import { useLearnerLocale } from "../ui";

export function Attempts({ attempts }: { attempts: Results["attempts"] }) {
  const { locale, text } = useLearnerLocale();
  const skills: Record<string, string> = { reading: text("خواندن", "Reading"), listening: text("شنیدن", "Listening"), writing: text("نوشتن", "Writing"), speaking: text("گفتار", "Speaking") };
  return <ul className="divide-y divide-border">{attempts.map(attempt => <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
    <div className="min-w-0 flex-1"><Link className="inline-flex min-h-11 items-center break-words font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring" to={`/app/results/${encodeURIComponent(attempt.id)}`}><bdi>{attempt.title}</bdi></Link>
      <p className="text-sm text-muted-foreground">{skills[attempt.skill] ?? attempt.skill} · {(typeof attempt.conditions === "string" ? attempt.conditions === "supported" : attempt.conditions.assisted) ? text("با راهنمایی", "Supported") : text("مستقل", "Independent")}{attempt.submittedAt && <> · <time dateTime={attempt.submittedAt}>{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium" }).format(new Date(attempt.submittedAt))}</time></>}</p>
    </div>
    {attempt.rawCheck && <p className="text-sm tabular-nums"><span dir="ltr">{attempt.rawCheck.correctCount} / {attempt.rawCheck.itemCount}</span> {text("پاسخ درست", "correct")}</p>}
  </li>)}</ul>;
}
