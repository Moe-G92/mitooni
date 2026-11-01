import { useT } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container, Kicker, Rich, heroLead, sectionTitle } from "@/components/public/ui";
import { pillClass } from "@/components/public/pill";
import { HeroChat } from "@/components/public/coaching/HeroChat";
import { CompareTable } from "@/components/public/coaching/CompareTable";
import { WeekBoard } from "@/components/public/coaching/WeekBoard";
import { Plans } from "@/components/public/coaching/Plans";
import { CheckIcon } from "@/components/public/coaching/icons";

/*
 * Coaching (route /coaching), ported from the canvas Coaching.dc.html:
 * hero with a chat mockup, practice vs coaching table, a week with your coach,
 * how coaching works, plans, and a closing "for you if" band.
 * The canvas has no interactive state; the only links are in-page anchors
 * (#plans, #compare) and plan buttons that lead to account creation.
 */

const FACTS = ["f1", "f2", "f3", "f4"] as const;
const STEPS = ["s1", "s2", "s3", "s4"] as const;
const FOR_YOU = ["i1", "i2", "i3", "i4"] as const;

export default function Coaching() {
  const { t, locale } = useT();
  const k = (key: string) => t(`mk.coachPage.${key}`);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="coach-title">
        <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-center gap-12 pt-16 pb-10 max-sm:pt-10">
          <div>
            <Kicker>
              <Rich text={k("hero.kicker")} />
            </Kicker>
            <h1
              id="coach-title"
              className={cn(
                "mt-6 font-archivo text-[clamp(40px,5vw,58px)] leading-[1.15] font-bold tracking-[-0.02em] text-primary max-sm:text-[36px]",
                /* Persian words run wider; balance the lines so no single word is left alone. */
                locale === "fa" && "text-balance",
              )}
            >
              {k("hero.titleA")}
              <span className="bg-[linear-gradient(transparent_62%,#FAFF7F_62%)]">{k("hero.titleHl")}</span>
              {k("hero.titleB")}
            </h1>
            <p className={cn(heroLead, "mt-5 max-w-[540px]")}>
              <Rich text={k("hero.lead")} />
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#plans" className={pillClass("red")}>
                {k("hero.ctaPlans")}
              </a>
              <a href="#compare" className={pillClass("redOutline")}>
                {k("hero.ctaWhy")}
              </a>
            </div>
            <ul aria-label={k("hero.factsLabel")} className="mt-7 grid list-none grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 p-0">
              {FACTS.map((f) => (
                <li key={f} className="rounded-[18px] border border-border bg-white px-4 py-3.5 font-archivo">
                  <b className="block text-[22px] leading-[1.5] text-midnight-iris">{k(`hero.${f}Value`)}</b>
                  <span className="text-[14px] text-muted-foreground">{k(`hero.${f}Label`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <HeroChat />
        </Container>
      </section>

      <CompareTable />

      <WeekBoard />

      {/* How coaching works */}
      <section aria-labelledby="coach-how-title">
        <Container className="pt-4 pb-12">
          <div className="rounded-[32px] bg-pale-wisteria p-10 max-md:p-6 max-sm:rounded-3xl max-sm:p-5">
            <h2 id="coach-how-title" className={cn(sectionTitle, "m-0 text-[clamp(30px,3.6vw,44px)]")}>
              <Rich text={k("how.title")} />
            </h2>
            <ol className="mt-7 flex list-none flex-wrap gap-4 p-0">
              {STEPS.map((s, i) => (
                <li key={s} className="flex-[1_1_200px] rounded-[22px] border border-border bg-white p-5">
                  <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-coral font-archivo text-[18px] font-extrabold text-white">
                    {formatNumber(i + 1, locale)}
                  </span>
                  <h3 className="mt-3 font-archivo text-[19px] font-extrabold text-foreground">{k(`how.${s}Title`)}</h3>
                  <p className="mt-1.5 font-archivo text-[15px] leading-[23px] text-[#3a4855]">{k(`how.${s}Body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <Plans />

      {/* Coaching is for you if… */}
      <section aria-labelledby="coach-foryou-title">
        <Container className="pt-4 pb-16">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-10 rounded-[32px] bg-[linear-gradient(135deg,#2B2470_0%,#3E4FC4_100%)] p-12 max-md:p-8 max-sm:rounded-3xl max-sm:p-6 rtl:bg-[linear-gradient(-135deg,#2B2470_0%,#3E4FC4_100%)]">
            <div>
              <h2 id="coach-foryou-title" className="m-0 font-archivo text-[clamp(28px,3.2vw,38px)] leading-[1.2] font-extrabold text-white">
                {k("forYou.title")}
              </h2>
              <ul className="mt-5 flex list-none flex-col gap-3 p-0">
                {FOR_YOU.map((i) => (
                  <li key={i} className="flex items-start gap-2.5 font-archivo text-[17px] leading-[25px] text-white">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-canary-yellow">
                      <CheckIcon color="#2B2470" />
                    </span>
                    {k(`forYou.${i}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <p className={cn("m-0 font-archivo text-[22px] leading-[30px] text-white/85", locale !== "fa" && "italic")}>{k("forYou.means")}</p>
              <p className="mt-1 font-archivo text-[clamp(36px,4.4vw,52px)] leading-[1.1] font-extrabold text-canary-yellow">{k("forYou.youCan")}</p>
              <p className="mx-auto mt-3 max-w-[360px] font-archivo text-[17px] leading-[26px] text-white/85">{k("forYou.body")}</p>
              <a href="#plans" className={pillClass("red", "lg", "mt-[22px] focus-visible:outline-canary-yellow")}>
                {k("forYou.cta")}
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
