import { Link, useNavigate } from "react-router";
import { CountdownCard } from "@/components/ExamCountdown";
import { SKILL_TONE } from "@/components/dashboard/styles";
import { daysUntil, formatBand, formatDate, formatDayDate, formatNumber } from "@/lib/format";
import { Button } from "../../Button";
import { useAccount } from "../../state";
import type { Bootstrap, Plan, Progress, Session, Skill, Workspace } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Panel, useLearnerLocale } from "../ui";
import { useOperation, useSkillName } from "./useOperation";

export function TodayBoard({ data }: { data: Bootstrap }) {
  const { account } = useAccount(); const { text, locale } = useLearnerLocale(); const skillName = useSkillName(); const op = useOperation(); const navigate = useNavigate();
  const progress = useLearnerResource<Progress>("/progress");
  const prefs = data.preferences!; const plan = data.activePlan; const session = data.resumableSession;
  const hasSubmissions = progress.data?.skills?.some((item) => item.submittedCount > 0) ?? false;
  const needsPlan = !plan && !session && hasSubmissions;
  const evidencePending = !plan && !session && !progress.data;
  const createPlan = () => void op.run<Plan>("/plans", { expectedPreferencesRevision: data.preferencesRevision, expectedEvidenceRevision: data.evidenceRevision }, () => navigate("/app/plan"));
  const next = plan?.steps.find((step) => step.state === "in_progress") ?? plan?.steps.find((step) => step.state === "available");
  const days = prefs.testDate ? daysUntil(prefs.testDate) : null;
  const title = session ? session.kind === "baseline" ? text("ادامهٔ تمرین شروع", "Resume starting practice") : text("ادامهٔ آزمون آزمایشی", "Resume mock test") : next?.title ?? (plan ? text("فعالیت آماده‌ای باقی نمانده", "No ready activities remaining") : needsPlan ? text("ساخت برنامهٔ یادگیری", "Create your learning plan") : text("تمرین شروع", "Starting practice"));
  const start = () => {
    if (session) navigate(`/app/sessions/${encodeURIComponent(session.id)}`);
    else if (next && plan) void op.run<Workspace>("/workspaces/resolve", { planId: plan.id, planVersion: plan.version, stepId: next.id, conditionPreset: next.kind === "transfer" ? "independent" : "supported" }, (workspace) => navigate(`/learn/${encodeURIComponent(workspace.id)}`));
    else if (needsPlan) createPlan();
    else if (!plan) void op.run<Session>("/baselines", { expectedPreferencesRevision: data.preferencesRevision }, (created) => navigate(`/app/sessions/${encodeURIComponent(created.id)}`));
    else navigate("/app/plan");
  };
  return <div className="space-y-8">
    <section className="flex flex-wrap items-start justify-between gap-6">
      <div className="min-w-0 flex-[1_1_260px]"><p className="text-sm text-muted-foreground">{formatDayDate(new Date(), locale)}</p><h2 className="mt-2 font-archivo text-3xl font-extrabold text-midnight-iris" dir="auto">{account?.profile?.name}</h2><p className="mt-3 text-lg">{prefs.examTrack === "academic" ? "IELTS Academic" : "IELTS General Training"}</p></div>
      <div className="flex max-w-full flex-wrap items-start gap-3">{days !== null && days >= 0 ? <div><CountdownCard days={days} locale={locale} line1={text("روز", "days")} line2={text("تا آزمون", "to go")} label={`${formatNumber(days, locale)} ${text("روز تا آزمون", "days until your test")}`} /><p className="mt-3 text-sm text-muted-foreground">{formatDate(prefs.testDate!, locale)}</p></div> : <div className="rounded-[14px] bg-pink-tint px-4 py-4"><p>{days === null ? text("تاریخ آزمون تعیین نشده", "Test date not set") : text("تاریخ آزمون گذشته است", "Your test date has passed")}</p></div>}<div className="flex min-w-28 flex-col items-center rounded-[14px] border-2 border-strength bg-card px-5 py-4"><span className="text-sm font-semibold text-strength">{text("نمرهٔ هدف", "Target band")}</span><bdi className="mt-2 font-archivo text-4xl font-bold text-primary">{formatBand(prefs.targets.overall, locale)}</bdi></div></div>
    </section>
    <section className="flex flex-wrap items-center justify-between gap-6 rounded-card bg-primary px-6 py-7 text-white sm:px-8" aria-label={text("فعالیت بعدی", "Next activity")}>
      <div className="min-w-0 flex-[1_1_300px]"><h2 className="break-words font-archivo text-[28px] leading-9 font-bold" dir="auto">{title}</h2>{next && !session && <p className="mt-3 text-white">{skillName(next.skill)} · {formatNumber(next.estimatedMinutes, locale)} {text("دقیقه", "minutes")}</p>}{!session && !plan && !hasSubmissions && <p className="mt-3 max-w-xl text-white">{text("این تمرین نیازهای یادگیری را مشخص می‌کند؛ نمرهٔ رسمی آیلتس نیست.", "This practice identifies learning needs; it is not an IELTS band assessment.")}</p>}</div>
      <div className="flex flex-wrap items-center gap-5"><Link to="/app/practice" className="inline-flex min-h-11 items-center text-white underline underline-offset-4">{text("انتخاب تمرین", "Choose practice")}</Link><Button className="bg-white text-primary hover:bg-pink-tint" disabled={op.pending || op.locked || evidencePending} onClick={start}>{op.pending ? text("در حال آماده‌سازی", "Preparing") : session || next?.state === "in_progress" ? text("ادامه", "Resume") : needsPlan ? text("ساخت برنامه", "Create plan") : plan && !next ? text("مشاهدهٔ برنامه", "Open plan") : text("شروع", "Start")}</Button></div>
    </section>
    {!!op.error && <Failure error={op.error} onRetry={() => void op.retry()} />}
    <section aria-labelledby="learner-skills"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="learner-skills" className="font-archivo text-2xl font-bold text-primary">{text("مهارت‌ها", "Skills")}</h2><Link className="inline-flex min-h-11 items-center font-semibold text-primary underline" to="/app/mocks">{text("آزمون آزمایشی", "Mock tests")}</Link></div>
      {!!progress.error && <Failure error={progress.error} onRetry={progress.reload} />}
      <div className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">{(["listening", "reading", "writing", "speaking"] as Skill[]).map((skill) => {
        const evidence = progress.data?.skills?.find((item) => item.skill === skill); const tone = SKILL_TONE[skill]; const nextSkill = plan?.steps.find((step) => step.skill === skill && ["available", "in_progress"].includes(step.state));
        return <article className="flex min-w-0 flex-col rounded-[18px] border border-border bg-card p-5" key={skill}><h3 className={`font-archivo text-[22px] font-bold ${tone.ink}`}>{skillName(skill)}</h3><p className="mt-2 text-sm text-muted-foreground">{text("هدف", "Target")} <bdi>{formatBand(prefs.targets[skill], locale)}</bdi></p><div className="my-5 min-h-14">{progress.loading && !progress.data ? <p role="status">{text("در حال بارگذاری", "Loading")}</p> : progress.error && !progress.data ? <p>{text("اطلاعات در دسترس نیست", "Evidence unavailable")}</p> : evidence?.submittedCount ? <><p className="font-archivo text-2xl font-semibold">{formatNumber(evidence.submittedCount, locale)} <span className="text-sm font-normal">{text("تمرین ثبت‌شده", "submitted")}</span></p>{evidence.itemCount > 0 && <p className="mt-2 text-sm">{formatNumber(evidence.correctCount, locale)} / {formatNumber(evidence.itemCount, locale)} {text("پاسخ درست", "correct items")}</p>}<p className="mt-2 text-sm text-muted-foreground">{formatNumber(evidence.feedbackCount, locale)} {text("بازخورد", "feedback reports")}</p></> : <p className="text-sm text-muted-foreground">{text("هنوز تمرینی ثبت نشده", "No submitted practice yet")}</p>}</div>{nextSkill && <p className="mb-4 break-words text-sm" dir="auto">{nextSkill.title}</p>}<Link to={`/app/practice?skill=${skill}`} className={`mt-auto flex min-h-11 items-center justify-center rounded-[10px] px-3 text-sm font-semibold ${tone.soft} ${tone.ink}`}>{text("تمرین", "Practise")} {skillName(skill)}</Link></article>;
      })}</div>
    </section>
    <div className="grid items-start gap-5 md:grid-cols-2"><Panel title={text("برنامهٔ هفتگی", "Weekly plan")}>{plan ? <><p className="font-archivo text-3xl font-semibold text-primary">{formatNumber(plan.weeklyCapacityMinutes, locale)} <span className="text-base font-normal">{text("دقیقه", "minutes")}</span></p><p className="mt-3">{formatNumber(plan.steps.filter((step) => step.scheduled).length, locale)} {text("فعالیت زمان‌بندی‌شده", "scheduled activities")}</p><Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline" to="/app/plan">{text("مشاهدهٔ برنامه", "Open plan")}</Link></> : <Button variant="outline" disabled={op.pending || op.locked} onClick={createPlan}>{text("ساخت برنامه", "Create plan")}</Button>}</Panel>{progress.data?.skills?.some((item) => item.submittedCount > 0) && <Panel title={text("کار ثبت‌شده", "Submitted work")}><p>{text("تمرین‌ها و بازخوردهای ذخیره‌شده را مرور کن.", "Review your saved practice and feedback.")}</p><Link to="/app/results" className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline">{text("مشاهدهٔ نتایج", "View results")}</Link></Panel>}</div>
  </div>;
}
