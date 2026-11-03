import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useCoachMutations, useMe, useResult, useTest } from "@/api/queries";
import { useT } from "@/i18n";
import { formatDate, formatNumber } from "@/lib/format";
import { overallBand, writingBand } from "@/lib/bands";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/misc";
import { Rich } from "@/exam/widgets/QuestionGroupView";
import { AnnotatedText, NoteBody } from "./feedback-shared";
import { ScoreBreakdown, SectionTabs } from "./ScoreBreakdown";
import { liftFor } from "@/lib/breakdown";

export default function WritingFeedbackPage() {
  const { attemptId, partId } = useParams();
  const { t, locale, pick } = useT();
  const navigate = useNavigate();
  const r = useResult(attemptId);
  const test = useTest(r.data?.testId);
  const me = useMe();
  const coach = useCoachMutations();
  const [active, setActive] = useState<number | null>(null);

  if (r.isError) return <ErrorState message={t("errors.load")} onRetry={() => r.refetch()} />;
  if (!r.data) return <Skeleton className="h-96" />;
  const w = r.data.writing.find((x) => x.partId === partId) ?? r.data.writing[0];
  if (!w) return <ErrorState message={t("errors.load")} />;
  const part = test.data?.sections.flatMap((s) => s.parts).find((p) => p.id === w.partId);
  const minWords = w.task === 1 ? 150 : 250;

  const askCoach = () => {
    if (me.data?.plan !== "coach") return navigate("/app/coach");
    coach.request.mutate(
      { kind: "essay", title: `${r.data!.testTitle}, Task ${w.task}`, attemptId: r.data!.attemptId, message: t("feedback.coachMessage") },
      { onSuccess: () => navigate("/app/coach") },
    );
  };

  return (
    <>
      <PageHeader title={t("feedback.writingTitle", { n: formatNumber(w.task, locale) })} sub={
          <>
            <bdi>{r.data.testTitle}</bdi> · {formatDate(r.data.completedAt, locale)}
          </>
        } />
      <Link to={`/app/results/${r.data.attemptId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("feedback.backToResult")}
      </Link>
      {w.dummy && <p className="mb-4 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground">{t("feedback.dummyWriting")}</p>}
      <div className="grid grid-cols-12 gap-4">
        {/* Grades first: one tab per task */}
        <SectionTabs
          label={t("skills.writing")}
          value={w.partId}
          onChange={(id) => navigate(`/app/results/${r.data!.attemptId}/writing/${id}`)}
          items={[...r.data.writing]
            .sort((a, b) => a.task - b.task)
            .map((x) => ({ key: x.partId, title: t("breakdown.task", { n: formatNumber(x.task, locale) }), sub: t(`breakdown.taskNames.${x.task}`), band: x.band }))}
        />
        <blockquote className="col-span-12 rounded-e-xl border-s-[3px] border-rosewood bg-card px-4 py-3 text-sm">{pick(w.summary)}</blockquote>
        <ScoreBreakdown
          key={w.partId}
          criteria={w.criteria}
          criterionLabel={(k) => t(`criteria.${k === "tr" && w.task === 1 ? "tr1" : k}`)}
          skillLabel={t("skills.writing")}
          exampleTone="blue"
          lift={(k) => {
            const res = r.data!;
            const other = res.writing.find((x) => x.task !== w.task);
            // Task 2 counts twice as much as Task 1.
            const toSkill = (b: number) => (other ? (w.task === 2 ? writingBand(other.band, b) : writingBand(b, other.band)) : b);
            const skill = res.skills.find((x) => x.skill === "writing")?.band ?? w.band;
            const others = res.skills.filter((x) => x.skill !== "writing").map((x) => x.band);
            const full = res.overall !== null && others.length === 3;
            return liftFor(w.criteria, k, { skill, overall: res.overall }, toSkill, full ? (wb) => overallBand([...others, wb]) : null);
          }}
        />

        <Card className="col-span-12 lg:col-span-7">
          <CardLabel
            title={t("feedback.yourEssay")}
            note={
              <span className={cn(w.words < minWords && "text-weak")}>
                {t("results.words", { n: formatNumber(w.words, locale) })}
                {w.words < minWords && ` · ${t("feedback.underMin", { n: formatNumber(minWords, locale) })}`}
              </span>
            }
          />
          {part?.writing && (
            <details className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium">{t("feedback.prompt")}</summary>
              <div lang="en" dir="ltr" className="mt-2 flex flex-col gap-2 text-start">
                {part.writing.prompt.map((p, i) => (
                  <p key={i}>
                    <Rich text={p} />
                  </p>
                ))}
              </div>
            </details>
          )}
          <div className="mt-4 text-[15px]">
            {w.essay.trim() ? (
              <AnnotatedText text={w.essay} notes={w.annotations} active={active} onPick={setActive} />
            ) : (
              <p className="text-muted-foreground">{t("feedback.noEssay")}</p>
            )}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardLabel title={t("feedback.notes")} note={t("feedback.notesCount", { n: formatNumber(w.annotations.length, locale) })} />
          {w.annotations.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t("feedback.noNotes")}</p>}
          <ol className="mt-3 flex flex-col gap-2.5">
            {w.annotations.map((a, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(i);
                    document.getElementById(`ann-${i}`)?.scrollIntoView({ block: "center" });
                  }}
                  className={cn("w-full rounded-xl border border-border px-3.5 py-3 text-start text-sm hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring", active === i && "ring-2 ring-ring")}
                >
                  <NoteBody note={a} n={i + 1} />
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-5 border-t border-border pt-4">
            <Button variant="outline" onClick={askCoach} disabled={coach.request.isPending}>
              <GraduationCap /> {t("feedback.askCoach")}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
