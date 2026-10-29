import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowRight, Check, ChevronDown, Mic, PenLine, X } from "lucide-react";
import type { ItemResult, Result, Skill } from "@/api/schemas";
import { useMe, useResult } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDate, formatNumber } from "@/lib/format";
import { numbersLabel, cn } from "@/lib/utils";
import { practiceHref } from "@/lib/links";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, ErrorState, Segmented, Skeleton, StrengthTag, Tag } from "@/components/ui/misc";

const ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

function strengthOf(acc: number) {
  return acc < 0.55 ? "weakness" : acc < 0.78 ? "fair" : "strength";
}

function ItemRow({ item }: { item: ItemResult }) {
  const { t, pick } = useT();
  const [open, setOpen] = useState(false);
  const right = item.marks === item.maxMarks;
  return (
    <li className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="grid w-full grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 px-1 py-3 text-start text-sm hover:bg-accent/40"
      >
        <span className="font-mono text-muted-foreground" dir="ltr">
          {numbersLabel(item.numbers)}
        </span>
        <span className="min-w-0">
          <span className="block truncate" lang="en" dir="ltr">
            {item.prompt}
          </span>
          <span className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
            <span>
              {t("results.yours")}:{" "}
              <b className={cn("font-medium", right ? "text-strength" : "text-weak")} dir="ltr">
                {item.given.length ? item.given.join(", ") : t("results.blank")}
              </b>
            </span>
            {!right && (
              <span>
                {t("results.correct")}:{" "}
                <b className="font-medium text-foreground" dir="ltr">
                  {item.correct.join(", ")}
                </b>
              </span>
            )}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {right ? <Check className="size-4 text-strength" aria-label={t("results.right")} /> : <X className="size-4 text-weak" aria-label={t("results.wrong")} />}
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <div className="mb-3 ms-[52px] rounded-xl bg-muted px-4 py-3 text-sm">
          <p>{pick(item.explanation)}</p>
          {item.trap && (
            <p className="mt-2">
              <Tag className="bg-fair-soft text-fair">{t("results.trap")}</Tag> {pick(item.trap)}
            </p>
          )}
          {item.evidence && (
            <blockquote className="mt-2 border-s-2 border-primary ps-3 text-muted-foreground italic" lang="en" dir="ltr">
              “{item.evidence}”
            </blockquote>
          )}
          <div className="mt-2 text-xs text-muted-foreground">{t(`types.${item.type}`)}</div>
        </div>
      )}
    </li>
  );
}

function AnswerReview({ result }: { result: Result }) {
  const { t } = useT();
  const skills = ORDER.filter((s) => result.items.some((i) => i.skill === s));
  const [skill, setSkill] = useState<Skill>(skills[0] ?? "reading");
  const [onlyWrong, setOnlyWrong] = useState(false);
  if (!skills.length) return null;
  const items = result.items.filter((i) => i.skill === skill && (!onlyWrong || i.marks < i.maxMarks)).sort((a, b) => a.numbers[0] - b.numbers[0]);
  return (
    <Card className="col-span-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-medium">{t("results.review")}</h2>
        <div className="flex flex-wrap gap-2">
          {skills.length > 1 && <Segmented<Skill> label={t("results.skill")} value={skill} onChange={setSkill} items={skills.map((s) => ({ value: s, label: t(`skills.${s}`) }))} />}
          <Segmented<"all" | "wrong">
            label={t("results.filter")}
            value={onlyWrong ? "wrong" : "all"}
            onChange={(v) => setOnlyWrong(v === "wrong")}
            items={[
              { value: "all", label: t("results.allQuestions") },
              { value: "wrong", label: t("results.onlyWrong") },
            ]}
          />
        </div>
      </div>
      <ul className="mt-3">
        {items.map((i) => (
          <ItemRow key={i.itemId} item={i} />
        ))}
      </ul>
      {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("results.allRight")}</p>}
    </Card>
  );
}

