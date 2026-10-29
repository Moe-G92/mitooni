import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, Rewind, Volume2 } from "lucide-react";
import { useSession } from "../engine/session";
import { useRunner } from "../engine/runner";
import { ExamHeader, PartBanner } from "../chrome/ExamHeader";
import { Navigator } from "../chrome/Navigator";
import { NotesSidebar, SelectionPopover } from "../chrome/Highlighting";
import { QuestionGroupView } from "../widgets/QuestionGroupView";

type AudioState = "waiting" | "playing" | "paused" | "finished";

/**
 * Academic Listening. Exam mode copies the official flow: a headphones notice
 * with Play, then the recording runs once with no controls, "Audio is
 * Playing" in the header, and two minutes to check at the end. The visible
 * part follows the recording. Practice mode adds pause, rewind and restart.
 */
export function ListeningSection() {
  const s = useSession();
  const r = useRunner();
  const parts = s.section.parts;
  const part = parts[s.state.currentPart] ?? parts[0];
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(0);
  const [status, setStatus] = useState<AudioState>("waiting");

  const allowed = Math.round(s.section.durationSec * s.attempt.accommodation);

  useEffect(() => {
    if (audio.current) audio.current.volume = r.volume;
  }, [r.volume]);

  useEffect(() => () => audio.current?.pause(), []);

  const loadPart = (i: number, offset = 0, autoplay = true) => {
    const p = parts[i];
    if (!p?.audio) {
      setStatus("finished");
      return;
    }
    if (!audio.current) audio.current = new Audio();
    const el = audio.current;
    el.src = p.audio.src;
    el.volume = r.volume;
    el.onended = () => {
      if (i + 1 < parts.length) loadPart(i + 1);
      else setStatus("finished");
    };
    el.onplay = () => setStatus("playing");
    el.onpause = () => !el.ended && setStatus("paused");
    const start = () => {
      el.currentTime = Math.min(offset, Math.max(0, (p.audio?.durationSec ?? 0) - 0.5));
      if (autoplay) void el.play();
    };
    if (el.readyState >= 1) start();
    else el.onloadedmetadata = start;
    setPlaying(i);
    if (!s.practice) s.goToPart(i);
  };

  /** Where the recording should be, from how long the section has been running. */
  const resumePosition = () => {
    let elapsed = Math.max(0, allowed - r.remaining);
    for (let i = 0; i < parts.length; i++) {
      const d = parts[i].audio?.durationSec ?? 0;
      if (elapsed < d) return { i, offset: elapsed };
      elapsed -= d;
    }
    return null;
  };

  const begin = () => {
    r.startClock();
    if (s.practice) {
      loadPart(s.state.currentPart);
      return;
    }
    const pos = resumePosition();
    if (pos) loadPart(pos.i, pos.offset);
    else setStatus("finished");
  };

  const audioStatus =
    status === "playing" ? (
      <span className="x-audio-status">
        <Volume2 size={14} aria-hidden="true" /> Audio is Playing
      </span>
    ) : status === "finished" ? (
      <span className="x-audio-status">Audio has finished. Check your answers.</span>
    ) : status === "paused" ? (
      <span className="x-audio-status">Audio paused (practice)</span>
    ) : null;

  return (
    <>
      <ExamHeader
        candidate={r.candidate}
        remaining={r.clockStarted && !r.noTimeLimit ? r.remaining : undefined}
        practice={s.practice}
        audioStatus={audioStatus}
        onOptions={r.openOptions}
        onToggleNotes={() => s.setNotesOpen(!s.notesOpen)}
        notesOpen={s.notesOpen}
        extra={
          <label className="x-volume" title="Volume">
            <Volume2 size={18} aria-hidden="true" />
            <span className="sr-only">Volume</span>
            <input type="range" min={0} max={1} step={0.05} value={r.volume} onChange={(e) => r.setVolume(Number(e.target.value))} />
          </label>
        }
      />
      <PartBanner number={part.number} rubric={part.rubric} />
      {s.practice && status !== "waiting" && (
        <div className="x-banner" style={{ minHeight: 0, padding: "8px 24px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--x-muted)" }}>Practice controls (not in the real test):</span>
          <button type="button" className="x-btn" onClick={() => (status === "playing" ? audio.current?.pause() : void audio.current?.play())}>
            {status === "playing" ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            <span style={{ marginLeft: 6 }}>{status === "playing" ? "Pause" : "Play"}</span>
          </button>
          <button type="button" className="x-btn" onClick={() => audio.current && (audio.current.currentTime = Math.max(0, audio.current.currentTime - 10))}>
            <Rewind size={14} aria-hidden="true" /> <span style={{ marginLeft: 6 }}>Back 10 seconds</span>
          </button>
          <button type="button" className="x-btn" onClick={() => loadPart(s.state.currentPart)}>
            <RotateCcw size={14} aria-hidden="true" /> <span style={{ marginLeft: 6 }}>Play Part {part.number} from the start</span>
          </button>
          {playing !== s.state.currentPart && <span style={{ fontSize: 13 }}>Now playing Part {parts[playing].number}</span>}
        </div>
      )}
      <main className="x-main x-listening">
        <div className="x-pane x-pane-single">
          {part.groups.map((g) => (
            <QuestionGroupView key={g.id} group={g} />
          ))}
        </div>
        {s.notesOpen && <NotesSidebar />}
        {status === "waiting" && (
          <div className="x-modal-back">
            <div className="x-modal" role="dialog" aria-modal="true" aria-labelledby="listen-title">
              <Headphones className="x-modal-icon" aria-hidden="true" />
              <p id="listen-title">
                {r.clockStarted || s.attempt.sections[s.attempt.sectionIndex].startedAt
                  ? "Your test was interrupted. The recording will continue from where the clock is now."
                  : "You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions."}
              </p>
              <p>To continue, click Play.</p>
              <button type="button" className="x-play" onClick={begin} autoFocus>
                <Play aria-hidden="true" /> Play
              </button>
            </div>
          </div>
        )}
      </main>
      <Navigator onFinish={r.finish} />
      <SelectionPopover />
    </>
  );
}
