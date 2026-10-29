import type { Attempt, CoachReview, Notification, Profile, Result, Slot, VocabCard } from "@/api/schemas";
import { buildSeed } from "./seed";

/*
 * The prototype's whole "database": one object in localStorage.
 * Recordings are blobs in IndexedDB (see handlers/attempts.ts).
 * Arash's backend replaces all of this.
 */

export type DB = {
  version: number;
  signedIn: boolean;
  profile: Profile;
  attempts: Record<string, Attempt>;
  results: Record<string, Result>;
  vocab: VocabCard[];
  /** YYYY-MM-DD -> cards reviewed that day */
  reviewLog: Record<string, number>;
  slots: Slot[];
  reviews: CoachReview[];
  notifications: Notification[];
  /** Sign-in identities the prototype knows, for the identifier-first sign-in. */
  accounts: { email?: string; phone?: string; name: string }[];
};

const KEY = "bw-db";
export const DB_VERSION = 4;

let cache: DB | null = null;

export function db(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === DB_VERSION) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    /* fall through to a fresh seed */
  }
  cache = buildSeed("demo");
  persist();
  return cache;
}

export function persist() {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full or blocked: the session keeps working in memory */
  }
}

export function resetDb(mode: "demo" | "empty", keep?: Partial<DB>) {
  cache = { ...buildSeed(mode), ...keep };
  persist();
}
