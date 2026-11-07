import { expect, it, vi } from "vitest";
import { SessionController } from "@/auth/session";
import type { AuthPort, Session } from "@/auth/types";
import { GuardedTransport } from "../request";
import { LearnerClient } from "./client";
import { privateSafeListeningWorkspace } from "./testSupport";
import { WorkspaceSchema } from "./contracts";

async function actor() {
  let current: Session | null = null;
  const port: AuthPort = { initialize: async () => null, subscribe: () => () => {}, signIn: async (subject) => (current = { subject, token: "synthetic" }), refresh: async () => current, signOut: async () => { current = null; } };
  const session = new SessionController(port); await session.start(); await session.signIn("candidate-a", ""); return session;
}

it("fences delayed candidate data after an account switch", async () => {
  const session = await actor();
  let finish!: (response: Response) => void;
  const fetcher = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
  const client = new LearnerClient(new GuardedTransport(session, "", fetcher));
  const pending = client.read("/bootstrap");
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
  await session.signIn("candidate-b", ""); finish(Response.json({}));
  await expect(pending).rejects.toThrow("account_changed");
});

it("validates canonical output and carries the exact operation key and owner", async () => {
  const session = await actor();
  const fetcher = vi.fn(async () => Response.json({ revision: 1, items: [], available: true, serverNow: "2026-11-07T12:00:00Z" }));
  const client = new LearnerClient(new GuardedTransport(session, "", fetcher));
  const body = { word: "study", expectedRevision: 0 }, key = crypto.randomUUID();
  await client.mutate("/vocabulary", body, key);
  const init = fetcher.mock.calls[0][1] as RequestInit;
  expect(fetcher.mock.calls[0][0]).toBe("/api/learner/vocabulary");
  expect(new Headers(init.headers).get("Idempotency-Key")).toBe(key);
  expect(new Headers(init.headers).get("X-Expected-User-Id")).toBe("candidate-a");
  expect(JSON.parse(init.body as string)).toEqual(body);
  fetcher.mockResolvedValueOnce(Response.json({ available: true, items: [{ word: "unowned" }] }));
  await expect(client.read("/vocabulary")).rejects.toMatchObject({ code: "invalid_learner_response" });
});

it("keeps learner media authority separate and rejects oversized or wrong-format uploads before sending", async () => {
  const session = await actor();
  const fetcher = vi.fn(async () => new Response(new Uint8Array([1, 2]), { headers: { "Content-Type": "image/png" } }));
  const http = new GuardedTransport(session, "", fetcher);
  await expect(http.rawResponse("/learner/workspaces/one/assets/picture")).rejects.toMatchObject({ code: "invalid_media_path" });
  await expect(http.learnerBytes("/content-review/targets/one/assets/picture")).rejects.toMatchObject({ code: "invalid_media_path" });
  await expect(http.learnerBytes("/learner/attempts/one/recordings?itemId=spoken&expectedDraftRevision=1", { method: "POST", body: new Blob(["text"], { type: "text/plain" }), operationId: crypto.randomUUID() })).rejects.toMatchObject({ code: "invalid_audio" });
  expect(fetcher).not.toHaveBeenCalled();
  const blob = await http.learnerBytes("/learner/workspaces/one/assets/picture");
  expect(blob.type).toBe("image/png");
  expect(fetcher).toHaveBeenCalledOnce();
});
it("accepts the private-safe Listening null fields without changing the committed workspace or deadline", async () => {
  const session = await actor();
  const projection = privateSafeListeningWorkspace();
  const parsed = WorkspaceSchema.parse(projection);
  expect(parsed.task.sections[0].text).toBe("");
  expect(parsed.task.assets[0].alt).toBe("");
  expect(parsed.answerReview).toBeNull();
  const fetcher = vi.fn(async () => Response.json(projection));
  const client = new LearnerClient(new GuardedTransport(session, "", fetcher));
  const body = { sessionId: "session-one", sectionId: "section-one", conditionPreset: "independent" }, key = crypto.randomUUID();
  const first = await client.mutate("/workspaces/resolve", body, key);
  const replay = await client.mutate("/workspaces/resolve", body, key);
  expect(replay).toEqual(first);
  expect(first).toMatchObject({ id: projection.id, attempt: { id: projection.attempt.id, deadlineAt: projection.attempt.deadlineAt } });
  const firstRequest = fetcher.mock.calls[0][1] as RequestInit;
  const secondRequest = fetcher.mock.calls[1][1] as RequestInit;
  expect(fetcher.mock.calls[0][0]).toBe(fetcher.mock.calls[1][0]);
  expect(firstRequest.body).toBe(secondRequest.body);
  expect(new Headers(firstRequest.headers).get("Idempotency-Key")).toBe(key);
  expect(new Headers(secondRequest.headers).get("Idempotency-Key")).toBe(key);
});
