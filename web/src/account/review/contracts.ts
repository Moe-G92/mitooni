import { z } from "zod";
const id = z.string().min(1).max(160);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const revision = z.number().int().min(0);
export const Decision = z.enum([
  "comment",
  "changes_needed",
  "ready_for_editor",
]);
export const Answer = z
  .object({ questionId: id, text: z.string().max(20000) })
  .strict();
export const Review = z
  .object({
    decision: Decision,
    comment: z.string().max(4000),
    itemComments: z
      .array(
        z
          .object({
            itemId: id,
            comment: z.string().max(4000),
            decision: Decision,
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
export const Target = z
  .object({
    id,
    targetHash: hash,
    version: z.number().int().positive(),
    kind: z.enum(["unit", "mock", "syllabus", "mock_blueprint"]),
    title: z.string(),
    skill: z.enum(["reading", "writing", "listening", "speaking"]).nullable(),
    examTrack: z.enum(["academic", "general_training", "shared"]).nullable(),
    stage: z.enum(["train", "transfer"]).nullable(),
    pathwayIds: z.array(id),
    deliveryStatus: z.enum([
      "text",
      "audio_pending",
      "audio_ready",
      "recording_pending",
      "document",
    ]),
    revision,
    revealed: z.boolean(),
    submitted: z.boolean(),
    decision: Decision.nullable(),
  })
  .strict();
export const Catalog = z
  .object({ packageHash: hash, title: z.string(), targets: z.array(Target) })
  .strict();
export type Json =
  string | number | boolean | null | Json[] | { [key: string]: Json };
const json: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(json),
    z.record(z.string(), json),
  ]),
);
const Submission = z
  .object({
    answers: z.array(Answer).max(100),
    submittedAt: z.string(),
    conditions: z.enum(["blind", "exposed_typed_rehearsal"]),
  })
  .strict();
export const Asset = z
  .object({
    id,
    kind: z.string(),
    mediaType: z.enum(["image/png", "audio/mpeg", "audio/wav"]),
    sha256: hash,
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    alt: z.string(),
    url: z.string(),
  })
  .strict();
export type AssetData = z.infer<typeof Asset>;
export const Snapshot = z
  .object({
    packageHash: hash,
    targetHash: hash,
    target: Target,
    revision,
    draft: z.object({ answers: z.array(Answer).max(100) }).strict(),
    submission: Submission.nullable(),
    revealedAt: z.string().nullable(),
    task: z
      .object({
        assets: z.array(Asset),
        speaking: z
          .object({ permissionGranted: z.boolean(), available: z.boolean() })
          .strict()
          .optional(),
        instructions: z.union([z.string(), z.array(z.string())]),
        sections: z.array(
          z
            .object({
              id,
              title: z.string(),
              text: z.string().nullable(),
              instructions: z.union([z.string(), z.array(z.string())]),
              minimumWords: z.number().nullable(),
              table: z
                .object({
                  title: z.string(),
                  description: z.string(),
                  unit: z.string(),
                  columns: z.array(
                    z.object({ key: id, label: z.string() }).strict(),
                  ),
                  rows: z.array(
                    z.record(z.string(), z.union([z.string(), z.number()])),
                  ),
                })
                .strict()
                .nullable(),
              questions: z.array(
                z
                  .object({
                    id,
                    prompt: z.string(),
                    instructions: z.string(),
                    responseType: z.string(),
                    options: z.array(
                      z.object({ id, text: z.string() }).strict(),
                    ),
                    wordLimit: z.union([z.string(), z.number(), z.null()]),
                  })
                  .strict(),
              ),
            })
            .strict(),
        ),
      })
      .strict(),
    review: Review.nullable(),
    privateContent: z.record(z.string(), json).nullable(),
    limitations: z.array(z.string()),
  })
  .strict()
  .superRefine((s, ctx) => {
    const ids = s.task.sections.flatMap((section) =>
      section.questions.map((q) => q.id),
    );
    if (
      (s.task.speaking?.available === true &&
        !s.task.speaking.permissionGranted) ||
      s.targetHash !== s.target.targetHash ||
      s.target.submitted !== Boolean(s.submission) ||
      (s.submission !== null &&
        JSON.stringify(s.submission.answers) !==
          JSON.stringify(s.draft.answers)) ||
      new Set(s.draft.answers.map((a) => a.questionId)).size !==
        s.draft.answers.length ||
      s.revision !== s.target.revision ||
      Boolean(s.revealedAt) !== s.target.revealed ||
      Boolean(s.revealedAt) !== (s.privateContent !== null) ||
      new Set(ids).size !== ids.length ||
      s.draft.answers.some((a) => !ids.includes(a.questionId))
    )
      ctx.addIssue({ code: "custom", message: "Invalid review bindings" });
  });
export const Export = z
  .object({
    schemaVersion: z.literal(1),
    packageHash: hash,
    reviewerId: id,
    exportedAt: z.string(),
    evidenceKind: z.literal("reviewer_editorial_feedback"),
    learnerPublicationAuthorized: z.literal(false),
    records: z.array(
      z
        .object({
          targetId: id,
          targetHash: hash,
          targetVersion: z.number().int().positive(),
          revision,
          submission: Submission.nullable(),
          revealedAt: z.string().nullable(),
          review: Review.nullable(),
        })
        .strict(),
    ),
  })
  .strict();
export type TargetData = z.infer<typeof Target>;
export type SnapshotData = z.infer<typeof Snapshot>;
export type CatalogData = z.infer<typeof Catalog>;
