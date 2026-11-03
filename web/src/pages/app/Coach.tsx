import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, GraduationCap, RefreshCw, Send } from "lucide-react";
import type { CoachReview, Locale, Skill, Slot } from "@/api/schemas";
import { keys, useAttempts, useCoach, useCoachMutations, useMe, useProgress, useResult, useResults, useTests, useUpdateMe, useVocabSummary } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDate, formatDateTime, formatDayDate, formatNumber, formatShortDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent, DialogTrigger, EmptyState, ErrorState, Skeleton, Tag } from "@/components/ui/misc";
import { buildBasis, buildReviews, buildWeek, dailyMinutes, latestFull, nextMockDay, planWeekStart, startedByDay, type ItemKind } from "@/components/study/plan";
import { formatDayMonth, formatShortDay, formatWeekdayShort, toDay } from "@/components/study/dates";

const STATUS_CLASS: Record<CoachReview["status"], string> = {
  requested: "bg-secondary text-foreground",
  "in-review": "bg-fair-soft text-fair",
  returned: "bg-strength-soft text-strength",
};

function RequestReview() {
  const { t, locale } = useT();
  const results = useResults();
  const { request } = useCoachMutations();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CoachReview["kind"]>("essay");
  const [attemptId, setAttemptId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const options = (results.data ?? []).filter((r) => r.skills.some((s) => s.skill === (kind === "essay" ? "writing" : "speaking")));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send /> {t("coach.request")}
        </Button>
      </DialogTrigger>
      <DialogContent title={t("coach.requestTitle")} description={t("coach.requestSub")}>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const r = options.find((o) => o.attemptId === attemptId);
            if (!r) return setError(t("coach.errPick"));
            request.mutate(
              { kind, attemptId, title: `${r.testTitle}, ${kind === "essay" ? t("skills.writing") : t("skills.speaking")}`, message },
              { onSuccess: () => (setOpen(false), setMessage(""), setAttemptId("")) },
            );
          }}
        >
          <Field label={t("coach.what")} htmlFor="r-kind">
            <Select id="r-kind" value={kind} onChange={(e) => (setKind(e.target.value as CoachReview["kind"]), setAttemptId(""))}>
              <option value="essay">{t("coach.kindEssay")}</option>
              <option value="recording">{t("coach.kindRecording")}</option>
            </Select>
          </Field>
          <Field label={t("coach.which")} htmlFor="r-attempt" error={error}>
            <Select id="r-attempt" value={attemptId} onChange={(e) => (setAttemptId(e.target.value), setError(undefined))}>
              <option value="">{t("coach.choose")}</option>
              {options.map((o) => (
                <option key={o.attemptId} value={o.attemptId}>
                  {o.testTitle} · {formatDayDate(o.completedAt, locale)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("coach.message")} htmlFor="r-msg" hint={t("coach.messageHint")}>
            <Textarea id="r-msg" value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <Button type="submit" disabled={request.isPending}>
            {t("coach.send")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Thread({ review }: { review: CoachReview }) {
  const { t, locale } = useT();
  const { message } = useCoachMutations();
  const [text, setText] = useState("");
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium">{review.title}</h3>
        <Tag className={STATUS_CLASS[review.status]}>{t(`coach.status.${review.status}`)}</Tag>
      </div>
      <ol className="mt-4 flex flex-1 flex-col gap-3">
        {review.messages.map((m, i) => (
          <li key={i} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.author === "me" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted")}>
            <p lang="en" dir="auto">
              {m.text}
            </p>
            <span className={cn("mt-1 block text-[11px]", m.author === "me" ? "opacity-75" : "text-muted-foreground")}>{formatDateTime(m.at, locale)}</span>
          </li>
        ))}
      </ol>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          message.mutate({ id: review.id, text: text.trim() }, { onSuccess: () => setText("") });
        }}
      >
        <label htmlFor="reply" className="sr-only">
          {t("coach.reply")}
        </label>
        <input id="reply" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("coach.reply")} className="h-10 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm" />
        <Button type="submit" disabled={!text.trim() || message.isPending} aria-label={t("coach.sendReply")}>
          <Send className="rtl:-scale-x-100" />
        </Button>
      </form>
    </div>
  );
}

