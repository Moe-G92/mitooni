import type { CSSProperties, ReactNode } from "react";
import { useT } from "@/i18n";
import { formatBand, formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import "./coaching.css";

/*
 * "A week with your coach" (canvas section #includes): a dotted cork-board
 * with four pinned notes, Mon / Wed / Thu / Sun. The notes are illustrations
 * (aria-hidden); the heading and sentence under each one carry the meaning.
 * As on the canvas Persian board (CoachingFa.dc.html), the day labels and the
 * notes stay in English and the four days run left to right in both locales;
 * only the heading and sentence under each note follow the page language.
 * Upper-case labels are cased in code because index.css switches CSS
 * text-transform off on Persian pages.
 */

const noteShadow = "shadow-[0_2px_3px_rgba(0,0,0,0.06),0_14px_26px_rgba(43,36,112,0.12)]";

/** Strip of washi tape across the top of a note. */
function Tape({ left, rotate }: { left: string; rotate: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-3 h-6 w-[86px] bg-[rgba(201,210,255,0.75)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
      style={{ left, transform: `translateX(-50%) rotate(${rotate}deg)` }}
    />
  );
}

function Day({ label, children, title, body }: { label: string; children: ReactNode; title: string; body: string }) {
  const { locale } = useT();
  return (
    <div className="flex flex-col gap-[22px]">
      <div lang="en" className="coach-en mk-en border-b-2 border-midnight-iris pb-2">
        <b className="font-archivo text-[22px] font-extrabold text-midnight-iris">{label}</b>
      </div>
      {children}
      <div lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
        <h3 className="m-0 font-archivo text-[18px] leading-6 font-extrabold text-foreground">{title}</h3>
        <p className="mt-1 font-archivo text-[15px] leading-[23px] text-[#3a4855]">{body}</p>
      </div>
    </div>
  );
}

const WAVE = [8, 16, 10, 22, 14, 20, 8, 24, 12, 18, 10, 22, 8, 16, 12];

const linedPaper: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(180deg, transparent 0, transparent 25px, #e4e8f2 25px, #e4e8f2 26px)",
  backgroundPosition: "0 44px",
};

export function WeekBoard() {
  const { t } = useT();
  const k = (key: string) => t(`mk.coachPage.week.${key}`);
  /* Handwritten tutor notes: the notes are English in both locales, so always italic. */
  const hand = "font-gabarito font-bold text-[#B8232D] italic";

  return (
    <section id="includes" aria-labelledby="coach-week-title">
      <div className="mx-auto box-border max-w-[1200px] px-6 pt-8 pb-12 max-sm:px-4">
        <div
          className="rounded-[32px] bg-[#FBF7EF] px-10 pt-11 pb-12 max-md:px-6 max-md:pt-8 max-md:pb-9 max-sm:rounded-3xl max-sm:px-5"
          style={{ backgroundImage: "radial-gradient(#e8dfcc 1.2px, transparent 1.2px)", backgroundSize: "22px 22px" }}
        >
          <h2 id="coach-week-title" className="m-0 font-archivo text-[clamp(30px,3.6vw,44px)] leading-[1.2] font-bold tracking-[-0.015em] text-foreground">
            {k("title")}
          </h2>
          <p className="mt-2.5 max-w-[620px] font-archivo text-[18px] leading-7 text-[#3a4855] max-sm:text-[17px]">{k("lead")}</p>

          <div dir="ltr" className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-8">
            {/* Monday: the marked essay */}
            <Day label={k("mon")} title={k("essayTitle")} body={k("essayBody")}>
              <div aria-hidden="true" lang="en" className={cn("coach-en mk-en mk-en relative -rotate-[2.5deg] rounded-[3px] bg-white px-[18px] pt-[22px] pb-4", noteShadow)} style={linedPaper}>
                <Tape left="50%" rotate={-4} />
                <div>
                  <div className="font-archivo text-[11px] font-bold tracking-[0.1em] text-muted-foreground">{k("essayTag").toUpperCase()}</div>
                  <p className="mt-2 font-archivo text-[14px] leading-[26px] text-foreground">
                    Nowadays, in many countries <s className="decoration-coral decoration-2">the</s> young adults continue to live with their parents…
                  </p>
                </div>
                <p className={cn(hand, "mt-1.5 text-[15px] leading-5")}>{k("essayNote")}</p>
                <div className="mt-2.5 flex justify-end">
                  <span className={cn(hand, "inline-grid size-[46px] -rotate-10 place-items-center rounded-full border-[2.5px] border-coral text-[17px] text-coral")}>
                    {formatBand(6.5, "en")}
                  </span>
                </div>
              </div>
            </Day>

            {/* Wednesday: Speaking notes on a sticky note */}
            <Day label={k("wed")} title={k("speakTitle")} body={k("speakBody")}>
              <div aria-hidden="true" lang="en" className={cn("coach-en mk-en mk-en relative rotate-2 rounded-[2px] bg-[#FDFFA8] px-[18px] pt-5 pb-[18px]", noteShadow)}>
                <Tape left="40%" rotate={3} />
                <div className="font-archivo text-[15px] font-extrabold text-midnight-iris">{k("speakTag")}</div>
                <div className="mt-2.5 flex h-[26px] items-center gap-[3px]" dir="ltr">
                  {WAVE.map((h, i) => (
                    <i key={i} className="block w-1 rounded-[2px] bg-midnight-iris opacity-60" style={{ height: h }} />
                  ))}
                </div>
                <ul className="mt-3 flex list-none flex-col gap-2 p-0 font-archivo text-[14px] leading-5 text-foreground">
                  <li>
                    <b className="text-[#B8232D]">{formatClock(42, "en")}</b> {k("speakNote1")}
                  </li>
                  <li>
                    <b className="text-[#B8232D]">{formatClock(75, "en")}</b> {k("speakNote2")}
                  </li>
                </ul>
              </div>
            </Day>

            {/* Thursday: the call in the calendar */}
            <Day label={k("thu")} title={k("callTitle")} body={k("callBody")}>
              <div aria-hidden="true" lang="en" className={cn("coach-en mk-en mk-en relative -rotate-[1.5deg] overflow-hidden rounded-[14px] bg-white", noteShadow)}>
                <div className="bg-coral px-3.5 py-2 font-archivo text-[12px] font-extrabold tracking-[0.1em] text-white">{k("callDay").toUpperCase()}</div>
                <div className="px-4 pt-3.5 pb-4 font-archivo">
                  <div className="text-[34px] leading-none font-extrabold text-midnight-iris">{k("callTime")}</div>
                  <div className="mt-1.5 text-[15px] font-bold text-foreground">{k("callWhat")}</div>
                  <div className="mt-2 text-[13px] leading-[19px] text-muted-foreground">{k("callAgenda")}</div>
                </div>
              </div>
            </Day>

            {/* Sunday: next week's plan */}
            <Day label={k("sun")} title={k("planTitle")} body={k("planBody")}>
              <div aria-hidden="true" lang="en" className={cn("coach-en mk-en mk-en relative rotate-[2.5deg] rounded-[2px] bg-[#FFD9F2] px-[18px] pt-5 pb-[18px]", noteShadow)}>
                <Tape left="60%" rotate={-3} />
                <div className="font-archivo text-[15px] font-extrabold text-midnight-iris">{k("planTag")}</div>
                <ul className="mt-2.5 flex list-none flex-col gap-2 p-0 font-archivo text-[14px] leading-5 text-foreground">
                  <li>
                    <span className="font-extrabold text-[#2c6e1a]">✓</span> {k("plan1")}
                  </li>
                  <li>
                    <span className="font-extrabold text-[#2c6e1a]">✓</span> {k("plan2")}
                  </li>
                  <li>
                    <span className="font-extrabold text-[#7b8590]">○</span> {k("plan3")}
                  </li>
                </ul>
                <p className={cn(hand, "mt-2.5 text-[14px]")}>{k("planNote")}</p>
              </div>
            </Day>
          </div>
        </div>
      </div>
    </section>
  );
}
