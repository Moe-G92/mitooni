/** Synthetic projection preserving the actual Listening wire's withheld text and nullable audio alt. */
export function privateSafeListeningWorkspace() {
  const ref = { catalogHash: "synthetic-catalogue", taskId: "listening-task", version: 1, contentHash: "synthetic-content", policyVersion: 1 };
  return {
    id: "listening-workspace", revision: 1, contentRef: ref,
    task: { id: "listening-task", title: "Listening practice", skill: "listening", examTrack: "academic", kind: "listening_items", sections: [{ id: "part-one", title: "Part one", text: null, instructions: "Complete the notes.", questions: [{ id: "question-one", prompt: "Destination", responseType: "short_text", options: [], wordLimit: 1, minimumWords: null }], table: null, assetIds: ["listening-audio"] }], assets: [{ id: "listening-audio", mediaType: "audio/mpeg", sha256: "0".repeat(64), alt: null, durationSeconds: 60 }], teachingAnchors: [], objectiveIds: ["listening-notes"] },
    draft: { revision: 1, responses: [] },
    attempt: { id: "listening-attempt", status: "open", parentAttemptId: null, contentRef: ref, conditions: { original: "independent", current: "independent", revision: 1, assisted: false, exposureEligible: true }, startedAt: "2026-11-07T12:00:00Z", deadlineAt: "2026-11-07T12:10:00Z", submittedAt: null, responseHash: null, responses: [] },
    capabilities: ["draft:write", "attempt:submit", "support:switch"], latestJobId: null, messages: [], feedback: null, rawCheck: null, answerReview: null, sessionId: "session-one", sessionKind: "baseline", playbackPolicy: "replay", listeningPlayback: null, sectionId: "section-one", planId: null, stepId: null, serverNow: "2026-11-07T12:00:00Z",
  };
}
