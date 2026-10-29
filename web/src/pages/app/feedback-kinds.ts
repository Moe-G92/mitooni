import type { Annotation } from "@/api/schemas";

export const KIND_CLASS: Record<Annotation["kind"], string> = {
  grammar: "bg-weak-soft text-foreground decoration-weak",
  vocabulary: "bg-fair-soft text-foreground decoration-fair",
  cohesion: "bg-secondary text-foreground decoration-primary",
  task: "bg-strength-soft text-foreground decoration-strength",
};
