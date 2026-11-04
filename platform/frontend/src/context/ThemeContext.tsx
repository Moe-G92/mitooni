import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRuntime } from "./RuntimeContext";


export type AppearanceTheme = "system" | "light" | "dark";

type ThemeContextValue = {
  theme: AppearanceTheme;
  setTheme: (theme: AppearanceTheme) => Promise<void>;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

const THEME_STORAGE_KEY = "mitooni-appearance-theme";
const VALID_THEMES = new Set<AppearanceTheme>(["system", "light", "dark"]);

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: async () => {},
  loading: false,
  saving: false,
  error: null,
});

function normalizeTheme(value: unknown): AppearanceTheme {
  return typeof value === "string" && VALID_THEMES.has(value as AppearanceTheme)
    ? (value as AppearanceTheme)
    : "system";
}

function readStoredTheme(): AppearanceTheme {
  if (typeof window === "undefined") return "system";
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function persistTheme(theme: AppearanceTheme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme can still apply in memory if localStorage is unavailable.
  }
}

function applyTheme(theme: AppearanceTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-color-scheme");
    root.style.colorScheme = "light dark";
    return;
  }
  root.setAttribute("data-color-scheme", theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user, services } = useRuntime();
  const { getUserProfile, updateUserPreferences } = services;
  const [theme, setThemeState] = useState<AppearanceTheme>(() => readStoredTheme());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getUserProfile()
      .then((profile) => {
        if (cancelled) return;
        setThemeState(normalizeTheme(profile.preferences.appearance?.theme));
      })
      .catch(() => {
        if (!cancelled) {
          setError("We could not load your appearance preference.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user?.id, getUserProfile]);

  const setTheme = useCallback(async (nextTheme: AppearanceTheme) => {
    const previousTheme = theme;
    setThemeState(nextTheme);
    setSaving(true);
    setError(null);
    try {
      if (isAuthenticated) {
        await updateUserPreferences({ appearance: { theme: nextTheme } });
      }
    } catch (err) {
      setThemeState(previousTheme);
      setError(err instanceof Error ? err.message : "We could not save your appearance preference.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, theme, updateUserPreferences]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, loading, saving, error }),
    [error, loading, saving, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
