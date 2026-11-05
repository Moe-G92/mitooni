import type { z } from "zod";
import { GuardedTransport, AccountError } from "../request";
import {
  JourneySchema,
  WorkspaceSchema,
  DraftSchema,
  TurnSchema,
  PollSchema,
  AcceptSchema,
  type Workspace,
  type Intent,
} from "./contracts";
const segment = (value: string) => encodeURIComponent(value);
export class StudyClient {
  constructor(readonly http: GuardedTransport) {}
  private async read<T>(
    schema: z.ZodType<T>,
    path: string,
    body?: unknown,
    key?: string,
    signal?: AbortSignal,
    method?: "PATCH" | "POST",
  ) {
    const owner = this.http.session.capture();
    const abort = new AbortController();
    const stop = () => abort.abort();
    signal?.addEventListener("abort", stop, { once: true });
    if (signal?.aborted) abort.abort();
    const deadline = setTimeout(stop, 15000);
    let data: unknown;
    try {
      data = await this.http.request(
        `/study${path}`,
        body,
        key,
        abort.signal,
        method,
      );
    } finally {
      clearTimeout(deadline);
      signal?.removeEventListener("abort", stop);
    }

    this.http.session.assert(owner);
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new AccountError(502, "invalid_study_response");
    return parsed.data;
  }
  journey(signal?: AbortSignal) {
    return this.read(JourneySchema, "/journey", undefined, undefined, signal);
  }
  resolve(
    stepId: string,
    conditionPreset: "supported" | "independent",
    expectedJourneyRevision: number,
    key: string,
  ) {
    return this.read(
      WorkspaceSchema,
      "/workspaces/resolve",
      { stepId, conditionPreset, expectedJourneyRevision },
      key,
    );
  }
  workspace(id: string, signal?: AbortSignal) {
    return this.read(
      WorkspaceSchema,
      `/workspaces/${segment(id)}`,
      undefined,
      undefined,
      signal,
    ).then((ws) => {
      if (ws.id !== id) throw new AccountError(409, "workspace_changed");
      return ws;
    });
  }
  save(ws: Workspace, text: string, key: string) {
    return this.read(
      DraftSchema,
      `/workspaces/${segment(ws.id)}/draft`,
      {
        expectedDraftRevision: ws.draft.revision,
        taskId: ws.task.taskId,
        changes: { text },
      },
      key,
      undefined,
      "PATCH",
    ).then((d) => {
      if (
        d.workspaceId !== ws.id ||
        d.id !== ws.draft.id ||
        d.attemptId !== ws.attempt.id
      )
        throw new AccountError(409, "workspace_changed");
      return d;
    });
  }
  submit(ws: Workspace, key: string) {
    return this.read(
      WorkspaceSchema,
      `/attempts/${segment(ws.attempt.id)}/submit`,
      {
        expectedWorkspaceRevision: ws.revision,
        expectedDraftRevision: ws.draft.revision,
        expectedConditionsRevision: ws.attempt.conditionsRevision,
      },
      key,
    );
  }
  assistance(ws: Workspace, key: string) {
    return this.read(
      WorkspaceSchema,
      `/workspaces/${segment(ws.id)}/assistance`,
      {
        expectedWorkspaceRevision: ws.revision,
        expectedConditionsRevision: ws.attempt.conditionsRevision,
        action: "switch_to_supported",
      },
      key,
    );
  }
  revise(ws: Workspace, key: string) {
    return this.read(
      WorkspaceSchema,
      `/workspaces/${segment(ws.id)}/attempts`,
      {
        expectedWorkspaceRevision: ws.revision,
        parentAttemptId: ws.attempt.id,
        conditionPreset: "supported",
      },
      key,
    );
  }
  send(ws: Workspace, intent: Intent, message: string, key: string) {
    const workRef =
      ws.attempt.status === "submitted"
        ? {
            kind: "attempt",
            id: ws.attempt.id,
            revision: ws.attempt.draftRevision,
          }
        : { kind: "draft", id: ws.draft.id, revision: ws.draft.revision };
    return this.read(
      TurnSchema,
      `/workspaces/${segment(ws.id)}/turns`,
      { expectedWorkspaceRevision: ws.revision, workRef, intent, message },
      key,
    ).then((t) => {
      if (t.workspaceId !== ws.id)
        throw new AccountError(409, "workspace_changed");
      return t;
    });
  }
  poll(id: string, signal?: AbortSignal) {
    return this.read(
      PollSchema,
      `/turns/${segment(id)}`,
      undefined,
      undefined,
      signal,
    ).then((p) => {
      if (p.turn.id !== id) throw new AccountError(409, "turn_changed");
      return p;
    });
  }
  cancel(turnId: string, expectedTurnRevision: number, key: string) {
    return this.read(
      TurnSchema,
      `/turns/${segment(turnId)}/cancel`,
      { expectedTurnRevision },
      key,
    );
  }
  accept(id: string, expectedJourneyRevision: number, key: string) {
    return this.read(
      AcceptSchema,
      `/proposals/${segment(id)}/accept`,
      { expectedJourneyRevision },
      key,
    );
  }
}
