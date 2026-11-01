import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronDown } from "lucide-react";
import type { ItemResult, Section, SkillScore } from "@/api/schemas";
import { useT } from "@/i18n";
import { formatBand, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { assignEvidence, listeningPartTitle, numberStatuses, partStats, splitByEvidence } from "./review-data";
import { EvidenceMark, HeardChip, JumpStrip, Legend } from "./shared";
import { revealElement } from "./tones";

/*
 * The full Listening transcript, Parts 1 to 4. Each answer's source words are
 * highlighted with a Q badge: green when right, red with "you: X · answer: Y"
 * when wrong. Parts collapse; the number strip opens the part and jumps there.
 */

function Line({ speaker, text, items }: { speaker: string; text: string; items: ItemResult[] }) {
  const narrator = speaker.toLowerCase() === "narrator";
  const spans = splitByEvidence(text, items);
  return (
    <p className="mb-2.5 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2.5">
      <b className="shrink-0 text-[13px] tracking-[0.04em] text-[#535353] sm:min-w-[108px]">{speaker.toUpperCase()}</b>
      <span className={cn("min-w-0 break-words", narrator && "text-[#535353] italic")}>
        {spans.map((s, i) =>
          s.mark ? (
            <span key={i}>
              <EvidenceMark items={s.mark.items} right={s.mark.right} prefix="l">
                {s.text}
              </EvidenceMark>
              {s.mark.items.map((it) => (
                <HeardChip key={it.itemId} item={it} />
              ))}
            </span>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </span>
    </p>
  );
}

export function ListeningReview({ section, items, score }: { section: Section; items: ItemResult[]; score: SkillScore }) {
  const { t, locale } = useT();
  const stats = useMemo(() => partStats(section, items), [section, items]);
  const statuses = useMemo(() => numberStatuses(items), [items]);
  const [closed, setClosed] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const jump = (n: number) => {
    const part = stats.find((p) => p.items.some((i) => i.numbers.includes(n)));
    if (!part) return;
    if (closed.has(part.part.id))
      flushSync(() =>
        setClosed((prev) => {
          const next = new Set(prev);
          next.delete(part.part.id);
          return next;
        }),
      );
    if (!revealElement(`l-q${n}`)) revealElement(`l-part-${part.part.id}`);
  };

  return (
    <Card className="col-span-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-medium">{t("results.report.transcriptTitle")}</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t("results.report.transcriptSub")}</p>
        </div>
        <span className="rounded-full bg-[#E6EBFF] px-3 py-1 text-[13px] font-semibold text-primary">
          {t("results.report.scorePill", {
            raw: formatNumber(score.raw ?? 0, locale),
            total: formatNumber(score.total ?? 40, locale),
            band: formatBand(score.band, locale),
          })}
        </span>
      </div>
      <JumpStrip statuses={statuses} label={t("results.report.jumpToQuestion")} onJump={jump} />
      <Legend rightLabel={t("results.report.legendHeard")} />

      {stats.map(({ part, items: own, first, last, correct, total }) => {
        const lines = part.audio?.transcript ?? [];
        const assigned = assignEvidence(
          lines.map((l) => l.text),
          own,
        );
        const open = !closed.has(part.id);
        const title = listeningPartTitle(part);
        return (
          <div key={part.id} id={`l-part-${part.id}`} className="mt-3.5 scroll-mt-5 overflow-hidden rounded-md border border-[#d5d5d5]">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`l-body-${part.id}`}
              onClick={() => toggle(part.id)}
              className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 bg-pale-wisteria px-4 py-2.5 text-start hover:bg-[#E6EBFF]"
            >
              <b>
                {t("results.report.part", {
                  n: formatNumber(part.number, locale),
                })}
              </b>
              {title && (
                <span className="min-w-0 text-sm" lang="en" dir="ltr">
                  {title}
                </span>
              )}
              <span className="ms-auto flex items-center gap-2 text-[13px] text-[#535353]">
                {t("results.report.questions", {
                  from: formatNumber(first, locale),
                  to: formatNumber(last, locale),
                })}{" "}
                ·{" "}
                {t("results.report.partScore", {
                  correct: formatNumber(correct, locale),
                  total: formatNumber(total, locale),
                })}
                <ChevronDown aria-hidden="true" className={cn("size-4 motion-safe:transition-transform", open && "rotate-180")} />
              </span>
            </button>
            {open && (
              <div
                id={`l-body-${part.id}`}
                lang="en"
                dir="ltr"
                className="px-4 py-4 [font-family:Arial,Helvetica,sans-serif] text-base leading-[1.75] text-black sm:px-[18px]"
              >
                {lines.map((l, i) => (
                  <Line key={i} speaker={l.speaker} text={l.text} items={assigned[i]} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
