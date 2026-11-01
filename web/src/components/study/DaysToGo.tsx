import type { Locale } from "@/api/schemas";
import { formatNumber } from "@/lib/format";

/*
 * Small "34 DAYS TO GO" tile from the Progress canvas: a white tear-off
 * calendar page (red band, two blue binder marks, big blue number) on a pink
 * panel with the words. Persian mirrors it through the flex direction.
 */
export function DaysToGo({ days, locale, line1, line2, label }: { days: number; locale: Locale; line1: string; line2: string; label: string }) {
  return (
    <div role="img" aria-label={label} className="flex overflow-hidden rounded-[14px] bg-pink-tint">
      <div className="relative flex-[0_0_76px] bg-white shadow-[0_2px_6px_rgba(11,42,62,0.12)]">
        <div className="h-5 bg-coral" />
        <span aria-hidden="true" className="absolute start-[18px] -top-[5px] h-[15px] w-[5px] rounded-[3px] bg-primary" />
        <span aria-hidden="true" className="absolute end-[18px] -top-[5px] h-[15px] w-[5px] rounded-[3px] bg-primary" />
        <div aria-hidden="true" className="px-0 pt-1 pb-2 text-center font-archivo text-4xl leading-none font-extrabold text-primary tabular-nums">
          {formatNumber(days, locale)}
        </div>
      </div>
      <div aria-hidden="true" className="flex min-w-0 flex-col justify-center px-3.5 font-archivo leading-[1.05] text-primary">
        <b className="text-xl font-extrabold">{line1}</b>
        <span className="text-sm font-bold">{line2}</span>
      </div>
    </div>
  );
}
