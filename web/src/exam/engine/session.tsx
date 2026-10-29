import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { AnswerValue, Attempt, CheckResult, Highlight, Note, Section, SectionPatch, SectionState, Test } from "@/api/schemas";
import { saveSectionState } from "@/api/queries";
import { uid } from "@/lib/utils";
import { buildIndex, entryForNumber, type NavEntry } from "./model";

/*
 * One running section: answers, flags, highlights, notes, essays and the
 * current position. Every change autosaves to PATCH /api/attempts/:id/state,
 * so a reload resumes exactly where the candidate was.
 */

type Persisted = Pick<
  SectionState,
  "answers" | "flags" | "highlights" | "notes" | "essays" | "recordings" | "partTime" | "currentPart" | "currentNumber"
>;

type Action =
  | { type: "answer"; itemId: string; value: AnswerValue }
  | { type: "flag"; n: number }
  | { type: "go"; partIndex: number; n?: number }
  | { type: "essay"; partId: string; text: string }
  | { type: "highlight"; h: Highlight }
  | { type: "unhighlight"; id: string }
  | { type: "note"; note: Note; highlightId?: string }
  | { type: "editNote"; id: string; text: string }
  | { type: "deleteNote"; id: string }
  | { type: "recording"; partId: string; key: string; durationSec: number }
  | { type: "time"; partId: string; sec: number };

function reducer(s: Persisted, a: Action): Persisted {
  switch (a.type) {
    case "answer":
      return { ...s, answers: { ...s.answers, [a.itemId]: a.value } };
    case "flag":
      return { ...s, flags: s.flags.includes(a.n) ? s.flags.filter((x) => x !== a.n) : [...s.flags, a.n] };
    case "go":
      return { ...s, currentPart: a.partIndex, currentNumber: a.n ?? s.currentNumber };
    case "essay":
      return { ...s, essays: { ...s.essays, [a.partId]: a.text } };
    case "highlight":
      return { ...s, highlights: [...s.highlights, a.h] };
    case "unhighlight": {
      const h = s.highlights.find((x) => x.id === a.id);
      return {
        ...s,
        highlights: s.highlights.filter((x) => x.id !== a.id),
        notes: h?.noteId ? s.notes.filter((n) => n.id !== h.noteId) : s.notes,
      };
    }
    case "note":
      return {
        ...s,
        notes: [a.note, ...s.notes],
        highlights: a.highlightId ? s.highlights.map((h) => (h.id === a.highlightId ? { ...h, noteId: a.note.id } : h)) : s.highlights,
      };
    case "editNote":
      return { ...s, notes: s.notes.map((n) => (n.id === a.id ? { ...n, text: a.text } : n)) };
    case "deleteNote":
      return {
        ...s,
        notes: s.notes.filter((n) => n.id !== a.id),
        highlights: s.highlights.map((h) => (h.noteId === a.id ? { ...h, noteId: undefined } : h)),
      };
    case "recording":
      return { ...s, recordings: { ...s.recordings, [a.partId]: { key: a.key, durationSec: a.durationSec } } };
    case "time":
      return { ...s, partTime: { ...s.partTime, [a.partId]: (s.partTime[a.partId] ?? 0) + a.sec } };
  }
}

export type ExamSettings = { contrast: "" | "wb" | "yb"; size: "" | "large" | "xl" };

type Ctx = {
  attempt: Attempt;
  test: Test;
  section: Section;
  practice: boolean;
  showFlag: boolean;
  index: NavEntry[];
  state: Persisted;
  checks: Record<string, CheckResult>;
  setCheck: (c: CheckResult) => void;
  answer: (itemId: string, value: AnswerValue) => void;
  toggleFlag: (n: number) => void;
  goToNumber: (n: number, focus?: boolean) => void;
  goToPart: (partIndex: number) => void;
  step: (dir: 1 | -1) => void;
  setEssay: (partId: string, text: string) => void;
  addHighlight: (h: Omit<Highlight, "id">, withNote?: boolean) => string;
  removeHighlight: (id: string) => void;
  editNote: (id: string, text: string) => void;
  deleteNote: (id: string) => void;
  setRecording: (partId: string, key: string, durationSec: number) => void;
  addPartTime: (sec: number) => void;
  saveRemaining: (sec: number) => void;
  flush: () => Promise<void>;
  saving: "idle" | "saving" | "saved" | "error";
  notesOpen: boolean;
  setNotesOpen: (v: boolean) => void;
  focusNoteId: string | null;
  settings: ExamSettings;
};

const SessionCtx = createContext<Ctx | null>(null);

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession outside SessionProvider");
  return c;
}

