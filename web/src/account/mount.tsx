import { createRoot } from "react-dom/client";
import { AccountProvider } from "./state";
import { AccountApp, Unavailable } from "./App";
import { AccountClient } from "./transport";
import { SessionController } from "@/auth/session";
import type { AuthPort } from "@/auth/types";
import { retirePrototypeWorker } from "@/auth/workerMigration";
import { signoutBus } from "@/auth/signoutBus";
import { applyPrefs } from "@/lib/prefs";
export async function mountAccount(
  factory: () => Promise<AuthPort | null>,
  base = "",
  local = false,
) {
  applyPrefs();
  const root = createRoot(document.getElementById("root")!);
  try {
    const migration = await retirePrototypeWorker();
    if (migration === "reload") return;
    if (migration !== "ready") {
      root.render(<Unavailable worker />);
      return;
    }
    const holder: { session?: SessionController } = {};
    const bus = signoutBus(() => holder.session?.receivePeerSignOut());
    if (!bus.available) {
      bus.close();
      root.render(<Unavailable />);
      return;
    }
    const port = await factory();
    if (!port) {
      bus.close();
      root.render(<Unavailable />);
      return;
    }
    const session = new SessionController(port, bus.storage, bus.publish);
    holder.session = session;
    root.render(
      <AccountProvider
        session={session}
        client={new AccountClient(session, base)}
        local={local}
      >
        <AccountApp />
      </AccountProvider>,
    );
    await session.start();
  } catch {
    root.render(<Unavailable />);
  }
}
