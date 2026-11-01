import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { pillClass, type PillVariant, type PillSize } from "@/components/public/pill";

/*
 * Shared building blocks for the mitooni public pages (canvas: Main, How to use,
 * What is IELTS?, Coaching, FAQ). White page, 1200px column with a 24px gutter,
 * Archivo for headings and body, Gabarito for buttons. Day mode only.
 */

/** The 1200px page column used by every public section. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto box-border w-full max-w-[1200px] px-6 max-sm:px-4", className)}>{children}</div>;
}

/** A rounded pill link (red filled by default). */
export function PillLink({
  to,
  children,
  variant = "red",
  size = "lg",
  className,
}: {
  to: string;
  children: React.ReactNode;
  variant?: PillVariant;
  size?: PillSize;
  className?: string;
}) {
  return (
    <Link to={to} className={pillClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/** The white floating tray that holds the two hero buttons. */
export function ButtonTray({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-3 rounded-3xl bg-white p-3 shadow-[0_10px_30px_rgba(11,42,62,0.10)]", className)}>
      {children}
    </div>
  );
}

/** The pale yellow italic kicker above a page title ("Practise for IELTS Academic & General"). Persian is never slanted. */
export function Kicker({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("m-0 inline-block rounded-full bg-[#FDFFC7] px-[18px] py-2 font-archivo text-[18px] leading-[26px] text-foreground italic max-sm:text-[16px] [&:lang(fa)]:not-italic", className)}>
      {children}
    </p>
  );
}

/** Page title in Deep Wisteria. */
export const heroTitle = "font-archivo text-[clamp(36px,5vw,60px)] leading-[1.2] font-bold tracking-[-0.02em] text-primary";
/** Section title: centred, Deep Wisteria, regular weight with <b> parts in bold. */
export const sectionTitle =
  "text-center font-archivo text-[clamp(28px,3.6vw,44px)] leading-[1.2] font-normal tracking-[-0.015em] text-primary [&_b]:font-bold";
/** Lead paragraph under a hero title. */
export const heroLead = "font-archivo text-[19px] leading-[30px] text-[#3a4855] max-sm:text-[17px] max-sm:leading-7 [&_b]:text-foreground";

/** Red tick used in hero lists and pills. */
export function Tick({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#D92F3A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Renders a translated string that marks bold parts with <b>…</b>.
 * Only <b> is supported, so translated copy can never inject markup.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^<b>(.*)<\/b>$/.exec(p);
        return m ? <b key={i}>{m[1]}</b> : <span key={i}>{p}</span>;
      })}
    </>
  );
}
