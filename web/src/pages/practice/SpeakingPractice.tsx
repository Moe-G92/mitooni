import { useEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "@/i18n";
import { formatClock, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { closeDevices, openDevices, recorderMime, watchLevel } from "@/exam/sections/media";
import { HintIcon, PauseIcon, PlayIcon, PracticePill, PracticeShell, type DotState } from "@/practice/PracticeShell";
import { speakingPractice as set, type CueCard } from "@/practice/speaking-data";

/*
 * Speaking practice (canvas board PracticeSpeaking): a Part 2 cue card, one
 * minute to prepare with sticky notes, then as many two minute takes as the
 * learner likes, recorded in the browser. Each take gets notes: speaking time
 * and long pauses are measured from the microphone level; fillers, linking
 * words and the next step are example notes for this practice version.
 * Without a microphone the page still works with a sample take.
 */

type Take = { id: number; n: number; duration: number; pauses: number; url?: string; sample?: boolean; saved?: boolean };

const SILENCE = 0.02;

export default function SpeakingPractice() {
  const { t, locale, pick } = useT();
  const [cardIdx, setCardIdx] = useState(0);
  const card = set.cards[cardIdx];
  const [notes, setNotes] = useState(["", "", "", ""]);
  const [prepLeft, setPrepLeft] = useState(set.prepSec);
  const [prepState, setPrepState] = useState<"idle" | "running" | "done">("idle");
  const [mic, setMic] = useState<"unknown" | "ready" | "none">(() =>
    typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia ? "none" : "unknown",
  );
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [wave, setWave] = useState<number[]>(() => Array(40).fill(0));
  const [takes, setTakes] = useState<Take[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const rec = useRef<{
    recorder?: MediaRecorder;
    stopLevel?: () => void;
    timer?: number;
    startedAt: number;
    pauses: number;
    silentSince: number | null;
    spoke: boolean;
    chunks: Blob[];
  }>({ startedAt: 0, pauses: 0, silentSince: null, spoke: false, chunks: [] });
  const player = useRef<HTMLAudioElement | null>(null);
  const urls = useRef<string[]>([]);

  // Preparation countdown.
  useEffect(() => {
    if (prepState !== "running") return;
    const id = window.setInterval(() => {
      setPrepLeft((s) => {
        if (s <= 1) {
          setPrepState("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [prepState]);

  // Release the microphone and recordings when leaving the page.
  useEffect(() => {
    const r = rec.current;
    const u = urls.current;
    return () => {
      r.stopLevel?.();
      window.clearInterval(r.timer);
      if (r.recorder && r.recorder.state !== "inactive") r.recorder.stop();
      player.current?.pause();
      closeDevices();
      u.forEach((x) => URL.revokeObjectURL(x));
    };
  }, []);

  const nextN = takes.length + 1;

  const stop = () => {
    const r = rec.current;
    window.clearInterval(r.timer);
    r.stopLevel?.();
    r.stopLevel = undefined;
    if (r.recorder && r.recorder.state !== "inactive") r.recorder.stop();
    setRecording(false);
    setLevel(0);
  };

  const start = async () => {
    if (recording) return;
    player.current?.pause();
    setPrepState((p) => (p === "running" ? "done" : p));
    const m = await openDevices();
    const mime = recorderMime();
    if (!m.stream || !m.hasAudio) {
      setMic("none");
      return;
    }
    setMic("ready");
    const r = rec.current;
    const recorder = new MediaRecorder(m.stream, mime ? { mimeType: mime } : undefined);
    r.recorder = recorder;
    r.chunks = [];
    r.pauses = 0;
    r.silentSince = null;
    r.spoke = false;
    r.startedAt = performance.now();
    const n = nextN;
    recorder.ondataavailable = (e) => {
      if (e.data.size) r.chunks.push(e.data);
    };
    recorder.onstop = () => {
      const duration = (performance.now() - r.startedAt) / 1000;
      const blob = new Blob(r.chunks, { type: recorder.mimeType || mime });
      const url = blob.size ? URL.createObjectURL(blob) : undefined;
      if (url) urls.current.push(url);
      const take: Take = { id: Date.now(), n, duration: Math.min(duration, set.talkSec), pauses: r.pauses, url };
      setTakes((ts) => [...ts, take]);
      setSelected(take.id);
    };
    recorder.start(1000);
    r.stopLevel = watchLevel(m.stream, (rms) => {
      const now = performance.now();
      setLevel(rms);
      setWave((w) => [...w.slice(1), rms]);
      if (rms > SILENCE) {
        if (r.spoke && r.silentSince !== null && now - r.silentSince >= set.pauseSec * 1000) r.pauses += 1;
        r.spoke = true;
        r.silentSince = null;
      } else if (r.silentSince === null) {
        r.silentSince = now;
      }
    });
    setElapsed(0);
    setRecording(true);
    r.timer = window.setInterval(() => {
      const s = (performance.now() - r.startedAt) / 1000;
      setElapsed(s);
      if (s >= set.talkSec) stop();
    }, 250);
  };

  const addSample = () => {
    const take: Take = { id: Date.now(), n: nextN, duration: 106, pauses: 3, sample: true };
    setTakes((ts) => [...ts, take]);
    setSelected(take.id);
  };

  const play = (tk: Take) => {
    if (!tk.url) return;
    if (playingId === tk.id) {
      player.current?.pause();
      setPlayingId(null);
      return;
    }
    player.current?.pause();
    const a = new Audio(tk.url);
    a.onended = () => setPlayingId(null);
    player.current = a;
    void a.play().then(
      () => setPlayingId(tk.id),
      () => setPlayingId(null),
    );
  };

  const nextCard = () => {
    stop();
    player.current?.pause();
    setPlayingId(null);
    setCardIdx((i) => (i + 1) % set.cards.length);
    setNotes(["", "", "", ""]);
    setPrepLeft(set.prepSec);
    setPrepState("idle");
    setTakes([]);
    setSelected(null);
    setShowHint(false);
    setElapsed(0);
    setWave(Array(40).fill(0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sel = takes.find((tk) => tk.id === selected);
  const dots: DotState[] = set.cards.map((_, i) => (i < cardIdx ? "right" : i === cardIdx ? "current" : "todo"));
  const clock = (s: number) => formatClock(s, locale);
  const levelWord = level < SILENCE ? t("pp.s.quiet") : level > 0.6 ? t("pp.s.loud") : t("pp.s.good");

  return (
    <PracticeShell
      skill="speaking"
      topic={t("pp.s.topic")}
      dots={dots}
      dotsLabel={t("pp.cardOf", { n: formatNumber(cardIdx + 1, locale), total: formatNumber(set.cards.length, locale) })}
      eyebrow={t("pp.s.eyebrow")}
      title={t("pp.s.title")}
      sub={t("pp.s.sub")}
      heroSide={<PracticePill icon={<MicIcon size={14} />}>{t("pp.s.pill")}</PracticePill>}
    >
      <main className="mx-auto grid max-w-[1180px] items-start gap-6 px-4 pt-7 pb-10 md:px-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <section aria-labelledby="ps-card">
            <h2 id="ps-card" className="pp-caps text-xs font-bold text-[#2c6e1a]">
              {t("pp.s.cueCard")}
            </h2>
            <div lang="en" dir="ltr" className="mt-2.5 rounded-xl border border-[#e8e2c8] border-l-[5px] border-l-[#4f9a2e] bg-[#fffef6] px-5 py-5">
              <h3 className="font-archivo text-[19px] leading-[1.3] font-bold text-[#2B2470]">{card.topic}</h3>
              <div className="mt-3 font-semibold">You should say:</div>
              <ul className="mt-1.5 mb-2.5 list-disc ps-5">
                {card.points.map((p) => (
                  <li key={p} className="my-0.5">
                    {p}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[#3a4855]">{card.explain}</p>
            </div>
          </section>

          <section aria-labelledby="ps-prep" className="rounded-[20px] border border-[#e1e4e8] bg-white px-5 py-5">
            <h2 id="ps-prep" className="pp-caps text-xs font-bold text-[#2c6e1a]">
              {t("pp.s.prepTitle")}
            </h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-col items-center gap-2">
                <Ring
                  value={(set.prepSec - prepLeft) / set.prepSec}
                  color="#4f9a2e"
                  track="#e6f7de"
                  size={104}
                  label={
                    <>
                      <b className="block font-archivo text-[22px] font-extrabold text-[#2B2470] tabular-nums">{clock(prepLeft)}</b>
                      <span className="text-[11px] font-semibold text-[#556170]">{t("pp.s.leftToPlan")}</span>
                    </>
                  }
                  ariaLabel={t("pp.s.prepTimer", { time: clock(prepLeft) })}
                />
                {prepState === "idle" && (
                  <button type="button" onClick={() => setPrepState("running")} className="rounded-lg bg-[#e6f7de] px-3 py-1.5 text-[13px] font-semibold text-[#2c6e1a] hover:bg-[#d5efc8]">
                    {t("pp.s.startPrep")}
                  </button>
                )}
                {prepState === "running" && (
                  <button type="button" onClick={() => setPrepState("done")} className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[#2c6e1a] underline underline-offset-4">
                    {t("pp.s.skipPrep")}
                  </button>
                )}
                {prepState === "done" && <span className="text-[13px] font-semibold text-[#2c6e1a]">{t("pp.s.prepDone")}</span>}
              </div>
              <div className="grid flex-1 grid-cols-2 gap-2.5" lang="en" dir="ltr">
                {notes.map((v, i) => (
                  <label key={i} className="block">
                    <span className="sr-only">{t("pp.s.note", { n: formatNumber(i + 1, locale) })}</span>
                    <textarea
                      value={v}
                      rows={3}
                      onChange={(e) => setNotes((ns) => ns.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={card.notes[i]}
                      className={cn(
                        "block w-full resize-none rounded-lg border border-[rgba(43,36,112,0.12)] px-3 py-2.5 text-sm font-semibold text-[#2B2470] placeholder:text-[#2B2470]/55 focus:ring-2 focus:ring-[#2c6e1a] focus:outline-none",
                        ["bg-[#FAFF7F]", "bg-[#FFE6F8]", "bg-[#e6f7de]", "bg-[#EEF1FF]"][i],
                      )}
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section
            aria-label={t("pp.s.booth")}
            className="rounded-3xl bg-[radial-gradient(circle_at_85%_0%,#1f5a2a_0%,rgba(31,90,42,0)_50%),linear-gradient(160deg,#173b2a_0%,#1d1850_100%)] px-4 py-5 text-white sm:px-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              {recording ? (
                <span className="pp-onair inline-flex items-center gap-2.5 rounded-[10px] bg-[#D92F3A] px-3.5 py-1.5 font-archivo text-[13px] font-extrabold tracking-[0.14em]" dir="ltr">
                  <i className="size-2.5 rounded-full bg-white" />
                  ON AIR
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-3.5 py-1.5 text-[13px] font-bold">{t("pp.s.ready")}</span>
              )}
              <span className="text-sm text-white/80">
                {t("pp.s.takeLabel")} <b className="font-archivo text-[#FAFF7F]">{formatNumber(nextN, locale)}</b> · {recording ? t("pp.s.recordingNow") : t("pp.s.notRecording")}
              </span>
            </div>

            <div className="mt-4 grid items-center gap-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
              <div className="flex justify-center">
                <Ring
                  value={elapsed / set.talkSec}
                  color="#FAFF7F"
                  track="rgba(255,255,255,0.12)"
                  size={140}
                  label={
                    <>
                      <b className="block font-archivo text-[26px] font-extrabold tabular-nums">{clock(elapsed)}</b>
                      <span className="text-[11px] font-semibold text-white/75">{t("pp.s.of", { total: clock(set.talkSec) })}</span>
                    </>
                  }
                  ariaLabel={t("pp.s.talkTimer", { time: clock(elapsed), total: clock(set.talkSec) })}
                />
              </div>
              <div className="min-w-0">
                <div className="flex h-[110px] items-center gap-[4px] rounded-2xl border border-white/10 bg-white/[0.06] px-2" aria-hidden="true">
                  {wave.map((v, i) => (
                    <i
                      key={i}
                      className="block flex-1 rounded bg-[linear-gradient(180deg,#FAFF7F,#4f9a2e)]"
                      style={{ height: `${Math.max(6, Math.min(100, v * 260))}%`, opacity: recording ? 1 : 0.35 }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2.5 text-[13px] text-white/80">
                  <span>{t("pp.s.voiceLevel")}</span>
                  <span
                    className="relative h-2 flex-1 rounded bg-[linear-gradient(90deg,#4f9a2e_0%,#4f9a2e_60%,#FAFF7F_60%,#FAFF7F_82%,#D92F3A_82%)] opacity-90"
                    dir="ltr"
                    role="meter"
                    aria-label={t("pp.s.voiceLevel")}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(Math.min(1, level * 1.6) * 100)}
                    aria-valuetext={recording ? levelWord : t("pp.s.notRecording")}
                  >
                    {recording && <i className="absolute -top-1 h-4 w-[3px] rounded-sm bg-white" style={{ left: `${Math.min(98, level * 160)}%` }} />}
                  </span>
                  <span className="font-semibold text-[#FAFF7F]">{recording ? levelWord : "–"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {recording ? (
                <button type="button" onClick={stop} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 font-semibold text-[#1d1850] hover:bg-white/90">
                  <i className="size-3 rounded-sm bg-[#D92F3A]" />
                  {t("pp.s.stop")}
                </button>
              ) : mic === "none" ? (
                <>
                  <p className="text-sm text-white/85" role="status">
                    {t("pp.s.noMic")}
                  </p>
                  <button type="button" onClick={addSample} className="h-11 rounded-xl bg-[#FAFF7F] px-5 font-semibold text-[#1d1850]">
                    {t("pp.s.addSample")}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => void start()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FAFF7F] px-5 font-semibold text-[#1d1850] hover:bg-[#f2f75f]">
                  <MicIcon size={16} />
                  {takes.length ? t("pp.s.recordTake", { n: formatNumber(nextN, locale) }) : t("pp.s.startRecording")}
                </button>
              )}
            </div>

            {takes.length > 0 && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label={t("pp.s.takes")}>
                {takes.map((tk) => {
                  const good = tk.duration >= set.goodSec;
                  return (
                    <li
                      key={tk.id}
                      className={cn(
                        "flex items-center gap-3 rounded-[14px] border px-3.5 py-3",
                        tk.id === selected ? "border-[#FAFF7F] bg-[rgba(250,255,127,0.1)]" : "border-white/[0.12] bg-white/[0.07]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => play(tk)}
                        disabled={!tk.url}
                        aria-label={playingId === tk.id ? t("pp.s.pauseTake", { n: tk.n }) : t("pp.s.playTake", { n: tk.n })}
                        className="grid size-[34px] shrink-0 place-items-center rounded-full bg-white text-[#1d1850] disabled:opacity-40"
                      >
                        {playingId === tk.id ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
                      </button>
                      <button type="button" onClick={() => setSelected(tk.id)} aria-pressed={tk.id === selected} className="min-w-0 flex-1 text-start">
                        <span className="text-sm font-bold">{t("pp.s.take", { n: formatNumber(tk.n, locale) })}</span>{" "}
                        <span className="font-archivo text-xl font-extrabold tabular-nums">{clock(tk.duration)}</span>
                        {tk.saved && <span className="ms-2 text-xs text-[#FAFF7F]">{t("pp.s.saved")}</span>}
                        {tk.sample && <span className="ms-2 text-xs text-white/70">{t("pp.s.sampleTag")}</span>}
                        <br />
                        <span className={cn("mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", good ? "bg-[#e6f7de] text-[#2c6e1a]" : "bg-[#FFE3E3] text-[#B8232D]")}>
                          {good ? t("pp.s.goodLength") : t("pp.s.tooShort", { time: clock(set.goodSec) })}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {showHint && (
            <section aria-live="polite" className="pp-slide rounded-[18px] border-s-[6px] border-[#2c6e1a] bg-[#f3fbef] px-4 py-3.5">
              <b className="font-archivo text-[15px] text-[#2c6e1a]">{t("pp.hint")}</b>
              <p className="mt-1 text-sm text-[#3a4855]">{pick(card.hint)}</p>
            </section>
          )}

          {sel ? (
            <TakeNotes take={sel} card={card} />
          ) : (
            <p className="rounded-[18px] border border-dashed border-[#c8ccd6] px-5 py-4 text-sm text-[#556170]">{t("pp.s.notesEmpty")}</p>
          )}
        </div>
      </main>

      <div className="border-t border-[#e1e4e8]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-4 py-4 md:px-6">
          <button
            type="button"
            aria-pressed={showHint}
            onClick={() => setShowHint((v) => !v)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#c8ccd6] bg-white px-4 font-semibold hover:bg-[#f6f7f9]"
          >
            <HintIcon />
            {t("pp.hint")}
          </button>
          <button
            type="button"
            onClick={() => void start()}
            disabled={recording || mic === "none" || takes.length === 0}
            className="h-11 rounded-xl border border-[#b9dfa7] bg-[#e6f7de] px-5 font-semibold text-[#2c6e1a] hover:bg-[#d5efc8] disabled:opacity-50"
          >
            {t("pp.s.recordAgain")}
          </button>
          <button
            type="button"
            disabled={!sel || sel.saved}
            onClick={() => setTakes((ts) => ts.map((x) => (x.id === selected ? { ...x, saved: true } : x)))}
            className="h-11 rounded-xl bg-[#2c6e1a] px-5 font-semibold text-white hover:bg-[#23591a] disabled:bg-[#9cc18c]"
          >
            {sel?.saved ? t("pp.s.savedTake", { n: formatNumber(sel.n, locale) }) : t("pp.s.saveTake", { n: formatNumber(sel?.n ?? nextN, locale) })}
          </button>
          <button type="button" onClick={nextCard} className="ms-auto text-[15px] font-semibold text-[#2B2470] hover:underline">
            {t("pp.s.nextCard")}
          </button>
        </div>
        <p className="mx-auto max-w-[1180px] px-4 pb-5 text-xs text-[#556170] md:px-6">{t("pp.s.saveNote")}</p>
      </div>
    </PracticeShell>
  );

}

function TakeNotes({ take, card }: { take: Take; card: CueCard }) {
  const { t, locale, pick } = useT();
  const clock = (s: number) => formatClock(s, locale);
  const fillers = card.fillers.reduce((a, f) => a + f.times, 0);
  const good = take.duration >= set.goodSec;
  return (
    <section aria-labelledby="ps-notes" className="rounded-3xl border-2 border-[#4f9a2e] bg-[linear-gradient(180deg,#f3fbef_0%,#ffffff_60%)] px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ps-notes" className="font-archivo text-[22px] font-extrabold text-[#2B2470]">
          {t("pp.s.howFlowed", { n: formatNumber(take.n, locale) })}
        </h2>
        <span className="text-[13px] text-[#556170]">{t("pp.s.notBand")}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Gauge
          k={t("pp.s.speakingTime")}
          v={clock(take.duration)}
          color={good ? "#4f9a2e" : "#D92F3A"}
          text={good ? "#2c6e1a" : "#B8232D"}
          fill={take.duration / set.talkSec}
          note={t("pp.s.target", { from: clock(set.goodSec), to: clock(set.talkSec) })}
        />
        <Gauge
          k={t("pp.s.pauses", { n: formatNumber(set.pauseSec, locale) })}
          v={formatNumber(take.pauses, locale)}
          color="#E3B100"
          text="#7a6100"
          fill={Math.min(1, take.pauses / 8)}
          note={take.sample ? t("pp.s.sampleTake") : t("pp.s.measured")}
        />
        <Gauge
          k={t("pp.s.fillers")}
          v={formatNumber(fillers, locale)}
          color="#D92F3A"
          text="#B8232D"
          fill={Math.min(1, fillers / 10)}
          note={t("pp.s.example")}
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#FFF1F1] px-4 py-3">
          <div className="pp-caps text-xs font-bold text-[#B8232D]">{t("pp.s.fillersUsed")}</div>
          <div className="mt-2 flex flex-wrap gap-2" lang="en" dir="ltr">
            {card.fillers.map((f) => (
              <span key={f.word} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#B8232D]">
                {f.word} <span className="ms-1 rounded-full bg-[#FFE3E3] px-1.5 font-archivo text-xs">x{f.times}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#f3fbef] px-4 py-3">
          <div className="pp-caps text-xs font-bold text-[#2c6e1a]">{t("pp.s.linking")}</div>
          <div className="mt-2 flex flex-wrap gap-2" lang="en" dir="ltr">
            {card.linking.map((w, i) => (
              <span key={w} className={cn("rounded-full px-3 py-1 text-sm font-semibold", ["bg-[#e6f7de] text-[#2c6e1a]", "bg-[#FDFFC7] text-[#2B2470]", "bg-[#EEF1FF] text-[#2F3DA0]"][i % 3])}>
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-3 rounded-2xl bg-[#2B2470] px-4 py-4 text-white">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#FAFF7F] font-archivo font-bold text-[#2B2470]">{formatNumber(1, locale)}</span>
        <div>
          <b>{t("pp.s.nextStep")}</b>
          <p className="mt-0.5 text-sm text-white/90">{pick(card.nextStep)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#556170]">{t("pp.s.honest")}</p>
    </section>
  );
}

function Gauge({ k, v, color, text, fill, note }: { k: string; v: string; color: string; text: string; fill: number; note: string }) {
  return (
    <div className="rounded-2xl border border-[#e1e4e8] bg-white px-4 py-3">
      <div className="text-[13px] font-semibold text-[#3a4855]">{k}</div>
      <div className="font-archivo text-[28px] leading-tight font-extrabold tabular-nums" style={{ color: text }}>
        {v}
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eef0f3]" aria-hidden="true">
        <i className="block h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, fill * 100))}%`, background: color }} />
      </div>
      <div className="mt-1.5 text-xs text-[#556170]">{note}</div>
    </div>
  );
}

function Ring({ value, color, track, size, label, ariaLabel }: { value: number; color: string; track: string; size: number; label: ReactNode; ariaLabel: string }) {
  const r = 45;
  const c = 2 * Math.PI * r;
  return (
    <div role="timer" aria-label={ariaLabel} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-tight" aria-hidden="true">
        <div>{label}</div>
      </div>
    </div>
  );
}

function MicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
