import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* Building blocks shared by the public pages (design from reasonal.co, see docs/research/2026-10-29-reasonal-teardown.md). */

export function Section({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="px-4 pb-4 max-md:px-3 max-md:pb-3">
      <div className={cn("mx-auto max-w-[1440px] overflow-hidden rounded-[32px]", className)}>{children}</div>
    </section>
  );
}

export const eyebrow = "font-gabarito text-[18px] leading-6 font-semibold uppercase tracking-[0.1em] max-[1200px]:text-[16px] max-md:text-[14px]";
export const bigTitle = "font-archivo text-[64px] leading-[72px] font-semibold tracking-[-0.015em] max-[1200px]:text-[48px] max-[1200px]:leading-[56px] max-md:text-[36px] max-md:leading-[44px]";
export const cardTitle = "font-archivo text-[40px] leading-[48px] font-semibold tracking-[-0.015em] max-[1200px]:text-[32px] max-[1200px]:leading-[40px] max-md:text-[28px] max-md:leading-[36px]";
export const body = "font-archivo text-[20px] leading-7 tracking-[0.025em] text-mk-body max-[1200px]:text-[16px] max-[1200px]:leading-6";
export const statement = "font-archivo text-[32px] leading-10 tracking-[-0.015em] max-[1200px]:text-[24px] max-[1200px]:leading-8 max-md:text-[20px] max-md:leading-7";

/** Static soft clouds drawn in CSS (no images, nothing moves behind the text). */
export function Clouds() {
  const puffs = [
    "start-[-6%] top-[52%] h-[38%] w-[46%]",
    "end-[-8%] top-[58%] h-[40%] w-[50%]",
    "start-[28%] top-[74%] h-[34%] w-[52%]",
    "end-[6%] top-[6%] h-[26%] w-[34%] opacity-70",
    "start-[4%] top-[10%] h-[22%] w-[26%] opacity-60",
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {puffs.map((p, i) => (
        <span key={i} className={cn("absolute rounded-[50%] bg-[var(--mk-cloud)] blur-[48px]", p)} />
      ))}
    </div>
  );
}

export function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl bg-mk-card px-6 py-5">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-4 text-start">
        <span className="font-archivo text-[20px] leading-6 font-semibold max-[1200px]:text-[18px]">{q}</span>
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-mk-ink">
          {open ? <Minus className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
        </span>
      </button>
      {open && <p className={cn(body, "mt-3 leading-6")}>{a}</p>}
    </div>
  );
}


/** Short sky hero for subpages: the landing hero at a smaller height. */
export function PageHero({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  return (
    <Section className="relative">
      <div className="absolute inset-0 bg-[image:var(--mk-hero)]" />
      <Clouds />
      <div className="relative flex flex-col items-center px-6 pt-36 pb-20 text-center max-md:pt-28 max-md:pb-14">
        <p className={cn(eyebrow, "text-mk-hero-text")}>{kicker}</p>
        <h1 className="mt-5 max-w-[960px] bg-[image:var(--mk-hero-title)] bg-clip-text pb-1 font-archivo text-[clamp(40px,6.4vw,96px)] leading-[1.08] font-semibold tracking-[-0.015em] text-transparent">
          {title}
        </h1>
        <p className="mt-6 max-w-[720px] font-archivo text-[22px] leading-8 text-mk-hero-text max-md:text-[18px] max-md:leading-7">{lead}</p>
      </div>
    </Section>
  );
}

/** The dark closing card with one action. */
export function CtaCard({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <Section className="bg-mk-footer">
      <div className="flex flex-col items-center px-6 py-20 text-center max-md:py-14">
        <h2 className={cn(cardTitle, "text-white")}>{title}</h2>
        <p className="mt-4 max-w-xl font-archivo text-[20px] leading-7 text-white/75 max-[1200px]:text-[16px] max-[1200px]:leading-6">{text}</p>
        {action}
      </div>
    </Section>
  );
}