export function SessionProvider({
  attempt,
  test,
  section,
  showFlag,
  settings,
  children,
}: {
  attempt: Attempt;
  test: Test;
  section: Section;
  showFlag: boolean;
  settings: ExamSettings;
  children: ReactNode;
}) {
  const initial = attempt.sections.find((s) => s.sectionId === section.id)!;
  const [state, dispatch] = useReducer(reducer, {
    answers: initial.answers,
    flags: initial.flags,
    highlights: initial.highlights,
    notes: initial.notes,
    essays: initial.essays,
    recordings: initial.recordings,
    partTime: initial.partTime ?? {},
    currentPart: initial.currentPart,
    currentNumber: initial.currentNumber,
  });
  const [checks, setChecks] = useState<Record<string, CheckResult>>({});
  const [saving, setSaving] = useState<Ctx["saving"]>("idle");
  const [notesOpen, setNotesOpen] = useState(false);
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);
  const index = useMemo(() => buildIndex(section), [section]);

  /* ---------- autosave ---------- */
  const pending = useRef<SectionPatch | null>(null);
  const timer = useRef<number | null>(null);
  const first = useRef(true);

  const flush = useCallback(async () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = null;
    if (!patch) return;
    setSaving("saving");
    try {
      await saveSectionState(attempt.id, patch);
      setSaving("saved");
    } catch {
      setSaving("error");
      pending.current = { ...patch, ...(pending.current ?? {}) };
    }
  }, [attempt.id]);

  const queue = useCallback(
    (patch: Partial<SectionPatch>, wait = 400) => {
      pending.current = { ...(pending.current ?? { sectionId: section.id }), ...patch, sectionId: section.id };
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), wait);
    },
    [flush, section.id],
  );

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    queue({ ...state });
  }, [state, queue]);

  useEffect(() => () => void flush(), [flush]);

  /* ---------- navigation ---------- */
  const goToNumber = useCallback(
    (n: number, focus = true) => {
      const e = entryForNumber(index, n);
      if (!e) return;
      dispatch({ type: "go", partIndex: e.partIndex, n: e.numbers[0] });
      if (focus)
        requestAnimationFrame(() => {
          const el = document.getElementById(`q-${e.numbers[0]}`);
          el?.scrollIntoView({ block: "center" });
          (el?.matches("input,select,textarea,button") ? el : el?.querySelector<HTMLElement>("input,select,textarea,button"))?.focus({
            preventScroll: true,
          });
        });
    },
    [index],
  );

  const goToPart = useCallback(
    (partIndex: number) => {
      const first = index.find((e) => e.partIndex === partIndex);
      dispatch({ type: "go", partIndex, n: first?.numbers[0] });
    },
    [index],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (index.length === 0) {
        const next = Math.min(section.parts.length - 1, Math.max(0, state.currentPart + dir));
        dispatch({ type: "go", partIndex: next });
        return;
      }
      const i = index.findIndex((e) => e.numbers.includes(state.currentNumber));
      const target = index[Math.min(index.length - 1, Math.max(0, i + dir))];
      if (target) goToNumber(target.numbers[0]);
    },
    [index, state.currentNumber, state.currentPart, section.parts.length, goToNumber],
  );

  const currentPartId = section.parts[state.currentPart]?.id;

  const value: Ctx = {
    attempt,
    test,
    section,
    practice: attempt.mode === "practice",
    showFlag,
    index,
    state,
    checks,
    setCheck: (c) => setChecks((m) => ({ ...m, [c.itemId]: c })),
    answer: (itemId, v) => dispatch({ type: "answer", itemId, value: v }),
    toggleFlag: (n) => dispatch({ type: "flag", n }),
    goToNumber,
    goToPart,
    step,
    setEssay: (partId, text) => dispatch({ type: "essay", partId, text }),
    addHighlight: (h, withNote) => {
      const id = uid("hl");
      dispatch({ type: "highlight", h: { ...h, id } });
      if (withNote) {
        const quote = h.root ? (document.querySelector(`[data-hl-root="${h.root}"]`)?.textContent ?? "").slice(h.start, h.end) : "";
        const note: Note = { id: uid("note"), quote, text: "", createdAt: new Date().toISOString() };
        dispatch({ type: "note", note, highlightId: id });
        setNotesOpen(true);
        setFocusNoteId(note.id);
      }
      return id;
    },
    removeHighlight: (id) => dispatch({ type: "unhighlight", id }),
    editNote: (id, text) => dispatch({ type: "editNote", id, text }),
    deleteNote: (id) => dispatch({ type: "deleteNote", id }),
    setRecording: (partId, key, durationSec) => dispatch({ type: "recording", partId, key, durationSec }),
    addPartTime: (sec) => currentPartId && dispatch({ type: "time", partId: currentPartId, sec }),
    saveRemaining: (sec) => queue({ remainingSec: sec }, 50),
    flush,
    saving,
    notesOpen,
    setNotesOpen: (v) => {
      setNotesOpen(v);
      if (!v) setFocusNoteId(null);
    },
    focusNoteId,
    settings,
  };

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
