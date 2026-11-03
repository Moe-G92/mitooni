import { useState } from "react";
import { AudioLines, Blocks, BookOpenText, ChevronRight, Lightbulb, Link2, Target, TrendingUp, Waves } from "lucide-react";
import type { Criterion } from "@/api/schemas";
import { useT } from "@/i18n";
import { levelOf, type Lift } from "@/lib/breakdown";
import { formatBand, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/charts";

/*
 * Score breakdown, after the AI-examiner reference Mo sent on 29 Oct 2026,
 * restyled to the mitooni canvas (Coral for the picked criterion):
 * criteria on the start side (band, level and what raising each one is worth),
 * the picked criterion on the end side (level bar, sub-skills with a ring,
 * what it is worth to the skill and overall band, and tips).
 */

const ICONS: Record<Criterion["key"], typeof Waves> = { fc: Waves, p: AudioLines, lr: BookOpenText, gra: Blocks, tr: Target, cc: Link2 };

export function ScoreBreakdown({
  criteria,
  criterionLabel,
  skillLabel,
  lift,
  exampleTone = "coral",
}: {
  criteria: Criterion[];
  criterionLabel: (key: Criterion["key"]) => string;
  /** "Speaking" or "Writing task 2", for the lift rows. */
  skillLabel: string;
  lift: (key: Criterion["key"]) => Lift;
  /** Colour of the "From your answer" quote: brand blue on Writing, Coral on Speaking (canvas). */
  exampleTone?: "blue" | "coral";
}) {
  const { t, locale } = useT();
  const lifts = Object.fromEntries(criteria.map((c) => [c.key, lift(c.key)])) as Record<Criterion["key"], Lift>;
  const gain = (k: Criterion["key"]) => {
    const l = lifts[k];
    return { overall: l.overallTo !== null && l.overallFrom !== null ? l.overallTo - l.overallFrom : 0, skill: l.skillTo - l.skillFrom };
  };
  // Biggest win: most overall band, then most skill band, then the lowest criterion.
  const ranked = [...criteria].filter((c) => c.band < 9).sort((a, b) => gain(b.key).overall - gain(a.key).overall || gain(b.key).skill - gain(a.key).skill || a.band - b.band);
  const best = ranked[0]?.key;
  const [active, setActive] = useState<Criterion["key"]>(best ?? criteria[0].key);
  const c = criteria.find((x) => x.key === active) ?? criteria[0];

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = criteria[(i + d + criteria.length) % criteria.length];
    setActive(next.key);
    document.getElementById(`crit-tab-${next.key}`)?.focus();
  };

  return (
    <Card className="col-span-12 p-0">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        {/* Criteria menu */}
        <div className="border-b border-border p-4 lg:border-e lg:border-b-0">
          <h2 className="px-1 text-[15px] font-medium">{t("breakdown.title")}</h2>
          <p className="mt-1 px-1 text-xs text-muted-foreground">{t("breakdown.sub")}</p>
          <div role="tablist" aria-orientation="vertical" aria-label={t("breakdown.title")} className="mt-3 flex flex-col gap-2">
            {criteria.map((x, i) => {
              const Icon = ICONS[x.key];
              const on = x.key === active;
              const g = gain(x.key);
              return (
                <button
                  key={x.key}
                  id={`crit-tab-${x.key}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="crit-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => {
                    setActive(x.key);
                    // Single column: bring the detail into view (instant, like the rest of the app).
                    if (window.matchMedia("(max-width: 1023px)").matches) document.getElementById("crit-panel")?.scrollIntoView({ block: "start" });
                  }}
                  onKeyDown={(e) => onKey(e, i)}
                  className={cn(
                    "grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border px-3 py-2.5 text-start transition-colors",
                    on ? "border-transparent bg-coral text-white shadow-sm" : "border-border bg-card hover:bg-accent",
                  )}
                >
                  <Icon className={cn("size-6", on ? "text-white" : "text-muted-foreground")} strokeWidth={1.6} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{criterionLabel(x.key)}</span>
                    <span className={cn("block text-xs", on ? "text-white" : "text-muted-foreground")}>{t(`breakdown.levels.${levelOf(x.band)}`)}</span>
                    {g.overall > 0 || g.skill > 0 ? (
                      <span
                        className={cn(
                          "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-[1.4] font-medium",
                          on ? "bg-white text-coral" : "bg-strength-soft text-strength",
                        )}
                      >
                        <TrendingUp className="size-3" aria-hidden="true" />
                        {g.overall > 0
                          ? t("breakdown.gainOverall", { n: formatBand(g.overall, locale) })
                          : t("breakdown.gainSkill", { n: formatBand(g.skill, locale), skill: skillLabel })}
                      </span>
                    ) : null}
                    {x.key === best && (
                      <span className={cn("mt-0.5 block text-[11px] font-medium whitespace-nowrap", on ? "text-white" : "text-coral")}>{t("breakdown.biggest")}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <b className={cn("font-archivo text-lg font-normal tabular-nums", !on && "text-foreground")}>{formatBand(x.band, locale)}</b>
                    {on && <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Picked criterion */}
        <div id="crit-panel" role="tabpanel" aria-labelledby={`crit-tab-${c.key}`} className="min-w-0 p-5 lg:p-6">
          <CriterionDetail c={c} label={criterionLabel(c.key)} lift={lifts[c.key]} skillLabel={skillLabel} exampleTone={exampleTone} />
        </div>
      </div>
    </Card>
  );
}

function CriterionDetail({
  c,
  label,
  lift,
  skillLabel,
  exampleTone,
}: {
  c: Criterion;
  label: string;
  lift: Lift;
  skillLabel: string;
  exampleTone: "blue" | "coral";
}) {
  const { t, locale, pick } = useT();
  const metrics = c.metrics ?? [];
  const [mi, setMi] = useState(0);
  const m = metrics[Math.min(mi, metrics.length - 1)];
  const pct = (c.band / 9) * 100;

  return (
    <div key={c.key}>
      {/* Level and comment */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-[14px] bg-muted px-4 py-3.5">
          <div className="text-center text-xs text-muted-foreground">{t("breakdown.yourLevel")}</div>
          <div className="text-center font-medium">{t(`breakdown.levels.${levelOf(c.band)}`)}</div>
          <div dir="ltr" className="relative mt-4 mb-1 h-3 rounded-full bg-gradient-to-r from-[#FFC4EC] to-coral" aria-hidden="true">
            <span
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral px-2.5 py-0.5 font-archivo tabular-nums text-[13px] text-white shadow ring-2 ring-card"
              style={{ left: `clamp(22px, ${pct}%, calc(100% - 22px))` }}
            >
              {formatBand(c.band, locale)}
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-medium tracking-tight">{label}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{pick(c.comment)}</p>
        </div>
      </div>

      {/* Sub-skills */}
      {metrics.length > 0 && m ? (
        <div className="mt-5 rounded-[14px] border border-border">
          <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-2">
            {metrics.map((x, i) => (
              <button
                key={x.key}
                type="button"
                role="tab"
                aria-selected={i === mi}
                onClick={() => setMi(i)}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm",
                  i === mi ? "border-coral font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {pick(x.label)}
                <span className="rounded-full border border-border px-1.5 py-px text-[10px] text-muted-foreground">{t(`breakdown.verdict.${x.verdict}`)}</span>
              </button>
            ))}
          </div>
          <div role="tabpanel" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
            <ScoreRing value={m.score} label={t(`breakdown.verdict.${m.verdict}`)} locale={locale} />
            <div className="min-w-0">
              <h4 className="font-medium">{pick(m.label)}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{pick(m.note)}</p>
              {m.example && (
                <figure className="mt-2.5">
                  <figcaption className="text-xs text-muted-foreground">{t("breakdown.example")}</figcaption>
                  <blockquote lang="en" dir="ltr" className={cn(
                      "mt-1 rounded-e-lg border-s-[3px] px-3 py-2 text-start text-sm italic",
                      exampleTone === "blue" ? "border-primary bg-[#E6EBFF]" : "border-coral bg-weak-soft",
                    )}>
                    “{m.example}”
                  </blockquote>
                </figure>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-xs text-faint">{t("breakdown.noMetrics")}</p>
      )}

      {/* What it is worth */}
      <div className="mt-5 rounded-[14px] bg-pink-tint px-4 py-3.5">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="size-4" aria-hidden="true" /> {t("breakdown.worth")}
        </h4>
        {c.band >= 9 ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{t("breakdown.maxed")}</p>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("breakdown.worthBody", { criterion: label, from: formatBand(c.band, locale), to: formatBand(Math.min(9, c.band + 1), locale) })}
            </p>
            <dl className="mt-2.5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <LiftRow label={skillLabel} from={lift.skillFrom} to={lift.skillTo} />
              {lift.overallFrom !== null && lift.overallTo !== null && <LiftRow label={t("breakdown.overall")} from={lift.overallFrom} to={lift.overallTo} />}
            </dl>
          </>
        )}
      </div>

      {/* Tips */}
      {c.tips && c.tips.length > 0 && (
        <div className="mt-5">
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <span className="grid size-6 place-items-center rounded-full bg-[#FFC4EC] text-foreground">
              <Lightbulb className="size-3.5" aria-hidden="true" />
            </span>
            {t("breakdown.tips")}
          </h4>
          <ol className="mt-2 flex flex-col gap-2 text-sm">
            {c.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 rounded-xl border border-border px-3.5 py-2.5">
                <span className="font-archivo tabular-nums text-xs text-muted-foreground">{formatNumber(i + 1, locale)}</span>
                <span>{pick(tip)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function LiftRow({ label, from, to }: { label: string; from: number; to: number }) {
  const { t, locale } = useT();
  const up = to > from;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2">
      <dt>{label}</dt>
      <dd className="font-archivo tabular-nums" dir="ltr">
        {formatBand(from, locale)} → <b className={cn("font-normal", up ? "text-strength" : "text-muted-foreground")}>{formatBand(to, locale)}</b>
        {!up && <span className="ms-2 font-sans text-xs text-muted-foreground">{t("breakdown.noChange")}</span>}
      </dd>
    </div>
  );
}

/** Tabs across the top: one per part or task, each with its band (the reference's Part 1, Part 2, Part 3). */
export function SectionTabs<K extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { key: K; title: string; sub?: string; band: number | null }[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  const { locale } = useT();
  return (
    <div role="tablist" aria-label={label} className="col-span-12 flex gap-2 overflow-x-auto rounded-card border border-border bg-card p-1.5">
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.key)}
            className={cn(
              "flex min-w-[150px] flex-1 items-center justify-between gap-3 rounded-[14px] border-b-2 px-4 py-2.5 text-start transition-colors",
              on ? "border-coral bg-weak-soft/60" : "border-transparent hover:bg-accent",
            )}
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-medium">{it.title}</span>
              {it.sub && <span className="block truncate text-xs text-muted-foreground">{it.sub}</span>}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 font-archivo tabular-nums text-sm",
                on ? "bg-coral text-white" : "border border-coral/60 text-coral",
              )}
            >
              {formatBand(it.band, locale)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
