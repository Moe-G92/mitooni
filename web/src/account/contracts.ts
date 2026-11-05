import { z } from "zod";
const band = z.number().min(0).max(9).multipleOf(0.5);
export const Targets = z
  .object({
    overall: band,
    listening: band,
    reading: band,
    writing: band,
    speaking: band,
  })
  .strict();
export const Editable = z
  .object({
    name: z.string().trim().min(1).max(100),
    locale: z.enum(["fa", "en"]),
    theme: z.enum(["system", "light", "dark"]),
    targets: Targets,
    testDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    currentLevel: band.nullable(),
    weeklyHours: z.number().int().min(0).max(60),
    showFlag: z.boolean(),
    notifications: z
      .object({ email: z.boolean(), reminders: z.boolean() })
      .strict(),
  })
  .strict();
export const Profile = Editable.extend({
  onboarded: z.boolean(),
  revision: z.number().int().positive(),
}).strict();
export const AccountSchema = z
  .object({
    identity: z
      .object({ id: z.string(), email: z.string().nullable() })
      .strict(),
    membership: z
      .object({
        status: z.enum(["none", "active", "inactive"]),
        roles: z.array(z.string()),
        entitlements: z.array(z.string()),
      })
      .strict(),
    state: z.enum(["access-required", "setup-required", "ready"]),
    profile: Profile.nullable(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const active = a.membership.status === "active";
    if (
      (!active &&
        (a.profile !== null ||
          a.state !== "access-required" ||
          a.membership.roles.length ||
          a.membership.entitlements.length)) ||
      (active &&
        a.state !== (a.profile?.onboarded ? "ready" : "setup-required"))
    )
      ctx.addIssue({ code: "custom", message: "Inconsistent account" });
  });
export type Account = z.infer<typeof AccountSchema>;
export type LearnerProfile = z.infer<typeof Profile>;
export type EditableProfile = z.infer<typeof Editable>;
export type ProfileChanges = Partial<
  Omit<EditableProfile, "targets" | "notifications">
> & {
  targets?: Partial<EditableProfile["targets"]>;
  notifications?: Partial<EditableProfile["notifications"]>;
};
