import { useRef } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { numbersLabel } from "@/lib/utils";
import { useSession } from "../engine/session";
import { isAnswered, partProgress } from "../engine/model";

/**
 * Footer navigator from the official demo: Part tabs, the current part's
 * question buttons (green bar = answered, blue outline = current), Previous,
 * Next and the tick that opens the submission page. Arrow keys move along
 * the question buttons.
 */
export function Navigator({ onFinish, partDone }: { onFinish: () => void; partDone?: (partIndex: number) => boolean }) {
  const s = useSession();
  const { section, index, state } = s;
  const listRef = useRef<HTMLDivElement>(null);
  const current = index.find((e) => e.numbers.includes(state.currentNumber));
  const hasQuestions = index.length > 0;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    buttons[Math.min(buttons.length - 1, Math.max(0, i + (e.key === "ArrowRight" ? 1 : -1)))]?.focus();
  };

  const isFirst = hasQuestions ? index[0]?.itemId === current?.itemId : state.currentPart === 0;
  const isLast = hasQuestions ? index[index.length - 1]?.itemId === current?.itemId : state.currentPart === section.parts.length - 1;

  return (
    <footer className="x-footer">
      {s.showFlag && hasQuestions && current && (
        <label className="x-review-box" title="Mark this question to come back to it">
          <input type="checkbox" checked={state.flags.includes(current.numbers[0])} onChange={() => s.toggleFlag(current.numbers[0])} />
          Review
        </label>
      )}
      <div className="x-parts" ref={listRef} onKeyDown={onKey} role="navigation" aria-label="Questions">
        {section.parts.map((p, pi) => {
          const prog = partProgress(index, pi, state.answers);
          const isCurrent = pi === state.currentPart;
          const done = partDone ? partDone(pi) : prog.total > 0 && prog.done === prog.total;
          return (
            <div key={p.id} className={`x-part ${isCurrent ? "current" : ""}`}>
              <button type="button" className={`x-part-name ${partDone && done ? "done" : ""}`} onClick={() => s.goToPart(pi)} aria-current={isCurrent ? "step" : undefined}>
                {partDone && done && <Check size={14} aria-hidden="true" />}
                Part {p.number}
              </button>
              {isCurrent && hasQuestions ? (
                <div className="x-nums">
                  {index
                    .filter((e) => e.partIndex === pi)
                    .map((e) => {
                      const answered = isAnswered(state.answers[e.itemId]);
                      const on = e.itemId === current?.itemId;
                      const flagged = e.numbers.some((n) => state.flags.includes(n));
                      return (
                        <button
                          key={e.itemId}
                          type="button"
                          className={`${answered ? "done" : ""} ${on ? "on" : ""} ${flagged ? "flag" : ""}`}
                          onClick={() => s.goToNumber(e.numbers[0])}
                          aria-label={`Question ${numbersLabel(e.numbers)}, ${answered ? "attempted" : "not attempted"}${flagged ? ", marked for review" : ""}`}
                          aria-current={on ? "true" : undefined}
                        >
                          {numbersLabel(e.numbers)}
                        </button>
                      );
                    })}
                </div>
              ) : (
                !isCurrent &&
                prog.total > 0 && (
                  <span className="x-count" aria-label={`Part ${p.number}. ${prog.done} of ${prog.total} questions attempted.`}>
                    {prog.done} of {prog.total}
                  </span>
                )
              )}
            </div>
          );
        })}
      </div>
      <div className="x-nav">
        <button type="button" className="prev" aria-label="Previous" onClick={() => s.step(-1)} disabled={isFirst}>
          <ArrowLeft aria-hidden="true" />
        </button>
        <button type="button" className="next" aria-label="Next" onClick={() => s.step(1)} disabled={isLast}>
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="x-finish" aria-label="Review your answers" title="Review your answers" onClick={onFinish}>
        <Check aria-hidden="true" />
      </button>
    </footer>
  );
}
