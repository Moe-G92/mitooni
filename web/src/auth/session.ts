// BarEx auth-event lifecycle adapted to isolated, nonpersistent receiving-product sessions.
import type { AuthPort, Session, SessionSnapshot } from "./types";
import { AccountChanged } from "./types";
import { SIGNOUT_KEY as TOMBSTONE } from "./signoutBus";
type Owner = { subject: string; epoch: number };
export class SessionController {
  private snapshot: SessionSnapshot = {
    session: null,
    epoch: 0,
    phase: "initializing",
  };
  private listeners = new Set<() => void>();
  private blocked = false;
  private faulted = false;
  private authTail: Promise<unknown> = Promise.resolve();
  private refreshFlight: {
    epoch: number;
    promise: Promise<Session | null>;
  } | null = null;
  constructor(
    private port: AuthPort,
    private storage: Pick<
      Storage,
      "getItem" | "setItem" | "removeItem"
    > | null = null,
    private publishSignOut: () => void = () => {},
  ) {
    try {
      this.blocked = !!storage?.getItem(TOMBSTONE);
    } catch {
      this.blocked = true;
    }
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit(
    session: Session | null,
    phase: SessionSnapshot["phase"],
    force = false,
  ) {
    const changed =
      force || session?.subject !== this.snapshot.session?.subject;
    this.snapshot = {
      session,
      phase,
      epoch: this.snapshot.epoch + (changed ? 1 : 0),
    };
    this.listeners.forEach((listener) => listener());
  }
  // Port operations mutate one SDK session. Serialize them; UI invalidation never waits.
  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.authTail.then(async () => {
      if (this.faulted) throw Error("auth_restart_required");
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          work(),
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => {
              this.faulted = true;
              this.blocked = true;
              this.emit(null, "signed-out", true);
              reject(Error("auth_restart_required"));
            }, 15_000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    });
    this.authTail = result.catch(() => {});
    return result;
  }
  async start() {
    const unsubscribe = this.port.subscribe((session) => {
      if (this.blocked || this.snapshot.phase === "initializing") return;
      // Only deliberate signIn may change identity. Late refresh events cannot restore A under B.
      if (session && session.subject !== this.snapshot.session?.subject) {
        void this.signOut().catch(() => {});
        return;
      }
      this.emit(session, session ? "authenticated" : "signed-out");
    });
    const at = this.snapshot.epoch;
    try {
      const session = await this.port.initialize();
      if (this.snapshot.epoch === at)
        this.emit(
          this.blocked ? null : session,
          !this.blocked && session ? "authenticated" : "signed-out",
        );
    } catch {
      if (this.snapshot.epoch === at) this.emit(null, "signed-out");
    }
    return unsubscribe;
  }
  capture(): Owner {
    const s = this.snapshot;
    if (!s.session || s.phase !== "authenticated") throw new AccountChanged();
    return { subject: s.session.subject, epoch: s.epoch };
  }
  assert(owner: Owner) {
    if (
      this.snapshot.phase !== "authenticated" ||
      this.snapshot.session?.subject !== owner.subject ||
      this.snapshot.epoch !== owner.epoch
    )
      throw new AccountChanged();
  }
  async token(owner: Owner, refresh = false) {
    this.assert(owner);
    if (refresh) {
      if (this.refreshFlight?.epoch !== owner.epoch) {
        const flight = {
          epoch: owner.epoch,
          promise: this.enqueue(async () => {
            this.assert(owner);
            return this.port.refresh();
          }),
        };
        this.refreshFlight = flight;
        void flight.promise
          .finally(() => {
            if (this.refreshFlight === flight) this.refreshFlight = null;
          })
          .catch(() => {});
      }
      const session = await this.refreshFlight!.promise;
      this.assert(owner);
      if (!session) {
        void this.signOut().catch(() => {});
        throw new AccountChanged();
      }
      if (session.subject !== owner.subject) throw new AccountChanged();
      this.emit(session, "authenticated");
    }
    this.assert(owner);
    return this.snapshot.session!.token;
  }
  async signIn(email: string, password: string) {
    this.blocked = true;
    this.emit(null, "signed-out", true);
    const at = this.snapshot.epoch;
    const session = await this.enqueue(async () => {
      if (this.snapshot.epoch !== at) throw new AccountChanged();
      return this.port.signIn(email, password);
    });
    if (this.snapshot.epoch !== at) throw new AccountChanged();
    try {
      this.storage?.removeItem(TOMBSTONE);
    } catch {
      /* Nonpersistent SDK never rehydrates a stored session. */
    }
    this.blocked = false;
    this.emit(session, "authenticated", true);
  }
  receivePeerSignOut() {
    void this.endSession(false).catch(() => {});
  }
  signOut() {
    return this.endSession(true);
  }
  private async endSession(propagate: boolean) {
    this.blocked = true;
    try {
      if (propagate) this.storage?.setItem(TOMBSTONE, crypto.randomUUID());
    } catch {
      /* Neither port rehydrates persisted sessions. */
    }
    try {
      if (propagate) this.publishSignOut();
    } catch {
      /* Peer channel failure cannot prevent local purge. */
    }
    this.emit(null, "signing-out", true);
    const at = this.snapshot.epoch;
    try {
      await this.enqueue(() => this.port.signOut());
    } finally {
      if (this.snapshot.epoch === at) this.emit(null, "signed-out");
    }
  }
}
