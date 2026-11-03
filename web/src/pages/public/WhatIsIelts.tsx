import { useT } from "@/i18n";
import { Container, Kicker, PillLink } from "@/components/public/ui";
import { Mixed } from "@/components/public/Mixed";
import { Globe } from "@/components/public/what/Globe";
import { cn } from "@/lib/utils";

/*
 * What is IELTS? (route /what-is-ielts, canvas WhatIsIELTS.dc.html): a hero
 * with the spinning dotted globe, the four skills with their timings, and a
 * pale wisteria panel on the four test types. Copy lives in mk.what.
 * Text goes through Mixed, which isolates English terms inside Persian copy.
 */

const h2 = "m-0 font-archivo text-[clamp(28px,3.4vw,40px)] leading-[1.2] font-bold tracking-[-0.015em] text-primary";
const body = "font-archivo text-[17px] leading-7 text-[#3a4855]";

const SKILLS = [
  { key: "listening", bg: "bg-pale-wisteria", fg: "text-primary" },
  { key: "reading", bg: "bg-pink-tint", fg: "text-magenta" },
  { key: "writing", bg: "bg-[#FFE3E3]", fg: "text-[#B8232D]" },
  { key: "speaking", bg: "bg-[#e6f7de]", fg: "text-[#2c6e1a]" },
] as const;

const TYPES = [
  { key: "academic", border: "border-primary" },
  { key: "general", border: "border-coral" },
  { key: "ukvi", border: "border-magenta" },
  { key: "life", border: "border-[#7a6d00]" },
] as const;

export default function WhatIsIelts() {
  const { t } = useT();
  const k = (key: string) => t(`mk.what.${key}`);

  return (
    <>
      {/* Hero */}
      <section>
        <Container className="grid min-h-[clamp(640px,calc(100vh-132px),800px)] grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] content-center items-center gap-12 py-12 max-sm:min-h-0">
          <div>
            <Kicker>{k("kicker")}</Kicker>
            <h1 className="mt-6 mb-0 font-archivo text-[clamp(40px,5vw,60px)] leading-[1.15] font-bold tracking-[-0.02em] text-primary">
              <Mixed text={k("title")} />
            </h1>
            <p className="mt-5 mb-0 max-w-[540px] font-archivo text-[19px] leading-[30px] text-[#3a4855] max-sm:text-[17px] max-sm:leading-7 [&_b]:text-foreground">
              <Mixed text={k("lead")} />
            </p>
            <ul className="m-0 mt-6 flex list-none flex-wrap gap-2.5 p-0">
              {(["bands", "orgs", "format"] as const).map((c) => (
                <li key={c} className="rounded-full bg-pale-wisteria px-3.5 py-2 font-archivo text-[15px] leading-[22px] font-semibold text-midnight-iris">
                  <Mixed text={k(`chips.${c}`)} />
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 justify-items-center py-2">
            <Globe />
            <p className="m-0 mt-3.5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-archivo text-[15px] leading-[22px] font-semibold text-midnight-iris shadow-[0_6px_16px_rgba(43,36,112,0.10)]">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-coral shadow-[0_0_0_3px_rgba(250,255,127,0.9)]" />
              <span>
                <Mixed text={k("countries")} />
              </span>
            </p>
          </div>
        </Container>
      </section>

      {/* The four skills */}
      <section aria-labelledby="skills-title">
        <Container className="pt-6 pb-10">
          <h2 id="skills-title" className={h2}>
            {k("skills.title")}
          </h2>
          <p className={cn(body, "mt-2.5 mb-0")}>
            <Mixed text={k("skills.lead")} />
          </p>
          <ul className="m-0 mt-6 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-4 p-0">
            {SKILLS.map(({ key, bg, fg }) => (
              <li key={key} className={cn("rounded-[20px] px-[22px] py-5", bg)}>
                <h3 className={cn("m-0 font-gabarito text-[13px] leading-5 font-bold tracking-[0.1em] uppercase", fg)}>
                  <Mixed text={k(`skills.${key}.name`)} />
                </h3>
                <p className="m-0 mt-2 font-archivo text-[22px] leading-[30px] font-bold text-foreground">
                  <Mixed text={k(`skills.${key}.time`)} />
                </p>
                <p className="m-0 mt-1 font-archivo text-[15px] leading-[22px] text-[#3a4855]">
                  <Mixed text={k(`skills.${key}.detail`)} />
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Which test do you need? */}
      <section aria-labelledby="types-title">
        <Container className="pt-6 pb-12">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-10 rounded-[32px] bg-pale-wisteria p-12 max-md:p-8 max-sm:gap-8 max-sm:rounded-3xl max-sm:p-5">
            <div>
              <h2 id="types-title" className={h2}>
                {k("types.title")}
              </h2>
              <p className={cn(body, "mt-3 mb-0")}>{k("types.lead")}</p>
              <PillLink to="/sign-up" className="mt-6 px-[30px] py-3.5">
                {k("types.cta")}
              </PillLink>
            </div>
            <div className="flex flex-col gap-3">
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {TYPES.map(({ key, border }) => (
                  <li key={key} className={cn("rounded-[14px] border-s-4 bg-white px-3.5 py-3 text-start", border)}>
                    <h3 className="m-0 font-archivo text-[16px] leading-6 font-bold text-foreground">
                      <Mixed text={k(`types.${key}.name`)} />
                    </h3>
                    <p className="m-0 font-gabarito text-[14px] leading-[22px] text-[#3a4855]">
                      <Mixed text={k(`types.${key}.body`)} />
                    </p>
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-1 font-gabarito text-[13px] leading-5 text-muted-foreground">
                <Mixed text={k("types.note")} />
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
