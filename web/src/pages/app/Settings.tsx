import { useEffect, useState } from "react";
import type { Profile, Skill, ThemeChoice } from "@/api/schemas";
import { useMe, useResetDemo, useUpdateMe } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand } from "@/lib/format";
import { setPrefs, usePrefs } from "@/lib/prefs";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Segmented, Skeleton, Switch } from "@/components/ui/misc";
import { LanguageSwitch } from "@/components/TopControls";

const BANDS = Array.from({ length: 11 }, (_, i) => 4 + i * 0.5);
const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

function SwitchRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <label htmlFor={id} className="text-sm">
        {label}
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function Settings() {
  const { t, locale } = useT();
  const me = useMe();
  const update = useUpdateMe();
  const reset = useResetDemo();
  const prefs = usePrefs();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (me.data && !draft) setDraft(me.data);
  }, [me.data, draft]);

  if (!me.data || !draft) return <Skeleton className="h-96" />;

  const patch = (p: Partial<Profile>) => update.mutate(p, { onSuccess: () => (setSaved(true), setTimeout(() => setSaved(false), 2000)) });

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!draft.name.trim()) errs.name = t("auth.errName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) errs.email = t("auth.errEmail");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    patch({ name: draft.name.trim(), email: draft.email.trim(), targets: draft.targets, testDate: draft.testDate || null, accommodation: draft.accommodation });
  };

  return (
    <>
      <PageHeader title={t("settings.title")} sub={t("settings.sub")} chips={saved ? <span role="status" className="text-sm text-strength">{t("settings.saved")}</span> : undefined} />
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7">
          <form onSubmit={saveProfile} noValidate className="flex flex-col gap-4">
            <CardLabel title={t("settings.profile")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("settings.name")} htmlFor="s-name" error={errors.name}>
                <Input id="s-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label={t("settings.email")} htmlFor="s-email" error={errors.email}>
                <Input id="s-email" type="email" dir="ltr" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </Field>
            </div>
            <CardLabel title={t("settings.targets")} className="mt-3" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(["overall", ...SKILLS] as const).map((k) => (
                <Field key={k} label={k === "overall" ? t("skills.overall") : t(`skills.${k}`)} htmlFor={`s-${k}`}>
                  <Select id={`s-${k}`} value={draft.targets[k]} onChange={(e) => setDraft({ ...draft, targets: { ...draft.targets, [k]: Number(e.target.value) } })}>
                    {BANDS.map((b) => (
                      <option key={b} value={b}>
                        {formatBand(b, locale)}
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("settings.testDate")} htmlFor="s-date" hint={draft.testDate ? undefined : t("settings.noDate")}>
                <Input id="s-date" type="date" dir="ltr" value={draft.testDate ?? ""} onChange={(e) => setDraft({ ...draft, testDate: e.target.value || null })} />
              </Field>
              <Field label={t("settings.accommodation")} htmlFor="s-acc" hint={t("settings.accommodationHint")}>
                <Select id="s-acc" value={draft.accommodation} onChange={(e) => setDraft({ ...draft, accommodation: Number(e.target.value) as Profile["accommodation"] })}>
                  <option value={1}>{t("settings.standard")}</option>
                  <option value={1.25}>x1.25</option>
                  <option value={1.5}>x1.5</option>
                  <option value={2}>x2</option>
                </Select>
              </Field>
            </div>
            <div>
              <Button type="submit" disabled={update.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Card>

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
          <Card>
            <CardLabel title={t("settings.display")} />
            <div className="mt-3 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{t("settings.language")}</span>
                <LanguageSwitch />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm">{t("settings.theme")}</span>
                <Segmented<ThemeChoice>
                  label={t("settings.theme")}
                  value={prefs.theme}
                  onChange={(v) => {
                    setPrefs({ theme: v });
                    patch({ theme: v });
                  }}
                  items={[
                    { value: "system", label: t("settings.themeSystem") },
                    { value: "light", label: t("settings.themeLight") },
                    { value: "dark", label: t("settings.themeDark") },
                  ]}
                />
              </div>
            </div>
          </Card>
          <Card>
            <CardLabel title={t("settings.exam")} />
            <SwitchRow id="s-flag" label={t("settings.showFlag")} hint={t("settings.showFlagHint")} checked={me.data.showFlag} onChange={(v) => patch({ showFlag: v })} />
          </Card>
          <Card>
            <CardLabel title={t("settings.notifications")} />
            <SwitchRow id="s-email-n" label={t("settings.emailNotes")} checked={me.data.notifications.email} onChange={(v) => patch({ notifications: { ...me.data!.notifications, email: v } })} />
            <SwitchRow id="s-rem" label={t("settings.reminders")} checked={me.data.notifications.reminders} onChange={(v) => patch({ notifications: { ...me.data!.notifications, reminders: v } })} />
          </Card>
          <Card>
            <CardLabel title={t("settings.prototype")} />
            <p className="mt-1 text-xs text-muted-foreground">{t("settings.prototypeHint")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={reset.isPending} onClick={() => reset.mutate("demo", { onSuccess: () => setDraft(null) })}>
                {t("settings.resetDemo")}
              </Button>
              <Button variant="outline" size="sm" disabled={reset.isPending} onClick={() => reset.mutate("empty", { onSuccess: () => setDraft(null) })}>
                {t("settings.resetEmpty")}
              </Button>
              {reset.isSuccess && <span className="self-center text-sm text-strength">{t("settings.resetDone")}</span>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
