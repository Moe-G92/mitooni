import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ResultsPage from "./ResultsPage";
import ProgressPage from "./ProgressPage";
import VocabularyPage from "./VocabularyPage";
import CoachingPage from "./CoachingPage";
import SaveWord from "./SaveWord";
const state = vi.hoisted(() => ({ data: {} as unknown, mutate: vi.fn(), reload: vi.fn() }));
vi.mock("../hooks", () => ({ useLearnerResource: () => ({ data: state.data, loading: false, error: null, reload: state.reload, client: { mutate: state.mutate } }) }));
vi.mock("../ui", () => ({
  useLearnerLocale: () => ({ locale: "en", text: (_fa: string, en: string) => en }),
  PageTitle: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  Panel: ({ children, title }: { children: ReactNode; title?: string }) => <section>{title && <h2>{title}</h2>}{children}</section>,
  Loading: () => <p>Loading</p>,
  Failure: ({ onRetry }: { onRetry?: () => void }) => <div role="alert">Failed<button onClick={onRetry}>Retry</button></div>,
}));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);
function show(component: ReactNode) { return render(<MemoryRouter>{component}</MemoryRouter>); }
it("shows only deterministic item counts and preserves assisted conditions in result links", () => {
  state.data = { attempts: [{ id: "attempt-1", title: "Reading passage", skill: "reading", submittedAt: "2026-11-07T09:00:00Z", conditions: { assisted: true }, rawCheck: { correctCount: 0, itemCount: 3 }, workspaceId: "workspace-1" }] };
  show(<ResultsPage />);
  expect(screen.getByRole("link", { name: "Reading passage" })).toHaveAttribute("href", "/app/results/attempt-1");
  expect(screen.getByText("0 / 3")).toBeInTheDocument();
  expect(screen.getByText(/Supported/)).toBeInTheDocument();
  expect(screen.queryByText(/band/i)).not.toBeInTheDocument();
});
it("keeps missing skill evidence distinct from zero accuracy", () => {
  state.data = { skills: [{ skill: "reading", submittedCount: 1, supportedCount: 0, independentCount: 1, feedbackCount: 0, itemCount: 2, correctCount: 0 }], recentAttempts: [] };
  show(<ProgressPage />);
  expect(screen.getAllByText("No submitted practice yet")).toHaveLength(3);
  expect(screen.getByText("0 / 2")).toBeInTheDocument();
});
it("preserves a failed vocabulary save and retries the exact revision and operation key", async () => {
  state.data = { revision: 4, available: true, items: [] };
  state.mutate.mockRejectedValueOnce(new Error("connection lost")).mockResolvedValueOnce({ revision: 5, items: [], available: true });
  const user = userEvent.setup();
  show(<VocabularyPage />);
  await user.type(screen.getByLabelText("Word"), "evidence");
  await user.type(screen.getByLabelText("Meaning"), "supporting facts");
  await user.click(screen.getByRole("button", { name: "Save word" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Word")).toHaveValue("evidence");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(state.mutate).toHaveBeenCalledTimes(2));
  expect(state.mutate.mock.calls[0]).toEqual(state.mutate.mock.calls[1]);
  expect(state.mutate.mock.calls[0][1]).toEqual({ word: "evidence", meaning: "supporting facts", example: undefined, expectedRevision: 4 });
  expect(await screen.findByRole("status")).toHaveTextContent("Word saved.");
  expect(state.reload).toHaveBeenCalledOnce();
});
it("does not offer simulated coaching requests when operations are unavailable", () => {
  state.data = { available: false, requests: [] };
  show(<CoachingPage />);
  expect(screen.getByText("Human coaching requests are currently unavailable.")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

const word = { id: "word-1", word: "evidence", meaning: "supporting facts", example: "The evidence supports the claim.", sourceTaskId: null, createdAt: "2026-11-07T09:00:00Z", reviewRevision: 0, dueAt: "2026-11-07T09:00:00Z", lastReviewedAt: null, lastRecall: null, due: true };
function recallData() { return { revision: 1, available: true, serverNow: "2026-11-07T10:00:00Z", items: [word] }; }
it("offers persisted recall only after reveal and uses server due flags", async () => {
  state.data = { ...recallData(), items: [word, { ...word, id: "word-2", word: "tomorrow", due: false, dueAt: "2026-11-08T09:00:00Z" }] };
  const user = userEvent.setup();
  show(<VocabularyPage />);
  expect(screen.getByText("1", { selector: "span" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Review words" }));
  expect(screen.queryByRole("button", { name: "Remembered" })).not.toBeInTheDocument();
  expect(screen.queryByText("tomorrow")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reveal meaning" }));
  expect(screen.getByRole("button", { name: "Again" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remembered" })).toBeInTheDocument();
});
it("keeps failed recall visible and replays the exact operation before accepting a schedule", async () => {
  state.data = recallData();
  state.mutate.mockRejectedValueOnce(new Error("lost response")).mockResolvedValueOnce({ ...recallData(), revision: 2, items: [{ ...word, reviewRevision: 1, due: false, dueAt: "2026-11-08T10:00:00Z", lastReviewedAt: "2026-11-07T10:00:00Z", lastRecall: "known" }] });
  const user = userEvent.setup();
  show(<VocabularyPage />);
  await user.click(screen.getByRole("button", { name: "Review words" }));
  await user.click(screen.getByRole("button", { name: "Reveal meaning" }));
  await user.click(screen.getByRole("button", { name: "Remembered" }));
  await screen.findByRole("alert");
  expect(screen.getByText("supporting facts")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remembered" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Recall saved.");
  expect(state.mutate.mock.calls[0]).toEqual(state.mutate.mock.calls[1]);
  expect(state.mutate.mock.calls[0][0]).toBe("/vocabulary/word-1/reviews");
  expect(state.mutate.mock.calls[0][1]).toEqual({ recall: "known", expectedRevision: 1 });
  expect(screen.getByText("No words are due for review now.")).toBeInTheDocument();
  expect(state.reload).toHaveBeenCalledOnce();
});
it("shows persisted future review after remount without claiming mastery", async () => {
  state.data = { ...recallData(), revision: 2, items: [{ ...word, due: false, lastRecall: "known", reviewRevision: 1, dueAt: "2026-11-08T10:00:00Z", lastReviewedAt: "2026-11-07T10:00:00Z" }] };
  const user = userEvent.setup();
  show(<VocabularyPage />);
  expect(screen.getByText(/Next review/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Review words" }));
  expect(screen.getByText("No words are due for review now.")).toBeInTheDocument();
  expect(screen.queryByText(/master/i)).not.toBeInTheDocument();
  expect(state.mutate).not.toHaveBeenCalled();
});
it("persists again as recall and leaves the word due with its meaning hidden", async () => {
  state.data = recallData();
  state.mutate.mockResolvedValueOnce({ ...recallData(), revision: 2, items: [{ ...word, reviewRevision: 1, lastRecall: "again", lastReviewedAt: "2026-11-07T10:00:00Z" }] });
  const user = userEvent.setup();
  show(<VocabularyPage />);
  await user.click(screen.getByRole("button", { name: "Review words" }));
  await user.click(screen.getByRole("button", { name: "Reveal meaning" }));
  await user.click(screen.getByRole("button", { name: "Again" }));
  await screen.findByText("Recall saved.");
  expect(state.mutate.mock.calls[0][1]).toEqual({ recall: "again", expectedRevision: 1 });
  expect(screen.getByRole("heading", { name: "evidence" })).toBeInTheDocument();
  expect(screen.queryByText("supporting facts")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reveal meaning" })).toBeInTheDocument();
});
it("opens a source-bound save form lazily and preserves the exact failed operation", async () => {
  state.data = recallData();
  state.mutate.mockRejectedValueOnce(new Error("lost response")).mockResolvedValueOnce({ ...recallData(), revision: 2 });
  const user = userEvent.setup();
  show(<SaveWord taskId="reading-task" context="The evidence supports the claim." />);
  expect(screen.queryByLabelText("Word")).not.toBeInTheDocument();
  await user.click(screen.getByText("Save word", { selector: "summary" }));
  const input = await screen.findByLabelText("Word");
  expect(screen.getByLabelText("Example")).toHaveValue("The evidence supports the claim.");
  await user.type(input, "evidence");
  await user.clear(screen.getByLabelText("Example"));
  await user.type(screen.getByLabelText("Example"), "An edited context.");
  await user.click(screen.getByRole("button", { name: "Save word" }));
  await screen.findByRole("alert");
  expect(input).toHaveValue("evidence");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Word saved.");
  expect(state.mutate.mock.calls[0]).toEqual(state.mutate.mock.calls[1]);
  expect(state.mutate.mock.calls[0][1]).toEqual({ word: "evidence", meaning: undefined, example: "An edited context.", sourceTaskId: "reading-task", expectedRevision: 1 });
});
