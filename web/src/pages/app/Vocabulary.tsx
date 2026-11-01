import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import type { VocabCard } from "@/api/schemas";
import { useVocab, useVocabMutations, useVocabSummary } from "@/api/queries";
import { useT } from "@/i18n";
import { formatNumber, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent, DialogTrigger, ErrorState, Segmented, Skeleton, Tag } from "@/components/ui/misc";

type Status = "new" | "learning" | "known";
const statusOf = (c: VocabCard): Status => (c.reps === 0 ? "new" : c.intervalDays >= 7 ? "known" : "learning");
const STATUS_CLASS: Record<Status, string> = { new: "bg-pink-tint text-foreground", learning: "bg-fair-soft text-fair", known: "bg-strength-soft text-strength" };
const PER_PAGE = 10;

/** Page buttons to show: all of them when there are few, otherwise first, last and the pages around the current one. */
function pageWindow(count: number, current: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const keep = new Set([0, count - 1, current - 1, current, current + 1].filter((n) => n >= 0 && n < count));
  const out: (number | "gap")[] = [];
  [...keep].sort((a, b) => a - b).forEach((n, i, arr) => {
    if (i > 0 && n - arr[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

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
  const [page, setPage] = useState(0);

  const all = useMemo(() => cards.data ?? [], [cards.data]);
  const counts = useMemo(() => {
    const c = { all: all.length, new: 0, learning: 0, known: 0 };
    for (const card of all) c[statusOf(card)]++;
    return c;
  }, [all]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(
      (c) =>
        (filter === "all" || statusOf(c) === filter) &&
        (!needle || c.term.toLowerCase().includes(needle) || c.meaning.en.toLowerCase().includes(needle) || c.meaning.fa.includes(q.trim())),
    );
  }, [all, q, filter]);

  const pageCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pageCount - 1);
  const start = current * PER_PAGE;
  const pageItems = list.slice(start, start + PER_PAGE);
  const n = (x: number) => formatNumber(x, locale);
  const pageBtn = "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border px-2.5 text-[13px] disabled:cursor-default disabled:opacity-40";

  return (
    <>
      <PageHeader title={t("vocab.pageTitle")} sub={t("vocab.sub")} />
      {(cards.isError || summary.isError) && <ErrorState message={t("errors.load")} onRetry={() => (cards.refetch(), summary.refetch())} />}
      <div className="flex flex-col gap-4">
        <Card>
          <CardLabel title={t("vocab.today")} />
          {summary.data ? (
            <>
              <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <div className="font-archivo text-5xl leading-none font-bold tabular-nums">{n(summary.data.due)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t("vocab.dueNow")}</div>
                </div>
                <dl className="flex gap-6 text-sm">
                  {(["learning", "known", "total"] as const).map((k) => (
                    <div key={k}>
                      <dt className="text-muted-foreground">{t(`vocab.${k}`)}</dt>
                      <dd className="font-archivo text-lg tabular-nums">{n(summary.data![k])}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
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

        <Card aria-labelledby="words-title">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="words-title" className="text-[15px] font-medium">
              {t("vocab.words")} {cards.data && <span className="text-[13px] font-normal text-muted-foreground">· {t("vocab.saved", { n: n(counts.all) })}</span>}
            </h2>
            <div className="relative w-full sm:ms-auto sm:w-56">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                aria-label={t("vocab.search")}
                placeholder={t("vocab.search")}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                className="h-9 w-full rounded-xl border border-input bg-card ps-9 pe-3 text-sm"
              />
            </div>
            <Segmented<"all" | Status>
              label={t("vocab.filterLabel")}
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setPage(0);
              }}
              items={(["all", "new", "learning", "known"] as const).map((k) => ({
                value: k,
                label: `${k === "all" ? t("results.all") : t(`vocab.status.${k}`)} (${n(counts[k])})`,
              }))}
            />
          </div>
          {cards.isLoading && <Skeleton className="mt-4 h-60" />}
          <ul className="mt-3">
            {pageItems.map((c) => {
              const st = statusOf(c);
              return (
                <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-border py-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
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
          {cards.data && list.length === 0 && <p className="mt-4 text-sm text-muted-foreground">{t("vocab.noMatch")}</p>}
          {cards.data && (
            <nav aria-label={t("vocab.pagesLabel")} className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] text-muted-foreground" aria-live="polite">
                {list.length
                  ? t("vocab.range", { from: n(start + 1), to: n(Math.min(start + PER_PAGE, list.length)), total: n(list.length) })
                  : t("vocab.rangeNone")}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" className={cn(pageBtn, "border-border bg-card")} disabled={current === 0} onClick={() => setPage(current - 1)}>
                  <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                  {t("vocab.prev")}
                </button>
                {pageWindow(pageCount, current).map((p, i) =>
                  p === "gap" ? (
                    <span key={`gap-${i}`} className="px-1 text-[13px] text-muted-foreground" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      aria-label={t("vocab.pageN", { n: n(p + 1) })}
                      aria-current={p === current ? "page" : undefined}
                      onClick={() => setPage(p)}
                      className={cn(pageBtn, p === current ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border bg-card")}
                    >
                      {n(p + 1)}
                    </button>
                  ),
                )}
                <button type="button" className={cn(pageBtn, "border-border bg-card")} disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
                  {t("vocab.next")}
                  <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </Card>
      </div>
    </>
  );
}
