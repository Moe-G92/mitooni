import { brand } from "@/config/brand";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/TopControls";

/*
 * Adapted from the 21st.dev "sign-in" component (@jahed): form column on the
 * start side, a hero panel with floating cards on the end side, glass inputs
 * and staggered entrance animations. Changes: theme tokens and fonts from the
 * public site, right-to-left support, accessible labels, and product cards
 * instead of testimonials (there are no real learners yet).
 */

export const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

export function GlassInputWrapper({ children, invalid }: { children: ReactNode; invalid?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-mk-ink/[0.04] backdrop-blur-sm transition-colors focus-within:border-rosewood/70 focus-within:bg-frosted-blue/[0.12] dark:bg-white/[0.05]",
        invalid ? "border-weak" : "border-mk-line",
      )}
    >
      {children}
    </div>
  );
}

export const glassInput =
  "w-full rounded-2xl bg-transparent p-4 text-[16px] text-mk-ink placeholder:text-mk-body/70 focus:outline-none";

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  invalid,
  showLabel,
  hideLabel,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  invalid?: boolean;
  showLabel: string;
  hideLabel: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <GlassInputWrapper invalid={invalid}>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={show ? "text" : "password"}
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid}
          className={cn(glassInput, "pe-12")}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? hideLabel : showLabel}
          aria-pressed={show}
          className="absolute inset-y-0 end-3 flex items-center text-mk-body hover:text-mk-ink"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    </GlassInputWrapper>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[14px] font-medium text-mk-body">
      {children}
    </label>
  );
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] text-weak">
      {children}
    </p>
  );
}

/** Product facts shown as the component's floating cards. */
function PanelCard({ title, body, delay, mark }: { title: string; body: string; delay: string; mark: ReactNode }) {
  return (
    <div className={cn("animate-testimonial flex w-64 items-start gap-3 rounded-3xl border border-white/30 bg-white/70 p-5 text-ink-black backdrop-blur-xl dark:bg-[#020c15]/60 dark:text-white", delay)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rosewood text-white">{mark}</span>
      <div className="text-sm leading-snug">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 opacity-75">{body}</p>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  const { t, locale } = useT();
  return (
    <div className="mk flex min-h-[100dvh] w-full flex-col bg-mk-page font-gabarito text-mk-ink md:flex-row">
      <section className="flex flex-1 flex-col p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" aria-label={brand.name}>
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>

      <section className="relative hidden flex-1 p-4 md:block" aria-hidden="true">
        <div className="animate-slide-right animate-delay-300 absolute inset-4 overflow-hidden rounded-3xl bg-[image:var(--mk-hero)]">
          {["start-[-10%] top-[46%] h-[34%] w-[60%]", "end-[-12%] top-[62%] h-[36%] w-[58%]", "end-[8%] top-[8%] h-[22%] w-[40%]"].map((p, i) => (
            <span key={i} className={cn("absolute rounded-[50%] bg-[var(--mk-cloud)] blur-[48px]", p)} />
          ))}
          <div className="relative p-12">
            <p className="font-gabarito text-[16px] font-semibold tracking-[0.1em] text-mk-hero-text uppercase">{t("mk.auth.panelEyebrow")}</p>
            <p className="mt-4 max-w-md bg-[image:var(--mk-hero-title)] bg-clip-text font-archivo text-[56px] leading-[1.05] font-semibold tracking-[-0.015em] text-transparent lg:text-[64px]">
              {t("mk.auth.panelTitle")}
            </p>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
          <PanelCard title={t("mk.auth.card1Title")} body={t("mk.auth.card1Body")} delay="animate-delay-1000" mark={<span className="font-archivo text-sm font-bold">{formatNumber(7, locale)}</span>} />
          <div className="hidden xl:flex">
            <PanelCard title={t("mk.auth.card2Title")} body={t("mk.auth.card2Body")} delay="animate-delay-1200" mark={<span className="font-archivo text-sm font-bold">S</span>} />
          </div>
          <div className="hidden 2xl:flex">
            <PanelCard title={t("mk.auth.card3Title")} body={t("mk.auth.card3Body")} delay="animate-delay-1400" mark={<span className="text-sm font-bold">فا</span>} />
          </div>
        </div>
      </section>
    </div>
  );
}
