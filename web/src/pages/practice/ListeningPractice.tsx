import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/i18n";
import { formatClock, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckIcon, CrossIcon, HintIcon, PauseIcon, PlayIcon, PracticePill, PracticeShell, Tally, type DotState } from "@/practice/PracticeShell";
import { listeningPractice as set, mapPins, type MapQuestion } from "@/practice/listening-data";

/*
 * Listening practice (canvas board PracticeListening): Part 2 map labelling
 * with an audio player that can pause, change speed, replay the last 10
 * seconds and show the transcript. Each answer is checked on request and the
 * feedback links back to the moment in the audio where the answer is heard.
 */

type Result = { pick: string; correct: boolean };

/** Fixed bar heights for the waveform (decorative). */
const BARS = Array.from({ length: 72 }, (_, i) => 35 + Math.round(((Math.sin(i * 1.7) + Math.sin(i * 0.63 + 1)) / 2 + 1) * 32));

export default function ListeningPractice() {
  const { t, locale, pick } = useT();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(set.durationSec);
  const [rate, setRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, Result>>({});
  const [active, setActive] = useState(set.questions[0].n);
  const [hintFor, setHintFor] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [src, setSrc] = useState<string>();

  // Load the recording as a blob so seeking works everywhere, including behind
  // the mock API's service worker, which does not answer range requests.
  useEffect(() => {
    let url: string | undefined;
    let cancelled = false;
    fetch(set.src)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        url = URL.createObjectURL(b);
        if (!cancelled) setSrc(url);
      })
      .catch(() => !cancelled && setSrc(set.src));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  const activeQ = set.questions.find((q) => q.n === active)!;
  const nowQ = playing || time > 0 ? set.questions.find((q) => time >= q.from && time < q.to) : undefined;
  const right = Object.values(results).filter((r) => r.correct).length;
  const wrong = Object.values(results).filter((r) => !r.correct).length;
  const left = set.questions.length - right - wrong;
  const allDone = left === 0;

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate]);

  const seek = (s: number, play = true) => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration, s));
    setTime(a.currentTime);
    if (play) void a.play().catch(() => setAudioError(true));
  };
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setAudioError(true));
    else a.pause();
  };

  const check = () => {
    const a = answers[active];
    if (!a || results[active]) return;
    setResults((r) => ({ ...r, [active]: { pick: a, correct: a === activeQ.answer } }));
    setLastChecked(active);
    setHintFor(null);
  };
  const next = () => {
    const order = set.questions.map((q) => q.n);
    const i = order.indexOf(active);
    const after = [...order.slice(i + 1), ...order.slice(0, i)].find((n) => !results[n]);
    if (after) {
      setActive(after);
      setHintFor(null);
    }
  };
  const restart = () => {
    setAnswers({});
    setResults({});
    setLastChecked(null);
    setHintFor(null);
    setActive(set.questions[0].n);
    seek(0, false);
  };

  const dots: DotState[] = set.questions.map((q) => (results[q.n] ? (results[q.n].correct ? "right" : "wrong") : q.n === active ? "current" : "todo"));
  const hasNext = set.questions.some((q) => q.n !== active && !results[q.n]);
  const shown = lastChecked ? set.questions.find((q) => q.n === lastChecked) : undefined;
  const nowLine = useMemo(() => {
    let idx = 0;
    set.transcript.forEach((l, i) => {
      if (time >= l.at) idx = i;
    });
    return idx;
  }, [time]);

  return (
    <PracticeShell
      skill="listening"
      topic={t("pp.l.topic")}
      dots={dots}
      dotsLabel={t("pp.questionOf", { n: formatNumber(set.questions.findIndex((q) => q.n === active) + 1, locale), total: formatNumber(set.questions.length, locale) })}
      eyebrow={t("pp.l.eyebrow")}
      title={t("pp.l.title")}
      sub={t("pp.l.sub")}
      heroSide={<PracticePill>{t("pp.checkedAsYouGo")}</PracticePill>}
    >
      <main className="mx-auto max-w-[1180px] px-4 pt-6 pb-10 md:px-6">
        {/* Audio player stays left to right in both languages, like a media timeline. */}
        <section
          aria-label={t("pp.l.player")}
          dir="ltr"
          className="flex flex-col gap-4 rounded-[22px] bg-[#2B2470] p-4 text-white shadow-[0_14px_30px_rgba(43,36,112,0.22)] md:flex-row md:items-center md:gap-5 md:px-6 md:py-5"
        >
          <audio
            ref={audio}
            src={src}
            preload="auto"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
              e.currentTarget.playbackRate = rate;
            }}
            onError={() => setAudioError(true)}
          />
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={toggle}
              disabled={!src}
              aria-label={playing ? t("pp.l.pause") : src ? t("pp.l.play") : t("pp.l.loading")}
              className="grid size-14 shrink-0 place-items-center rounded-full bg-[#FAFF7F] text-[#2B2470] focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              {playing ? <PauseIcon /> : <PlayIcon size={22} />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3 text-[13px] text-white/75">
                <span className="truncate" lang="en">
                  <b className="text-white">Part 2</b> · {set.title}
                </span>
                <span className="shrink-0 font-archivo tabular-nums">
                  <b className="text-[#FAFF7F]">{formatClock(time)}</b> / {formatClock(duration)}
                </span>
              </div>
              <div className="relative mt-2.5 h-[46px] overflow-hidden rounded-[10px] bg-white/[0.06] focus-within:ring-2 focus-within:ring-[#FAFF7F]">
                <div className="pp-eq absolute inset-x-2.5 inset-y-1.5 flex items-end gap-[3px]" data-playing={playing} aria-hidden="true">
                  {BARS.map((h, i) => (
                    <i
                      key={i}
                      className="block flex-1 rounded-[3px]"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${-((i * 37) % 100) / 100}s`,
                        background: i / BARS.length < time / duration ? (i % 4 === 0 ? "#FF88DC" : i % 3 === 0 ? "#C9D2FF" : "#FAFF7F") : "rgba(255,255,255,0.28)",
                      }}
                    />
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 border-r-2 border-[#FAFF7F] bg-[rgba(62,79,196,0.35)]"
                  style={{ width: `${(time / duration) * 100}%` }}
                />
                {set.questions
                  .filter((q) => results[q.n] && !results[q.n].correct)
                  .map((q) => (
                    <span
                      key={q.n}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1 rounded-md bg-[#D92F3A] px-1.5 font-archivo text-[11px] font-bold text-white"
                      style={{ left: `calc(${(q.from / duration) * 100}% - 14px)` }}
                    >
                      {formatClock(q.from)}
                    </span>
                  ))}
                <input
                  type="range"
                  min={0}
                  max={Math.round(duration)}
                  step={1}
                  value={Math.round(time)}
                  onChange={(e) => seek(Number(e.target.value), playing)}
                  aria-label={t("pp.l.position")}
                  aria-valuetext={`${formatClock(time)} / ${formatClock(duration)}`}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
            <div className="flex items-center gap-1.5" role="group" aria-label={t("pp.l.speed")}>
              <span className="pp-caps text-[11px] font-bold text-white/70">{t("pp.l.speed")}</span>
              {[0.75, 1].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={rate === r}
                  onClick={() => setRate(r)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-archivo text-xs font-bold",
                    rate === r ? "bg-white text-[#2B2470]" : "border border-white/30 text-white hover:bg-white/10",
                  )}
                >
                  {r}x
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => seek((audio.current?.currentTime ?? time) - 10)}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/30 px-3 py-1.5 text-[13px] font-semibold hover:bg-white/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
                {t("pp.l.replay10")}
              </button>
              <button
                type="button"
                aria-expanded={showTranscript}
                aria-controls="pl-transcript"
                onClick={() => setShowTranscript((v) => !v)}
                className={cn(
                  "rounded-[10px] border px-3 py-1.5 text-[13px] font-semibold",
                  showTranscript ? "border-white bg-white text-[#2B2470]" : "border-white/30 hover:bg-white/10",
                )}
              >
                {t("pp.l.transcript")}
              </button>
            </div>
            <span className="text-[11px] text-[#FAFF7F]">{t("pp.l.playsOnce")}</span>
          </div>
        </section>
        {audioError && (
          <p role="alert" className="mt-3 rounded-xl bg-[#FFECEE] px-4 py-2 text-sm text-[#B8232D]">
            {t("pp.l.audioError")}
          </p>
        )}

        {showTranscript && (
          <section id="pl-transcript" aria-label={t("pp.l.transcript")} className="mt-4 max-h-72 overflow-y-auto rounded-[18px] border border-[#e1e4e8] p-4">
            <ol className="flex flex-col gap-1" lang="en" dir="ltr">
              {set.transcript.map((l, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => seek(l.at)}
                    aria-current={i === nowLine && time > 0 ? "true" : undefined}
                    className={cn(
                      "flex w-full gap-3 rounded-lg px-2 py-1.5 text-start text-sm hover:bg-[#EEF1FF]",
                      i === nowLine && time > 0 && "bg-[#FDFFC7]",
                    )}
                  >
                    <span className="w-10 shrink-0 font-archivo text-xs font-bold text-[#3E4FC4] tabular-nums">{formatClock(l.at)}</span>
                    <span>
                      <b className="text-[#2B2470]">{l.speaker}:</b> {l.text}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section aria-label={t("pp.l.mapRegion")} className="rounded-[22px] bg-[#EEF1FF] p-3 sm:p-[18px]">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 pb-2.5" lang="en" dir="ltr">
              <b className="font-archivo text-lg text-[#2B2470]">{set.mapTitle}</b>
              <span className="text-xs text-[#556170]">Choose letters A to H</span>
            </div>
            <HollinsMap
              results={results}
              selected={results[active] ? undefined : answers[active]}
              playing={playing}
              onPick={(letter) => {
                if (!results[active]) setAnswers((a) => ({ ...a, [active]: letter }));
              }}
            />
            <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 px-1 text-xs text-[#3a4855]">
              <li className="inline-flex items-center gap-1.5">
                <i className="size-2.5 rounded-full bg-[#4f9a2e]" />
                {t("pp.l.legendCorrect")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <i className="size-2.5 rounded-full border-2 border-[#D92F3A]" />
                {t("pp.l.legendWrong")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <i className="size-2.5 rounded-full border-2 border-dashed border-[#4f9a2e]" />
                {t("pp.l.legendRight")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <i className="size-2.5 rounded-full border-2 border-[#2B2470] bg-[#FAFF7F]" />
                {t("pp.l.legendHere")}
              </li>
            </ul>
          </section>

          <div className="flex flex-col gap-3.5">
            <section aria-labelledby="pl-q-title" className="rounded-[22px] border border-[#e1e4e8] p-4 sm:px-5" lang="en" dir="ltr">
              <h2 id="pl-q-title" className="pp-caps text-xs font-bold text-[#3E4FC4]">
                Questions 14 to 17
              </h2>
              <p className="mt-1 mb-3 text-sm text-[#3a4855]">Label the map. Write the correct letter, A to H.</p>
              <ol className="flex flex-col gap-2.5">
                {set.questions.map((q) => (
                  <QuestionRow
                    key={q.n}
                    q={q}
                    value={answers[q.n]}
                    result={results[q.n]}
                    active={q.n === active}
                    listening={nowQ?.n === q.n}
                    onFocus={() => setActive(q.n)}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.n]: v }))}
                  />
                ))}
              </ol>
            </section>

            {hintFor === active && !results[active] && (
              <section aria-live="polite" className="pp-slide rounded-[18px] border-s-[6px] border-[#3E4FC4] bg-[#EEF1FF] px-4 py-3.5">
                <b className="font-archivo text-[15px] text-[#2B2470]">{t("pp.hintFor", { n: formatNumber(active, locale) })}</b>
                <p className="mt-1 text-sm text-[#3a4855]">{pick(activeQ.hint)}</p>
              </section>
            )}

            <div aria-live="polite">
              {allDone ? (
                <section className="pp-slide rounded-[18px] border-s-[6px] border-[#4f9a2e] bg-white px-4 py-3.5 shadow-[0_10px_24px_rgba(79,154,46,0.14)]">
                  <b className="font-archivo text-[15px] text-[#2c6e1a]">
                    {t("pp.setDone", { right: formatNumber(right, locale), total: formatNumber(set.questions.length, locale) })}
                  </b>
                  <p className="mt-1 text-sm text-[#3a4855]">{t("pp.l.setDoneText")}</p>
                  <button type="button" onClick={restart} className="mt-2 text-sm font-semibold text-[#2B2470] underline underline-offset-4">
                    {t("pp.tryAgain")}
                  </button>
                </section>
              ) : (
                shown && results[shown.n] && <Feedback q={shown} result={results[shown.n]} onPlay={() => seek(shown.from)} />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#e1e4e8] pt-4">
          <button
            type="button"
            onClick={() => setHintFor((h) => (h === active ? null : active))}
            aria-pressed={hintFor === active}
            disabled={!!results[active]}
            className="inline-flex h-[46px] items-center gap-2 rounded-xl border-2 border-[#3E4FC4] bg-white px-5 font-semibold text-[#3E4FC4] hover:bg-[#EEF1FF] disabled:opacity-50"
          >
            <HintIcon />
            {t("pp.hint")}
          </button>
          <Tally right={right} review={wrong} left={left} />
          <div className="ms-auto flex items-center gap-4">
            <button
              type="button"
              onClick={next}
              disabled={!hasNext}
              className="text-[15px] font-semibold text-[#2B2470] underline underline-offset-4 disabled:no-underline disabled:opacity-50"
            >
              {t("pp.nextQuestion")}
            </button>
            <button
              type="button"
              onClick={check}
              disabled={!answers[active] || !!results[active]}
              className="h-[46px] rounded-xl bg-[#3E4FC4] px-6 font-semibold text-white shadow-[0_8px_18px_rgba(62,79,196,0.28)] hover:bg-[#2F3DA0] disabled:bg-[#9aa3c7] disabled:shadow-none"
            >
              {t("pp.check")}
            </button>
          </div>
        </div>
      </main>
    </PracticeShell>
  );
}

function QuestionRow({
  q,
  value,
  result,
  active,
  listening,
  onFocus,
  onChange,
}: {
  q: MapQuestion;
  value?: string;
  result?: Result;
  active: boolean;
  listening: boolean;
  onFocus: () => void;
  onChange: (v: string) => void;
}) {
  const { t } = useT();
  const tone = result ? (result.correct ? "right" : "wrong") : active ? "active" : "idle";
  return (
    <li
      onClick={onFocus}
      className={cn(
        "flex items-center gap-3 rounded-[14px] px-3 py-2.5",
        tone === "right" && "bg-[#e6f7de]",
        tone === "wrong" && "bg-[#FFECEE]",
        tone === "active" && "bg-[#FDFFC7] shadow-[0_0_0_4px_rgba(250,255,127,0.9),0_0_0_6px_#2B2470]",
        tone === "idle" && "bg-[#f6f7f9]",
      )}
    >
      <b className={cn("w-[26px] font-archivo text-base", tone === "right" ? "text-[#2c6e1a]" : tone === "wrong" ? "text-[#B8232D]" : "text-[#2B2470]")}>{q.n}</b>
      <label htmlFor={`pl-a-${q.n}`} className="flex flex-1 flex-wrap items-center gap-x-1.5 font-semibold">
        {q.prompt}
        {listening && <span className="rounded-full bg-[#2B2470] px-2 py-px text-[11px] font-bold text-[#FAFF7F]">{t("pp.l.listeningNow")}</span>}
      </label>
      <select
        id={`pl-a-${q.n}`}
        value={value ?? ""}
        disabled={!!result}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-16 rounded-[10px] bg-white px-1.5 font-archivo text-[15px] font-bold",
          tone === "right" && "border-2 border-[#4f9a2e] text-[#2c6e1a]",
          tone === "wrong" && "border-2 border-[#D92F3A] text-[#B8232D]",
          tone === "active" && "border-2 border-[#2B2470] text-[#2B2470]",
          tone === "idle" && "border border-[#c8ccd6] text-[#556170]",
        )}
      >
        <option value="">?</option>
        {set.letters.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <span className="grid w-[26px] place-items-center">
        {result &&
          (result.correct ? (
            <span role="img" aria-label={t("pp.correct")} className="grid size-[26px] place-items-center rounded-full bg-[#4f9a2e] text-white">
              <CheckIcon />
            </span>
          ) : (
            <span role="img" aria-label={t("pp.incorrect")} className="grid size-[26px] place-items-center rounded-full bg-[#D92F3A] text-white">
              <CrossIcon />
            </span>
          ))}
      </span>
    </li>
  );
}

function Feedback({ q, result, onPlay }: { q: MapQuestion; result: Result; onPlay: () => void }) {
  const { t, locale, pick } = useT();
  const at = formatClock(q.from, locale);
  return (
    <section
      key={q.n}
      aria-label={t("pp.feedbackFor", { n: formatNumber(q.n, locale) })}
      className={cn(
        "pp-slide rounded-[18px] border-s-[6px] bg-white px-4 py-3.5",
        result.correct ? "border-[#4f9a2e] shadow-[0_10px_24px_rgba(79,154,46,0.14)]" : "border-[#D92F3A] shadow-[0_10px_24px_rgba(217,47,58,0.14)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <b className={cn("font-archivo text-[15px]", result.correct ? "text-[#2c6e1a]" : "text-[#B8232D]")}>
          {t(result.correct ? "pp.l.fbRight" : "pp.l.fbWrong", { n: formatNumber(q.n, locale) })}
        </b>
        <button
          type="button"
          onClick={onPlay}
          className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-[#2B2470] px-3 py-1 font-archivo text-xs font-bold text-[#FAFF7F]"
        >
          <PlayIcon />
          {t("pp.l.playFrom", { time: at })}
        </button>
      </div>
      <p className="mt-1.5 text-sm leading-[21px] text-[#3a4855]">
        {result.correct
          ? t("pp.l.fbRightText", { time: at, why: pick(q.explanation) })
          : t("pp.l.fbWrongText", { pick: result.pick, time: at, why: pick(q.explanation) })}
      </p>
    </section>
  );
}

/** The reserve map, drawn in the board's style on the same layout as the exam figure. */
function HollinsMap({
  results,
  selected,
  playing,
  onPick,
}: {
  results: Record<number, Result>;
  selected?: string;
  playing: boolean;
  onPick: (letter: string) => void;
}) {
  const state = (letter: string) => {
    for (const q of set.questions) {
      const r = results[q.n];
      if (!r) continue;
      if (r.correct && q.answer === letter) return "right";
      if (!r.correct && r.pick === letter) return "wrong";
      if (!r.correct && q.answer === letter) return "answer";
    }
    return selected === letter ? "selected" : "idle";
  };
  return (
    <svg viewBox="0 0 600 380" width="100%" role="img" aria-label="Map of Hollins Marsh nature reserve with places labelled A to H" className="block rounded-2xl" lang="en">
      <rect width="600" height="380" fill="#F4F9EC" />
      <path d="M0 250 C80 236 120 300 200 292 S330 240 380 268 S520 326 600 300 L600 380 L0 380 Z" fill="#E3F1D6" />
      {/* Woodland */}
      <rect x="40" y="40" width="200" height="130" rx="22" fill="#d5ebc4" />
      {[
        [70, 65],
        [95, 140],
        [185, 140],
        [160, 62],
        [60, 115],
        [120, 70],
        [210, 100],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill="#a9d18e" />
      ))}
      <text x="135" y="112" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2c6e1a">
        Woodland
      </text>
      {/* Lake */}
      <ellipse cx="430" cy="105" rx="116" ry="62" fill="#C9D2FF" />
      <ellipse cx="430" cy="105" rx="92" ry="44" fill="#B6C1FA" />
      <text x="440" y="110" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="15" fontWeight="700" fill="#2F3DA0">
        Hollins Lake
      </text>
      {/* Paths */}
      <path d="M280 360 V44" stroke="#d9c7a3" strokeWidth="22" strokeLinecap="round" fill="none" />
      <path d="M62 200 H280" stroke="#d9c7a3" strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M280 200 H566 V128" stroke="#d9c7a3" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="292" y="132" fontSize="11" fill="#556170" transform="rotate(-90 292 132)" textAnchor="middle">
        Main path
      </text>
      <text x="480" y="225" fontSize="11" fill="#556170" textAnchor="middle">
        Lake path
      </text>
      <rect x="414" y="160" width="12" height="32" rx="2" fill="#a1866a" />
      <text x="420" y="153" fontSize="10" fill="#556170" textAnchor="middle">
        Jetty
      </text>
      {/* Buildings */}
      <rect x="304" y="262" width="112" height="50" rx="8" fill="#ffffff" stroke="#c8ccd6" />
      <text x="360" y="284" textAnchor="middle" fontSize="12" fontWeight="700" fill="#556170">
        Visitor centre
      </text>
      <rect x="40" y="262" width="130" height="70" rx="8" fill="#ffffff" stroke="#c8ccd6" />
      <text x="105" y="302" textAnchor="middle" fontSize="12" fontWeight="700" fill="#556170">
        Car park
      </text>
      <path d="M170 325 H270" stroke="#d9c7a3" strokeWidth="10" fill="none" />
      <text x="500" y="352" textAnchor="middle" fontSize="12" fill="#2c6e1a">
        Meadow
      </text>
      <text x="280" y="376" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B2470">
        Main gate
      </text>
      {/* You are here */}
      <circle className={playing ? "pp-pulse" : undefined} cx="360" cy="300" r="16" fill="#FAFF7F" opacity=".6" />
      <circle cx="360" cy="300" r="6" fill="#2B2470" stroke="#FAFF7F" strokeWidth="3" />
      <g transform="translate(372 316)">
        <rect width="84" height="20" rx="10" fill="#2B2470" />
        <text x="42" y="14" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FAFF7F">
          You are here
        </text>
      </g>
      {/* North */}
      <g transform="translate(566 340)">
        <circle r="16" fill="#ffffff" stroke="#c8ccd6" />
        <path d="M0 -11 L4 2 L0 0 L-4 2 Z" fill="#2B2470" />
        <text y="12" textAnchor="middle" fontSize="8" fontWeight="700" fill="#556170">
          N
        </text>
      </g>
      {/* Letters: a click picks the letter for the current question; the dropdowns do the same by keyboard. */}
      <g fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="14" textAnchor="middle">
        {Object.entries(mapPins).map(([letter, [x, y]]) => {
          const s = state(letter);
          const fill = s === "right" ? "#4f9a2e" : s === "selected" ? "#2B2470" : "#ffffff";
          const stroke = s === "right" ? "#4f9a2e" : s === "wrong" ? "#D92F3A" : s === "answer" ? "#4f9a2e" : "#2B2470";
          const color = s === "right" || s === "selected" ? "#ffffff" : s === "wrong" ? "#B8232D" : s === "answer" ? "#2c6e1a" : "#2B2470";
          return (
            <g key={letter} onClick={() => onPick(letter)} className="cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r="15"
                fill={fill}
                stroke={stroke}
                strokeWidth={s === "idle" || s === "selected" ? 2 : 3}
                strokeDasharray={s === "answer" ? "4 3" : undefined}
              />
              <text x={x} y={y + 5} fill={color}>
                {letter}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
