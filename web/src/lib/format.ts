import type { Locale } from "@/api/schemas";

/*
 * Locale-aware formatting. Persian uses Persian digits and the Solar Hijri
 * calendar through Intl; English uses Latin digits and the Gregorian calendar.
 */

const NUMBER_LOCALE: Record<Locale, string> = { en: "en-GB", fa: "fa-IR" };
const DATE_LOCALE: Record<Locale, string> = { en: "en-GB", fa: "fa-IR-u-ca-persian" };

export function formatNumber(n: number, locale: Locale, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], opts).format(n);
}

/** Bands always show one decimal: 6.0, 6.5. */
export function formatBand(n: number | null | undefined, locale: Locale): string {
  if (n === null || n === undefined) return "–";
  return formatNumber(n, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatPercent(ratio: number, locale: Locale): string {
  return formatNumber(ratio, locale, { style: "percent", maximumFractionDigits: 0 });
}

function toDate(d: string | Date): Date {
  return typeof d === "string" ? new Date(d.length === 10 ? `${d}T12:00:00` : d) : d;
}

/** 26 October 2026 / ۴ آبان ۱۴۰۵ */
export function formatDate(d: string | Date, locale: Locale, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { day: "numeric", month: "long", year: "numeric", ...opts }).format(toDate(d));
}

/** 26 Oct / ۴ آبان */
export function formatShortDate(d: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { day: "numeric", month: "short" }).format(toDate(d));
}

/** Sunday 26 October */
export function formatDayDate(d: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { weekday: "long", day: "numeric", month: "long" }).format(toDate(d));
}

export function formatDateTime(d: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(d));
}

export function formatTime(d: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { hour: "2-digit", minute: "2-digit" }).format(toDate(d));
}

/** Whole days from today to a date (negative when past). */
export function daysUntil(isoDate: string, now = new Date()): number {
  const target = toDate(isoDate);
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** mm:ss for practice-mode clocks and recordings. */
export function formatClock(totalSec: number, locale: Locale = "en"): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${formatNumber(m, locale)}:${formatNumber(r, locale, { minimumIntegerDigits: 2 })}`;
}
