import * as React from "react";
import { Dialog as D, DropdownMenu as DM, Switch as Sw, Tabs as T } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Strength } from "@/api/schemas";

/* ---------------- tags and bars ---------------- */

export function Tag({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs", className)} {...props} />;
}

const STRENGTH_CLASS: Record<Strength, string> = {
  weakness: "bg-weak-soft text-weak",
  fair: "bg-fair-soft text-fair",
  strength: "bg-strength-soft text-strength",
};

export function StrengthTag({ strength, label }: { strength: Strength; label: string }) {
  return <Tag className={STRENGTH_CLASS[strength]}>{label}</Tag>;
}

export function Bar({ value, tone = "primary", className, label }: { value: number; tone?: "primary" | "weak" | "strength"; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cn("h-2 overflow-hidden rounded bg-border", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <i className={cn("block h-full rounded", tone === "weak" ? "bg-weak" : tone === "strength" ? "bg-strength" : "bg-primary")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Chip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex h-[30px] items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] text-muted-foreground", className)}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} aria-hidden="true" />;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border px-6 py-12 text-center">
      <h3 className="text-base font-medium">{title}</h3>
      {body && <p className="max-w-md text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-weak/40 bg-weak-soft px-6 py-5 text-sm text-weak">
      {message}
      {onRetry && (
        <button className="ms-3 underline" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/** Segmented control as in the Analytics Bento reference. */
export function Segmented<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[10px] bg-muted p-0.5">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="radio"
          aria-checked={it.value === value}
          onClick={() => onChange(it.value)}
          className={cn(
            "h-[30px] rounded-lg px-3 text-xs font-medium transition-colors",
            it.value === value ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- dialog ---------------- */

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <D.Content
        className={cn(
          "fixed start-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,520px)] -translate-y-1/2 overflow-y-auto rounded-card border border-border bg-popover p-6 text-popover-foreground shadow-xl ltr:-translate-x-1/2 rtl:translate-x-1/2",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <D.Title className="text-lg font-medium">{title}</D.Title>
            {description && <D.Description className="mt-1 text-sm text-muted-foreground">{description}</D.Description>}
          </div>
          <D.Close className="rounded-lg p-1 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}

/* ---------------- dropdown ---------------- */

export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;

export function MenuContent({ children, className, align = "end" }: { children: React.ReactNode; className?: string; align?: "start" | "end" }) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className={cn("z-50 min-w-48 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg", className)}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function MenuItem({ className, ...props }: React.ComponentProps<typeof DM.Item>) {
  return (
    <DM.Item
      className={cn("flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent", className)}
      {...props}
    />
  );
}

export const MenuSeparator = () => <DM.Separator className="my-1 h-px bg-border" />;

/* ---------------- switch and tabs ---------------- */

export function Switch({ className, ...props }: React.ComponentProps<typeof Sw.Root>) {
  return (
    <Sw.Root
      className={cn("relative h-6 w-10 shrink-0 rounded-full bg-input transition-colors data-[state=checked]:bg-primary", className)}
      {...props}
    >
      <Sw.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px] rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-[18px]" />
    </Sw.Root>
  );
}

export const Tabs = T.Root;
export const TabsContent = T.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return <T.List className={cn("inline-flex gap-1 rounded-xl bg-muted p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "h-9 rounded-lg px-4 text-sm text-muted-foreground transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
