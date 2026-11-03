import { useEffect, useState, type DragEvent } from "react";
import { useT } from "@/i18n";
import { formatClock, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckIcon, ClockIcon, CrossIcon, HintIcon, PracticePill, PracticeShell, Tally, type DotState } from "@/practice/PracticeShell";
import { readingPractice as set, type Paragraph } from "@/practice/reading-data";

/*
 * Reading practice (canvas board PracticeReading): matching headings. Pick a
 * paragraph, then click or drag a heading onto it. Check answer marks every
 * placed heading; a wrong one opens a short explanation that points at the
 * paragraph's topic sentence. The 20 minute clock is for pacing only.
 */

const MAX = set.minutes * 60;

export default function ReadingPractice() {
  const { t, locale, pick } = useT();
  const [placed, setPlaced] = useState<Record<string, string | undefined>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState(set.paragraphs[0].key);
  const [hintFor, setHintFor] = useState<string | null>(null);
  const [left, setLeft] = useState(MAX);

  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const used = new Set(Object.values(placed).filter(Boolean));
  const isRight = (p: Paragraph) => checked[p.key] && placed[p.key] === p.answer;
  const isWrong = (p: Paragraph) => checked[p.key] && placed[p.key] !== p.answer;
  const right = set.paragraphs.filter(isRight).length;
  const wrong = set.paragraphs.filter(isWrong).length;
  const toGo = set.paragraphs.length - right - wrong;
  const toCheck = set.paragraphs.filter((p) => placed[p.key] && !checked[p.key]);
  const allRight = right === set.paragraphs.length;

  const place = (para: string, heading: string) => {
    if (checked[para]) return;
    setPlaced((pl) => {
      const next = { ...pl };
      // A heading can sit in one paragraph only.
      for (const k of Object.keys(next)) if (next[k] === heading && !checked[k]) next[k] = undefined;
      next[para] = heading;
      return next;
    });
    setHintFor(null);
  };
  const clear = (para: string) => {
    setPlaced((pl) => ({ ...pl, [para]: undefined }));
    setChecked((c) => ({ ...c, [para]: false }));
    setActive(para);
  };
  const check = () => {
    setChecked((c) => ({ ...c, ...Object.fromEntries(toCheck.map((p) => [p.key, true])) }));
    // Move on to the next paragraph that still needs a heading, so the list stays usable.
    const open = set.paragraphs.find((p) => !placed[p.key]);
    if (open) setActive(open.key);
  };
  const next = () => {
    const keys = set.paragraphs.map((p) => p.key);
    const i = keys.indexOf(active);
    const after = [...keys.slice(i + 1), ...keys.slice(0, i)].find((k) => !checked[k] || placed[k] !== set.paragraphs.find((p) => p.key === k)!.answer);
    if (after) {
      setActive(after);
      setHintFor(null);
      document.getElementById(`pr-para-${after}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  const restart = () => {
    setPlaced({});
    setChecked({});
    setHintFor(null);
    setActive(set.paragraphs[0].key);
    setLeft(MAX);
  };

  const dots: DotState[] = set.paragraphs.map((p) => (isRight(p) ? "right" : isWrong(p) ? "wrong" : p.key === active ? "current" : "todo"));
  const activeIndex = set.paragraphs.findIndex((p) => p.key === active);

  return (
    <PracticeShell
      skill="reading"
      topic={t("pp.r.topic")}
      dots={dots}
      dotsLabel={t("pp.paragraphOf", { n: formatNumber(activeIndex + 1, locale), total: formatNumber(set.paragraphs.length, locale) })}
      eyebrow={t("pp.r.eyebrow")}
      title={t("pp.r.title")}
      sub={t("pp.r.sub")}
      heroSide={
        <div className="flex flex-col items-start gap-2.5 md:items-end">
          <div
            role="timer"
            aria-label={t("pp.r.timerLabel", { time: formatClock(left, locale) })}
            className="flex items-center gap-3.5 rounded-2xl border-2 border-[#FF88DC] bg-white px-4 py-2.5 shadow-[0_8px_20px_rgba(176,44,140,0.12)]"
          >
            <ClockIcon className="text-[#B02C8C]" />
            <div>
              <div className="font-archivo text-[28px] leading-none font-extrabold text-[#2B2470] tabular-nums" aria-hidden="true">
                {formatClock(left, locale)}
              </div>
              <div className="text-xs font-semibold text-[#B02C8C]">
                {left === 0 ? t("pp.r.timeUp") : t("pp.r.leftOf", { total: formatClock(MAX, locale) })}
              </div>
            </div>
            <div className="h-2 w-[90px] overflow-hidden rounded-full bg-[#FFE6F8]" aria-hidden="true">
              <div className="h-full rounded-full bg-[#B02C8C]" style={{ width: `${((MAX - left) / MAX) * 100}%` }} />
            </div>
          </div>
          <PracticePill tone="pink" icon={<i className="size-2 rounded-full bg-[#4f9a2e]" />}>
            {t("pp.checkedAsYouGo")}
          </PracticePill>
        </div>
      }
    >
      <main className="mx-auto grid max-w-[1180px] items-start gap-6 px-4 pt-7 pb-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article lang="en" dir="ltr" className="rounded-[20px] border border-[#FFC7EE] bg-white px-4 py-6 shadow-[0_10px_30px_rgba(176,44,140,0.06)] sm:px-8 sm:py-7">
          <div className="flex justify-between border-b-2 border-[#2B2470] pb-2 text-[11px] font-bold tracking-[0.14em] uppercase">
            <span className="text-[#2B2470]">{set.section}</span>
            <span className="text-[#B02C8C]">{set.issue}</span>
          </div>
          <h2 className="mt-4 font-archivo text-[26px] leading-[1.15] font-extrabold tracking-[-0.02em] text-[#2B2470] sm:text-[34px]">{set.title}</h2>
          <p className="mt-2 text-[17px] text-[#B02C8C] italic">{set.standfirst}</p>

          <div className="mt-6 flex flex-col gap-6">
            {set.paragraphs.map((p) => (
              <ParagraphBlock
                key={p.key}
                p={p}
                placed={placed[p.key]}
                checked={!!checked[p.key]}
                active={p.key === active}
                marked={hintFor === p.key || isWrong(p)}
                hint={hintFor === p.key ? pick(p.hint) : undefined}
                onActivate={() => setActive(p.key)}
                onDropHeading={(h) => {
                  setActive(p.key);
                  place(p.key, h);
                }}
                onClear={() => clear(p.key)}
              />
            ))}
          </div>
        </article>

        <aside className="lg:sticky lg:top-4">
          <section aria-labelledby="pr-list" className="rounded-[22px] bg-[#2B2470] p-5 text-white">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="pr-list" className="font-archivo text-lg font-bold">
                {t("pp.r.listTitle")}
              </h3>
              <span className="text-xs text-white/75">{t("pp.r.useOnce")}</span>
            </div>
            <p className="mt-1 text-xs text-white/75">{t("pp.r.listHelp", { p: set.paragraphs[activeIndex].key })}</p>
            <ul className="mt-3 flex flex-col gap-2" lang="en" dir="ltr">
              {set.headings.map((h) => {
                const isUsed = used.has(h.key);
                return (
                  <li key={h.key}>
                    <button
                      type="button"
                      draggable={!isUsed}
                      disabled={isUsed || !!checked[active]}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", h.key)}
                      onClick={() => place(active, h.key)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[10px] px-3 py-2 text-start text-[13px] font-medium transition-transform",
                        isUsed
                          ? "bg-white/[0.08] text-white/60 line-through"
                          : "bg-[#FAFF7F] text-[#2B2470] hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-70",
                      )}
                    >
                      <b className="w-7 shrink-0 font-archivo">{h.key}</b>
                      <span>
                        {h.text}
                        {!isUsed && <span className="sr-only"> ({t("pp.r.placeIn", { p: active })})</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </main>

      <div className="border-t border-[#e1e4e8]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-4 py-4 md:px-6">
          <button
            type="button"
            aria-pressed={hintFor === active}
            disabled={isRight(set.paragraphs[activeIndex])}
            onClick={() => setHintFor((h) => (h === active ? null : active))}
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[#FF88DC] bg-white px-5 font-semibold text-[#B02C8C] hover:bg-[#FFE6F8] disabled:opacity-50"
          >
            <HintIcon />
            {t("pp.hint")}
          </button>
          <Tally right={right} review={wrong} left={toGo} reviewKey="pp.toFix" />
          <div className="ms-auto flex items-center gap-4">
            {allRight ? (
              <button type="button" onClick={restart} className="text-[15px] font-semibold text-[#2B2470] underline underline-offset-4">
                {t("pp.tryAgain")}
              </button>
            ) : (
              <button type="button" onClick={next} className="text-[15px] font-semibold text-[#2B2470] hover:underline">
                {t("pp.nextQuestion")}
              </button>
            )}
            <button
              type="button"
              onClick={check}
              disabled={toCheck.length === 0}
              className="h-11 rounded-xl bg-[#B02C8C] px-6 font-semibold text-white shadow-[0_8px_18px_rgba(176,44,140,0.28)] hover:bg-[#931f74] disabled:bg-[#d7a6ca] disabled:shadow-none"
            >
              {t("pp.check")}
            </button>
          </div>
        </div>
        {allRight && (
          <p role="status" className="mx-auto max-w-[1180px] px-4 pb-5 text-sm font-semibold text-[#2c6e1a] md:px-6">
            {t("pp.setDone", { right: formatNumber(right, locale), total: formatNumber(set.paragraphs.length, locale) })}
          </p>
        )}
      </div>
    </PracticeShell>
  );
}

function ParagraphBlock({
  p,
  placed,
  checked,
  active,
  marked,
  hint,
  onActivate,
  onDropHeading,
  onClear,
}: {
  p: Paragraph;
  placed?: string;
  checked: boolean;
  active: boolean;
  marked: boolean;
  hint?: string;
  onActivate: () => void;
  onDropHeading: (key: string) => void;
  onClear: () => void;
}) {
  const { t, pick, locale } = useT();
  const dir = locale === "fa" ? "rtl" : "ltr";
  const [over, setOver] = useState(false);
  const heading = set.headings.find((h) => h.key === placed);
  const right = checked && placed === p.answer;
  const wrong = checked && placed !== p.answer;
  const drop = {
    onDragOver: (e: DragEvent) => {
      if (checked) return;
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOver(false);
      const key = e.dataTransfer.getData("text/plain");
      if (key) onDropHeading(key);
    },
  };

  const [before, after] = p.text.split(p.topic);
  const body =
    marked && after !== undefined ? (
      <>
        {before}
        <span className="pp-mark">{p.topic}</span>
        {after}
      </>
    ) : (
      p.text
    );

  return (
    <section id={`pr-para-${p.key}`} aria-label={t("pp.r.paragraph", { p: p.key })} className="flex gap-3 sm:gap-5">
      <span className={cn("w-7 shrink-0 font-archivo text-[34px] leading-none font-extrabold", active ? "text-[#B02C8C]" : "text-[#FF88DC]")} aria-hidden="true">
        {p.key}
      </span>
      <div className="min-w-0 flex-1">
        <div {...drop} className="mb-3">
          {heading ? (
            <span
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-lg border-2 px-2.5 py-1 text-[13px] font-semibold",
                right && "border-[#4f9a2e] bg-[#e6f7de] text-[#2c6e1a]",
                wrong && "border-[#D92F3A] bg-[#FFECEE] text-[#B8232D]",
                !checked && "border-[#2B2470] bg-[#FDFFC7] text-[#2B2470]",
              )}
            >
              <b className="font-archivo">{heading.key}</b>
              <span>{heading.text}</span>
              {right && (
                <span role="img" aria-label={t("pp.correct")}>
                  <CheckIcon />
                </span>
              )}
              {wrong && (
                <span role="img" aria-label={t("pp.incorrect")}>
                  <CrossIcon />
                </span>
              )}
              {!checked && (
                <button type="button" onClick={onClear} aria-label={t("pp.r.remove", { h: heading.key, p: p.key })} className="rounded p-0.5 hover:bg-[#2B2470]/10">
                  <CrossIcon size={11} />
                </button>
              )}
            </span>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              aria-pressed={active}
              className={cn(
                "inline-flex h-[34px] w-full max-w-[260px] items-center rounded-lg border-2 border-dashed px-3 text-[13px] font-semibold",
                over || active ? "border-[#FF88DC] bg-[#FFE6F8] text-[#B02C8C]" : "border-[#d6dae3] bg-[#f6f7f9] text-[#556170]",
                active && !over && "pp-slot-live",
              )}
            >
              {active || over ? t("pp.r.dropHere") : t("pp.r.empty")}
            </button>
          )}
        </div>
        <p
          className={cn(
            "text-[15px] leading-[1.65] text-[#011627]",
            p.key === "A" && "first-letter:float-left first-letter:me-2 first-letter:font-archivo first-letter:text-[64px] first-letter:leading-[0.8] first-letter:font-extrabold first-letter:text-[#B02C8C]",
          )}
        >
          {body}
        </p>
        {hint && (
          <p className="pp-slide mt-3 rounded-xl bg-[#FDFFC7] px-4 py-2.5 text-sm text-[#2B2470]" lang={locale} dir={dir}>
            <b>{t("pp.hint")}: </b>
            {hint}
          </p>
        )}
        {wrong && heading && (
          <div className="pp-slide mt-4 rounded-2xl border-2 border-s-[6px] border-[#D92F3A] bg-white px-4 py-3" lang={locale} dir={dir}>
            <div className="pp-caps text-xs font-bold text-[#B8232D]">{t("pp.notQuite")}</div>
            <p className="mt-1 text-sm leading-[1.6] text-[#011627]">
              {t("pp.r.why", { pick: heading.key, p: p.key, about: pick(p.about) })} {t("pp.r.lookAt")}{" "}
              <b lang="en" dir="ltr">{p.topic.replace(/\.$/, "")}</b>. {t("pp.r.pointsTo", { answer: p.answer })}
            </p>
            <button type="button" onClick={onClear} className="mt-1.5 text-sm font-semibold text-[#B02C8C] underline underline-offset-4">
              {t("pp.tryAgain")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
