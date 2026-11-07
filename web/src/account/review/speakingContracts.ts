import { z } from "zod";
const hash = z.string().regex(/^[a-f0-9]{64}$/),
  id = z.string().min(1).max(160),
  text = z.string().min(1).max(2000);
export const CriterionId = z.enum([
  "fluency-coherence",
  "lexical-resource",
  "grammatical-range-accuracy",
  "pronunciation",
]);
const Evidence = z
  .object({
    recordingSha256: hash,
    startSeconds: z.number().finite().min(0),
    endSeconds: z.number().finite().positive(),
    observation: text,
  })
  .strict();
const Criterion = z
  .object({
    criterionId: CriterionId,
    status: z.enum(["observed", "insufficient_evidence"]),
    observation: text,
    revisionAction: text,
    evidence: z.array(Evidence).max(8),
    limitation: text,
  })
  .strict()
  .superRefine((c, ctx) => {
    if ((c.status === "observed") !== Boolean(c.evidence.length))
      ctx.addIssue({ code: "custom", message: "Invalid audio evidence" });
  });
export const Candidate = z
  .object({
    kind: z.literal("qualitative_speaking_feedback"),
    criteria: z.array(Criterion).length(4),
    limitations: z.array(text).min(1).max(8),
    timestampStatus: z.literal("model_estimated_unverified"),
    assessmentScope: z.literal("recorded_rehearsal"),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (new Set(c.criteria.map((v) => v.criterionId)).size !== 4)
      ctx.addIssue({ code: "custom", message: "Duplicate speaking criterion" });
  });
export const Recording = z
  .object({
    recordingId: id,
    jobId: id,
    taskId: id,
    packageHash: hash,
    targetHash: hash,
    status: z.enum([
      "queued",
      "running",
      "completed",
      "failed",
      "dispatch_unknown",
    ]),
    revision: z.number().int().positive(),
    recordingSha256: hash,
    durationSeconds: z.number().finite().min(0.25).max(180),
    sizeBytes: z
      .number()
      .int()
      .min(44)
      .max(18 * 1024 * 1024),
    error: z.enum(["dispatch_unknown", "speaking_unavailable"]).nullable(),
    result: Candidate.nullable(),
    conditions: z
      .object({
        kind: z.literal("recorded_rehearsal"),
        locallyRevealed: z.boolean(),
        externalExposure: z.literal("unknown"),
      })
      .strict(),
    createdAt: z.string(),
    limitations: z.array(z.string()),
  })
  .strict()
  .superRefine((r, ctx) => {
    if ((r.status === "completed") !== Boolean(r.result))
      ctx.addIssue({ code: "custom", message: "Uncommitted speaking result" });
    for (const c of r.result?.criteria ?? [])
      for (const e of c.evidence)
        if (
          e.recordingSha256 !== r.recordingSha256 ||
          e.endSeconds <= e.startSeconds ||
          e.endSeconds > r.durationSeconds
        )
          ctx.addIssue({ code: "custom", message: "Unbound audio evidence" });
  });
export const Recordings = z
  .object({
    packageHash: hash,
    targetHash: hash,
    recordings: z.array(Recording).max(8),
    available: z.boolean(),
  })
  .strict();
export type RecordingData = z.infer<typeof Recording>;
