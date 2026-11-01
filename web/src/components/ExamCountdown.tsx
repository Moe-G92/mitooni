import { useId } from "react";
import type { Locale } from "@/api/schemas";
import { formatNumber } from "@/lib/format";

/*
 * "2 DAYS TO GO": a tear-off calendar page (red header, two binder rings, big
 * number) in front of a grey panel with the words, drawn after the reference
 * Mo sent on 29 Oct 2026. It is an object, so it keeps its own light colours
 * in dark mode. Persian mirrors it: the calendar sits on the right.
 */

const RED = "#EC2027";
const PANEL = "#E6E6E6";
const INK = "#0A0A0A";

export function ExamCountdown({
  days,
  locale,
  line1,
  line2,
  label,
}: {
  days: number;
  locale: Locale;
  /** "DAYS" (or "DAY"), already translated. */
  line1: string;
  /** "TO GO", already translated. */
  line2: string;
  /** Full sentence for screen readers. */
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const rtl = locale === "fa";
  const n = formatNumber(days, locale);
  const digits = String(days).length;
  const numSize = digits >= 3 ? 132 : digits === 2 ? 178 : 196;

  // 700 × 300 drawing: panel across the full width, calendar page over one end.
  const cal = { x: rtl ? 410 : 10, y: 26, w: 280, h: 264, r: 16, band: 64 };
  const textCx = rtl ? 205 : 495;
  const rings = [cal.x + 70, cal.x + cal.w - 70];
  const fa = rtl ? { fontFamily: "var(--font-persian)", fontWeight: 900 } : undefined;

  return (
    <svg viewBox="0 0 700 300" role="img" aria-label={label} className="block h-auto w-full" style={{ fontFamily: "var(--font-anton)" }}>
      <defs>
        <clipPath id={`cal-${uid}`}>
          <rect x={cal.x} y={cal.y} width={cal.w} height={cal.h} rx={cal.r} />
        </clipPath>
        <linearGradient id={`rod-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#4a4a4a" />
          <stop offset="0.45" stopColor="#9a9a9a" />
          <stop offset="1" stopColor="#3c3c3c" />
        </linearGradient>
        <filter id={`sh-${uid}`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Grey panel with the words */}
      <rect x="10" y={cal.y} width="680" height={cal.h} rx={cal.r} fill={PANEL} filter={`url(#sh-${uid})`} />
      <text x={textCx} y="166" textAnchor="middle" fontSize={rtl ? 104 : 150} fill={INK} style={fa}>
        {line1}
      </text>
      <text x={textCx} y="262" textAnchor="middle" fontSize={rtl ? 76 : 100} fill={INK} style={fa}>
        {line2}
      </text>

      {/* Calendar page */}
      <g filter={`url(#sh-${uid})`}>
        <g clipPath={`url(#cal-${uid})`}>
          <rect x={cal.x} y={cal.y} width={cal.w} height={cal.h} fill="#fff" />
          <rect x={cal.x} y={cal.y} width={cal.w} height={cal.band} fill={RED} />
        </g>
      </g>
      <text
        x={cal.x + cal.w / 2}
        y={cal.y + cal.band + (cal.h - cal.band) / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={numSize}
        fill={INK}
        style={fa}
      >
        {n}
      </text>

      {/* Binder rings: a hole in the red band and a metal rod rising above the page */}
      {rings.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={cal.y + 36} r="11" fill="#1b1b1b" />
          <rect x={cx - 5} y={cal.y - 20} width="10" height="58" rx="5" fill={`url(#rod-${uid})`} />
        </g>
      ))}
    </svg>
  );
}

/*
 * Compact countdown from the mitooni canvas (Overview): a small tear-off page
 * (Coral header, two Deep Wisteria rings, big number) beside a Pink Carnation
 * panel with the words. Persian mirrors it through the flex direction.
 */
export function CountdownCard({
  days,
  locale,
  line1,
  line2,
  label,
}: {
  days: number;
  locale: Locale;
  /** "DAYS" (or "DAY"), already translated. */
  line1: string;
  /** "TO GO", already translated. */
  line2: string;
  /** Full sentence for screen readers. */
  label: string;
}) {
  return (
    <div role="img" aria-label={label} className="flex overflow-hidden rounded-[14px] bg-pink-tint">
      <div className="relative w-24 shrink-0 bg-white shadow-[0_2px_6px_rgba(11,42,62,0.12)]">
        <div className="h-[26px] bg-coral" />
        <span aria-hidden="true" className="absolute start-6 -top-1.5 h-[18px] w-1.5 rounded-[3px] bg-primary" />
        <span aria-hidden="true" className="absolute end-6 -top-1.5 h-[18px] w-1.5 rounded-[3px] bg-primary" />
        <div className="px-1 pt-1.5 pb-2.5 text-center font-archivo text-[44px] leading-none font-extrabold text-primary tabular-nums">
          {formatNumber(days, locale)}
        </div>
      </div>
      <div aria-hidden="true" className="flex flex-col justify-center px-[18px] font-archivo leading-[1.05] text-primary">
        <b className="text-2xl font-extrabold">{line1}</b>
        <span className="text-base font-bold">{line2}</span>
      </div>
    </div>
  );
}
