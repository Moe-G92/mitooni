import { Link, useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import type { Skill } from "@/api/schemas";
import { useDashboard, useMe, useProgress } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDate, formatDateTime, formatDayDate, formatNumber, formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHint, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, Chip, ErrorState, Skeleton, StrengthTag } from "@/components/ui/misc";
import { AccuracyDonut, BandScale, CriterionTile, MockBars, SkillRadar } from "@/components/charts";
import { ExamCountdown } from "@/components/ExamCountdown";
import { cn } from "@/lib/utils";
import { practiceHref } from "@/lib/links";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

/* KPI tiles in the reference palette, like the four tiles on the reference dashboard. */
const KPI_TONES = [
  "bg-rosewood text-white",
  "bg-frosted-blue text-ink-black [&_.kpi-note]:text-ink-black/80",
  "bg-light-green text-ink-black [&_.kpi-note]:text-ink-black/80",
  "bg-almond-silk text-ink-black [&_.kpi-note]:text-ink-black/80",
];

function Kpi({ label, value, note, tone }: { label: string; value: string; note: string; tone: number }) {
  return (
    <section className={cn("col-span-6 min-w-0 rounded-card px-5 py-4 lg:col-span-3", KPI_TONES[tone])}>
      <h2 className="text-[13px] font-medium">{label}</h2>
      <div className="mt-2 font-mono text-[32px] leading-none tracking-tight">{value}</div>
      <p className="kpi-note mt-2 text-xs">{note}</p>
    </section>
  );
}

