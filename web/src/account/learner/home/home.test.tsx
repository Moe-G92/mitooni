import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PlanPage from "./PlanPage";
import { useOperation } from "./useOperation";
import PracticePage from "./PracticePage";
import { TodayBoard } from "./TodayBoard";
import HomePage from "./HomePage";
import MocksPage from "./MocksPage";
import SessionPage from "./SessionPage";
import { StepList } from "./shared";
import type { Bootstrap, Plan } from "../contracts";
import { privateSafeListeningWorkspace } from "../testSupport";
import { LearnerClient } from "../client";
import type { GuardedTransport } from "../../request";
const state = vi.hoisted(() => ({ data: {} as unknown, mutate: vi.fn(), reload: vi.fn() }));
vi.mock("../hooks", () => ({ useLearnerResource: () => ({ data: state.data, loading: false, error: null, reload: state.reload }), useLearnerClient: () => ({ client: { mutate: state.mutate } }) }));
vi.mock("../../state", () => ({ useAccount: () => ({ account: { profile: { weeklyHours: 6, testDate: null, currentLevel: null, targets: { overall: 7, listening: 7, reading: 7, writing: 6.5, speaking: 7 } } } }) }));
vi.mock("../ui", () => ({
  useLearnerLocale: () => ({ locale: "en", text: (_fa: string, en: string) => en }),
  PageTitle: ({ children, action }: { children: ReactNode; action?: ReactNode }) => <><h1>{children}</h1>{action}</>,
  Panel: ({ children, title }: { children: ReactNode; title?: string }) => <section>{title && <h2>{title}</h2>}{children}</section>,
  Loading: () => <p>Loading</p>, Failure: ({ onRetry }: { onRetry?: () => void }) => <div role="alert">Failed<button onClick={onRetry}>Retry</button></div>,
}));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);
function show(component: ReactNode) { return render(<MemoryRouter initialEntries={["/app/sessions/session-1"]}><Routes><Route path="/app/sessions/:sessionId" element={component} /><Route path="/app/plan" element={<p>Plan opened</p>} /><Route path="/learn/:workspaceId" element={<p>Workspace opened</p>} /></Routes></MemoryRouter>); }
it("navigates a committed Listening resolve through the real nullable projection decoder", async () => {
  state.data = { id: "session-one", kind: "baseline", status: "running", sections: [{ id: "section-one", title: "Listening practice", skill: "listening", status: "running", durationSeconds: 600 }] };
  const projection = privateSafeListeningWorkspace();
  const http = { session: { capture: () => ({}), assert: () => {} }, request: vi.fn(async () => projection) } as unknown as GuardedTransport;
  const client = new LearnerClient(http);
  state.mutate.mockImplementation((path, body, key, method) => client.mutate(path, body, key, method));
  show(<SessionPage />);
  const user = userEvent.setup();
  await user.click(screen.getByLabelText("I can hear the sound clearly"));
  await user.click(screen.getByLabelText("I am ready to resume; the timer has continued."));
  await user.click(screen.getByRole("button", { name: "Resume section" }));
  expect(await screen.findByText("Workspace opened")).toBeVisible();
  expect(http.request).toHaveBeenCalledOnce();
  expect(state.mutate.mock.calls[0][1]).toEqual({ sessionId: "session-one", sectionId: "section-one", conditionPreset: "independent" });
});
it("opens the canonical preparation editor from Settings and saves only learner preferences", async () => {
  state.data = { preferencesRevision: 2, evidenceRevision: 0, activePlan: null, resumableSession: null, preferences: { revision: 2, examTrack: "academic", weeklyHours: 4, testDate: null, selfReportedLevel: null, targets: { overall: 7, listening: 7, reading: 7, writing: 7, speaking: 7 } } };
  state.mutate.mockResolvedValue({ revision: 3 });
  render(<MemoryRouter initialEntries={["/app?prepare=1"]}><Routes><Route path="/app" element={<HomePage />} /></Routes></MemoryRouter>);
  const user = userEvent.setup();
  const hours = screen.getByLabelText("Weekly study hours");
  await user.clear(hours); await user.type(hours, "2");
  await user.click(screen.getByRole("button", { name: "Save and continue" }));
  await waitFor(() => expect(state.mutate).toHaveBeenCalledOnce());
  expect(state.mutate.mock.calls[0][0]).toBe("/preferences");
  expect(state.mutate.mock.calls[0][1]).toMatchObject({ expectedRevision: 2, weeklyHours: 2, targets: { overall: 7 } });
});
it("saves track and account targets with revision zero and retries the same exact operation", async () => {
  state.data = { preferences: null, preferencesRevision: 0, evidenceRevision: 0, activePlan: null, resumableSession: null };
  state.mutate.mockRejectedValueOnce(new Error("lost acknowledgement")).mockResolvedValueOnce({ revision: 1 });
  show(<HomePage />); const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("Test track"), "general_training");
  await user.click(screen.getByRole("button", { name: "Save and continue" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("button", { name: "Save and continue" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(state.mutate).toHaveBeenCalledTimes(2));
  expect(state.mutate.mock.calls[0]).toEqual(state.mutate.mock.calls[1]);
  expect(state.mutate.mock.calls[0][1]).toMatchObject({ expectedRevision: 0, examTrack: "general_training", weeklyHours: 6, targets: { writing: 6.5 }, selfReportedLevel: null, locale: "en" });
  expect(state.reload).toHaveBeenCalledOnce();
});
it("opens the real in-progress step before other available work", async () => {
  const step = { kind: "practice", skill: "reading", estimatedMinutes: 15, taskId: "task", objectiveIds: [], reasonEvidenceIds: [] };
  const plan = { id: "plan-1", version: 3, steps: [{ ...step, id: "new", title: "New work", state: "available" }, { ...step, id: "active", title: "Saved work", state: "in_progress" }] } as Plan;
  state.mutate.mockResolvedValue({ id: "workspace-1" });
  show(<StepList plan={plan} firstOnly />);
  expect(screen.queryByText("New work")).not.toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: "Resume" }));
  await screen.findByText("Workspace opened");
  expect(state.mutate.mock.calls[0][1]).toEqual({ planId: "plan-1", planVersion: 3, stepId: "active", conditionPreset: "supported" });
});
it("requires sound acknowledgement and explicit readiness before starting a listening section", async () => {
  state.data = { id: "session-1", kind: "mock", status: "ready", sections: [{ id: "listen", title: "Listening test", skill: "listening", status: "ready", durationSeconds: 1800 }, { id: "read", skill: "reading", status: "locked", durationSeconds: 3600 }] };
  state.mutate.mockResolvedValue({ id: "workspace-1" });
  show(<SessionPage />); const user = userEvent.setup();
  const start = screen.getByRole("button", { name: "Start section" });
  expect(start).toBeDisabled();
  await user.click(screen.getByLabelText("I am ready; opening the section starts its timer."));
  expect(start).toBeDisabled();
  await user.click(screen.getByLabelText("I can hear the sound clearly"));
  await user.click(start);
  await screen.findByText("Workspace opened");
  expect(state.mutate.mock.calls[0][1]).toEqual({ sessionId: "session-1", sectionId: "listen", conditionPreset: "independent" });
});
it("describes incomplete mock coverage and cannot create unavailable instruments", () => {
  state.data = { mocks: [{ id: "academic", version: 1, title: "Academic practice", examTrack: "academic", skills: ["reading"], durationSeconds: 900, available: false }] };
  show(<MocksPage />);
  expect(screen.getByText("This test does not cover all four skills.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Prepare test" })).toBeDisabled();
  expect(state.mutate).not.toHaveBeenCalled();
});

