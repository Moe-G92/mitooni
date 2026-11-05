// Synthetic test helpers. Imported only by *.test files, never runtime modules.
import type { Workspace } from "./contracts";
export const bundle = {
  packId: "synthetic",
  packVersion: 1,
  contentHash: "synthetic-hash",
  objectiveId: "focus",
  objectiveVersion: 1,
  rubricVersion: 1,
  policyVersion: 1,
  familyRegistryVersion: 1,
};
export function workspace(overrides: Partial<Workspace> = {}): Workspace {
  const base: Workspace = {
    id: "workspace-a",
    revision: 1,
    journeyId: "journey-a",
    stepId: "step-a",
    bundleRef: bundle,
    threadId: "thread-a",
    contextManifestId: "manifest-a",
    stage: "working",
    currentAttemptId: "attempt-a",
    activeTurnId: null,
    latestTurnId: null,
    rawCheck: null,
    capabilities: ["draft:write", "attempt:submit", "tutor:use"],
    task: {
      taskId: "task-a",
      kind: "task2",
      title: "Synthetic Task 2",
      stimulus: "",
      prompt: "Explain a choice.",
      anchors: [
        { id: "anchor-a", label: "Planning", text: "State the reason." },
      ],
    },
    draft: {
      id: "draft-a",
      workspaceId: "workspace-a",
      attemptId: "attempt-a",
      revision: 1,
      taskId: "task-a",
      kind: "task2",
      text: "saved response",
      updatedAt: "2026-11-05T00:00:00Z",
    },
    attempt: {
      id: "attempt-a",
      status: "open",
      bundleRef: bundle,
      taskId: "task-a",
      familyId: "family-a",
      originalConditions: "supported",
      currentConditions: "supported",
      conditionsRevision: 1,
      draftId: "draft-a",
      draftRevision: 1,
      responseSnapshot: null,
      responseSnapshotHash: null,
      eligibility: {},
      startedAt: "2026-11-05T00:00:00Z",
      submittedAt: null,
      parentAttemptId: null,
    },
    messages: [],
    proposals: [],
  };
  return { ...base, ...overrides };
}
export const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { resolve, promise };
};
