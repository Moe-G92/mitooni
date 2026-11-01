import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, BookOpen, CalendarClock, Clock, Headphones, Mic, PenLine } from "lucide-react";
import type { Skill, TestSummary } from "@/api/schemas";
import { useAttempts, useDiscardAttempt, useMe, useProgress, useTests, useUpdateMe } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, EmptyState, Skeleton } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { numClass, SKILL_TONE } from "@/components/dashboard/styles";
import "@/components/dashboard/dashboard.css";

const SKILL_ICON: Record<Skill, typeof Clock> = { listening: Headphones, reading: BookOpen, writing: PenLine, speaking: Mic };
const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

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
        <button
          type="button"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/40 px-[18px] text-[15px] text-white transition-colors hover:bg-white/10 focus-visible:outline-canary-yellow"
        >
          <CalendarClock className="size-4" aria-hidden="true" /> {current ? t("mocks.reschedule") : t("mocks.schedule")}
        </button>
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

/* Mock library strip: every full mock taken so far, the next one, then "and counting". */
function Library({ bands }: { bands: number[] }) {
  const { t, locale } = useT();
  const done = bands.length;
  // Up to four finished tests, newest last, then the next one and three empty slots.
  const shown = bands.map((b, i) => ({ n: i + 1, band: b })).slice(-4);
  return (
    <section
      aria-labelledby="library-title"
      className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-5.5 rounded-[24px] border border-border bg-card px-5 py-5.5 sm:px-6.5"
    >
      <div className="min-w-0 flex-[0_1_auto]">
        <h2 id="library-title" className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
          {t("mocks.library")}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5">
          <span className="font-archivo text-[44px] leading-none font-extrabold text-midnight-iris">{t("mocks.unlimited")}</span>
          <span className="font-archivo text-xl font-bold text-midnight-iris">{t("mocks.fullMocks")}</span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          <b className="text-strength">{t("mocks.doneSoFar", { count: done, n: formatNumber(done, locale) })}</b> · {t("mocks.asOften")}
        </p>
      </div>
      <ol className="grid min-w-0 flex-[1_1_520px] grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.5fr)] gap-2 sm:grid-cols-[repeat(8,minmax(0,1fr))_minmax(0,1.5fr)]">
        {shown.map((x, i) => (
          <li
            key={x.n}
            className={cn("dash-tile rounded-xl border border-[#b9e3a6] bg-strength-soft px-1 py-2 text-center", i < shown.length - 3 && "hidden sm:block")}
            style={{ animationDelay: `${0.05 * (i + 1)}s` }}
          >
            <div className="text-[11px] font-bold text-strength">{t("mocks.testN", { n: formatNumber(x.n, locale) })}</div>
            <div dir="ltr" className={cn(numClass, "mt-0.5 text-lg font-bold text-strength")}>
              {formatBand(x.band, locale)}
            </div>
          </li>
        ))}
        <li className="dash-tile-next rounded-xl border-2 border-coral bg-white px-[3px] py-[7px] text-center">
          <div className="text-[11px] font-bold text-weak">{t("mocks.testN", { n: formatNumber(done + 1, locale) })}</div>
          <div className="mt-0.5 text-[13px] leading-[22px] font-extrabold text-weak">{t("mocks.next")}</div>
        </li>
        {Array.from({ length: 7 - shown.length }, (_, i) => (
          <li
            key={i}
            aria-hidden="true"
            className={cn(
              "dash-tile-fade rounded-xl border border-dashed border-[#c3cbef] bg-[#F4F6FF] px-1 py-2 text-center",
              // On a phone the row holds three tiles before "next"; empty slots fill it when fewer tests are done.
              i >= 3 - shown.length && "hidden sm:block",
            )}
            style={{ ["--op" as string]: Math.max(0.25, 0.85 - i * 0.25), animationDelay: `${0.05 * (shown.length + 2 + i)}s` }}
          >
            <div className="text-[11px] font-bold text-[#6b77b8]">{t("mocks.testN", { n: formatNumber(done + 2 + i, locale) })}</div>
            <div className="mt-0.5 font-archivo text-lg font-bold text-[#c3cbef]">·</div>
          </li>
        ))}
        <li className="dash-tile flex flex-col justify-center rounded-xl bg-midnight-iris px-1.5 py-2 text-center text-white" style={{ animationDelay: "0.5s" }}>
          <div aria-hidden="true" className="dash-loop font-archivo text-[26px] leading-none font-extrabold text-canary-yellow">
            ∞
          </div>
          <div className="mt-0.5 text-[11px] font-bold">{t("mocks.andCounting")}</div>
        </li>
      </ol>
    </section>
  );
}