it("blocks changed payload dispatch while an uncertain operation awaits exact retry", async () => {
  state.mutate.mockRejectedValueOnce(new Error("lost acknowledgement")).mockResolvedValueOnce({ revision: 2 });
  function Harness() {
    const op = useOperation();
    return <><button onClick={() => void op.run("/preferences", { weeklyHours: 4 }, () => {})}>Save original</button><button onClick={() => void op.run("/preferences", { weeklyHours: 12 }, () => {})}>Save edited</button><button onClick={() => void op.retry()}>Replay original</button>{op.error ? <p role="alert">Uncertain</p> : null}</>;
  }
  show(<Harness />); const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Save original" }));
  await screen.findByRole("alert");
  await user.click(screen.getByRole("button", { name: "Save edited" }));
  expect(state.mutate).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Replay original" }));
  await waitFor(() => expect(state.mutate).toHaveBeenCalledTimes(2));
  expect(state.mutate.mock.calls[0]).toEqual(state.mutate.mock.calls[1]);
  expect(state.mutate.mock.calls[1][1]).toEqual({ weeklyHours: 4 });
});
it("groups server scheduled dates without assigning dates to unscheduled work", () => {
  const base = { kind: "practice", skill: "reading", estimatedMinutes: 15, taskId: "task", objectiveIds: [], reasonEvidenceIds: [], state: "locked" };
  state.data = { activePlan: { id: "p", version: 1, weeklyCapacityMinutes: 60, steps: [{ ...base, id: "one", title: "Monday work", scheduled: true, scheduledDate: "2026-11-09" }, { ...base, id: "two", title: "Later work", scheduled: false, scheduledDate: null }] } };
  show(<PlanPage />);
  expect(screen.getByRole("heading", { name: "Monday 9 Nov" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Unscheduled" })).toBeInTheDocument();
  expect(screen.getByText("Monday work")).toBeInTheDocument();
  expect(screen.getByText("Later work")).toBeInTheDocument();
});
it("opens editable preferences from their persisted values rather than profile defaults", async () => {
  state.data = { preferencesRevision: 5, preferences: { revision: 5, examTrack: "general_training", weeklyHours: 12, testDate: null, selfReportedLevel: null, targets: { overall: 8, listening: 8, reading: 8, writing: 8, speaking: 8 } }, activePlan: null };
  show(<HomePage />); const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Preparation settings" }));
  expect(screen.getByLabelText("Test track")).toHaveValue("general_training");
  expect(screen.getByLabelText("Weekly study hours")).toHaveValue(12);
  expect(screen.getByLabelText("Overall")).toHaveValue(8);
  expect(screen.getByLabelText("Self-reported current band")).toHaveValue("");
});
it("keeps first setup to track and self-report while reusing existing account goals and time", () => {
  state.data = { preferences: null, preferencesRevision: 0 };
  show(<HomePage />);
  expect(screen.getByLabelText("Test track")).toBeInTheDocument();
  expect(screen.getByLabelText("Self-reported current band")).toBeInTheDocument();
  expect(screen.queryByLabelText("Weekly study hours")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Overall")).not.toBeInTheDocument();
});
it("resolves transfer practice in independent conditions", async () => {
  const plan = { id: "plan-1", version: 4, steps: [{ id: "transfer", title: "New application", kind: "transfer", skill: "writing", estimatedMinutes: 20, state: "available" }] } as Plan;
  state.mutate.mockResolvedValue({ id: "workspace-2" });
  show(<StepList plan={plan} firstOnly />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Start" }));
  await screen.findByText("Workspace opened");
  expect(state.mutate.mock.calls[0][1]).toEqual({ planId: "plan-1", planVersion: 4, stepId: "transfer", conditionPreset: "independent" });
});
it("allows an explicit WAV upload alternative without claiming microphone access", async () => {
  state.data = { id: "session-1", kind: "mock", sections: [{ id: "speak", title: "Speaking test", skill: "speaking", status: "ready", durationSeconds: 900 }] };
  state.mutate.mockResolvedValue({ id: "workspace-3" });
  show(<SessionPage />); const user = userEvent.setup();
  await user.click(screen.getByLabelText("I am ready; opening the section starts its timer."));
  expect(screen.getByRole("button", { name: "Start section" })).toBeDisabled();
  await user.click(screen.getByLabelText("I will upload a recorded WAV file in the test section"));
  await user.click(screen.getByRole("button", { name: "Start section" }));
  await screen.findByText("Workspace opened");
  expect(screen.queryByText("Microphone ready")).not.toBeInTheDocument();
});
it("creates a direct practice plan without requiring baseline work", async () => {
  state.data = { preferences: { revision: 3 }, preferencesRevision: 3, evidenceRevision: 0, activePlan: null, resumableSession: null };
  state.mutate.mockResolvedValue({ id: "practice-plan" });
  show(<PracticePage />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Create practice plan" }));
  await waitFor(() => expect(state.reload).toHaveBeenCalledOnce());
  expect(state.mutate.mock.calls[0][0]).toBe("/plans");
  expect(state.mutate.mock.calls[0][1]).toEqual({ expectedPreferencesRevision: 3, expectedEvidenceRevision: 0 });
});
it("does not claim missing activities or show submitted-work promotion before any plan or submissions", () => {
  const preferences = { revision: 1, examTrack: "academic", targets: { overall: 7, listening: 7, reading: 7, writing: 7, speaking: 7 }, testDate: null };
  state.data = { preferences, preferencesRevision: 1, evidenceRevision: 0, activePlan: null, resumableSession: null, skills: [] };
  show(<TodayBoard data={state.data as Bootstrap} />);
  expect(screen.queryByText("No ready activity")).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Submitted work" })).not.toBeInTheDocument();
  expect(screen.getAllByText("No submitted practice yet")).toHaveLength(4);
});
function configuredHome(): Bootstrap {
  return { preferencesRevision: 3, evidenceRevision: 4, activePlan: null, resumableSession: null, providerAvailable: false, capabilities: ["learner:use"], preferences: { revision: 3, examTrack: "academic", weeklyHours: 3, testDate: null, targets: { overall: 7, reading: 7, listening: 7, writing: 7, speaking: 7 }, selfReportedLevel: null, locale: "en" } };
}
it("makes plan creation the primary next action after submitted starting practice without starting another baseline", async () => {
  const data = configuredHome();
  state.data = { skills: ["reading", "listening", "writing", "speaking"].map((skill) => ({ skill, submittedCount: 1, itemCount: 0, correctCount: 0, feedbackCount: 0 })) };
  state.mutate.mockResolvedValue({ id: "new-plan" });
  show(<TodayBoard data={data} />);
  const hero = within(screen.getByRole("region", { name: "Next activity" }));
  expect(hero.getByRole("heading", { name: "Create your learning plan" })).toBeVisible();
  await userEvent.setup().click(hero.getByRole("button", { name: "Create plan" }));
  expect(await screen.findByText("Plan opened")).toBeVisible();
  expect(state.mutate).toHaveBeenCalledOnce();
  expect(state.mutate.mock.calls[0][0]).toBe("/plans");
  expect(state.mutate.mock.calls[0][1]).toEqual({ expectedPreferencesRevision: 3, expectedEvidenceRevision: 4 });
});
it("keeps the first baseline primary when no submitted evidence exists", async () => {
  state.data = { skills: [] };
  state.mutate.mockResolvedValue({ id: "session-1" });
  show(<TodayBoard data={configuredHome()} />);
  const hero = within(screen.getByRole("region", { name: "Next activity" }));
  expect(hero.getByRole("heading", { name: "Starting practice" })).toBeVisible();
  await userEvent.setup().click(hero.getByRole("button", { name: "Start", exact: true }));
  expect(state.mutate.mock.calls[0][0]).toBe("/baselines");
});
it("keeps an unfinished session primary even when submitted evidence already exists", async () => {
  const data = configuredHome(); data.resumableSession = { id: "session-1", kind: "baseline" } as Bootstrap["resumableSession"];
  state.data = { skills: [{ skill: "reading", submittedCount: 1 }] };
  show(<TodayBoard data={data} />);
  const hero = within(screen.getByRole("region", { name: "Next activity" }));
  expect(hero.getByRole("heading", { name: "Resume starting practice" })).toBeVisible();
  await userEvent.setup().click(hero.getByRole("button", { name: "Resume" }));
  expect(state.mutate).not.toHaveBeenCalled();
});
it("does not start a second baseline before submitted evidence has loaded", () => {
  state.data = null;
  show(<TodayBoard data={configuredHome()} />);
  expect(within(screen.getByRole("region", { name: "Next activity" })).getByRole("button", { name: "Start", exact: true })).toBeDisabled();
  expect(state.mutate).not.toHaveBeenCalled();
});
