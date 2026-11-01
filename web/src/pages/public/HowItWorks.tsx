import { Link } from "react-router";
import { useT } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ButtonTray, Container, Kicker, PillLink, Rich, heroLead, heroTitle, sectionTitle } from "@/components/public/ui";
import { pillClass } from "@/components/public/pill";
import { BeforeAfter } from "@/components/public/how/BeforeAfter";
import { PlanVisual, ProgressVisual, SpeakingVisual, TargetVisual, TranscriptVisual } from "@/components/public/how/StepVisuals";

/*
 * How to use (canvas HowItWorks.dc.html, board "How to use").
 * 1. Hero with a before/after laptop you can drag.
 * 2. Two ways to start: a full mock or one skill.
 * 3. Five steps, then repeat.
 */

const icon = { fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const ICONS: Record<string, React.ReactNode> = {
  target: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </>
  ),
  book: (
    <>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </>
  ),
  screen: (
    <>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </>
  ),
  grid: (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>
  ),
  aim: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  timer: (
    <>
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="15" y1="14" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </>
  ),
  language: (
    <>
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </>
  ),
};

type OptionKey = "mock" | "skill";
const OPTIONS: { key: OptionKey; to: string; icons: string[]; red: boolean }[] = [
  { key: "mock", to: "/app/mocks", icons: ["target", "book", "screen", "chart"], red: true },
  { key: "skill", to: "/app/practice", icons: ["grid", "aim", "timer", "language"], red: false },
];

function OptionCard({ n, opt }: { n: number; opt: (typeof OPTIONS)[number] }) {
  const { t, locale } = useT();
  const k = (s: string) => t(`mk.howTo.options.${opt.key}.${s}`);
  const colour = opt.red ? "#D92F3A" : "#3E4FC4";
  return (
    <article className="flex flex-col overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_14px_34px_rgba(43,36,112,0.08)]">
      <div className={cn("flex flex-wrap items-center justify-between gap-3 px-[26px] py-5 text-white max-sm:px-5", opt.red ? "bg-coral" : "bg-primary")}>
        <div>
          <div className={cn("text-[12px] font-bold tracking-[0.12em] uppercase", !opt.red && "text-white/85")}>{t("mk.howTo.options.option", { n: formatNumber(n, locale) })}</div>
          <h3 className="mt-0.5 text-[24px] leading-[30px] font-extrabold text-white max-sm:text-[21px] max-sm:leading-7">{k("title")}</h3>
        </div>
        <div
          className={cn("flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-bold", opt.red ? "bg-black/12" : "bg-white/16")}
        >
          <span className="sr-only">{t("mk.howTo.options.duration", { time: k("time") })}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" stroke="#ffffff" {...icon}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span aria-hidden="true">{k("time")}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-5 px-[26px] pt-[22px] pb-6 max-sm:px-5">
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {[1, 2, 3].map((c) => (
            <li key={c} className={cn("rounded-full px-3 py-[5px] text-[13px] font-bold", opt.red ? "bg-[#FFE3E3] text-[#B8232D]" : "bg-pale-wisteria text-primary")}>
              {k(`chip${c}`)}
            </li>
          ))}
        </ul>
        <ol className="m-0 flex list-none items-start gap-[26px] p-0 max-sm:gap-5">
          {opt.icons.map((ic, i) => (
            <li key={ic} className="relative flex min-w-0 flex-[1_1_0] flex-col items-center gap-2 text-center">
              {i > 0 && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  stroke="#9aa3ad"
                  {...icon}
                  strokeWidth={2.4}
                  className="absolute -start-[22px] top-[21px] rtl:-scale-x-100 max-sm:-start-[17px] max-sm:top-[17px] max-sm:size-3.5"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              )}
              <span className={cn("relative grid size-[60px] place-items-center rounded-[18px] max-sm:size-12 max-sm:rounded-[14px]", opt.red ? "bg-[#FFE3E3]" : "bg-pale-wisteria")}>
                <svg width="26" height="26" viewBox="0 0 24 24" stroke={colour} {...icon} className="max-sm:size-[22px]">
                  {ICONS[ic]}
                </svg>
                <b aria-hidden="true" className={cn("absolute -end-1.5 -top-1.5 grid size-[22px] place-items-center rounded-full text-[12px] text-white", opt.red ? "bg-coral" : "bg-primary")}>
                  {formatNumber(i + 1, locale)}
                </b>
              </span>
              <span className="text-[14px] leading-[18px] font-semibold text-foreground max-sm:text-[12.5px] max-sm:leading-4">{k(`s${i + 1}`)}</span>
            </li>
          ))}
        </ol>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3] pt-4">
          <span className="text-[14px] text-[#3a4855] [&_b]:text-foreground">
            <Rich text={k("best")} />
          </span>
          <Link to={opt.to} className={pillClass(opt.red ? "red" : "blue", "md", "px-5 py-2.5")}>
            {k("cta")}
          </Link>
        </div>
      </div>
    </article>
  );
}