/** Calls and reviews, for people on the coach plan. */
function CoachDesk() {
  const { t, locale, pick } = useT();
  const c = useCoach();
  const { book, cancel } = useCoachMutations();
  const [selected, setSelected] = useState<string | null>(null);

  // A coach reply is "on its way" for a few seconds after you write; refresh until it lands.
  const waiting = c.data?.reviews.some((r) => r.messages[r.messages.length - 1]?.author === "me");
  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => c.refetch(), 2000);
    return () => window.clearInterval(id);
  }, [waiting, c]);

  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of c.data?.slots ?? []) {
      const k = s.start.slice(0, 10);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return [...m.entries()].slice(0, 6);
  }, [c.data]);

  if (c.isError) return <ErrorState message={t("errors.load")} onRetry={() => c.refetch()} />;
  if (!c.data) return <Skeleton className="h-64" />;
  const { coach, bookings, reviews } = c.data;
  const active = reviews.find((r) => r.id === selected) ?? reviews[0];

  return (
    <section aria-labelledby="desk-title">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h2 id="desk-title" className="text-lg font-semibold">
            {t("coach.desk")}
          </h2>
          <p className="text-[13px] text-muted-foreground">{t("coach.sub")}</p>
        </div>
        <RequestReview />
      </div>
      <div className="mt-3 grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <GraduationCap className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-medium">{coach.name}</h2>
              <p className="text-xs text-muted-foreground">{pick(coach.credentials)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{pick(coach.bio)}</p>
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-sm font-medium">{t("coach.upcoming")}</h3>
            {bookings.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{t("coach.noCalls")}</p>}
            <ul className="mt-2 flex flex-col gap-2">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm">
                  <CalendarCheck className="size-4 text-primary" aria-hidden="true" />
                  <span className="flex-1">{formatDateTime(b.start, locale)}</span>
                  <button className="text-xs text-muted-foreground underline" onClick={() => cancel.mutate(b.id)}>
                    {t("coach.cancel")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-8">
          <CardLabel title={t("coach.book")} note={t("coach.bookNote")} />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {byDay.map(([day, slots]) => (
              <div key={day} className="rounded-xl border border-border p-3">
                <div className="text-sm font-medium">{formatDayDate(day, locale)}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <Button key={s.id} size="sm" variant="outline" disabled={book.isPending} onClick={() => book.mutate(s.id)} aria-label={t("coach.bookAt", { time: formatDateTime(s.start, locale) })}>
                      {formatTime(s.start, locale)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {book.isError && <p className="mt-3 text-sm text-weak">{t("coach.slotTaken")}</p>}
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardLabel title={t("coach.reviews")} />
          {reviews.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t("coach.noReviews")}</p>}
          <ul className="mt-3 flex flex-col gap-2">
            {reviews.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelected(r.id)}
                  className={cn("w-full rounded-xl border px-3.5 py-3 text-start text-sm hover:bg-accent/50", r.id === active?.id ? "border-primary" : "border-border")}
                  aria-current={r.id === active?.id ? "true" : undefined}
                >
                  <div className="font-medium">{r.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className={STATUS_CLASS[r.status]}>{t(`coach.status.${r.status}`)}</Tag>
                    {formatDayDate(r.submittedAt, locale)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="col-span-12 lg:col-span-8">{active ? <Thread review={active} /> : <p className="text-sm text-muted-foreground">{t("coach.noReviews")}</p>}</Card>
      </div>
    </section>
  );
}


/* ---------------- study plan ---------------- */

const KIND_STYLE: Record<ItemKind, { box: string; label: string; dot: string }> = {
  listening: { box: "border-foreground bg-[#E6EBFF]", label: "text-foreground", dot: "bg-primary" },
  reading: { box: "border-magenta bg-pink-tint", label: "text-magenta", dot: "bg-magenta" },
  writing: { box: "border-weak bg-pink-tint", label: "text-weak", dot: "bg-weak" },
  speaking: { box: "border-strength bg-strength-soft", label: "text-strength", dot: "bg-strength" },
  vocab: { box: "border-fair bg-fair-soft", label: "text-fair", dot: "bg-fair" },
  mock: { box: "border-primary bg-pale-wisteria", label: "text-primary", dot: "bg-primary" },
  test: { box: "border-coral bg-weak-soft", label: "text-weak", dot: "bg-coral" },
};

const BASIS_STYLE: Record<Skill, { bg: string; title: string }> = {
  listening: { bg: "bg-[#E6EBFF]", title: "text-foreground" },
  reading: { bg: "bg-pink-tint", title: "text-magenta" },
  writing: { bg: "bg-pink-tint", title: "text-weak" },
  speaking: { bg: "bg-strength-soft", title: "text-strength" },
};

export default function Coach() {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const me = useMe();
  const results = useResults();
  const progress = useProgress();
  const vocab = useVocabSummary();
  const open = useAttempts("in-progress");
  const tests = useTests();
  const latest = useMemo(() => (results.data ? latestFull(results.data) : null), [results.data]);
  const result = useResult(latest?.attemptId);
  const [offset, setOffset] = useState(0);
  const [updated, setUpdated] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (results.isError || me.isError) return <ErrorState message={t("errors.load")} onRetry={() => (results.refetch(), me.refetch())} />;
  if (!me.data || !results.data || (latest && (!progress.data || !result.data))) return <Skeleton className="h-96" />;

  const n = (x: number) => formatNumber(x, locale);
  const kindLabel = (k: ItemKind) => (k === "vocab" ? t("nav.vocabulary") : k === "mock" ? t("coach.plan.kindMock") : k === "test" ? t("coach.plan.kindTest") : t(`skills.${k}`));
  const itemText = (key: string, vars?: Record<string, string | number>) => {
    const v: Record<string, string> = {};
    for (const [k, x] of Object.entries(vars ?? {})) {
      if (k === "type") v.type = t(`types.${x}`);
      else if (k === "criterion") v.criterion = t(`criteria.${x}`);
      else if (k === "date") v.date = formatShortDate(String(x), locale);
      else if (k === "notes") v.notes = listOf(String(x).split(",").map((s) => n(Number(s))), locale);
      else v[k] = typeof x === "number" ? n(x) : x;
    }
    return t(`coach.plan.items.${key}`, v);
  };

  const refresh = async () => {
    setUpdating(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: keys.results }),
      qc.invalidateQueries({ queryKey: keys.progress }),
      qc.invalidateQueries({ queryKey: keys.vocabSummary }),
      qc.invalidateQueries({ queryKey: keys.me }),
    ]);
    setUpdating(false);
    setUpdated(true);
    window.setTimeout(() => setUpdated(false), 2500);
  };

  const header = (
    <PageHeader
      title={t("coach.plan.title")}
      sub={t("coach.plan.sub")}
      chips={
        latest ? (
          <>
            {updated && (
              <span role="status" className="text-sm text-strength">
                {t("coach.plan.updated")}
              </span>
            )}
            <Button onClick={refresh} disabled={updating}>
              <RefreshCw className={cn(updating && "motion-safe:animate-spin")} aria-hidden="true" /> {t("coach.plan.update")}
            </Button>
          </>
        ) : undefined
      }
    />
  );

  const band = <TutorBand />;

  if (!latest || !result.data) {
    return (
      <>
        {header}
        <EmptyState
          title={t("coach.plan.empty")}
          body={t("coach.plan.emptyBody")}
          action={
            <Button asChild>
              <Link to="/app/mocks">{t("mocks.startFull")}</Link>
            </Button>
          }
        />
        <div className="mt-4">{band}</div>
        {me.data.plan === "coach" && (
          <div className="mt-6">
            <CoachDesk />
          </div>
        )}
      </>
    );
  }

  const today = toDay(new Date());
  const testDate = me.data.testDate ? toDay(me.data.testDate) : null;
  const due = vocab.data?.due ?? 0;
  const basis = buildBasis(latest, result.data, progress.data, me.data);
  const biggest = basis.find((b) => b.biggest);
  const maxOffset = testDate ? Math.max(0, Math.floor((testDate.getTime() - planWeekStart(today).getTime()) / (7 * 86_400_000))) : 3;
  const started = startedByDay(open.data ?? [], tests.data ?? []);
  const week = buildWeek({ start: planWeekStart(today, offset), today, testDate, basis, progress: progress.data, result: result.data, due, started });
  const minutes = dailyMinutes(week);
  // The next mock still to come: in this week, or the Saturday after it.
  const mockDay = week.find((d) => !d.past && d.items.some((x) => x.kind === "mock"))?.date ?? (offset === 0 ? nextMockDay(today, testDate) : null);
  const reviews = buildReviews({ today, testDate, result: result.data, progress: progress.data, due, mockDate: latest.completedAt });
  const weekLine = [
    t("coach.plan.range", { from: formatDayDate(week[0].date, locale), to: formatDayDate(week[6].date, locale) }),
    minutes ? t("coach.plan.perDay", { n: n(minutes) }) : null,
    mockDay ? t("coach.plan.nextMock", { date: formatDayDate(mockDay, locale) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {header}
      <div className="flex flex-col gap-4.5">
        {/* What the plan is built from */}
        <section aria-labelledby="basis-title" className="rounded-card border border-border bg-card px-6 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="basis-title" className="text-base font-semibold">
              {t("coach.plan.basisTitle")}
            </h2>
            <Link to={`/app/results/${latest.attemptId}`} className="text-[13px] text-muted-foreground underline hover:text-foreground">
              {t("coach.plan.basisLink", {
                date: formatDate(latest.completedAt, locale, { year: undefined }),
                overall: formatBand(latest.overall, locale),
                target: formatBand(me.data.targets.overall, locale),
              })}
            </Link>
          </div>
          <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-2.5">
            {basis.map((b) => (
              <div key={b.skill} className={cn("min-w-0 rounded-[14px] px-3.5 py-3", BASIS_STYLE[b.skill].bg, b.biggest && "shadow-[inset_0_0_0_2px_var(--coral)]")}>
                <div className="flex justify-between gap-2 text-xs">
                  <b className={b.biggest ? "text-weak" : BASIS_STYLE[b.skill].title}>{t(`skills.${b.skill}`)}</b>
                  <span className={b.biggest ? "font-semibold text-weak" : "text-[#3a4855]"}>
                    {b.biggest ? t("coach.plan.biggest") : b.gap <= 0 ? t("coach.plan.onTarget") : t("coach.plan.toGo", { n: formatBand(b.gap, locale) })}
                  </span>
                </div>
                <div className="mt-0.5 font-archivo text-[26px] leading-[1.2] font-bold tabular-nums">{formatBand(b.band, locale)}</div>
                {b.focus && (
                  <div className="text-xs text-[#3a4855]">
                    {t("coach.plan.focus", { what: b.focus.type ? t(`types.${b.focus.type}`) : t(`criteria.${b.focus.criterion}`) })}
                  </div>
                )}
              </div>
            ))}
          </div>
          {biggest && (
            <p className="mt-3 text-sm text-[#3a4855]">
              {t("coach.plan.basisBefore")} <b className="text-weak">{t(`skills.${biggest.skill}`)}</b>
              {t("coach.plan.basisAfter")}
            </p>
          )}
        </section>

        {/* Weekly timetable */}
        <section aria-labelledby="week-title">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h2 id="week-title" className="text-lg font-semibold">
                {offset === 0 ? t("coach.plan.weekTitle") : t("coach.plan.weekTitleLater")}
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{weekLine}</p>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon" className="size-[34px] rounded-[10px]" aria-label={t("coach.plan.prevWeek")} disabled={offset === 0} onClick={() => setOffset(offset - 1)}>
                <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="size-[34px] rounded-[10px]" aria-label={t("coach.plan.nextWeek")} disabled={offset >= maxOffset} onClick={() => setOffset(offset + 1)}>
                <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <ol className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-2.5">
            {week.map((d) => (
              <li
                key={d.date.toISOString()}
                aria-current={d.today ? "date" : undefined}
                className={cn(
                  "flex min-w-0 flex-col gap-2 rounded-2xl bg-card",
                  d.today ? "border-2 border-coral p-[11px]" : "border border-border p-3",
                  d.past && "bg-[#f6f7f9]",
                )}
              >
                <div className="flex items-baseline justify-between gap-1.5">
                  <b className="text-[15px]">{formatWeekdayShort(d.date, locale)}</b>
                  <span className="text-xs text-muted-foreground">{formatDayMonth(d.date, locale)}</span>
                </div>
                {d.today && <span className="self-start rounded-full bg-coral px-2 py-px text-[11px] font-semibold text-white">{t("coach.plan.today")}</span>}
                {d.tomorrow && <span className="self-start rounded-full bg-pink-tint px-2 py-px text-[11px] font-semibold text-weak">{t("coach.plan.tomorrow")}</span>}
                {d.started.length > 0 && (
                  <span className="self-start rounded-full bg-border px-2 py-px text-[11px] font-semibold text-[#3a4855]">{t("coach.plan.started")}</span>
                )}
                {d.started.map((x, i) => (
                  <Link key={`s${i}`} to={x.href} className={cn("block rounded-xl border-s-4 px-3 py-2.5 text-foreground hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-ring", KIND_STYLE[x.kind].box)}>
                    <span className={cn("block text-[11px] font-semibold tracking-[0.06em] uppercase", KIND_STYLE[x.kind].label)}>{kindLabel(x.kind)}</span>
                    <span className="mt-0.5 block text-sm leading-[19px] font-medium">{t(`coach.plan.items.${x.key}`, { n: n(x.minutesLeft) })}</span>
                    {x.minutes !== null && (
                      <span className="mt-1.5 flex items-center gap-1 text-xs text-[#3a4855]">
                        <Clock className="size-3" aria-hidden="true" />
                        {t("coach.plan.minutes", { n: n(x.minutes) })}
                      </span>
                    )}
                  </Link>
                ))}
                {d.items.length === 0 && d.started.length === 0 && <span className="text-xs text-muted-foreground">{t("coach.plan.rest")}</span>}
                {d.items.map((x, i) => (
                  <Link key={i} to={x.href} className={cn("block rounded-xl border-s-4 px-3 py-2.5 text-foreground hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-ring", KIND_STYLE[x.kind].box)}>
                    <span className={cn("block text-[11px] font-semibold tracking-[0.06em] uppercase", KIND_STYLE[x.kind].label)}>{kindLabel(x.kind)}</span>
                    <span className="mt-0.5 block text-sm leading-[19px] font-medium">{itemText(x.key, x.vars)}</span>
                    {x.minutes !== null && (
                      <span className="mt-1.5 flex items-center gap-1 text-xs text-[#3a4855]">
                        <Clock className="size-3" aria-hidden="true" />
                        {t("coach.plan.minutes", { n: n(x.minutes) })}
                      </span>
                    )}
                  </Link>
                ))}
              </li>
            ))}
          </ol>
        </section>

        {/* Spaced review timeline */}
        <section aria-labelledby="review-title">
          <h2 id="review-title" className="text-lg font-semibold">
            {t("coach.plan.reviewTitle")}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t("coach.plan.reviewSub")}</p>
          <ol className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2.5">
            {reviews.map((s) => {
              const isToday = s.offset === 0;
              return (
                <li key={s.offset} className={cn("min-w-0 rounded-2xl border p-3.5", isToday ? "border-pink-carnation bg-pink-tint" : "border-border bg-card")}>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn("size-3 rounded-full", isToday ? "bg-coral shadow-[0_0_0_4px_rgba(217,47,58,0.18)]" : "bg-primary shadow-[0_0_0_4px_rgba(11,42,62,0.1)]")}
                    />
                    <b className={cn("text-[15px]", isToday ? "text-weak" : "text-primary")}>
                      {isToday
                        ? t("coach.plan.today")
                        : s.offset % 7 === 0
                          ? t("coach.plan.inWeeks", { count: s.offset / 7, n: n(s.offset / 7) })
                          : t("coach.plan.inDays", { count: s.offset, n: n(s.offset) })}
                    </b>
                  </div>
                  <div className="ms-5 mt-0.5 mb-1.5 text-xs text-muted-foreground">{formatShortDay(s.date, locale)}</div>
                  <ul>
                    {s.items.map((x, i) => (
                      <li key={i} className="flex items-start gap-2.5 border-t border-[#eef0f2] py-2">
                        <span aria-hidden="true" className={cn("mt-[5px] size-2.5 shrink-0 rounded-[3px]", KIND_STYLE[x.kind].dot)} />
                        <span className="min-w-0">
                          <span className="block text-sm leading-[19px] font-medium">{itemText(`r.${x.key}`, x.vars)}</span>
                          <span className="block text-xs text-muted-foreground">
                            {kindLabel(x.kind)} · {itemText(`r.${x.key}Sub`, x.vars)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>

        {band}

        {me.data.plan === "coach" && <CoachDesk />}
      </div>
    </>
  );
}

/** Band at the foot of the plan: a tutor can fine tune it on a live call. */
const ctaClass =
  "inline-flex h-[38px] items-center rounded-full bg-coral px-4 text-sm font-semibold text-white hover:bg-[#c4252f] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function TutorBand() {
  const { t } = useT();
  const me = useMe();
  const update = useUpdateMe();
  const plan = me.data?.plan;
  return (
    <section aria-labelledby="tutor-title" className="flex flex-wrap items-center gap-3.5 rounded-card bg-primary px-5.5 py-4.5 text-white">
      <div className="grid size-11 shrink-0 place-items-center rounded-full bg-coral" aria-hidden="true">
        <GraduationCap className="size-5" />
      </div>
      <div className="min-w-0 flex-[1_1_260px]">
        <b id="tutor-title" className="text-[15px]">
          {t("coach.plan.bandTitle")}
        </b>
        <p className="mt-0.5 text-[13px] text-white/85">{t("coach.plan.bandBody")}</p>
      </div>
      {plan === "coach" ? (
        <Link to="/coaching" className={ctaClass}>
          {t("coach.plan.bandCta")}
        </Link>
      ) : (
        <div className="flex flex-col items-start gap-1">
          {/* Prototype: joining switches the account to the coach plan; there is no payment step yet. */}
          <button type="button" className={ctaClass} onClick={() => update.mutate({ plan: "coach" })} disabled={update.isPending}>
            {t("coach.join")}
          </button>
          <span className="text-[11px] text-white/90">{t("coach.prototypeNote")}</span>
        </div>
      )}
    </section>
  );
}

function listOf(items: string[], locale: Locale): string {
  try {
    return new Intl.ListFormat(locale === "fa" ? "fa" : "en-GB", { type: "conjunction" }).format(items);
  } catch {
    return items.join(", ");
  }
}
