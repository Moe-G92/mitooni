import type { Annotation } from "@/api/schemas";

/*
 * Highlight colours for feedback notes, from the mitooni canvas: grammar in
 * brand blue, vocabulary in canary yellow, task in green and cohesion in pink.
 * KIND_CLASS styles the marked words; KIND_TAG_CLASS styles the small tag on
 * each note card.
 */
export const KIND_CLASS: Record<Annotation["kind"], string> = {
  grammar: "bg-[#E6EBFF] text-foreground decoration-primary",
  vocabulary: "bg-fair-soft text-foreground decoration-fair",
  cohesion: "bg-pink-tint text-foreground decoration-magenta",
  task: "bg-strength-soft text-foreground decoration-strength",
};

export const KIND_TAG_CLASS: Record<Annotation["kind"], string> = {
  grammar: "bg-[#E6EBFF] text-magenta",
  vocabulary: "bg-fair-soft text-foreground",
  cohesion: "bg-pink-tint text-magenta",
  task: "bg-strength-soft text-foreground",
};