/* Full test card: Deep Wisteria, Coral start button and the order and timing of the four parts. */
function FullTestCard({ test }: { test: TestSummary }) {
  const { t, locale } = useT();
  const me = useMe();
  const segments = [
    { skill: "listening" as const, flex: 30, short: "L", min: 30 },
    { skill: "reading" as const, flex: 60, short: null, min: 60 },
    { skill: "writing" as const, flex: 60, short: null, min: 60 },
  ];
  return (
    <section aria-labelledby="full-title" className="relative col-span-full min-w-0 overflow-hidden rounded-[24px] bg-primary px-6 py-7 text-white sm:px-7.5">
      <div aria-hidden="true" className="pointer-events-none absolute -end-[90px] -top-[90px] size-[300px] rounded-full border-2 border-white/[0.07]" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-xs font-semibold tracking-[0.08em] uppercase">{t("mocks.fullPill")}</span>
          <h2 id="full-title" className="mt-3.5 font-archivo text-[28px] leading-9 font-bold tracking-[-0.015em]">
            {test.title}
          </h2>
          <p className="mt-1.5 max-w-[560px] text-[15px] text-white/85">{t("mocks.fullLead")}</p>
        </div>
        <span className="rounded-full border border-white/30 px-3 py-1 text-[13px] text-white/90">{t("common.academic")}</span>
      </div>
      <div
        className="relative mt-5.5 flex h-11 gap-1"
        role="img"
        aria-label={t("mocks.timingLabel")}
      >
        {segments.map((s, i) => (
          <div
            key={s.skill}
            className={cn(
              "flex min-w-0 items-center gap-1.5 overflow-hidden bg-white/15 px-2.5 text-[13px] whitespace-nowrap",
              i === 0 ? "rounded-s-[10px] rounded-e-[4px]" : "rounded-[4px]",
            )}
            style={{ flex: s.flex }}
          >
            <b>{s.short ?? t(`skills.${s.skill}`)}</b>
            <span className="hidden text-white/80 sm:inline">{t("overview.minutes", { n: formatNumber(s.min, locale) })}</span>
          </div>
        ))}
        <div className="flex min-w-0 items-center justify-center overflow-hidden rounded-s-[4px] rounded-e-[10px] bg-coral px-1.5 text-[13px] whitespace-nowrap" style={{ flex: 22 }}>
          <b>S</b>
        </div>
      </div>
      <div className="relative mt-5.5 flex flex-wrap items-center gap-2.5">
        <Link
          to={`/exam/new/${test.id}`}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-coral px-5 text-[15px] font-semibold text-white transition-colors hover:bg-weak focus-visible:outline-canary-yellow"
        >
          {t("mocks.startFull")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
        <ScheduleDialog />
        <span className="inline-flex items-center gap-1.5 text-sm text-white/90 sm:ms-auto">
          <Clock className="size-4" aria-hidden="true" />
          {t("mocks.length")}
        </span>
      </div>
      {(me.data?.scheduledMock || (me.data && me.data.accommodation !== 1)) && (
        <div className="relative mt-3 text-sm text-white/90">
          {me.data?.scheduledMock && <p>{t("mocks.scheduledFor", { date: formatDateTime(me.data.scheduledMock, locale) })}</p>}
          {me.data && me.data.accommodation !== 1 && <p>{t("mocks.extraTime", { x: formatNumber(me.data.accommodation, locale) })}</p>}
        </div>
      )}
    </section>
  );
}

function SkillTestCard({ test }: { test: TestSummary }) {
  const { t, locale } = useT();
  const skill = test.skills[0];
  const tone = SKILL_TONE[skill];
  const Icon = SKILL_ICON[skill];
  const detail = t(`mocks.shape.${skill}`, { n: formatNumber(test.questions, locale) });
  const time = skill === "speaking" ? t("mocks.speakingLength") : skill === "listening" ? t("mocks.about", { time: t("overview.minutes", { n: formatNumber(test.minutes, locale) }) }) : t("overview.minutes", { n: formatNumber(test.minutes, locale) });
  return (
    <section className={cn("flex min-w-0 flex-col rounded-card p-5", skill === "writing" || skill === "reading" ? "bg-pink-tint" : tone.soft)}>
      <div className="flex items-center justify-between">
        <span aria-hidden="true" className={cn("grid size-10 place-items-center rounded-xl text-white", tone.solid)}>
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        <span className="text-[11px] font-semibold tracking-[0.08em] text-[#3a4855] uppercase">{t("mocks.skillTest")}</span>
      </div>
      <h3 className={cn("mt-3.5 text-lg leading-[1.4] font-semibold", tone.ink)}>{t(`skills.${skill}`)}</h3>
      <p className="mt-1.5 text-sm text-[#3a4855]">{detail}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-[18px]">
        <Link
          to={`/exam/new/${test.id}`}
          aria-label={t("mocks.startSkill", { skill: t(`skills.${skill}`) })}
          className={cn("inline-flex h-9 items-center rounded-[10px] px-3.5 text-sm font-medium text-white transition-[filter] hover:brightness-110", tone.solid)}
        >
          {t("common.start")}
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[#3a4855]">
          <Clock className="size-3.5" aria-hidden="true" />
          {time}
        </span>
      </div>
    </section>
  );
}

export default function Mocks() {
  const { t, locale } = useT();
  const full = useTests("full");
  const sections = useTests("section");
  const progress = useProgress();
  const open = useAttempts("in-progress");
  const discard = useDiscardAttempt();
  const mockOpen = open.data?.filter((a) => a.mode === "exam") ?? [];
  const bands = (progress.data?.trend ?? []).map((p) => p.band);
  const sectionList = [...(sections.data ?? [])].sort((a, b) => SKILLS.indexOf(a.skills[0]) - SKILLS.indexOf(b.skills[0]));

  return (
    <>
      <PageHeader title={t("mocks.pageTitle")} sub={t("mocks.sub")} />
      {progress.isLoading ? <Skeleton className="mb-4 h-32" /> : <Library bands={bands} />}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-stretch gap-4">
        {full.isLoading ? <Skeleton className="col-span-full h-72" /> : full.data?.[0] && <FullTestCard test={full.data[0]} />}

        <div className="col-span-full mt-3.5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg leading-7 font-semibold">{t("mocks.skillTests")}</h2>
          <span className="text-sm text-muted-foreground">{t("mocks.skillTestsNote")}</span>
        </div>

        {sections.isLoading ? (
          <Skeleton className="col-span-full h-40" />
        ) : sectionList.length ? (
          sectionList.map((test) => <SkillTestCard key={test.id} test={test} />)
        ) : (
          <div className="col-span-full">
            <EmptyState title={t("errors.load")} />
          </div>
        )}

        {mockOpen.length > 0 && (
          <section className="col-span-full mt-2 min-w-0 rounded-card border border-border bg-card px-5.5 py-4.5">
            <h2 className="text-[15px] font-medium">{t("mocks.inProgress")}</h2>
            <ul className="mt-2">
              {mockOpen.map((a) => {
                const st = a.sections[a.sectionIndex];
                const skill = st ? (a.sections.length === 1 ? sectionSkill(a.testId, sectionList) : null) : null;
                const tone = skill ? SKILL_TONE[skill] : null;
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span
                      aria-hidden="true"
                      className={cn("grid size-7 place-items-center rounded-lg text-[13px] font-bold", tone ? cn(skill === "writing" || skill === "reading" ? "bg-pink-tint" : tone.soft, tone.ink) : "bg-pale-wisteria text-primary")}
                    >
                      {tone ? tone.letter : <Clock className="size-4" />}
                    </span>
                    <div className="min-w-[min(100%,14rem)] flex-1">
                      <div className="font-medium">
                        {a.testTitle} <span className="text-xs font-normal text-muted-foreground">· {skill ? t("mocks.skillTestTag") : t("mocks.fullTag")}</span>
                      </div>
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
          </section>
        )}
      </div>
    </>
  );
}

function sectionSkill(testId: string, list: TestSummary[]): Skill | null {
  return list.find((x) => x.id === testId)?.skills[0] ?? null;
}