/* The approved dashboard (docs/mockups/dashboard.html), now reading real data from GET /api/dashboard. */
export default function Overview() {
  const { t, locale, pick } = useT();
  const me = useMe();
  const d = useDashboard();
  const progress = useProgress();
  const navigate = useNavigate();
  const target = me.data?.targets.overall ?? 7;
  const skillLabels = Object.fromEntries(SKILLS.map((s) => [s, t(`skills.${s}`)]));

  const chips = <Chip>{t("common.academic")}</Chip>;

  const days = d.data?.daysToTest ?? null;
  const p = progress.data;
  const fullMocks = (p?.history ?? []).filter((h) => h.kind === "full" && h.overall !== null).slice(0, 6).reverse();
  const totals = (p?.types ?? []).reduce((a, x) => ({ correct: a.correct + x.correct, total: a.total + x.total }), { correct: 0, total: 0 });
  const since = new Date();
  since.setDate(since.getDate() - 28);
  const studyDays = (p?.studyDays ?? []).filter((x) => x >= since.toISOString().slice(0, 10)).length;
  const latest = d.data?.trend.at(-1)?.band ?? null;

  return (
    <>
      <PageHeader title={t("nav.overview")} sub={formatDayDate(new Date(), locale)} chips={chips} />
      {d.isError && <ErrorState message={t("errors.load")} onRetry={() => d.refetch()} />}
      {d.isLoading && (
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-12 h-56 lg:col-span-7" />
          <Skeleton className="col-span-12 h-56 lg:col-span-5" />
          <Skeleton className="col-span-12 h-64" />
        </div>
      )}
      {d.data && (
        <div className="grid grid-cols-12 gap-4">
          {/* Exam countdown */}
          <Card className="col-span-12 flex flex-col lg:col-span-5">
            <CardLabel title={t("overview.countdown")} note={me.data?.testDate ? t("overview.testOn", { date: formatDate(me.data.testDate, locale) }) : undefined} />
            {days !== null && days >= 0 ? (
              <div className="mt-3 flex flex-1 flex-col justify-center">
                <ExamCountdown
                  days={days}
                  locale={locale}
                  line1={days === 0 ? t("overview.testToday1") : t("overview.countdownDays", { count: days })}
                  line2={days === 0 ? t("overview.testToday2") : t("overview.toGo")}
                  label={t("overview.countdownLabel", { count: days, n: formatNumber(days, locale) })}
                />
                <Link to="/app/settings" className="mt-3 self-end text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  {t("overview.changeDate")}
                </Link>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{days === null ? t("overview.noDate") : t("overview.examPast")}</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/app/settings">{t("overview.setDate")}</Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Predicted band */}
          <Card className="col-span-12 lg:col-span-7">
            <CardLabel title={t("overview.predicted")} note={t("overview.updatedToday")} />
            {d.data.predicted ? (
              <>
                <div className="mt-3.5 mb-1.5 font-mono text-[44px] leading-none tracking-tight sm:text-[56px]" dir="ltr" style={{ textAlign: "start" }}>
                  {formatBand(d.data.predicted.low, locale)} – {formatBand(d.data.predicted.high, locale)}
                  <small className="ms-2.5 block text-lg tracking-normal text-muted-foreground sm:inline">
                    {t("overview.target", { band: formatBand(target, locale) })}
                  </small>
                </div>
                <p className="mt-2.5 text-[13px] text-muted-foreground">
                  {t("overview.basis", { mocks: formatNumber(d.data.predicted.mocks, locale), questions: formatNumber(d.data.predicted.questions, locale) })}
                </p>
                <BandScale low={d.data.predicted.low} high={d.data.predicted.high} target={target} locale={locale} />
                <CardHint>{t("overview.calibration")}</CardHint>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-muted-foreground">{t("overview.noPrediction")}</p>
                <Button asChild className="mt-4">
                  <Link to="/app/mocks">{t("mocks.startFull")}</Link>
                </Button>
              </div>
            )}
          </Card>

          {/* KPI tiles */}
          <Kpi tone={0} label={t("overview.kpi.latest")} value={formatBand(latest, locale)} note={t("overview.targetShort", { band: formatBand(target, locale) })} />
          <Kpi tone={1} label={t("overview.kpi.mocks")} value={formatNumber(d.data.predicted?.mocks ?? fullMocks.length, locale)} note={t("overview.kpi.mocksNote")} />
          <Kpi tone={2} label={t("overview.kpi.questions")} value={formatNumber(d.data.predicted?.questions ?? totals.total, locale)} note={t("overview.kpi.questionsNote")} />
          <Kpi tone={3} label={t("overview.kpi.study")} value={formatNumber(studyDays, locale)} note={t("overview.kpi.studyNote")} />

          {/* Mock scores by skill */}
          <Card className="col-span-12 lg:col-span-5">
            <CardLabel title={t("overview.scores")} note={t("overview.scoresNote")} />
            {fullMocks.length ? (
              <MockBars
                mocks={fullMocks.map((m) => ({ attemptId: m.attemptId, date: m.completedAt, skills: m.skills }))}
                labels={skillLabels}
                target={target}
                targetLabel={t("overview.targetShort", { band: formatBand(target, locale) })}
                locale={locale}
                onPick={(id) => navigate(`/app/results/${id}`)}
              />
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t("overview.noTrend")}</p>
            )}
          </Card>

          {/* Answer accuracy */}
          <Card className="col-span-12 sm:col-span-5 lg:col-span-3">
            <CardLabel title={t("overview.accuracy")} />
            {totals.total ? (
              <div className="mt-4">
                <AccuracyDonut
                  correct={totals.correct}
                  total={totals.total}
                  locale={locale}
                  centerNote={`${formatNumber(totals.total, locale)} ${t("overview.answered")}`}
                  labels={{ correct: t("overview.correct"), wrong: t("overview.wrong") }}
                />
                <ul className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <i className="size-2.5 rounded-full bg-chart-1" aria-hidden="true" />
                    {t("overview.correct")} {formatNumber(totals.correct, locale)}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <i className="size-2.5 rounded-full bg-rosewood" aria-hidden="true" />
                    {t("overview.wrong")} {formatNumber(totals.total - totals.correct, locale)}
                  </li>
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t("overview.noTypes")}</p>
            )}
          </Card>

          {/* Recent results */}
          <Card className="col-span-12 sm:col-span-7 lg:col-span-4">
            <CardLabel
              title={t("overview.recent")}
              note={
                <Link to="/app/results" className="hover:text-foreground hover:underline">
                  {t("overview.seeAll")}
                </Link>
              }
            />
            <ul className="mt-2">
              {(p?.history ?? []).slice(0, 5).map((h) => {
                const band = h.overall ?? (h.skills.length === 1 ? h.skills[0].band : null);
                return (
                  <li key={h.attemptId} className="border-b border-border last:border-0">
                    <Link to={`/app/results/${h.attemptId}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary">
                      <span className="min-w-0">
                        <span className="block truncate">{h.testTitle}</span>
                        <span className="text-xs text-muted-foreground">{formatShortDate(h.completedAt, locale)}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[13px] text-foreground">{formatBand(band, locale)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Band by skill */}
          <Card className="col-span-12 lg:col-span-4">
            <CardLabel title={t("overview.bySkill")} note={t("overview.lastVsTarget")} />
            <div className="mt-2 grid grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <SkillRadar data={d.data.skills.map((s) => ({ ...s }))} locale={locale} labels={skillLabels} />
              <ul className="flex flex-col gap-2 text-[13px]">
                {d.data.skills.map((s) => {
                  const gap = s.band === null ? null : s.band - s.target;
                  return (
                    <li key={s.skill} className="flex justify-between gap-2.5 border-b border-border pb-2 last:border-0">
                      <span>{t(`skills.${s.skill}`)}</span>
                      <span className="font-mono whitespace-nowrap">
                        {formatBand(s.band, locale)}{" "}
                        {gap !== null &&
                          (gap >= 0 ? (
                            <span className="text-strength">{t("overview.atTarget")}</span>
                          ) : (
                            <span className="text-weak" dir="ltr">
                              −{formatBand(-gap, locale)}
                            </span>
                          ))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>

          {/* Reading question types */}
          <Card className="col-span-12 lg:col-span-5">
            <CardLabel title={t("overview.readingTypes")} note={t("overview.allAttempts")} />
            {d.data.readingTypes.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t("overview.noTypes")}</p>
            ) : (
              <div className="mt-3.5 flex flex-col gap-3">
                {d.data.readingTypes.map((r) => (
                  <div key={r.type} className="grid grid-cols-[1fr_70px_74px] items-center gap-3 text-sm sm:grid-cols-[1fr_92px_80px]">
                    <span>{t(`types.${r.type}`)}</span>
                    <Bar value={r.accuracy} label={t(`types.${r.type}`)} />
                    <span className="justify-self-end">
                      <StrengthTag strength={r.strength} label={t(`strength.${r.strength}`)} />
                    </span>
                  </div>
                ))}
              </div>
            )}
            {d.data.focus && (
              <CardHint className="flex items-center justify-between gap-3">
                <span>
                  {t("overview.costs", { type: t(`types.${d.data.focus.type}`), count: d.data.focus.marksLost, n: formatNumber(d.data.focus.marksLost, locale) })}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate(practiceHref(d.data!.focus!.type))}>
                  {t("overview.focus")}
                </Button>
              </CardHint>
            )}
          </Card>

          {/* Do this next */}
          <Card className="col-span-12 sm:col-span-6 lg:col-span-3">
            <CardLabel title={t("overview.next")} />
            <h3 className="mt-3 mb-1 text-lg font-medium tracking-tight">{pick(d.data.next.title)}</h3>
            <p className="text-sm text-muted-foreground">{pick(d.data.next.detail)}</p>
            <Button asChild className="mt-4">
              <Link to={d.data.next.href}>
                {t("common.start")} <ArrowRight className="rtl:rotate-180" />
              </Link>
            </Button>
            <div className="mt-5 border-t border-border pt-4 text-sm">
              <b className="block font-medium">{t("overview.nextMock")}</b>
              {d.data.nextMock ? (
                formatDateTime(d.data.nextMock, locale)
              ) : (
                <Link to="/app/mocks" className="text-primary hover:underline">
                  {t("mocks.schedule")}
                </Link>
              )}
            </div>
          </Card>

          {/* Time per question */}
          <Card className="col-span-12 sm:col-span-6 lg:col-span-4">
            <CardLabel title={t("overview.time")} note={t("overview.vsBudget")} />
            {d.data.pacing.length ? (
              <div className="mt-3.5 flex flex-col gap-3 text-sm">
                {d.data.pacing.map((p) => (
                  <div key={p.key} className="grid grid-cols-[80px_1fr_70px] items-center gap-2.5">
                    <span>{t(`overview.pace.${p.key}`)}</span>
                    <Bar value={p.ratio} tone={p.over ? "weak" : "primary"} label={t(`overview.pace.${p.key}`)} />
                    <span className="text-end font-mono text-muted-foreground">{pick(p.label)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <CardHint>{pick(d.data.pacingNote)}</CardHint>
          </Card>

          {/* Writing feedback */}
          <Card className="col-span-12 lg:col-span-8">
            <CardLabel
              title={t("overview.writing")}
              note={d.data.writing ? t("overview.writingNote", { date: formatDayDate(d.data.writing.date, locale) }) : undefined}
            />
            {d.data.writing ? (
              <>
                <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {d.data.writing.criteria.map((c) => {
                    const min = Math.min(...d.data!.writing!.criteria.map((x) => x.band));
                    return <CriterionTile key={c.key} label={t(`criteria.${c.key}`)} band={c.band} low={c.band === min && min < target - 1} locale={locale} />;
                  })}
                </div>
                <blockquote className="mt-3.5 rounded-e-xl border-s-[3px] border-primary bg-secondary px-3.5 py-3 text-sm">{pick(d.data.writing.summary)}</blockquote>
                <div className="mt-3 flex justify-end">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/app/results/${d.data.writing.attemptId}/writing/a1-w-p2`}>
                      {t("overview.openEssay")} <ArrowRight className="rtl:rotate-180" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t("overview.noWriting")}</p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
