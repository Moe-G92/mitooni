import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-input bg-card px-3.5 text-[15px] text-foreground placeholder:text-faint focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0 disabled:opacity-60";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(field, "h-11 appearance-auto pe-8", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-foreground", className)} {...props} />;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-[13px] text-weak">
      {children}
    </p>
  );
}

export function Field({ label, htmlFor, error, hint, children }: { label: React.ReactNode; htmlFor: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}
