import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, CircleArrowOutUpRight } from "lucide-react";
import type { VocabCard } from "@/api/schemas";
import { useVocabDue, useVocabMutations } from "@/api/queries";
import { useT } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, EmptyState, Skeleton } from "@/components/ui/misc";
import { vocabUse } from "@/components/study/vocabUse";

const termPattern = (term: string) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

/** The example sentence with the word itself picked out in magenta. */
function Highlighted({ text, term }: { text: string; term: string }) {
  const parts = text.split(new RegExp(`(${termPattern(term).source})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-white px-[3px] font-bold text-magenta">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** Two-button review (Again / Good). Space shows the answer, 1 and 2 grade it. */
export default function VocabularyReview() {
  const { t, locale } = useT();
  const due = useVocabDue();
  const { review } = useVocabMutations();
  const [queue, setQueue] = useState<VocabCard[] | null>(null);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (due.data && queue === null) setQueue(due.data);
  }, [due.data, queue]);

  const card = queue?.[0];
  const grade = (g: "again" | "good") => {
    if (!card) return;
    review.mutate({ id: card.id, grade: g });
    setShown(false);
    setQueue((q) => {
      if (!q) return q;
      const [first, ...rest] = q;
      // "Again" brings the card back later in this session.
      return g === "again" ? [...rest, first] : rest;
    });
    if (g === "good") setDone((n) => n + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea")) return;
      if (e.key === " " && !shown) {
        e.preventDefault();
        setShown(true);
      } else if (shown && e.key === "1") grade("again");
      else if (shown && e.key === "2") grade("good");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const total = done + (queue?.length ?? 0);
  const use = card ? vocabUse(card.term, card.custom) : null;
  const nextGood = card ? (card.intervalDays === 0 ? 1 : Math.round(card.intervalDays * 2.5)) : 1;

  return (
    <>
      <PageHeader title={t("vocab.reviewTitle")} />
      <Link to="/app/vocabulary" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("vocab.title")}
      </Link>
      {!queue && <Skeleton className="h-72" />}
      {queue && !card && (
        <EmptyState
          title={t("vocab.sessionDone")}
          body={t("vocab.sessionDoneBody", { n: formatNumber(done, locale) })}
          action={
            <Button asChild>
              <Link to="/app/vocabulary">{t("vocab.title")}</Link>
            </Button>
          }
        />
      )}
      {card && (
        <div className="mx-auto max-w-xl">
          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
            <Bar value={total ? done / total : 0} className="flex-1" label={t("vocab.progress")} />
            {formatNumber(done, locale)} / {formatNumber(total, locale)}
          </div>
          <Card className="flex min-h-72 flex-col items-center justify-center text-center">
            <div className="text-3xl font-semibold" lang="en" dir="ltr">
              {card.term}
            </div>
            {shown && card.meaning.fa && (
              <p lang="fa" dir="rtl" className="mt-1.5 text-[22px] leading-8 font-extrabold text-[#800020]/60">
                {card.meaning.fa}
              </p>
            )}
            <div className="mt-0.5 text-sm text-muted-foreground">{t(`vocab.posNames.${card.partOfSpeech}`, { defaultValue: card.partOfSpeech })}</div>
            <div className="mt-6 w-full border-t border-border pt-5" aria-live="polite">
              {shown && card.meaning.en && (
                <p className="text-lg" lang="en" dir="ltr">
                  {card.meaning.en}
                </p>
              )}
              {card.example && (
                <div className={cn("w-full rounded-[14px] border-s-4 border-pink-carnation bg-pink-tint px-4 py-3.5 text-start", shown && card.meaning.en && "mt-4.5")}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] text-magenta uppercase">
                    <CircleArrowOutUpRight className="size-3.5" aria-hidden="true" />
                    {t("vocab.exampleInContext")}
                  </div>
                  <p lang="en" dir="ltr" className="mt-1.5 text-start text-[17px] leading-[26px]">
                    “{shown ? <Highlighted text={card.example} term={card.term} /> : card.example.replace(termPattern(card.term), "_____")}”
                  </p>
                  {use && <p className="mt-1.5 text-start text-xs text-[#3a4855]">{t(`vocab.useFor.${use}`)}</p>}
                </div>
              )}
            </div>
          </Card>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {!shown ? (
              <Button key="show" size="lg" className="col-span-2" onClick={() => setShown(true)}>
                {t("vocab.show")} <kbd className="ms-2 rounded border border-current px-1.5 text-xs opacity-90">Space</kbd>
              </Button>
            ) : (
              <>
                <Button key="again" size="lg" variant="outline" onClick={() => grade("again")} className="h-14 flex-col gap-0 text-base">
                  <span>{t("vocab.again")}</span>
                  <span className="text-xs text-muted-foreground">{t("vocab.inMinutes", { n: formatNumber(10, locale) })} · 1</span>
                </Button>
                <Button key="good" size="lg" onClick={() => grade("good")} className="h-14 flex-col gap-0 text-base">
                  <span>{t("vocab.good")}</span>
                  <span className="text-xs opacity-80">{t("vocab.inDays", { n: formatNumber(nextGood, locale) })} · 2</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
