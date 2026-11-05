import { expect, it, vi } from "vitest";
import { SessionController } from "@/auth/session";
import type { AuthPort, Session } from "@/auth/types";
import { GuardedTransport } from "../request";
import { StudyClient } from "./client";
import { workspace, deferred, bundle } from "./testSupport";
import { MessageSchema, PollSchema } from "./contracts";
import { codepointQuote, messageMatchesCurrentWork } from "./messages";
export async function auth() {
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
  const session = new SessionController(port);
  await session.start();
  await session.signIn("a", "");
  return session;
}
it("carries exact guarded save headers/body and rejects stale A work under B", async () => {
  const session = await auth(),
    late = deferred<Response>();
  const fetcher = vi.fn(() => late.promise),
    client = new StudyClient(new GuardedTransport(session, "", fetcher));
  const ws = workspace(),
    key = crypto.randomUUID(),
    pending = client.save(ws, "A edit", key);
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
  const options = fetcher.mock.calls[0][1] as RequestInit;
  const headers = new Headers(options.headers);
  expect(options).toMatchObject({
    method: "PATCH",
    redirect: "error",
    credentials: "omit",
    cache: "no-store",
  });
  expect(headers.get("X-Expected-User-Id")).toBe("a");
  expect(headers.get("Idempotency-Key")).toBe(key);
  expect(JSON.parse(options.body as string)).toEqual({
    expectedDraftRevision: 1,
    taskId: "task-a",
    changes: { text: "A edit" },
  });
  await session.signIn("b", "");
  late.resolve(Response.json({ ...ws.draft, text: "A edit", revision: 2 }));
  await expect(pending).rejects.toThrow("account_changed");
});
it("validates Unicode codepoint work spans including Persian and emoji", () => {
  const text = "سلام🙂 draft";
  expect(codepointQuote(text, 4, 5)).toBe("🙂");
  const ws = workspace();
  ws.draft.text = text;
  const message = MessageSchema.parse({
    id: "message",
    turnId: "turn",
    workspaceId: ws.id,
    kind: "explanation",
    requestText: "",
    text: "<script>plain text</script>",
    citations: [],
    workSpans: [{ start: 4, end: 5, quote: "🙂" }],
    observations: [],
    proposalId: null,
    provenance: {
      actorKind: "ai_formative",
      runnerKind: "synthetic",
      bundleRef: bundle,
      contextManifestId: "manifest-a",
      workRef: { kind: "draft", id: ws.draft.id, revision: 1 },
    },
    createdAt: "now",
  });
  expect(messageMatchesCurrentWork(message, ws)).toBe(true);
  const wrongAnchor = structuredClone(message);
  wrongAnchor.citations = [{ anchorId: "not-admitted", label: "Unknown" }];
  expect(messageMatchesCurrentWork(wrongAnchor, ws)).toBe(false);
  message.workSpans[0].quote = "x";
  expect(messageMatchesCurrentWork(message, ws)).toBe(false);
  expect(MessageSchema.safeParse({ ...message, score: 7 }).success).toBe(false);
  expect(
    MessageSchema.safeParse({ ...message, text: "x".repeat(6001) }).success,
  ).toBe(false);
  expect(
    PollSchema.safeParse({
      turn: {},
      events: [],
      cursor: 0,
      workspaceRevision: 1,
      terminalMessage: message,
    }).success,
  ).toBe(false);
});

it("rejects completed status without its canonical committed message", () => {
  expect(
    PollSchema.safeParse({
      turn: {
        id: "turn",
        revision: 1,
        workspaceId: "workspace",
        sequence: 1,
        inputWorkRevision: 1,
        bundleRef: bundle,
        intent: "explain",
        runnerKind: "synthetic",
        status: "completed",
        lastEventSequence: 2,
        error: null,
        retryAction: null,
      },
      events: [],
      cursor: 2,
      workspaceRevision: 1,
      terminalMessage: null,
    }).success,
  ).toBe(false);
});
