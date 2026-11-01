/* Shared class strings and colours for the dashboard screens (mitooni canvas). */
import type { Skill } from "@/api/schemas";

/** Display title for app pages: Archivo, extra bold, Midnight Iris. */
export const pageTitleClass =
  "font-archivo text-[clamp(34px,3.6vw,46px)] leading-[1.1] font-extrabold tracking-[-0.025em] text-midnight-iris text-balance";

/** Archivo with tabular figures, for bands and other numbers. */
export const numClass = "font-archivo tabular-nums";

/**
 * Colour per skill, as on the canvas: Listening navy on pale blue, Reading
 * magenta on pink, Writing red on pink, Speaking green on pale green.
 * `ink` is the text colour, `solid` a fill that takes white text, `soft` the
 * tinted surface and `bar` the progress bar colour. All pairs pass WCAG AA.
 */
export const SKILL_TONE: Record<Skill, { ink: string; solid: string; soft: string; bar: string; letter: string }> = {
  listening: { ink: "text-foreground", solid: "bg-primary", soft: "bg-[#E6EBFF]", bar: "bg-primary", letter: "L" },
  reading: { ink: "text-magenta", solid: "bg-magenta", soft: "bg-pink-tint", bar: "bg-[#E95FC4]", letter: "R" },
  writing: { ink: "text-weak", solid: "bg-weak", soft: "bg-pink-tint", bar: "bg-coral", letter: "W" },
  speaking: { ink: "text-strength", solid: "bg-strength", soft: "bg-strength-soft", bar: "bg-[#4f9a2e]", letter: "S" },
};

/** Same colours as hex, for SVG strokes and inline styles. */
export const SKILL_HEX: Record<Skill, string> = {
  listening: "#3E4FC4",
  reading: "#E95FC4",
  writing: "#D92F3A",
  speaking: "#4f9a2e",
};
