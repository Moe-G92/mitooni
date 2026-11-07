// Isolated development-only candidate entry, never reachable from main.tsx.
import "../index.css";
import { mountAccount } from "../account/mount";
import type { AuthPort, Session } from "../auth/types";
const fixtures: Record<string, Session> = {
  "browser-a@example.invalid": { subject: "00000103-0000-4000-8000-000000000000", token: "fixture-browser-a" },
  "browser-b@example.invalid": { subject: "00000104-0000-4000-8000-000000000000", token: "fixture-browser-b" },
};
const key = "mitooni-learner-local-fixture";
function localLearnerAuth(): AuthPort {
  let current: Session | null = null;
  const listeners = new Set<(session: Session | null) => void>();
  const clear = () => { current = null; try { sessionStorage.removeItem(key); } catch { /* synthetic memory only */ } };
  return {
    initialize: async () => { try { current = fixtures[sessionStorage.getItem(key) ?? ""] ?? null; } catch { current = null; } return current; },
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    signIn: async (email, password) => { const fixture = fixtures[email]; if (!fixture || password !== "local-preview") throw Error("invalid_fixture"); current = fixture; try { sessionStorage.setItem(key, email); } catch { /* explicit synthetic identity can remain memory-only */ } listeners.forEach((listener) => listener(current)); return current; },
    refresh: async () => current,
    signOut: async () => { clear(); listeners.forEach((listener) => listener(null)); },
    invalidate: clear,
  };
}
if (import.meta.env.DEV) void mountAccount(async () => localLearnerAuth(), "", true);
