import { useState } from "react";
import { useT } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MkButton } from "@/layouts/PublicLayout";
import { CtaCard, FaqItem, PageHero, Section, bigTitle, body, eyebrow } from "@/components/marketing";

const STEP_BG = ["bg-mk-peach", "bg-mk-beige", "bg-mk-lavender", "bg-mk-sage"];

export default function HowItWorks() {
  const { t, locale } = useT();
  const [open, setOpen] = useState(1);
  return (
    <>
      <PageHero kicker={t("mk.hero.eyebrow")} title={t("how.title")} lead={t("how.lead")} />

      <section className="px-4 pb-4 max-md:px-3 max-md:pb-3">
        <ol className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 md:grid-cols-2 max-md:gap-3">
          {[1, 2, 3, 4].map((n, i) => (
            <li key={n} className={cn("flex flex-col gap-6 rounded-[32px] p-12 max-md:p-7", STEP_BG[i])}>
              <span className="grid size-14 place-items-center rounded-full bg-mk-ink font-archivo text-[24px] font-semibold text-mk-page" aria-hidden="true">
                {formatNumber(n, locale)}
              </span>
              <div>
                <h2 className="font-archivo text-[32px] leading-10 font-semibold tracking-[-0.015em] max-[1200px]:text-[26px] max-[1200px]:leading-8">{t(`how.s${n}Title`)}</h2>
                <p className={cn(body, "mt-3")}>{t(`how.s${n}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Section className="bg-mk-teal">
        <div className="flex flex-col items-center px-6 pt-20 text-center max-md:pt-14">
          <p className={eyebrow}>{t("mk.faq.eyebrow")}</p>
          <h2 className={cn(bigTitle, "mt-4")}>{t("how.faqTitle")}</h2>
        </div>
        <div className="mx-auto flex max-w-[1040px] flex-col gap-3 px-6 pt-12 pb-20 max-md:pb-14">
          {[1, 2, 3, 4, 5].map((n) => (
            <FaqItem key={n} q={t(`how.q${n}`)} a={t(`how.a${n}`)} open={open === n} onToggle={() => setOpen(open === n ? 0 : n)} />
          ))}
        </div>
      </Section>

      <CtaCard
        title={t("mk.start.title")}
        text={t("mk.start.body")}
        action={
          <MkButton to="/sign-up" light className="mt-8 px-7 py-3.5 text-[18px]">
            {t("mk.start.cta")}
          </MkButton>
        }
      />
    </>
  );
}
