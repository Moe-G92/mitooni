import type { Annotation } from "@/api/schemas";
import { cn } from "@/lib/utils";
import { KIND_CLASS } from "./feedback-kinds";


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
        <sup className="ms-0.5 font-mono text-[10px] no-underline">{s.i + 1}</sup>
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
