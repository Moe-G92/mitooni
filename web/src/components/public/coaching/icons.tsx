import { cn } from "@/lib/utils";

/* Small stroke icons for the Coaching page (canvas Coaching.dc.html). */

export function CheckIcon({ color = "#2c6e1a", size = 16, className }: { color?: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CrossIcon({ color = "#9aa3ad", size = 16, className }: { color?: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
