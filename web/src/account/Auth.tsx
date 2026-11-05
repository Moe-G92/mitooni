import { useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router";
import {
  AuthShell,
  BackLink,
  FieldLabel,
  InputBox,
  inputClass,
  PasswordInput,
  primaryButton,
  titleClass,
  FieldError,
} from "./AuthShell";
import { ProgressPanel } from "./AuthPanel";
import { useWords } from "./locale";
import { useAccount } from "./state";
import { safeNext } from "@/auth/redirect";

export default function Auth() {
  const w = useWords();
  const { session } = useAccount();
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [restart, setRestart] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(true);
        return;
      }
      setError(false);
      setStep("password");
      return;
    }
    setPending(true);
    setError(false);
    try {
      await session.signIn(email.trim(), password);
      navigate(safeNext(query.get("next")), { replace: true });
    } catch (err) {
      setRestart(
        err instanceof Error && err.message === "auth_restart_required",
      );
      setError(true);
    } finally {
      setPending(false);
    }
  }
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  if (snapshot.phase === "authenticated")
    return <Navigate to={safeNext(query.get("next"))} replace />;
  return (
    <AuthShell panel={<ProgressPanel variant="identify" />}>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <h1 className={titleClass}>{w.signin}</h1>
        {step === "email" ? (
          <div>
            <FieldLabel htmlFor="account-email">{w.email}</FieldLabel>
            <InputBox invalid={error}>
              <input
                id="account-email"
                name="email"
                type="email"
                autoComplete="username"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </InputBox>
          </div>
        ) : (
          <>
            <BackLink
              onClick={() => {
                setStep("email");
                setPassword("");
                setError(false);
              }}
            >
              {w.back}
            </BackLink>
            <p dir="ltr" className="text-sm">
              {email}
            </p>
            <div>
              <FieldLabel htmlFor="account-password">{w.password}</FieldLabel>
              <PasswordInput
                id="account-password"
                value={password}
                onChange={setPassword}
                placeholder=""
                autoComplete="current-password"
                invalid={error}
                showLabel={w.showPassword}
                hideLabel={w.hidePassword}
              />
            </div>
          </>
        )}
        {error && <FieldError>{w.error}</FieldError>}
        {restart && (
          <button
            type="button"
            className={primaryButton}
            onClick={() => location.reload()}
          >
            {w.retry}
          </button>
        )}
        <button
          type="submit"
          className={primaryButton}
          disabled={pending || (step === "password" && !password)}
        >
          {pending ? w.saving : w.continue}
        </button>
      </form>
    </AuthShell>
  );
}
