import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import { en } from "./en";
import { fa } from "./fa";
import { getPrefs, setPrefs, subscribePrefs } from "@/lib/prefs";
import { marketingEn, marketingFa } from "./marketing";
import { dashboardEn, dashboardFa } from "./overrides/dashboard";
import { studyEn, studyFa } from "./overrides/study";
import { resultsEn, resultsFa } from "./overrides/results";
import { practiceEn, practiceFa } from "./overrides/practice";
import type { Locale, Localized } from "@/api/schemas";

/*
 * English is the default; Persian is the second language. The exam shell
 * never uses these strings: real exam screens are English only.
 */

type Tree = { [k: string]: unknown };
const isTree = (v: unknown): v is Tree => typeof v === "object" && v !== null && !Array.isArray(v);

/** Merges override string trees into the base tree, key by key. */
function deepMerge(base: Tree, ...overrides: Tree[]): Tree {
  const out: Tree = { ...base };
  for (const o of overrides)
    for (const [k, v] of Object.entries(o)) out[k] = isTree(v) && isTree(out[k]) ? deepMerge(out[k] as Tree, v) : v;
  return out;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...deepMerge(en, dashboardEn, resultsEn, studyEn, practiceEn), mk: marketingEn } },
    fa: { translation: { ...deepMerge(fa, dashboardFa, resultsFa, studyFa, practiceFa), mk: marketingFa } },
  },
  lng: getPrefs().locale,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

subscribePrefs(() => {
  const { locale } = getPrefs();
  if (i18n.language !== locale) void i18n.changeLanguage(locale);
});

export default i18n;

/**
 * Switches language with a short cross-fade (View Transitions API) so English
 * and Persian change smoothly, including the left-to-right flip. Browsers
 * without the API, and people who prefer reduced motion, get an instant switch.
 */
export function switchLocale(next: Locale) {
  const run = async () => {
    setPrefs({ locale: next });
    await i18n.changeLanguage(next);
    // Give React one frame to commit the new strings before the "after" snapshot.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  };
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => unknown };
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (doc.startViewTransition && !reduce) doc.startViewTransition(run);
  else void run();
}

/** useTranslation plus the current locale and a picker for {en, fa} content. */
export function useT() {
  const { t, i18n: inst } = useTranslation();
  const locale = (inst.language === "fa" ? "fa" : "en") as Locale;
  const pick = (l: Localized | undefined | null) => (l ? l[locale] || l.en : "");
  return { t, locale, pick };
}
