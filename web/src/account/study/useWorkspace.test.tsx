import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useWorkspace } from "./useWorkspace";
import { workspace, deferred } from "./testSupport";
import { AccountError } from "../request";
const state = vi.hoisted(() => ({
  client: {
    workspace: vi.fn(),
    save: vi.fn(),
    submit: vi.fn(),
    poll: vi.fn(),
    send: vi.fn(),
    assistance: vi.fn(),
    revise: vi.fn(),
    cancel: vi.fn(),
    accept: vi.fn(),
  },
  session: { capture: vi.fn(), assert: vi.fn() },
}));
vi.mock("./useStudy", () => ({ useStudy: () => ({ ...state, local: true }) }));
beforeEach(() => {
  vi.clearAllMocks();
  state.session.capture.mockReturnValue({ subject: "a", epoch: 1 });
  state.session.assert.mockImplementation(() => {});
});
it("preserves edited work on503 and409 and reuses the exact lost-save operation", async () => {
  const ws = workspace();
  state.client.workspace.mockResolvedValue(ws);
  state.client.save.mockRejectedValue(
    new AccountError(503, "store_unavailable"),
  );
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  act(() => result.current.edit("my unsaved draft"));
  await act(() => result.current.save());
  expect(result.current.text).toBe("my unsaved draft");
  expect(result.current.dirty).toBe(true);
  const key = state.client.save.mock.calls[0][2];
  await act(() => result.current.save());
  expect(state.client.save.mock.calls[1][2]).toBe(key);
  state.client.save.mockRejectedValueOnce(
    new AccountError(409, "revision_conflict"),
  );
  await act(() => result.current.save());
  expect(result.current.text).toBe("my unsaved draft");
});
it("keeps dirty editor on canonical reload and discards only on explicit request", async () => {
  const ws = workspace();
  state.client.workspace.mockResolvedValue(ws);
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  act(() => result.current.edit("local dirty"));
  const newer = workspace({
    draft: { ...ws.draft, revision: 2, text: "external canonical" },
  });
  state.client.workspace.mockResolvedValue(newer);
  await act(() => result.current.reload());
  expect(result.current.text).toBe("local dirty");
  await act(() => result.current.reload(true));
  expect(result.current.text).toBe("external canonical");
});
it("does not commit a delayed A save when the session epoch changes", async () => {
  const ws = workspace(),
    late = deferred<typeof ws.draft>();
  state.client.workspace.mockResolvedValue(ws);
  state.client.save.mockReturnValue(late.promise);
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  act(() => result.current.edit("A private edit"));
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.save();
  });
  await waitFor(() => expect(state.client.save).toHaveBeenCalledOnce());
  state.session.assert.mockImplementation(() => {
    throw Error("account_changed");
  });
  await act(async () => {
    late.resolve({ ...ws.draft, revision: 2, text: "late A saved" });
    await pending;
  });
  expect(result.current.workspace?.draft.text).toBe("saved response");
});
it("recovers a lost turn ACK by reading its durable latest turn, never reposting", async () => {
  const ws = workspace();
  state.client.workspace
    .mockResolvedValueOnce(ws)
    .mockResolvedValueOnce(ws)
    .mockResolvedValue(workspace({ latestTurnId: "durable-turn" }));
  state.client.send.mockRejectedValue(new TypeError("lost ack"));
  state.client.poll.mockResolvedValue({
    turn: {
      id: "durable-turn",
      workspaceId: ws.id,
      revision: 1,
      status: "failed",
    },
    terminalMessage: null,
  });
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  await act(() => result.current.send("explain", ""));
  await waitFor(() => expect(result.current.turn?.id).toBe("durable-turn"));
  expect(state.client.send).toHaveBeenCalledOnce();
  expect(result.current.sendUncertain).toBe(false);
  expect(result.current.retryAvailable).toBe(false);
});
it("purges loaded private work on revoked access rather than retaining stale task UI", async () => {
  const ws = workspace();
  state.client.workspace.mockResolvedValue(ws);
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  state.client.workspace.mockRejectedValue(
    new AccountError(403, "study_forbidden"),
  );
  await act(() => result.current.reload());
  expect(result.current.workspace).toBeNull();
  expect(result.current.text).toBe("");
});