const linkClass =
  "text-foreground underline decoration-1 underline-offset-4 hover:text-deep-wisteria-dark focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const STEPS: { visual: React.ReactNode; links: string[]; flip: boolean }[] = [
  { visual: <TargetVisual />, links: ["/app"], flip: false },
  { visual: <SpeakingVisual />, links: ["/app/mocks"], flip: true },
  { visual: <TranscriptVisual />, links: ["/app/results"], flip: false },
  { visual: <PlanVisual />, links: ["/app/coach", "/app/vocabulary"], flip: true },
  { visual: <ProgressVisual />, links: ["/app/results", "/app/progress"], flip: false },
];

export default function HowItWorks() {
  const { t, locale } = useT();
  return (
    <>
      <section aria-labelledby="how-hero-title">
        <Container className="grid min-h-[clamp(640px,calc(100vh-132px),800px)] grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] content-center items-center gap-12 py-12 max-sm:min-h-0 max-sm:gap-10 max-sm:py-10">
          <div>
            <Kicker>
              <Rich text={t("mk.howTo.hero.kicker")} />
            </Kicker>
            <h1 id="how-hero-title" className={cn(heroTitle, "mt-6 text-[clamp(40px,5vw,60px)]")}>
              {t("mk.howTo.hero.title")}
            </h1>
            <p className={cn(heroLead, "mt-5 max-w-[520px]")}>
              <Rich text={t("mk.howTo.hero.lead")} />
            </p>
            <ButtonTray className="mt-8">
              <PillLink to="/sign-up">{t("mk.howTo.hero.start")}</PillLink>
              <a href="#steps" className={pillClass("redOutline")}>
                {t("mk.howTo.hero.steps")}
              </a>
            </ButtonTray>
          </div>
          <BeforeAfter />
        </Container>
      </section>

      <section id="options" aria-labelledby="how-options-title">
        <Container className="flex min-h-[clamp(640px,100vh,900px)] flex-col justify-center py-12 font-archivo max-sm:min-h-0">
          <h2 id="how-options-title" className={cn(sectionTitle, "mx-auto max-w-[820px] text-[clamp(30px,3.6vw,44px)]")}>
            <Rich text={t("mk.howTo.options.title")} />
          </h2>
          <p className="mx-auto mt-2.5 max-w-[620px] text-center text-[17px] leading-[26px] text-[#3a4855]">{t("mk.howTo.options.lead")}</p>
          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,500px),1fr))] gap-6">
            {OPTIONS.map((o, i) => (
              <OptionCard key={o.key} n={i + 1} opt={o} />
            ))}
          </div>
        </Container>
      </section>

      <section id="steps" aria-labelledby="how-steps-title" className="scroll-mt-4">
        <div className="mx-auto box-border max-w-[1120px] px-6 pt-8 pb-14 font-archivo max-sm:px-4">
          <h2 id="how-steps-title" className="text-[clamp(30px,3.6vw,44px)] leading-[1.2] font-bold tracking-[-0.015em] text-primary">
            {t("mk.howTo.steps.title")}
          </h2>
          <p className="mt-2.5 text-[18px] leading-7 text-[#3a4855] max-sm:text-[17px]">{t("mk.howTo.steps.lead")}</p>
          <ol className="m-0 mt-8 list-none p-0">
            {STEPS.map((s, i) => {
              const n = i + 1;
              return (
                <li key={n} className="grid grid-cols-1 items-center gap-14 border-t border-border py-11 max-sm:gap-8 max-sm:py-9 min-[944px]:grid-cols-2">
                  <div className="max-w-[460px]">
                    <div
                      aria-hidden="true"
                      className="text-[88px] leading-[0.9] font-extrabold tracking-[-0.04em] text-transparent [-webkit-text-stroke:2px_#3E4FC4] max-sm:text-[72px]"
                    >
                      {formatNumber(n, locale)}
                    </div>
                    <h3 className="mt-3.5 text-[28px] leading-[34px] font-bold tracking-[-0.01em] text-primary max-sm:text-[24px] max-sm:leading-[30px]">
                      <span className="sr-only">{t("mk.howTo.steps.step", { n: formatNumber(n, locale) })}: </span>
                      <span className="bg-[linear-gradient(transparent_60%,#FDFFC7_60%)] box-decoration-clone">{t(`mk.howTo.steps.s${n}.title`)}</span>
                    </h3>
                    <p className="mt-3 text-[17px] leading-7 text-[#3a4855]">{t(`mk.howTo.steps.s${n}.body`)}</p>
                    <p className="mt-3.5 text-[15px] text-muted-foreground">
                      {s.links.map((to, j) => (
                        <span key={to}>
                          {j > 0 && " · "}
                          <Link to={to} className={linkClass}>
                            {t(`mk.howTo.steps.s${n}.link${j + 1}`)}
                          </Link>
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className={cn("min-w-0", s.flip && "min-[944px]:order-first")}>{s.visual}</div>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 border-t border-border pt-6 text-[16px] text-[#3a4855]">
            {t("mk.howTo.steps.again")}{" "}
            <Link
              to="/app/mocks"
              className="font-semibold text-[#B8232D] underline underline-offset-2 hover:text-[#8f1a22] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("mk.howTo.steps.book")}
              <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" {...icon} strokeWidth={3} className="ms-1 inline-block align-[-1px] rtl:-scale-x-100">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
