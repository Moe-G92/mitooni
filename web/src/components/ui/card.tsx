import * as React from "react";
import { cn } from "@/lib/utils";

/* Card shell from the dashboard mockup: white surface, hairline border, 20px radius. */
export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("min-w-0 rounded-card border border-border bg-card px-6 py-5.5 text-card-foreground", className)} {...props} />;
}

/** Card label row: bold title on the start side, muted note on the end side. */
export function CardLabel({ title, note, className }: { title: React.ReactNode; note?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 text-[13px] text-muted-foreground", className)}>
      <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
      {note && <span className="text-end">{note}</span>}
    </div>
  );
}

/** Small faint footnote with a hairline above, as in the mockup tiles. */
export function CardHint({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-3.5 border-t border-border pt-3 text-xs text-faint", className)} {...props} />;
}
