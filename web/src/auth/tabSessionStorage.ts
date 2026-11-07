type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Credentials use sessionStorage only. Browser restore/duplicate-tab behavior may retain a copy. */
export function createTabSessionStorage(
  projectUrl: string,
  store: Store = window.sessionStorage,
) {
  const storageKey = `mitooni:account:tab-auth:v1:${encodeURIComponent(new URL(projectUrl).origin)}`;
  const keys = [
    storageKey,
    `${storageKey}-user`,
    `${storageKey}-code-verifier`,
  ];
  let generation = 0;
  let faulted = false;
  const allowed = (key: string) => keys.includes(key);
  const purge = () => {
    let failed = false;
    for (const key of keys) {
      try {
        store.removeItem(key);
      } catch {
        try {
          store.setItem(key, "null");
        } catch {
          failed = true;
        }
      }
    }
    if (failed) {
      faulted = true;
      throw Error("auth_storage_unavailable");
    }
  };
  const fault = (): never => {
    faulted = true;
    generation++;
    try {
      purge();
    } catch {
      /* All leases remain revoked. */
    }
    throw Error("auth_storage_unavailable");
  };
  // Fail closed before constructing an SDK client; never allow its localStorage fallback.
  const probe = `${storageKey}:probe`;
  try {
    store.setItem(probe, "1");
    if (store.getItem(probe) !== "1") return fault();
    store.removeItem(probe);
  } catch {
    return fault();
  }
  return {
    storageKey,
    invalidate() {
      generation++;
      purge();
    },
    lease() {
      if (faulted) throw Error("auth_storage_unavailable");
      const at = generation;
      return {
        getItem(key: string) {
          if (at !== generation || !allowed(key)) return null;
          if (faulted) throw Error("auth_storage_unavailable");
          try {
            return store.getItem(key);
          } catch {
            return fault();
          }
        },
        setItem(key: string, value: string) {
          if (at !== generation || !allowed(key)) return;
          if (faulted) throw Error("auth_storage_unavailable");
          try {
            store.setItem(key, value);
          } catch {
            fault();
          }
        },
        removeItem(key: string) {
          if (at !== generation || !allowed(key)) return;
          if (faulted) throw Error("auth_storage_unavailable");
          try {
            store.removeItem(key);
          } catch {
            fault();
          }
        },
      };
    },
  };
}
