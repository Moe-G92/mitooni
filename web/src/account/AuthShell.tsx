import { brand } from "@/config/brand";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "./LanguageSwitch";

/*
 * Shared pieces for sign-in, sign-up and forgot password, styled after the
 * mitooni canvases (SignIn.dc.html, ForgotPassword.dc.html): a white form
 * column on the start side (logo, language switch, form centred at 448px) and
 * a rounded illustrated panel on the end side from the lg breakpoint up.
 * First adapted from the 21st.dev "sign-in" component (@jahed).
 */

export const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="size-5"
    viewBox="0 0 48 48"
    aria-hidden="true"
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

/** Light grey rounded field box (canvas: 4% ink fill, 12% ink border, 16px radius). */
export function InputBox({
  children,
  invalid,
}: {
  children: ReactNode;
  invalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-[rgba(1,22,39,0.04)] transition-colors focus-within:border-primary focus-within:bg-white focus-within:ring-3 focus-within:ring-primary/20",
        invalid ? "border-weak" : "border-[rgba(1,22,39,0.12)]",
      )}
    >
      {children}
    </div>
  );
}

/** The input inside an InputBox: 52px tall overall. */
export const inputClass =
  "block h-[50px] w-full rounded-2xl bg-transparent px-4 text-[16px] text-foreground placeholder:text-[#6b7480] focus:outline-none";

/** Full-width Deep Wisteria button. */
export const primaryButton =
  "block w-full rounded-2xl bg-primary py-4 text-center font-gabarito text-[15px] leading-normal font-medium text-white transition-colors hover:bg-deep-wisteria-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";

/** Coral text link or button (back links, "Forgot password?", resend). */
export const coralLink =
  "text-coral hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

export const checkboxClass = "size-4 shrink-0 accent-coral";

export const titleClass =
  "font-archivo text-[36px] leading-[1.25] font-semibold tracking-[-0.02em] text-foreground";

export const leadClass = "text-[15px] text-[#3a4855]";

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
    <InputBox invalid={invalid}>
      {/* The field is always left to right (passwords, emails), so the eye button sits on the right in both languages. */}
      <div className="relative" dir="ltr">
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
          className={cn(
            inputClass,
            "pr-12 text-left [&:lang(fa)]:placeholder:text-right",
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? hideLabel : showLabel}
          aria-pressed={show}
          className="absolute inset-y-0 right-1 flex min-w-11 justify-center items-center text-[#3a4855] hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          {show ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </InputBox>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[14px] font-medium text-[#3a4855]"
    >
      {children}
    </label>
  );
}

export function FieldError({
  id,
  children,
}: {
  id?: string;
  children?: ReactNode;
}) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] text-weak">
      {children}
    </p>
  );
}

/** Coral "back" link with an arrow that flips in RTL. Pass `to` for a link, `onClick` for a button. */
export function BackLink({
  to,
  onClick,
  children,
}: {
  to?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const inner = (
    <>
      <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />{" "}
      {children}
    </>
  );
  const cls = cn(
    "inline-flex min-h-11 items-center gap-1.5 self-start text-[14px]",
    coralLink,
  );
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Dashed prototype note under the form. */
export function PrototypeNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-[rgba(1,22,39,0.12)] px-4 py-3 text-[12px] leading-5 text-[#3a4855]">
      {children}
    </p>
  );
}

/** Full-screen two-column layout: form on the start side, `panel` on the end side (lg and up). */
export function AuthShell({
  children,
  panel,
}: {
  children: ReactNode;
  panel: ReactNode;
}) {
  return (
    <div className="grid min-h-[100dvh] w-full bg-white font-gabarito text-[15px] leading-normal text-foreground lg:grid-cols-2">
      <section className="flex min-w-0 flex-col p-4 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            aria-label={brand.name}
            className="flex min-h-11 min-w-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Logo />
          </Link>
          <LanguageSwitch className="bg-white" />
        </div>
        <main
          id="main"
          className="flex flex-1 items-center justify-center py-10"
        >
          <div className="w-full max-w-[448px]">{children}</div>
        </main>
      </section>
      <section className="hidden min-w-0 p-4 lg:block" aria-hidden="true">
        {panel}
      </section>
    </div>
  );
}
