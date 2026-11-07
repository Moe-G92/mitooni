import { z } from "zod";
import { AccountError, GuardedTransport } from "../request";
import { Catalog, Snapshot, Export, type SnapshotData } from "./contracts";
export type Operation = {
  targetId: string;
  action: "draft" | "submit" | "reveal" | "review";
  body: Record<string, unknown>;
  key: string;
  owner: { subject: string; epoch: number };
};
export class ReviewClient {
  constructor(readonly http: GuardedTransport) {}
  private async read<T>(
    schema: z.ZodType<T>,
    path: string,
    signal?: AbortSignal,
    op?: Operation,
  ) {
    const owner = op?.owner ?? this.http.session.capture();
    this.http.session.assert(owner);
    const abort = new AbortController();
    const stop = () => abort.abort();
    signal?.addEventListener("abort", stop, { once: true });
    if (signal?.aborted) abort.abort();
    const timer = setTimeout(stop, 15000);
    try {
      const data = await this.http.request(
        `/content-review${path}`,
        op?.body,
        op?.key,
        abort.signal,
        op
          ? ["draft", "review"].includes(op.action)
            ? "PATCH"
            : "POST"
          : "GET",
      );
      this.http.session.assert(owner);
      const parsed = schema.safeParse(data);
      if (!parsed.success)
        throw new AccountError(502, "invalid_review_response");
      return parsed.data;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", stop);
    }
  }
  catalog(signal?: AbortSignal) {
    return this.read(Catalog, "/catalog", signal);
  }
  target(id: string, signal?: AbortSignal) {
    return this.read(
      Snapshot,
      `/targets/${encodeURIComponent(id)}`,
      signal,
    ).then((s) => {
      if (s.target.id !== id)
        throw new AccountError(502, "invalid_review_target");
      return s;
    });
  }
  export() {
    return this.read(Export, "/export");
  }
  operation(
    s: SnapshotData,
    action: Operation["action"],
    changes = {},
  ): Operation {
    return {
      targetId: s.target.id,
      action,
      key: crypto.randomUUID(),
      owner: this.http.session.capture(),
      body: structuredClone({
        packageHash: s.packageHash,
        targetHash: s.targetHash,
        expectedRevision: s.revision,
        ...changes,
      }),
    };
  }
  mutate(op: Operation) {
    return this.read(
      Snapshot,
      `/targets/${encodeURIComponent(op.targetId)}/${op.action}`,
      undefined,
      op,
    ).then((s) => {
      if (
        s.target.id !== op.targetId ||
        s.packageHash !== op.body.packageHash ||
        s.targetHash !== op.body.targetHash
      )
        throw new AccountError(502, "invalid_review_binding");
      return s;
    });
  }
}
