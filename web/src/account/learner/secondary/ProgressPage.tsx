import { Link } from "react-router";
import type { Progress } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";
import { Attempts } from "./Attempts";
export default function ProgressPage() {
  const { text } = useLearnerLocale();
  const { data, loading, error, reload } = useLearnerResource<Progress>("/progress");
  const skills = [{ key: "listening", label: text("شنیدن", "Listening") }, { key: "reading", label: text("خواندن", "Reading") }, { key: "writing", label: text("نوشتن", "Writing") }, { key: "speaking", label: text("گفتار", "Speaking") }];
  return <><PageTitle>{text("پیشرفت", "Progress")}</PageTitle>{Boolean(error) && <Failure error={error} onRetry={reload} />}{loading && !data && <Loading />}{data && <div className="space-y-6">
    <Panel title={text("تمرین‌های ثبت‌شده", "Submitted practice")}><div className="grid gap-6 sm:grid-cols-2">{skills.map(skill => {
      const evidence = data.skills.find(row => row.skill === skill.key);
      return <section key={skill.key} className="min-w-0"><h3 className="font-medium">{skill.label}</h3>{!evidence || evidence.submittedCount === 0 ? <p className="mt-2 text-sm text-muted-foreground">{text("هنوز تمرینی ثبت نشده", "No submitted practice yet")}</p> : <dl className="mt-3 space-y-2 text-sm">{[
        [text("تمرین", "Attempts"), evidence.submittedCount], [text("مستقل", "Independent"), evidence.independentCount], [text("با راهنمایی", "Supported"), evidence.supportedCount], [text("بازخورد", "Feedback"), evidence.feedbackCount],
      ].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt>{label}</dt><dd className="tabular-nums">{value}</dd></div>)}{evidence.itemCount > 0 && <div className="flex justify-between gap-4"><dt>{text("پاسخ درست", "Correct items")}</dt><dd dir="ltr" className="tabular-nums">{evidence.correctCount} / {evidence.itemCount}</dd></div>}</dl>}</section>;
    })}</div><p className="mt-6 text-sm text-muted-foreground">{text("این داده‌ها عملکرد تمرینی تو را نشان می‌دهند؛ نمرهٔ تخمینی آیلتس نیستند.", "These records describe your practice; they are not an IELTS band estimate.")}</p></Panel>
    <Panel title={text("آخرین پاسخ‌ها", "Recent work")}>{data.recentAttempts.length ? <Attempts attempts={data.recentAttempts} /> : <Link className="inline-flex min-h-11 items-center underline" to="/app/practice">{text("شروع تمرین", "Start practice")}</Link>}</Panel>
  </div>}</>;
}
