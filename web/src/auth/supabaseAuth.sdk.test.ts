import { afterEach, expect, it, vi } from "vitest";
import { createAuthPort } from "./supabaseAuth";
import { SessionController } from "./session";
import { createTabSessionStorage } from "./tabSessionStorage";
import type { AuthPort } from "./types";
const ports: AuthPort[] = [];
const config = {
  url: "https://synthetic-sdk.example.invalid",
  key: "synthetic-public-key",
  apiBase: "",
};
function fixture(id: string, expiresAt: number) {
  const token = `${btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${btoa(JSON.stringify({ sub: id, exp: expiresAt, iss: config.url }))}.synthetic-signature`;
  return {
    access_token: token,
    refresh_token: `synthetic-refresh-${id}`,
    token_type: "bearer",
    expires_at: expiresAt,
    expires_in: 3600,
    user: {
      id,
      aud: "authenticated",
      role: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: "2026-01-01T00:00:00Z",
    },
  };
}
afterEach(() => {
  for (const p of ports) p.invalidate?.();
  ports.length = 0;
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("installed SDK refreshes an expired synthetic persisted session during reload initialization", async () => {
  const storage = createTabSessionStorage(config.url),
    old = fixture("synthetic-owner", Math.floor(Date.now() / 1000) - 60),
    next = fixture("synthetic-owner", Math.floor(Date.now() / 1000) + 3600);
  storage.lease().setItem(storage.storageKey, JSON.stringify(old));
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    if (!String(input).includes("/auth/v1/token?grant_type=refresh_token"))
      throw Error("unexpected synthetic request");
    return Response.json(next);
  });
  vi.stubGlobal("fetch", fetcher);
  const p = createAuthPort(config);
  ports.push(p);
  expect(await p.initialize()).toEqual({
    subject: next.user.id,
    token: next.access_token,
  });
  expect(fetcher).toHaveBeenCalledOnce();
  expect(
    JSON.parse(window.sessionStorage.getItem(storage.storageKey)!)
      .access_token === next.access_token,
  ).toBe(true);
});
it("installed SDK initializes an unexpired synthetic session without a network request", async () => {
  const storage = createTabSessionStorage(config.url),
    current = fixture("synthetic-owner", Math.floor(Date.now() / 1000) + 3600);
  storage.lease().setItem(storage.storageKey, JSON.stringify(current));
  const fetcher = vi.fn(async () => {
    throw Error("unexpected synthetic request");
  });
  vi.stubGlobal("fetch", fetcher);
  const p = createAuthPort(config);
  ports.push(p);
  expect(await p.initialize()).toEqual({
    subject: current.user.id,
    token: current.access_token,
  });
  expect(fetcher).not.toHaveBeenCalled();
});
it("installed SDK late A refresh cannot persist over a deliberate B sign-in", async () => {
  const storage = createTabSessionStorage(config.url);
  const a = fixture("synthetic-a", Math.floor(Date.now() / 1000) + 3600),
    b = fixture("synthetic-b", Math.floor(Date.now() / 1000) + 3600);
  storage.lease().setItem(storage.storageKey, JSON.stringify(a));
  let finish!: (response: Response) => void;
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("grant_type=refresh_token"))
      return new Promise<Response>((resolve) => {
        finish = resolve;
      });
    if (url.includes("grant_type=password")) return Response.json(b);
    throw Error("unexpected synthetic request");
  });
  vi.stubGlobal("fetch", fetcher);
  const p = createAuthPort(config);
  ports.push(p);
  await p.initialize();
  const pending = p.refresh();
  const rejected = expect(pending).rejects.toThrow("account_changed");
  await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
  await p.signIn("synthetic-b@example.invalid", "synthetic-password");
  finish(
    Response.json(fixture("synthetic-a", Math.floor(Date.now() / 1000) + 3600)),
  );
  await rejected;
  expect((await p.initialize())?.subject).toBe("synthetic-b");
  expect(
    JSON.parse(window.sessionStorage.getItem(storage.storageKey)!).user.id,
  ).toBe("synthetic-b");
});
it.each([false, true])(
  "controller logout purges first and invokes installed SDK server revocation once (failure=%s)",
  async (failure) => {
    const storage = createTabSessionStorage(config.url),
      a = fixture("synthetic-a", Math.floor(Date.now() / 1000) + 3600);
    storage.lease().setItem(storage.storageKey, JSON.stringify(a));
    let requests = 0;
    let correctAuthorization = false;
    let purgedBeforeRequest = false;
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (!String(input).includes("/auth/v1/logout?scope=local"))
          throw Error("unexpected synthetic request");
        requests++;
        correctAuthorization =
          new Headers(init?.headers).get("authorization") ===
          `Bearer ${a.access_token}`;
        purgedBeforeRequest =
          window.sessionStorage.getItem(storage.storageKey) === null;
        return failure
          ? Response.json({ message: "synthetic unavailable" }, { status: 503 })
          : new Response(null, { status: 204 });
      },
    );
    vi.stubGlobal("fetch", fetcher);
    const p = createAuthPort(config);
    ports.push(p);
    const s = new SessionController(p);
    await s.start();
    const logout = s.signOut();
    expect(window.sessionStorage.getItem(storage.storageKey)).toBeNull();
    expect(s.getSnapshot().session).toBeNull();
    if (failure) await expect(logout).rejects.toMatchObject({ status: 503 });
    else await logout;
    expect(requests).toBe(1);
    expect(correctAuthorization).toBe(true);
    expect(purgedBeforeRequest).toBe(true);
    expect(window.sessionStorage.getItem(storage.storageKey)).toBeNull();
  },
);
