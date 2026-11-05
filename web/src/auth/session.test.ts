import { describe, it, expect, vi } from "vitest";
import { SessionController } from "./session";
import type { AuthPort, Session } from "./types";
import { AccountClient } from "@/account/transport";
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
function port() {
  let current: Session | null = null;
  const listeners = new Set<(s: Session | null) => void>();
  const value: AuthPort = {
    initialize: async () => null,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    signIn: async (email) => {
      current = { subject: email, token: email };
      listeners.forEach((fn) => fn(current));
      return current;
    },
    refresh: async () => current,
    signOut: async () => {
      current = null;
      listeners.forEach((fn) => fn(null));
    },
  };
  return value;
}
const account = (id: string) => ({
  identity: { id, email: `${id}@example.invalid` },
  membership: {
    status: "active",
    roles: ["learner"],
    entitlements: ["profile:write"],
  },
  state: "setup-required",
  profile: null,
});
describe("account session isolation", () => {
  it("rejects a delayed A GET after switching to B", async () => {
    const s = new SessionController(port());
    await s.start();
    await s.signIn("a", "");
    const delayed = deferred<Response>();
    const client = new AccountClient(
      s,
      "",
      vi.fn(() => delayed.promise),
    );
    const request = client.get();
    await Promise.resolve();
    await s.signIn("b", "");
    delayed.resolve(Response.json(account("a")));
    await expect(request).rejects.toThrow("account_changed");
  });
  it("does not dispatch a mutation with B's token after A token refresh", async () => {
    const p = port();
    const refresh = deferred<Session | null>();
    p.refresh = () => refresh.promise;
    const s = new SessionController(p);
    await s.start();
    await s.signIn("a", "");
    const fetcher = vi.fn(async () => new Response("", { status: 401 }));
    const request = new AccountClient(s, "", fetcher).update(
      2,
      { name: "A" },
      crypto.randomUUID(),
    );
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    const login = s.signIn("b", "");
    refresh.resolve({ subject: "a", token: "refreshed-a" });
    await login;
    await expect(request).rejects.toThrow("account_changed");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects delayed A mutation response and sends exact ownership headers", async () => {
    const s = new SessionController(port());
    await s.start();
    await s.signIn("a", "");
    const delayed = deferred<Response>();
    const fetcher = vi.fn(() => delayed.promise);
    const key = crypto.randomUUID();
    const request = new AccountClient(s, "", fetcher).update(
      2,
      { name: "A" },
      key,
    );
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
    const options = fetcher.mock.calls[0][1] as RequestInit;
    expect(options.redirect).toBe("error");
    expect(new Headers(options.headers).get("X-Expected-User-Id")).toBe("a");
    expect(new Headers(options.headers).get("Idempotency-Key")).toBe(key);
    expect(JSON.parse(options.body as string)).toEqual({
      expectedRevision: 2,
      changes: { name: "A" },
    });
    await s.signIn("b", "");
    delayed.resolve(Response.json(account("a")));
    await expect(request).rejects.toThrow("account_changed");
  });
  it("clears immediately and remains signed out after failed logout and reload", async () => {
    const storage = new Map<string, string>();
    const store = {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storage.set(k, v);
      },
      removeItem: (k: string) => {
        storage.delete(k);
      },
    };
    const p = port();
    p.signOut = async () => {
      throw Error("offline");
    };
    const s = new SessionController(p, store);
    await s.start();
    await s.signIn("a", "");
    const out = s.signOut();
    expect(s.getSnapshot().session).toBeNull();
    await expect(out).rejects.toThrow("offline");
    p.initialize = async () => ({ subject: "a", token: "old" });
    const reload = new SessionController(p, store);
    await reload.start();
    expect(reload.getSnapshot().session).toBeNull();
    await reload.signIn("b", "");
    expect(reload.getSnapshot().session?.subject).toBe("b");
  });
  it("preserves session for backend503 with structured reference", async () => {
    const s = new SessionController(port());
    await s.start();
    await s.signIn("a", "");
    const client = new AccountClient(s, "", async () =>
      Response.json(
        {
          detail: { code: "store_unavailable", message: "safe" },
          requestId: "ref",
        },
        { status: 503 },
      ),
    );
    await expect(client.get()).rejects.toMatchObject({
      status: 503,
      code: "store_unavailable",
      requestId: "ref",
    });
    expect(s.getSnapshot().session?.subject).toBe("a");
  });
  it("preserves session on refresh outage, expires on explicit refresh rejection", async () => {
    const p = port();
    p.refresh = async () => {
      throw Error("outage");
    };
    const s = new SessionController(p);
    await s.start();
    await s.signIn("a", "");
    const client = new AccountClient(
      s,
      "",
      async () => new Response("", { status: 401 }),
    );
    await expect(client.get()).rejects.toThrow("outage");
    expect(s.getSnapshot().session?.subject).toBe("a");
    p.refresh = async () => null;
    await expect(client.get()).rejects.toThrow("account_changed");
    expect(s.getSnapshot().session).toBeNull();
  });
  it("rejects inconsistent authority envelopes", async () => {
    const s = new SessionController(port());
    await s.start();
    await s.signIn("a", "");
    const body = {
      ...account("a"),
      membership: { status: "none", roles: ["admin"], entitlements: [] },
    };
    await expect(
      new AccountClient(s, "", async () => Response.json(body)).get(),
    ).rejects.toThrow();
  });
});

