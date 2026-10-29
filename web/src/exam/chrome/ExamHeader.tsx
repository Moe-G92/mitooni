import { useState, type ReactNode } from "react";
import { Bell, Menu, SquarePen, Wifi } from "lucide-react";

function clockText(remaining: number, practice: boolean): string {
  // The real test shows whole minutes; practice mode adds seconds.
  if (practice) {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, "0")} left`;
  }
  const minutes = Math.ceil(remaining / 60);
  if (remaining <= 60) return "Less than 1 minute left";
  return `${minutes} minutes left`;
}

/** Official header: IELTS logo, candidate, clock top centre, connection, messages, options, notes. */
export function ExamHeader({
  candidate,
  remaining,
  showClock = true,
  centre,
  practice,
  audioStatus,
  extra,
  onOptions,
  onToggleNotes,
  notesOpen,
}: {
  candidate: string;
  remaining?: number;
  showClock?: boolean;
  centre?: ReactNode;
  practice: boolean;
  audioStatus?: ReactNode;
  extra?: ReactNode;
  onOptions: () => void;
  onToggleNotes?: () => void;
  notesOpen?: boolean;
}) {
  const [messages, setMessages] = useState(false);
  const warn = remaining !== undefined && remaining <= 10 * 60;
  return (
    <header className="x-header">
      <span className="x-logo" aria-label="IELTS">
        IELTS
      </span>
      <span className="x-candidate">
        <span>{candidate}</span>
        {audioStatus}
      </span>
      {centre ??
        (showClock && remaining !== undefined && (
          <span className={`x-clock ${warn ? "warn" : ""}`} role="timer" aria-live={remaining % 60 === 0 && warn ? "assertive" : "off"}>
            {clockText(remaining, practice)}
          </span>
        ))}
      <div className="x-tools">
        {practice && <span className="x-practice-badge">Practice mode</span>}
        {extra}
        <button aria-label="Connected" title="Connected" type="button">
          <Wifi aria-hidden="true" />
        </button>
        <button aria-label="Messages" title="Messages" type="button" onClick={() => setMessages((v) => !v)} aria-expanded={messages}>
          <Bell aria-hidden="true" />
        </button>
        <button aria-label="Options" title="Options" type="button" onClick={onOptions}>
          <Menu aria-hidden="true" />
        </button>
        {onToggleNotes && (
          <button aria-label={notesOpen ? "Hide notes" : "Show notes"} title={notesOpen ? "Hide notes" : "Show notes"} type="button" onClick={onToggleNotes} aria-pressed={notesOpen}>
            <SquarePen aria-hidden="true" />
          </button>
        )}
      </div>
      {messages && (
        <div className="x-messages" role="status">
          No messages from the invigilator.
          <div style={{ marginTop: 8 }}>
            <button type="button" className="x-link-btn" onClick={() => setMessages(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export function PartBanner({ number, rubric }: { number: number; rubric: string }) {
  return (
    <section className="x-banner" aria-label={`Part ${number}`}>
      <b>Part {number}</b>
      {rubric}
    </section>
  );
}
