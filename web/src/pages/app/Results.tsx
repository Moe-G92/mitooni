import { useState } from "react";
import { Link } from "react-router";
import type { ResultSummary, Skill } from "@/api/schemas";
import { useMe, useProgress, useResults } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDate, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Segmented, Skeleton, Tag } from "@/components/ui/misc";
import { BandLine } from "@/components/charts";
import { numClass } from "@/components/dashboard/styles";
import "@/components/dashboard/dashboard.css";

type Filter = "all" | "full" | "section" | "practice";
const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

/* Line colour for each card's chart, from the canvas: the skill colours, with Overall in brand blue and a slightly heavier line. */
const LINE: Record<"overall" | Skill, { color: string; width: number }> = {
  overall: { color: "#3E4FC4", width: 3 },
  listening: { color: "#3E4FC4", width: 2.5 },
  reading: { color: "#E95FC4", width: 2.5 },
  writing: { color: "#D92F3A", width: 2.5 },
  speaking: { color: "#4f9a2e", width: 2.5 },
};

/* One "band progress over time" card. Below target, it glows red (the glow stops for reduced motion). */
function ProgressCard({ name, points, target, line }: { name: string; points: { date: string; band: number }[]; target: number; line: { color: string; width: number } }) {
  const { t, locale } = useT();
  const last = points.at(-1);
  const first = points[0];
  const gap = last ? last.band - target : null;
  const below = gap !== null && gap < 0;
  const change = last && first && points.length > 1 ? last.band - first.band : null;
  return (
    <article className={cn("min-w-0 rounded-[18px] border bg-card px-4 pt-4 pb-3", below ? "dash-below" : "border-border")}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{name}</h3>
        {gap !== null && (
          <span className={cn("text-xs", below ? "text-weak" : "text-strength")}>
            {below ? (
              <>
                <span dir="ltr">−{formatBand(-gap, locale)}</span> {t("results.list.toTarget")}
              </>
            ) : (
              t("overview.atTarget")
            )}
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span dir="ltr" className={cn(numClass, "text-[30px] leading-[1.1] font-bold")}>
          {formatBand(last?.band, locale)}
        </span>
        {change !== null && first && (
          <span className={cn("rounded-full px-2 py-0.5 text-xs", change > 0 ? "bg-strength-soft text-strength" : change < 0 ? "bg-weak-soft text-weak" : "bg-muted text-muted-foreground")}>
            <span dir="ltr">
              {change > 0 ? "+" : change < 0 ? "−" : "±"}
              {formatBand(Math.abs(change), locale)}
            </span>{" "}
            {t("results.list.since", { date: formatShortDate(first.date, locale) })}
          </span>
        )}
      </div>
      {points.length ? (
        <BandLine
          className="mt-1.5"
          color={line.color}
          lineWidth={line.width}
          points={points}
          target={target}
          locale={locale}
          label={t("results.list.chartLabel", { name })}
          targetLabel={t("overview.targetLine", { band: formatBand(target, locale) })}
        />
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">{t("results.list.noScores")}</p>
      )}
    </article>
  );
}

export default function Results() {
  const { t, locale } = useT();
  const results = useResults();
  const progress = useProgress();
  const me = useMe();
  const [filter, setFilter] = useState<Filter>("all");
  const list = (results.data ?? []).filter((r) => filter === "all" || r.kind === filter);
  const targets = me.data?.targets;
  const p = progress.data;
  // The six most recent points keep each small chart readable.
  const cards = p
    ? [
        { key: "overall" as const, name: t("skills.overall"), points: p.trend.slice(-6), target: targets?.overall ?? 7 },
        ...SKILLS.map((s) => ({
          key: s,
          name: t(`skills.${s}`),
          points: (p.bySkill.find((x) => x.skill === s)?.points ?? []).slice(-6),
          target: targets?.[s] ?? 7,
        })),
      ]
    : [];

  return (
    <>
      <PageHeader title={t("results.list.title")} sub={t("results.sub")} />

      {p && p.trend.length > 0 && (
        <section aria-labelledby="progress-title" className="mb-5">
          <h2 id="progress-title" className="mb-3 text-[17px] font-semibold">
            {t("results.list.progressTitle")}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-3">
            {cards.map((c) => (
              <ProgressCard key={c.key} name={c.name} points={c.points} target={c.target} line={LINE[c.key]} />
            ))}
          </div>
        </section>
      )}
      {progress.isLoading && <Skeleton className="mb-5 h-44" />}

      <div className="mb-4">
        <Segmented<Filter>
          label={t("results.filter")}
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: t("results.all") },
            { value: "full", label: t("results.full") },
            { value: "section", label: t("results.section") },
            { value: "practice", label: t("results.practice") },
          ]}
        />
      </div>
      {results.isError && <ErrorState message={t("errors.load")} onRetry={() => results.refetch()} />}
      {results.isLoading && <Skeleton className="h-64" />}
      {results.data && list.length === 0 && (
        <EmptyState
          title={t("results.empty")}
          body={t("results.emptyBody")}
          action={
            <Button asChild>
              <Link to="/app/mocks">{t("nav.mocks")}</Link>
            </Button>
          }
        />
      )}
      {list.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="px-5 py-3 text-start font-medium">
                  {t("results.date")}
                </th>
                <th scope="col" className="px-3 py-3 text-start font-medium">
                  {t("results.test")}
                </th>
                {SKILLS.map((s) => (
                  <th key={s} scope="col" className="px-3 py-3 text-center font-medium">
                    {t(`skills.${s}`)}
                  </th>
                ))}
                <th scope="col" className="px-5 py-3 text-center font-medium">
                  {t("skills.overall")}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((r: ResultSummary) => (
                <tr key={r.attemptId} className="border-b border-border transition-colors last:border-0 hover:bg-accent/50">
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{formatDate(r.completedAt, locale)}</td>
                  <td className="px-3 py-3">
                    <Link to={`/app/results/${r.attemptId}`} className="font-medium hover:text-deep-wisteria-dark hover:underline">
                      {r.testTitle}
                    </Link>
                    {r.mode === "practice" && <Tag className="ms-2 bg-muted text-muted-foreground">{t("results.practiceTag")}</Tag>}
                  </td>
                  {SKILLS.map((s) => (
                    <td key={s} className={cn(numClass, "px-3 py-3 text-center")}>
                      {formatBand(r.skills.find((x) => x.skill === s)?.band, locale)}
                    </td>
                  ))}
                  <td className={cn(numClass, "px-5 py-3 text-center font-medium")}>{formatBand(r.overall, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
