import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/** The mark: three rising bars, like band scores going up. Same drawing as public/favicon.svg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 shrink-0", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#037BB5" />
      <rect x="7" y="17" width="4.5" height="8" rx="2.25" fill="#fff" />
      <rect x="13.75" y="12" width="4.5" height="13" rx="2.25" fill="#fff" />
      <rect x="20.5" y="7" width="4.5" height="18" rx="2.25" fill="#FD956D" />
    </svg>
  );
}

/** Mark plus wordmark. The name stays in Latin letters in both languages. */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} dir="ltr">
      <LogoMark />
      <span
        className={cn("font-archivo text-[20px] leading-none font-bold tracking-[-0.03em]", light ? "text-white" : "text-[#181D1F] dark:text-white")}
        style={{ fontFamily: '"Archivo Variable", sans-serif' }}
      >
        {brand.name}
      </span>
    </span>
  );
}
