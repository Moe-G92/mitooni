import { useT } from "@/i18n";
import { formatBand, formatClock, formatDayDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import "./how.css";

/*
 * The five small product mockups beside the steps on the How to use page
 * (canvas HowItWorks.dc.html). All decorative (aria-hidden): the step text
 * says the same thing. Exam content (the cue card, the transcript) stays in
 * English, left to right, in both languages.
 */

function Frame({ children, inner = "rounded-lg" }: { children: React.ReactNode; inner?: string }) {
  return (
    <div aria-hidden="true" className="rounded-[22px] border border-border bg-white p-1.5 shadow-[0_14px_34px_rgba(43,36,112,0.10)]">
      <div className={cn("bg-white p-5 font-archivo max-sm:p-4", inner)}>{children}</div>
    </div>
  );
}

const label = "text-[12px] tracking-[0.08em] text-[#3a4855] uppercase";

/** Step 1: target band and the days-to-go calendar. */
export function TargetVisual() {
  const { t, locale } = useT();
  return (
    <Frame>
      <div className={label}>{t("mk.howTo.visual.bandNeed")}</div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {[6, 6.5, 7, 7.5, 8].map((b) => (
          <span key={b} className={cn("rounded-full px-3.5 py-1.5 font-semibold", b === 7 ? "bg-coral text-white" : "bg-background text-foreground")}>
            {formatBand(b, locale)}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-xl bg-pink-tint">
          <div className="w-16 bg-white shadow-[0_2px_6px_rgba(11,42,62,0.12)]">
            <div className="h-4 bg-coral" />
            <div className="pt-0.5 pb-1.5 text-center text-[28px] font-extrabold text-primary">{formatNumber(34, locale)}</div>
          </div>
          <div className="flex flex-col justify-center px-3 leading-[1.05] text-primary">
            <b className="text-[16px] font-extrabold uppercase">{t("mk.howTo.visual.days")}</b>
            <span className="text-[12px] font-bold uppercase">{t("mk.howTo.visual.toGo")}</span>
          </div>
        </div>
        <div className="text-[14px] text-[#3a4855]">
          {t("mk.howTo.visual.testDay")}
          <br />
          <b className="text-foreground">{formatDayDate(new Date(2026, 11, 5), locale)}</b>
        </div>
      </div>
    </Frame>
  );
}

const BARS = [10, 22, 14, 30, 18, 26, 12, 34, 20, 28, 16, 24, 10, 30, 18, 22, 14, 26, 12, 20];

/** Step 2: a Speaking Part 2 recording screen. */
export function SpeakingVisual() {
  const { t, locale } = useT();
  return (
    <Frame inner="rounded-2xl">
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-[12px] font-bold tracking-[0.1em] text-[#2c6e1a] uppercase">{t("mk.howTo.visual.speaking")}</span>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#B8232D]">
          <i className="hw-rec block size-[9px] rounded-full bg-coral" />
          {t("mk.howTo.visual.recording")}
        </span>
      </div>
      <p lang="en" dir="ltr" className="mt-2.5 text-left text-[16px] leading-[23px] font-semibold text-foreground">
        Describe a practical skill you learned from an older family member
      </p>
      <div dir="ltr" className="mt-3.5 flex h-9 items-center gap-[3px]">
        {BARS.map((h, i) => (
          <i key={i} className="hw-bar block w-1 rounded-[2px] bg-[#2c6e1a]" style={{ height: h, animationDelay: `${(i * 0.07).toFixed(2)}s` }} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2.5">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e6f7de]">
          <div className="h-full w-[85%] bg-[#4f9a2e]" />
        </div>
        <b dir="ltr" className="text-[18px] text-foreground tabular-nums">
          {formatClock(102, locale)} <span className="font-medium text-muted-foreground">/ {formatClock(120, locale)}</span>
        </b>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[12px] font-semibold">
        <span className="rounded-full bg-pale-wisteria px-2.5 py-1 text-primary">{t("mk.howTo.visual.chipScreens")}</span>
        <span className="rounded-full bg-pale-wisteria px-2.5 py-1 text-primary">{t("mk.howTo.visual.chipTools")}</span>
      </div>
    </Frame>
  );
}

function Q({ n }: { n: number }) {
  return <b className="me-[3px] rounded bg-primary px-[5px] font-archivo text-[10px] text-white tabular-nums">Q{n}</b>;
}

/** Step 3: a marked Listening transcript. */
export function TranscriptVisual() {
  const { t } = useT();
  return (
    <Frame>
      <div className={label}>{t("mk.howTo.visual.transcript")}</div>
      <p lang="en" dir="ltr" className="mt-2.5 text-left font-[Arial,sans-serif] text-[14px] leading-[1.9] text-black">
        <b className="text-[12px] text-[#535353]">FIONA</b>&nbsp; Many visitors assume this was farmland, but{" "}
        <mark className="rounded-[3px] bg-[#FFE3E3] px-[3px] py-px text-black shadow-[inset_0_-2px_0_#B8232D] [box-decoration-break:clone]">
          <Q n={11} />
          the site was actually a gravel quarry
        </mark>{" "}
        <span className="rounded-full bg-[#FFE3E3] px-1.5 text-[11px] font-bold text-[#B8232D]">✗ you: A · answer: B</span>. We provide binoculars, so{" "}
        <mark className="rounded-[3px] bg-[#e6f7de] px-[3px] py-px text-black shadow-[inset_0_-2px_0_#2c6e1a] [box-decoration-break:clone]">
          <Q n={13} />
          the one thing you must bring is waterproof boots
        </mark>{" "}
        <span className="rounded-full bg-[#e6f7de] px-1.5 text-[11px] font-bold text-[#2c6e1a]">✓ C</span>.
      </p>
    </Frame>
  );
}

/** Step 4: this week's timetable and spaced review. */
export function PlanVisual() {
  const { t, locale } = useT();
  const n = (x: number) => formatNumber(x, locale);
  return (
    <Frame>
      <div className={label}>{t("mk.howTo.visual.timetable")}</div>
      <div className="mt-2.5 grid grid-cols-3 gap-2 text-[12px]">
        <div className="rounded-[10px] border-2 border-coral p-[7px]">
          <b>{t("mk.howTo.visual.mon")}</b>
          <div className="mt-1.5 rounded-md border-s-[3px] border-[#B8232D] bg-[#FFE3E3] px-1.5 py-[5px]">
            {t("mk.howTo.visual.task1")}
            <br />
            <span className="text-[#3a4855]">{t("mk.howTo.visual.min", { n: n(40) })}</span>
          </div>
        </div>
        <div className="rounded-[10px] border border-border p-2">
          <b>{t("mk.howTo.visual.tue")}</b>
          <div className="mt-1.5 rounded-md border-s-[3px] border-magenta bg-pink-tint px-1.5 py-[5px]">
            {t("mk.howTo.visual.task2")}
            <br />
            <span className="text-[#3a4855]">{t("mk.howTo.visual.min", { n: n(20) })}</span>
          </div>
        </div>
        <div className="rounded-[10px] border border-border p-2">
          <b>{t("mk.howTo.visual.sat")}</b>
          <div className="mt-1.5 rounded-md bg-primary px-1.5 py-[5px] text-white">
            {t("mk.howTo.visual.task3")}
            <br />
            <span className="opacity-85">{t("mk.howTo.visual.hoursMin", { h: n(2), m: n(45) })}</span>
          </div>
        </div>
      </div>
      <div className={cn(label, "mt-3")}>{t("mk.howTo.visual.reviewWhen")}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[12px]">
        <span className="rounded-full border border-pink-carnation bg-pink-tint px-2.5 py-[3px]">
          <b className="text-[#B8232D]">{t("mk.howTo.visual.today")}</b> · {t("mk.howTo.visual.words", { n: n(13) })}
        </span>
        <span className="rounded-full border border-border bg-background px-2.5 py-[3px]">
          <b>{t("mk.howTo.visual.in3")}</b> · {t("mk.howTo.visual.grammar")}
        </span>
        <span className="rounded-full border border-border bg-background px-2.5 py-[3px]">
          <b>{t("mk.howTo.visual.in7")}</b> · {t("mk.howTo.visual.maps")}
        </span>
      </div>
    </Frame>
  );
}

const CHARTS = [
  { key: "listening", band: 7, ok: true, color: "#3E4FC4", points: "10,50 50,30 90,40 130,20" },
  { key: "reading", band: 6.5, ok: false, color: "#E95FC4", points: "10,50 50,40 90,40 130,30" },
  { key: "writing", band: 6, ok: false, color: "#D92F3A", points: "10,50 50,50 90,40 130,40" },
  { key: "speakingSkill", band: 6.5, ok: false, color: "#4f9a2e", points: "10,40 50,40 90,30 130,30" },
] as const;

/** Step 5: band progress per skill, with the skills under target glowing red. */
export function ProgressVisual() {
  const { t, locale } = useT();
  return (
    <Frame>
      <div className={label}>{t("mk.howTo.visual.progress")}</div>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {CHARTS.map((c) => (
          <div
            key={c.key}
            className={cn(
              "rounded-xl px-2.5 py-2",
              c.ok ? "border border-border" : "border border-[#e0314f] shadow-[0_0_0_2px_rgba(255,77,106,0.2),0_0_10px_2px_rgba(255,59,92,0.3)]",
            )}
          >
            <div className="flex justify-between gap-1 text-[11px]">
              <b>{t(`mk.howTo.visual.${c.key}`)}</b>
              <span className={c.ok ? "text-[#2c6e1a]" : "text-[#B8232D]"}>{t(c.ok ? "mk.howTo.visual.onTarget" : "mk.howTo.visual.below")}</span>
            </div>
            <div className="text-[18px]">{formatBand(c.band, locale)}</div>
            <svg viewBox="0 0 140 70" width="100%" height="40" aria-hidden="true">
              <line x1="0" x2="140" y1="20" y2="20" stroke="#3E4FC4" strokeDasharray="3 3" />
              <polyline points={c.points} fill="none" stroke={c.color} strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
    </Frame>
  );
}
