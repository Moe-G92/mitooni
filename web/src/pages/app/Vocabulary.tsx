import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, Trash2 } from "lucide-react";
import type { VocabCard } from "@/api/schemas";
import { useVocab, useVocabMutations, useVocabSummary } from "@/api/queries";
import { useT } from "@/i18n";
import { formatNumber, formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent, DialogTrigger, ErrorState, Segmented, Skeleton, Tag } from "@/components/ui/misc";
import { StudyCalendar } from "@/components/charts";

type Status = "new" | "learning" | "known";
const statusOf = (c: VocabCard): Status => (c.reps === 0 ? "new" : c.intervalDays >= 7 ? "known" : "learning");
const STATUS_CLASS: Record<Status, string> = { new: "bg-secondary text-foreground", learning: "bg-fair-soft text-fair", known: "bg-strength-soft text-strength" };

function AddWord() {
  const { t } = useT();
  const { add } = useVocabMutations();
  const [open, setOpen] = useState(false);
  const empty = { term: "", partOfSpeech: "noun", en: "", fa: "", example: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.term.trim()) errs.term = t("vocab.errTerm");
    if (!f.en.trim() && !f.fa.trim()) errs.meaning = t("vocab.errMeaning");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    add.mutate(
      { term: f.term.trim(), partOfSpeech: f.partOfSpeech, meaning: { en: f.en.trim(), fa: f.fa.trim() }, example: f.example.trim() },
      {
        onSuccess: () => {
          setF(empty);
          setOpen(false);
        },
      },
    );
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> {t("vocab.add")}
        </Button>
      </DialogTrigger>
      <DialogContent title={t("vocab.addTitle")} description={t("vocab.addSub")}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_140px] gap-3">
            <Field label={t("vocab.term")} htmlFor="v-term" error={errors.term}>
              <Input id="v-term" dir="ltr" lang="en" value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })} />
            </Field>
            <Field label={t("vocab.pos")} htmlFor="v-pos">
              <Select id="v-pos" value={f.partOfSpeech} onChange={(e) => setF({ ...f, partOfSpeech: e.target.value })}>
                {["noun", "verb", "adjective", "adverb", "phrase"].map((p) => (
                  <option key={p} value={p}>
                    {t(`vocab.posNames.${p}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t("vocab.meaningEn")} htmlFor="v-en" error={errors.meaning}>
            <Input id="v-en" dir="ltr" lang="en" value={f.en} onChange={(e) => setF({ ...f, en: e.target.value })} />
          </Field>
          <Field label={t("vocab.meaningFa")} htmlFor="v-fa">
            <Input id="v-fa" dir="rtl" lang="fa" value={f.fa} onChange={(e) => setF({ ...f, fa: e.target.value })} />
          </Field>
          <Field label={t("vocab.example")} htmlFor="v-ex">
            <Textarea id="v-ex" dir="ltr" lang="en" className="min-h-20" value={f.example} onChange={(e) => setF({ ...f, example: e.target.value })} />
          </Field>
          <Button type="submit" disabled={add.isPending}>
            {t("vocab.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Vocabulary() {
  const { t, locale, pick } = useT();
  const cards = useVocab();
  const summary = useVocabSummary();
  const { remove } = useVocabMutations();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");

  const list = useMemo(
    () =>
      (cards.data ?? []).filter(
        (c) =>
          (filter === "all" || statusOf(c) === filter) &&
          (!q || c.term.toLowerCase().includes(q.toLowerCase()) || c.meaning.en.toLowerCase().includes(q.toLowerCase()) || c.meaning.fa.includes(q)),
      ),
    [cards.data, q, filter],
  );

  return (
    <>
      <PageHeader title={t("vocab.title")} sub={t("vocab.sub")} />
      {(cards.isError || summary.isError) && <ErrorState message={t("errors.load")} onRetry={() => (cards.refetch(), summary.refetch())} />}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7">
          <CardLabel title={t("vocab.today")} />
          {summary.data ? (
            <>
              <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <div className="font-mono text-5xl leading-none">{formatNumber(summary.data.due, locale)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t("vocab.dueNow")}</div>
                </div>
                <dl className="flex gap-6 text-sm">
                  {(["learning", "known", "total"] as const).map((k) => (
                    <div key={k}>
                      <dt className="text-muted-foreground">{t(`vocab.${k}`)}</dt>
                      <dd className="font-mono text-lg">{formatNumber(summary.data![k], locale)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {summary.data.due > 0 ? (
                  <Button asChild>
                    <Link to="/app/vocabulary/review">{t("vocab.startReview")}</Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("vocab.allDone")}</p>
                )}
                <AddWord />
              </div>
            </>
          ) : (
            <Skeleton className="mt-3 h-28" />
          )}
        </Card>
        <Card className="col-span-12 lg:col-span-5">
          <CardLabel title={t("vocab.reviewDays")} note={t("progress.calendarNote")} />
          <div className="mt-4">
            {summary.data && (
              <StudyCalendar
                days={summary.data.reviewDays.map((d) => d.date)}
                locale={locale}
                label={t("vocab.reviewDays")}
                countText={(n) => t("vocab.daysReviewed", { n })}
              />
            )}
          </div>
        </Card>

        <Card className="col-span-12">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[15px] font-medium">{t("vocab.words")}</h2>
            <div className="relative ms-auto">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input
                type="search"
                aria-label={t("vocab.search")}
                placeholder={t("vocab.search")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 w-56 rounded-xl border border-input bg-card ps-9 pe-3 text-sm"
              />
            </div>
            <Segmented<"all" | Status>
              label={t("results.filter")}
              value={filter}
              onChange={setFilter}
              items={[
                { value: "all", label: t("results.all") },
                { value: "new", label: t("vocab.status.new") },
                { value: "learning", label: t("vocab.status.learning") },
                { value: "known", label: t("vocab.status.known") },
              ]}
            />
          </div>
          {cards.isLoading && <Skeleton className="mt-4 h-60" />}
          <ul className="mt-3">
            {list.map((c) => {
              const st = statusOf(c);
              return (
                <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-border py-3 last:border-0 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
                  <div>
                    <b className="font-medium" lang="en" dir="ltr">
                      {c.term}
                    </b>{" "}
                    <span className="text-xs text-muted-foreground">{t(`vocab.posNames.${c.partOfSpeech}`, { defaultValue: c.partOfSpeech })}</span>
                  </div>
                  <div className="col-span-2 row-start-2 min-w-0 text-sm sm:col-span-1 sm:row-start-auto">
                    <div>{pick(c.meaning)}</div>
                    {c.example && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground" lang="en" dir="ltr">
                        {c.example}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <Tag className={STATUS_CLASS[st]}>{t(`vocab.status.${st}`)}</Tag>
                    <span className="hidden text-xs text-faint sm:inline">{formatShortDate(c.due, locale)}</span>
                    {c.custom && (
                      <button className="rounded-lg p-1 text-muted-foreground hover:bg-accent" aria-label={t("vocab.delete", { term: c.term })} onClick={() => remove.mutate(c.id)}>
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {cards.data && list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t("vocab.noMatch")}</p>}
        </Card>
      </div>
    </>
  );
}
