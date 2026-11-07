import { useNavigate } from "react-router";
import { Button } from "../../Button";
import type { Plan, Skill, Step, Workspace } from "../contracts";
import { Failure, useLearnerLocale } from "../ui";
import { useOperation, useSkillName } from "./useOperation";
export function StepList({ plan, skill, firstOnly = false, subset }: { plan: Plan; skill?: Skill; firstOnly?: boolean; subset?: Step[] }) {
  const { text } = useLearnerLocale(); const skillName = useSkillName();
  const op = useOperation(); const navigate = useNavigate();
  const all = (subset ?? plan.steps).filter((step) => !skill || step.skill === skill);
  const steps = firstOnly ? [all.find((step) => step.state === "in_progress") ?? all.find((step) => step.state === "available")].filter((step): step is Plan["steps"][number] => !!step) : all;
  const status = { locked: text("قفل‌شده", "Locked"), completed: text("انجام‌شده", "Completed"), unavailable: text("در دسترس نیست", "Unavailable"), available: text("آماده", "Ready"), in_progress: text("در حال انجام", "In progress") };
  return <div>
    {steps.length === 0 && <p className="py-4">{text("فعالیت آماده‌ای در این برنامه وجود ندارد.", "There are no ready activities in this plan.")}</p>}
    <ol className="divide-y divide-border">{steps.map((step) => <li key={step.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
      <div className="min-w-0 flex-1"><h3 className="break-words font-semibold" dir="auto">{step.title}</h3><p className="mt-2 text-sm text-muted-foreground">{skillName(step.skill)} · {step.estimatedMinutes} {text("دقیقه", "min")} · {status[step.state]}</p></div>
      <Button variant={firstOnly ? "default" : "outline"} disabled={op.pending || op.locked || !["available", "in_progress"].includes(step.state)} onClick={() => void op.run<Workspace>("/workspaces/resolve", { planId: plan.id, planVersion: plan.version, stepId: step.id, conditionPreset: step.kind === "transfer" ? "independent" : "supported" }, (workspace) => navigate(`/learn/${encodeURIComponent(workspace.id)}`))}>{op.pending ? text("در حال باز کردن", "Opening") : step.state === "in_progress" ? text("ادامه", "Resume") : text("شروع", "Start")}</Button>
    </li>)}</ol>
    {!!op.error && <Failure error={op.error} onRetry={() => void op.retry()} />}
  </div>;
}
