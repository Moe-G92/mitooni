import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Profile } from "@/api/schemas";
import { useAuth } from "@/api/queries";
import { useT } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { emailOk, phoneOk, toLatin } from "@/lib/validate";
import { cn } from "@/lib/utils";
import {
  AuthShell,
  BackLink,
  FieldError,
  FieldLabel,
  GoogleIcon,
  InputBox,
  PasswordInput,
  PrototypeNote,
  checkboxClass,
  coralLink,
  inputClass,
  leadClass,
  primaryButton,
  titleClass,
} from "@/components/ui/sign-in";
import { ProgressPanel, type PanelVariant } from "@/components/public/auth/AuthPanel";

/** Persian leads and notes get the taller line height of the SignInFa canvas. */
const faLead = cn(leadClass, "[&:lang(fa)]:leading-[1.7]");

/*
 * One page for everyone, identifier first (the pattern Google, Microsoft and
 * Notion use): enter an email or mobile number, and the page shows the right
 * next step. Returning learners see "Welcome back" and a password; new ones
 * add a name and password; mobile numbers get a 6-digit code (common in Iran,
 * where Google sign-in is often blocked).
 *
 * Best practices followed: one primary action per step, correct autocomplete
 * and input types, show-password toggle, inline errors announced to screen
 * readers, the identifier kept visible with a way to change it, no forced
 * password confirmation, a visible strength hint, resend with a countdown.
 */

type Method = "email" | "phone";
type Step = "identify" | "password" | "create" | "code" | "name";

function strength(p: string): "weak" | "ok" | "strong" {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) score++;
  return score <= 1 ? "weak" : score <= 3 ? "ok" : "strong";
}

