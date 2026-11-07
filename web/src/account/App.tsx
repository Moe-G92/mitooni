import { lazy, Suspense, useSyncExternalStore, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { AuthShell, titleClass } from "./AuthShell";
import { ProgressPanel } from "./AuthPanel";
import { useAccount } from "./state";
import { useWords } from "./locale";
import { Button } from "./Button";
import Auth from "./Auth";
import { Boundary } from "./Boundary";
import { ErrorNotice } from "./ErrorNotice";
const AppLayout = lazy(() =>
  import("./AppLayout").then((module) => ({ default: module.AppLayout })),
);
const Onboarding = lazy(() => import("./Onboarding"));
const Settings = lazy(() => import("./Settings"));
const Capability = lazy(() => import("./Capability"));
const ContentReview = lazy(() => import("./review/ReviewApp"));
const StudyHome = lazy(() => import("./study/StudyHome"));
const StudyWorkspace = lazy(() => import("./study/StudyWorkspace"));

function PrivatePage({
  children,
  standalone = false,
}: {
  children: ReactNode;
  standalone?: boolean;
}) {
  const w = useWords();
  const loading = <h1>{w.saving}</h1>;
  return (
    <Suspense
      fallback={
        standalone ? (
          <Status>{loading}</Status>
        ) : (
          <div role="status">{loading}</div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

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
  const location = useLocation();
  const { session, account, loading, error, reload } = useAccount();
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const w = useWords();
  if (snapshot.phase === "initializing")
    return (
      <Status>
        <h1>{w.saving}</h1>
      </Status>
    );
  if (!snapshot.session)
    return (
      <Navigate
        to={`/sign-in?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
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
  if (loading || !account)
    return (
      <Status>
        <h1>{w.saving}</h1>
      </Status>
    );
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
function AccountSettings() {
  const { epoch } = useAccount();
  return (
    <PrivatePage>
      <Settings key={epoch} />
    </PrivatePage>
  );
}
export function AccountApp() {
  const { local, epoch } = useAccount();
  const w = useWords();
  return (
    <BrowserRouter>
      {local && (
        <aside
          aria-labelledby="local-preview-note"
          className="border-b border-border bg-pink-tint px-4 py-2 text-center text-xs"
        >
          <div id="local-preview-note" role="note">
            {w.local}
          </div>
        </aside>
      )}
      <Boundary resetKey={epoch}>
        <Routes>
          <Route path="/" element={<Navigate to="/sign-in" replace />} />
          <Route path="/sign-in" element={<Auth />} />
          <Route
            path="/app/content-review/:targetId?"
            element={
              <PrivatePage standalone>
                <ContentReview key={epoch} />
              </PrivatePage>
            }
          />
          <Route element={<Gate setup />}>
            <Route
              path="/onboarding"
              element={
                <PrivatePage standalone>
                  <Onboarding key={epoch} />
                </PrivatePage>
              }
            />
          </Route>
          <Route element={<Gate />}>
            <Route
              path="/app"
              element={
                <PrivatePage standalone>
                  <AppLayout />
                </PrivatePage>
              }
            >
              <Route
                index
                element={
                  <PrivatePage>
                    <StudyHome key={epoch} />
                  </PrivatePage>
                }
              />
              <Route path="settings" element={<AccountSettings />} />
              <Route
                path="practice"
                element={
                  <PrivatePage>
                    <StudyHome key={epoch} catalog />
                  </PrivatePage>
                }
              />
              <Route
                path="mocks"
                element={
                  <PrivatePage>
                    <Capability />
                  </PrivatePage>
                }
              />
              <Route
                path="results"
                element={
                  <PrivatePage>
                    <Capability />
                  </PrivatePage>
                }
              />
              <Route
                path="progress"
                element={
                  <PrivatePage>
                    <Capability />
                  </PrivatePage>
                }
              />
              <Route
                path="vocabulary"
                element={
                  <PrivatePage>
                    <Capability />
                  </PrivatePage>
                }
              />
              <Route
                path="coach"
                element={
                  <PrivatePage>
                    <Capability />
                  </PrivatePage>
                }
              />
            </Route>
            <Route
              path="/study/:workspaceId"
              element={
                <PrivatePage standalone>
                  <StudyWorkspace key={epoch} />
                </PrivatePage>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </Boundary>
    </BrowserRouter>
  );
}
