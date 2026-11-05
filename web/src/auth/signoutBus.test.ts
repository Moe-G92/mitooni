import { it, expect, vi } from "vitest";
import { signoutBus, SIGNOUT_KEY } from "./signoutBus";
it("propagates only explicit same-project signout; sign-in marker removal does not switch peers", () => {
  vi.stubGlobal("BroadcastChannel", undefined);
  try {
    const peer = vi.fn();
    const values = new Map<string, string>();
    const storage = {
      setItem: (k: string, v: string) => values.set(k, v),
      getItem: (k: string) => values.get(k) ?? null,
      removeItem: (k: string) => values.delete(k),
    };
    const host = Object.assign(new EventTarget(), {
      localStorage: storage,
    }) as unknown as Window;
    const bus = signoutBus(peer, host);
    expect(bus.available).toBe(true);
    const send = (key: string, newValue: string | null) =>
      host.dispatchEvent(
        Object.assign(new Event("storage"), {
          key,
          newValue,
          storageArea: storage,
        }),
      );
    send(SIGNOUT_KEY, "intent");
    expect(peer).toHaveBeenCalledOnce();
    send(SIGNOUT_KEY, null);
    send("another-project", "intent");
    expect(peer).toHaveBeenCalledOnce();
    bus.close();
  } finally {
    vi.unstubAllGlobals();
  }
});
it("fails closed when neither durable storage events nor a receiving-project channel is available", () => {
  vi.stubGlobal("BroadcastChannel", undefined);
  try {
    const host = {
      get localStorage() {
        throw Error("blocked");
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const bus = signoutBus(vi.fn(), host);
    expect(bus.available).toBe(false);
    expect(bus.storage).toBeNull();
    bus.close();
  } finally {
    vi.unstubAllGlobals();
  }
});