export default function Auth() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const auth = useAuth();
  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<Step>("identify");
  const [id, setId] = useState("");
  const [knownName, setKnownName] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [keep, setKeep] = useState(true);
  const [agree, setAgree] = useState(false);
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formArea = useRef<HTMLDivElement>(null);

  // Move focus to the first field of each step (not on first load, so screen readers start at the heading).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    formArea.current?.querySelector<HTMLInputElement>("input:not([hidden]):not([type=checkbox])")?.focus();
  }, [step, method]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const go = (p: Profile) => navigate(p.onboarded ? params.get("next") || "/app" : "/onboarding", { replace: true });
  const busy = auth.lookup.isPending || auth.signIn.isPending || auth.signUp.isPending || auth.otpSend.isPending || auth.otpVerify.isPending || auth.google.isPending;
  const reset = () => {
    setStep("identify");
    setPassword("");
    setCode("");
    setErrors({});
  };

  const identify = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "email") {
      if (!emailOk(id)) return setErrors({ id: t("mk.auth.errEmail") });
      setErrors({});
      auth.lookup.mutate(
        { email: id.trim() },
        {
          onSuccess: (r) => {
            setKnownName(r.name ?? "");
            setStep(r.exists ? "password" : "create");
          },
        },
      );
    } else {
      if (!phoneOk(id)) return setErrors({ id: t("mk.auth.errPhone") });
      setErrors({});
      auth.otpSend.mutate(
        { phone: toLatin(id) },
        {
          onSuccess: () => {
            setStep("code");
            setResendIn(60);
          },
        },
      );
    }
  };

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return setErrors({ password: t("mk.auth.errPassword") });
    setErrors({});
    auth.signIn.mutate({ email: id.trim(), password, keep }, { onSuccess: go });
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("mk.auth.errName");
    if (step === "create" && password.length < 8) errs.password = t("mk.auth.errNewPassword");
    if (!agree) errs.agree = t("mk.auth.errAgree");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (step === "create") auth.signUp.mutate({ name: name.trim(), email: id.trim(), password }, { onSuccess: go });
    else auth.otpVerify.mutate({ phone: toLatin(id), code: toLatin(code), name: name.trim() }, { onSuccess: (r) => "id" in r && go(r) });
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    const c = toLatin(code).replace(/\D/g, "");
    if (c.length !== 6) return setErrors({ code: t("mk.auth.errCode") });
    setErrors({});
    auth.otpVerify.mutate(
      { phone: toLatin(id), code: c },
      {
        onSuccess: (r) => {
          if ("id" in r) go(r);
          else setStep("name");
        },
      },
    );
  };


  // Mobile numbers read in Persian digits on the Persian page; emails stay as typed.
  const shownId = <bdi dir="ltr">{method === "phone" && locale === "fa" ? toLatin(id.trim()).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) : id.trim()}</bdi>;
  const withId = (text: string) => text.split("__ID__").flatMap((part, i) => (i ? [<span key={i}>{shownId}</span>, part] : [part]));
  const strengthKey = strength(password);
  const firstName = knownName.split(" ")[0];
  const panelVariant: PanelVariant = step === "password" ? "returning" : step === "identify" ? "identify" : step === "code" ? "code" : "create";

  const backLink = <BackLink onClick={reset}>{t("mk.auth.change")}</BackLink>;

  return (
    <AuthShell panel={<ProgressPanel key={panelVariant} variant={panelVariant} name={firstName} />}>
      <div ref={formArea} className="flex flex-col gap-6">
        {step === "identify" && (
          <div className="flex flex-col gap-5">
            <h1 className={titleClass}>{t("mk.auth.title")}</h1>
            <p className={faLead}>{t("mk.auth.sub")}</p>

            <button
              type="button"
              disabled={busy}
              onClick={() => auth.google.mutate(undefined, { onSuccess: go })}
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white text-[15px] font-medium transition-colors hover:bg-pale-wisteria focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              <GoogleIcon />
              {t("mk.auth.google")}
            </button>

            <div className="flex items-center gap-4 text-[14px] text-[#3a4855]">
              <span className="h-px flex-1 bg-[rgba(1,22,39,0.12)]" />
              {t("mk.auth.or")}
              <span className="h-px flex-1 bg-[rgba(1,22,39,0.12)]" />
            </div>

            <form className="flex flex-col gap-5" onSubmit={identify} noValidate>
              <div role="tablist" aria-label={t("mk.auth.or")} className="grid grid-cols-2 rounded-2xl bg-[rgba(1,22,39,0.04)] p-1">
                {(["email", "phone"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={method === m}
                    onClick={() => {
                      setMethod(m);
                      setId("");
                      setErrors({});
                    }}
                    className={cn(
                      "rounded-xl py-2.5 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                      method === m ? "bg-white text-midnight-iris shadow-[0_1px_3px_rgba(1,22,39,0.12)]" : "text-[#3a4855] hover:text-foreground",
                    )}
                  >
                    {m === "email" ? t("mk.auth.tabEmail") : t("mk.auth.tabPhone")}
                  </button>
                ))}
              </div>
              <div>
                <FieldLabel htmlFor="auth-id">{method === "email" ? t("mk.auth.email") : t("mk.auth.phone")}</FieldLabel>
                <InputBox invalid={!!errors.id}>
                  <input
                    id="auth-id"
                    name={method === "email" ? "email" : "tel"}
                    type={method === "email" ? "email" : "tel"}
                    inputMode={method === "email" ? "email" : "tel"}
                    autoComplete={method === "email" ? "username email" : "tel"}
                    dir="ltr"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder={method === "email" ? t("mk.auth.emailPh") : t("mk.auth.phonePh")}
                    aria-invalid={!!errors.id}
                    aria-describedby={errors.id ? "auth-id-err" : undefined}
                    className={cn(inputClass, "text-start")}
                  />
                </InputBox>
                <FieldError id="auth-id-err">{errors.id}</FieldError>
              </div>
              <button type="submit" disabled={busy} className={primaryButton}>
                {busy ? t("mk.auth.checking") : method === "email" ? t("mk.auth.continue") : t("mk.auth.sendCode")}
              </button>
            </form>
          </div>
        )}

        {step === "password" && (
          <form className="flex flex-col gap-5" onSubmit={signIn} noValidate>
            {backLink}
            <h1 className={titleClass}>{t("mk.auth.welcomeBack", { name: firstName })}</h1>
            <p className={faLead}>{withId(t("mk.auth.welcomeBackSub", { id: "__ID__" }))}</p>
            {/* Lets password managers pair the saved email with this password. */}
            <input type="email" name="email" autoComplete="username" value={id} readOnly hidden />
            <div>
              <FieldLabel htmlFor="auth-password">{t("mk.auth.password")}</FieldLabel>
              <PasswordInput
                id="auth-password"
                value={password}
                onChange={setPassword}
                placeholder={t("mk.auth.passwordPh")}
                autoComplete="current-password"
                invalid={!!errors.password}
                showLabel={t("mk.auth.show")}
                hideLabel={t("mk.auth.hide")}
              />
              <FieldError>{errors.password}</FieldError>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className={checkboxClass} />
                <span>{t("mk.auth.keep")}</span>
              </label>
              <Link to={`/forgot-password?email=${encodeURIComponent(id.trim())}`} className={coralLink}>
                {t("mk.auth.forgot")}
              </Link>
            </div>
            <button type="submit" disabled={busy} className={primaryButton}>
              {t("mk.auth.signIn")}
            </button>
          </form>
        )}

        {(step === "create" || step === "name") && (
          <form className="flex flex-col gap-5" onSubmit={create} noValidate>
            {backLink}
            <h1 className={titleClass}>{t("mk.auth.newHere")}</h1>
            <p className={faLead}>{withId(t(step === "name" ? "mk.auth.newHereSubPhone" : "mk.auth.newHereSub", { id: "__ID__" }))}</p>
            <div>
              <FieldLabel htmlFor="auth-name">{t("mk.auth.name")}</FieldLabel>
              <InputBox invalid={!!errors.name}>
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("mk.auth.namePh")}
                  aria-invalid={!!errors.name}
                  className={inputClass}
                />
              </InputBox>
              <FieldError>{errors.name}</FieldError>
            </div>
            {step === "create" && (
              <div>
                <FieldLabel htmlFor="auth-new-password">{t("mk.auth.password")}</FieldLabel>
                <input type="email" name="email" autoComplete="username" value={id} readOnly hidden />
                <PasswordInput
                  id="auth-new-password"
                  value={password}
                  onChange={setPassword}
                  placeholder={t("mk.auth.newPasswordPh")}
                  autoComplete="new-password"
                  invalid={!!errors.password}
                  showLabel={t("mk.auth.show")}
                  hideLabel={t("mk.auth.hide")}
                />
                {password && (
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-[#3a4855]" aria-live="polite">
                    <div className="flex flex-1 gap-1" aria-hidden="true">
                      {[0, 1, 2].map((i) => (
                        <i
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded",
                            i <= ["weak", "ok", "strong"].indexOf(strengthKey)
                              ? strengthKey === "weak"
                                ? "bg-weak"
                                : strengthKey === "ok"
                                  ? "bg-fair"
                                  : "bg-strength"
                              : "bg-border",
                          )}
                        />
                      ))}
                    </div>
                    {t(`mk.auth.strength.${strengthKey}`)}
                  </div>
                )}
                <FieldError>{errors.password}</FieldError>
              </div>
            )}
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-[14px]">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className={cn(checkboxClass, "mt-0.5")} />
                <span>{t("mk.auth.agree")}</span>
              </label>
              <FieldError>{errors.agree}</FieldError>
            </div>
            <button type="submit" disabled={busy} className={primaryButton}>
              {t("mk.auth.create")}
            </button>
          </form>
        )}

        {step === "code" && (
          <form className="flex flex-col gap-5" onSubmit={verify} noValidate>
            {backLink}
            <h1 className={titleClass}>{t("mk.auth.codeTitle")}</h1>
            <p className={faLead}>{withId(t("mk.auth.codeSub", { id: "__ID__" }))}</p>
            <div>
              <FieldLabel htmlFor="auth-code">{t("mk.auth.code")}</FieldLabel>
              <InputBox invalid={!!errors.code}>
                <input
                  id="auth-code"
                  name="one-time-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(toLatin(e.target.value).replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  aria-invalid={!!errors.code}
                  className={cn(inputClass, "text-center font-mono text-2xl tracking-[0.5em]")}
                />
              </InputBox>
              <FieldError>{errors.code}</FieldError>
            </div>
            <button type="submit" disabled={busy} className={primaryButton}>
              {t("mk.auth.verify")}
            </button>
            <p className="text-center text-[14px] text-[#3a4855]">
              {resendIn > 0 ? (
                t("mk.auth.resendIn", { n: formatNumber(resendIn, locale) })
              ) : (
                <button type="button" className={coralLink} onClick={() => auth.otpSend.mutate({ phone: toLatin(id) }, { onSuccess: () => setResendIn(60) })}>
                  {t("mk.auth.resend")}
                </button>
              )}
            </p>
          </form>
        )}

        <PrototypeNote>
          <span className="[&:lang(fa)]:leading-[22px]">
            {t("mk.auth.prototype")
              .split("sara@example.com")
              .flatMap((part, i) => (i ? [<bdi key={i} dir="ltr">sara@example.com</bdi>, part] : [part]))}
          </span>
        </PrototypeNote>
      </div>
    </AuthShell>
  );
}
