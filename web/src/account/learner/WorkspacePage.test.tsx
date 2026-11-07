import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, expect, it, vi } from "vitest";
import { setPrefs } from "@/lib/prefs";
import type { Job, Workspace } from "./contracts";
import WorkspacePage from "./WorkspacePage";
const state = vi.hoisted(() => ({ workspace: {} as Workspace, mutate: vi.fn(), read: vi.fn(), reload: vi.fn() }));
const testClient = { mutate: state.mutate, read: state.read };
const testSession = { capture: () => ({ subject: "synthetic", epoch: 1 }), assert: () => {} };
vi.mock("./hooks", () => ({ useLearnerResource: () => ({ data: state.workspace, loading: false, error: null, reload: state.reload }), useLearnerClient: () => ({ client: testClient, epoch: 1, session: testSession }) }));
vi.mock("../TopControls", () => ({ TopControls: () => null }));
vi.mock("./ProductFeedback", () => ({ ProductFeedback: () => null }));
vi.mock("./secondary/SaveWord", () => ({ default: () => null }));
const ref = { catalogHash: "synthetic", taskId: "reading-activity", version: 1, contentHash: "synthetic-hash", policyVersion: 1 };
function workspace(): Workspace {
  return { id: "workspace-a", revision: 1, task: { id: ref.taskId, title: "Reading activity", skill: "reading", examTrack: "academic", kind: "reading_items", sections: [{ id: "part-a", title: "Passage", text: "A synthetic passage.", instructions: "Answer the question.", questions: [{ id: "item-a", prompt: "Your answer", responseType: "short_text", options: [] }] }], assets: [], teachingAnchors: [], objectiveIds: [] }, contentRef: ref, draft: { revision: 1, responses: [] }, attempt: { id: "attempt-a", status: "open", parentAttemptId: null, contentRef: ref, conditions: { original: "supported", current: "supported", revision: 1, assisted: true, exposureEligible: false }, startedAt: "2026-11-07T12:00:00Z", deadlineAt: null, submittedAt: null, responseHash: null, responses: [] }, capabilities: ["draft:write", "attempt:submit", "tutor:use"], latestJobId: null, messages: [], feedback: null, answerReview: null, rawCheck: null, sessionId: null, sectionId: null, planId: "plan-a", stepId: "step-a", serverNow: "2026-11-07T12:00:00Z" };
}
function Location() { return <output aria-label="Current path">{useLocation().pathname}</output>; }
function show() { render(<MemoryRouter initialEntries={["/learn/workspace-a"]}><Routes><Route path="/learn/:workspaceId" element={<><Location /><WorkspacePage /></>} /></Routes></MemoryRouter>); }
beforeEach(() => { setPrefs({ locale: "en" }); vi.clearAllMocks(); state.workspace = workspace(); });
it("keeps edits visible after an uncertain save and replays the exact body/key before submission", async () => {
  const next = workspace(); next.revision = 2; next.draft = { revision: 2, responses: [{ itemId: "item-a", kind: "short_text", value: "response" }] };
  state.mutate.mockRejectedValueOnce(Error("lost ack")).mockResolvedValueOnce(next);
  show(); const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Your answer"), "response");
  expect(screen.getByRole("button", { name: "Submit response" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Save", exact: true }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Your answer")).toHaveValue("response");
  await user.click(screen.getByRole("button", { name: "Retry", exact: true }));
  await waitFor(() => expect(state.mutate).toHaveBeenCalledTimes(2));
  expect(state.mutate.mock.calls[0]).toEqual(state.mutate.mock.calls[1]);
  expect(state.mutate.mock.calls[0][1]).toEqual({ expectedDraftRevision: 1, responses: [{ itemId: "item-a", kind: "short_text", value: "response" }] });
  expect(screen.getByRole("button", { name: "Submit response" })).toBeEnabled();
});
it("renders persisted conversation as inert text and submitted work as readonly", async () => {
  state.workspace.attempt.status = "submitted";
  state.workspace.capabilities = ["attempt:revise"];
  state.workspace.draft.responses = [{ itemId: "item-a", kind: "short_text", value: "submitted" }];
  state.workspace.messages = [{ id: "message-a", jobId: "job-a", requestText: "Explain this", output: { kind: "explanation", text: '<img src=x onerror="alert(1)">', citations: [] }, createdAt: "2026-11-07T12:00:00Z" }];
  show();
  expect(await screen.findByLabelText("Your answer")).toBeDisabled();
  expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeVisible();
  expect(document.querySelector("img")).toBeNull();
  expect(screen.queryByRole("button", { name: "Submit response" })).toBeNull();
});
it("moves focus to immediate canonical marking after submission", async () => {
  const submitted = workspace();
  submitted.attempt.status = "submitted";
  submitted.capabilities = ["attempt:revise"];
  submitted.rawCheck = { actorKind: "deterministic_check", itemCount: 8, correctCount: 6, items: [{ itemId: "item-a", correct: true }] };
  state.mutate.mockResolvedValue(submitted);
  show();
  await userEvent.setup().click(await screen.findByRole("button", { name: "Submit response" }));
  await waitFor(() => expect(document.activeElement?.id).toBe("learner-submission-result"));
  expect(document.getElementById("learner-submission-result")?.parentElement).toHaveTextContent("6 / 8 correct answers");
});
it("shows only server-released keys and source rationale after submission", async () => {
  state.workspace.attempt.status = "submitted";
  state.workspace.capabilities = [];
  state.workspace.answerReview = { actorKind: "authoritative_answer_key", items: [{ itemId: "item-a", acceptedAnswers: ["released-answer"], rationale: "A source explanation." }], answerGroups: [] };
  show();
  expect(await screen.findByText("released-answer")).toBeVisible();
  expect(screen.getByText("A source explanation.")).toBeVisible();
});
it("does not render answer review for an open attempt even if an erroneous response contains it", async () => {
  state.workspace.answerReview = { actorKind: "authoritative_answer_key", items: [{ itemId: "item-a", acceptedAnswers: ["private-answer"], rationale: "private-rationale" }], answerGroups: [] };
  show();
  await screen.findByLabelText("Your answer");
  expect(screen.queryByText("private-answer")).toBeNull();
  expect(screen.queryByText("private-rationale")).toBeNull();
});
it("opens a revision at its new canonical workspace route", async () => {
  state.workspace.attempt.status = "submitted";
  state.workspace.capabilities = ["attempt:revise"];
  const child = workspace(); child.id = "workspace-child"; child.attempt.id = "attempt-child"; child.attempt.parentAttemptId = "attempt-a";
  state.mutate.mockImplementation(async () => { state.workspace = child; return child; });
  show();
  await userEvent.setup().click((await screen.findAllByRole("button", { name: "Revise response" }))[0]);
  await waitFor(() => expect(screen.getByLabelText("Current path")).toHaveTextContent("/learn/workspace-child"));
  expect(state.mutate.mock.calls[0][0]).toBe("/attempts/attempt-a/revisions");
});
it.each(["reading", "listening", "writing", "speaking"] as const)("stops the %s countdown when canonical submission becomes immutable", async (skill) => {
  state.workspace.task.skill = skill;
  state.workspace.attempt.deadlineAt = "2026-11-07T12:30:00Z";
  const submitted = structuredClone(state.workspace);
  submitted.attempt.status = "submitted";
  submitted.capabilities = [];
  state.mutate.mockResolvedValue(submitted);
  show();
  expect(await screen.findByRole("timer")).toBeVisible();
  expect(screen.getByRole("timer")).toHaveAccessibleName("Time remaining");
  await userEvent.setup().click(screen.getByRole("button", { name: "Submit response" }));
  await screen.findByRole("heading", { name: "Response submitted" });
  expect(screen.queryByRole("timer")).toBeNull();
});
function tutorJob(id: string, status: Job["status"], createdAt: string): Job {
  return { id, revision: status === "completed" ? 2 : 1, workspaceId: "workspace-a", attemptId: "attempt-a", intent: "explain", status, output: status === "completed" ? { kind: "explanation", text: `${id} explanation`, checkQuestion: `${id} check question`, citations: [] } : null, error: null, retryAction: null, createdAt };
}
it("polls a second consecutive tutor job despite the stale first-job workspace hint and retains both messages", async () => {
  const first = tutorJob("First", "completed", "2026-11-07T12:00:01Z");
  const second = tutorJob("Second", "running", "2026-11-07T12:00:02Z");
  const completed = { ...second, revision: 2, status: "completed" as const, output: { kind: "question", text: "Second explanation", checkQuestion: "Second check question", citations: [] } };
  const firstMessage = { id: "message-first", jobId: first.id, requestText: "Explain the lesson", output: first.output!, createdAt: first.createdAt };
  state.workspace.latestJobId = first.id;
  state.workspace.messages = [firstMessage];
  state.read.mockImplementation(async (path: string) => path === "/jobs/First" ? first : completed);
  state.mutate.mockResolvedValue(second);
  state.reload.mockImplementation(() => { state.workspace = { ...state.workspace, revision: 3, latestJobId: second.id, feedback: completed.output, messages: [firstMessage, { id: "message-second", jobId: second.id, requestText: "My response", output: completed.output, createdAt: second.createdAt }] }; });
  show(); const user = userEvent.setup();
  await screen.findByText("First check question");
  await user.type(screen.getByLabelText("Your response"), "My response");
  await user.click(screen.getByRole("button", { name: "Send response" }));
  expect(await screen.findByText("Second check question", {}, { timeout: 3000 })).toBeVisible();
  expect(screen.getByText("First explanation")).toBeVisible();
  expect(screen.getByText("Second explanation")).toBeVisible();
  expect(state.read.mock.calls.filter(([path]) => path === "/jobs/First")).toHaveLength(1);
  expect(state.read.mock.calls.some(([path]) => path === "/jobs/Second")).toBe(true);
  expect(state.mutate).toHaveBeenCalledOnce();
});
it("discards an old recovery read that resolves after a new local tutor job was accepted", async () => {
  const first = tutorJob("Old", "completed", "2026-11-07T12:00:01Z");
  const second = tutorJob("Current", "running", "2026-11-07T12:00:02Z");
  const completed = { ...second, revision: 2, status: "completed" as const, output: { kind: "question", text: "Current explanation", checkQuestion: "Current check question", citations: [] } };
  let restore!: (value: Job) => void;
  const late = new Promise<Job>((resolve) => { restore = resolve; });
  state.workspace.latestJobId = first.id;
  state.read.mockImplementation((path: string) => path === "/jobs/Old" ? late : Promise.resolve(completed));
  state.mutate.mockResolvedValue(second);
  state.reload.mockImplementation(() => {});
  show();
  await userEvent.setup().click(await screen.findByRole("button", { name: "Explain lesson" }));
  await waitFor(() => expect(state.mutate).toHaveBeenCalledOnce());
  restore(first);
  expect(await screen.findByText("Current check question", {}, { timeout: 3000 })).toBeVisible();
  expect(screen.queryByText("Old check question")).toBeNull();
  expect(state.read.mock.calls.filter(([path]) => path === "/jobs/Old")).toHaveLength(1);
});
