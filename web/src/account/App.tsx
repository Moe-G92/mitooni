import { useSyncExternalStore, type ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { AuthShell, titleClass } from "./AuthShell";
import { ProgressPanel } from "./AuthPanel";
import { AppLayout } from "./AppLayout";
import { useAccount } from "./state";
import { useWords } from "./locale";
import { Button } from "./Button";
import { PageHeader } from "./PageHeader";
import Auth from "./Auth";
import Onboarding from "./Onboarding";
import Settings from "./Settings";
import { Boundary } from "./Boundary";
import { ErrorNotice } from "./ErrorNotice";
export function Unavailable({ worker = false }: { worker?: boolean }) {
  const w = useWords();
  return (
    <BrowserRouter>
      <AuthShell panel={<ProgressPanel variant="identify" />}>
        <h1 className={titleClass}>{worker ? w.worker : w.unavailable}</h1>
      </AuthShell>
    </BrowserRouter>
  );
}
function Gate({ setup = false }: { setup?: boolean }) {
  const { session, account, loading, error, reload } = useAccount();
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const w = useWords();
  if (snapshot.phase === "initializing") return <Status>{w.saving}</Status>;
  if (!snapshot.session) return <Navigate to="/sign-in" replace />;
  if (error)
    return (
      <Status>
        <h1 className="text-xl font-semibold">{w.outage}</h1>
        <ErrorNotice error={error} />
        <Button onClick={reload}>{w.retry}</Button>
        <Button
          variant="ghost"
          onClick={() => {
            void session.signOut().catch(() => {});
          }}
        >
          {w.logout}
        </Button>
      </Status>
    );
  if (loading || !account) return <Status>{w.saving}</Status>;
  if (account.state === "access-required")
    return (
      <Status>
        <h1 className="text-xl font-semibold">{w.access}</h1>
        <Button
          className="mt-4"
          onClick={() => {
            void session.signOut().catch(() => {});
          }}
        >
          {w.logout}
        </Button>
      </Status>
    );
  if (
    account.state === "setup-required" &&
    !account.membership.entitlements.includes("profile:write")
  )
    return (
      <Status>
        <h1 className="text-xl font-semibold">{w.permission}</h1>
        <Button
          className="mt-4"
          onClick={() => {
            void session.signOut().catch(() => {});
          }}
        >
          {w.logout}
        </Button>
      </Status>
    );
  if (account.state === "setup-required" && !setup)
    return <Navigate to="/onboarding" replace />;
  if (account.state === "ready" && setup)
    return <Navigate to="/app/settings" replace />;
  return <Outlet />;
}
function Status({ children }: { children: ReactNode }) {
  return (
    <AuthShell panel={<ProgressPanel variant="identify" />}>
      <div role="status">{children}</div>
    </AuthShell>
  );
}
function PendingCapability() {
  const w = useWords();
  return <PageHeader title={w.unconnected} />;
}
function AccountSettings() {
  const { epoch } = useAccount();
  return <Settings key={epoch} />;
}
export function AccountApp() {
  const { local, epoch } = useAccount();
  const w = useWords();
  return (
    <BrowserRouter>
      {local && (
        <div
          role="note"
          className="border-b border-border bg-pink-tint px-4 py-2 text-center text-xs"
        >
          {w.local}
        </div>
      )}
      <Boundary resetKey={epoch}>
        <Routes>
          <Route path="/" element={<Navigate to="/sign-in" replace />} />
          <Route path="/sign-in" element={<Auth />} />
          <Route element={<Gate setup />}>
            <Route path="/onboarding" element={<Onboarding key={epoch} />} />
          </Route>
          <Route element={<Gate />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<PendingCapability />} />
              <Route path="settings" element={<AccountSettings />} />
              <Route path="practice" element={<PendingCapability />} />
              <Route path="mocks" element={<PendingCapability />} />
              <Route path="results" element={<PendingCapability />} />
              <Route path="progress" element={<PendingCapability />} />
              <Route path="vocabulary" element={<PendingCapability />} />
              <Route path="coach" element={<PendingCapability />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </Boundary>
    </BrowserRouter>
  );
}
