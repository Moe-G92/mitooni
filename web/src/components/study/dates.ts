import type { Locale } from "@/api/schemas";
import { formatDate } from "@/lib/format";

const DATE_LOCALE: Record<Locale, string> = { en: "en-GB", fa: "fa-IR-u-ca-persian" };

/** Noon on a YYYY-MM-DD date (or any ISO string), so time zones never shift the day. */
export function toDay(d: string | Date): Date {
  if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  const x = new Date(d.length === 10 ? `${d}T12:00:00` : d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 12);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Saturday 5 December 2026" / "شنبه ۱۴ آذر ۱۴۰۵" */
export function formatFullDay(d: string | Date, locale: Locale): string {
  const day = toDay(d);
  const weekday = new Intl.DateTimeFormat(DATE_LOCALE[locale], { weekday: "long" }).format(day);
  return `${weekday} ${formatDate(day, locale)}`;
}

/** "Mon" / "دوشنبه" */
export function formatWeekdayShort(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { weekday: locale === "fa" ? "long" : "short" }).format(d);
}

/** "Sun 1 Nov" / "یکشنبه ۱۱ آبان" */
export function formatShortDay(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { weekday: locale === "fa" ? "long" : "short", day: "numeric", month: "short" }).format(d);
}

/** "2 Nov" / "۱۲ آبان" */
export function formatDayMonth(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { day: "numeric", month: "short" }).format(d);
}

/**
 * The month that holds `date`, in the reader's calendar (Gregorian for
 * English, Solar Hijri for Persian), laid out as calendar weeks. English weeks
 * start on Monday, Persian weeks on Saturday.
 */
export function monthGrid(date: Date, locale: Locale) {
  const cal = locale === "fa" ? "persian" : "gregory";
  const parts = new Intl.DateTimeFormat(`${locale === "fa" ? "fa-IR" : "en-GB"}-u-ca-${cal}-nu-latn`, { day: "numeric", month: "numeric", year: "numeric" });
  const read = (d: Date) => {
    const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
    return { day: Number(p.day), month: Number(p.month), year: Number(p.year) };
  };
  const target = read(date);
  const first = addDays(date, 1 - target.day);
  const days: Date[] = [];
  for (let d = first; read(d).month === target.month; d = addDays(d, 1)) days.push(d);
  const weekIndex = (d: Date) => (locale === "fa" ? (d.getDay() + 1) % 7 : (d.getDay() + 6) % 7);
  const lead = weekIndex(first);
  // A reference week that starts on the first column's weekday, for the narrow day letters.
  const ref = addDays(first, -lead);
  const heads = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(DATE_LOCALE[locale], { weekday: "narrow" }).format(addDays(ref, i)));
  const monthName = new Intl.DateTimeFormat(DATE_LOCALE[locale], { month: "long" }).format(date);
  return { days, lead, heads, monthName, year: target.year, dayOf: (d: Date) => read(d).day };
}
