import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Send } from "lucide-react";
import type { CoachReview, Slot } from "@/api/schemas";
import { useCoach, useCoachMutations, useMe, useResults, useUpdateMe } from "@/api/queries";
import { useT } from "@/i18n";
import { formatDateTime, formatDayDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent, DialogTrigger, ErrorState, Skeleton, Tag } from "@/components/ui/misc";

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

export default function Coach() {
  const { t, locale, pick } = useT();
  const me = useMe();
  const update = useUpdateMe();
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
  if (!c.data || !me.data) return <Skeleton className="h-96" />;
  const { coach, bookings, reviews } = c.data;
  const active = reviews.find((r) => r.id === selected) ?? reviews[0];

  if (me.data.plan !== "coach") {
    return (
      <>
        <PageHeader title={t("nav.coach")} sub={t("coach.sub")} />
        <Card className="max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-secondary text-lg font-medium">{coach.initials}</div>
            <div>
              <h2 className="text-lg font-medium">{coach.name}</h2>
              <p className="text-sm text-muted-foreground">{pick(coach.credentials)}</p>
            </div>
          </div>
          <p className="mt-4">{pick(coach.bio)}</p>
          <ul className="mt-4 list-disc ps-5 text-sm text-muted-foreground">
            <li>{t("coachPub.i1Body")}</li>
            <li>{t("coachPub.i2Body")}</li>
            <li>{t("coachPub.i3Body")}</li>
          </ul>
          <p className="mt-4 text-xs text-faint">{t("coach.prototypeNote")}</p>
          <Button className="mt-5" onClick={() => update.mutate({ plan: "coach" })} disabled={update.isPending}>
            {t("coach.join")}
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("nav.coach")} sub={t("coach.sub")} chips={<RequestReview />} />
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary font-medium">{coach.initials}</div>
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
    </>
  );
}
