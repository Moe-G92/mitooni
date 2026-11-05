// Adapted from BarEx api.ts token/send/error mechanics; no source commercial fields.
import {
  AccountSchema,
  type Account,
  type EditableProfile,
  type ProfileChanges,
} from "./contracts";
import { SessionController } from "@/auth/session";
import { GuardedTransport, AccountError } from "./request";
export { AccountError } from "./request";
export class AccountClient {
  readonly http: GuardedTransport;
  constructor(
    private session: SessionController,
    base = "",
    fetcher: typeof fetch = (...args) => fetch(...args),
  ) {
    this.http = new GuardedTransport(session, base, fetcher);
  }
  async request(
    path: string,
    body?: unknown,
    operationId?: string,
    signal?: AbortSignal,
  ): Promise<Account> {
    const owner = this.session.capture();
    const data = await this.http.request(
      path,
      body,
      operationId,
      signal,
      path === "/profile" ? "PATCH" : undefined,
    );
    this.session.assert(owner);
    const account = AccountSchema.parse(data);
    if (account.identity.id !== owner.subject)
      throw new AccountError(409, "account_changed");
    return account;
  }
  get(signal?: AbortSignal) {
    return this.request("/account", undefined, undefined, signal);
  }
  update(expectedRevision: number, changes: ProfileChanges, key: string) {
    return this.request("/profile", { expectedRevision, changes }, key);
  }
  onboard(profile: EditableProfile, key: string) {
    return this.request(
      "/profile/onboarding",
      { expectedRevision: 0, profile },
      key,
    );
  }
}
