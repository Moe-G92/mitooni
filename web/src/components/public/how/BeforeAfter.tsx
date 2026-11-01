import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/i18n";
import { formatBand, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import "./how.css";

/*
 * Hero mockup for the How to use page: a laptop showing the mitooni dashboard
 * "before" (Mock 1, band 5.0) and "after" (Mock 6, band 7.0), split by a
 * divider. It plays a looping wipe until the visitor takes over; then the
 * divider follows the pointer (mouse or touch drag, or a click anywhere on the
 * screen) and the keyboard (arrows, Page Up/Down, Home, End) through a
 * role="slider" handle. In RTL "before" sits on the right and the wipe runs
 * the other way. Under reduced motion it starts still at 50%.
 */

/** The dashboard is laid out at this size (px) and scaled to fit the screen. */
const SCREEN_W = 462;
const SCREEN_H = (SCREEN_W * 2234) / 3456;
const TARGET = 7;
const RING_C = 2 * Math.PI * 34;
const MONTH_ONLY: Intl.DateTimeFormatOptions = { month: "long", day: undefined, year: undefined };

const reduceQuery = "(prefers-reduced-motion: reduce)";
function subscribeReduce(cb: () => void) {
  const mq = window.matchMedia?.(reduceQuery);
  mq?.addEventListener("change", cb);
  return () => mq?.removeEventListener("change", cb);
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduce,
    () => window.matchMedia?.(reduceQuery).matches ?? false,
    () => false,
  );
}

type Shot = {
  kind: "before" | "after";
  mock: number;
  month: Date;
  overall: number;
  skills: [number, number, number, number];
  trend: string;
};

const BEFORE: Shot = { kind: "before", mock: 1, month: new Date(2026, 8, 15), overall: 5, skills: [5, 5, 4.5, 5.5], trend: "4,27 30,27" };
const AFTER: Shot = { kind: "after", mock: 6, month: new Date(2026, 11, 15), overall: 7, skills: [7.5, 7, 6.5, 7], trend: "4,27 30,22 56,17 82,12 116,6" };

function MiniLogo() {
  return (
    <svg width="11" height="11" viewBox="0 0 120 120" aria-hidden="true">
      <path d="M60 2 C104 2 118 16 118 60 C118 104 104 118 60 118 C16 118 2 104 2 60 C2 16 16 2 60 2 Z" fill="#2B2470" />
      <polyline points="30,86 30,48 56,74 84,40" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="70,34 96,25 92,51" fill="#D92F3A" />
      <circle cx="92" cy="86" r="8" fill="#FAFF7F" />
    </svg>
  );
}

