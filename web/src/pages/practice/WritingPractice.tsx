import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useT } from "@/i18n";
import { formatBand, formatClock, formatNumber } from "@/lib/format";
import { cn, countWords } from "@/lib/utils";
import { CheckIcon, ClockIcon, PracticeShell } from "@/practice/PracticeShell";
import { CRITERIA, writingPractice as task, type Criterion, type Mark } from "@/practice/writing-data";

/*
 * Writing practice (canvas board PracticeWriting): write a Task 2 essay,
 * submit it, and see every mark in place, colour coded by marking criterion,
 * with a criterion panel and a numbered list of notes. The feedback is canned
 * for this practice version: marks are matched by phrase, so the sample essay
 * shows all of them.
 */

type Found = { mark: Mark; start: number; end: number; n: number };

const ORDER: Criterion[] = ["tr", "cc", "lr", "gra"];

function findMarks(text: string): Found[] {
  const low = text.toLowerCase();
  const marks: Mark[] = task.marks;
  const hits = marks
    .map((mark): Found | null => {
      const at = low.indexOf(mark.phrase.toLowerCase());
      if (at < 0) return null;
      const off = mark.show ? mark.phrase.indexOf(mark.show) : 0;
      const len = mark.show ? mark.show.length : mark.phrase.length;
      return { mark, start: at + off, end: at + off + len, n: 0 };
    })
    .filter((h): h is Found => !!h)
    .sort((a, b) => a.start - b.start);
  const out: Found[] = [];
  for (const h of hits) if (!out.length || h.start >= out[out.length - 1].end) out.push({ ...h, n: out.length + 1 });
  return out;
}