export default function ResultDetail() {
  const { attemptId } = useParams();
  const [params] = useSearchParams();
  const { t, locale, pick } = useT();
  const r = useResult(attemptId);
  const me = useMe();
  const fresh = params.get("fresh") === "1";

  const types = useMemo(
    () => (r.data?.byType ?? []).filter((x) => x.total > 0).sort((a, b) => a.correct / a.total - b.correct / b.total),
    [r.data],
  );

  if (r.isError) return <ErrorState message={t("errors.load")} onRetry={() => r.refetch()} />;
  if (!r.data) return <Skeleton className="h-96" />;
  const res = r.data;
  const targets = me.data?.targets;
  const skills = ORDER.map((s) => res.skills.find((x) => x.skill === s)).filter(Boolean) as Result["skills"];
  const headline = res.overall ?? (skills.length === 1 ? skills[0].band : null);
  const hasDummy = res.writing.length > 0 || res.speaking;

  return (
    <>
      <PageHeader
        title={res.testTitle}
        sub={
          <>
            {formatDate(res.completedAt, locale)}
            {res.mode === "practice" && ` · ${t("results.practiceTag")}`}
            {res.accommodation !== 1 && ` · ${t("results.extraTime", { x: formatNumber(res.accommodation, locale) })}`}
          </>
        }
      />
      {fresh && (
        <div role="status" className="mb-4 rounded-card border border-strength/30 bg-strength-soft px-5 py-3 text-sm text-strength">
          {t("results.justFinished")}
        </div>
      )}
      <div className="grid grid-cols-12 gap-4">
        {/* 1. Result */}
        <Card className="col-span-12 lg:col-span-7">
          <CardLabel title={res.overall !== null ? t("results.overall") : t(`skills.${skills[0]?.skill ?? "reading"}`)} note={hasDummy ? t("results.dummyShort") : undefined} />
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
            <div className="font-mono text-[56px] leading-none tracking-tight">{formatBand(headline, locale)}</div>
            {headline !== null && <div className="pb-2 text-muted-foreground">{t(`bands.${Math.floor(headline)}`)}</div>}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {skills.map((s) => (
              <div key={s.skill} className="rounded-[14px] border border-border px-3.5 py-3">
                <span className="block text-xs text-muted-foreground">{t(`skills.${s.skill}`)}</span>
                <b className="font-mono text-2xl font-normal">{formatBand(s.band, locale)}</b>
                {s.raw !== null && (
                  <span className="block font-mono text-xs text-muted-foreground" dir="ltr">
                    {formatNumber(s.raw, locale)}/{formatNumber(s.total ?? 40, locale)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {hasDummy && <p className="mt-4 text-xs text-faint">{t("common.dummy")}</p>}
        </Card>

        {/* 2. Meaning and 3. next step */}
        <Card className="col-span-12 flex flex-col lg:col-span-5">
          <CardLabel title={t("results.meaning")} />
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {targets &&
              skills.map((s) => {
                const gap = s.band - targets[s.skill];
                return (
                  <li key={s.skill} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                    <span>{t(`skills.${s.skill}`)}</span>
                    <span className={gap >= 0 ? "text-strength" : "text-weak"}>
                      {gap >= 0 ? t("results.reached") : t("results.below", { gap: formatBand(-gap, locale) })}
                    </span>
                  </li>
                );
              })}
          </ul>
          <div className="mt-auto pt-5">
            <div className="rounded-[14px] bg-secondary px-4 py-3.5">
              <div className="text-xs text-muted-foreground">{t("overview.next")}</div>
              <div className="mt-1 font-medium">{pick(res.next.title)}</div>
              <p className="mt-1 text-sm text-muted-foreground">{pick(res.next.detail)}</p>
              <Button asChild size="sm" className="mt-3">
                <Link to={res.next.questionType ? practiceHref(res.next.questionType) : "/app/practice"}>
                  {t("common.start")} <ArrowRight className="rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Question types */}
        {types.length > 0 && (
          <Card className="col-span-12 lg:col-span-7">
            <CardLabel title={t("results.byType")} note={t("results.byTypeNote")} />
            <div className="mt-3.5 flex flex-col gap-3">
              {types.map((x) => {
                const acc = x.correct / x.total;
                return (
                  <div key={`${x.skill}-${x.type}`} className="grid grid-cols-[minmax(0,1fr)_80px_44px_124px] items-center gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {t(`types.${x.type}`)} <span className="text-xs text-faint">· {t(`skills.${x.skill}`)}</span>
                    </span>
                    <Bar value={acc} label={t(`types.${x.type}`)} />
                    <span className="text-end font-mono text-muted-foreground" dir="ltr">
                      {formatNumber(x.correct, locale)}/{formatNumber(x.total, locale)}
                    </span>
                    <span className="flex items-center gap-2">
                      <StrengthTag strength={strengthOf(acc)} label={t(`strength.${strengthOf(acc)}`)} />
                      {acc < 0.78 && (
                        <Link to={practiceHref(x.type)} className="text-xs text-primary hover:underline">
                          {t("results.drill")}
                        </Link>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Time */}
        <Card className={cn("col-span-12", types.length > 0 && "lg:col-span-5")}>
          <CardLabel title={t("results.time")} />
          <div className="mt-3.5 flex flex-col gap-3 text-sm">
            {skills.map((s) => (
              <div key={s.skill} className="grid grid-cols-[90px_1fr_auto] items-center gap-3">
                <span>{t(`skills.${s.skill}`)}</span>
                <Bar value={s.allowedSec ? s.usedSec / s.allowedSec : 0} label={t(`skills.${s.skill}`)} />
                <span className="font-mono text-muted-foreground">
                  {t("results.minutesOf", { used: formatNumber(Math.round(s.usedSec / 60), locale), allowed: formatNumber(Math.round(s.allowedSec / 60), locale) })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Writing and speaking */}
        {res.writing.map((w) => (
          <Card key={w.partId} className="col-span-12 sm:col-span-6">
            <CardLabel title={t("results.writingTask", { n: w.task })} note={t("results.words", { n: formatNumber(w.words, locale) })} />
            <div className="mt-3 flex items-end gap-4">
              <PenLine className="size-5 text-primary" aria-hidden="true" />
              <span className="font-mono text-3xl">{formatBand(w.band, locale)}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pick(w.summary)}</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to={`/app/results/${res.attemptId}/writing/${w.partId}`}>{t("results.openFeedback")}</Link>
            </Button>
          </Card>
        ))}
        {res.speaking && (
          <Card className="col-span-12 sm:col-span-6">
            <CardLabel title={t("skills.speaking")} />
            <div className="mt-3 flex items-end gap-4">
              <Mic className="size-5 text-primary" aria-hidden="true" />
              <span className="font-mono text-3xl">{formatBand(res.speaking.band, locale)}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pick(res.speaking.summary)}</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to={`/app/results/${res.attemptId}/speaking`}>{t("results.openFeedback")}</Link>
            </Button>
          </Card>
        )}

        <AnswerReview result={res} />
      </div>
    </>
  );
}
