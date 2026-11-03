import type { CSSProperties, ReactNode } from "react";
import { brand } from "@/config/brand";
import { useT } from "@/i18n";
import { formatBand, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import "./auth.css";

/*
 * The Midnight Iris panel beside the sign-in form (SignIn.dc.html) and the
 * "Oopsie!" panel beside forgot password (ForgotPassword.dc.html).
 *
 * Only the "returning" variant is personal: the first name comes from the
 * lookup API; the days to go, test date, bands and last activity are prototype
 * sample values (the lookup returns only { exists, name }). Every other step
 * shows a generic path from today to the target band. Decorative: aria-hidden.
 */

export type PanelVariant = "identify" | "create" | "code" | "returning";

const SAMPLE_DAYS_TO_GO = 34;

/** Rounded panel frame shared by both panels. */
function Frame({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div className="relative h-full min-h-[calc(100dvh-2rem)] overflow-hidden rounded-3xl font-archivo text-white" style={style}>
      {children}
    </div>
  );
}

export function ProgressPanel({ variant, name }: { variant: PanelVariant; name?: string }) {
  const { t, locale } = useT();
  const fa = locale === "fa";
  const back = variant === "returning";
  const g = (k: string) => t(`mk.auth.panel.generic.${k}`);
  const r = (k: string, o?: Record<string, unknown>) => t(`mk.auth.panel.returning.${k}`, o);

  const eyebrow = t(`mk.auth.panel.${variant}.eyebrow`);
  const title = back ? (name ? r("title", { name }) : r("titleNoName")) : t(`mk.auth.panel.${variant}.title`);
  const chip1 = back ? r("daysToGo", { n: formatNumber(SAMPLE_DAYS_TO_GO, locale) }) : g("chip1");
  const chip2 = back ? r("testDay") : g("chip2");
  // Marker labels: [value above the dot, label below]
  const m1 = back ? [formatBand(5.5, locale), r("m1")] : [g("m1Top"), g("m1")];
  const m2 = back ? [formatBand(6, locale), r("m2")] : [g("m2Top"), g("m2")];
  const flag = back ? [formatBand(7, locale), r("flag")] : [g("flagTop"), g("flag")];
  const here = back ? r("here") : g("here");
  const caps: CSSProperties = fa ? {} : { textTransform: "uppercase", letterSpacing: 1 };

  return (
    <Frame
      style={{
        background: "radial-gradient(circle at 85% 10%, #4a41a8 0%, rgba(74,65,168,0) 45%), linear-gradient(160deg, #2B2470 0%, #1d1850 100%)",
      }}
    >
      <span className="absolute -end-20 -bottom-20 size-80 rounded-full border-2 border-white/[0.06]" />
      <span className="absolute -end-5 -bottom-5 size-50 rounded-full border-2 border-white/[0.05]" />
      <div className="relative flex h-full min-h-[inherit] flex-col px-12 py-11">
        <p className="text-[14px] font-bold tracking-[0.12em] text-canary-yellow uppercase">{eyebrow}</p>
        <p className="mt-2.5 text-[44px] leading-[1.1] font-extrabold tracking-[-0.02em]">{title}</p>

        <div className="mt-[22px] flex flex-wrap gap-2.5">
          <span className="au-chip inline-flex items-center gap-2 rounded-full bg-pink-tint px-3.5 py-[7px] text-[14px] font-extrabold text-midnight-iris">
            <span className="size-2 rounded-full bg-coral" />
            {chip1}
          </span>
          <span className="au-chip inline-flex items-center rounded-full border border-white/[0.18] bg-white/10 px-3.5 py-[7px] text-[14px] font-bold">{chip2}</span>
        </div>

        <svg viewBox="0 0 520 250" width="100%" style={{ direction: "ltr" }} className="mt-[26px] block max-w-[600px] overflow-visible">
          <path d="M28,222 C90,222 110,160 172,160 S262,204 318,146 C368,92 418,62 478,52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="22" strokeLinecap="round" />
          <path id={`au-todo-${variant}`} d="M318,146 C368,92 418,62 478,52" fill="none" stroke="#FAFF7F" strokeOpacity="0.55" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
          <path className="au-done" pathLength={1} d="M28,222 C90,222 110,160 172,160 S262,204 318,146" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          {["2.2s", "3.5s"].map((begin) => (
            <circle key={begin} r="3.5" fill="#FAFF7F" opacity="0" className="au-trav">
              {/* Hidden until its first run, so it does not sit at the SVG origin. */}
              <set attributeName="opacity" to="1" begin={begin} />
              <animateMotion dur="2.6s" repeatCount="indefinite" begin={begin}>
                <mpath href={`#au-todo-${variant}`} />
              </animateMotion>
            </circle>
          ))}
          {[
            { x: 28, y: 222, label: m1, d: "au-d1" },
            { x: 172, y: 160, label: m2, d: "au-d2" },
          ].map(({ x, y, label, d }) => (
            <g key={x} className={cn("au-pop", d)}>
              <circle cx={x} cy={y} r="7" fill="#2B2470" stroke="#C9D2FF" strokeWidth="3" />
              <text x={x} y={y + 26} textAnchor="middle" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.65)">
                {label[1]}
              </text>
              <text x={x} y={y - 18} textAnchor="middle" fontSize="17" fontWeight="800" fill="#C9D2FF">
                {label[0]}
              </text>
            </g>
          ))}
          <g className="au-pop au-d3">
            <circle className="au-ring" cx="318" cy="146" r="10" fill="none" stroke="#FF88DC" strokeWidth="3" />
            <g className="au-bob">
              <path d="M318,140 C306,128 300,120 300,110 A18,18 0 0 1 336,110 C336,120 330,128 318,140 Z" fill="#D92F3A" stroke="#ffffff" strokeWidth="2.5" />
              {back ? (
                <text x="318" y="116" textAnchor="middle" fontSize="13" fontWeight="800" fill="#ffffff">
                  {formatBand(6.5, locale)}
                </text>
              ) : (
                <path d="M311,110 l5,5 l9,-10" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
            <text x="336" y="164" fontSize="12" fontWeight="800" fill="#FF88DC" style={caps}>
              {here}
            </text>
          </g>
          <g className="au-pop au-d4">
            <line x1="478" y1="52" x2="478" y2="4" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path className="au-cloth" d="M478,6 L512,13 L478,28 Z" fill="#FAFF7F" />
            <text x="478" y="74" textAnchor="middle" fontSize="17" fontWeight="800" fill="#FAFF7F">
              {flag[0]}
            </text>
            <text x="478" y="90" textAnchor="middle" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.65)">
              {flag[1]}
            </text>
          </g>
        </svg>

        <div className="au-card relative mt-[30px] max-w-[520px] rounded-2xl bg-white py-4 ps-[52px] pe-[18px] text-midnight-iris shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
          <svg width="22" height="34" viewBox="0 0 22 34" className="absolute start-4 -top-1">
            <path d="M0 0 H22 V34 L11 26 L0 34 Z" fill="#D92F3A" />
          </svg>
          <span className="block text-[12px] font-extrabold tracking-[0.1em] text-magenta uppercase">{back ? r("cardEyebrow") : g("cardEyebrow")}</span>
          <b className="mt-[3px] block text-[17px]">
            {back ? r("cardTitle") : g("cardTitle")}
            {back && <span className="au-caret ms-[3px] inline-block h-[17px] w-0.5 bg-primary align-[-2px]" />}
          </b>
          <span className="mt-[3px] block text-[13px] text-[#3a4855]">{back ? r("cardBody") : g("cardBody")}</span>
        </div>

        <p className="mt-auto pt-6 text-[15px] text-white/70">
          <bdi dir="ltr">{brand.name}</bdi> {t("mk.auth.panel.taglineMid")} <b className="text-canary-yellow">{t("mk.auth.panel.taglineEm")}</b>
        </p>
      </div>
    </Frame>
  );
}

/* "Oopsie!" columns from ForgotPassword.dc.html: size.colour.rotation, 24 words per column (each shown twice for the loop). */
const OOPS_COLOURS = ["#D92F3A", "#C9D2FF", "#FF88DC", "#ffffff", "#FAFF7F"];
const OOPS_COLUMNS: { words: string; duration: number; delay: number }[] = [
  { duration: 26, delay: 0, words: "40.0.4 30.1.-4 40.1.8 24.2.4 30.3.-8 24.1.8 40.0.8 24.2.8 24.4.-8 30.2.8 40.4.0 30.0.8 36.2.4 24.4.4 40.3.8 36.4.0 36.2.-8 24.4.4 40.0.4 30.1.-4 40.1.8 24.2.4 30.3.-8 24.1.8" },
  { duration: 34, delay: -5, words: "36.4.4 24.4.-8 30.2.-8 40.0.4 24.0.8 36.2.0 36.4.0 40.4.-8 30.2.-8 24.4.4 30.0.8 40.2.8 30.2.4 24.0.4 30.0.-8 36.3.-8 30.2.4 24.1.-8 36.4.4 24.4.-8 30.2.-8 40.0.4 24.0.8 36.2.0" },
  { duration: 22, delay: -10, words: "30.2.4 24.3.8 36.3.4 24.4.-8 30.2.-8 36.1.0 40.1.-4 40.1.8 40.2.-4 36.2.-4 30.1.-4 30.2.4 24.0.4 24.4.-8 36.4.-4 36.0.4 40.1.0 30.1.-8 30.2.4 24.3.8 36.3.4 24.4.-8 30.2.-8 36.1.0" },
  { duration: 30, delay: -15, words: "30.2.4 24.1.0 30.2.-8 36.4.4 30.0.-8 30.4.0 30.3.-8 30.3.4 30.3.8 24.4.4 36.3.-8 24.4.4 36.4.0 24.2.-8 36.0.-8 36.2.0 40.4.-8 24.0.4 30.2.4 24.1.0 30.2.-8 36.4.4 30.0.-8 30.4.0" },
  { duration: 38, delay: -20, words: "24.1.8 40.0.8 24.4.-8 24.4.0 36.0.4 40.1.4 24.0.8 24.1.0 24.1.4 30.4.-8 40.0.0 36.4.0 30.2.8 36.2.4 30.0.0 36.0.-4 30.0.-4 30.0.8 24.1.8 40.0.8 24.4.-8 24.4.0 36.0.4 40.1.4" },
];

export function OopsPanel() {
  const { t } = useT();
  const word = t("mk.auth.oops");
  return (
    <Frame style={{ background: "linear-gradient(160deg, #2B2470 0%, #3E4FC4 100%)" }}>
      <div className="absolute -inset-[60px] grid -rotate-6 grid-cols-5 gap-2.5">
        {OOPS_COLUMNS.map((col, c) => {
          const words = col.words.split(" ").map((w) => w.split(".").map(Number));
          return (
            <div key={c} className="flex h-full justify-center">
              <div className="au-oops flex flex-col items-center" style={{ animationDuration: `${col.duration}s`, animationDelay: `${col.delay}s` }}>
                {[...words, ...words].map(([size, colour, rot], i) => (
                  <span
                    key={i}
                    className="mb-[22px] block leading-[1.05] font-black tracking-[-0.02em] whitespace-nowrap opacity-30"
                    style={{ fontSize: size, color: OOPS_COLOURS[colour], transform: `rotate(${rot}deg)` }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
