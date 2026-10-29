import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  Attempt,
  CheckResult,
  CoachReview,
  CoachState,
  Dashboard,
  Notification,
  PracticeCatalog,
  Profile,
  Progress,
  Result,
  ResultSummary,
  SectionPatch,
  Slot,
  Test,
  TestSummary,
  VocabCard,
  VocabSummary,
} from "./schemas";

/* Query keys in one place so mutations can invalidate precisely. */
export const keys = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  progress: ["progress"] as const,
  practice: ["practice"] as const,
  tests: (kind?: string) => ["tests", kind ?? "all"] as const,
  test: (id: string) => ["test", id] as const,
  attempts: (status?: string) => ["attempts", status ?? "all"] as const,
  attempt: (id: string) => ["attempt", id] as const,
  results: ["results"] as const,
  result: (id: string) => ["result", id] as const,
  vocab: ["vocab"] as const,
  vocabDue: ["vocab", "due"] as const,
  vocabSummary: ["vocab", "summary"] as const,
  coach: ["coach"] as const,
  notifications: ["notifications"] as const,
};

/* ---------------- learner ---------------- */

export const useMe = () => useQuery({ queryKey: keys.me, queryFn: () => api.get<Profile>("/me"), retry: false });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => api.patch<Profile>("/me", patch),
    onSuccess: (p) => {
      qc.setQueryData(keys.me, p);
      void qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useAuth() {
  const qc = useQueryClient();
  const done = (p: Profile) => {
    qc.clear();
    qc.setQueryData(keys.me, p);
  };
  return {
    signIn: useMutation({
      mutationFn: (b: { email: string; password: string; keep?: boolean }) => api.post<Profile>("/auth/sign-in", b),
      onSuccess: done,
    }),
    signUp: useMutation({
      mutationFn: (b: { name: string; email: string; password: string }) => api.post<Profile>("/auth/sign-up", b),
      onSuccess: done,
    }),
    signOut: useMutation({ mutationFn: () => api.post("/auth/sign-out"), onSuccess: () => qc.clear() }),
    forgot: useMutation({ mutationFn: (b: { email: string }) => api.post("/auth/forgot", b) }),
    /** Identifier-first: does an account use this email or number? */
    lookup: useMutation({
      mutationFn: (b: { email?: string; phone?: string }) => api.post<{ exists: boolean; name: string | null }>("/auth/lookup", b),
    }),
    otpSend: useMutation({ mutationFn: (b: { phone: string }) => api.post<{ ok: boolean; exists: boolean }>("/auth/otp/send", b) }),
    otpVerify: useMutation({
      mutationFn: (b: { phone: string; code: string; name?: string }) => api.post<Profile | { needsName: true }>("/auth/otp/verify", b),
      onSuccess: (r) => {
        if ("id" in r) done(r);
      },
    }),
    google: useMutation({ mutationFn: () => api.post<Profile>("/auth/google"), onSuccess: done }),
  };
}

export const useDashboard = () => useQuery({ queryKey: keys.dashboard, queryFn: () => api.get<Dashboard>("/dashboard") });
export const useProgress = () => useQuery({ queryKey: keys.progress, queryFn: () => api.get<Progress>("/progress") });
export const usePractice = () => useQuery({ queryKey: keys.practice, queryFn: () => api.get<PracticeCatalog>("/practice") });

/* ---------------- tests and attempts ---------------- */

export const useTests = (kind?: "full" | "section" | "practice") =>
  useQuery({ queryKey: keys.tests(kind), queryFn: () => api.get<TestSummary[]>(`/tests${kind ? `?kind=${kind}` : ""}`) });

export const useTest = (id: string | undefined) =>
  useQuery({ queryKey: keys.test(id ?? ""), queryFn: () => api.get<Test>(`/tests/${id}`), enabled: !!id, staleTime: Infinity });

export const useAttempts = (status?: "in-progress" | "submitted") =>
  useQuery({ queryKey: keys.attempts(status), queryFn: () => api.get<Attempt[]>(`/attempts${status ? `?status=${status}` : ""}`) });

export const useAttempt = (id: string | undefined) =>
  useQuery({ queryKey: keys.attempt(id ?? ""), queryFn: () => api.get<Attempt>(`/attempts/${id}`), enabled: !!id });

export function useCreateAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { testId: string; mode: Attempt["mode"] }) => api.post<Attempt>("/attempts", b),
    onSuccess: (a) => {
      qc.setQueryData(keys.attempt(a.id), a);
      void qc.invalidateQueries({ queryKey: ["attempts"] });
    },
  });
}

