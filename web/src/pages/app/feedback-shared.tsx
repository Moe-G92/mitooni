import type { Annotation } from "@/api/schemas";
import { useT } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/misc";
import { KIND_CLASS, KIND_TAG_CLASS } from "./feedback-kinds";

/** Text with each annotation's quote marked and numbered, first occurrence only. */
export function AnnotatedText({ text, notes, onPick, active }: { text: string; notes: Annotation[]; onPick?: (i: number) => void; active?: number | null }) {
  const spans: { start: number; end: number; i: number }[] = [];
  notes.forEach((n, i) => {
    const start = text.indexOf(n.quote);
    if (start < 0) return;
    const end = start + n.quote.length;
    if (spans.some((s) => start < s.end && end > s.start)) return;
    spans.push({ start, end, i });
  });
  spans.sort((a, b) => a.start - b.start);
  const out: React.ReactNode[] = [];
  let pos = 0;
  for (const s of spans) {
    if (s.start > pos) out.push(text.slice(pos, s.start));
    out.push(
      <mark
        key={s.i}
        id={`ann-${s.i}`}
        onClick={() => onPick?.(s.i)}
        className={cn(
          "cursor-pointer rounded px-0.5 underline decoration-2 underline-offset-4",
          KIND_CLASS[notes[s.i].kind],
          active === s.i && "ring-2 ring-ring",
        )}
      >
        {text.slice(s.start, s.end)}
        <sup className="ms-0.5 inline-block font-archivo text-[10px] tabular-nums no-underline">{s.i + 1}</sup>
      </mark>,
    );
    pos = s.end;
  }
  if (pos < text.length) out.push(text.slice(pos));
  return (
    <div lang="en" dir="ltr" className="text-start leading-[1.9] whitespace-pre-wrap">
      {out}
    </div>
  );
}

/** Body of one feedback note: optional number, kind tag, the note and a "Try:" fix. */
export function NoteBody({ note, n }: { note: Annotation; n?: number }) {
  const { t, locale, pick } = useT();
  return (
    <>
      <div className="flex items-center gap-2">
        {n !== undefined && <span className="font-archivo text-xs text-muted-foreground tabular-nums">{formatNumber(n, locale)}</span>}
        <Tag className={KIND_TAG_CLASS[note.kind]}>{t(`feedback.kind.${note.kind}`)}</Tag>
      </div>
      <p className="mt-1.5">{pick(note.note)}</p>
      {note.fix && (
        <p className="mt-1.5 text-muted-foreground">
          {t("feedback.try")}{" "}
          <span lang="en" dir="ltr" className="text-foreground">
            {note.fix}
          </span>
        </p>
      )}
    </>
  );
}

/** A plain list of note cards (no numbers), used on the speaking page. */
export function NoteList({ notes }: { notes: Annotation[] }) {
  return (
    <ol className="mt-3 flex flex-col gap-2.5 text-sm">
      {notes.map((a, i) => (
        <li key={i} className="rounded-xl border border-border px-3.5 py-3">
          <NoteBody note={a} />
        </li>
      ))}
    </ol>
  );
}
