import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "../state";
import { AccountError } from "../request";
import { LearnerClient } from "./client";
import { subscribePreferences } from "./events";

export function useLearnerClient() {
  const account = useAccount();
  const client = useMemo(() => new LearnerClient(account.http), [account.http]);
  return { ...account, client };
}

export function useLearnerResource<T>(path: string) {
  const { client, session, epoch } = useLearnerClient();
  const [state, setState] = useState<{ data: T | null; error: unknown; loading: boolean }>({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  const generation = useRef(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => path === "/bootstrap" ? subscribePreferences(reload) : undefined, [path, reload]);
  useEffect(() => {
    const current = ++generation.current;
    const owner = session.capture();
    const abort = new AbortController();
    setState((old) => ({ ...old, error: null, loading: true }));
    void client.read<T>(path, abort.signal).then((data) => {
      session.assert(owner);
      if (generation.current === current && !abort.signal.aborted) setState({ data, error: null, loading: false });
    }).catch((error: unknown) => {
      try { session.assert(owner); if (generation.current === current && !abort.signal.aborted) setState((old) => ({ data: error instanceof AccountError && ([401, 403, 404].includes(error.status) || error.code === "content_withdrawn") ? null : old.data, error, loading: false })); } catch { /* old actor */ }
    });
    return () => { abort.abort(); };
  }, [path, client, session, epoch, version]);
  return { ...state, reload, client };
}
