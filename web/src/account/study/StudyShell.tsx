// Adapted Mo PracticeShell.tsx frame/Reading+Writing colors; no prototype API/data imports.
import type { ReactNode } from "react";
import { BrandMark } from "../BrandMark";
import { TopControls } from "../TopControls";
import { Button } from "../Button";
import { useStudyWords } from "./locale";
import { cn } from "@/lib/utils";
export function StudyShell({
  title,
  kind,
  onExit,
  children,
}: {
  title: string;
  kind?: "reading" | "task2";
  onExit: () => void;
  children: ReactNode;
}) {
  const w = useStudyWords();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#study-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3"
      >
        {w.task}
      </a>
      <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-2 md:gap-6 md:px-8">
        <BrandMark />
        <div className="ms-auto flex items-center gap-3">
          <TopControls />
          <Button variant="outline" onClick={onExit}>
            {w.exit}
          </Button>
        </div>
      </header>
      <main id="study-main">
        <div
          className={cn(
            "border-b px-4 py-6 md:px-8 md:py-7",
            kind === "task2"
              ? "border-[#A61E2A] bg-[#A61E2A] text-white"
              : "border-[#FF88DC] bg-pink-tint text-midnight-iris",
          )}
        >
          <h1
            dir="auto"
            className="mx-auto max-w-[1180px] font-archivo text-3xl font-extrabold tracking-tight md:text-[40px]"
          >
            {title}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
}
