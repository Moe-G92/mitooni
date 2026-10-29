import { useState } from "react";
import { Link } from "react-router";
import { CalendarClock, Clock, Headphones, BookOpen, PenLine, Mic } from "lucide-react";
import type { Skill } from "@/api/schemas";
import { useAttempts, useDiscardAttempt, useMe, useTests, useUpdateMe } from "@/api/queries";
import { useT } from "@/i18n";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, EmptyState, Skeleton } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";

const SKILL_ICON: Record<Skill, typeof Clock> = { listening: Headphones, reading: BookOpen, writing: PenLine, speaking: Mic };

function ScheduleDialog() {
  const { t } = useT();
  const me = useMe();
  const update = useUpdateMe();
  const [open, setOpen] = useState(false);
  const current = me.data?.scheduledMock;
  const [value, setValue] = useState(current ? current.slice(0, 16) : "");
  const [error, setError] = useState<string>();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarClock /> {current ? t("mocks.reschedule") : t("mocks.schedule")}
        </Button>
      </DialogTrigger>
      <DialogContent title={t("mocks.scheduleTitle")} description={t("mocks.scheduleSub")}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!value || new Date(value).getTime() < Date.now()) return setError(t("mocks.errFuture"));
            update.mutate({ scheduledMock: new Date(value).toISOString() }, { onSuccess: () => setOpen(false) });
          }}
        >
          <Field label={t("mocks.when")} htmlFor="mock-when" error={error}>
            <Input id="mock-when" type="datetime-local" dir="ltr" value={value} onChange={(e) => (setValue(e.target.value), setError(undefined))} />
          </Field>
          <div className="flex justify-between gap-2">
            {current && (
              <Button type="button" variant="ghost" onClick={() => update.mutate({ scheduledMock: null }, { onSuccess: () => setOpen(false) })}>
                {t("mocks.clear")}
              </Button>
            )}
            <Button type="submit" className="ms-auto" disabled={update.isPending}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Mocks() {
  const { t, locale } = useT();
  const me = useMe();
  const full = useTests("full");
  const sections = useTests("section");
  const open = useAttempts("in-progress");
  const discard = useDiscardAttempt();
  const mockOpen = open.data?.filter((a) => a.mode === "exam") ?? [];

  return (
    <>
      <PageHeader title={t("mocks.title")} sub={t("mocks.sub")} />
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7">
          <CardLabel title={t("mocks.fullTitle")} note={t("common.academic")} />
          {full.isLoading ? (
            <Skeleton className="mt-4 h-24" />
          ) : (
            full.data?.map((test) => (
              <div key={test.id} className="mt-4">
                <h3 className="text-lg font-medium">{test.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("mocks.fullDetail")}</p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  {test.skills.map((s) => {
                    const Icon = SKILL_ICON[s];
                    return (
                      <li key={s} className="flex items-center gap-1.5">
                        <Icon className="size-4" aria-hidden="true" /> {t(`skills.${s}`)}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button asChild>
                    <Link to={`/exam/new/${test.id}`}>{t("mocks.startFull")}</Link>
                  </Button>
                  <ScheduleDialog />
                </div>
                {me.data?.scheduledMock && (
                  <p className="mt-3 text-sm text-muted-foreground">{t("mocks.scheduledFor", { date: formatDateTime(me.data.scheduledMock, locale) })}</p>
                )}
                {me.data && me.data.accommodation !== 1 && (
                  <p className="mt-1 text-sm text-muted-foreground">{t("mocks.extraTime", { x: formatNumber(me.data.accommodation, locale) })}</p>
                )}
              </div>
            ))
          )}
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardLabel title={t("mocks.inProgress")} />
          {open.isLoading && <Skeleton className="mt-4 h-16" />}
          {!open.isLoading && mockOpen.length === 0 && <p className="mt-4 text-sm text-muted-foreground">{t("mocks.noneInProgress")}</p>}
          <ul className="mt-3 flex flex-col">
            {mockOpen.map((a) => {
              const st = a.sections[a.sectionIndex];
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 border-t border-border py-3 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.testTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("mocks.startedOn", { date: formatDateTime(a.startedAt, locale) })}
                      {st && ` · ${t("mocks.minutesLeft", { count: Math.ceil(st.remainingSec / 60) })}`}
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/exam/${a.id}`}>{t("common.resume")}</Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => discard.mutate(a.id)}>
                    {t("common.discard")}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="col-span-12 mt-2">
          <h2 className="mb-3 text-lg font-medium">{t("mocks.sectionTitle")}</h2>
          {sections.isLoading ? (
            <Skeleton className="h-32" />
          ) : sections.data?.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {sections.data.map((test) => {
                const skill = test.skills[0];
                const Icon = SKILL_ICON[skill];
                return (
                  <Card key={test.id} className="flex flex-col">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <h3 className="mt-3 font-medium">{t(`skills.${skill}`)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {skill === "speaking" ? t("mocks.speakingLength") : t("common.minutes", { count: test.minutes })}
                      {test.questions > 0 && ` · ${t("common.questions", { count: test.questions })}`}
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-4 self-start">
                      <Link to={`/exam/new/${test.id}`}>{t("common.start")}</Link>
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState title={t("errors.load")} />
          )}
        </div>
      </div>
    </>
  );
}
