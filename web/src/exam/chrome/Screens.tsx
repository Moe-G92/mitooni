import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Headphones, Play, Send, Volume2 } from "lucide-react";
import type { Attempt, Section, Skill } from "@/api/schemas";
import { numbersLabel } from "@/lib/utils";
import { buildIndex, candidateNumber, isAnswered, partProgress } from "../engine/model";


/** "Confirm your details", shown before the first section of an exam-mode attempt. */
export function ConfirmScreen({ name, attempt, onConfirm, onLeave }: { name: string; attempt: Attempt; onConfirm: () => void; onLeave: () => void }) {
  return (
    <div className="x-screen">
      <div className="x-screen-inner">
        <h1>Confirm your details</h1>
        <dl>
          <dt>Name</dt>
          <dd>{name}</dd>
          <dt>Candidate number</dt>
          <dd>{candidateNumber(attempt)}</dd>
          <dt>Test</dt>
          <dd>IELTS Academic</dd>
          <dt>Date</dt>
          <dd>{new Date(attempt.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
          {attempt.accommodation !== 1 && (
            <>
              <dt>Extra time</dt>
              <dd>x{attempt.accommodation}</dd>
            </>
          )}
        </dl>
        <p>If your details are not correct, please inform the invigilator.</p>
        <div className="x-screen-actions">
          <button type="button" className="x-big-btn" onClick={onConfirm}>
            My details are correct <ArrowRight aria-hidden="true" />
          </button>
          <button type="button" className="x-link-btn" onClick={onLeave}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

const INFO: Record<Skill, { title: string; time: (min: number) => string; instructions: string[]; information: string[] }> = {
  listening: {
    title: "IELTS Academic Listening",
    time: (m) => `Approximately ${m} minutes`,
    instructions: [
      "Answer all the questions.",
      "You can change your answers at any time during the test.",
      "You will hear each recording once only.",
      "You will have time to read the questions before you listen and two minutes to check your answers at the end.",
    ],
    information: ["There are 40 questions in this test.", "Each question carries one mark.", "There are four parts to the test.", "You will not be able to pause or rewind the audio."],
  },
  reading: {
    title: "IELTS Academic Reading",
    time: () => "1 hour",
    instructions: ["Answer all the questions.", "You can change your answers at any time during the test."],
    information: ["There are 40 questions in this test.", "Each question carries one mark.", "There are three parts to the test.", "The test clock will show you when there are 10 minutes and 5 minutes remaining."],
  },
  writing: {
    title: "IELTS Academic Writing",
    time: () => "1 hour",
    instructions: ["Answer both parts.", "You can change your answers at any time during the test."],
    information: ["There are two parts in this test.", "Part 2 contributes twice as much as Part 1 to the writing score.", "The test clock will show you when there are 10 minutes and 5 minutes remaining."],
  },
  speaking: {
    title: "IELTS Speaking",
    time: () => "11 to 14 minutes",
    instructions: [
      "The examiner will ask you questions. Answer naturally and in full.",
      "In Part 2 you will have one minute to prepare and can make notes on screen.",
      "Your answers are recorded.",
    ],
    information: ["There are three parts to the test.", "This simulator plays recorded examiner questions and moves on when you finish speaking."],
  },
};

/** Section instructions and Start test, with a sound check before Listening. */
export function IntroScreen({
  section,
  practice,
  accommodation,
  onStart,
  children,
  startDisabled,
}: {
  section: Section;
  practice: boolean;
  accommodation: number;
  onStart: () => void;
  children?: ReactNode;
  startDisabled?: boolean;
}) {
  const info = INFO[section.skill];
  const minutes = Math.round((section.durationSec * accommodation) / 60);
  return (
    <div className="x-screen">
      <div className="x-screen-inner">
        <h1>{practice ? `Practice: ${section.title}` : info.title}</h1>
        <p>
          <b>Time:</b> {practice && section.parts.length === 1 ? `About ${minutes} minutes` : info.time(minutes)}
          {accommodation !== 1 && ` (includes x${accommodation} extra time)`}
        </p>
        <h2>Instructions to candidates</h2>
        <ul>
          {info.instructions.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {!(practice && section.parts.length === 1) && (
          <>
            <h2>Information for candidates</h2>
            <ul>
              {info.information.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </>
        )}
        {practice && (
          <p className="x-practice-note">
            {section.skill === "speaking"
              ? "Practice mode: you can repeat a question, skip ahead and read the examiner's words. None of this happens in the real test."
              : section.skill === "writing"
                ? "Practice mode: you can keep writing after the clock runs out and see a word target. None of this happens in the real test."
                : `Practice mode: you can check answers as you go${section.skill === "listening" ? ", pause the audio" : ""} and keep working after the clock runs out. None of this happens in the real test.`}
          </p>
        )}
        {children}
        <div className="x-screen-actions">
          <button type="button" className="x-big-btn" onClick={onStart} disabled={startDisabled}>
            Start test <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Listening sound check: plays a short sample with a volume slider. */
export function SoundCheck({ sample, volume, onVolume, onHeard }: { sample: string; volume: number; onVolume: (v: number) => void; onHeard: () => void }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);
  useEffect(() => () => audio.current?.pause(), []);
  return (
    <div className="x-card" style={{ padding: 16, marginTop: 16 }}>
      <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Headphones size={20} aria-hidden="true" /> Sound check
      </h2>
      <p>Put on your headphones and press Play sound. Adjust the volume until you can hear clearly.</p>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="x-btn"
          onClick={() => {
            if (!audio.current) audio.current = new Audio(sample);
            audio.current.volume = volume;
            audio.current.currentTime = 0;
            void audio.current.play();
            setPlaying(true);
            audio.current.onended = () => setPlaying(false);
          }}
        >
          <Play size={14} aria-hidden="true" style={{ display: "inline", marginRight: 6 }} />
          {playing ? "Playing…" : "Play sound"}
        </button>
        <label className="x-volume">
          <Volume2 size={18} aria-hidden="true" />
          <span className="sr-only">Volume</span>
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => onVolume(Number(e.target.value))} />
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={heard}
            onChange={(e) => {
              setHeard(e.target.checked);
              if (e.target.checked) onHeard();
            }}
          />
          I can hear the sound clearly
        </label>
      </div>
    </div>
  );
}

/** The submission page: official "Click next to continue", plus a summary of what is unanswered. */
export function SubmissionScreen({
  section,
  answers,
  flags,
  essays,
  canGoBack,
  busy,
  onBack,
  onSubmit,
  isLast,
}: {
  section: Section;
  answers: Record<string, unknown>;
  flags: number[];
  essays: Record<string, string>;
  canGoBack: boolean;
  busy: boolean;
  onBack: () => void;
  onSubmit: () => void;
  isLast: boolean;
}) {
  const index = buildIndex(section);
  const unanswered = index.filter((e) => !isAnswered(answers[e.itemId] as never));
  return (
    <div className="x-screen">
      <div className="x-screen-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <h1 style={{ margin: 0 }}>{isLast ? "Submit your answers" : "Click next to continue"}</h1>
          <button type="button" className="x-big-btn" onClick={onSubmit} disabled={busy}>
            <Send aria-hidden="true" /> {busy ? "Submitting…" : "Next"}
          </button>
        </div>
        <table className="x-summary-table">
          <thead>
            <tr>
              <th>Part</th>
              <th>{section.skill === "writing" ? "Words" : "Attempted"}</th>
            </tr>
          </thead>
          <tbody>
            {section.parts.map((p, i) => {
              const prog = partProgress(index, i, answers as never);
              return (
                <tr key={p.id}>
                  <td>Part {p.number}</td>
                  <td>
                    {section.skill === "writing"
                      ? `${(essays[p.id] ?? "").trim() ? (essays[p.id] ?? "").trim().split(/\s+/).length : 0} words`
                      : `${prog.done} of ${prog.total}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {unanswered.length > 0 && (
          <p>
            <b>Not attempted:</b> {unanswered.map((e) => numbersLabel(e.numbers)).join(", ")}
          </p>
        )}
        {flags.length > 0 && (
          <p>
            <b>Marked for review:</b> {flags.sort((a, b) => a - b).join(", ")}
          </p>
        )}
        <p>Once you continue, you cannot return to this section.</p>
        {canGoBack && (
          <div className="x-screen-actions">
            <button type="button" className="x-link-btn" onClick={onBack}>
              Back to the questions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
