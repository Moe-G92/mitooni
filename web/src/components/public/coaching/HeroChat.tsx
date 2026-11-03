import { useT } from "@/i18n";
import "./coaching.css";

/*
 * Hero mockup on the Coaching page: a laptop-style card with a short chat
 * between the coach and a student. Purely decorative, so it is aria-hidden;
 * the hero text says the same thing. The canvas keeps this chat in English and
 * left to right on the Persian page too (CoachingFa.dc.html), so both locales
 * read the same mk.coachPage.chat strings.
 */
export function HeroChat() {
  const { t } = useT();
  const k = (key: string) => t(`mk.coachPage.chat.${key}`);
  return (
    <div aria-hidden="true" lang="en" dir="ltr" className="coach-en mk-en">
      <div className="rounded-3xl border border-border bg-white p-1.5 shadow-[0_24px_48px_rgba(43,36,112,0.14)]">
        <div className="flex flex-col gap-3 rounded-lg bg-white p-5 font-archivo max-sm:p-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-bold text-white">{k("initial")}</span>
            <div>
              <div className="text-[16px] font-bold">{k("name")}</div>
              <div className="text-[13px] text-[#3a4855]">{k("role")}</div>
            </div>
          </div>
          <div className="max-w-[85%] self-start rounded-[16px_16px_16px_4px] bg-pale-wisteria px-4 py-3 text-[15px] leading-[22px]">
            {k("msg1")}
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 self-start rounded-xl border border-pink-carnation px-3.5 py-2.5 text-[14px]">
            <b className="text-[#B8232D]">{k("attachTitle")}</b>
            <span className="text-[#3a4855]">{k("attachMeta")}</span>
          </div>
          <div className="max-w-[80%] self-end rounded-[16px_16px_4px_16px] bg-primary px-4 py-3 text-[15px] leading-[22px] text-white">
            {k("msg2")}
          </div>
        </div>
      </div>
      {/* Laptop base: wider than the screen on desktop, kept inside the gutter on small screens. */}
      <div className="-ms-[6%] h-3.5 w-[112%] rounded-b-[14px] bg-[#d4d7dc] max-lg:-ms-[2%] max-lg:w-[104%]" />
    </div>
  );
}
