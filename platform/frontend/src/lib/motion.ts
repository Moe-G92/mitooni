import { useEffect, useState, useSyncExternalStore } from "react";

/** The house easing for entrances: fast start, long soft landing. */
export const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Page entrances: an even ease-out, so the fade reads as smooth rather than snappy. */
export const EASE_OUT_SOFT = "cubic-bezier(0.33, 1, 0.68, 1)";
/** For movements that both start and stop on screen (a book opening). */
export const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True only once `active` has stayed true for `delayMs`, so quick waits never flash. */
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
  return active && shown;
}

// The app shell (sidebar + header) shows its own in-content skeleton while a
// route chunk loads; the root-level full-screen loader stands down meanwhile.
let appShellCount = 0;
const appShellListeners = new Set<() => void>();
function emitAppShell() {
  appShellListeners.forEach((listener) => listener());
}

export function markAppShellMounted(): () => void {
  appShellCount += 1;
  emitAppShell();
  return () => {
    appShellCount -= 1;
    emitAppShell();
  };
}

export function useAppShellMounted(): boolean {
  return useSyncExternalStore(
    (listener) => {
      appShellListeners.add(listener);
      return () => appShellListeners.delete(listener);
    },
    () => appShellCount > 0,
    () => false,
  );
}