it("does not let a delayed failed signout clobber a deliberate new sign-in", async () => {
  const p = port();
  const logout = deferred<void>();
  p.signOut = () => logout.promise;
  const s = new SessionController(p);
  await s.start();
  await s.signIn("a", "");
  const out = s.signOut();
  const login = s.signIn("b", "");
  expect(s.getSnapshot().session).toBeNull();
  logout.reject(Error("offline"));
  await expect(out).rejects.toThrow("offline");
  await login;
  expect(s.getSnapshot().session?.subject).toBe("b");
});
it("initialization completion cannot restore a session over deliberate sign-in", async () => {
  const p = port();
  const init = deferred<Session | null>();
  p.initialize = () => init.promise;
  const s = new SessionController(p);
  const start = s.start();
  await s.signIn("b", "");
  init.resolve({ subject: "a", token: "old" });
  await start;
  expect(s.getSnapshot().session?.subject).toBe("b");
});
it("does not reuse a previous epoch's refresh flight for another account", async () => {
  const p = port();
  const a = deferred<Session | null>();
  let count = 0;
  p.refresh = async () => {
    count++;
    return count === 1 ? a.promise : { subject: "b", token: "new-b" };
  };
  const s = new SessionController(p);
  await s.start();
  await s.signIn("a", "");
  const refresh = s.token(s.capture(), true);
  await Promise.resolve();
  const login = s.signIn("b", "");
  a.resolve({ subject: "a", token: "new-a" });
  await expect(refresh).rejects.toThrow("account_changed");
  await login;
  expect(await s.token(s.capture(), true)).toBe("new-b");
  expect(count).toBe(2);
});

it("quarantines a hung SDK controller until reload and ignores old completion", async () => {
  vi.useFakeTimers();
  try {
    const p = port();
    const hung = deferred<Session | null>();
    p.refresh = () => hung.promise;
    const s = new SessionController(p);
    await s.start();
    await s.signIn("a", "");
    const request = s.token(s.capture(), true);
    const failed = expect(request).rejects.toThrow("auth_restart_required");
    await vi.advanceTimersByTimeAsync(15_001);
    await failed;
    expect(s.getSnapshot().session).toBeNull();
    await expect(s.signIn("b", "")).rejects.toThrow("auth_restart_required");
    hung.resolve({ subject: "a", token: "late" });
    await Promise.resolve();
    expect(s.getSnapshot().session).toBeNull();
    const fresh = new SessionController(port());
    await fresh.start();
    await fresh.signIn("b", "");
    expect(fresh.getSnapshot().session?.subject).toBe("b");
  } finally {
    vi.useRealTimers();
  }
});
it("peer signout purges pending account work without publishing a signout loop", async () => {
  const s = new SessionController(port(), null, vi.fn());
  await s.start();
  await s.signIn("a", "");
  const delayed = deferred<Response>();
  const client = new AccountClient(s, "", () => delayed.promise);
  const get = client.get();
  const patch = client.update(1, { name: "A" }, crypto.randomUUID());
  const rejected = [
    expect(get).rejects.toThrow("account_changed"),
    expect(patch).rejects.toThrow("account_changed"),
  ];
  await Promise.resolve();
  s.receivePeerSignOut();
  expect(s.getSnapshot().session).toBeNull();
  delayed.resolve(Response.json(account("a")));
  await Promise.all(rejected);
});

it("peer notification failure cannot prevent local signout purge", async () => {
  const s = new SessionController(port(), null, () => {
    throw Error("channel unavailable");
  });
  await s.start();
  await s.signIn("a", "");
  await s.signOut();
  expect(s.getSnapshot().session).toBeNull();
});
