import { useT } from "@/i18n";
import { formatBand } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ButtonTray, Container, Kicker, PillLink, Tick, heroLead, heroTitle, sectionTitle } from "@/components/public/ui";
import { Mixed } from "@/components/public/Mixed";
import { DashboardMock, HeroBook, ReadyCard, ReportCard, WritingSheet } from "@/components/public/home/Art";
import { mockupStrings } from "@/components/public/home/mockup";

/*
 * Landing page, ported from the canvas Main.dc.html and MainFa.dc.html.
 * Copy renders through Mixed, which isolates English words (IELTS, Mock,
 * Listening…) inside Persian text. The product mock-ups stay English.
 */

function FeatureText({ icon, kicker, title, body }: { icon: React.ReactNode; kicker: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-[420px] text-center">
      <span className="inline-grid size-14 place-items-center rounded-full bg-coral text-white">{icon}</span>
      <p className="mt-4 mb-0 font-archivo text-[16px] leading-6 text-[#3a4855] italic [&:lang(fa)]:not-italic">{kicker}</p>
      <h3 className="mt-1 mb-0 font-archivo text-[28px] leading-9 font-bold text-primary max-sm:text-[24px] max-sm:leading-8">{title}</h3>
      <div className="mx-auto mt-4 h-0.5 w-[120px] bg-pink-carnation" />
      <p className="mt-4 mb-0 text-start font-archivo text-[17px] leading-7 text-[#3a4855] [&_b]:text-midnight-iris">
        <Mixed text={body} />
      </p>
    </div>
  );
}

