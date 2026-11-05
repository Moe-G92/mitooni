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