/** One dashboard screen, laid out at SCREEN_W x SCREEN_H. `fi` adds the fly-in classes (before screen only). */
function Dashboard({ shot, fi }: { shot: Shot; fi: boolean }) {
  const { t, locale } = useT();
  const before = shot.kind === "before";
  const month = formatDate(shot.month, locale, MONTH_ONLY);
  const skillNames = [t("mk.howTo.visual.listening"), t("mk.howTo.visual.reading"), t("mk.howTo.visual.writing"), t("mk.howTo.visual.speakingSkill")];
  const f = (n: number) => (fi ? `hw-fi${n}` : undefined);
  return (
    <div className="flex h-full flex-col bg-background font-archivo text-foreground">
      <div className={cn("flex items-center gap-1.5 border-b border-border bg-white px-2.5 py-[5px]", f(0))}>
        <MiniLogo />
        <b className="font-archivo text-[7px] text-midnight-iris" dir="ltr" lang="en">
          mitooni
        </b>
        <span
          className={cn(
            "ms-auto rounded-full px-[7px] py-0.5 text-[6px] font-extrabold",
            before ? "bg-[#FFE3E3] text-[#B8232D]" : "bg-[#e6f7de] text-[#2c6e1a]",
          )}
        >
          {t(before ? "mk.howTo.compare.before" : "mk.howTo.compare.after", { n: formatNumber(shot.mock, locale), month })}
        </span>
      </div>
      <div className="grid flex-1 grid-cols-[auto_1fr] items-center gap-3 px-3.5 py-2.5">
        <div className={cn("relative grid place-items-center", f(1))}>
          <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
            <circle cx="46" cy="46" r="34" fill="none" stroke="#EEF1FF" strokeWidth="9" />
            <circle
              cx="46"
              cy="46"
              r="34"
              fill="none"
              stroke={before ? "#D92F3A" : "#4f9a2e"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${((shot.overall / 9) * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`}
              transform="rotate(-90 46 46)"
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <span className="text-[5px] tracking-[0.1em] text-muted-foreground uppercase">{t("mk.howTo.compare.overall")}</span>
            <b className="text-[24px] leading-none text-midnight-iris">{formatBand(shot.overall, locale)}</b>
            <span className="text-[5.5px] font-bold text-muted-foreground">{t("mk.howTo.compare.target", { band: formatBand(TARGET, locale) })}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-[5px]">
            {shot.skills.map((b, i) => {
              // As in the canvas: every skill is red before; after, only Writing (6.5) is still red.
              const good = !before && b >= TARGET;
              return (
                <div key={i} className={cn("rounded-md px-1.5 py-1", good ? "bg-[#e6f7de]" : "bg-[#FFE3E3]", f(2 + i))}>
                  <div className={cn("text-[5px] font-extrabold tracking-[0.08em] uppercase", good ? "text-[#2c6e1a]" : "text-[#B8232D]")}>{skillNames[i]}</div>
                  <div className="text-[12px] leading-[1.1] font-extrabold">{formatBand(b, locale)}</div>
                </div>
              );
            })}
          </div>
          <div className={cn("rounded-md border border-border bg-white px-1.5 py-1", f(6))}>
            <div className="flex justify-between">
              <b className="text-[5.5px] text-primary">{t("mk.howTo.compare.trend")}</b>
              <span className="text-[5px] text-muted-foreground">{t("mk.howTo.compare.target", { band: formatBand(TARGET, locale) })}</span>
            </div>
            <svg viewBox="0 0 120 30" preserveAspectRatio="none" width="100%" height="26" className="block" aria-hidden="true">
              <line x1="0" y1="6" x2="120" y2="6" stroke="#D92F3A" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <polyline points={shot.trend} fill="none" stroke="#3E4FC4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "mx-3.5 mb-2.5 rounded-[7px] px-[9px] py-1.5 text-[7.5px] font-extrabold",
          before ? "bg-[#FFE3E3] text-[#B8232D]" : "bg-[#3b7d22] text-white",
          f(7),
        )}
      >
        {before ? t("mk.howTo.compare.gap", { gap: formatBand(TARGET - shot.overall, locale) }) : t("mk.howTo.compare.reached")}
      </div>
    </div>
  );
}

export function BeforeAfter() {
  const { t, locale } = useT();
  const rtl = locale === "fa";
  const reduce = useReducedMotion();
  const [touched, setTouched] = useState(false);
  const [pos, setPos] = useState(50); // share of the screen showing "before", measured from the start edge
  const [scale, setScale] = useState(1);
  const screenRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const auto = !touched && !reduce;

  useLayoutEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / SCREEN_W || 1);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  const fromPointer = (clientX: number) => {
    const el = screenRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const frac = (clientX - r.left) / r.width;
    setPos(clamp((rtl ? 1 - frac : frac) * 100));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const fwd = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (e.key === fwd || e.key === "ArrowUp") next = pos + 5;
    else if (e.key === back || e.key === "ArrowDown") next = pos - 5;
    else if (e.key === "PageUp") next = pos + 20;
    else if (e.key === "PageDown") next = pos - 20;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    if (next === null) return;
    e.preventDefault();
    setTouched(true);
    setPos(clamp(next));
  };

  const left = rtl ? 100 - pos : pos;
  const clip = rtl ? `inset(0 0 0 ${100 - pos}%)` : `inset(0 ${100 - pos}% 0 0)`;
  const layer = { width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})`, transformOrigin: "0 0", left: 0, top: 0 } as const;

  const summary = t("mk.howTo.compare.summary", {
    n1: formatNumber(BEFORE.mock, locale),
    m1: formatDate(BEFORE.month, locale, MONTH_ONLY),
    b1: formatBand(BEFORE.overall, locale),
    gap: formatBand(TARGET - BEFORE.overall, locale),
    target: formatBand(TARGET, locale),
    n2: formatNumber(AFTER.mock, locale),
    m2: formatDate(AFTER.month, locale, MONTH_ONLY),
    b2: formatBand(AFTER.overall, locale),
  });

  return (
    <div className="mx-[6%] max-sm:mx-0">
      <p className="sr-only">{summary}</p>
      <div className="relative rounded-t-[18px] rounded-b-[4px] bg-[#0d0f12] px-3 pt-3 pb-2.5 shadow-[0_24px_48px_rgba(11,42,62,0.18),inset_0_0_0_1px_#3a3d42] max-sm:px-2 max-sm:pt-2 max-sm:pb-2">
        <div aria-hidden="true" className="absolute top-0 left-1/2 z-[1] grid h-3 w-[72px] -translate-x-1/2 place-items-center rounded-b-[7px] bg-[#0d0f12]">
          <span className="size-[5px] rounded-full bg-[#2a2e35]" />
        </div>
        <div
          ref={screenRef}
          className={cn("relative aspect-[3456/2234] cursor-ew-resize touch-pan-y overflow-hidden rounded-t-lg rounded-b-[2px] bg-background select-none", auto && "hw-auto")}
          style={{ ["--hw-x" as string]: rtl ? -1 : 1 }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setTouched(true);
            fromPointer(e.clientX);
            if (e.pointerType === "mouse") handleRef.current?.focus({ preventScroll: true });
          }}
          onPointerMove={(e) => dragging.current && fromPointer(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute" style={layer}>
              <Dashboard shot={AFTER} fi={false} />
            </div>
            <div className={cn("absolute inset-0", auto && (rtl ? "hw-wipe-rtl" : "hw-wipe"))} style={auto ? undefined : { clipPath: clip }}>
              <div className="absolute" style={layer}>
                <Dashboard shot={BEFORE} fi={auto} />
              </div>
            </div>
          </div>
          <div
            ref={handleRef}
            role="slider"
            tabIndex={0}
            aria-label={t("mk.howTo.compare.slider")}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pos}
            aria-valuetext={t("mk.howTo.compare.value", { before: formatNumber(pos, locale), after: formatNumber(100 - pos, locale) })}
            onKeyDown={onKeyDown}
            onFocus={() => setTouched(true)}
            className={cn(
              "group absolute top-0 bottom-0 w-11 -translate-x-1/2 outline-none",
              auto && (rtl ? "hw-handle-auto-rtl" : "hw-handle-auto"),
            )}
            style={{ left: `${left}%` }}
          >
            <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(43,36,112,0.25),0_0_12px_rgba(43,36,112,0.35)]" />
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 grid size-[22px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-midnight-iris text-[9px] font-extrabold text-canary-yellow shadow-[0_2px_6px_rgba(0,0,0,0.3)] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-canary-yellow max-sm:size-7 max-sm:text-[11px]"
            >
              ↔
            </span>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="relative h-3.5 rounded-t-[2px] rounded-b-[14px] bg-linear-to-b from-[#e6e8eb] to-[#b7bbc1] shadow-[0_10px_18px_rgba(11,42,62,0.15)]">
        <div className="mx-auto h-[5px] w-[16%] rounded-b-[7px] bg-[#a3a8af]" />
      </div>
    </div>
  );
}
