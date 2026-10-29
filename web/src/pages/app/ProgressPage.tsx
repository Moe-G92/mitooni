import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Skill } from "@/api/schemas";
import { useMe, useProgress } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { practiceHref } from "@/lib/links";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHint, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, EmptyState, ErrorState, Segmented, Skeleton, StrengthTag } from "@/components/ui/misc";
import { BandTrend, SkillTrend, StudyCalendar } from "@/components/charts";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

export default function ProgressPage() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const p = useProgress();
  const me = useMe();
  const [sort, setSort] = useState<"weak" | "name">("weak");
  const labels = Object.fromEntries(SKILLS.map((s) => [s, t(`skills.${s}`)]));

  const types = useMemo(() => {
    const list = [...(p.data?.types ?? [])];
    return sort === "weak" ? list.sort((a, b) => a.correct / a.total - b.correct / b.total) : list.sort((a, b) => t(`types.${a.type}`).localeCompare(t(`types.${b.type}`)));
  }, [p.data, sort, t]);

  if (p.isError) return <ErrorState message={t("errors.load")} onRetry={() => p.refetch()} />;
  if (!p.data || !me.data) return <Skeleton className="h-96" />;
  const d = p.data;
  const daysLeft = me.data.testDate ? Math.max(0, Math.round((new Date(me.data.testDate).getTime() - Date.now()) / 86_400_000)) : null;
  const mocksLeft = daysLeft !== null ? Math.max(1, Math.floor(daysLeft / 7)) : null;

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
            <CardLabel title={t("progress.overallTrend")} note={t("overview.fullMocks")} />
            {d.trend.length ? (
              <BandTrend
                points={d.trend}
                target={me.data.targets.overall}
                locale={locale}
                height={240}
                targetLabel={t("overview.targetShort", { band: formatBand(me.data.targets.overall, locale) })}
                onPoint={(id) => navigate(`/app/results/${id}`)}
              />
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t("overview.noTrend")}</p>
            )}
          </Card>

          <Card className="col-span-12 lg:col-span-5">
            <CardLabel title={t("progress.pace")} />
            {daysLeft !== null ? (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] border border-border px-3.5 py-3">
                    <span className="block text-xs text-muted-foreground">{t("progress.daysLeft")}</span>
                    <b className="font-mono text-2xl font-normal">{formatNumber(daysLeft, locale)}</b>
                  </div>
                  <div className="rounded-[14px] border border-border px-3.5 py-3">
                    <span className="block text-xs text-muted-foreground">{t("progress.mocksDone")}</span>
                    <b className="font-mono text-2xl font-normal">{formatNumber(d.trend.length, locale)}</b>
                  </div>
                </div>
                <p className="mt-4 text-sm">{t("progress.paceAdvice", { n: formatNumber(mocksLeft ?? 1, locale) })}</p>
                <CardHint>{t("progress.testOn", { date: formatDate(me.data.testDate!, locale) })}</CardHint>
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

          <Card className="col-span-12 lg:col-span-7">
            <CardLabel title={t("progress.bySkill")} note={t("progress.bySkillNote")} />
            <div className="mt-3">
              <SkillTrend series={d.bySkill} labels={labels} locale={locale} />
            </div>
          </Card>

          <Card className="col-span-12 lg:col-span-5">
            <CardLabel title={t("progress.calendar")} note={t("progress.calendarNote")} />
            <div className="mt-4">
              <StudyCalendar days={d.studyDays} locale={locale} label={t("progress.calendar")} countText={(n) => t("progress.studyDays", { n })} />
            </div>
          </Card>

          <Card className="col-span-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-medium">{t("progress.types")}</h2>
              <Segmented<"weak" | "name">
                label={t("progress.sort")}
                value={sort}
                onChange={setSort}
                items={[
                  { value: "weak", label: t("progress.sortWeak") },
                  { value: "name", label: t("progress.sortName") },
                ]}
              />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 text-start font-medium">{t("progress.type")}</th>
                    <th className="py-2 text-start font-medium">{t("results.skill")}</th>
                    <th className="w-40 py-2 text-start font-medium">{t("practice.accuracy")}</th>
                    <th className="py-2 text-center font-medium">{t("progress.marks")}</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {types.map((x) => (
                    <tr key={`${x.skill}-${x.type}`} className="border-b border-border last:border-0">
                      <td className="py-2.5">{t(`types.${x.type}`)}</td>
                      <td className="py-2.5 text-muted-foreground">{t(`skills.${x.skill}`)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Bar value={x.correct / x.total} className="w-24" label={t(`types.${x.type}`)} />
                          <span className="font-mono text-xs text-muted-foreground">{formatPercent(x.correct / x.total, locale)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-mono" dir="ltr">
                        {formatNumber(x.correct, locale)}/{formatNumber(x.total, locale)}
                      </td>
                      <td className="py-2.5 text-end">
                        <span className="inline-flex items-center gap-3">
                          <StrengthTag strength={x.strength} label={t(`strength.${x.strength}`)} />
                          <Link to={practiceHref(x.type)} className="text-xs text-primary hover:underline">
                            {t("progress.drill")}
                          </Link>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="col-span-12">
            <CardLabel title={t("progress.history")} />
            <ul className="mt-2">
              {d.history.slice(0, 8).map((h) => (
                <li key={h.attemptId} className="flex flex-wrap items-center gap-3 border-b border-border py-2.5 text-sm last:border-0">
                  <span className="w-36 text-muted-foreground">{formatDate(h.completedAt, locale)}</span>
                  <Link to={`/app/results/${h.attemptId}`} className="flex-1 font-medium hover:underline">
                    {h.testTitle}
                  </Link>
                  <span className="font-mono">{formatBand(h.overall ?? h.skills[0]?.band, locale)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Link to="/app/results" className="text-sm text-primary hover:underline">
                {t("common.viewAll")}
              </Link>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
