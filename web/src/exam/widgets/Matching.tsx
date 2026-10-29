import { createContext, useContext, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Keyboard } from "lucide-react";
import type { QuestionGroup } from "@/api/schemas";
import { useSession } from "../engine/session";

/*
 * Matching headings: drag a heading from the list into the dashed box above
 * a section of the passage. WCAG 2.5.7 needs a single-pointer alternative,
 * so clicking a heading and then a box works too, and dnd-kit's keyboard
 * sensor covers keyboard users.
 */

type DragCtx = {
  picked: string | null;
  setPicked: (k: string | null) => void;
  groups: QuestionGroup[];
};

const Ctx = createContext<DragCtx | null>(null);

export function MatchingProvider({ groups, children }: { groups: QuestionGroup[]; children: ReactNode }) {
  const s = useSession();
  const [picked, setPicked] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  // Pointer drag only; keyboard users pick and place with Enter, which also avoids
  // Space/Enter both lifting a chip and toggling it.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const dragGroups = groups.filter((g) => g.interaction === "drag");

  const place = (slotNumber: number, key: string) => {
    for (const g of dragGroups) {
      const item = g.items.find((i) => i.numbers[0] === slotNumber);
      if (!item) continue;
      // Each heading is used once: remove it from any other box first.
      for (const other of g.items) if (other.id !== item.id && s.state.answers[other.id] === key) s.answer(other.id, "");
      s.answer(item.id, key);
      s.goToNumber(slotNumber, false);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const key = String(e.active.id).replace(/^chip-/, "");
    const over = e.over?.id ? Number(String(e.over.id).replace(/^slot-/, "")) : null;
    if (over) place(over, key);
  };

  const group = dragGroups[0];
  const label = group?.options?.find((o) => o.key === active)?.text;

  return (
    <Ctx.Provider value={{ picked, setPicked, groups: dragGroups }}>
      <DndContext sensors={sensors} onDragStart={(e) => setActive(String(e.active.id).replace(/^chip-/, ""))} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
        <PlaceContext.Provider value={place}>{children}</PlaceContext.Provider>
        <DragOverlay>
          {active ? (
            <div className="x-chip" style={{ background: "var(--x-bg)" }}>
              <b>{active}</b>
              {label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Ctx.Provider>
  );
}

const PlaceContext = createContext<(slot: number, key: string) => void>(() => undefined);

function useMatching() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useMatching outside MatchingProvider");
  return c;
}

function Chip({ optKey, text, used }: { optKey: string; text: string; used: boolean }) {
  const m = useMatching();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `chip-${optKey}` });
  const picked = m.picked === optKey;
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      className={`x-chip ${used ? "used" : ""} ${picked ? "picked" : ""} ${isDragging ? "dragging" : ""}`}
      aria-pressed={picked}
      aria-label={`Heading ${optKey}: ${text}${used ? ", already placed" : ""}. Press to pick it, then choose a box.`}
      onClick={() => m.setPicked(picked ? null : optKey)}
    >
      <b>{optKey}</b>
      {text}
    </button>
  );
}

/** The "List of Headings" in the question pane. */
export function HeadingList({ group }: { group: QuestionGroup }) {
  const s = useSession();
  const used = new Set(group.items.map((i) => s.state.answers[i.id]).filter(Boolean) as string[]);
  return (
    <div>
      <p className="x-content-heading">{group.optionsTitle ?? "List of Headings"}</p>
      <div className="x-chips" role="list">
        {group.options?.map((o) => (
          <div role="listitem" key={o.key}>
            <Chip optKey={o.key} text={o.text} used={used.has(o.key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dashed drop box shown above a section of the passage. */
export function DropSlot({ number }: { number: number }) {
  const s = useSession();
  const m = useMatching();
  const place = useContext(PlaceContext);
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${number}` });
  const group = m.groups.find((g) => g.items.some((i) => i.numbers[0] === number));
  const item = group?.items.find((i) => i.numbers[0] === number);
  if (!group || !item) return null;
  const value = s.state.answers[item.id] as string | undefined;
  const heading = group.options?.find((o) => o.key === value);
  const active = s.state.currentNumber === number;
  return (
    <button
      ref={setNodeRef}
      id={`q-${number}`}
      type="button"
      className={`x-slot ${isOver ? "over" : ""} ${m.picked ? "ready" : ""} ${active ? "active" : ""}`}
      onClick={() => {
        if (m.picked) {
          place(number, m.picked);
          m.setPicked(null);
        } else if (value) {
          s.answer(item.id, "");
        } else {
          s.goToNumber(number, false);
        }
      }}
      aria-label={`Question ${number}: ${heading ? `heading ${heading.key}, ${heading.text}. Press to remove.` : m.picked ? "press to place the picked heading" : "empty"}`}
    >
      <span className="x-slot-n">{number}</span>
      {heading ? (
        <span>
          <b>{heading.key}</b> {heading.text}
        </span>
      ) : (
        <span className="x-slot-empty">{m.picked ? "Place heading here" : "Move a heading here"}</span>
      )}
    </button>
  );
}

export function DragHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className="x-help-link" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Keyboard size={14} aria-hidden="true" /> Help
      </button>
      {open && (
        <p className="x-practice-note">
          Drag a heading into a box. Or press a heading to pick it, then press a box to place it. With a keyboard: Tab to a heading and press Enter,
          then Tab to a box and press Enter. Press a filled box to clear it.
        </p>
      )}
    </div>
  );
}
