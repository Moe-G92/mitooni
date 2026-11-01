import { Link } from "react-router";
import { ArrowRight, GraduationCap } from "lucide-react";
import type { Profile, Result } from "@/api/schemas";
import { useT } from "@/i18n";
import { formatBand, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { practiceHref } from "@/lib/links";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SKILL_TONE } from "./tones";

/* Top of the result page: overall band, four skill tiles, then "Do this next" beside coaching. */

export function SummaryCard({ result, skills, targets }: { result: Result; skills: Result["skills"]; targets?: Profile["targets"] }) {
  const { t, locale } = useT();
  const headline = result.overall ?? (skills.length === 1 ? skills[0].band : null);
  const target = result.overall !== null ? targets?.overall : skills.length === 1 ? targets?.[skills[0].skill] : undefined;
  const gap = headline !== null && target !== undefined ? target - headline : null;
  const hasDummy = result.writing.length > 0 || !!result.speaking;
  return (
    <Card className="col-span-12 py-[18px] sm:px-[22px]">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex-none">
          <h2 className="text-[13px] font-medium text-muted-foreground">
            {result.overall !== null ? t("results.report.overall") : t(`skills.${skills[0]?.skill ?? "reading"}`)}
          </h2>
          <div className="flex items-baseline gap-2.5">
            <span className="font-archivo text-5xl leading-none font-bold tracking-[-0.025em] tabular-nums">{formatBand(headline, locale)}</span>
            {headline !== null && <span className="text-sm text-muted-foreground">{t(`bands.${Math.floor(headline)}`)}</span>}
          </div>
          {gap !== null && target !== undefined && (
            <div className={cn("mt-1 text-[13px] font-semibold", gap > 0 ? "text-weak" : "text-strength")}>
              {gap > 0
                ? t("results.report.belowTarget", {
                    gap: formatBand(gap, locale),
                    target: formatBand(target, locale),
                  })
                : t("results.report.atTarget", {
                    target: formatBand(target, locale),
                  })}
            </div>
          )}
        </div>
        <div className="grid min-w-0 flex-[1_1_520px] grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-2.5">
          {skills.map((s) => {
            const tone = SKILL_TONE[s.skill];
            const below = targets ? targets[s.skill] - s.band : 0;
            return (
              <div key={s.skill} className={cn("min-w-0 rounded-[14px] border-s-4 px-3.5 py-3", tone.bg, tone.border)}>
                <div className="flex flex-wrap justify-between gap-x-2 text-xs">
                  <b className={tone.text}>{t(`skills.${s.skill}`)}</b>
                  {targets && (
                    <span className={cn("font-semibold", below > 0 ? "text-weak" : "text-strength")}>
                      {below > 0
                        ? t("results.report.below", {
                            gap: formatBand(below, locale),
                          })
                        : t("results.report.reached")}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <b className="font-archivo text-[26px] leading-[34px] font-bold tabular-nums">{formatBand(s.band, locale)}</b>
                  {s.raw !== null && (
                    <span dir="ltr" className="font-archivo text-xs text-muted-foreground tabular-nums">
                      {formatNumber(s.raw, locale)}/{formatNumber(s.total ?? 40, locale)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("results.report.timeUsed", {
                    used: formatNumber(Math.round(s.usedSec / 60), locale),
                    allowed: formatNumber(Math.round(s.allowedSec / 60), locale),
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {hasDummy && <p className="mt-3 text-xs text-faint">{t("results.report.dummy")}</p>}
    </Card>
  );
}

export function NextAndCoaching({ result }: { result: Result }) {
  const { t, pick } = useT();
  return (
    <div className="col-span-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
      <div className="rounded-[14px] bg-canary-yellow px-4 py-3.5 text-midnight-iris">
        <div className="text-xs font-semibold">{t("results.report.doNext")}</div>
        <div className="mt-1 font-medium">{pick(result.next.title)}</div>
        <p className="mt-1 text-sm text-[#3a4855]">{pick(result.next.detail)}</p>
        <Button asChild size="sm" className="mt-3">
          <Link to={result.next.questionType ? practiceHref(result.next.questionType) : "/app/practice"}>
            {t("common.start")} <ArrowRight className="rtl:rotate-180" />
          </Link>
        </Button>
      </div>
      <div className="rounded-[14px] bg-primary p-4 text-white">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <GraduationCap className="size-4" aria-hidden="true" />
          {t("results.report.coachingKicker")}
        </div>
        <div className="mt-1.5 text-base leading-[22px] font-semibold">{t("results.report.coachingTitle")}</div>
        <p className="mt-1.5 text-sm leading-5 text-white/85">{t("results.report.coachingBody")}</p>
        <Link
          to="/coaching"
          className="mt-3 inline-flex h-[34px] items-center gap-2 rounded-full bg-coral px-3.5 text-[13px] font-semibold text-white hover:bg-[#c22833] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t("results.report.coachingCta")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
