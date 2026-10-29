import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/** Count words the way the exam's "Words: N" counter does: runs of non-space characters. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** "18–19" style label for an item's question numbers. */
export function numbersLabel(numbers: number[]): string {
  return numbers.length > 1 ? `${numbers[0]}–${numbers[numbers.length - 1]}` : String(numbers[0]);
}

/** Normalise a typed answer for comparison: case, spacing, curly quotes, trailing full stop. */
export function normaliseAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:!?]+$/g, "")
    .trim();
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
