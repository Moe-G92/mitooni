// BarEx auth-only SDK mechanics; configuration is validated before this factory is called.
import {
  createClient,
  type Session as SDKSession,
} from "@supabase/supabase-js";
import type { AuthConfig } from "./config";
import type { AuthPort, Session } from "./types";
const session = (value: SDKSession | null): Session | null =>
  value ? { subject: value.user.id, token: value.access_token } : null;
export function createAuthPort(config: AuthConfig): AuthPort {
  const client = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: true,
      storageKey: "mitooni-account-auth-v1",
    },
  });
  return {
    initialize: async () => {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return session(data.session);
    },
    subscribe: (listener) => {
      const { data } = client.auth.onAuthStateChange((event, value) => {
        if (event !== "INITIAL_SESSION") listener(session(value));
      });
      return () => data.subscription.unsubscribe();
    },
    signIn: async (email, password) => {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.session) throw error ?? Error("unauthenticated");
      return session(data.session)!;
    },
    refresh: async () => {
      const { data, error } = await client.auth.refreshSession();
      if (error) {
        if (
          error.status === 400 ||
          error.status === 401 ||
          error.status === 403
        )
          return null;
        throw error;
      }
      return session(data.session);
    },
    signOut: async () => {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
    },
  };
}
