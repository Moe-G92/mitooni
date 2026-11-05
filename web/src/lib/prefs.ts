import { useSyncExternalStore } from "react";
import type { Locale, ThemeChoice } from "@/api/schemas";

/*
 * Display preferences that must work before sign-in (language, theme).
 * Saved in localStorage; signed-in changes are also written to the profile.
 */

export type Prefs = { locale: Locale; theme: ThemeChoice };

const KEY = "mitooni-ui-prefs-v1";
const DEFAULTS: Prefs = { locale: "fa", theme: "system" };
const listeners = new Set<() => void>();

function read(): Prefs {
  try {
    const value = JSON.parse(
      localStorage.getItem(KEY) || localStorage.getItem("bw-prefs") || "{}",
    );
    return {
      locale: value?.locale === "en" ? "en" : "fa",
      theme: ["system", "light", "dark"].includes(value?.theme)
        ? value.theme
        : "system",
    };
  } catch {
    return DEFAULTS;
  }
}

let current = read();
let generation = 0;
export function prefsGeneration() {
  return generation;
}

export function getPrefs(): Prefs {
  return current;
}

export function setPrefs(patch: Partial<Prefs>) {
  generation += 1;
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* private mode: keep in memory */
  }
  applyPrefs();
  listeners.forEach((l) => l());
}

export function subscribePrefs(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribePrefs, getPrefs, getPrefs);
}

/**
 * Day mode only (Mo, 1 Nov 2026). The saved theme choice is kept for the API
 * contract, but every page renders light.
 */
export function resolvedTheme(_theme: ThemeChoice = current.theme): "light" {
  return "light";
}

/** Writes lang, dir and data-theme on <html>. The exam layout overrides these locally. */
export function applyPrefs() {
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme();
  root.lang = current.locale;
  root.dir = current.locale === "fa" ? "rtl" : "ltr";
}
