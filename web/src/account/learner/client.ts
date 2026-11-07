import { z } from "zod";
import { AccountError, type GuardedTransport } from "../request";
import { preferencesChanged } from "./events";
import { BootstrapSchema, PreferencesSchema, PlanSchema, WorkspaceSchema, SessionSchema, MocksSchema, JobSchema, ProgressSchema, ResultsSchema, VocabularySchema, CoachingSchema, RecordingSchema, ProductFeedbackSchema } from "./contracts";

const segment = (value: string) => encodeURIComponent(value);
function schemaFor(path: string): z.ZodType {
  const name = path.split("?")[0];
  if (name === "/bootstrap") return BootstrapSchema;
  if (name === "/preferences") return PreferencesSchema;
  if (name === "/plans/current") return PlanSchema.nullable();
  if (/^\/plans\/[^/]+\/proposals\//.test(name)) return PlanSchema;
  if (name === "/plans") return z.union([PlanSchema, z.object({ plans: z.array(PlanSchema) })]);
  if (name === "/baselines") return SessionSchema;
  if (name === "/sessions") return z.union([SessionSchema, z.object({ sessions: z.array(SessionSchema) })]);
  if (name.startsWith("/sessions/")) return SessionSchema;
  if (name === "/mocks") return MocksSchema;
  if (name === "/progress") return ProgressSchema;
  if (name === "/results") return ResultsSchema;
  if (name === "/vocabulary" || /^\/vocabulary\/[^/]+\/reviews$/.test(name)) return VocabularySchema;
  if (name === "/coaching") return CoachingSchema;
  if (name === "/feedback") return ProductFeedbackSchema;
  if (name.includes("/turns") || name.includes("/feedback") || name.startsWith("/jobs/")) return JobSchema;
  if (name.startsWith("/workspaces/") || name.startsWith("/attempts/") || name.startsWith("/results/")) return WorkspaceSchema;
  throw new AccountError(400, "invalid_learner_path");
}

export class LearnerClient {
  constructor(readonly http: GuardedTransport) {}
  async read<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(path, undefined, undefined, undefined, signal);
  }
  async mutate<T>(path: string, body: unknown, key: string = crypto.randomUUID(), method: "POST" | "PATCH" = "POST"): Promise<T> {
    return this.request<T>(path, body, key, method);
  }
  private async request<T>(path: string, body?: unknown, key?: string, method?: "POST" | "PATCH", signal?: AbortSignal): Promise<T> {
    if (!/^\/[a-zA-Z0-9_/?=&%.-]+$/.test(path) || path.includes("..")) throw new AccountError(400, "invalid_learner_path");
    const owner = this.http.session.capture();
    const schema = schemaFor(path);
    const abort = new AbortController();
    const stop = () => abort.abort();
    signal?.addEventListener("abort", stop, { once: true });
    if (signal?.aborted) abort.abort();
    const timeout = setTimeout(stop, 20000);
    try {
      const raw = await this.http.request(`/learner${path}`, body, key, abort.signal, method);
      this.http.session.assert(owner);
      const parsed = schema.safeParse(raw);
      if (!parsed.success) throw new AccountError(502, "invalid_learner_response");
      if (path === "/preferences" && body !== undefined) preferencesChanged();
      return parsed.data as T;
    } finally { clearTimeout(timeout); signal?.removeEventListener("abort", stop); }
  }
  async media(workspaceId: string, assetId: string, signal: AbortSignal): Promise<Blob> {
    return this.http.learnerBytes(`/learner/workspaces/${segment(workspaceId)}/assets/${segment(assetId)}`, { signal });
  }
  async savedRecording(recordingId: string, signal: AbortSignal): Promise<Blob> {
    return this.http.learnerBytes(`/learner/recordings/${segment(recordingId)}/audio`, { signal });
  }
  async recording(attemptId: string, itemId: string, revision: number, body: Blob, key: string, signal?: AbortSignal) {
    const raw = await this.http.learnerBytes(`/learner/attempts/${segment(attemptId)}/recordings?itemId=${segment(itemId)}&expectedDraftRevision=${revision}`, { method: "POST", body, operationId: key, signal });
    const parsed = RecordingSchema.safeParse(await raw.text().then((value) => JSON.parse(value)));
    if (!parsed.success) throw new AccountError(502, "invalid_learner_response");
    return parsed.data;
  }
}
