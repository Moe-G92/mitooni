// Receiving wire contract mirrored from platform/backend/app/contracts/study.py.
import { z } from "zod";
const id = z.string().min(1).max(160);
const revision = z.number().int().min(1);
const text = (max: number) =>
  z
    .string()
    .refine((v) => Array.from(v).length <= max, "Text exceeds contract limit");
const Bundle = z
  .object({
    packId: id,
    packVersion: revision,
    contentHash: id,
    objectiveId: id,
    objectiveVersion: revision,
    rubricVersion: revision,
    policyVersion: revision,
    familyRegistryVersion: revision,
  })
  .strict();
export const WorkRef = z
  .object({ kind: z.enum(["draft", "attempt"]), id, revision })
  .strict();
export const DraftSchema = z
  .object({
    id,
    workspaceId: id,
    attemptId: id,
    revision,
    taskId: id,
    kind: z.enum(["reading", "task2"]),
    text: text(20000),
    updatedAt: z.string(),
  })
  .strict();
const AttemptSchema = z
  .object({
    id,
    status: z.enum(["open", "submitted"]),
    bundleRef: Bundle,
    taskId: id,
    familyId: id,
    originalConditions: z.enum(["supported", "independent"]),
    currentConditions: z.enum(["supported", "independent"]),
    conditionsRevision: revision,
    draftId: id,
    draftRevision: revision,
    responseSnapshot: text(20000).nullable(),
    responseSnapshotHash: z.string().nullable(),
    eligibility: z.record(z.string(), z.unknown()),
    startedAt: z.string(),
    submittedAt: z.string().nullable(),
    parentAttemptId: id.nullable(),
  })
  .strict();
export const ProposalSchema = z
  .object({
    id,
    turnId: id,
    expectedJourneyRevision: revision,
    targetStepId: id,
    evidenceIds: z.array(id),
    status: z.enum(["proposed", "accepted", "rejected"]),
    decisionReasons: z.array(z.string()),
  })
  .strict();
export const MessageSchema = z
  .object({
    id,
    turnId: id,
    workspaceId: id,
    kind: z.enum(["explanation", "question", "feedback"]),
    text: text(6000).refine(
      (value) => value.length > 0,
      "Empty terminal message",
    ),
    requestText: text(3000),
    citations: z
      .array(z.object({ anchorId: id, label: text(120) }).strict())
      .max(8),
    workSpans: z
      .array(
        z
          .object({
            start: z.number().int().min(0),
            end: z.number().int().positive(),
            quote: text(600),
          })
          .strict(),
      )
      .max(8),
    observations: z
      .array(
        z
          .object({
            criterionId: id,
            text: text(1000),
            workSpanIndexes: z.array(z.number().int().min(0)).max(8),
          })
          .strict(),
      )
      .max(8),
    proposalId: id.nullable(),
    provenance: z
      .object({
        actorKind: z.literal("ai_formative"),
        runnerKind: z.enum(["provider", "synthetic"]),
        bundleRef: Bundle,
        contextManifestId: id,
        workRef: WorkRef,
      })
      .strict(),
    createdAt: z.string(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new TextEncoder().encode(JSON.stringify(value)).length > 32768)
      ctx.addIssue({
        code: "custom",
        message: "Message exceeds contract limit",
      });
    for (const span of value.workSpans)
      if (
        span.end <= span.start ||
        Array.from(span.quote).length !== span.end - span.start
      )
        ctx.addIssue({ code: "custom", message: "Invalid work span" });
    for (const observation of value.observations)
      if (observation.workSpanIndexes.some((i) => i >= value.workSpans.length))
        ctx.addIssue({ code: "custom", message: "Invalid observation span" });
  });
export const JourneySchema = z
  .object({
    id,
    revision,
    policyVersion: revision,
    steps: z.array(
      z
        .object({
          stepId: id,
          title: z.string(),
          skill: z.enum(["reading", "writing"]),
          state: z.enum(["available", "completed", "locked"]),
          bundleRef: Bundle,
          conditionPresets: z.array(z.enum(["supported", "independent"])),
          reasonEvidenceIds: z.array(z.string()),
        })
        .strict(),
    ),
  })
  .strict();
