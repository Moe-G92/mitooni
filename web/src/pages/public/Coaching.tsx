import { CalendarClock, MessagesSquare, Mic, PenLine } from "lucide-react";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { MkButton } from "@/layouts/PublicLayout";
import { CtaCard, PageHero, body } from "@/components/marketing";

const ITEMS = [
  { icon: PenLine, bg: "bg-mk-blue" },
  { icon: Mic, bg: "bg-mk-pink" },
  { icon: CalendarClock, bg: "bg-mk-butter" },
  { icon: MessagesSquare, bg: "bg-mk-green" },
];

export default function Coaching() {
  const { t } = useT();
  return (
    <>
      <PageHero kicker={t("coachPub.eyebrow")} title={t("coachPub.title")} lead={t("coachPub.lead")} />

      <section className="px-4 pb-4 max-md:px-3 max-md:pb-3">
        <ul className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 md:grid-cols-2 max-md:gap-3">
          {ITEMS.map(({ icon: Icon, bg }, i) => (
            <li key={i} className={cn("flex flex-col gap-6 rounded-[32px] p-12 max-md:p-7", bg)}>
              <span className="grid size-14 place-items-center rounded-2xl bg-mk-card" aria-hidden="true">
                <Icon className="size-6" />
              </span>
              <div>
                <h2 className="font-archivo text-[32px] leading-10 font-semibold tracking-[-0.015em] max-[1200px]:text-[26px] max-[1200px]:leading-8">{t(`coachPub.i${i + 1}Title`)}</h2>
                <p className={cn(body, "mt-3")}>{t(`coachPub.i${i + 1}Body`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <CtaCard
        title={t("coachPub.ctaTitle")}
        text={t("coachPub.note")}
        action={
          <MkButton to="/sign-up" light className="mt-8 px-7 py-3.5 text-[18px]">
            {t("coachPub.cta")}
          </MkButton>
        }
      />
    </>
  );
}
