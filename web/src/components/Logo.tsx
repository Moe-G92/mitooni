import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/** The mark: a rising M with a coral arrow and a canary dot, on a Midnight Iris squircle. Same drawing as public/favicon.svg. */
export function LogoMark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("size-7 shrink-0", light && "rounded-lg ring-1 ring-white/25", className)} aria-hidden="true">
      <path d="M60 2 C104 2 118 16 118 60 C118 104 104 118 60 118 C16 118 2 104 2 60 C2 16 16 2 60 2 Z" fill="#2B2470" />
      <polyline points="30,86 30,48 56,74 84,40" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="70,34 96,25 92,51" fill="#D92F3A" stroke="#D92F3A" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="92" cy="86" r="7" fill="#FAFF7F" />
    </svg>
  );
}

/** Mark plus wordmark. The name stays in Latin letters in both languages. */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} dir="ltr">
      <LogoMark light={light} />
      <span
        className={cn("font-archivo text-[20px] leading-none font-bold tracking-[-0.03em]", light ? "text-white" : "text-midnight-iris")}
        style={{ fontFamily: '"Archivo Variable", sans-serif' }}
      >
        {brand.name}
      </span>
    </span>
  );
}
