import { act, render, screen, waitFor } from "@testing-library/react";
import { it, expect } from "vitest";
import { AccountProvider, useAccount } from "./state";
import { AccountClient } from "./transport";
import { SessionController } from "@/auth/session";
import { getPrefs, setPrefs } from "@/lib/prefs";
import type { AuthPort, Session } from "@/auth/types";
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { resolve, promise };
};
const profile = (name: string, revision: number) => ({
  name,
  locale: "fa",
  theme: "system",
  targets: { overall: 6, listening: 6, reading: 6, writing: 6, speaking: 6 },
  testDate: null,
  currentLevel: null,
  weeklyHours: 6,
  showFlag: true,
  notifications: { email: false, reminders: false },
  onboarded: true,
  revision,
});
const envelope = (id: string, name: string, revision: number) => ({
  identity: { id, email: `${id}@example.invalid` },
  membership: {
    status: "active",
    roles: ["learner"],
    entitlements: ["profile:write"],
  },
  state: "ready",
  profile: profile(name, revision),
});
let active: ReturnType<typeof useAccount>;
function Consumer() {
  active = useAccount();
  return <div>{active.account?.profile?.name ?? "no-account"}</div>;
}
function auth() {
  let current: Session | null = null;
  const port: AuthPort = {
    initialize: async () => null,
    subscribe: () => () => {},
    signIn: async (email) => (current = { subject: email, token: email }),
    refresh: async () => current,
    signOut: async () => {
      current = null;
    },
  };
  return new SessionController(port);
}
it("hides private state immediately and prevents late A cache commits under B", async () => {
  const session = auth();
  await session.start();
  await session.signIn("a", "");
  const delayed = deferred<Response>();
  let calls = 0;
  const client = new AccountClient(session, "", async (_url, options) => {
    calls++;
    if (calls === 1) return Response.json(envelope("a", "A", 1));
    if (new Headers(options?.headers).get("Authorization") === "Bearer b")
      return Response.json(envelope("b", "B", 1));
    return delayed.promise;
  });
  render(
    <AccountProvider session={session} client={client}>
      <Consumer />
    </AccountProvider>,
  );
  await screen.findByText("A");
  let update!: Promise<unknown>;
  act(() => {
    update = active.update({ name: "late-A" }, crypto.randomUUID());
    void update.catch(() => {});
  });
  await waitFor(() => expect(calls).toBe(2));
  await act(async () => {
    await session.signIn("b", "");
  });
  expect(screen.queryByText("A")).toBeNull();
  await screen.findByText("B");
  await act(async () => {
    delayed.resolve(Response.json(envelope("a", "late-A", 2)));
    await expect(update).rejects.toThrow("account_changed");
  });
  expect(screen.getByText("B")).toBeInTheDocument();
  act(() => {
    void session.signOut();
  });
  expect(screen.queryByText("B")).toBeNull();
});
it("historical idempotent replay cannot regress canonical profile revision", async () => {
  const session = auth();
  await session.start();
  await session.signIn("a", "");
  const client = new AccountClient(session, "", async (_url, options) =>
    Response.json(
      options?.method === "PATCH"
        ? envelope("a", "old replay", 1)
        : envelope("a", "canonical", 3),
    ),
  );
  render(
    <AccountProvider session={session} client={client}>
      <Consumer />
    </AccountProvider>,
  );
  await screen.findByText("canonical");
  await act(async () => {
    await active.update({ name: "old replay" }, crypto.randomUUID(), 0);
  });
  await waitFor(() =>
    expect(screen.getByText("canonical")).toBeInTheDocument(),
  );
  expect(active.account?.profile?.revision).toBe(3);
});

it("late bootstrap cannot overwrite a newer local language choice", async () => {
  const session = auth();
  await session.start();
  await session.signIn("a", "");
  const response = deferred<Response>();
  render(
    <AccountProvider
      session={session}
      client={new AccountClient(session, "", () => response.promise)}
    >
      <Consumer />
    </AccountProvider>,
  );
  await act(async () => {
    setPrefs({ locale: "en" });
    response.resolve(Response.json(envelope("a", "A", 1)));
  });
  await screen.findByText("A");
  expect(getPrefs().locale).toBe("en");
});
it("historical GET cannot override newer canonical locale", async () => {
  const session = auth();
  await session.start();
  await session.signIn("a", "");
  const late = deferred<Response>();
  let gets = 0;
  const client = new AccountClient(session, "", async (_url, options) => {
    if (options?.method === "PATCH")
      return Response.json({
        ...envelope("a", "new", 3),
        profile: { ...profile("new", 3), locale: "en" },
      });
    if (++gets === 1) return Response.json(envelope("a", "old", 1));
    return late.promise;
  });
  render(
    <AccountProvider session={session} client={client}>
      <Consumer />
    </AccountProvider>,
  );
  await screen.findByText("old");
  act(() => active.reload());
  await act(async () => {
    await active.update({ locale: "en" }, crypto.randomUUID());
    setPrefs({ locale: "en" });
  });
  await act(async () => {
    late.resolve(Response.json(envelope("a", "old", 1)));
  });
  expect(active.account?.profile?.revision).toBe(3);
  expect(getPrefs().locale).toBe("en");
});
