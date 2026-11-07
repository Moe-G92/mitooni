import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { type EditableProfile, Editable } from "./contracts";
type Skill = "listening" | "reading" | "writing" | "speaking";
import { useAccount } from "./state";
import { useWords } from "./locale";
import { ErrorNotice } from "./ErrorNotice";
import { useT } from "./locale";
import { formatBand, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";
import { LanguageSwitch } from "./LanguageSwitch";
import { Button } from "./Button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { RadioChoices } from "./RadioChoices";

const BANDS = Array.from({ length: 19 }, (_, i) => i * 0.5);
const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const STEPS = 2;

/* Onboarding from the mitooni canvas: two steps, the band first, then the test date and weekly hours. */
export default function Onboarding() {
  const { t, locale } = useT();
  const account = useAccount();
  const w = useWords();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [operation, setOperation] = useState<{
    body: EditableProfile;
    key: string;
  } | null>(null);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [step, setStep] = useState(1);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step) {
      stepHeading.current?.focus({ preventScroll: true });
      previousStep.current = step;
    }
  }, [step]);
  const [targets, setTargets] = useState<EditableProfile["targets"]>({
    overall: -1,
    listening: -1,
    reading: -1,
    writing: -1,
    speaking: -1,
  });
  const [sameForAll, setSameForAll] = useState(true);
  const [booked, setBooked] = useState(false);
  const [testDate, setTestDate] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [error, setError] = useState<string>();

  const setOverall = (b: number) =>
    setTargets((tg) =>
      sameForAll
        ? { overall: b, listening: b, reading: b, writing: b, speaking: b }
        : { ...tg, overall: b },
    );

  const finish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!name.trim() || Object.values(targets).some((b) => b < 0))
      return setError(w.required);
    if (step < STEPS) return setStep(STEPS);
    if (
      booked &&
      (!testDate || new Date(testDate) < new Date(new Date().toDateString()))
    )
      return setError(t("onboarding.errDate"));
    const h = Number(weeklyHours);
    if (!weeklyHours.trim() || !Number.isInteger(h) || h < 0 || h > 60)
      return setError(t("onboarding.errHours"));
    const patch: EditableProfile = {
      name: name.trim(),
      theme: "system",
      currentLevel: null,
      showFlag: true,
      notifications: { email: false, reminders: false },
      targets,
      testDate: booked ? testDate : null,
      weeklyHours: h,
      locale,
    };
    const parsed = Editable.safeParse(patch);
    if (!parsed.success) return setError(w.required);
    const op =
      operation && JSON.stringify(operation.body) === JSON.stringify(patch)
        ? operation
        : { body: patch, key: crypto.randomUUID() };
    setOperation(op);
    setPending(true);
    setFailure(null);
    try {
      await account.onboard(op.body, op.key);
      navigate("/app", { replace: true });
    } catch (err) {
      setFailure(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-pink-tint">
        <header className="mx-auto flex h-18 max-w-3xl items-center gap-2 px-4">
          <BrandMark to="/" />
          <div className="ms-auto flex gap-2">
            <LanguageSwitch />
          </div>
        </header>
      </div>
      <main className="mx-auto max-w-xl px-4 pt-6 pb-16">
        <p className="text-sm text-muted-foreground">
          {t("onboarding.step", {
            n: formatNumber(step, locale),
            total: formatNumber(STEPS, locale),
          })}
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => (
            <i
              key={i}
              className={cn(
                "h-1 flex-1 rounded transition-colors",
                i < step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>

        <form
          onSubmit={finish}
          noValidate
          className="mt-8 rounded-card border border-border bg-card p-6 sm:p-8"
        >
          {step === 1 && (
            <fieldset disabled={pending}>
              <legend>
                <h1
                  ref={stepHeading}
                  tabIndex={-1}
                  className="text-2xl font-semibold tracking-tight"
                >
                  {t("onboarding.s1Title")}
                </h1>
              </legend>
              <div className="mt-6">
                <Field label={w.name} htmlFor="onboarding-name">
                  <Input
                    id="onboarding-name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-6">
                <Label id="overall-label">{t("onboarding.overall")}</Label>
                {/* A band scale reads left to right in both languages, as on the Persian canvas. */}
                <RadioChoices
                  labelledBy="overall-label"
                  dir="ltr"
                  value={targets.overall}
                  onChange={setOverall}
                  options={BANDS.map((band) => ({
                    value: band,
                    label: formatBand(band, locale),
                  }))}
                  className="grid grid-cols-5 gap-2 sm:grid-cols-6"
                  choiceClassName={(checked) =>
                    cn(
                      "rounded-xl font-archivo text-[15px] tabular-nums",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent",
                    )
                  }
                />
              </div>
              <label className="mt-5 flex min-h-11 items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={!sameForAll}
                  onChange={(e) => setSameForAll(!e.target.checked)}
                />
                {t("onboarding.perSkill")}
              </label>
              {!sameForAll && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {SKILLS.map((s) => (
                    <Field key={s} label={t(`skills.${s}`)} htmlFor={`t-${s}`}>
                      <Select
                        id={`t-${s}`}
                        value={targets[s]}
                        onChange={(e) =>
                          setTargets((tg) => ({
                            ...tg,
                            [s]: Number(e.target.value),
                          }))
                        }
                      >
                        <option value={-1}>—</option>
                        {BANDS.map((b) => (
                          <option key={b} value={b}>
                            {formatBand(b, locale)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {step === 2 && (
            <fieldset disabled={pending} className="flex flex-col gap-5">
              <legend>
                <h1
                  ref={stepHeading}
                  tabIndex={-1}
                  className="text-2xl font-semibold tracking-tight"
                >
                  {t("onboarding.s2Title")}
                </h1>
              </legend>
              <div>
                <RadioChoices<"yes" | "no">
                  label={t("onboarding.booked")}
                  value={booked ? "yes" : "no"}
                  onChange={(v) => setBooked(v === "yes")}
                  className="inline-flex gap-0.5 rounded-[10px] bg-muted p-0.5"
                  choiceClassName={(checked) =>
                    cn(
                      "rounded-lg px-3 text-xs",
                      checked
                        ? "border-primary bg-card text-foreground shadow-sm"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )
                  }
                  options={[
                    { value: "yes", label: t("onboarding.bookedYes") },
                    { value: "no", label: t("onboarding.bookedNo") },
                  ]}
                />
              </div>
              {booked && (
                <Field label={t("onboarding.testDate")} htmlFor="test-date">
                  <Input
                    id="test-date"
                    type="date"
                    dir="ltr"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                  />
                </Field>
              )}
              <Field label={t("onboarding.hours")} htmlFor="hours">
                <Input
                  id="hours"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={60}
                  dir="ltr"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  className="w-32"
                />
              </Field>
            </fieldset>
          )}

          {failure != null && <ErrorNotice error={failure} />}
          {error && (
            <p role="alert" className="mt-4 text-sm text-weak">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                key="back"
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => (setError(undefined), setStep(1))}
              >
                {t("onboarding.back")}
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS ? (
              <Button key="next" type="submit">
                {t("common.next")}
              </Button>
            ) : (
              <Button key="finish" type="submit" disabled={pending}>
                {t("onboarding.finish")}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
