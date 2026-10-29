import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useMe } from "@/api/queries";
import { PageFallback } from "./RouteStates";

/** Sends signed-out visitors to sign in, and new learners to onboarding first. */
export function RequireAuth({ children, allowNotOnboarded = false }: { children: ReactNode; allowNotOnboarded?: boolean }) {
  const me = useMe();
  const location = useLocation();
  if (me.isLoading) return <PageFallback />;
  if (me.isError || !me.data) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  if (!me.data.onboarded && !allowNotOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
