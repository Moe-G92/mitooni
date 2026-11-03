import type { ReactNode } from "react";
import { Link } from "react-router";
import { Trans } from "react-i18next";
import type { ItemResult, Result, Skill } from "@/api/schemas";
import { useT } from "@/i18n";
import { formatBand, formatNumber } from "@/lib/format";
import { numbersLabel, cn } from "@/lib/utils";
import { practiceHref } from "@/lib/links";
import { Card } from "@/components/ui/card";
import { Bar, StrengthTag } from "@/components/ui/misc";
import { isRight, strengthOf, typeRows, type NumberStatus } from "./review-data";
import { SKILL_TONE } from "./tones";

/* Building blocks shared by the Listening and Reading parts of the result page. */

/** Coloured rule under each skill's heading: "Listening result 7.0 · 30 of 40 correct". */
export function SkillHeader({ skill, band, meta }: { skill: Skill; band: number; meta: ReactNode }) {
  const { t, locale } = useT();
  const tone = SKILL_TONE[skill];
  return (
    <div id={`sk-${skill}`} className={cn("col-span-12 mt-[18px] flex scroll-mt-5 flex-wrap items-center gap-3 border-b-2 pb-2", tone.border)}>
      <h2 className={cn("font-archivo text-[22px] font-bold", tone.text)}>{t("results.report.skillResult", { skill: t(`skills.${skill}`) })}</h2>
      <span className={cn("rounded-full px-3 py-0.5 font-archivo text-sm text-white tabular-nums", tone.solid)}>{formatBand(band, locale)}</span>
      <span className="text-[13px] text-muted-foreground">{meta}</span>
    </div>
  );
}

