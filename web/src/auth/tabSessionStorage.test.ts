import { expect, it, vi } from "vitest";
import { createTabSessionStorage } from "./tabSessionStorage";
function memory() {
  const entries = new Map<string, string>();
  return {
    entries,
    getItem: (k: string) => entries.get(k) ?? null,
    setItem: (k: string, v: string) => {
      entries.set(k, v);
    },
    removeItem: (k: string) => {
      entries.delete(k);
    },
  };
}
it("isolates exact Mitooni project slots and revokes old writes and removes after purge", () => {
  const store = memory(),
    a = createTabSessionStorage("https://a.example.invalid", store),
    b = createTabSessionStorage("https://b.example.invalid", store);
  const old = a.lease();
  old.setItem(a.storageKey, "synthetic-a");
  b.lease().setItem(b.storageKey, "synthetic-b");
  old.setItem(`${a.storageKey}-foreign`, "rejected");
  old.setItem(b.storageKey, "rejected");
  a.invalidate();
  const fresh = a.lease();
  fresh.setItem(a.storageKey, "new-owner");
  old.setItem(a.storageKey, "late-old-owner");
  old.removeItem(a.storageKey);
  expect(fresh.getItem(a.storageKey)).toBe("new-owner");
  expect(old.getItem(a.storageKey)).toBeNull();
  expect(b.lease().getItem(b.storageKey)).toBe("synthetic-b");
  expect(store.entries.has(`${a.storageKey}-foreign`)).toBe(false);
});
it("fails closed on unavailable or later failed storage rather than switching to localStorage", () => {
  const store = memory();
  store.setItem = () => {
    throw Error("private detail");
  };
  expect(() =>
    createTabSessionStorage("https://a.example.invalid", store),
  ).toThrow("auth_storage_unavailable");
  const working = memory(),
    storage = createTabSessionStorage("https://a.example.invalid", working),
    lease = storage.lease();
  lease.setItem(storage.storageKey, "synthetic");
  working.getItem = () => {
    throw Error("private detail");
  };
  expect(() => lease.getItem(storage.storageKey)).toThrow(
    "auth_storage_unavailable",
  );
  expect(working.entries.has(storage.storageKey)).toBe(false);
  expect(() => storage.lease()).toThrow("auth_storage_unavailable");
});
it("overwrites a stale session if removeItem fails; fails closed if both purge methods fail", () => {
  const store = memory(),
    storage = createTabSessionStorage("https://a.example.invalid", store);
  storage.lease().setItem(storage.storageKey, "synthetic");
  store.removeItem = () => {
    throw Error("denied");
  };
  storage.invalidate();
  expect(store.entries.get(storage.storageKey)).toBe("null");
  store.setItem = () => {
    throw Error("denied");
  };
  expect(() => storage.invalidate()).toThrow("auth_storage_unavailable");
  expect(() => storage.lease()).toThrow("auth_storage_unavailable");
});
it("uses sessionStorage and never accesses localStorage", () => {
  const local = vi
    .spyOn(window, "localStorage", "get")
    .mockImplementation(() => {
      throw Error("unexpected");
    });
  try {
    const storage = createTabSessionStorage("https://a.example.invalid");
    storage.lease().setItem(storage.storageKey, "synthetic");
    expect(window.sessionStorage.getItem(storage.storageKey)).toBe("synthetic");
    storage.invalidate();
    expect(local).not.toHaveBeenCalled();
  } finally {
    local.mockRestore();
  }
});
