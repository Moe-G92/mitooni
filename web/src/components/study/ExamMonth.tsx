import type { Locale } from "@/api/schemas";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { monthGrid, toDay, sameDay } from "./dates";

/*
 * The exam month as a wall calendar (red header, four binder rings) with the
 * exam day circled in coral and an "Exam day" sticker, from the Progress
 * canvas. Uses the reader's calendar: Gregorian in English, Solar Hijri in
 * Persian. The page flips in, the days pop and the ring draws itself; all of
 * it is skipped under prefers-reduced-motion.
 */

const CSS = `
.xm-page{animation:xmFlip .7s cubic-bezier(.2,.8,.25,1) both;transform-origin:top center}
@keyframes xmFlip{0%{opacity:0;transform:perspective(600px) rotateX(-70deg)}100%{opacity:1;transform:none}}
.xm-d{animation:xmPop .35s cubic-bezier(.2,.8,.25,1.3) both}
@keyframes xmPop{0%{opacity:0;transform:scale(.4)}100%{opacity:1;transform:none}}
.xm-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:xmDraw .8s 1.4s ease-out forwards,xmPulse 2.4s 2.4s ease-in-out infinite}
@keyframes xmDraw{to{stroke-dashoffset:0}}
@keyframes xmPulse{0%,100%{stroke-width:2;opacity:1}50%{stroke-width:5;opacity:.35}}
.xm-tag{animation:xmTag .5s 1.9s cubic-bezier(.2,.8,.25,1.4) both}
@keyframes xmTag{0%{opacity:0;transform:rotate(8deg) translateY(-10px) scale(.6)}100%{opacity:1;transform:rotate(8deg)}}
@media (prefers-reduced-motion: reduce){.xm-page,.xm-d,.xm-tag{animation:none}.xm-draw{animation:none;stroke-dashoffset:0}}
`;

export function ExamMonth({ examDate, locale, label, tag }: { examDate: string; locale: Locale; label: string; tag: string }) {
  const exam = toDay(examDate);
  const g = monthGrid(exam, locale);
  return (
    <div role="img" aria-label={label} className="relative mt-2 w-full max-w-[280px]">
      <style>{CSS}</style>
      <div aria-hidden="true" className="absolute inset-x-0 -top-2 z-[2] flex justify-around px-9">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-5 w-2 rounded bg-midnight-iris" />
        ))}
      </div>
      <div aria-hidden="true" className="xm-page overflow-hidden rounded-2xl bg-white shadow-[0_14px_30px_rgba(43,36,112,0.18)]">
        <div className="flex items-baseline justify-between bg-coral px-4 pt-4 pb-2.5 text-white">
          <b className="font-archivo text-xl font-extrabold">{g.monthName}</b>
          <span className="text-[13px] font-bold opacity-90">{formatNumber(g.year, locale, { useGrouping: false })}</span>
        </div>
        <div className="grid grid-cols-7 gap-y-1 px-3 pt-2.5 pb-3">
          {g.heads.map((h, i) => (
            <span key={`h${i}`} className="text-center text-[11px] font-bold text-[#5d6874]">
              {h}
            </span>
          ))}
          {Array.from({ length: g.lead }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {g.days.map((d, i) => {
            const isExam = sameDay(d, exam);
            const after = d.getTime() > exam.getTime();
            return (
              <span
                key={i}
                className={cn(
                  "xm-d relative grid h-[26px] place-items-center font-archivo text-[13px] tabular-nums",
                  isExam ? "font-extrabold text-white" : "font-semibold",
                  !isExam && (after ? "text-muted-foreground" : "text-midnight-iris"),
                )}
                style={{ animationDelay: `${(i + 1) * 0.03}s` }}
              >
                {isExam && (
                  <svg viewBox="0 0 36 36" width="34" height="34" className="absolute top-1/2 left-1/2 -mt-[17px] -ml-[17px] overflow-visible">
                    <circle cx="18" cy="18" r="15" fill="#D92F3A" />
                    <circle className="xm-draw" cx="18" cy="18" r="17" fill="none" stroke="#D92F3A" strokeWidth="2" pathLength="1" transform="rotate(-90 18 18)" />
                  </svg>
                )}
                <span className="relative">{formatNumber(g.dayOf(d), locale)}</span>
              </span>
            );
          })}
        </div>
      </div>
      <span
        aria-hidden="true"
        className="xm-tag absolute -end-3 -top-[18px] z-[3] rounded-lg bg-midnight-iris px-2.5 py-[5px] text-xs font-extrabold text-canary-yellow shadow-[0_6px_14px_rgba(43,36,112,.25)]"
        style={{ transform: "rotate(8deg)" }}
      >
        {tag}
      </span>
    </div>
  );
}
