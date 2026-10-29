import { useRef, useState, type ReactNode } from "react";
import { MoveHorizontal } from "lucide-react";

/**
 * Two independently scrolling panes with the official 2px divider and
 * 36px handle. Drag with a pointer, or focus the handle and use the arrow keys.
 */
export function SplitPane({ left, right, initial = 46 }: { left: ReactNode; right: ReactNode; initial?: number }) {
  const [pct, setPct] = useState(initial);
  const box = useRef<HTMLDivElement>(null);

  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPct(Math.min(80, Math.max(20, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div ref={box} style={{ display: "flex", flex: "1 1 auto", minWidth: 0 }}>
      <div className="x-pane" style={{ flex: `0 0 ${pct}%` }} tabIndex={0} aria-label="Passage">
        {left}
      </div>
      <div className="x-divider">
        <div
          className="x-handle"
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={20}
          aria-valuemax={80}
          aria-label="Resize panes"
          tabIndex={0}
          title="Drag to resize"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const onMove = (ev: PointerEvent) => move(ev.clientX);
            const target = e.currentTarget;
            const up = () => {
              target.removeEventListener("pointermove", onMove);
              target.removeEventListener("pointerup", up);
            };
            target.addEventListener("pointermove", onMove);
            target.addEventListener("pointerup", up);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPct((p) => Math.max(20, p - 4));
            if (e.key === "ArrowRight") setPct((p) => Math.min(80, p + 4));
          }}
        >
          <MoveHorizontal aria-hidden="true" />
        </div>
      </div>
      <div className="x-pane" style={{ flex: "1 1 auto", minWidth: 0 }}>
        {right}
      </div>
    </div>
  );
}
