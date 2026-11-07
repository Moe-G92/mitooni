import { Link } from "react-router";
import type { Bootstrap, Plan, Step } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";
import { Button } from "../../Button";
import { StepList } from "./shared";
import { useOperation } from "./useOperation";
export default function PlanPage() {
  const resource = useLearnerResource<Bootstrap>("/bootstrap"); const { text, locale } = useLearnerLocale(); const op = useOperation();
  if (!resource.data) return resource.loading ? <Loading /> : <Failure error={resource.error} onRetry={resource.reload} />;
  const data = resource.data; const plan = data.activePlan;
  const days = new Map<string, Step[]>();
  const unscheduled: Step[] = [];
  for (const step of plan?.steps ?? []) {
    if (!step.scheduled || !step.scheduledDate) { unscheduled.push(step); continue; }
    const group = days.get(step.scheduledDate) ?? []; group.push(step); days.set(step.scheduledDate, group);
  }
  const orderedDays = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-GB", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  return <div className="mx-auto max-w-5xl space-y-6"><PageTitle action={plan && <Button variant="outline" disabled={op.pending || op.locked} onClick={() => void op.run<Plan>("/plans", { expectedPreferencesRevision: data.preferencesRevision, expectedEvidenceRevision: data.evidenceRevision }, resource.reload)}>{op.pending ? text("در حال به‌روزرسانی", "Updating") : text("به‌روزرسانی برنامه", "Update plan")}</Button>}>{text("برنامهٔ هفتگی", "Weekly plan")}</PageTitle>
    {!!resource.error && <Failure error={resource.error} onRetry={resource.reload} />}
    {plan ? <>
      <Panel title={text("فعالیت بعدی", "Next activity")}><p className="mb-2 text-sm text-muted-foreground">{plan.weeklyCapacityMinutes} {text("دقیقه در هفته", "minutes per week")}</p><StepList plan={plan} firstOnly />{plan.status === "needs_attention" && <p className="mt-4">{text("برای برنامه‌ریزی، زمان مطالعه و فعالیت‌های در دسترس را بررسی کن.", "Check your study time and available activities to continue planning.")}</p>}</Panel>
      <div className="grid items-start gap-5 lg:grid-cols-2">{orderedDays.map(([date, steps]) => <Panel key={date} title={dateLabel(date)}><StepList plan={plan} subset={steps} /></Panel>)}</div>
      {unscheduled.length > 0 && <Panel title={text("بدون زمان‌بندی", "Unscheduled")}><StepList plan={plan} subset={unscheduled} /></Panel>}
    </> : <Panel><p className="mb-4">{text("هنوز برنامه‌ای ساخته نشده است.", "You have no study plan yet.")}</p><Link to="/app" className="inline-flex min-h-11 items-center text-primary underline">{text("تنظیم برنامه", "Set up your plan")}</Link></Panel>}
    {!!op.error && <Failure error={op.error} onRetry={() => void op.retry()} />}
  </div>;
}
