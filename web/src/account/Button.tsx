import type { ComponentProps } from "react";
import { Button as MoButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function Button({
  className,
  ...props
}: ComponentProps<typeof MoButton>) {
  return <MoButton className={cn("min-h-11 min-w-11", className)} {...props} />;
}
