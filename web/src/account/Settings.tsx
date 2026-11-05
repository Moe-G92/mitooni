import { useState } from "react";
import type { LearnerProfile as Profile, ProfileChanges } from "./contracts";
type Skill = "listening" | "reading" | "writing" | "speaking";
import { useAccount } from "./state";
import { useWords } from "./locale";
import { ErrorNotice } from "./ErrorNotice";
import { useT } from "./locale";
import { formatBand } from "@/lib/format";
import { PageHeader } from "./PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "./Button";
import { Field, Input, Select } from "@/components/ui/form";
import { LanguageSwitch } from "./LanguageSwitch";

const BANDS = Array.from({ length: 19 }, (_, i) => i * 0.5);
const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

export default function Settings() {
  const { t, locale } = useT();
  const account = useAccount();
  const w = useWords();
  const [draft, setDraft] = useState<Profile>(account.account!.profile!);
  const [saved, setSaved] = useState(false);
  const [savedLocale, setSavedLocale] = useState(locale);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [operation, setOperation] = useState<{
    body: ProfileChanges;
    key: string;
    revision: number;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const patch = async (body: ProfileChanges) => {
    if (!account.account?.membership.entitlements.includes("profile:write"))
      return;
    const op =
      operation && JSON.stringify(operation.body) === JSON.stringify(body)
        ? operation
        : {
            body,
            key: crypto.randomUUID(),
            revision: account.account!.profile!.revision,
          };
    setOperation(op);
    setPending(true);
    setFailure(null);
    setSaved(false);
    try {
      const next = await account.update(op.body, op.key, op.revision);
      if (next.profile) setDraft(next.profile);
      setOperation(null);
      setSavedLocale(locale);
      setSaved(true);
    } catch (err) {
      setFailure(err);
    } finally {
      setPending(false);
    }
  };
  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setErrors({ name: w.required });
      return;
    }
    setErrors({});
    void patch({
      name: draft.name.trim(),
      targets: draft.targets,
      testDate: draft.testDate || null,
      currentLevel: draft.currentLevel,
      weeklyHours: draft.weeklyHours,
      locale,
      showFlag: draft.showFlag,
      notifications: draft.notifications,
    });
  };
  const writable =
    account.account!.membership.entitlements.includes("profile:write");
  return (
    <>
      <PageHeader
        title={t("settings.title")}
        chips={
          saved && savedLocale === locale ? (
            <span role="status" className="text-sm text-strength">
              {t("settings.saved")}
            </span>
          ) : undefined
        }
      />
      {failure != null && (
        <ErrorNotice
          error={failure}
          onReload={() => {
            account.reload();
            setOperation(null);
          }}
        />
      )}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7">
          <form
            onSubmit={saveProfile}
            onChange={() => setSaved(false)}
            noValidate
            className="flex flex-col gap-4"
          >
            <fieldset disabled={pending || !writable} className="contents">
              <CardLabel title={t("settings.profile")} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={t("settings.name")}
                  htmlFor="s-name"
                  error={errors.name}
                >
                  <Input
                    id="s-name"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>
                <Field
                  label={t("settings.email")}
                  htmlFor="s-email"
                  error={errors.email}
                >
                  <Input
                    id="s-email"
                    type="email"
                    dir="ltr"
                    value={account.account!.identity.email ?? ""}
                    readOnly
                  />
                </Field>
              </div>
              <CardLabel title={t("settings.targets")} className="mt-3" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {(["overall", ...SKILLS] as const).map((k) => (
                  <Field
                    key={k}
                    label={
                      k === "overall" ? t("skills.overall") : t(`skills.${k}`)
                    }
                    htmlFor={`s-${k}`}
                  >
                    <Select
                      id={`s-${k}`}
                      value={draft.targets[k]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          targets: {
                            ...draft.targets,
                            [k]: Number(e.target.value),
                          },
                        })
                      }
                    >
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
                <Field label={t("settings.testDate")} htmlFor="s-date">
                  <Input
                    id="s-date"
                    type="date"
                    dir="ltr"
                    value={draft.testDate ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, testDate: e.target.value || null })
                    }
                  />
                </Field>
                <Field label={t("onboarding.hours")} htmlFor="s-hours">
                  <Input
                    id="s-hours"
                    type="number"
                    min={0}
                    max={60}
                    value={draft.weeklyHours}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        weeklyHours: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>
              <div>
                <Button type="submit" disabled={pending || !writable}>
                  {t("common.save")}
                </Button>
              </div>
            </fieldset>
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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