it("preserves newer local edits when a completed turn refreshes canonical saved work", async () => {
  const ws = workspace({ activeTurnId: "turn-a", latestTurnId: "turn-a" }),
    late = deferred<ReturnType<typeof workspace>>();
  state.client.workspace
    .mockResolvedValueOnce(ws)
    .mockReturnValueOnce(late.promise);
  state.client.poll.mockResolvedValue({
    turn: {
      id: "turn-a",
      workspaceId: ws.id,
      revision: 2,
      status: "completed",
    },
    terminalMessage: null,
  });
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(state.client.workspace).toHaveBeenCalledTimes(2));
  act(() => result.current.edit("newer local thinking"));
  await act(async () =>
    late.resolve(workspace({ latestTurnId: "turn-a", revision: 2 })),
  );
  expect(result.current.text).toBe("newer local thinking");
  expect(result.current.dirty).toBe(true);
  expect(state.client.send).not.toHaveBeenCalled();
});
it("retries a never-accepted POST only explicitly with the original body and operation key", async () => {
  const ws = workspace();
  let accepted = false;
  state.client.workspace.mockImplementation(async () =>
    accepted ? workspace({ revision: 2, latestTurnId: "retry-turn" }) : ws,
  );
  state.client.send
    .mockRejectedValueOnce(new TypeError("never reached server"))
    .mockImplementationOnce(async () => {
      accepted = true;
      return {
        id: "retry-turn",
        workspaceId: ws.id,
        revision: 1,
        sequence: 1,
        status: "failed",
      };
    });
  state.client.poll.mockResolvedValue({
    turn: {
      id: "retry-turn",
      workspaceId: ws.id,
      revision: 1,
      sequence: 1,
      status: "failed",
    },
    terminalMessage: null,
  });
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  await act(() => result.current.send("explain", "Original learner question"));
  expect(result.current.sendUncertain).toBe(true);
  expect(result.current.retryAvailable).toBe(true);
  act(() => result.current.check());
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(state.client.send).toHaveBeenCalledOnce();
  expect(result.current.sendUncertain).toBe(true);
  const original = state.client.send.mock.calls[0];
  await act(() => result.current.retryRequest());
  expect(state.client.send).toHaveBeenCalledTimes(2);
  expect(state.client.send.mock.calls[1]).toEqual(original);
  expect(result.current.sendUncertain).toBe(false);
  expect(result.current.retryAvailable).toBe(false);
});
it("does not rebuild an uncertain operation around an intervening saved draft revision", async () => {
  const ws = workspace();
  let stored = ws;
  state.client.workspace.mockImplementation(async () => stored);
  state.client.send
    .mockRejectedValueOnce(new TypeError("never accepted"))
    .mockRejectedValueOnce(new AccountError(409, "revision_conflict"));
  state.client.save.mockImplementation(async () => {
    stored = workspace({
      draft: { ...ws.draft, text: "newer saved revision", revision: 2 },
      attempt: { ...ws.attempt, draftRevision: 2 },
    });
    return stored.draft;
  });
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  await act(() => result.current.send("explain", "original request"));
  const original = state.client.send.mock.calls[0];
  act(() => result.current.edit("newer saved revision"));
  await act(() => result.current.save());
  await act(() => result.current.retryRequest());
  expect(state.client.send.mock.calls[1]).toEqual(original);
  expect(state.client.send.mock.calls[1][0].draft.revision).toBe(1);
  expect(result.current.text).toBe("newer saved revision");
  expect(result.current.error).toBeInstanceOf(AccountError);
});
it("clears the retained uncertain operation when its account-owned route unmounts", async () => {
  const ws = workspace();
  state.client.workspace.mockResolvedValue(ws);
  state.client.send.mockRejectedValue(new TypeError("never accepted"));
  const { result, unmount } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  await act(() => result.current.send("explain", "A private request"));
  const retry = result.current.retryRequest;
  unmount();
  state.session.capture.mockReturnValue({ subject: "b", epoch: 2 });
  state.session.assert.mockImplementation((owner) => {
    if (owner.subject !== "b") throw Error("account_changed");
  });
  await retry();
  expect(state.client.send).toHaveBeenCalledOnce();
});

it("purges private work when uncertain-send discovery reports revoked access", async () => {
  const ws = workspace();
  state.client.workspace
    .mockResolvedValueOnce(ws)
    .mockResolvedValueOnce(ws)
    .mockRejectedValueOnce(new AccountError(403, "study_forbidden"));
  state.client.send.mockRejectedValue(new TypeError("lost ack"));
  const { result } = renderHook(() => useWorkspace(ws.id));
  await waitFor(() => expect(result.current.workspace).not.toBeNull());
  await act(() => result.current.send("explain", "private request"));
  expect(result.current.workspace).toBeNull();
  expect(result.current.text).toBe("");
  expect(result.current.retryAvailable).toBe(false);
  expect(result.current.error).toBeInstanceOf(AccountError);
});
