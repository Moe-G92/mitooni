import { useState } from "react";
import { useNavigate } from "react-router";
import type { Profile, Skill, ThemeChoice } from "@/api/schemas";
import { useMe, useUpdateMe } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatNumber } from "@/lib/format";
import { setPrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitch } from "@/components/TopControls";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Segmented } from "@/components/ui/misc";

const BANDS = Array.from({ length: 11 }, (_, i) => 4 + i * 0.5);
const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const STEPS = 3;

export default function Onboarding() {
  const { t, locale } = useT();
  const me = useMe();
  const update = useUpdateMe();
  const navigate = useNavigate();
  const p = me.data!;
  const [step, setStep] = useState(1);
  const [targets, setTargets] = useState(p.targets);
  const [sameForAll, setSameForAll] = useState(true);
  const [booked, setBooked] = useState(!!p.testDate);
  const [testDate, setTestDate] = useState(p.testDate ?? "");
  const [weeklyHours, setWeeklyHours] = useState(String(p.weeklyHours || 6));
  const [level, setLevel] = useState<string>(p.currentLevel ? String(p.currentLevel) : "");
  const [theme, setTheme] = useState<ThemeChoice>(p.theme);
  const [error, setError] = useState<string>();

  const setOverall = (b: number) =>
    setTargets((tg) => (sameForAll ? { overall: b, listening: b, reading: b, writing: b, speaking: b } : { ...tg, overall: b }));

  const next = () => {
    setError(undefined);
    if (step === 2) {
      if (booked && (!testDate || new Date(testDate) < new Date(new Date().toDateString()))) return setError(t("onboarding.errDate"));
      const h = Number(weeklyHours);
      if (!Number.isFinite(h) || h < 1 || h > 60) return setError(t("onboarding.errHours"));
    }
    setStep((s) => Math.min(STEPS, s + 1));
  };

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    const patch: Partial<Profile> = {
      targets,
      testDate: booked ? testDate : null,
      weeklyHours: Number(weeklyHours),
      currentLevel: level ? Number(level) : null,
      theme,
      locale,
      onboarded: true,
    };
    setPrefs({ theme });
    update.mutate(patch, { onSuccess: () => navigate("/app", { replace: true }) });
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
        <BrandMark to="/" />
        <div className="ms-auto flex gap-2">
          <LanguageSwitch />
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-6 pb-16">
        <p className="text-sm text-muted-foreground">{t("onboarding.step", { n: formatNumber(step, locale), total: formatNumber(STEPS, locale) })}</p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => (
            <i key={i} className={cn("h-1 flex-1 rounded", i < step ? "bg-primary" : "bg-border")} />
          ))}
        </div>

        <form onSubmit={finish} noValidate className="mt-8 rounded-card border border-border bg-card p-6 sm:p-8">
          {step === 1 && (
            <fieldset>
              <legend className="text-2xl font-semibold tracking-tight">{t("onboarding.s1Title")}</legend>
              <p className="mt-1.5 text-muted-foreground">{t("onboarding.s1Sub", { name: p.name.split(" ")[0] })}</p>
              <div className="mt-6">
                <Label id="overall-label">{t("onboarding.overall")}</Label>
                <div role="radiogroup" aria-labelledby="overall-label" className="grid grid-cols-6 gap-2">
                  {BANDS.filter((b) => b >= 5).map((b) => (
                    <button
                      key={b}
                      type="button"
                      role="radio"
                      aria-checked={targets.overall === b}
                      onClick={() => setOverall(b)}
                      className={cn("h-11 rounded-xl border font-mono", targets.overall === b ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent")}
                    >
                      {formatBand(b, locale)}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-5 flex items-center gap-2.5 text-sm">
                <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={!sameForAll} onChange={(e) => setSameForAll(!e.target.checked)} />
                {t("onboarding.perSkill")}
              </label>
              {!sameForAll && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {SKILLS.map((s) => (
                    <Field key={s} label={t(`skills.${s}`)} htmlFor={`t-${s}`}>
                      <Select id={`t-${s}`} value={targets[s]} onChange={(e) => setTargets((tg) => ({ ...tg, [s]: Number(e.target.value) }))}>
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
            <fieldset className="flex flex-col gap-5">
              <legend className="text-2xl font-semibold tracking-tight">{t("onboarding.s2Title")}</legend>
              <Segmented<"yes" | "no">
                label={t("onboarding.booked")}
                value={booked ? "yes" : "no"}
                onChange={(v) => setBooked(v === "yes")}
                items={[
                  { value: "yes", label: t("onboarding.bookedYes") },
                  { value: "no", label: t("onboarding.bookedNo") },
                ]}
              />
              {booked && (
                <Field label={t("onboarding.testDate")} htmlFor="test-date" hint={t("onboarding.testDateHint")}>
                  <Input id="test-date" type="date" dir="ltr" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
                </Field>
              )}
              <Field label={t("onboarding.hours")} htmlFor="hours" hint={t("onboarding.hoursHint")}>
                <Input id="hours" type="number" inputMode="numeric" min={1} max={60} dir="ltr" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} className="w-32" />
              </Field>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset className="flex flex-col gap-5">
              <legend className="text-2xl font-semibold tracking-tight">{t("onboarding.s3Title")}</legend>
              <Field label={t("onboarding.level")} htmlFor="level" hint={t("onboarding.levelHint")}>
                <Select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">{t("onboarding.levelUnknown")}</option>
                  {BANDS.map((b) => (
                    <option key={b} value={b}>
                      {formatBand(b, locale)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div>
                <Label>{t("onboarding.language")}</Label>
                <LanguageSwitch />
              </div>
              <div>
                <Label id="theme-label">{t("onboarding.theme")}</Label>
                <Segmented<ThemeChoice>
                  label={t("onboarding.theme")}
                  value={theme}
                  onChange={(v) => {
                    setTheme(v);
                    setPrefs({ theme: v });
                  }}
                  items={[
                    { value: "system", label: t("settings.themeSystem") },
                    { value: "light", label: t("settings.themeLight") },
                    { value: "dark", label: t("settings.themeDark") },
                  ]}
                />
              </div>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm text-weak">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button key="back" type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                {t("common.back")}
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS ? (
              <Button key="next" type="button" onClick={next}>
                {t("common.next")}
              </Button>
            ) : (
              <Button key="finish" type="submit" disabled={update.isPending}>
                {t("onboarding.finish")}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
