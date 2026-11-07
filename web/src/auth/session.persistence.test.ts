import { expect, it, vi } from "vitest";
import { SessionController } from "./session";
import type { AuthPort, Session } from "./types";
function fixture() {
  let stored: Session | null = null;
  const p: AuthPort = {
    invalidate: vi.fn(() => {
      stored = null;
    }),
    initialize: async () => stored,
    subscribe: () => () => {},
    signIn: async (email) => (stored = { subject: email, token: "synthetic" }),
    refresh: async () => stored,
    signOut: async () => {
      stored = null;
    },
  };
  return { p, stored: () => stored };
}
it("synchronously invalidates a queued logout and an account switch before SDK operations run", async () => {
  const f = fixture(),
    s = new SessionController(f.p);
  await s.start();
  await s.signIn("a", "");
  let finish!: (s: Session | null) => void;
  f.p.refresh = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const token = s.token(s.capture(), true);
  const rejected = expect(token).rejects.toThrow("account_changed");
  await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
  const out = s.signOut();
  expect(f.stored()).toBeNull();
  finish(null);
  await rejected;
  await out;
  await s.signIn("a", "");
  const login = s.signIn("b", "");
  expect(f.stored()).toBeNull();
  await login;
  expect(f.stored()?.subject).toBe("b");
});
it("revokes persistence when a hung SDK operation reaches the terminal timeout", async () => {
  vi.useFakeTimers();
  try {
    const f = fixture(),
      s = new SessionController(f.p);
    await s.start();
    await s.signIn("a", "");
    f.p.refresh = () => new Promise(() => {});
    const token = s.token(s.capture(), true);
    const rejected = expect(token).rejects.toThrow("auth_restart_required");
    await vi.advanceTimersByTimeAsync(15001);
    await rejected;
    expect(f.stored()).toBeNull();
    expect(s.getSnapshot().session).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});
it("a stale initialization failure cannot invalidate a newer deliberate sign-in", async () => {
  const f = fixture();
  let fail!: (e: Error) => void;
  f.p.initialize = () =>
    new Promise((_resolve, reject) => {
      fail = reject;
    });
  const s = new SessionController(f.p),
    start = s.start();
  await s.signIn("b", "");
  const calls = vi.mocked(f.p.invalidate!).mock.calls.length;
  fail(Error("synthetic failure"));
  await start;
  expect(s.getSnapshot().session?.subject).toBe("b");
  expect(f.stored()?.subject).toBe("b");
  expect(f.p.invalidate).toHaveBeenCalledTimes(calls);
});
