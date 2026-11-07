import { afterEach, expect, it, vi } from "vitest";
import { createAuthPort } from "./supabaseAuth";
import { SessionController } from "./session";
const sdk = vi.hoisted(() => ({ clients: [] as FakeClient[] }));
type Value = {
  user: { id: string };
  access_token: string;
  refresh_token: string;
  expires_at: number;
};
type StoragePort = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};
type FakeClient = {
  options: {
    auth: { storage: StoragePort; storageKey: string; persistSession: boolean };
  };
  emit: (event: string, value: Value | null) => void;
  refresh: () => Promise<{
    data: { session: Value | null };
    error: null | { status: number };
  }>;
  failOut: boolean;
};
const value = (id: string): Value => ({
  user: { id },
  access_token: `synthetic-${id}`,
  refresh_token: `synthetic-refresh-${id}`,
  expires_at: Date.now() / 1000 + 3600,
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: (
    _url: string,
    _key: string,
    options: FakeClient["options"],
  ) => {
    const { storage, storageKey } = options.auth;
    let listener: ((event: string, value: Value | null) => void) | null = null;
    const c: FakeClient = {
      options,
      emit: (e, v) => listener?.(e, v),
      failOut: false,
      refresh: async () => ({
        data: {
          session: JSON.parse(
            storage.getItem(storageKey) ?? "null",
          ) as Value | null,
        },
        error: null,
      }),
    };
    sdk.clients.push(c);
    return {
      auth: {
        admin: {
          signOut: async () => ({
            error: c.failOut ? Error("synthetic offline") : null,
          }),
        },
        dispose: vi.fn(async () => {}),
        onAuthStateChange: (fn: typeof listener) => {
          listener = fn;
          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  listener = null;
                },
              },
            },
          };
        },
        getSession: async () => ({
          data: {
            session: JSON.parse(
              storage.getItem(storageKey) ?? "null",
            ) as Value | null,
          },
          error: null,
        }),
        signInWithPassword: async ({ email }: { email: string }) => {
          const next = value(email);
          storage.setItem(storageKey, JSON.stringify(next));
          c.emit("SIGNED_IN", next);
          return { data: { session: next }, error: null };
        },
        refreshSession: () => c.refresh(),
        signOut: async () => {
          if (c.failOut) return { error: Error("synthetic offline") };
          storage.removeItem(storageKey);
          return { error: null };
        },
      },
    };
  },
}));
const config = {
  url: "https://synthetic-project.example.invalid",
  key: "synthetic-public-key",
  apiBase: "",
};
afterEach(() => {
  window.sessionStorage.clear();
  sdk.clients.length = 0;
  vi.restoreAllMocks();
});
it("rehydrates on reload from explicit sessionStorage and project key", async () => {
  const a = createAuthPort(config);
  await a.signIn("a", "");
  const stored = sdk.clients[0].options;
  expect(stored.auth.persistSession).toBe(true);
  expect(stored.auth.storageKey).toMatch(/^mitooni:account:tab-auth:v1:/);
  const reloaded = createAuthPort(config);
  expect(await reloaded.initialize()).toEqual({
    subject: "a",
    token: "synthetic-a",
  });
  a.invalidate?.();
  reloaded.invalidate?.();
});
it("a late A refresh cannot persist or emit after B sign-in", async () => {
  const p = createAuthPort(config);
  await p.signIn("a", "");
  const a = sdk.clients[0];
  let complete!: () => void;
  a.refresh = () =>
    new Promise((resolve) => {
      complete = () => {
        const next = value("a-late");
        a.options.auth.storage.setItem(
          a.options.auth.storageKey,
          JSON.stringify(next),
        );
        a.emit("TOKEN_REFRESHED", next);
        resolve({ data: { session: next }, error: null });
      };
    });
  const refresh = p.refresh();
  const failed = expect(refresh).rejects.toThrow("account_changed");
  await p.signIn("b", "");
  complete();
  await failed;
  expect(await createAuthPort(config).initialize()).toEqual({
    subject: "b",
    token: "synthetic-b",
  });
  p.invalidate?.();
});
it("purges before failed SDK signout and cannot restore on reload", async () => {
  const p = createAuthPort(config);
  await p.signIn("a", "");
  sdk.clients[0].failOut = true;
  const out = p.signOut();
  expect(
    window.sessionStorage.getItem(sdk.clients[0].options.auth.storageKey),
  ).toBeNull();
  await expect(out).rejects.toThrow("synthetic offline");
  expect(await createAuthPort(config).initialize()).toBeNull();
});
it("peer logout synchronously purges even while controller refresh is unresolved", async () => {
  const p = createAuthPort(config),
    s = new SessionController(p);
  await s.start();
  await s.signIn("a", "");
  const a = sdk.clients.at(-1)!;
  let complete!: () => void;
  a.refresh = () =>
    new Promise((resolve) => {
      complete = () => {
        const next = value("late");
        a.options.auth.storage.setItem(
          a.options.auth.storageKey,
          JSON.stringify(next),
        );
        resolve({ data: { session: next }, error: null });
      };
    });
  const pending = s.token(s.capture(), true);
  const rejected = expect(pending).rejects.toThrow("account_changed");
  await vi.waitFor(() => expect(complete).toBeTypeOf("function"));
  s.receivePeerSignOut();
  expect(window.sessionStorage.getItem(a.options.auth.storageKey)).toBeNull();
  expect(s.getSnapshot().session).toBeNull();
  expect(await createAuthPort(config).initialize()).toBeNull();
  complete();
  await rejected;
});
it("terminal refresh rejection revokes persistence while outages preserve it", async () => {
  const p = createAuthPort(config);
  await p.signIn("a", "");
  const a = sdk.clients[0];
  a.refresh = async () => ({ data: { session: null }, error: { status: 503 } });
  await expect(p.refresh()).rejects.toEqual({ status: 503 });
  expect(
    window.sessionStorage.getItem(a.options.auth.storageKey),
  ).not.toBeNull();
  a.refresh = async () => ({ data: { session: null }, error: { status: 401 } });
  expect(await p.refresh()).toBeNull();
  expect(window.sessionStorage.getItem(a.options.auth.storageKey)).toBeNull();
});
