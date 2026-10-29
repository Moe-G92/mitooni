import type { ReactNode } from "react";
import { TopControls } from "./TopControls";

/** Page title row from the dashboard mockup, with chips and global controls on the end side. */
export function PageHeader({ title, sub, chips }: { title: string; sub?: ReactNode; chips?: ReactNode }) {
  return (
    <header className="mb-5.5 flex flex-wrap items-center gap-3.5">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <div className="text-muted-foreground">{sub}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2 md:ms-auto">
        {chips}
        <TopControls />
      </div>
    </header>
  );
}
