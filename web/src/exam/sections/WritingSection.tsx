import { countWords } from "@/lib/utils";
import { useSession } from "../engine/session";
import { useRunner } from "../engine/runner";
import { ExamHeader, PartBanner } from "../chrome/ExamHeader";
import { Navigator } from "../chrome/Navigator";
import { SplitPane } from "../chrome/SplitPane";
import { HighlightableText, NotesSidebar, SelectionPopover } from "../chrome/Highlighting";
import { Figure } from "../widgets/Figure";
import { Rich } from "../widgets/QuestionGroupView";

/**
 * Academic Writing: prompt (and chart) left, a plain text box right with no
 * spellcheck and a live "Words: N" under it. The footer tabs are Part 1 and
 * Part 2; a tab gets a green tick once it has text.
 */
export function WritingSection() {
  const s = useSession();
  const r = useRunner();
  const part = s.section.parts[s.state.currentPart] ?? s.section.parts[0];
  const task = part.writing!;
  const text = s.state.essays[part.id] ?? "";
  const words = countWords(text);
  return (
    <>
      <ExamHeader
        candidate={r.candidate}
        remaining={r.noTimeLimit ? undefined : r.remaining}
        practice={s.practice}
        onOptions={r.openOptions}
        onToggleNotes={() => s.setNotesOpen(!s.notesOpen)}
        notesOpen={s.notesOpen}
      />
      <PartBanner number={part.number} rubric={part.rubric} />
      <main className="x-main">
        <SplitPane
          key={part.id}
          initial={48}
          left={
            <div>
              {task.prompt.map((p, i) => (
                <p key={i}>
                  {p.includes("**") ? <Rich text={p} /> : <HighlightableText root={`${part.id}-prompt${i}`} text={p} />}
                </p>
              ))}
              {task.figure && <Figure id={task.figure} label="Task 1 chart" />}
            </div>
          }
          right={
            <div className="x-writing-answer">
              <label htmlFor={`essay-${part.id}`} className="sr-only">
                Your answer for Part {part.number}
              </label>
              <textarea
                id={`essay-${part.id}`}
                className="x-textarea"
                value={text}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                autoComplete="off"
                onChange={(e) => s.setEssay(part.id, e.target.value)}
              />
              <div className={`x-wordcount ${words < task.minWords ? "short" : ""}`} aria-live="polite">
                Words: {words}
              </div>
              {s.practice && (
                <p className="x-practice-note" style={{ marginTop: 10 }}>
                  Practice: aim for at least {task.minWords} words in about {task.minutes} minutes. The real test has no word target on screen.
                </p>
              )}
            </div>
          }
        />
        {s.notesOpen && <NotesSidebar />}
      </main>
      <Navigator onFinish={r.finish} partDone={(pi) => countWords(s.state.essays[s.section.parts[pi].id] ?? "") > 0} />
      <SelectionPopover />
    </>
  );
}
