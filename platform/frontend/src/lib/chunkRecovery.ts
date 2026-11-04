const RELOAD_KEY = "mitooni:chunk-recovery";
const RELOAD_COOLDOWN_MS = 5 * 60 * 1000;

type RecoveryTarget = Pick<Window, "addEventListener" | "removeEventListener" | "sessionStorage" | "location">;

/** Recover deployment skew without repeatedly refreshing an offline/broken page. */
export function installChunkRecovery(target: RecoveryTarget) {
  const recover = (event: Event) => {
    try {
      const previous = Number(target.sessionStorage.getItem(RELOAD_KEY));
      const now = Date.now();
      if (previous && now - previous < RELOAD_COOLDOWN_MS) return;
      // Persist before reloading. If storage is blocked, leave the manual retry
      // available rather than risk a loop across page loads.
      target.sessionStorage.setItem(RELOAD_KEY, String(now));
    } catch {
      return;
    }
    event.preventDefault();
    // Reload the current URL, including plan/referral queries and OAuth hashes.
    target.location.reload();
  };
  target.addEventListener("vite:preloadError", recover);
  return () => target.removeEventListener("vite:preloadError", recover);
}
