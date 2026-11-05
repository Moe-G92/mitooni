export type Session = { subject: string; token: string };
export interface AuthPort {
  initialize(): Promise<Session | null>;
  subscribe(listener: (session: Session | null) => void): () => void;
  signIn(email: string, password: string): Promise<Session>;
  refresh(): Promise<Session | null>;
  signOut(): Promise<void>;
}
export type SessionSnapshot = {
  session: Session | null;
  epoch: number;
  phase: "initializing" | "signed-out" | "authenticated" | "signing-out";
};
export class AccountChanged extends Error {
  constructor() {
    super("account_changed");
  }
}
