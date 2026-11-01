import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { pageTitleClass } from "./dashboard/styles";
import { TopControls } from "./TopControls";

/**
 * Page title row from the mitooni canvas: big Midnight Iris title, muted line
 * under it, chips and the global controls on the end side.
 */
export function PageHeader({
  title,
  sub,
  chips,
  eyebrow,
  className,
}: {
  title: string;
  sub?: ReactNode;
  chips?: ReactNode;
  /** Small muted line above the title, such as today's date. */
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-5.5 flex flex-wrap items-center gap-3.5", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className={pageTitleClass}>{title}</h1>
        {sub && <div className="mt-2 text-base text-muted-foreground">{sub}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2 md:ms-auto">
        {chips}
        <TopControls />
      </div>
    </header>
  );
}
