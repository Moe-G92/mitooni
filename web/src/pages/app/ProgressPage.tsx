import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, CalendarDays, Headphones, Mic, PenLine, type LucideIcon } from "lucide-react";
import type { Skill } from "@/api/schemas";
import { useMe, useProgress } from "@/api/queries";
import { useT } from "@/i18n";
import { daysUntil, formatBand, formatNumber, formatPercent } from "@/lib/format";
import { practiceHref } from "@/lib/links";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton, StrengthTag } from "@/components/ui/misc";
import { BandTrend } from "@/components/charts";
import { SkillBars } from "@/components/study/SkillBars";
import { DaysToGo } from "@/components/study/DaysToGo";
import { ExamMonth } from "@/components/study/ExamMonth";
import { formatFullDay } from "@/components/study/dates";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

/* Per-skill colours for the question type sections, from the canvas. */
const SECTION: Record<Skill, { icon: LucideIcon; text: string; top: string; head: string; tile: string; bar: string }> = {
  listening: { icon: Headphones, text: "text-primary", top: "border-t-primary", head: "bg-[#E6EBFF]", tile: "bg-primary", bar: "#3E4FC4" },
  reading: { icon: BookOpen, text: "text-magenta", top: "border-t-magenta", head: "bg-pink-tint", tile: "bg-magenta", bar: "#E95FC4" },
  writing: { icon: PenLine, text: "text-weak", top: "border-t-coral", head: "bg-weak-soft", tile: "bg-coral", bar: "#D92F3A" },
  speaking: { icon: Mic, text: "text-strength", top: "border-t-[#4f9a2e]", head: "bg-strength-soft", tile: "bg-[#4f9a2e]", bar: "#4f9a2e" },
};

