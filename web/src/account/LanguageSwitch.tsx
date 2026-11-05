import { usePrefs, setPrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
export function LanguageSwitch({ className }: { className?: string }) {
  const { locale } = usePrefs();
  const next = locale === "en" ? "fa" : "en";
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-border bg-card px-2.5 text-[13px] font-medium text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary",
        className,
      )}
      onClick={() => setPrefs({ locale: next })}
      aria-label={next === "fa" ? "تغییر زبان به فارسی" : "Switch to English"}
      lang={next}
    >
      {next === "fa" ? "فارسی" : "English"}
    </button>
  );
}
