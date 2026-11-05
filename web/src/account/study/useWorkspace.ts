import { useCallback, useEffect, useRef, useState } from "react";
import { useStudy } from "./useStudy";
import {
  activeTurn,
  type Workspace,
  type Turn,
  type Intent,
} from "./contracts";
import { AccountError } from "../request";
export function useWorkspace(id: string) {
  const { client, session, ...account } = useStudy();
  const [workspace, setWorkspace] = useState<Workspace | null>(null),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [pollError, setPollError] = useState<unknown>(null),
    [turn, setTurn] = useState<Turn | null>(null),
    [sendUncertain, setSendUncertain] = useState(false);
  type PendingSend = {
    owner: { subject: string; epoch: number };
    workspace: Workspace;
    intent: Intent;
    message: string;
    key: string;
  };
  const retainedSend = useRef<PendingSend | null>(null);
  const accessRevoked = useRef(false);
  const uncertainBefore = useRef<{ latest: string | null } | null>(null);
  const canonical = useRef<Workspace | null>(null),
    editor = useRef(""),
    mounted = useRef(true),
    busyRef = useRef(false);
  const [pollTick, setPollTick] = useState(0);
  const operations = useRef(
    new Map<string, { signature: string; key: string }>(),
  );
  const key = (name: string, body: unknown) => {
    const signature = JSON.stringify(body);
    let op = operations.current.get(name);
    if (op?.signature !== signature) {
      op = { signature, key: crypto.randomUUID() };
      operations.current.set(name, op);
    }
    return op!.key;
  };
  const assert = useCallback(
    (owner: { subject: string; epoch: number }) => {
      session.assert(owner);
      if (!mounted.current) throw Error("Workspace closed");
    },
    [session],
  );
  const commit = useCallback(
    (next: Workspace, replaceText = false) => {
      if (accessRevoked.current) throw new AccountError(403, "study_forbidden");
      if (next.id !== id) throw new AccountError(409, "workspace_changed");
      const previous = canonical.current;
      if (
        previous &&
        (next.revision < previous.revision ||
          (next.draft.id === previous.draft.id &&
            next.draft.revision < previous.draft.revision))
      )
        return previous;
      const clean = !previous || editor.current === previous.draft.text;
      canonical.current = next;
      setWorkspace(next);
      if (replaceText || clean) {
        editor.current = next.draft.text;
        setText(next.draft.text);
      }
      return next;
    },
    [id],
  );
  const report = useCallback((failure: unknown, polling = false) => {
    if (
      failure instanceof AccountError &&
      [403, 404].includes(failure.status)
    ) {
      accessRevoked.current = true;
      retainedSend.current = null;
      uncertainBefore.current = null;
      operations.current.clear();
      setSendUncertain(false);
      canonical.current = null;
      editor.current = "";
      setWorkspace(null);
      setText("");
      setTurn(null);
      setPollError(null);
      setError(failure);
    } else if (polling) setPollError(failure);
    else setError(failure);
  }, []);
  const reload = useCallback(
    async (discard = false) => {
      const owner = session.capture();
      try {
        const next = await client.workspace(id);
        assert(owner);
        commit(next, discard);
        setError(null);
        return next;
      } catch (e) {
        assert(owner);
        report(e);
        throw e;
      }
    },
    [client, id, assert, session, commit, report],
  );
  useEffect(() => {
    mounted.current = true;
    const activeOperations = operations.current;
    const owner = session.capture(),
      abort = new AbortController();
    void client
      .workspace(id, abort.signal)
      .then((next) => {
        assert(owner);
        if (!abort.signal.aborted) commit(next, true);
      })
      .catch((e) => {
        try {
          assert(owner);
          if (!abort.signal.aborted) report(e);
        } catch {
          /* stale account */
        }
      });
    return () => {
      mounted.current = false;
      abort.abort();
      canonical.current = null;
      editor.current = "";
      activeOperations.clear();
      retainedSend.current = null;
    };
  }, [id, client, assert, commit, session, report]);
  const turnId =
    workspace?.activeTurnId ??
    (activeTurn(turn) ? turn!.id : (workspace?.latestTurnId ?? null));
  useEffect(() => {
    if (!turnId) return;
    const owner = session.capture(),
      abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const snapshot = await client.poll(turnId, abort.signal);
        assert(owner);
        if (abort.signal.aborted) return;
        setTurn((current) =>
          current &&
          (current.sequence > snapshot.turn.sequence ||
            (current.id === snapshot.turn.id &&
              current.revision > snapshot.turn.revision))
            ? current
            : snapshot.turn,
        );
        setPollError(null);
        if (
          !uncertainBefore.current ||
          uncertainBefore.current.latest !== snapshot.turn.id
        ) {
          uncertainBefore.current = null;
          retainedSend.current = null;
          setSendUncertain(false);
        }
        if (activeTurn(snapshot.turn)) {
          timer = setTimeout(() => void poll(), 1000);
        } else {
          const next = await client.workspace(id, abort.signal);
          assert(owner);
          if (!abort.signal.aborted) commit(next);
        }
      } catch (e) {
        try {
          assert(owner);
          if (!abort.signal.aborted) report(e, true);
        } catch {
          /* stale account */
        }
      }
    };
    void poll();
    return () => {
      abort.abort();
      if (timer) clearTimeout(timer);
    };
  }, [turnId, client, id, session, assert, commit, pollTick, report]);
  const run = async (action: () => Promise<void>) => {
    if (busyRef.current || !mounted.current) return;
    const owner = session.capture();
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
      assert(owner);
    } catch (e) {
      try {
        assert(owner);
        report(e);
      } catch {
        /* stale owner */
      }
    } finally {
      try {
        assert(owner);
        busyRef.current = false;
        setBusy(false);
      } catch {
        /* stale owner */
      }
    }
  };
  const saveSnapshot = async () => {
    let ws = canonical.current;
    if (!ws) throw Error("Workspace missing");
    const owner = session.capture();
    if (editor.current !== ws.draft.text) {
      const value = editor.current;
      const draft = await client.save(
        ws,
        value,
        key("save", {
          draftId: ws.draft.id,
          revision: ws.draft.revision,
          text: value,
        }),
      );
      assert(owner);
      ws = commit({
        ...ws,
        draft,
        attempt: { ...ws.attempt, draftRevision: draft.revision },
      });
    }
    const fresh = await client.workspace(id);
    assert(owner);
    return commit(fresh);
  };
  const dispatch = async (op: PendingSend) => {
    assert(op.owner);
    let next: Turn;
    try {
      next = await client.send(op.workspace, op.intent, op.message, op.key);
    } catch (failure) {
      assert(op.owner);
      if (!(failure instanceof AccountError) || failure.status >= 500) {
        retainedSend.current = op;
        uncertainBefore.current = { latest: op.workspace.latestTurnId };
        setSendUncertain(true);
        try {
          const fresh = await client.workspace(id);
          assert(op.owner);
          commit(fresh);
          if (
            fresh.latestTurnId &&
            fresh.latestTurnId !== op.workspace.latestTurnId
          ) {
            retainedSend.current = null;
            uncertainBefore.current = null;
            setSendUncertain(false);
          }
        } catch (recoveryFailure) {
          assert(op.owner);
          if (
            recoveryFailure instanceof AccountError &&
            [403, 404].includes(recoveryFailure.status)
          )
            throw recoveryFailure;
          /* Preserve exact uncertain operation for explicit retry after transport failure. */
        }
      } else {
        retainedSend.current = null;
        uncertainBefore.current = null;
        setSendUncertain(false);
      }
      throw failure;
    }
    assert(op.owner);
    retainedSend.current = null;
    uncertainBefore.current = null;
    setTurn(next);
    setSendUncertain(false);
    const fresh = await client.workspace(id);
    assert(op.owner);
    commit(fresh);
  };
  return {
    ...account,
    workspace,
    text,
    busy,
    error,
    pollError,
    turn,
    sendUncertain,
    dirty: Boolean(workspace && text !== workspace.draft.text),
    edit: (value: string) => {
      editor.current = value;
      setText(value);
    },
    reload: (discard = false) =>
      run(async () => {
        await reload(discard);
      }),
    check: () => {
      setPollError(null);
      setPollTick((v) => v + 1);
      void run(async () => {
        await reload(false);
      });
    },
    save: () =>
      run(async () => {
        await saveSnapshot();
      }),
    submit: () =>
      run(async () => {
        const owner = session.capture(),
          ws = await saveSnapshot();
        if (ws.attempt.status === "submitted") return;
        const next = await client.submit(
          ws,
          key("submit", {
            attempt: ws.attempt.id,
            revision: ws.revision,
            draft: ws.draft.revision,
            conditions: ws.attempt.conditionsRevision,
          }),
        );
        assert(owner);
        commit(next);
      }),
    assistance: () =>
      run(async () => {
        const ws = canonical.current;
        if (!ws) return;
        const owner = session.capture(),
          next = await client.assistance(
            ws,
            key("assistance", {
              id: ws.id,
              revision: ws.revision,
              conditions: ws.attempt.conditionsRevision,
            }),
          );
        assert(owner);
        commit(next);
      }),
    revise: () =>
      run(async () => {
        const ws = canonical.current;
        if (!ws) return;
        const owner = session.capture(),
          next = await client.revise(
            ws,
            key("revise", {
              id: ws.id,
              revision: ws.revision,
              parent: ws.attempt.id,
            }),
          );
        assert(owner);
        commit(next, true);
        setTurn(null);
      }),
    retryAvailable: Boolean(retainedSend.current),
    retryRequest: () =>
      run(async () => {
        const op = retainedSend.current;
        if (op) {
          assert(op.owner);
          await dispatch(op);
        }
      }),
    send: (intent: Intent, message: string) =>
      run(async () => {
        if (sendUncertain) return;
        const owner = session.capture(),
          workspace = await saveSnapshot();
        await dispatch({
          owner,
          workspace,
          intent,
          message,
          key: key("turn", {
            id: workspace.id,
            revision: workspace.revision,
            work: workspace.draft.revision,
            intent,
            message,
          }),
        });
      }),
    cancel: () =>
      run(async () => {
        if (!turn) return;
        const owner = session.capture(),
          next = await client.cancel(
            turn.id,
            turn.revision,
            key("cancel", { id: turn.id, revision: turn.revision }),
          );
        assert(owner);
        setTurn(next);
      }),
    accept: (proposalId: string, revision: number) =>
      run(async () => {
        const owner = session.capture();
        await client.accept(
          proposalId,
          revision,
          key("accept", { id: proposalId, revision }),
        );
        assert(owner);
        await reload(false);
      }),
  };
}
