import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Clock, Mic, MicOff, User } from "lucide-react";
import type { Part } from "@/api/schemas";
import { uploadRecording } from "@/api/queries";
import { useSession } from "../engine/session";
import { useRunner } from "../engine/runner";
import { ExamHeader } from "../chrome/ExamHeader";
import { media, openDevices, recorderMime, watchLevel } from "./media";
import { joinTakes } from "./joinAudio";

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const PlayIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4v16l13-8z" />
  </svg>
);
const PauseIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);
const StopIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

function LevelMeter({ level }: { level: number }) {
  const bars = 12;
  const lit = Math.min(bars, Math.round(level * 120));
  return (
    <span className="x-level" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <i key={i} style={{ height: 4 + i, opacity: i < lit ? 1 : 0.2 }} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Microphone check (shown on the Speaking instructions screen)       */
/* ------------------------------------------------------------------ */

export function DeviceCheck({ onReady }: { onReady: () => void }) {
  const [state, setState] = useState<"idle" | "asking" | "ok" | "blocked">("idle");
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(false);

  useEffect(() => {
    if (state !== "ok" || !media.stream) return;
    return watchLevel(media.stream, (l) => {
      setLevel(l);
      if (l > 0.03) setHeard(true);
    });
  }, [state]);

  useEffect(() => {
    if (heard) onReady();
  }, [heard, onReady]);

  const ask = async () => {
    setState("asking");
    const m = await openDevices();
    setState(m.hasAudio ? "ok" : "blocked");
  };

  return (
    <div className="x-card" style={{ padding: 16, marginTop: 16 }}>
      <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Mic size={20} aria-hidden="true" /> Microphone check
      </h2>
      <p>Your answers are recorded. Allow your microphone, then say a few words to check the level.</p>
      {state === "idle" && (
        <button type="button" className="x-btn" onClick={ask}>
          Allow microphone
        </button>
      )}
      {state === "asking" && <p role="status">Waiting for your browser’s permission…</p>}
      {state === "ok" && (
        <span style={{ display: "flex", gap: 8, alignItems: "center" }} role="status">
          <Mic size={18} aria-hidden="true" /> <LevelMeter level={level} /> {heard ? "We can hear you" : "Say something"}
        </span>
      )}
      {state === "blocked" && (
        <div>
          <p>Your microphone is blocked, so your answers cannot be recorded. Allow it in the browser’s address bar and try again.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" className="x-btn" onClick={ask}>
              Try again
            </button>
            <button type="button" className="x-link-btn" onClick={onReady}>
              Continue without recording
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The flow: instructions, then one question at a time                */
/* ------------------------------------------------------------------ */

type Question = {
  partIndex: number;
  part: 1 | 2 | 3;
  /** Full question as the examiner asks it, for the summary. */
  text: string;
  /** Lead-in sentence shown above the question, e.g. "Let's talk about mornings." */
  lead: string | null;
  /** The question itself, shown as the heading. */
  ask: string;
  /** Examiner clips played when the question appears (a part's intro goes before its first question). */
  audio: string[];
  cue?: { bullets: string[]; final: string };
  prepSec: number;
  /** Seconds the bar fills towards, and the guide next to the clock. */
  target: number;
  guide: string;
  /** Recording stops itself here. */
  capSec: number;
};

/** How many questions each part asks in this simulator: 3 in Part 1, the cue card in Part 2, 2 in Part 3. */
const PER_PART: Record<1 | 3, number> = { 1: 3, 3: 2 };

function splitQuestion(text: string): { lead: string | null; ask: string } {
  // Headings carry no full stops: a lead-in sentence goes above the question instead.
  const cut = text.lastIndexOf(". ");
  if (cut > 0) return { lead: text.slice(0, cut + 1), ask: text.slice(cut + 2) };
  return { lead: null, ask: text.replace(/\.$/, "") };
}

function buildFlow(parts: Part[]) {
  const first = parts[0]?.speaking;
  const intro = first?.intro ? [first.intro] : [];
  const questions: Question[] = [];
  parts.forEach((p, partIndex) => {
    const sp = p.speaking;
    if (!sp) return;
    // The first part's intro is the instructions clip; later parts open with their own intro.
    const opener = partIndex > 0 && sp.intro ? [sp.intro.audio] : [];
    if (sp.part === 2 && sp.cueCard) {
      const topic = sp.cueCard.topic.replace(/\.$/, "");
      questions.push({
        partIndex,
        part: 2,
        text: topic,
        lead: null,
        ask: topic,
        audio: sp.intro ? [sp.intro.audio] : [],
        cue: { bullets: sp.cueCard.bullets, final: sp.cueCard.final },
        prepSec: sp.prepSec ?? 60,
        target: sp.talkSec ?? 120,
        guide: "aim for 1 to 2 minutes",
        capSec: sp.talkSec ?? 120,
      });
      return;
    }
    const n = sp.part === 3 ? PER_PART[3] : PER_PART[1];
    sp.questions.slice(0, n).forEach((q, i) => {
      questions.push({
        partIndex,
        part: sp.part,
        text: q.text,
        ...splitQuestion(q.text),
        audio: i === 0 ? [...opener, q.audio] : [q.audio],
        prepSec: 0,
        target: sp.part === 1 ? 30 : 60,
        guide: sp.part === 1 ? "aim for about 20 to 30 seconds" : "aim for about 1 minute",
        capSec: sp.part === 1 ? 90 : 120,
      });
    });
  });
  return { intro, questions };
}

/** Plays a list of clips one after another through one audio element. */
function useClipPlayer(volume: number) {
  const el = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const stop = useCallback(() => {
    const a = el.current;
    if (!a) return;
    a.onended = a.onerror = a.ontimeupdate = null;
    a.pause();
    setPlaying(false);
  }, []);
  const play = useCallback(
    (clips: string[], opts: { from?: number; onTime?: (index: number, t: number) => void; onDone?: (failed: boolean) => void } = {}) => {
      const a = (el.current ??= new Audio());
      stop();
      a.volume = volume;
      let i = opts.from ?? 0;
      const fail = () => {
        stop();
        opts.onDone?.(true);
      };
      const next = () => {
        if (i >= clips.length) {
          setPlaying(false);
          opts.onDone?.(false);
          return;
        }
        a.src = clips[i];
        a.ontimeupdate = () => opts.onTime?.(i, a.currentTime);
        a.onended = () => {
          opts.onTime?.(i, a.duration || 0);
          i += 1;
          next();
        };
        a.onerror = fail;
        void a.play().catch(fail);
      };
      setPlaying(true);
      if (!clips.length) {
        setPlaying(false);
        opts.onDone?.(false);
        return;
      }
      next();
    },
    [stop, volume],
  );
  const pause = useCallback(() => {
    el.current?.pause();
    setPlaying(false);
  }, []);
  const resume = useCallback(() => {
    if (!el.current) return;
    setPlaying(true);
    void el.current.play().catch(() => setPlaying(false));
  }, []);
  useEffect(() => {
    if (el.current) el.current.volume = volume;
  }, [volume]);
  useEffect(() => () => el.current?.pause(), []);
  return useMemo(() => ({ playing, play, pause, resume, stop }), [playing, play, pause, resume, stop]);
}

function useClipDurations(clips: string[]) {
  const [d, setD] = useState<number[]>(() => clips.map(() => 0));
  useEffect(() => {
    const els = clips.map((src, i) => {
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () =>
        setD((prev) => {
          const next = [...prev];
          next[i] = Number.isFinite(a.duration) ? a.duration : 0;
          return next;
        });
      a.src = src;
      return a;
    });
    return () => els.forEach((a) => (a.onloadedmetadata = null));
  }, [clips]);
  return d;
}

/* ------------------------------------------------------------------ */
/*  Step 1: the examiner's instructions                                */
/* ------------------------------------------------------------------ */

function Instructions({
  clips,
  words,
  volume,
  practice,
  onStart,
}: {
  clips: string[];
  words: string[];
  volume: number;
  practice: boolean;
  onStart: () => void;
}) {
  const player = useClipPlayer(volume);
  const durations = useClipDurations(clips);
  const total = durations.reduce((a, b) => a + b, 0);
  const [pos, setPos] = useState({ i: 0, t: 0 });
  const [done, setDone] = useState(clips.length === 0);
  // Stays true after the first full listen, so replaying does not lock Start again.
  const [heard, setHeard] = useState(clips.length === 0);
  const [failed, setFailed] = useState(false);
  const started = pos.i > 0 || pos.t > 0;
  const played = done ? total : durations.slice(0, pos.i).reduce((a, b) => a + b, 0) + pos.t;
  const pct = total ? Math.min(100, Math.round((played / total) * 100)) : done ? 100 : 0;

  const toggle = () => {
    if (player.playing) return player.pause();
    if (started && !done) return player.resume();
    setDone(false);
    setPos({ i: 0, t: 0 });
    player.play(clips, {
      onTime: (i, t) => setPos({ i, t }),
      onDone: (bad) => {
        setFailed(bad);
        setDone(true);
        setHeard(true);
      },
    });
  };

  return (
    <section aria-labelledby="intro-title">
      <h1 id="intro-title">Speaking test: instructions</h1>
      <p className="x-speak-lead">Listen to the examiner first. The questions appear when the instructions finish.</p>
      <div className="x-player">
        <div className="x-player-avatar" aria-hidden="true">
          <User size={34} strokeWidth={1.8} />
        </div>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>Examiner · introduction</div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" className="x-round-btn" onClick={toggle} aria-label={player.playing ? "Pause instructions" : "Play instructions"}>
              {player.playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="x-progress" role="progressbar" aria-label="Instructions audio" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <i style={{ width: `${pct}%` }} />
              </div>
              <div className="x-player-times">
                <span>{fmt(played)}</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="x-said">
        <div className="x-said-label">What the examiner says</div>
        {words.map((w) => (
          <p key={w}>{w}</p>
        ))}
      </div>
      <p className="x-speak-note">
        In <b>Part 1</b> the examiner asks about you. In <b>Part 2</b> you have one minute to prepare, then talk about a topic for one to two minutes. In{" "}
        <b>Part 3</b> you discuss more general questions. For each question, press <b>Record</b>, give your answer, then press <b>Stop</b>. You can listen
        back and record again before you submit.
      </p>
      <div className="x-speak-actions">
        <button type="button" className="x-primary" onClick={onStart} disabled={!heard}>
          Start the questions
        </button>
        <span role="status" className="x-speak-status">
          {failed
            ? "The recording could not play. Read the examiner’s words above, then start."
            : heard
              ? "Instructions finished. You can start."
              : "Press play and listen to the end to continue."}
        </span>
        {practice && !heard && (
          <button type="button" className="x-link-btn" onClick={onStart}>
            Skip the instructions
          </button>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  The room                                                           */
/* ------------------------------------------------------------------ */

type Take = { sec: number; blob: Blob | null; url: string | null };

/**
 * The Speaking test from the mitooni canvas: the examiner's instructions, then
 * one question at a time with a record button, a clock of how long the
 * candidate has spoken and a level wave, then a summary with Submit for
 * checking. Each answer is its own take; on submit the takes of each part are
 * joined into one recording and uploaded, which is what the feedback page plays.
 */
export function SpeakingRoom() {
  const s = useSession();
  const r = useRunner();
  const parts = s.section.parts;
  const flow = useMemo(() => buildFlow(parts), [parts]);
  const introClips = useMemo(() => flow.intro.map((q) => q.audio), [flow]);
  const questions = flow.questions;

  const [stage, setStage] = useState<"intro" | "question" | "done">("intro");
  const [qi, setQi] = useState(0);
  const [takes, setTakes] = useState<Record<number, Take>>({});
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mic, setMic] = useState(media.hasAudio);
  const [wave, setWave] = useState<number[]>(() => Array(16).fill(0));
  const [prepLeft, setPrepLeft] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const examiner = useClipPlayer(r.volume);
  const playback = useRef<HTMLAudioElement | null>(null);
  const [listening, setListening] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recStart = useRef(0);
  const urls = useRef<string[]>([]);

  const q = questions[qi];
  const take = takes[qi];

  /* microphone level for the wave */
  useEffect(() => {
    let stop: (() => void) | undefined;
    let alive = true;
    void openDevices().then((m) => {
      if (!alive) return;
      setMic(m.hasAudio);
      if (m.stream && m.hasAudio)
        stop = watchLevel(m.stream, (l) => {
          if (recorder.current) setWave((w) => [...w.slice(1), l]);
        });
    });
    return () => {
      alive = false;
      stop?.();
    };
  }, []);

  /* clean up on leave */
  useEffect(
    () => () => {
      const rec = recorder.current;
      if (rec && rec.state !== "inactive") {
        rec.onstop = null;
        rec.stop();
      }
      playback.current?.pause();
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const stopListening = useCallback(() => {
    playback.current?.pause();
    setListening(false);
  }, []);

  /* the examiner asks each question when it appears; Part 2 then gives a minute to prepare */
  useEffect(() => {
    if (stage !== "question" || !q) return;
    setPrepLeft(null);
    examiner.play(q.audio, { onDone: () => q.prepSec && setPrepLeft(q.prepSec) });
    return () => examiner.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, qi]);

  useEffect(() => {
    if (prepLeft === null || prepLeft <= 0 || recording) return;
    const id = window.setTimeout(() => setPrepLeft((p) => (p === null ? p : p - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [prepLeft, recording]);

  const stopRecording = useCallback(() => {
    const rec = recorder.current;
    if (!rec) return;
    recorder.current = null;
    const at = qi;
    const sec = Math.max(1, Math.round((Date.now() - recStart.current) / 1000));
    setRecording(false);
    setTakes((t) => ({ ...t, [at]: { sec, blob: null, url: null } }));
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      setTakes((t) => (t[at] ? { ...t, [at]: { sec, blob, url } } : t));
    };
    if (rec.state !== "inactive") rec.stop();
  }, [qi]);

  const startRecording = useCallback(() => {
    if (!media.stream || !media.hasAudio || typeof MediaRecorder === "undefined") return;
    examiner.stop();
    stopListening();
    setPrepLeft(null);
    const mime = recorderMime();
    const rec = new MediaRecorder(new MediaStream(media.stream.getAudioTracks()), mime ? { mimeType: mime } : undefined);
    chunks.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data);
    };
    rec.start(250);
    recorder.current = rec;
    recStart.current = Date.now();
    setElapsed(0);
    setRecording(true);
  }, [examiner, stopListening]);

  /* the clock counts up while recording and stops the take at the cap */
  useEffect(() => {
    if (!recording || !q) return;
    const id = window.setInterval(() => {
      const sec = (Date.now() - recStart.current) / 1000;
      setElapsed(Math.floor(sec));
      if (sec >= q.capSec) stopRecording();
    }, 200);
    return () => window.clearInterval(id);
  }, [recording, q, stopRecording]);

  const recordAgain = () => {
    stopListening();
    const old = takes[qi];
    if (old?.url) URL.revokeObjectURL(old.url);
    setTakes((t) => {
      const rest = { ...t };
      delete rest[qi];
      return rest;
    });
    setElapsed(0);
  };

  const listenBack = () => {
    if (!take?.url) return;
    if (listening) return stopListening();
    examiner.stop();
    const a = (playback.current ??= new Audio());
    a.src = take.url;
    a.volume = r.volume;
    a.onended = () => setListening(false);
    setListening(true);
    void a.play().catch(() => setListening(false));
  };

  const next = () => {
    if (recording) stopRecording();
    stopListening();
    examiner.stop();
    setElapsed(0);
    if (qi + 1 < questions.length) {
      const nxt = questions[qi + 1];
      if (nxt.partIndex !== q.partIndex) s.goToPart(nxt.partIndex);
      setQi(qi + 1);
    } else {
      setStage("done");
    }
  };

  /* Options > Go to submission page jumps to the summary */
  useEffect(() => {
    if (!r.summaryRequest) return;
    if (recorder.current) stopRecording();
    examiner.stop();
    setStage("done");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.summaryRequest]);

  const startAgain = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    setTakes({});
    setElapsed(0);
    setNotes("");
    setError(null);
    if (questions[0] && questions[0].partIndex !== s.state.currentPart) s.goToPart(questions[0].partIndex);
    setQi(0);
    setStage("question");
  };

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      // Save anything pending first so an older state cannot overwrite the recordings below.
      await s.flush();
      for (const [pi, part] of parts.entries()) {
        const list = questions.flatMap((x, i) => (x.partIndex === pi && takes[i]?.blob ? [takes[i]] : []));
        if (!list.length) continue;
        const blob = await joinTakes(list.map((t) => t.blob!));
        const sec = list.reduce((n, t) => n + t.sec, 0);
        const res = await uploadRecording(s.attempt.id, part.id, blob, sec);
        s.setRecording(part.id, res.key, res.durationSec);
      }
      await new Promise((ok) => window.setTimeout(ok, 50));
      if (await r.submitSection()) setSubmitted(true);
    } catch {
      setError("Your recordings could not be sent. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const headerLabel = stage === "intro" ? "Speaking · Instructions" : stage === "question" && q ? `Speaking · Part ${q.part} of 3` : "Speaking · Finished";
  const header = (
    <ExamHeader
      candidate={r.candidate}
      practice={s.practice}
      onOptions={r.openOptions}
      messagesButton={false}
      bordered
      centre={<span className="x-clock">{headerLabel}</span>}
    />
  );

  if (stage === "intro" || !q) {
    return (
      <>
        {header}
        <main className="x-speak">
          <div className="x-speak-inner">
            <Instructions
              clips={introClips}
              words={flow.intro.map((x) => x.text)}
              volume={r.volume}
              practice={s.practice}
              onStart={() => {
                setQi(0);
                setStage("question");
              }}
            />
          </div>
        </main>
      </>
    );
  }

  if (stage === "done") {
    const total = questions.reduce((n, _x, i) => n + (takes[i]?.sec ?? 0), 0);
    return (
      <>
        {header}
        <main className="x-speak">
          <div className="x-speak-inner">
            <section aria-labelledby="done-title">
              <h1 id="done-title">{submitted ? "Submitted for checking" : "Check your answers"}</h1>
              <p className="x-speak-lead">
                {submitted
                  ? "Your recordings have been sent for marking. Your Speaking band and feedback are ready."
                  : "Here is how long you spoke for each question. Submit when you are ready."}
              </p>
              <ol className="x-speak-summary">
                {questions.map((x, i) => (
                  <li key={i}>
                    <span className="x-speak-summary-part">Part {x.part}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{x.text}</span>
                    <span className="x-speak-summary-time">
                      <Clock size={14} strokeWidth={2} aria-hidden="true" />
                      <span className="sr-only">Time spoken: </span>
                      {fmt(takes[i]?.sec ?? 0)}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="x-speak-total">
                Total speaking time: <b>{fmt(total)}</b>
              </div>
              {error && (
                <p role="alert" className="x-speak-error">
                  {error}
                </p>
              )}
              <div className="x-speak-actions">
                {submitted ? (
                  <Link to={`/app/results/${s.attempt.id}/speaking`} className="x-primary">
                    See your feedback
                  </Link>
                ) : (
                  <>
                    <button type="button" className="x-primary" onClick={() => void submit()} disabled={sending}>
                      {sending ? "Sending…" : "Submit for checking"}
                    </button>
                    <button type="button" className="x-outline" onClick={startAgain} disabled={sending}>
                      Start again
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }

  const shown = recording ? elapsed : (take?.sec ?? 0);
  const pct = Math.min(100, Math.round((shown / q.target) * 100));
  const hasTake = !!take && !recording;
  const canSkip = s.practice || !mic;
  const status = recording
    ? "Recording… press stop when you finish"
    : take
      ? "Recorded. Listen back, record again or continue."
      : examiner.playing
        ? "The examiner is asking the question"
        : !mic
          ? "No microphone: answers are not recorded. Use Next question to move on."
          : q.cue && prepLeft !== null && prepLeft > 0
            ? "Prepare your talk. Press the red button when you are ready"
            : "Press the red button and start speaking";

  return (
    <>
      {header}
      <main className="x-speak">
        <div className="x-speak-inner">
          <section aria-labelledby="q-title">
            <div className="x-speak-meta">
              <span className="x-part-chip">Part {q.part}</span>
              <span className="x-speak-count">
                Question {qi + 1} of {questions.length}
              </span>
            </div>
            <div className="x-qbar" role="progressbar" aria-label="Test progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={qi + 1}>
              <i style={{ width: `${Math.round(((qi + 1) / questions.length) * 100)}%` }} />
            </div>

            <div className="x-qcard">
              {q.lead && <p className="x-qcard-lead">{q.lead}</p>}
              <h1 id="q-title">{q.ask}</h1>
              {q.cue && (
                <>
                  <div style={{ marginTop: 10 }}>
                    You should say:
                    <ul>
                      {q.cue.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    {q.cue.final}
                  </div>
                  <p className="x-qcard-hint">
                    You have one minute to prepare. You can make notes.
                    {prepLeft !== null && !take && !recording && (
                      <>
                        {" "}
                        <b role="timer" aria-live="off">
                          {prepLeft > 0 ? `${fmt(prepLeft)} left` : "Time to speak"}
                        </b>
                      </>
                    )}
                  </p>
                  <label htmlFor="cue-notes" className="x-qcard-notes-label">
                    Notes
                  </label>
                  <textarea id="cue-notes" className="x-cue-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </>
              )}
            </div>

            <div className="x-recbox">
              <button
                type="button"
                className={`x-rec-btn ${recording ? "on" : ""}`}
                onClick={recording ? stopRecording : startRecording}
                disabled={!mic}
                aria-label={recording ? "Stop recording" : "Start recording"}
              >
                {recording ? <StopIcon /> : mic ? <Mic size={26} strokeWidth={2} aria-hidden="true" /> : <MicOff size={26} strokeWidth={2} aria-hidden="true" />}
              </button>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div className="x-speak-status" role="status" aria-live="polite">
                  {status}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span className="x-spoke" role="timer" aria-label="Time spoken">
                    {fmt(shown)}
                  </span>
                  <span className="x-speak-status">{q.guide}</span>
                </div>
                <div className={`x-spokebar ${recording ? "live" : ""}`} aria-hidden="true">
                  <i style={{ width: `${pct}%` }} />
                </div>
                {recording && (
                  <div className="x-wave" aria-hidden="true">
                    {wave.map((l, i) => (
                      // Square root so quiet speech still moves the bars.
                      <i key={i} style={{ transform: `scaleY(${Math.min(1, 0.2 + Math.sqrt(l) * 2.2)})` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(hasTake || canSkip) && (
              <div className="x-take">
                {hasTake && (
                  <>
                    <button type="button" className="x-take-play" onClick={listenBack} disabled={!take.url} aria-pressed={listening}>
                      {listening ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                      Your answer · {fmt(take.sec)}
                    </button>
                    <button type="button" className="x-outline" onClick={recordAgain}>
                      Record again
                    </button>
                  </>
                )}
                {s.practice && !recording && (
                  <button type="button" className="x-link-btn" onClick={() => examiner.play(q.audio)}>
                    Hear the question again
                  </button>
                )}
                {(hasTake || (canSkip && !recording)) && (
                  <button type="button" className="x-primary x-take-next" onClick={next}>
                    {qi + 1 < questions.length ? (hasTake || !mic ? "Next question" : "Skip this question") : "Finish"}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