export const WorkspaceSchema = z
  .object({
    id,
    revision,
    journeyId: id,
    stepId: id,
    bundleRef: Bundle,
    threadId: id,
    contextManifestId: id,
    stage: z.enum(["working", "submitted", "reviewing"]),
    currentAttemptId: id,
    activeTurnId: id.nullable(),
    latestTurnId: id.nullable(),
    rawCheck: z
      .object({
        actorKind: z.literal("deterministic_check"),
        itemCount: z.literal(1),
        correctCount: z.union([z.literal(0), z.literal(1)]),
        workRef: WorkRef,
      })
      .strict()
      .nullable(),
    capabilities: z.array(
      z.enum([
        "draft:write",
        "attempt:submit",
        "support:switch",
        "tutor:use",
        "attempt:revise",
      ]),
    ),
    task: z
      .object({
        taskId: id,
        kind: z.enum(["reading", "task2"]),
        title: z.string(),
        stimulus: z.string(),
        prompt: z.string(),
        anchors: z.array(
          z.object({ id, label: z.string(), text: z.string() }).strict(),
        ),
      })
      .strict(),
    draft: DraftSchema,
    attempt: AttemptSchema,
    messages: z.array(MessageSchema),
    proposals: z.array(ProposalSchema),
  })
  .strict()
  .superRefine((ws, ctx) => {
    if (
      ws.attempt.status === "submitted" &&
      (ws.attempt.responseSnapshot === null ||
        ws.attempt.responseSnapshot !== ws.draft.text)
    )
      ctx.addIssue({ code: "custom", message: "Frozen work mismatch" });
    if (
      ws.attempt.originalConditions === "supported" &&
      ws.attempt.currentConditions === "independent"
    )
      ctx.addIssue({ code: "custom", message: "Invalid condition upgrade" });
    if (
      ws.draft.workspaceId !== ws.id ||
      ws.draft.attemptId !== ws.attempt.id ||
      ws.currentAttemptId !== ws.attempt.id ||
      ws.attempt.draftId !== ws.draft.id ||
      ws.draft.taskId !== ws.task.taskId ||
      ws.draft.kind !== ws.task.kind
    )
      ctx.addIssue({ code: "custom", message: "Workspace binding mismatch" });
    if (
      new Set(ws.messages.map((message) => message.id)).size !==
      ws.messages.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate canonical message" });
    if (
      new Set(ws.proposals.map((proposal) => proposal.id)).size !==
      ws.proposals.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate proposal" });
    for (const message of ws.messages)
      if (message.workspaceId !== ws.id)
        ctx.addIssue({ code: "custom", message: "Message workspace mismatch" });
  });
export const TurnSchema = z
  .object({
    id,
    revision,
    workspaceId: id,
    sequence: revision,
    inputWorkRevision: revision,
    bundleRef: Bundle,
    intent: z.enum(["explain", "hint", "feedback", "propose_next"]),
    runnerKind: z.enum(["provider", "synthetic"]),
    status: z.enum([
      "queued",
      "running",
      "cancel-requested",
      "canceled",
      "completed",
      "failed",
      "dispatch-unknown",
    ]),
    lastEventSequence: z.number().int().min(0),
    error: z.record(z.string(), z.unknown()).nullable(),
    retryAction: z.string().nullable(),
  })
  .strict();
export const PollSchema = z
  .object({
    turn: TurnSchema,
    events: z.array(z.record(z.string(), z.unknown())),
    cursor: z.number().int().min(0),
    workspaceRevision: revision,
    terminalMessage: MessageSchema.nullable(),
  })
  .strict()
  .superRefine((poll, ctx) => {
    if (poll.turn.status === "completed" && !poll.terminalMessage)
      ctx.addIssue({
        code: "custom",
        message: "Completed turn lacks canonical message",
      });
    if (
      poll.terminalMessage &&
      poll.terminalMessage.provenance.workRef.revision !==
        poll.turn.inputWorkRevision
    )
      ctx.addIssue({ code: "custom", message: "Turn work revision mismatch" });
    if (
      poll.terminalMessage &&
      (poll.turn.status !== "completed" ||
        poll.terminalMessage.turnId !== poll.turn.id ||
        poll.terminalMessage.workspaceId !== poll.turn.workspaceId)
    )
      ctx.addIssue({ code: "custom", message: "Uncommitted message" });
  });
export const AcceptSchema = z
  .object({ journey: JourneySchema, proposal: ProposalSchema })
  .strict();
export type Journey = z.infer<typeof JourneySchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type Draft = z.infer<typeof DraftSchema>;
export type Turn = z.infer<typeof TurnSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Poll = z.infer<typeof PollSchema>;
export type Intent = Turn["intent"];
export const activeTurn = (turn: Turn | null) =>
  Boolean(
    turn && ["queued", "running", "cancel-requested"].includes(turn.status),
  );
