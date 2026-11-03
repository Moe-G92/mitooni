import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { Criterion, Dashboard, Progress, Result, Skill, TestSummary } from "@/api/schemas";
import { useDashboard, useMe, useProgress, useResult, useTests } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDateTime, formatDayDate, formatNumber, formatPercent } from "@/lib/format";
import { practiceHref } from "@/lib/links";
import { cn } from "@/lib/utils";
import { ErrorState, Skeleton } from "@/components/ui/misc";
import { BandLine } from "@/components/charts";
import { CountdownCard } from "@/components/ExamCountdown";
import { formatExamDay, partOfDay } from "@/components/dashboard/format";
import { numClass, pageTitleClass, SKILL_HEX, SKILL_TONE } from "@/components/dashboard/styles";
import "@/components/dashboard/dashboard.css";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
/** Listening and Reading question types are measured against 80% correct. */
const TYPE_TARGET = 0.8;

type Tone = "weak" | "fair" | "strong";
const TONE_TAG: Record<Tone, string> = {
  weak: "bg-weak-soft text-weak",
  fair: "bg-fair-soft text-fair",
  strong: "bg-strength-soft text-strength",
};

/*
 * Overview ("Today") from the mitooni canvas: greeting and countdown, the next
 * drill, a card per skill (each opens that skill's practice room), then
 * question types and the band trend. AppLayout gives this screen the top bar.
 */
export default function Overview() {
  const { t, locale } = useT();
  const me = useMe();
  const d = useDashboard();
  const progress = useProgress();
  const sections = useTests("section");
  // Latest Speaking and Writing feedback come from the newest result that has them.
  const latestFull = progress.data?.history.find((h) => h.kind !== "practice" && h.skills.some((s) => s.skill === "speaking"));
  const latest = useResult(latestFull?.attemptId);

  const target = me.data?.targets.overall ?? 7;
  const firstName = me.data?.name.split(/\s+/)[0] ?? "";

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-[1_1_420px]">
          <p className="text-sm text-muted-foreground">{formatDayDate(new Date(), locale)}</p>
          <h1 className={cn(pageTitleClass, "mt-2 text-[clamp(36px,4.4vw,54px)]")}>{t(`overview.greeting.${partOfDay()}`, { name: firstName })}</h1>
          <p className="mt-3 text-lg leading-7 text-[#3a4855]">
            {d.data?.focus ? t("overview.lead", { band: formatBand(target, locale) }) : t("overview.leadNoData")}
          </p>
        </div>
        {/* The exam type and global controls sit in the top bar on this screen (AppLayout). */}
        {d.data && <ExamBlock days={d.data.daysToTest} testDate={me.data?.testDate ?? null} target={target} />}
      </section>

      {d.isError && <ErrorState message={t("errors.load")} onRetry={() => d.refetch()} />}
      {d.isLoading && (
        <div className="mt-8 flex flex-col gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-72" />
        </div>
      )}
      {d.data && (
        <>
          <UpNext d={d.data} />
          <SkillCards d={d.data} progress={progress.data} latest={latest.data} sections={sections.data} />
          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-stretch gap-3.5">
            <QuestionTypes d={d.data} progress={progress.data} latest={latest.data} targets={me.data?.targets} />
            <TrendCard d={d.data} target={target} />
          </div>
        </>
      )}
    </>
  );
}

/* ---------------- countdown and target ---------------- */

