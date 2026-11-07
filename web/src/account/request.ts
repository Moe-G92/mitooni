// Adapted BarEx token/send/error mechanics; shared domain-neutral receiving transport.
import { SessionController } from "@/auth/session";
export class AccountError extends Error {
  constructor(
    public status: number,
    public code: string,
    public requestId: string | null = null,
    public fields: unknown = null,
  ) {
    super(code);
  }
}
export class GuardedTransport {
  constructor(
    readonly session: SessionController,
    private base = "",
    private fetcher: typeof fetch = (...args) => fetch(...args),
  ) {}
  /** Candidate media uses a separate allowlist; it never grants reviewer access. */
  async learnerBytes(
    path: string,
    options: { method?: "GET" | "POST"; body?: Blob; operationId?: string; signal?: AbortSignal } = {},
  ): Promise<Blob> {
    if (!/^\/learner\/(?:workspaces\/[^/?]+\/assets\/[^/?]+|recordings\/[^/?]+\/audio|attempts\/[^/?]+\/recordings\?itemId=[^&]+&expectedDraftRevision=\d+)$/.test(path) || /[\\#\s]/.test(path) || path.includes("..") || /%2f|%5c|%2e/i.test(path))
      throw new AccountError(400, "invalid_media_path");
    const owner = this.session.capture();
    const send = async (refresh = false) => {
      const token = await this.session.token(owner, refresh);
      this.session.assert(owner);
      const headers = new Headers({ Authorization: `Bearer ${token}` });
      if (options.body) {
        if (!options.operationId || options.body.type !== "audio/wav" || options.body.size > 18 * 1024 * 1024) throw new AccountError(400, "invalid_audio");
        headers.set("Content-Type", "audio/wav");
        headers.set("Idempotency-Key", options.operationId);
        headers.set("X-Expected-User-Id", owner.subject);
      }
      return this.fetcher(`${this.base}/api${path}`, { method: options.method ?? "GET", headers, body: options.body, signal: options.signal, credentials: "omit", redirect: "error", cache: "no-store" });
    };
    let response = await send();
    this.session.assert(owner);
    if (response.status === 401) response = await send(true);
    this.session.assert(owner);
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { detail?: { code?: string } } | null;
      this.session.assert(owner);
      if (response.status === 401) void this.session.signOut().catch(() => {});
      throw new AccountError(response.status, data?.detail?.code ?? "invalid_media_request");
    }
    if (!response.body) throw new AccountError(502, "missing_media_body");
    const reader = response.body.getReader();
    const parts: Uint8Array<ArrayBuffer>[] = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > 48 * 1024 * 1024) throw new AccountError(413, "media_too_large");
        parts.push(new Uint8Array(value));
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error; }
    finally { reader.releaseLock(); }
    this.session.assert(owner);
    return new Blob(parts, { type: response.headers.get("Content-Type")?.split(";")[0] ?? "application/octet-stream" });
  }
  /** Raw private media only. Callers construct a fixed receiving API path. */
  async rawResponse(
    path: string,
    options: {
      method?: "GET" | "POST";
      body?: Blob;
      headers?: HeadersInit;
      operationId?: string;
      signal?: AbortSignal;
    } = {},
  ): Promise<Response> {
    if (
      !path.startsWith("/content-review/targets/") ||
      path.startsWith("//") ||
      /[\\#\s]/.test(path) ||
      Array.from(path).some(
        (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
      ) ||
      path.includes("..") ||
      /%2f|%5c|%2e/i.test(path)
    )
      throw new AccountError(400, "invalid_media_path");
    const owner = this.session.capture();
    const send = async (refresh = false) => {
      const token = await this.session.token(owner, refresh);
      this.session.assert(owner);
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token}`);
      if (options.body !== undefined) {
        if (!options.operationId)
          throw new AccountError(400, "missing_operation_key");
        headers.set("Idempotency-Key", options.operationId);
        headers.set("X-Expected-User-Id", owner.subject);
      }
      return this.fetcher(`${this.base}/api${path}`, {
        method: options.method ?? "GET",
        body: options.body,
        headers,
        signal: options.signal,
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
      });
    };
    let response = await send();
    this.session.assert(owner);
    if (response.status === 401) {
      response = await send(true);
      this.session.assert(owner);
    }
    if (response.status === 401) {
      void this.session.signOut().catch(() => {});
      throw new AccountError(401, "unauthenticated");
    }
    if (!response.ok) {
      const data: unknown = await response.json().catch(() => null);
      this.session.assert(owner);
      const value = data as {
        detail?: { code?: unknown };
        requestId?: unknown;
      } | null;
      throw new AccountError(
        response.status,
        typeof value?.detail?.code === "string"
          ? value.detail.code
          : response.status === 503
            ? "store_unavailable"
            : "invalid_media_request",
        typeof value?.requestId === "string" ? value.requestId : null,
      );
    }
    this.session.assert(owner);
    return response;
  }
  async request(
    path: string,
    body?: unknown,
    operationId?: string,
    signal?: AbortSignal,
    method?: "GET" | "PATCH" | "POST",
  ): Promise<unknown> {
    const owner = this.session.capture();
    const send = async (refresh = false) => {
      const token = await this.session.token(owner, refresh);
      this.session.assert(owner);
      const headers = new Headers({ Authorization: `Bearer ${token}` });
      if (body !== undefined) {
        headers.set("Content-Type", "application/json");
        headers.set("Idempotency-Key", operationId!);
        headers.set("X-Expected-User-Id", owner.subject);
      }
      return this.fetcher(`${this.base}/api${path}`, {
        method: method ?? (body === undefined ? "GET" : "POST"),
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
      });
    };
    let response = await send();
    this.session.assert(owner);
    if (response.status === 401) {
      response = await send(true);
      this.session.assert(owner);
    }
    const data: unknown = await response.json().catch(() => null);
    this.session.assert(owner);
    if (response.status === 401) {
      void this.session.signOut().catch(() => {});
      throw new AccountError(401, "unauthenticated");
    }
    if (!response.ok) {
      const value = data as { detail?: unknown; requestId?: unknown } | null;
      const detail = value?.detail;
      const code =
        detail &&
        typeof detail === "object" &&
        !Array.isArray(detail) &&
        "code" in detail
          ? String(detail.code)
          : response.status === 401
            ? "unauthenticated"
            : response.status === 503
              ? "store_unavailable"
              : "invalid_request";
      throw new AccountError(
        response.status,
        code,
        typeof value?.requestId === "string" ? value.requestId : null,
        detail && typeof detail === "object" && "fields" in detail
          ? detail.fields
          : null,
      );
    }
    this.session.assert(owner);
    return data;
  }
}
