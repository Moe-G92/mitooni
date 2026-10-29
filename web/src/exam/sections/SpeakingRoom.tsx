import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, User, Video, VideoOff } from "lucide-react";
import type { Part, SpeakingQuestion } from "@/api/schemas";
import { uploadRecording } from "@/api/queries";
import { useSession } from "../engine/session";
import { useRunner } from "../engine/runner";
import { ExamHeader } from "../chrome/ExamHeader";
import { media, openDevices, recorderMime, watchLevel } from "./media";

/* ------------------------------------------------------------------ */
/*  Device check (shown on the Speaking instructions screen)          */
/* ------------------------------------------------------------------ */

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

export function DeviceCheck({ onReady }: { onReady: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "asking" | "ok" | "audio-only" | "blocked">("idle");
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(false);

  useEffect(() => {
    if (state !== "ok" && state !== "audio-only") return;
    if (video.current && media.stream && media.hasVideo) video.current.srcObject = media.stream;
    if (!media.stream) return;
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
    setState(!m.hasAudio ? "blocked" : m.hasVideo ? "ok" : "audio-only");
  };

  return (
    <div className="x-card" style={{ padding: 16, marginTop: 16 }}>
      <h2>Camera and microphone check</h2>
      <p>The Speaking test is a video call with an examiner. Allow your camera and microphone, then say a few words to check the level.</p>
      {state === "idle" && (
        <button type="button" className="x-btn" onClick={ask}>
          Allow camera and microphone
        </button>
      )}
      {state === "asking" && <p role="status">Waiting for your browser’s permission…</p>}
      {(state === "ok" || state === "audio-only") && (
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          {state === "ok" ? (
            <video ref={video} autoPlay muted playsInline style={{ width: 200, borderRadius: 4, transform: "scaleX(-1)", background: "#000" }} />
          ) : (
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <VideoOff size={18} aria-hidden="true" /> No camera found. You can continue with audio only.
            </span>
          )}
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Mic size={18} aria-hidden="true" /> <LevelMeter level={level} /> {heard ? "We can hear you" : "Say something"}
          </span>
        </div>
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
/*  The room                                                           */
/* ------------------------------------------------------------------ */

type Step =
  | { kind: "examiner"; partIndex: number; q: SpeakingQuestion; answerSec: number | null }
  | { kind: "answer"; partIndex: number; q: SpeakingQuestion; maxSec: number }
  | { kind: "prep"; partIndex: number; sec: number }
  | { kind: "talk"; partIndex: number; sec: number };

function stepsFor(part: Part, partIndex: number): Step[] {
  const sp = part.speaking!;
  const out: Step[] = [];
  if (sp.intro) out.push({ kind: "examiner", partIndex, q: sp.intro, answerSec: sp.part === 1 ? sp.maxAnswerSec : null });
  if (sp.intro && sp.part === 1) out.push({ kind: "answer", partIndex, q: sp.intro, maxSec: 20 });
  if (sp.cueCard) {
    out.push({ kind: "prep", partIndex, sec: sp.prepSec ?? 60 });
    out.push({ kind: "talk", partIndex, sec: sp.talkSec ?? 120 });
  }
  for (const q of sp.questions) {
    out.push({ kind: "examiner", partIndex, q, answerSec: sp.maxAnswerSec });
    out.push({ kind: "answer", partIndex, q, maxSec: sp.cueCard ? 30 : sp.maxAnswerSec });
  }
  return out;
}

const SILENCE_TO_ADVANCE = 2.6; // seconds of quiet after speaking before the examiner moves on
const SPEECH_LEVEL = 0.025;

/**
 * IELTS Online-style Speaking room: examiner tile, your camera tile and a side
 * panel with the status, the Part 2 cue card and timers. Each part is recorded
 * and uploaded when the part ends.
 */
export function SpeakingRoom() {
  const s = useSession();
  const r = useRunner();
  const parts = s.section.parts;
  const steps = useMemo(() => parts.flatMap((p, i) => stepsFor(p, i)), [parts]);
  const startIndex = steps.findIndex((st) => st.partIndex === s.state.currentPart);
  const [i, setI] = useState(Math.max(0, startIndex));
  const [examinerTalking, setExaminerTalking] = useState(false);
  const [left, setLeft] = useState(0);
  const [level, setLevel] = useState(0);
  const [captions, setCaptions] = useState(s.practice);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recStart = useRef(0);
  const vad = useRef({ spoken: 0, silent: 0 });
  const step = steps[i];
  const part = parts[step?.partIndex ?? 0];

  /* camera and level meter */
  useEffect(() => {
    let stop: (() => void) | undefined;
    void openDevices().then((m) => {
      if (video.current && m.stream && m.hasVideo) video.current.srcObject = m.stream;
      if (m.stream && m.hasAudio) stop = watchLevel(m.stream, setLevel);
    });
    return () => {
      stop?.();
      audio.current?.pause();
    };
  }, []);

  /* recording: one file per part */
  const startRecording = useCallback(() => {
    if (!media.stream || !media.hasAudio || typeof MediaRecorder === "undefined") return;
    const audioOnly = new MediaStream(media.stream.getAudioTracks());
    const rec = new MediaRecorder(audioOnly, recorderMime() ? { mimeType: recorderMime() } : undefined);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.start(1000);
    recorder.current = rec;
    recStart.current = Date.now();
  }, []);

  const stopRecording = useCallback(
    (partId: string) =>
      new Promise<void>((resolve) => {
        const rec = recorder.current;
        if (!rec || rec.state === "inactive") return resolve();
        rec.onstop = async () => {
          const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
          const durationSec = Math.round((Date.now() - recStart.current) / 1000);
          setUploading(true);
          try {
            const res = await uploadRecording(s.attempt.id, partId, blob, durationSec);
            s.setRecording(partId, res.key, res.durationSec);
          } finally {
            setUploading(false);
            resolve();
          }
        };
        rec.stop();
        recorder.current = null;
      }),
    [s],
  );

  const advance = useCallback(async () => {
    const cur = steps[i];
    const nxt = steps[i + 1];
    if (!nxt || nxt.partIndex !== cur.partIndex) {
      await stopRecording(parts[cur.partIndex].id);
      if (!nxt) {
        r.finish();
        return;
      }
      s.goToPart(nxt.partIndex);
    }
    setI(i + 1);
  }, [i, steps, parts, stopRecording, r, s]);

  /* run the current step */
  useEffect(() => {
    if (!step) return;
    vad.current = { spoken: 0, silent: 0 };
    if (step.kind === "examiner") {
      if (!recorder.current) startRecording();
      const el = (audio.current ??= new Audio());
      el.src = step.q.audio;
      el.volume = r.volume;
      setExaminerTalking(true);
      let fallback: number | undefined;
      // If the audio cannot play (blocked autoplay, missing file), show the words and
      // give the candidate time to read them instead of skipping the question.
      const silentFallback = () => {
        if (fallback) return;
        setCaptions(true);
        const words = step.q.text.split(/\s+/).length;
        fallback = window.setTimeout(() => {
          setExaminerTalking(false);
          void advance();
        }, Math.max(3000, words * 380));
      };
      el.onended = () => {
        setExaminerTalking(false);
        void advance();
      };
      el.onerror = silentFallback;
      void el.play().catch(silentFallback);
      return () => {
        el.onended = null;
        el.onerror = null;
        if (fallback) window.clearTimeout(fallback);
      };
    }
    if (!recorder.current && step.kind !== "prep") startRecording();
    const total = step.kind === "answer" ? step.maxSec : step.sec;
    setLeft(total);
    const started = Date.now();
    const id = window.setInterval(() => {
      const remaining = Math.max(0, total - (Date.now() - started) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        void advance();
      }
    }, 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  /* move on after the candidate stops talking */
  useEffect(() => {
    if (step?.kind !== "answer" && step?.kind !== "talk") return;
    if (level > SPEECH_LEVEL) {
      vad.current.spoken += 0.1;
      vad.current.silent = 0;
    } else if (vad.current.spoken > 1.5) {
      vad.current.silent += 0.1;
      const needed = step.kind === "talk" ? SILENCE_TO_ADVANCE * 2 : SILENCE_TO_ADVANCE;
      if (vad.current.silent >= needed) {
        vad.current = { spoken: 0, silent: 0 };
        void advance();
      }
    }
  }, [level, step, advance]);

  if (!step) return null;
  const sp = part.speaking!;
  const status =
    step.kind === "examiner"
      ? "The examiner is speaking"
      : step.kind === "answer"
        ? "Your turn. Answer now"
        : step.kind === "prep"
          ? "Prepare your talk. You can make notes"
          : "Please start speaking now";
  const total = step.kind === "answer" ? step.maxSec : step.kind === "examiner" ? 1 : step.sec;
  const recording = !!recorder.current && step.kind !== "prep";
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60);

  return (
    <>
      <ExamHeader
        candidate={r.candidate}
        practice={s.practice}
        onOptions={r.openOptions}
        centre={<span className="x-clock">Speaking, Part {sp.part} of 3</span>}
      />
      <main className="x-call">
        <div className="x-tiles">
          <div className="x-tile" aria-label="Examiner">
            <div className={`x-avatar ${examinerTalking ? "speaking" : ""}`}>
              <User aria-hidden="true" />
            </div>
            <span className="x-tile-label">
              <Mic size={14} aria-hidden="true" /> Examiner
            </span>
            {captions && step.kind === "examiner" && (
              <div style={{ position: "absolute", bottom: 48, left: 16, right: 16, background: "rgba(0,0,0,0.7)", padding: "8px 12px", borderRadius: 4, textAlign: "center" }}>
                {step.q.text}
              </div>
            )}
          </div>
          <div className="x-tile x-self" aria-label="You">
            {media.hasVideo ? (
              <video ref={video} autoPlay muted playsInline />
            ) : (
              <div className="x-avatar" style={{ width: 80, height: 80, fontSize: 28 }}>
                {r.candidate
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
            <span className="x-tile-label">
              {recording && <i className="x-rec" aria-hidden="true" />}
              {media.hasAudio ? <LevelMeter level={level} /> : <MicOff size={14} aria-hidden="true" />}
              You{recording ? ", recording" : ""}
              {!media.hasVideo && <VideoOff size={14} aria-hidden="true" />}
              {media.hasVideo && <Video size={14} aria-hidden="true" className="sr-only" />}
            </span>
          </div>
        </div>
        <aside className="x-side" aria-label="Test panel">
          <div className="x-side-head">Part {sp.part}</div>
          <div className="x-side-body">
            <div className="x-status" role="status" aria-live="polite">
              {status}
            </div>
            {step.kind !== "examiner" && (
              <div className="x-timebar" aria-hidden="true">
                <i style={{ width: `${(left / total) * 100}%` }} />
              </div>
            )}
            {(step.kind === "prep" || step.kind === "talk") && sp.cueCard && (
              <>
                <div className="x-big-clock" role="timer">
                  {mm}:{String(ss).padStart(2, "0")}
                </div>
                <div className="x-cue">
                  <h3>{sp.cueCard.topic}</h3>
                  You should say:
                  <ul>
                    {sp.cueCard.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {sp.cueCard.final}
                </div>
                <label htmlFor="cue-notes" style={{ fontWeight: 700 }}>
                  Notes
                </label>
                <textarea
                  id="cue-notes"
                  className="x-textarea"
                  style={{ minHeight: 120 }}
                  value={notes}
                  readOnly={step.kind === "talk"}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </>
            )}
            {uploading && <p role="status">Saving your recording…</p>}
            {!media.hasAudio && <p className="x-practice-note">No microphone: answers are not recorded. Use Next to move on.</p>}
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, fontSize: 14 }}>
              <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} />
              Show the examiner’s words
            </label>
            {(s.practice || !media.hasAudio) && (
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {step.kind !== "examiner" && step.kind !== "prep" && (
                  <button type="button" className="x-btn" onClick={() => setI((x) => Math.max(0, x - 1))}>
                    Repeat question
                  </button>
                )}
                <button type="button" className="x-btn primary" onClick={() => void advance()}>
                  {step.kind === "prep" ? "Start talking now" : "Next"}
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>
    </>
  );
}
