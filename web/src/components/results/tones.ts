import type { Skill } from "@/api/schemas";

/** Each skill's colour pair, from the canvas: text and rule, and the soft tile behind it. */
export const SKILL_TONE: Record<Skill, { text: string; bg: string; border: string; solid: string }> = {
  listening: {
    text: "text-primary",
    bg: "bg-[#E6EBFF]",
    border: "border-primary",
    solid: "bg-primary",
  },
  reading: {
    text: "text-magenta",
    bg: "bg-pink-tint",
    border: "border-magenta",
    solid: "bg-magenta",
  },
  writing: {
    text: "text-weak",
    bg: "bg-weak-soft",
    border: "border-weak",
    solid: "bg-weak",
  },
  speaking: {
    text: "text-strength",
    bg: "bg-strength-soft",
    border: "border-strength",
    solid: "bg-strength",
  },
};

const prefersReducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Scrolls an element into view (smoothly unless reduced motion), focuses it and outlines it briefly. */
export function revealElement(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const target = (el.closest("mark") as HTMLElement | null) ?? el;
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "center",
  });
  target.focus({ preventScroll: true });
  target.classList.add("ring-2", "ring-primary", "ring-offset-2");
  window.setTimeout(() => target.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 1600);
  return true;
}
