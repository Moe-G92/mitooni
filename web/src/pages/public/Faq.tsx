import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { Container, Kicker, PillLink, heroLead } from "@/components/public/ui";

/* FAQ page, ported from the canvas FAQ.dc.html. Native details/summary keeps it keyboard and screen-reader friendly. */

const GROUPS = [
  { key: "about", count: 3, chip: "bg-pale-wisteria text-primary", heading: "text-primary", dot: "bg-primary", icon: "bg-pale-wisteria text-primary" },
  { key: "bands", count: 2, chip: "bg-pink-tint text-magenta", heading: "text-magenta", dot: "bg-magenta", icon: "bg-pink-tint text-magenta" },
  { key: "practice", count: 3, chip: "bg-[#e6f7de] text-[#2c6e1a]", heading: "text-[#2c6e1a]", dot: "bg-[#2c6e1a]", icon: "bg-[#e6f7de] text-[#2c6e1a]" },
  { key: "coaching", count: 2, chip: "bg-[#FFE3E3] text-[#B8232D]", heading: "text-[#B8232D]", dot: "bg-[#B8232D]", icon: "bg-[#FFE3E3] text-[#B8232D]" },
] as const;

function HelpArt() {
  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" aria-hidden="true" className="max-md:hidden">
      <rect x="58" y="60" width="104" height="164" rx="18" fill="#ffffff" stroke="#3E4FC4" strokeWidth="6" />
      <rect x="78" y="150" width="64" height="8" rx="4" fill="#e1e4e8" />
      <rect x="78" y="166" width="48" height="8" rx="4" fill="#e1e4e8" />
      <rect x="74" y="188" width="72" height="22" rx="11" fill="#3E4FC4" />
      <path d="M120 16c33 0 60 22 60 50s-27 50-60 50c-6 0-12-1-17-2l-23 14 6-21c-16-9-26-24-26-41 0-28 27-50 60-50z" fill="#3E4FC4" />
      <path d="M106 52c0-9 7-15 15-15s15 6 15 14c0 10-12 11-12 21" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="124" cy="88" r="5" fill="#ffffff" />
      <circle cx="192" cy="150" r="14" fill="#D92F3A" />
      <circle cx="40" cy="120" r="9" fill="#FF88DC" />
    </svg>
  );
}

export default function Faq() {
  const { t } = useT();
  return (
    <>
      <section>
        <Container className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-8 pt-14 pb-6 max-sm:pt-10">
          <div>
            <Kicker>{t("mk.faqPage.kicker")}</Kicker>
            <h1 className="mt-5 mb-0 font-archivo text-[clamp(34px,4.6vw,56px)] leading-[1.15] font-bold tracking-[-0.02em] text-primary">{t("mk.faqPage.title")}</h1>
            <p className={cn(heroLead, "mt-3.5 mb-0 max-w-[560px] text-[18px] leading-7")}>{t("mk.faqPage.lead")}</p>
            <nav aria-label={t("mk.faqPage.jump")} className="mt-[22px]">
              <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
                {GROUPS.map((g) => (
                  <li key={g.key}>
                    <a href={`#faq-${g.key}`} className={cn("inline-block rounded-full px-4 py-2 font-archivo text-[15px] font-bold no-underline hover:underline", g.chip)}>
                      {t(`mk.faqPage.groups.${g.key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <HelpArt />
        </Container>
      </section>

      <Container className="flex max-w-[900px] flex-col gap-9 pt-6 pb-10">
        {GROUPS.map((g, gi) => (
          <section key={g.key} id={`faq-${g.key}`} aria-labelledby={`faq-${g.key}-title`} className="scroll-mt-5">
            <h2 id={`faq-${g.key}-title`} className={cn("m-0 flex items-center gap-2.5 font-archivo text-[22px] font-extrabold", g.heading)}>
              <i aria-hidden="true" className={cn("size-2.5 rounded-full", g.dot)} />
              {t(`mk.faqPage.groups.${g.key}`)}
            </h2>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {Array.from({ length: g.count }, (_, i) => i + 1).map((n) => (
                <details key={n} open={gi === 0 && n === 1} className="group rounded-[18px] border border-border bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3.5 rounded-[18px] px-5 py-[18px] font-archivo text-[18px] font-bold text-foreground max-sm:text-[17px] [&::-webkit-details-marker]:hidden">
                    {t(`mk.faqPage.${g.key}.q${n}`)}
                    <span className={cn("grid size-8 flex-none place-items-center rounded-full", g.icon)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" className="group-open:hidden" />
                      </svg>
                    </span>
                  </summary>
                  <p className="m-0 px-5 pb-5 font-archivo text-[16px] leading-[26px] text-[#3a4855]">{t(`mk.faqPage.${g.key}.a${n}`)}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </Container>

      <section aria-labelledby="faq-contact">
        <Container className="max-w-[900px] pt-2 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-midnight-iris px-7 py-6 font-archivo text-white max-sm:px-5">
            <div>
              <h2 id="faq-contact" className="m-0 text-[20px] font-bold">
                {t("mk.faqPage.contactTitle")}
              </h2>
              <p className="mt-1 mb-0 text-[15px] text-white/85">{t("mk.faqPage.contactBody")}</p>
            </div>
            <PillLink to="/app/coach" size="md" className="px-6 py-3 text-[16px]">
              {t("mk.faqPage.contact")}
            </PillLink>
          </div>
        </Container>
      </section>
    </>
  );
}