function ExamBlock({ days, testDate, target }: { days: number | null; testDate: string | null; target: number }) {
  const { t, locale } = useT();
  return (
    <div className="flex flex-wrap items-start gap-3">
      {days !== null && days >= 0 && testDate ? (
        <div>
          <CountdownCard
            days={days}
            locale={locale}
            line1={days === 0 ? t("overview.testToday1") : t("overview.countdownDays", { count: days })}
            line2={days === 0 ? t("overview.testToday2") : t("overview.toGo")}
            label={t("overview.countdownLabel", { count: days, n: formatNumber(days, locale) })}
          />
          <div className="mt-2 flex justify-between gap-3 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              <span>
                {t("overview.examDay")} <b className="font-archivo font-bold text-midnight-iris">{formatExamDay(testDate, locale)}</b>
              </span>
            </span>
            <Link to="/app/settings" className="font-semibold text-weak hover:underline">
              {t("overview.change")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-[220px] rounded-[14px] bg-pink-tint px-4 py-3 text-sm">
          <p>{days === null ? t("overview.noDate") : t("overview.examPast")}</p>
          <Link to="/app/settings" className="mt-1 inline-block font-semibold text-weak hover:underline">
            {t("overview.setDate")}
          </Link>
        </div>
      )}
      <div className="dash-goal flex min-w-[120px] flex-col items-center justify-center rounded-[14px] border-2 border-[#4f9a2e] bg-white px-[18px] py-3.5 text-center">
        <div className="text-[13px] font-semibold text-strength">{t("overview.targetBand")}</div>
        <div dir="ltr" className={cn(numClass, "mt-1 text-4xl leading-none font-bold text-primary")}>
          {formatBand(target, locale)}
        </div>
      </div>
    </div>
  );
}

/* ---------------- up next ---------------- */

function UpNext({ d }: { d: Dashboard }) {
  const { t, locale, pick } = useT();
  const focus = d.focus;
  // The focus is always a Reading question type (it comes from the Reading accuracy table); drills take about 10 minutes.
  const eyebrow = focus
    ? `${t("overview.upNext")} · ${t("overview.drillMinutes", { n: formatNumber(10, locale) })} · ${t("skills.reading")}`
    : t("overview.upNext");
  return (
    <section aria-label={t("overview.upNext")} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5 rounded-card bg-primary px-6 py-6 text-white sm:px-8 sm:py-7">
      <div className="min-w-0 flex-[1_1_360px]">
        <p className="text-xs tracking-[0.1em] text-white/85 uppercase">{eyebrow}</p>
        <h2 className="mt-1.5 font-archivo text-[28px] leading-9 font-bold tracking-[-0.015em]">{pick(d.next.title)}</h2>
        <p className="mt-2 text-[15px] text-white/90">
          {pick(d.next.detail)}
          {focus && <>. {t("overview.costsThis", { count: focus.marksLost, n: formatNumber(focus.marksLost, locale) })}</>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <Link to="/app/practice" className="text-sm text-white underline underline-offset-4 hover:text-canary-yellow">
          {t("overview.chooseElse")}
        </Link>
        <Link
          to={d.next.href}
          className="inline-flex items-center gap-2 rounded-xl bg-coral px-5.5 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-weak"
        >
          {focus ? t("overview.startDrill") : t("common.start")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ---------------- one card per skill ---------------- */

function weakestCriterion(list: Criterion[] | undefined) {
  if (!list?.length) return null;
  return [...list].sort((a, b) => a.band - b.band)[0];
}

function SkillCards({ d, progress, latest, sections }: { d: Dashboard; progress?: Progress; latest?: Result; sections?: TestSummary[] }) {
  const { t, locale } = useT();
  const gaps = d.skills.map((s) => (s.band === null ? 0 : s.band - s.target));
  const worst = Math.min(...gaps);
  const biggest = worst < 0 ? d.skills[gaps.indexOf(worst)].skill : null;

  const weakest = (skill: Skill): string | null => {
    if (skill === "listening" || skill === "reading") {
      const type = progress?.types.filter((x) => x.skill === skill && x.total > 0).sort((a, b) => a.correct / a.total - b.correct / b.total)[0];
      return type ? t(`types.${type.type}`) : null;
    }
    const list = skill === "writing" ? (latest?.writing.find((w) => w.task === 2)?.criteria ?? d.writing?.criteria) : latest?.speaking?.criteria;
    const c = weakestCriterion(list);
    return c ? t(`criteria.${c.key}`) : null;
  };

  const minutes = (skill: Skill) => {
    if (skill === "speaking") return t("mocks.speakingLength");
    const test = sections?.find((x) => x.skills[0] === skill);
    return test ? t("overview.minutes", { n: formatNumber(test.minutes, locale) }) : null;
  };

  return (
    <section aria-labelledby="skills-title" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="skills-title" className="font-archivo text-[26px] leading-[34px] font-bold tracking-[-0.015em] text-primary">
          {t("overview.practiseSkill")}
        </h2>
        <Link
          to="/app/mocks"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent"
        >
          {t("overview.startFullMock")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
        {d.skills.map((s) => {
          const tone = SKILL_TONE[s.skill];
          const gap = s.band === null ? null : s.band - s.target;
          const isBiggest = s.skill === biggest;
          const status =
            gap === null
              ? { text: t("overview.noScore"), cls: "text-muted-foreground" }
              : gap >= 0
                ? { text: t("overview.onTarget"), cls: "text-strength" }
                : isBiggest
                  ? { text: t("overview.biggestGap"), cls: "text-weak" }
                  : gap >= -0.5
                    ? { text: t("overview.close"), cls: "text-muted-foreground" }
                    : { text: t("overview.belowTarget"), cls: "text-weak" };
          const area = weakest(s.skill);
          const time = minutes(s.skill);
          return (
            <article
              key={s.skill}
              className={cn("flex flex-col rounded-[18px] bg-card", isBiggest ? "border-2 border-coral p-[19px]" : "border border-border p-5")}
            >
              <div className="flex items-center justify-between">
                <span aria-hidden="true" className={cn("grid size-[34px] place-items-center rounded-[9px] font-bold", tone.soft, tone.ink)}>
                  {tone.letter}
                </span>
                <span className={cn("text-xs font-semibold tracking-[0.08em] uppercase", status.cls)}>{status.text}</span>
              </div>
              <h3 className={cn("mt-[18px] font-archivo text-[22px] font-bold", tone.ink)}>{t(`skills.${s.skill}`)}</h3>
              <div dir="ltr" className={cn(numClass, "mt-1.5 text-[40px] leading-[1.1] font-bold text-foreground", locale === "fa" && "text-end")}>
                {formatBand(s.band, locale)}
                <small className="ms-2 text-[13px] font-normal text-muted-foreground">/ {formatBand(s.target, locale)}</small>
              </div>
              <TargetBar value={(s.band ?? 0) / 9} tick={s.target / 9} color={tone.bar} label={t("overview.bandVsTarget", { skill: t(`skills.${s.skill}`) })} />
              <div className="mt-4 border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">{t("overview.weakestArea")}</div>
                <div className="text-[15px] font-medium">{area ?? t("overview.notYet")}</div>
              </div>
              <Link
                to={`/practice/${s.skill}`}
                className={cn("mt-auto block rounded-[10px] p-[11px] text-center text-sm font-semibold transition-[filter] hover:brightness-95", tone.soft, tone.ink, "mt-4")}
              >
                {t("overview.practiseIn", { skill: t(`skills.${s.skill}`) })}
              </Link>
              {time && <p className="mt-2 text-center text-xs text-muted-foreground">{t("overview.timedSection", { time })}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Thin bar with a Midnight Iris tick at the target. Always drawn left to right, like a scale. */
function TargetBar({ value, tick, color, label, className }: { value: number; tick: number; color: string; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      dir="ltr"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("relative mt-3 h-1.5 rounded-full bg-[#eceef1]", className)}
    >
      <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${pct}%` }} />
      <span
        aria-hidden="true"
        className="absolute -top-[9px] -ms-0.5 h-6 w-1 rounded-sm bg-midnight-iris shadow-[0_0_0_2px_#fff]"
        style={{ left: `${tick * 100}%` }}
      />
    </div>
  );
}

/* ---------------- question types or criteria, by skill ---------------- */

type Row = { key: string; name: string; value: number; shown: string; delta: string | null; tone: Tone };

function QuestionTypes({ d, progress, latest, targets }: { d: Dashboard; progress?: Progress; latest?: Result; targets?: Record<Skill, number> }) {
  const { t, locale } = useT();
  const [skill, setSkill] = useState<Skill>("reading");
  const isBand = skill === "writing" || skill === "speaking";
  const skillTarget = targets?.[skill] ?? 7;

  let rows: Row[] = [];
  let focusHref: string | null = null;
  let note = "";

  if (!isBand) {
    const types = (progress?.types ?? []).filter((x) => x.skill === skill && x.total > 0).sort((a, b) => a.correct / a.total - b.correct / b.total);
    const shown = types.length > 5 ? [...types.slice(0, 3), ...types.slice(-2)] : types;
    rows = shown.map((x) => {
      const acc = x.correct / x.total;
      const diff = Math.round(acc * 100) - TYPE_TARGET * 100;
      return {
        key: x.type,
        name: t(`types.${x.type}`),
        value: acc,
        shown: formatPercent(acc, locale),
        delta: diff >= 0 ? null : `−${formatNumber(-diff, locale)}`,
        tone: x.strength === "weakness" ? "weak" : x.strength === "fair" ? "fair" : "strong",
      };
    });
    if (types[0]) focusHref = practiceHref(types[0].type);
    const tick = t("overview.tickTypes", { n: formatPercent(TYPE_TARGET, locale) });
    note =
      skill === "reading" && d.focus
        ? `${t("overview.costs", { type: t(`types.${d.focus.type}`), count: d.focus.marksLost, n: formatNumber(d.focus.marksLost, locale) })} · ${tick}`
        : tick;
  } else {
    const w2 = latest?.writing.find((w) => w.task === 2);
    const criteria = skill === "writing" ? (w2?.criteria ?? d.writing?.criteria ?? []) : (latest?.speaking?.criteria ?? []);
    rows = [...criteria]
      .sort((a, b) => a.band - b.band)
      .map((c) => {
        const diff = c.band - skillTarget;
        return {
          key: c.key,
          name: t(`criteria.${c.key}`),
          value: c.band / 9,
          shown: formatBand(c.band, locale),
          delta: diff >= 0 ? null : `−${formatBand(-diff, locale)}`,
          tone: diff >= 0 ? "strong" : diff >= -0.5 ? "fair" : "weak",
        };
      });
    if (skill === "writing" && latest && w2) focusHref = `/app/results/${latest.attemptId}/writing/${w2.partId}`;
    else if (skill === "writing" && d.writing) focusHref = `/app/results/${d.writing.attemptId}`;
    if (skill === "speaking" && latest?.speaking) focusHref = `/app/results/${latest.attemptId}/speaking`;
    note = t(skill === "writing" ? "overview.tickWriting" : "overview.tickSpeaking", { band: formatBand(skillTarget, locale) });
  }
  const tickPct = isBand ? skillTarget / 9 : TYPE_TARGET;

  return (
    <section aria-labelledby="qt-title" className="flex min-w-0 flex-col rounded-[18px] border border-border bg-card px-5 py-5.5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="qt-title" className="font-archivo text-lg font-bold text-primary">
          {isBand ? t("overview.criteriaTitle") : t("overview.typesTitle")}
        </h2>
        <div role="tablist" aria-label={t("overview.skillPicker")} className="flex flex-wrap gap-1">
          {SKILLS.map((k) => {
            const on = k === skill;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSkill(k)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                  on ? "border-primary bg-primary font-semibold text-white" : "border-transparent text-[#3a4855] hover:bg-accent",
                )}
              >
                <i aria-hidden="true" className="size-[7px] rounded-full" style={{ background: on ? "#fff" : k === "listening" ? "#011627" : SKILL_HEX[k] }} />
                {t(`skills.${k}`)}
              </button>
            );
          })}
        </div>
      </div>
      <div role="tabpanel" aria-labelledby="qt-title" className="mt-3.5 flex flex-col">
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{t("overview.noSkillData")}</p>
        ) : (
          rows.map((r) => (
            <div
              key={r.key}
              className="grid grid-cols-[minmax(0,1fr)_56px_40px_auto] items-center gap-3 border-b border-[#f0f1f3] py-2.5 text-sm sm:grid-cols-[minmax(0,1.5fr)_minmax(70px,1fr)_48px_78px_82px]"
            >
              <span className="min-w-0">{r.name}</span>
              <TargetBar value={r.value} tick={tickPct} color={skill === "listening" ? "bg-foreground" : SKILL_TONE[skill].bar} label={r.name} className="mt-0" />
              <span dir="ltr" className={cn(numClass, "text-end text-[13px]")}>
                {r.shown}
              </span>
              <span dir="ltr" className={cn(numClass, "hidden text-end text-xs sm:block", r.delta ? "text-weak" : "text-strength")}>
                {r.delta ?? t("overview.onTargetShort")}
              </span>
              <span className="justify-self-end">
                <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs whitespace-nowrap", TONE_TAG[r.tone])}>
                  {r.tone === "weak" ? t("strength.weakness") : r.tone === "fair" ? t("strength.fair") : t("strength.strength")}
                </span>
              </span>
            </div>
          ))
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <p className="text-[13px] text-muted-foreground">{note}</p>
        {focusHref && (
          <Link to={focusHref} className="rounded-[10px] bg-pink-tint px-4 py-[9px] text-sm font-semibold text-weak transition-[filter] hover:brightness-95">
            {t("overview.focus")}
          </Link>
        )}
      </div>
    </section>
  );
}

/* ---------------- band trend ---------------- */

function TrendCard({ d, target }: { d: Dashboard; target: number }) {
  const { t, locale } = useT();
  const points = d.trend.slice(-6);
  const latestId = d.trend.at(-1)?.attemptId;
  return (
    <section aria-labelledby="trend-title" className="flex min-w-0 flex-col rounded-[18px] border border-border bg-card px-5 py-5.5 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="trend-title" className="font-archivo text-lg font-bold text-primary">
          {t("overview.trend")}
        </h2>
        {d.predicted && (
          <span dir="ltr" className="text-[13px] text-muted-foreground">
            {t("overview.predictedRange", { low: formatBand(d.predicted.low, locale), high: formatBand(d.predicted.high, locale) })}
          </span>
        )}
      </div>
      {points.length ? (
        <Link to={`/app/results/${latestId}`} aria-label={t("overview.openLatest")} className="mt-3 block rounded-xl">
          <BandLine
            size="trend"
            points={points}
            target={target}
            locale={locale}
            label={t("overview.trendLabel")}
            targetLabel={t("overview.targetLine", { band: formatBand(target, locale) })}
          />
        </Link>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{t("overview.noTrend")}</p>
      )}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3.5">
        <div>
          <div className="text-[13px] text-muted-foreground">{t("overview.nextMock")}</div>
          {d.nextMock ? (
            <div className="text-base font-semibold">{formatDateTime(d.nextMock, locale)}</div>
          ) : (
            <Link to="/app/mocks" className="text-base font-semibold text-primary hover:underline">
              {t("mocks.schedule")}
            </Link>
          )}
        </div>
        <Link to="/app/results" className="text-sm font-semibold text-weak hover:underline">
          {t("overview.allResults")}
        </Link>
      </div>
    </section>
  );
}
