import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, LogOut, Send, X } from "lucide-react";
import type { ExamSettings } from "../engine/session";

type View = "main" | "contrast" | "size";

/**
 * Full-screen Options page from the official demo: Go to submission page,
 * Contrast and Text size. Practice extras and the prototype's "Leave test"
 * sit below a divider, labelled as not part of the real test.
 */
export function OptionsPanel({
  settings,
  onChange,
  onClose,
  onSubmissionPage,
  onLeave,
  practiceExtras,
}: {
  settings: ExamSettings;
  onChange: (s: ExamSettings) => void;
  onClose: () => void;
  onSubmissionPage: () => void;
  onLeave: () => void;
  practiceExtras?: React.ReactNode;
}) {
  const [view, setView] = useState<View>("main");
  const contrast: { v: ExamSettings["contrast"]; label: string }[] = [
    { v: "", label: "Black on white" },
    { v: "wb", label: "White on black" },
    { v: "yb", label: "Yellow on black" },
  ];
  const sizes: { v: ExamSettings["size"]; label: string }[] = [
    { v: "", label: "Regular" },
    { v: "large", label: "Large" },
    { v: "xl", label: "Extra large" },
  ];
  return (
    <div className="x-options" role="dialog" aria-modal="true" aria-label="Options">
      <div className="x-options-head">
        {view === "main" ? (
          <span>Options</span>
        ) : (
          <button type="button" onClick={() => setView("main")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={20} aria-hidden="true" /> {view === "contrast" ? "Contrast" : "Text size"}
          </button>
        )}
        <button type="button" className="x-icon-btn" aria-label="Close" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="x-options-body">
        {view === "main" && (
          <>
            <button type="button" className="x-red-btn" onClick={onSubmissionPage}>
              <Send size={18} aria-hidden="true" /> Go to submission page
            </button>
            <div className="x-card">
              <button type="button" className="x-card-row" onClick={() => setView("contrast")}>
                Contrast <ChevronRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="x-card-row" onClick={() => setView("size")}>
                Text size <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
            {practiceExtras && (
              <div className="x-card">
                <div className="x-card-title">Practice options (not in the real test)</div>
                <div style={{ padding: "8px 16px" }}>{practiceExtras}</div>
              </div>
            )}
            <div className="x-card">
              <div className="x-card-title">Prototype</div>
              <button type="button" className="x-card-row" onClick={onLeave}>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <LogOut size={18} aria-hidden="true" /> Leave test, progress is saved
                </span>
              </button>
            </div>
          </>
        )}
        {view === "contrast" && (
          <div className="x-card" role="radiogroup" aria-label="Contrast">
            {contrast.map((c) => (
              <button
                key={c.label}
                type="button"
                role="radio"
                aria-checked={settings.contrast === c.v}
                className={`x-card-row ${settings.contrast === c.v ? "on" : ""}`}
                onClick={() => onChange({ ...settings, contrast: c.v })}
              >
                {c.label} {settings.contrast === c.v && <Check size={18} aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
        {view === "size" && (
          <div className="x-card" role="radiogroup" aria-label="Text size">
            {sizes.map((c) => (
              <button
                key={c.label}
                type="button"
                role="radio"
                aria-checked={settings.size === c.v}
                className={`x-card-row ${settings.size === c.v ? "on" : ""}`}
                onClick={() => onChange({ ...settings, size: c.v })}
              >
                {c.label} {settings.size === c.v && <Check size={18} aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
