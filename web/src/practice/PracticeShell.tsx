import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/TopControls";
import { useT } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import "./practice.css";

/*
 * Frame shared by the four skill practice players (canvas boards
 * PracticeListening, PracticeReading, PracticeWriting, PracticeSpeaking):
 * a white header with the logo, breadcrumb, progress dots, language switch
 * and Exit, then a coloured hero band. Each skill has its own hero colour.
 * The pages are full screen like the exam, outside the app sidebar.
 */

export type Skill = "listening" | "reading" | "writing" | "speaking";

type Theme = {
  /** Breadcrumb colour for the skill name. */
  crumb: string;
  /** Hero band. */
  hero: string;
  eyebrow: string;
  title: string;
  sub: string;
  /** Progress dots: current dot fill and halo. */
  dotCur: string;
  dotHalo: string;
};

const THEMES: Record<Skill, Theme> = {
  listening: {
    crumb: "text-[#3E4FC4]",
    hero: "bg-[linear-gradient(110deg,#2B2470_0%,#3E4FC4_70%,#5866d6_100%)] text-white",
    eyebrow: "text-[#FAFF7F]",
    title: "text-white",
    sub: "text-white/85",
    dotCur: "#3E4FC4",
    dotHalo: "#EEF1FF",
  },
  reading: {
    crumb: "text-[#B02C8C]",
    hero: "bg-[#FFE6F8] border-b-[3px] border-[#FF88DC]",
    eyebrow: "text-[#B02C8C]",
    title: "text-[#2B2470]",
    sub: "text-[#3a4855]",
    dotCur: "#FF88DC",
    dotHalo: "#FFE6F8",
  },
  writing: {
    crumb: "text-[#B8232D]",
    hero: "bg-[linear-gradient(120deg,#C42632_0%,#A61E2A_100%)] text-white",
    eyebrow: "text-[#FAFF7F]",
    title: "text-white",
    sub: "text-white/90",
    dotCur: "#D92F3A",
    dotHalo: "#FFECEE",
  },
  speaking: {
    crumb: "text-[#2c6e1a]",
    hero: "bg-[linear-gradient(110deg,#23591a_0%,#2c6e1a_55%,#347a20_100%)] text-white",
    eyebrow: "text-[#FAFF7F]",
    title: "text-white",
    sub: "text-white/90",
    dotCur: "#2c6e1a",
    dotHalo: "#e6f7de",
  },
};

export type DotState = "right" | "wrong" | "current" | "todo";

/** Progress dots in the header, one per question, paragraph or card. */
export function ProgressDots({ skill, dots, label }: { skill: Skill; dots: DotState[]; label: string }) {
  const th = THEMES[skill];
  return (
    <div role="img" aria-label={label} className="hidden items-center gap-1.5 sm:flex">
      {dots.map((d, i) => (
        <i
          key={i}
          className={cn("block rounded-full", d === "current" ? "size-3" : "size-2")}
          style={{
            background: d === "right" ? "#4f9a2e" : d === "wrong" ? "#D92F3A" : d === "current" ? th.dotCur : "#d6dae3",
            boxShadow: d === "current" ? `0 0 0 3px ${th.dotHalo}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function PracticeShell({
  skill,
  topic,
  dots,
  dotsLabel,
  eyebrow,
  title,
  sub,
  heroSide,
  children,
}: {
  skill: Skill;
  /** Last breadcrumb step, e.g. "Matching headings". */
  topic: string;
  dots?: DotState[];
  dotsLabel?: string;
  eyebrow: string;
  title: string;
  sub: string;
  heroSide?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useT();
  const th = THEMES[skill];
  return (
    <div className="min-h-dvh bg-white text-[#011627]">
      <header className="flex h-16 items-center gap-3 border-b border-[#e1e4e8] bg-white px-4 md:gap-6 md:px-8">
        <Link to="/app" aria-label={t("pp.home")} className="shrink-0 rounded-lg">
          <Logo />
        </Link>
        <nav aria-label={t("pp.breadcrumb")} className="hidden min-w-0 flex-1 truncate text-center text-sm text-[#556170] md:block">
          <Link to="/app/practice" className="text-[#556170] no-underline hover:text-[#2F3DA0] hover:underline">
            {t("pp.practice")}
          </Link>
          <span aria-hidden="true"> · </span>
          <span className={cn("font-semibold", th.crumb)}>{t(`pp.skill.${skill}`)}</span>
          <span aria-hidden="true"> · </span>
          <span className="font-semibold text-[#011627]" aria-current="page">
            {topic}
          </span>
        </nav>
        <div className="ms-auto flex shrink-0 items-center gap-3 md:ms-0">
          {dots && dotsLabel && <ProgressDots skill={skill} dots={dots} label={dotsLabel} />}
          <LanguageSwitch className="h-8" />
          <Link
            to="/app/practice"
            className="inline-flex h-8 items-center rounded-[10px] border border-[#e1e4e8] px-3.5 text-sm font-semibold text-[#011627] no-underline hover:bg-[#EEF1FF]"
          >
            {t("pp.exit")}
          </Link>
        </div>
      </header>

      <section className={cn("relative overflow-hidden", th.hero)}>
        {skill === "listening" && (
          <>
            <div aria-hidden="true" className="absolute -top-16 end-[60px] hidden size-60 rounded-full border-2 border-[rgba(250,255,127,0.25)] md:block" />
            <div aria-hidden="true" className="absolute -top-5 end-[120px] hidden size-40 rounded-full border-2 border-[rgba(250,255,127,0.18)] md:block" />
          </>
        )}
        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-7">
          <div className="min-w-0">
            <div className={cn("pp-caps text-xs font-bold", th.eyebrow)}>{eyebrow}</div>
            <h1 className={cn("mt-1.5 font-archivo text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em] md:text-[40px]", th.title)}>{title}</h1>
            <p className={cn("mt-1.5 text-[15px] md:text-base", th.sub)}>{sub}</p>
          </div>
          {heroSide && <div className="shrink-0">{heroSide}</div>}
        </div>
      </section>

      {children}
    </div>
  );
}

/** The canary "Practice mode" pill. */
export function PracticePill({ children, icon, tone = "canary" }: { children: ReactNode; icon?: ReactNode; tone?: "canary" | "pink" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold",
        tone === "canary" ? "bg-[#FAFF7F] text-[#2B2470]" : "border-2 border-[#FF88DC] bg-white text-[#B02C8C]",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** "1 right · 1 to review · 2 to go" with coloured numbers. */
export function Tally({ right, review, left, reviewKey = "pp.toReview" }: { right: number; review: number; left: number; reviewKey?: string }) {
  const { t, locale } = useT();
  const n = (v: number, c: string) => <b className={cn("font-archivo", c)}>{formatNumber(v, locale)}</b>;
  return (
    <span className="text-[13px] text-[#556170]" aria-live="polite">
      {n(right, "text-[#2c6e1a]")} {t("pp.right")} · {n(review, "text-[#B8232D]")} {t(reviewKey)} · {n(left, "text-[#2B2470]")} {t("pp.toGo")}
    </span>
  );
}

/** Lightbulb icon used on the Hint buttons. */
export function HintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function CrossIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function PlayIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4l14 8-14 8z" />
    </svg>
  );
}

export function PauseIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2M9 2h6" />
    </svg>
  );
}
