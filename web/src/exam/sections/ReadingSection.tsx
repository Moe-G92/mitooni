import type { Passage } from "@/api/schemas";
import { useSession } from "../engine/session";
import { useRunner } from "../engine/runner";
import { ExamHeader, PartBanner } from "../chrome/ExamHeader";
import { Navigator } from "../chrome/Navigator";
import { SplitPane } from "../chrome/SplitPane";
import { HighlightableText, NotesSidebar, SelectionPopover } from "../chrome/Highlighting";
import { DropSlot, MatchingProvider } from "../widgets/Matching";
import { QuestionGroupView } from "../widgets/QuestionGroupView";

function PassageView({ passage, partId }: { passage: Passage; partId: string }) {
  return (
    <article>
      <h2>
        <HighlightableText root={`${partId}-title`} text={passage.title} />
      </h2>
      {passage.subtitle && (
        <p className="x-subtitle">
          <HighlightableText root={`${partId}-subtitle`} text={passage.subtitle} />
        </p>
      )}
      {passage.paragraphs.map((p, i) => (
        <div key={i}>
          {p.slot !== undefined && <DropSlot number={p.slot} />}
          <p className="x-para">
            {p.label && <span className="x-para-label">{p.label}</span>}
            <HighlightableText root={`${partId}-p${i}`} text={p.text} />
          </p>
        </div>
      ))}
    </article>
  );
}

/** Academic Reading: passage left, questions right, as in the official shell. */
export function ReadingSection() {
  const s = useSession();
  const r = useRunner();
  const part = s.section.parts[s.state.currentPart] ?? s.section.parts[0];
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
      <MatchingProvider groups={part.groups}>
        <main className="x-main">
          <SplitPane
            key={part.id}
            left={part.passage ? <PassageView passage={part.passage} partId={part.id} /> : null}
            right={part.groups.map((g) => (
              <QuestionGroupView key={g.id} group={g} />
            ))}
          />
          {s.notesOpen && <NotesSidebar />}
        </main>
      </MatchingProvider>
      <Navigator onFinish={r.finish} />
      <SelectionPopover />
    </>
  );
}
