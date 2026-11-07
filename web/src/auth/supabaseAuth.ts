// Supabase auth-only mechanics; configuration is validated before this factory is called.
import {
  createClient,
  type Session as SDKSession,
} from "@supabase/supabase-js";
import type { AuthConfig } from "./config";
import type { AuthPort, Session } from "./types";
import { createTabSessionStorage } from "./tabSessionStorage";
const session = (value: SDKSession | null): Session | null =>
  value ? { subject: value.user.id, token: value.access_token } : null;

export function createAuthPort(config: AuthConfig): AuthPort {
  const persistence = createTabSessionStorage(config.url);
  const listeners = new Set<(value: Session | null) => void>();
  let generation = 0;
  let active: ReturnType<typeof makeClient> | null = null;
  // One private handle survives local purge only until queued server revocation runs.
  let revocation: {
    client: { auth: Pick<ReturnType<typeof createClient>["auth"], "admin"> };
    token: string;
  } | null = null;
  function remember(
    client: { auth: Pick<ReturnType<typeof createClient>["auth"], "admin"> },
    value: SDKSession | null,
  ) {
    revocation = value ? { client, token: value.access_token } : null;
  }
  function invalidate() {
    generation++;
    const previous = active;
    active = null;
    // Revoke storage synchronously before any SDK/network work can finish.
    try {
      persistence.invalidate();
    } finally {
      previous?.unsubscribe();
      if (previous) void previous.client.auth.dispose().catch(() => {});
    }
  }
  function makeClient() {
    const at = generation;
    const client = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        storage: persistence.lease(),
        storageKey: persistence.storageKey,
        detectSessionInUrl: false,
        autoRefreshToken: true,
      },
    });
    const { data } = client.auth.onAuthStateChange((event, value) => {
      if (at !== generation || event === "INITIAL_SESSION") return;
      remember(client, value);
      if (event === "SIGNED_OUT") invalidate();
      for (const listener of listeners) listener(session(value));
    });
    return { client, unsubscribe: () => data.subscription.unsubscribe(), at };
  }
  function current() {
    return (active ??= makeClient());
  }
  function assert(at: number) {
    if (at !== generation) throw Error("account_changed");
  }
  return {
    invalidate,
    initialize: async () => {
      const { client, at } = current();
      try {
        const { data, error } = await client.auth.getSession();
        assert(at);
        if (error) {
          invalidate();
          throw error;
        }
        remember(client, data.session);
        return session(data.session);
      } catch (error) {
        if (at === generation) invalidate();
        throw error;
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    signIn: async (email, password) => {
      invalidate();
      revocation = null;
      const { client, at } = current();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      assert(at);
      if (error || !data.session) {
        invalidate();
        throw error ?? Error("unauthenticated");
      }
      remember(client, data.session);
      return session(data.session)!;
    },
    refresh: async () => {
      const { client, at } = current();
      const { data, error } = await client.auth.refreshSession();
      assert(at);
      if (error) {
        if (
          error.status === 400 ||
          error.status === 401 ||
          error.status === 403
        ) {
          invalidate();
          return null;
        }
        throw error;
      }
      if (!data.session) invalidate();
      remember(client, data.session);
      return session(data.session);
    },
    signOut: async () => {
      const previous = revocation;
      revocation = null;
      invalidate();
      if (!previous) return;
      // Same SDK endpoint/scope as auth.signOut, with its JWT captured before local purge.
      const { error } = await previous.client.auth.admin.signOut(
        previous.token,
        "local",
      );
      if (error && ![401, 403, 404].includes(error.status ?? 0)) throw error;
    },
  };
}