const iconProps = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export default function Landing() {
  const { t } = useT();
  const en = mockupStrings();

  return (
    <>
      {/* Hero (overflow clipped so the scaled stamp never adds a horizontal scroll) */}
      <section className="overflow-x-clip">
        <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-center gap-12 pt-[72px] pb-20 max-sm:pt-10 max-sm:pb-14">
          <div className="min-w-0">
            <Kicker>
              <Mixed text={t("mk.home.hero.kicker")} />
            </Kicker>
            <h1 className={cn(heroTitle, "mt-6 mb-0")}>{t("mk.home.hero.title")}</h1>
            <p className={cn(heroLead, "mt-5 mb-0 max-w-[520px]")}>
              <Mixed text={t("mk.home.hero.lead")} />
            </p>
            <ButtonTray className="mt-8">
              <PillLink to="/sign-up">{t("mk.home.hero.cta")}</PillLink>
              <PillLink to="/how-it-works" variant="redOutline">
                {t("mk.home.hero.secondary")}
              </PillLink>
            </ButtonTray>
            <ul className="mt-7 mb-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 font-archivo text-[15px] leading-[22px] text-[#3a4855]">
              <li className="flex items-center gap-1.5">
                <Tick />
                <span>
                  <Mixed text={t("mk.home.hero.point1")} />
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <Tick />
                <span>
                  <Mixed text={t("mk.home.hero.point2")} />
                </span>
              </li>
            </ul>
          </div>
          <div className="min-w-0">
            <HeroBook />
            <ul className="mt-6 mb-0 flex list-none flex-wrap justify-center gap-2.5 p-0 font-archivo text-[14px] leading-5 font-semibold text-primary">
              {(["chip1", "chip2", "chip3"] as const).map((k) => (
                <li key={k} className="inline-flex items-center gap-1.5 rounded-full bg-pink-tint px-3.5 py-2">
                  <Tick size={14} />
                  {t(`mk.home.hero.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* What makes mitooni different */}
      <section aria-labelledby="diff-title" className="overflow-x-clip">
        <Container className="pt-6 pb-10">
          <h2 id="diff-title" className={cn(sectionTitle, "mx-auto my-0 max-w-[820px]")}>
            <Mixed text={t("mk.home.diff.title")} />
          </h2>
          <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-10 rounded-[32px] bg-pink-tint p-12 max-md:p-8 max-sm:gap-8 max-sm:px-4 max-sm:py-7">
            <DashboardMock />
            <FeatureText
              icon={
                <svg {...iconProps}>
                  <path d="M13 5h8" />
                  <path d="M13 12h8" />
                  <path d="M13 19h8" />
                  <path d="m3 17 2 2 4-4" />
                  <path d="m3 7 2 2 4-4" />
                </svg>
              }
              kicker={t("mk.home.diff.typesKicker")}
              title={t("mk.home.diff.typesTitle")}
              body={t("mk.home.diff.typesBody")}
            />
          </div>
          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-10 rounded-[32px] bg-pale-wisteria p-12 max-md:p-8 max-sm:gap-8 max-sm:px-4 max-sm:py-7">
            <FeatureText
              icon={
                <svg {...iconProps}>
                  <path d="M13 21h8" />
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                </svg>
              }
              kicker={t("mk.home.diff.feedbackKicker")}
              title={t("mk.home.diff.feedbackTitle")}
              body={t("mk.home.diff.feedbackBody")}
            />
            <WritingSheet />
          </div>
        </Container>
      </section>

      {/* Full mock exam */}
      <section aria-labelledby="mock-title">
        <Container className="py-4">
          <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-10 overflow-hidden rounded-[32px] bg-primary px-12 py-14 max-md:px-8 max-sm:px-5 max-sm:py-10">
            <div aria-hidden="true" className="pointer-events-none absolute -end-[120px] -top-[120px] size-[420px] rounded-full border-2 border-white/[0.08]" />
            <div aria-hidden="true" className="pointer-events-none absolute -end-[60px] -top-[60px] size-[300px] rounded-full border-2 border-white/[0.06]" />
            <div className="relative text-center">
              <p className="m-0 font-archivo text-[22px] leading-[30px] text-white/90 italic [&:lang(fa)]:not-italic">{t("mk.home.mock.kicker")}</p>
              <h2 id="mock-title" className="mt-1 mb-0 font-archivo text-[clamp(32px,4vw,46px)] leading-[1.15] font-bold tracking-[-0.015em] text-white">
                <Mixed text={t("mk.home.mock.title")} />
              </h2>
              <p className="mx-auto mt-4 mb-0 max-w-[440px] font-archivo text-[18px] leading-7 text-white/90">{t("mk.home.mock.body")}</p>
              <PillLink to="/sign-up" variant="white" className="mt-7">
                {t("mk.home.mock.cta")}
              </PillLink>
            </div>
            <div aria-hidden="true" lang="en" dir="ltr" className="mk-en relative mx-auto grid w-full max-w-[360px] grid-cols-2 gap-3">
              {(
                [
                  ["listening", 7],
                  ["reading", 6.5],
                  ["writing", 6],
                  ["speaking", 6.5],
                ] as const
              ).map(([s, b]) => (
                <div key={s} className={cn("rounded-[18px] p-5 text-white", s === "speaking" ? "bg-coral" : "bg-white/[0.08]")}>
                  <div className="font-gabarito text-[14px] tracking-[0.08em] text-white/90">{en.t(`skills.${s}`)}</div>
                  <div className="mt-2 font-archivo text-[36px] leading-none font-bold">{formatBand(b, en.locale)}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Report */}
      <section aria-labelledby="report-title">
        <Container className="pt-16 pb-6">
          <h2 id="report-title" className={cn(sectionTitle, "mx-auto my-0 max-w-[820px]")}>
            <Mixed text={t("mk.home.report.title")} />
          </h2>
          <ReportCard />
        </Container>
      </section>

      {/* Walk into the test knowing your band */}
      <section aria-labelledby="ready-title">
        <Container className="pt-10 pb-4">
          <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-10 overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,#2b4a63_0%,#3E4FC4_100%)] px-12 py-14 max-md:px-8 max-sm:px-5 max-sm:py-10">
            <ReadyCard />
            <div className="text-center">
              <h2 id="ready-title" className="m-0 font-archivo text-[clamp(30px,3.6vw,42px)] leading-[1.2] font-normal tracking-[-0.015em] text-white [&_b]:font-bold">
                <Mixed text={t("mk.home.ready.title")} />
              </h2>
              <p className="mx-auto mt-4 mb-0 max-w-[440px] font-archivo text-[18px] leading-7 text-white/90">{t("mk.home.ready.body")}</p>
              <PillLink to="/sign-up" className="mt-7 py-3 ps-7 pe-3.5">
                {t("mk.home.ready.cta")}
                <span className="grid size-7 place-items-center rounded-full bg-white text-coral">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:-scale-x-100">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </PillLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
