import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { RequireAuth } from "@/app/RequireAuth";
import { PageFallback, RouteError } from "@/app/RouteStates";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

const page = (load: () => Promise<{ default: React.ComponentType }>) => {
  const C = lazy(load);
  return (
    <Suspense fallback={<PageFallback />}>
      <C />
    </Suspense>
  );
};

const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: "/", element: page(() => import("@/pages/public/Landing")) },
          { path: "/how-it-works", element: page(() => import("@/pages/public/HowItWorks")) },
          { path: "/coaching", element: page(() => import("@/pages/public/Coaching")) },
        ],
      },
      // One identifier-first page for new and returning learners; it has its own two-column layout.
      { path: "/sign-in", element: page(() => import("@/pages/public/Auth")) },
      { path: "/sign-up", element: page(() => import("@/pages/public/Auth")) },
      { path: "/forgot-password", element: page(() => import("@/pages/public/ForgotPassword")) },
      {
        path: "/onboarding",
        element: <RequireAuth allowNotOnboarded>{page(() => import("@/pages/app/Onboarding"))}</RequireAuth>,
      },
      {
        path: "/app",
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: page(() => import("@/pages/app/Overview")) },
          { path: "practice", element: page(() => import("@/pages/app/Practice")) },
          { path: "mocks", element: page(() => import("@/pages/app/Mocks")) },
          { path: "results", element: page(() => import("@/pages/app/Results")) },
          { path: "results/:attemptId", element: page(() => import("@/pages/app/ResultDetail")) },
          { path: "results/:attemptId/writing/:partId", element: page(() => import("@/pages/app/WritingFeedbackPage")) },
          { path: "results/:attemptId/speaking", element: page(() => import("@/pages/app/SpeakingFeedbackPage")) },
          { path: "progress", element: page(() => import("@/pages/app/ProgressPage")) },
          { path: "vocabulary", element: page(() => import("@/pages/app/Vocabulary")) },
          { path: "vocabulary/review", element: page(() => import("@/pages/app/VocabularyReview")) },
          { path: "coach", element: page(() => import("@/pages/app/Coach")) },
          { path: "settings", element: page(() => import("@/pages/app/Settings")) },
        ],
      },
      {
        path: "/exam/new/:testId",
        element: <RequireAuth>{page(() => import("@/pages/exam/NewAttempt"))}</RequireAuth>,
      },
      {
        path: "/exam/:attemptId",
        element: <RequireAuth>{page(() => import("@/pages/exam/ExamPage"))}</RequireAuth>,
      },
      { path: "/dashboard", element: <Navigate to="/app" replace /> },
      { path: "*", element: page(() => import("@/pages/NotFound")) },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
