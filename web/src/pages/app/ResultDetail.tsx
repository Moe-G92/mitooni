import type { MouseEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Mic, PenLine } from "lucide-react";
import type { Result, Skill } from "@/api/schemas";
import { useMe, useResult, useTest } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/misc";
import { NextAndCoaching, SummaryCard } from "@/components/results/ResultSummary";
import { ListeningReview } from "@/components/results/ListeningReview";
import { ReadingReview } from "@/components/results/ReadingReview";
import { SkillHeader, TypeTable } from "@/components/results/shared";
import { SKILL_TONE, revealElement } from "@/components/results/tones";

const ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

/*
 * One finished test: a compact summary, what to do next, then a full report
 * skill by skill (question types, the Listening transcript and the Reading
 * passages with every answer located, and links to Writing and Speaking feedback).
 */
export default function ResultDetail() {
  const { attemptId } = useParams();
  const [params] = useSearchParams();
  const { t, locale, pick } = useT();
  const r = useResult(attemptId);
  const test = useTest(r.data?.testId);
  const me = useMe();
  const fresh = params.get("fresh") === "1";

  if (r.isError) return <ErrorState message={t("errors.load")} onRetry={() => r.refetch()} />;
  if (!r.data) return <Skeleton className="h-96" />;
  const res = r.data;
  const skills = ORDER.map((s) => res.skills.find((x) => x.skill === s)).filter(Boolean) as Result["skills"];
  const score = (s: Skill) => skills.find((x) => x.skill === s);
  const sectionFor = (s: Skill) => test.data?.sections.find((x) => x.skill === s);
  const minutes = (sec: number) =>
    t("results.report.minutes", {
      n: formatNumber(Math.round(sec / 60), locale),
    });

  const jumpToSkill = (e: MouseEvent<HTMLAnchorElement>, s: Skill) => {
    e.preventDefault();
    revealElement(`sk-${s}`);
  };

  const marked = (["listening", "reading"] as const).filter((s) => score(s));

  return (
    <>
      <PageHeader
        title={t("results.report.pageTitle", { test: res.testTitle })}
        sub={
          <>
            {formatDate(res.completedAt, locale)}
            {res.mode === "practice" && ` · ${t("results.practiceTag")}`}
            {res.accommodation !== 1 && ` · ${t("results.extraTime", { x: formatNumber(res.accommodation, locale) })}`}
          </>
        }
      />
      {fresh && (
        <div role="status" className="mb-4 rounded-card border border-strength/30 bg-strength-soft px-5 py-3 text-sm text-strength">
          {t("results.justFinished")}
        </div>
      )}
      <div className="grid grid-cols-12 gap-4">
        <SummaryCard result={res} skills={skills} targets={me.data?.targets} />
        <NextAndCoaching result={res} />

        {/* Skill by skill */}
        <div className="col-span-12 mt-16 flex flex-wrap items-end justify-between gap-4 border-t border-[#d6dae3] pt-9">
          <div>
            <div className="text-xs font-bold tracking-[0.12em] text-weak uppercase">{t("results.report.kicker")}</div>
            <h2 className="mt-1.5 font-archivo text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] text-midnight-iris sm:text-[34px]">
              {t("results.report.title")}
            </h2>
            <p className="mt-1.5 text-base text-muted-foreground">{t("results.report.sub")}</p>
          </div>
          <nav aria-label={t("results.report.jumpToSkill")} className="flex flex-wrap gap-2">
            {skills.map((s) => {
              const tone = SKILL_TONE[s.skill];
              return (
                <a
                  key={s.skill}
                  href={`#sk-${s.skill}`}
                  onClick={(e) => jumpToSkill(e, s.skill)}
                  className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold hover:brightness-95", tone.bg, tone.text)}
                >
                  {t(`skills.${s.skill}`)} {formatBand(s.band, locale)}
                </a>
              );
            })}
          </nav>
        </div>

        {marked.map((s) => {
          const sc = score(s)!;
          const section = sectionFor(s);
          const items = res.items.filter((i) => i.skill === s);
          return [
            <SkillHeader
              key={`${s}-h`}
              skill={s}
              band={sc.band}
              meta={
                <>
                  {t("results.report.correctOf", {
                    n: formatNumber(sc.raw ?? 0, locale),
                    total: formatNumber(sc.total ?? 40, locale),
                  })}{" "}
                  · {minutes(sc.usedSec)}
                </>
              }
            />,
            <TypeTable key={`${s}-t`} result={res} skill={s} />,
            section ? (
              s === "listening" ? (
                <ListeningReview key={`${s}-r`} section={section} items={items} score={sc} />
              ) : (
                <ReadingReview key={`${s}-r`} section={section} items={items} score={sc} />
              )
            ) : test.isError ? null : (
              <Skeleton key={`${s}-r`} className="col-span-12 h-64" aria-label={t("results.report.loadingContent")} />
            ),
          ];
        })}

        {res.writing.length > 0 && score("writing") && (
          <>
            <SkillHeader
              skill="writing"
              band={score("writing")!.band}
              meta={t("results.report.writingMeta", {
                n: formatNumber(Math.round(score("writing")!.usedSec / 60), locale),
              })}
            />
            {res.writing.map((w) => (
              <Card key={w.partId} className="col-span-12 sm:col-span-6 sm:px-6">
                <CardLabel
                  title={t("results.writingTask", {
                    n: formatNumber(w.task, locale),
                  })}
                  note={t("results.words", {
                    n: formatNumber(w.words, locale),
                  })}
                />
                <div className="mt-3 flex items-end gap-4">
                  <PenLine className="size-5" aria-hidden="true" />
                  <span className="font-archivo text-3xl font-bold tabular-nums">{formatBand(w.band, locale)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pick(w.summary)}</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to={`/app/results/${res.attemptId}/writing/${w.partId}`}>{t("results.openFeedback")}</Link>
                </Button>
              </Card>
            ))}
          </>
        )}

        {res.speaking && score("speaking") && (
          <>
            <SkillHeader
              skill="speaking"
              band={score("speaking")!.band}
              meta={t("results.report.speakingMeta", {
                parts: formatNumber(res.speaking.parts.length, locale),
                n: formatNumber(Math.round(score("speaking")!.usedSec / 60), locale),
              })}
            />
            <Card className="col-span-12 sm:px-6">
              <CardLabel title={t("skills.speaking")} />
              <div className="mt-3 flex items-end gap-4">
                <Mic className="size-5" aria-hidden="true" />
                <span className="font-archivo text-3xl font-bold tabular-nums">{formatBand(res.speaking.band, locale)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{pick(res.speaking.summary)}</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to={`/app/results/${res.attemptId}/speaking`}>{t("results.openFeedback")}</Link>
              </Button>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
