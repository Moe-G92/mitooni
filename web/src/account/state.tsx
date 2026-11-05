/* Account context intentionally exports its two hooks with the provider. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SessionController } from "@/auth/session";
import { AccountClient } from "./transport";
import type { GuardedTransport } from "./request";
import type { Account, EditableProfile, ProfileChanges } from "./contracts";
import { setPrefs, prefsGeneration } from "@/lib/prefs";
type State = {
  http: GuardedTransport;
  account: Account | null;
  loading: boolean;
  error: unknown;
  session: SessionController;
  epoch: number;
  local: boolean;
  reload: () => void;
  update: (
    changes: ProfileChanges,
    key: string,
    expectedRevision?: number,
  ) => Promise<Account>;
  onboard: (profile: EditableProfile, key: string) => Promise<void>;
};
const Context = createContext<State | null>(null);
export function AccountProvider({
  session,
  client,
  local = false,
  children,
}: {
  session: SessionController;
  client: AccountClient;
  local?: boolean;
  children: ReactNode;
}) {
  type Loaded = { epoch: number; account: Account } | null;
  const [loaded, setLoaded] = useState<Loaded>(null);
  const canonical = useRef<Loaded>(null);
  const [phase, setPhase] = useState<{
    epoch: number;
    loading: boolean;
    error: unknown;
  }>({ epoch: -1, loading: false, error: null });
  const subscribe = useCallback(
    (notify: () => void) =>
      session.subscribe(() => {
        if (canonical.current?.epoch !== session.getSnapshot().epoch) {
          canonical.current = null;
          setLoaded(null);
          setPhase({ epoch: -1, loading: false, error: null });
        }
        notify();
      }),
    [session],
  );
  const snapshot = useSyncExternalStore(subscribe, session.getSnapshot);
  const subject = snapshot.session?.subject;
  const [refresh, setRefresh] = useState(0);
  const commit = useCallback(
    (next: Account, owner: { subject: string; epoch: number }) => {
      session.assert(owner);
      const current = canonical.current;
      const older =
        current?.epoch === owner.epoch &&
        current.account.identity.id === next.identity.id &&
        (current.account.profile?.revision ?? 0) >
          (next.profile?.revision ?? 0);
      const account = older
        ? {
            ...next,
            profile:
              next.membership.status === "active"
                ? current!.account.profile
                : null,
          }
        : next;
      canonical.current = { epoch: owner.epoch, account };
      setLoaded(canonical.current);
      return !older;
    },
    [session],
  );
  useEffect(() => {
    if (!subject) return;
    const owner = session.capture();
    const abort = new AbortController();
    const preferenceAtStart = prefsGeneration();
    setPhase({ epoch: owner.epoch, loading: true, error: null });
    void client
      .get(abort.signal)
      .then((next) => {
        session.assert(owner);
        const accepted = commit(next, owner);
        if (accepted && next.profile && prefsGeneration() === preferenceAtStart)
          setPrefs({ locale: next.profile.locale });
      })
      .catch((error) => {
        if (!abort.signal.aborted) {
          try {
            session.assert(owner);
            setPhase({ epoch: owner.epoch, loading: false, error });
          } catch {
            /* Late account response discarded. */
          }
        }
      })
      .finally(() => {
        try {
          session.assert(owner);
          setPhase((current) =>
            current.epoch === owner.epoch
              ? { ...current, loading: false }
              : current,
          );
        } catch {
          /* Account changed. */
        }
      });
    return () => abort.abort();
  }, [snapshot.epoch, subject, refresh, session, client, commit]);
  const account =
    loaded?.epoch === snapshot.epoch &&
    loaded.account.identity.id === snapshot.session?.subject
      ? loaded.account
      : null;
  const value: State = {
    http: client.http,
    account,
    loading: phase.epoch !== snapshot.epoch || phase.loading,
    error: phase.epoch === snapshot.epoch ? phase.error : null,
    session,
    epoch: snapshot.epoch,
    local,
    reload: () => setRefresh((n) => n + 1),
    update: async (changes, key, expectedRevision) => {
      const owner = session.capture();
      if (!account?.profile) throw Error("profile missing");
      const next = await client.update(
        expectedRevision ?? account.profile.revision,
        changes,
        key,
      );
      session.assert(owner);
      commit(next, owner);
      return canonical.current!.account;
    },
    onboard: async (profile, key) => {
      const owner = session.capture();
      const next = await client.onboard(profile, key);
      session.assert(owner);
      commit(next, owner);
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAccount() {
  const state = useContext(Context);
  if (!state) throw Error("Account context missing");
  return state;
}
export function useMe() {
  const { account } = useAccount();
  return {
    data: account?.profile
      ? {
          ...account.profile,
          id: account.identity.id,
          email: account.identity.email ?? "",
        }
      : undefined,
  };
}