export default function ProgressPage() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const p = useProgress();
  const me = useMe();
  const labels = Object.fromEntries(SKILLS.map((s) => [s, t(`skills.${s}`)])) as Record<Skill, string>;

  // Question types grouped by skill, weakest first within each skill.
  const groups = useMemo(() => {
    const types = p.data?.types ?? [];
    return SKILLS.map((skill) => ({
      skill,
      rows: types.filter((x) => x.skill === skill).sort((a, b) => a.correct / a.total - b.correct / b.total),
    })).filter((g) => g.rows.length > 0);
  }, [p.data]);

  if (p.isError) return <ErrorState message={t("errors.load")} onRetry={() => p.refetch()} />;
  if (!p.data || !me.data) return <Skeleton className="h-96" />;
  const d = p.data;
  const testDate = me.data.testDate;
  const daysLeft = testDate ? Math.max(0, daysUntil(testDate)) : null;
  const mocksLeft = daysLeft !== null ? Math.max(1, Math.floor(daysLeft / 7)) : null;
  const target = me.data.targets.overall;

  return (
    <>
      <PageHeader title={t("progress.title")} sub={t("progress.sub")} />
      {d.history.length === 0 ? (
        <EmptyState
          title={t("progress.empty")}
          body={t("progress.emptyBody")}
          action={
            <Button asChild>
              <Link to="/app/mocks">{t("mocks.startFull")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-12 lg:col-span-7">
            <CardLabel title={t("progress.overallTrend")} note={t("progress.fullMocks")} />
            {d.trend.length ? (
              <BandTrend
                points={d.trend}
                target={target}
                locale={locale}
                height={240}
                targetLabel={t("overview.targetShort", { band: formatBand(target, locale) })}
                onPoint={(id) => navigate(`/app/results/${id}`)}
              />
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t("progress.noTrend")}</p>
            )}
          </Card>

          <Card className="col-span-12 flex flex-col lg:col-span-5">
            <CardLabel title={t("progress.pace")} />
            {daysLeft !== null && testDate ? (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <DaysToGo
                    days={daysLeft}
                    locale={locale}
                    line1={t("progress.daysWord", { count: daysLeft })}
                    line2={t("progress.toGo")}
                    label={t("progress.daysToGoLabel", { count: daysLeft, n: formatNumber(daysLeft, locale) })}
                  />
                  <div className="rounded-[14px] border border-border px-3.5 py-3">
                    <span className="block text-xs text-muted-foreground">{t("progress.mocksDone")}</span>
                    <b className="font-archivo text-2xl font-bold tabular-nums">{formatNumber(d.trend.length, locale)}</b>
                  </div>
                </div>
                <p className="mt-4 text-sm">{t("progress.paceAdvice", { n: formatNumber(mocksLeft ?? 1, locale) })}</p>
                <div className="mt-auto flex items-center gap-2 border-t border-border pt-3 font-archivo text-base leading-snug font-bold text-primary max-lg:mt-4">
                  <CalendarDays className="size-[18px] shrink-0 text-coral" aria-hidden="true" />
                  {t("progress.testDay", { date: formatFullDay(testDate, locale) })}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("progress.noDate")}{" "}
                <Link to="/app/settings" className="text-primary hover:underline">
                  {t("nav.settings")}
                </Link>
              </p>
            )}
          </Card>

          <Card className={cn("col-span-12", testDate && "lg:col-span-7")}>
            <CardLabel title={t("progress.bySkill")} note={t("progress.bySkillNote")} />
            <div className="mt-3">
              <SkillBars
                series={d.bySkill}
                labels={labels}
                target={target}
                locale={locale}
                targetLabel={t("progress.targetLine", { band: formatBand(target, locale) })}
                legendTarget={t("progress.target")}
              />
            </div>
          </Card>

          {testDate && (
            <section
              aria-label={t("progress.keepGoing")}
              className="col-span-12 flex min-w-0 flex-col items-center justify-center rounded-card bg-pink-tint px-6 py-5.5 lg:col-span-5"
            >
              <ExamMonth
                examDate={testDate}
                locale={locale}
                tag={t("progress.examDay")}
                label={t("progress.examMonthLabel", { date: formatFullDay(testDate, locale) })}
              />
            </section>
          )}

          {groups.map(({ skill, rows }) => {
            const c = SECTION[skill];
            const Icon = c.icon;
            return (
              <section
                key={skill}
                aria-label={t("progress.typesFor", { skill: labels[skill] })}
                className={cn("col-span-12 min-w-0 overflow-hidden rounded-card border border-t-[5px] border-border bg-card", c.top)}
              >
                <div className={cn("flex items-center gap-3 px-6 py-4", c.head)}>
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px] text-white", c.tile)}>
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <h2 className={cn("font-archivo text-[22px] font-extrabold", c.text)}>{labels[skill]}</h2>
                  <span className={cn("ms-auto text-[13px] font-semibold", c.text)}>{t("progress.typeCount", { count: rows.length, n: formatNumber(rows.length, locale) })}</span>
                </div>
                <div className="relative overflow-x-auto px-6 pt-1.5 pb-4">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-2 text-start font-medium">{t("progress.type")}</th>
                        <th className="w-40 py-2 text-start font-medium">{t("practice.accuracy")}</th>
                        <th className="py-2 text-center font-medium">{t("progress.marks")}</th>
                        <th className="py-2">
                          <span className="sr-only">{t("progress.actions")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((x) => {
                        const ratio = x.correct / x.total;
                        return (
                          <tr key={`${x.skill}-${x.type}`} className="border-b border-border">
                            <td className="py-2.5">{t(`types.${x.type}`)}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <div
                                  role="meter"
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-valuenow={Math.round(ratio * 100)}
                                  aria-label={t(`types.${x.type}`)}
                                  className="h-2 w-24 overflow-hidden rounded bg-border"
                                >
                                  <i className="block h-full rounded" style={{ width: `${ratio * 100}%`, background: c.bar }} />
                                </div>
                                <span className="font-archivo text-xs text-muted-foreground tabular-nums">{formatPercent(ratio, locale)}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-center font-archivo tabular-nums" dir="ltr">
                              {formatNumber(x.correct, locale)}/{formatNumber(x.total, locale)}
                            </td>
                            <td className="py-2.5 text-end">
                              <span className="inline-flex items-center gap-3">
                                <StrengthTag strength={x.strength} label={t(`strength.${x.strength}`)} />
                                <Link to={practiceHref(x.type)} className="text-xs text-foreground hover:text-primary hover:underline">
                                  {t("progress.drill")}
                                </Link>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
