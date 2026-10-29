import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/api/queries";
import { useT } from "@/i18n";
import { emailOk } from "@/lib/validate";
import { AuthShell, FieldError, FieldLabel, GlassInputWrapper, glassInput } from "@/components/ui/sign-in";

export default function ForgotPassword() {
  const { t } = useT();
  const { forgot } = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [error, setError] = useState<string>();

  const back = (
    <Link to="/sign-in" className="animate-element inline-flex items-center gap-1.5 text-sm text-[#037BB5] hover:underline dark:text-[#7cc8ef]">
      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" /> {t("auth.backToSignIn")}
    </Link>
  );

  return (
    <AuthShell>
      {forgot.isSuccess ? (
        <div className="flex flex-col gap-5">
          {back}
          <h1 className="animate-element animate-delay-100 font-archivo text-4xl leading-tight font-semibold tracking-[-0.02em]">{t("auth.checkEmail")}</h1>
          <p className="animate-element animate-delay-200 text-mk-body">
            {t("auth.checkEmailSub", { email: "__E__" })
              .split("__E__")
              .flatMap((part, i) => (i ? [<bdi key={i} dir="ltr">{email}</bdi>, part] : [part]))}
          </p>
        </div>
      ) : (
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!emailOk(email)) return setError(t("mk.auth.errEmail"));
            setError(undefined);
            forgot.mutate({ email: email.trim() });
          }}
        >
          {back}
          <h1 className="animate-element animate-delay-100 font-archivo text-4xl leading-tight font-semibold tracking-[-0.02em]">{t("auth.forgotTitle")}</h1>
          <p className="animate-element animate-delay-200 text-mk-body">{t("auth.forgotSub")}</p>
          <div className="animate-element animate-delay-300">
            <FieldLabel htmlFor="email">{t("mk.auth.email")}</FieldLabel>
            <GlassInputWrapper invalid={!!error}>
              <input
                id="email"
                type="email"
                inputMode="email"
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("mk.auth.emailPh")}
                aria-invalid={!!error}
                className={glassInput}
              />
            </GlassInputWrapper>
            <FieldError>{error}</FieldError>
          </div>
          <button type="submit" disabled={forgot.isPending} className="animate-element animate-delay-400 w-full rounded-2xl bg-mk-ink py-4 font-medium text-mk-page hover:bg-mk-ink/90 disabled:opacity-60">
            {t("auth.sendLink")}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
