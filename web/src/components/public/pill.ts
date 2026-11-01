import { cn } from "@/lib/utils";

/* Class names for the rounded pill buttons on the public pages (kept apart from ui.tsx for fast refresh). */

export type PillVariant = "red" | "redOutline" | "blue" | "white" | "whiteBlue";

const pillBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-gabarito font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const pillVariant: Record<PillVariant, string> = {
  red: "bg-coral text-white hover:bg-[#B8232D] hover:text-white",
  redOutline: "border-2 border-coral text-[#B8232D] hover:bg-pink-tint hover:text-[#B8232D]",
  blue: "bg-primary text-white hover:bg-deep-wisteria-dark hover:text-white",
  white: "bg-white text-primary hover:bg-pale-wisteria hover:text-primary",
  whiteBlue: "bg-white text-midnight-iris hover:bg-pale-wisteria hover:text-midnight-iris",
};

const pillSize = {
  lg: "px-8 py-3.5 text-[17px] leading-6",
  md: "px-[18px] py-2 text-[15px] leading-[22px]",
};

export function pillClass(variant: PillVariant = "red", size: PillSize = "lg", className?: string) {
  return cn(pillBase, pillVariant[variant], pillSize[size], variant === "redOutline" && size === "lg" && "px-[30px] py-3", className);
}

export type PillSize = keyof typeof pillSize;