export default function WritingPractice() {
  const { t, locale } = useT();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"write" | "feedback">("write");
  const [used, setUsed] = useState(0);

  useEffect(() => {
    if (phase !== "write") return;
    const id = window.setInterval(() => setUsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const words = countWords(text);
  const found = useMemo(() => (phase === "feedback" ? findMarks(text) : []), [phase, text]);
  const fullSet = found.length === task.marks.length;
  const max = task.minutes * 60;

  return (
    <PracticeShell
      skill="writing"
      topic={t("pp.w.topic")}
      eyebrow={t("pp.w.eyebrow")}
      title={t("pp.w.title")}
      sub={t("pp.w.sub")}
      heroSide={
        <div
          role="timer"
          aria-label={t("pp.w.timerLabel", { time: formatClock(used, locale), total: formatClock(max, locale) })}
          className="flex items-center gap-3 rounded-2xl border border-white/35 bg-white/[0.12] px-5 py-3"
        >
          <ClockIcon className="text-[#FAFF7F]" />
          <div aria-hidden="true">
            <b className="block font-archivo text-[26px] leading-none font-extrabold tabular-nums">{formatClock(used, locale)}</b>
            <span className="text-[13px] text-white/90">{t("pp.w.usedOf", { total: formatClock(max, locale) })}</span>
          </div>
        </div>
      }
    >
      <main className="mx-auto grid max-w-[1180px] items-start gap-6 px-4 pt-7 pb-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="pw-prompt" className="rounded-[18px] border border-[#f0c9cc] border-s-[6px] border-s-[#D92F3A] bg-white px-5 py-4 shadow-[0_8px_22px_rgba(217,47,58,0.06)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="pw-prompt" className="pp-caps text-xs font-bold text-[#B8232D]">
                {t("pp.w.promptLabel")}
              </h2>
              <span className="text-xs text-[#556170]">{t("pp.w.promptMeta", { words: formatNumber(task.minWords, locale), minutes: formatNumber(task.minutes, locale) })}</span>
            </div>
            <div lang="en" dir="ltr">
              <p className="mt-2 font-archivo text-lg leading-snug font-bold text-[#2B2470]">{task.prompt}</p>
              <p className="mt-1.5 text-[13px] text-[#3a4855]">{task.instruction}</p>
            </div>
          </section>

          <section aria-labelledby="pw-essay" className="overflow-hidden rounded-[18px] border border-[#e1e4e8] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e1e4e8] bg-[#fafbfc] px-4 py-3">
              <h2 id="pw-essay" className="text-[15px] font-bold">
                {t("pp.w.yourEssay")}
              </h2>
              {phase === "feedback" ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#e6f7de] px-2.5 py-1 text-xs font-bold text-[#2c6e1a]">
                  <CheckIcon size={12} />
                  {t("pp.w.submitted")}
                </span>
              ) : (
                <span className="text-xs text-[#556170]">{t("pp.w.draft")}</span>
              )}
            </div>
            {phase === "write" ? (
              <div className="p-4">
                <label htmlFor="pw-text" className="sr-only">
                  {t("pp.w.yourEssay")}
                </label>
                <textarea
                  id="pw-text"
                  lang="en"
                  dir="ltr"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Start writing your essay here."
                  className="min-h-[360px] w-full resize-y rounded-xl border border-[#c8ccd6] p-4 text-base leading-[1.75] focus:border-[#D92F3A] focus:ring-2 focus:ring-[#FFE3E3] focus:outline-none"
                />
                {!text && (
                  <button type="button" onClick={() => setText(task.sample)} className="mt-2 text-sm font-semibold text-[#B8232D] underline underline-offset-4">
                    {t("pp.w.useSample")}
                  </button>
                )}
              </div>
            ) : (
              <div className="px-5 py-5" lang="en" dir="ltr">
                <MarkedEssay text={text} found={found} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e1e4e8] bg-[#fafbfc] px-4 py-3 text-[13px]">
              <span aria-live="polite">
                {t("pp.w.words")} <b>{formatNumber(words, locale)}</b>
                {phase === "write" && words > 0 && words < task.minWords && <span className="ms-2 text-[#7a6100]">{t("pp.w.under", { n: formatNumber(task.minWords, locale) })}</span>}
              </span>
              <ul className="flex flex-wrap gap-x-4 gap-y-1" lang="en" dir="ltr">
                {ORDER.map((c) => (
                  <li key={c} className="inline-flex items-center gap-1.5 text-xs text-[#3a4855]">
                    <i className="size-3 rounded-[3px]" style={{ background: CRITERIA[c].tint, boxShadow: `inset 0 -2px 0 ${CRITERIA[c].line}` }} />
                    {CRITERIA[c].name}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            {phase === "feedback" ? (
              <>
                <button type="button" onClick={() => setPhase("write")} className="h-11 rounded-xl border border-[#c8ccd6] bg-white px-5 font-semibold hover:bg-[#f6f7f9]">
                  {t("pp.w.edit")}
                </button>
                <Link to="/app/results" className="ms-auto text-[15px] font-semibold text-[#B8232D] no-underline hover:underline">
                  {t("pp.w.reports")}
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={words === 0}
                  onClick={() => {
                    setPhase("feedback");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-11 rounded-xl bg-[#D92F3A] px-6 font-semibold text-white shadow-[0_8px_18px_rgba(217,47,58,0.25)] hover:bg-[#B8232D] disabled:bg-[#e9a3a8] disabled:shadow-none"
                >
                  {t("pp.w.submit")}
                </button>
                <span className="text-[13px] text-[#556170]">{t("pp.w.practiceNote")}</span>
              </>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          {phase === "feedback" ? <Criteria found={found} fullSet={fullSet} /> : <CriteriaGuide />}
          {phase === "feedback" && <MarkList found={found} fullSet={fullSet} />}
        </aside>
      </main>
    </PracticeShell>
  );
}

function MarkedEssay({ text, found }: { text: string; found: Found[] }) {
  // Split into paragraphs while keeping each paragraph's offset in the full text.
  const paras: { start: number; body: string }[] = [];
  const re = /[^\n]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) paras.push({ start: m.index, body: m[0] });
  return (
    <div className="flex flex-col gap-3.5">
      {paras.map(({ start, body }) => {
        const end = start + body.length;
        const parts: ReactNode[] = [];
        let at = start;
        for (const f of found.filter((x) => x.start >= start && x.end <= end)) {
          if (f.start > at) parts.push(text.slice(at, f.start));
          const c = CRITERIA[f.mark.criterion];
          parts.push(
            <mark
              key={f.n}
              className="rounded-[3px] px-0.5 text-inherit"
              style={{ background: c.tint, boxShadow: `inset 0 -2px 0 ${c.line}` }}
              aria-describedby={`pw-note-${f.n}`}
            >
              {text.slice(f.start, f.end)}
              <a href={`#pw-note-${f.n}`} className="ms-0.5 align-super font-archivo text-[10px] font-extrabold no-underline" style={{ color: c.text }}>
                {f.n}
              </a>
            </mark>,
          );
          at = f.end;
        }
        if (at < end) parts.push(text.slice(at, end));
        return (
          <p key={start} className="text-base leading-[1.85] text-[#011627]">
            {parts}
          </p>
        );
      })}
    </div>
  );
}

function Criteria({ found, fullSet }: { found: Found[]; fullSet: boolean }) {
  const { t, locale } = useT();
  const pct = (band: number) => ((band - 4) / 5) * 100;
  return (
    <section aria-labelledby="pw-crit" className="rounded-[20px] border border-[#e1e4e8] bg-white px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pw-crit" className="font-archivo text-[17px] font-bold text-[#2B2470]">
          {t("pp.w.byCriterion")}
        </h2>
        {fullSet && (
          <span className="text-xs text-[#556170]">
            {t("pp.w.overall")} <b className="text-[#011627]">{formatBand(task.overall, locale)}</b>
          </span>
        )}
      </div>
      <ul className="mt-3 flex flex-col gap-4">
        {ORDER.map((c) => {
          const mine = found.filter((f) => f.mark.criterion === c);
          const s = mine.filter((f) => f.mark.kind === "strength").length;
          const fx = mine.length - s;
          const band = task.bands[c];
          const parts = [s ? t("pp.w.strengths", { count: s, n: formatNumber(s, locale) }) : "", fx ? t("pp.w.fixes", { n: formatNumber(fx, locale) }) : ""].filter(Boolean);
          return (
            <li key={c}>
              <div className="flex items-center gap-2 text-[13px]">
                <i className="size-2.5 rounded-sm" style={{ background: CRITERIA[c].line }} />
                <b lang="en">{CRITERIA[c].name}</b>
                <span className="ms-auto text-[11px] text-[#556170]">{parts.join(locale === "fa" ? "، " : ", ") || t("pp.w.noMarks")}</span>
              </div>
              {fullSet && (
                <div className="relative mt-2 h-2 rounded-full" style={{ background: CRITERIA[c].tint }} dir="ltr">
                  <div className="pp-grow absolute inset-y-0 left-0 rounded-full opacity-40" style={{ width: `${pct(band)}%`, background: CRITERIA[c].line }} />
                  <span aria-hidden="true" className="absolute -top-1 h-4 w-0.5 bg-[#2B2470]" style={{ left: `${pct(task.target)}%` }} title="Target 7.0" />
                  <span
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 font-archivo text-xs font-bold text-white"
                    style={{ left: `${pct(band)}%`, background: CRITERIA[c].line }}
                  >
                    {formatBand(band, locale)}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {fullSet ? (
        <>
          <div className="mt-3 flex justify-between text-[10px] text-[#556170]" dir="ltr" aria-hidden="true">
            {[4, 5, 6, 7, 8, 9].map((b) => (
              <span key={b}>{b === task.target ? t("pp.w.target", { n: formatNumber(b, locale) }) : formatNumber(b, locale)}</span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#556170]">{t("pp.w.exampleBands")}</p>
        </>
      ) : (
        <p className="mt-3 rounded-lg bg-[#FDFFC7] px-3 py-2 text-xs text-[#5c4a00]">
          {t("pp.w.partial", { n: formatNumber(found.length, locale), total: formatNumber(task.marks.length, locale) })}
        </p>
      )}
    </section>
  );
}

function CriteriaGuide() {
  const { t } = useT();
  return (
    <section aria-labelledby="pw-guide" className="rounded-[20px] border border-[#e1e4e8] bg-white px-5 py-4">
      <h2 id="pw-guide" className="font-archivo text-[17px] font-bold text-[#2B2470]">
        {t("pp.w.guideTitle")}
      </h2>
      <p className="mt-1 text-[13px] text-[#556170]">{t("pp.w.guideText")}</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {ORDER.map((c) => (
          <li key={c} className="flex gap-2.5 text-[13px]">
            <i className="mt-1 size-3 shrink-0 rounded-[3px]" style={{ background: CRITERIA[c].tint, boxShadow: `inset 0 -2px 0 ${CRITERIA[c].line}` }} />
            <span>
              <b lang="en">{CRITERIA[c].name}</b>
              <span className="block text-[#3a4855]">{t(`pp.w.crit.${c}`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MarkList({ found, fullSet }: { found: Found[]; fullSet: boolean }) {
  const { t, locale, pick } = useT();
  return (
    <section aria-labelledby="pw-marks" className="rounded-[20px] border border-[#e1e4e8] bg-white px-5 py-4">
      <h2 id="pw-marks" className="font-archivo text-[17px] font-bold text-[#2B2470]">
        {t("pp.w.whatWeMarked")}
      </h2>
      {found.length === 0 && <p className="mt-2 text-sm text-[#556170]">{t("pp.w.noneFound")}</p>}
      <ol className="mt-2 divide-y divide-[#eef0f3]">
        {found.map((f) => {
          const c = CRITERIA[f.mark.criterion];
          const strength = f.mark.kind === "strength";
          return (
            <li key={f.n} id={`pw-note-${f.n}`} className="flex scroll-mt-4 gap-3 py-3">
              <b className="grid size-6 shrink-0 place-items-center rounded-md font-archivo text-xs text-white" style={{ background: c.line }}>
                {formatNumber(f.n, locale)}
              </b>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <b className="text-sm">{pick(f.mark.title)}</b>
                  <span className={cn("rounded px-1.5 py-px text-[11px] font-bold", strength ? "bg-[#e6f7de] text-[#2c6e1a]" : "bg-[#FDFFC2] text-[#7a6100]")}>
                    {strength ? t("pp.w.strength") : t("pp.w.toFix")}
                  </span>
                  <span className="ms-auto text-[11px] font-bold" style={{ color: c.text }} lang="en">
                    {c.name}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#3a4855]">{pick(f.mark.note)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {!fullSet && found.length > 0 && <p className="mt-1 text-[11px] text-[#556170]">{t("pp.w.sampleNote")}</p>}
    </section>
  );
}
