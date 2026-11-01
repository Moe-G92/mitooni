import type { Locale } from "@/api/schemas";

const DATE_LOCALE: Record<Locale, string> = { en: "en-GB", fa: "fa-IR-u-ca-persian" };

/** "Sat 5 Dec" / "شنبه ۱۴ آذر", for the exam day under the countdown. */
export function formatExamDay(iso: string, locale: Locale): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { weekday: locale === "fa" ? "long" : "short", day: "numeric", month: "short" }).format(d);
}

/** Morning, afternoon or evening, for the Overview greeting. */
export function partOfDay(now = new Date()): "morning" | "afternoon" | "evening" {
  const h = now.getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
