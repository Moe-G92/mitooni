// Development-only entry. This module is never reachable from production main.tsx.
import "../index.css";
import { mountAccount } from "../account/mount";
import type { AuthPort, Session } from "../auth/types";
const identities: Record<string, { subject: string; token: string }> = {
  "reviewer@example.invalid": {
    subject: "00000006-0000-4000-8000-000000000000",
    token: "local-reviewer",
  },
  "a@example.invalid": {
    subject: "00000001-0000-4000-8000-000000000000",
    token: "local-a",
  },
  "b@example.invalid": {
    subject: "00000002-0000-4000-8000-000000000000",
    token: "local-b",
  },
  "inactive@example.invalid": {
    subject: "00000003-0000-4000-8000-000000000000",
    token: "local-inactive",
  },
  "nonmember@example.invalid": {
    subject: "00000004-0000-4000-8000-000000000000",
    token: "local-nonmember",
  },
  "readonly@example.invalid": {
    subject: "00000005-0000-4000-8000-000000000000",
    token: "local-readonly",
  },
};
export function localAuth(): AuthPort {
  let current: Session | null = null;
  const listeners = new Set<(s: Session | null) => void>();
  return {
    initialize: async () => null,
    subscribe: (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    signIn: async (email, password) => {
      const value = identities[email];
      if (!value || password !== "local-preview")
        throw Error("invalid fixture credentials");
      current = { ...value };
      listeners.forEach((l) => l(current));
      return current;
    },
    refresh: async () => current,
    signOut: async () => {
      current = null;
      listeners.forEach((l) => l(null));
    },
  };
}
if (import.meta.env.DEV) void mountAccount(async () => localAuth(), "", true);
