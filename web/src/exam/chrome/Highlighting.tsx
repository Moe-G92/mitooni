import { useEffect, useState } from "react";
import { Highlighter, MessageSquare, StickyNote, Trash2, X } from "lucide-react";
import { useSession } from "../engine/session";

/*
 * Select text, then choose Note or Highlight, as in the official shell.
 * Highlights are stored as character offsets inside a [data-hl-root] block,
 * so they survive reloads and re-renders.
 */

/** Plain text block that can carry highlights. */
export function HighlightableText({ root, text, as: Tag = "span" }: { root: string; text: string; as?: "span" | "p" | "div" }) {
  const { state } = useSession();
  const marks = state.highlights.filter((h) => h.root === root).sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const h of marks) {
    if (h.start < pos || h.end > text.length) continue;
    if (h.start > pos) parts.push(text.slice(pos, h.start));
    parts.push(
      <mark key={h.id} data-hl-id={h.id} className={h.noteId ? "has-note" : undefined}>
        {text.slice(h.start, h.end)}
      </mark>,
    );
    pos = h.end;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return <Tag data-hl-root={root}>{parts}</Tag>;
}

function offsetWithin(root: Element, node: Node, offset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n === node) return total + offset;
    total += n.textContent?.length ?? 0;
  }
  // Selection ended on an element boundary rather than in a text node.
  return node === root ? (offset === 0 ? 0 : total) : total;
}

type Pop =
  | { kind: "new"; x: number; y: number; root: string; start: number; end: number }
  | { kind: "existing"; x: number; y: number; id: string; noteId?: string };

export function SelectionPopover() {
  const s = useSession();
  const [pop, setPop] = useState<Pop | null>(null);

  useEffect(() => {
    const onUp = (e: MouseEvent | KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".x-popover")) return;
      const markEl = target?.closest?.("mark[data-hl-id]");
      const sel = window.getSelection();
      if (markEl && (!sel || sel.isCollapsed)) {
        const r = markEl.getBoundingClientRect();
        const id = markEl.getAttribute("data-hl-id")!;
        setPop({ kind: "existing", x: r.left + r.width / 2, y: r.top, id, noteId: s.state.highlights.find((h) => h.id === id)?.noteId });
        return;
      }
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPop(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const startRoot = (range.startContainer.nodeType === 1 ? (range.startContainer as Element) : range.startContainer.parentElement)?.closest("[data-hl-root]");
      const endRoot = (range.endContainer.nodeType === 1 ? (range.endContainer as Element) : range.endContainer.parentElement)?.closest("[data-hl-root]");
      if (!startRoot || startRoot !== endRoot) {
        setPop(null);
        return;
      }
      let start = offsetWithin(startRoot, range.startContainer, range.startOffset);
      let end = offsetWithin(startRoot, range.endContainer, range.endOffset);
      // Snap to whole words so a sloppy drag never leaves half a word highlighted.
      const full = startRoot.textContent ?? "";
      while (start > 0 && /[\w'’-]/.test(full[start - 1])) start--;
      while (end < full.length && /[\w'’-]/.test(full[end])) end++;
      while (start < end && /\s/.test(full[start])) start++;
      while (end > start && /\s/.test(full[end - 1])) end--;
      if (end <= start) return;
      const rootId = startRoot.getAttribute("data-hl-root")!;
      const overlaps = s.state.highlights.some((h) => h.root === rootId && h.start < end && h.end > start);
      if (overlaps) {
        setPop(null);
        return;
      }
      const r = range.getBoundingClientRect();
      setPop({ kind: "new", x: r.left + r.width / 2, y: r.top, root: rootId, start, end });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
      else if (e.shiftKey) onUp(e);
    };
    document.addEventListener("mouseup", onUp);
    document.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("keyup", onKey);
    };
  }, [s.state.highlights]);

  if (!pop) return null;
  const style = { left: Math.max(8, pop.x - 90), top: Math.max(8, pop.y - 44) };
  const close = () => {
    setPop(null);
    window.getSelection()?.removeAllRanges();
  };
  return (
    <div className="x-popover" style={style} role="toolbar" aria-label="Text tools">
      {pop.kind === "new" ? (
        <>
          <button type="button" aria-label="Create note" onClick={() => (s.addHighlight({ root: pop.root, start: pop.start, end: pop.end }, true), close())}>
            <MessageSquare aria-hidden="true" /> Note
          </button>
          <button type="button" aria-label="Create highlight" onClick={() => (s.addHighlight({ root: pop.root, start: pop.start, end: pop.end }), close())}>
            <Highlighter aria-hidden="true" /> Highlight
          </button>
        </>
      ) : (
        <>
          {pop.noteId && (
            <button type="button" onClick={() => (s.setNotesOpen(true), close())}>
              <StickyNote aria-hidden="true" /> View note
            </button>
          )}
          <button type="button" onClick={() => (s.removeHighlight(pop.id), close())}>
            <Trash2 aria-hidden="true" /> Clear
          </button>
          <button type="button" aria-label="Close" onClick={close}>
            <X aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

export function NotesSidebar() {
  const s = useSession();
  return (
    <aside className="x-notes" aria-label="Notes">
      <div className="x-notes-head">
        Notes
        <button type="button" className="x-icon-btn" aria-label="Hide notes" onClick={() => s.setNotesOpen(false)}>
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="x-notes-body">
        {s.state.notes.length === 0 ? (
          <p style={{ color: "var(--x-muted)" }}>
            Your private notes will show here.
            <br />
            Select text to highlight or create a note.
          </p>
        ) : (
          s.state.notes.map((n) => (
            <div className="x-note" key={n.id}>
              {n.quote && <blockquote>{n.quote}</blockquote>}
              <textarea
                aria-label="Note"
                value={n.text}
                autoFocus={s.focusNoteId === n.id}
                placeholder="Type your note"
                onChange={(e) => s.editNote(n.id, e.target.value)}
              />
              <div className="x-note-actions">
                <span />
                <button type="button" onClick={() => s.deleteNote(n.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