/** "Listening by question type": every row of one skill, weakest first, in two columns on wide screens. */
export function TypeTable({ result, skill }: { result: Result; skill: Skill }) {
  const { t, locale } = useT();
  const rows = typeRows(result, skill);
  if (!rows.length) return null;
  return (
    <Card className="col-span-12 py-[18px] sm:px-[22px]">
      <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
        <h3 className="text-[15px] font-medium text-foreground">{t("results.report.byType", { skill: t(`skills.${skill}`) })}</h3>
        <span>{t("results.report.weakestFirst")}</span>
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-x-8 gap-y-2.5">
        {rows.map((x) => {
          const acc = x.correct / x.total;
          const s = strengthOf(acc);
          return (
            <div key={x.type} className="grid grid-cols-[minmax(0,1fr)_44px_auto] items-center gap-3 text-sm leading-normal sm:grid-cols-[minmax(0,1fr)_80px_44px_124px]">
              <span className="min-w-0 truncate">{t(`types.${x.type}`)}</span>
              <Bar value={acc} label={t(`types.${x.type}`)} className="hidden sm:block" />
              <span className="text-end font-archivo text-muted-foreground tabular-nums" dir="ltr">
                {formatNumber(x.correct, locale)}/{formatNumber(x.total, locale)}
              </span>
              <span className="flex items-center gap-2">
                <StrengthTag strength={s} label={t(`strength.${s}`)} />
                {acc < 0.78 && (
                  <Link to={practiceHref(x.type)} className="text-xs text-foreground underline hover:text-primary">
                    {t("results.drill")}
                  </Link>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Numbers 1 to 40, green when right and red when wrong; clicking one jumps to where its answer is. */
export function JumpStrip({ statuses, label, onJump }: { statuses: NumberStatus[]; label: string; onJump: (n: number) => void }) {
  const { t, locale } = useT();
  return (
    <div className="mt-3.5">
      <div className="mb-1.5 text-xs text-muted-foreground">{label}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-1.5">
        {statuses.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => onJump(s.n)}
            aria-label={t(s.right ? "results.report.questionRight" : "results.report.questionWrong", { n: formatNumber(s.n, locale) })}
            className={cn(
              "grid h-[30px] place-items-center rounded-md border font-archivo text-xs font-bold tabular-nums transition-colors hover:brightness-95",
              s.right ? "border-strength bg-strength-soft text-strength" : "border-weak bg-weak-soft text-weak",
            )}
          >
            {formatNumber(s.n, locale)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Swatch({ right }: { right: boolean }) {
  return (
    <i
      aria-hidden="true"
      className={cn(
        "inline-block size-3.5 rounded-[3px]",
        right ? "bg-strength-soft shadow-[inset_0_-2px_0_var(--strength)]" : "bg-weak-soft shadow-[inset_0_-2px_0_var(--weak)]",
      )}
    />
  );
}

export function Legend({ rightLabel, wrongShows }: { rightLabel: string; wrongShows?: boolean }) {
  const { t } = useT();
  return (
    <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Swatch right />
        {rightLabel}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Swatch right={false} />
        {t("results.report.legendMissed")}
      </span>
      {wrongShows && (
        <span>
          <Trans
            i18nKey="results.report.legendWrongShows"
            components={{
              s: <s className="text-weak" />,
              b: <b className="text-strength" />,
            }}
          />
        </span>
      )}
    </div>
  );
}

/** Small "Q12" badge. Badges live inside English exam text, so the label stays English. */
export function QBadge({ item, id, onClick }: { item: ItemResult; id?: string; onClick?: () => void }) {
  const { t } = useT();
  const cls = "me-1 inline-block rounded bg-primary px-[5px] align-[2px] font-archivo text-[11px] leading-[17px] font-bold text-white tabular-nums not-italic";
  const label = `Q${numbersLabel(item.numbers)}`;
  if (onClick)
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(cls, "hover:bg-deep-wisteria-dark")}
        aria-label={t("results.report.showEvidence", {
          n: numbersLabel(item.numbers),
        })}
      >
        {label}
      </button>
    );
  return (
    <b id={id} className={cls}>
      {label}
    </b>
  );
}

/** Highlighted source words with the question badges in front. */
export function EvidenceMark({ items, right, prefix, children }: { items: ItemResult[]; right: boolean; prefix: string; children: ReactNode }) {
  return (
    <mark
      tabIndex={-1}
      className={cn(
        "rounded px-[3px] py-px text-black outline-none [box-decoration-break:clone]",
        right ? "bg-strength-soft shadow-[inset_0_-2px_0_var(--strength)]" : "bg-weak-soft shadow-[inset_0_-2px_0_var(--weak)]",
      )}
    >
      {items.map((it) => (
        <span key={it.itemId}>
          {/* Extra anchors so "Choose TWO" items can be reached from either number. */}
          {it.numbers.slice(1).map((n) => (
            <span key={n} id={`${prefix}-q${n}`} />
          ))}
          <QBadge item={it} id={`${prefix}-q${it.numbers[0]}`} />
        </span>
      ))}
      {children}
    </mark>
  );
}

const shown = (v: string[], blank: string) => (v.length ? v.join(", ") : blank);

/** Listening chip after a highlight: "✓ Tilbrook" or "✗ you: A · answer: B". */
export function HeardChip({ item }: { item: ItemResult }) {
  const { t, locale } = useT();
  const right = isRight(item);
  return (
    <span
      lang={right ? "en" : locale}
      dir={right || locale !== "fa" ? "ltr" : "rtl"}
      className={cn(
        "ms-1 inline-block rounded-full px-2 align-[1px] text-xs leading-5 font-bold",
        right ? "bg-strength-soft text-strength" : "bg-weak-soft text-weak",
      )}
    >
      {right ? (
        <>
          <span aria-hidden="true">✓ </span>
          <bdi>{shown(item.given, "")}</bdi>
        </>
      ) : (
        <>
          <span aria-hidden="true">✗ </span>
          {t("results.report.you")}: <bdi>{shown(item.given, t("results.report.blank"))}</bdi> · {t("results.report.answer")}:{" "}
          <bdi className="text-strength">{item.correct.join(", ")}</bdi>
        </>
      )}
    </span>
  );
}

/** Reading answer chip in exam style: "✓ TRUE", or the learner's answer struck through, then the correct one. */
export function AnswerChip({ item }: { item: ItemResult }) {
  const { t, locale } = useT();
  const right = isRight(item);
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-1.5 rounded border px-2 align-baseline leading-6",
        right ? "border-strength bg-strength-soft text-strength" : "border-weak bg-weak-soft",
      )}
    >
      {right ? (
        <b>
          <span aria-hidden="true">✓ </span>
          {shown(item.given, "")}
        </b>
      ) : (
        <>
          {item.given.length ? (
            <s className="text-weak">
              <span className="sr-only">{t("results.yours")}: </span>
              {item.given.join(", ")}
            </s>
          ) : (
            <bdi className="text-weak" lang={locale}>
              {t("results.report.blank")}
            </bdi>
          )}
          <b className="text-strength">
            <span className="sr-only">{t("results.correct")}: </span>
            {item.correct.join(", ")}
          </b>
        </>
      )}
    </span>
  );
}
