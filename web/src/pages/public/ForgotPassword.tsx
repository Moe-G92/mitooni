import { useState } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "@/api/queries";
import { useT } from "@/i18n";
import { emailOk } from "@/lib/validate";
import { cn } from "@/lib/utils";
import { AuthShell, BackLink, FieldError, FieldLabel, InputBox, inputClass, leadClass, primaryButton, titleClass } from "@/components/ui/sign-in";
import { OopsPanel } from "@/components/public/auth/AuthPanel";

export default function ForgotPassword() {
  const { t } = useT();
  const { forgot } = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [error, setError] = useState<string>();

  const back = <BackLink to="/sign-in">{t("mk.auth.backToSignIn")}</BackLink>;

  return (
    <AuthShell panel={<OopsPanel />}>
      {forgot.isSuccess ? (
        <div className="flex flex-col gap-5">
          {back}
          <h1 className={titleClass}>{t("mk.auth.checkEmail")}</h1>
          <p className={cn(leadClass, "[&:lang(fa)]:leading-[1.7]")} role="status">
            {t("mk.auth.checkEmailSub", { email: "__E__" })
              .split("__E__")
              .flatMap((part, i) =>
                i
                  ? [
                      <bdi key={i} dir="ltr" className="font-medium text-foreground">
                        {email}
                      </bdi>,
                      part,
                    ]
                  : [part],
              )}
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
          <h1 className={titleClass}>{t("mk.auth.forgotTitle")}</h1>
          <p className={cn(leadClass, "[&:lang(fa)]:leading-[1.7]")}>{t("mk.auth.forgotSub")}</p>
          <div>
            <FieldLabel htmlFor="email">{t("mk.auth.email")}</FieldLabel>
            <InputBox invalid={!!error}>
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
                aria-describedby={error ? "email-err" : undefined}
                className={cn(inputClass, "text-start")}
              />
            </InputBox>
            <FieldError id="email-err">{error}</FieldError>
          </div>
          <button type="submit" disabled={forgot.isPending} className={primaryButton}>
            {t("mk.auth.sendLink")}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