export function useDiscardAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/attempts/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["attempts"] }),
  });
}

export const saveSectionState = (attemptId: string, patch: SectionPatch) =>
  api.patch<{ ok: true; savedAt: string }>(`/attempts/${attemptId}/state`, patch);

export const checkAnswer = (attemptId: string, itemId: string, value: string | string[]) =>
  api.post<CheckResult>(`/attempts/${attemptId}/check`, { itemId, value });

export function useSubmitSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptId, sectionId }: { attemptId: string; sectionId: string }) =>
      api.post<{ attempt: Attempt; resultReady: boolean }>(`/attempts/${attemptId}/sections/${sectionId}/submit`),
    onSuccess: ({ attempt, resultReady }) => {
      // When the whole attempt is done, the caller navigates to the result itself;
      // updating the cached attempt first would make the exam page redirect without
      // the "just submitted" flag.
      if (!resultReady) qc.setQueryData(keys.attempt(attempt.id), attempt);
      if (resultReady) {
        for (const k of [keys.results, keys.dashboard, keys.progress, keys.practice, keys.notifications, ["attempts"]])
          void qc.invalidateQueries({ queryKey: k });
      }
    },
  });
}

export function uploadRecording(attemptId: string, partId: string, blob: Blob, durationSec: number) {
  const form = new FormData();
  form.append("audio", blob, `${partId}.webm`);
  form.append("durationSec", String(durationSec));
  return api.post<{ key: string; durationSec: number }>(`/attempts/${attemptId}/speaking/${partId}/recording`, form);
}

export const fetchRecording = (key: string) => api.blob(`/recordings/${key}`);

/* ---------------- results ---------------- */

export const useResults = () => useQuery({ queryKey: keys.results, queryFn: () => api.get<ResultSummary[]>("/results") });
export const useResult = (id: string | undefined) =>
  useQuery({ queryKey: keys.result(id ?? ""), queryFn: () => api.get<Result>(`/results/${id}`), enabled: !!id });

/* ---------------- vocabulary ---------------- */

export const useVocab = () => useQuery({ queryKey: keys.vocab, queryFn: () => api.get<VocabCard[]>("/vocab") });
export const useVocabDue = () => useQuery({ queryKey: keys.vocabDue, queryFn: () => api.get<VocabCard[]>("/vocab/due") });
export const useVocabSummary = () => useQuery({ queryKey: keys.vocabSummary, queryFn: () => api.get<VocabSummary>("/vocab/summary") });

export function useVocabMutations() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: ["vocab"] });
  return {
    review: useMutation({
      mutationFn: (b: { id: string; grade: "again" | "good" }) => api.post<VocabCard>(`/vocab/${b.id}/review`, { grade: b.grade }),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.vocabSummary }),
    }),
    add: useMutation({
      mutationFn: (b: Pick<VocabCard, "term" | "partOfSpeech" | "meaning" | "example">) => api.post<VocabCard>("/vocab", b),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.delete(`/vocab/${id}`), onSuccess: refresh }),
  };
}

/* ---------------- coach ---------------- */

export const useCoach = () => useQuery({ queryKey: keys.coach, queryFn: () => api.get<CoachState>("/coach") });

export function useCoachMutations() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: keys.coach });
  return {
    book: useMutation({ mutationFn: (slotId: string) => api.post<Slot>("/coach/bookings", { slotId }), onSuccess: refresh }),
    cancel: useMutation({ mutationFn: (slotId: string) => api.delete(`/coach/bookings/${slotId}`), onSuccess: refresh }),
    request: useMutation({
      mutationFn: (b: { kind: CoachReview["kind"]; title: string; attemptId: string | null; message: string }) =>
        api.post<CoachReview>("/coach/reviews", b),
      onSuccess: refresh,
    }),
    message: useMutation({
      mutationFn: (b: { id: string; text: string }) => api.post<CoachReview>(`/coach/reviews/${b.id}/messages`, { text: b.text }),
      onSuccess: refresh,
    }),
  };
}

/* ---------------- notifications ---------------- */

export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications, queryFn: () => api.get<Notification[]>("/notifications") });

export function useNotificationMutations() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: keys.notifications });
  return {
    readAll: useMutation({ mutationFn: () => api.post("/notifications/read-all"), onSuccess: refresh }),
    read: useMutation({ mutationFn: (id: string) => api.post(`/notifications/${id}/read`), onSuccess: refresh }),
  };
}

export function useResetDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: "demo" | "empty") => api.post("/dev/reset", { mode }),
    onSuccess: () => void qc.invalidateQueries(),
  });
}
