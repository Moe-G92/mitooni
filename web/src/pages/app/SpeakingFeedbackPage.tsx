import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { fetchRecording, useCoachMutations, useMe, useResult } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatClock, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton, Tag } from "@/components/ui/misc";
import { CriterionTile } from "@/components/charts";
import { AnnotatedText } from "./feedback-shared";
import { KIND_CLASS } from "./feedback-kinds";

/** Plays a recording kept by the mock API (GET /api/recordings/:key). */
function Recording({ recordingKey }: { recordingKey: string | null }) {
  const { t } = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!recordingKey) return;
    let made: string | null = null;
    fetchRecording(recordingKey)
      .then((b) => setUrl((made = URL.createObjectURL(b))))
      .catch(() => setFailed(true));
    return () => {
      if (made) URL.revokeObjectURL(made);
    };
  }, [recordingKey]);
  if (!recordingKey) return <p className="text-xs text-muted-foreground">{t("feedback.noRecording")}</p>;
  if (failed) return <p className="text-xs text-muted-foreground">{t("feedback.recordingGone")}</p>;
  return url ? <audio controls src={url} className="h-9 w-full max-w-sm" /> : <Skeleton className="h-9 max-w-sm" />;
}

export default function SpeakingFeedbackPage() {
  const { attemptId } = useParams();
  const { t, locale, pick } = useT();
  const navigate = useNavigate();
  const r = useResult(attemptId);
  const me = useMe();
  const coach = useCoachMutations();

  if (r.isError) return <ErrorState message={t("errors.load")} onRetry={() => r.refetch()} />;
  if (!r.data) return <Skeleton className="h-96" />;
  const s = r.data.speaking;
  if (!s) return <ErrorState message={t("errors.load")} />;

  const askCoach = () => {
    if (me.data?.plan !== "coach") return navigate("/app/coach");
    coach.request.mutate(
      { kind: "recording", title: `${r.data!.testTitle}, Speaking`, attemptId: r.data!.attemptId, message: t("feedback.coachMessageSpeaking") },
      { onSuccess: () => navigate("/app/coach") },
    );
  };

  return (
    <>
      <PageHeader title={t("feedback.speakingTitle")} sub={`${r.data.testTitle} · ${formatDate(r.data.completedAt, locale)}`} />
      <Link to={`/app/results/${r.data.attemptId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("feedback.backToResult")}
      </Link>
      {s.dummy && <p className="mb-4 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground">{t("feedback.dummySpeaking")}</p>}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <div className="text-[13px] text-muted-foreground">{t("common.band")}</div>
              <div className="font-mono text-5xl leading-none">{formatBand(s.band, locale)}</div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              {s.criteria.map((c) => (
                <CriterionTile key={c.key} label={t(`criteria.${c.key}`)} band={c.band} locale={locale} low={c.band < s.band} />
              ))}
            </div>
          </div>
          <blockquote className="mt-4 rounded-e-xl border-s-[3px] border-primary bg-secondary px-3.5 py-3 text-sm">{pick(s.summary)}</blockquote>
        </Card>

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
          {s.parts.map((p) => (
            <Card key={p.partId}>
              <CardLabel title={t("feedback.part", { n: p.part })} note={p.durationSec ? formatClock(p.durationSec, locale) : undefined} />
              <div className="mt-3">
                <Recording recordingKey={p.recordingKey} />
              </div>
              <div className="mt-4 text-[15px]">
                <div className="mb-1.5 text-xs text-muted-foreground">{t("feedback.transcript")}</div>
                <AnnotatedText text={p.transcript} notes={s.annotations} />
              </div>
            </Card>
          ))}
        </div>

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
          <Card>
            <CardLabel title={t("feedback.pronunciation")} />
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              {s.pronunciation.map((p) => (
                <li key={p.word} className="rounded-xl border border-border px-3.5 py-3">
                  <b className="font-medium" lang="en" dir="ltr">
                    {p.word}
                  </b>
                  <p className="mt-1 text-muted-foreground">{pick(p.note)}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardLabel title={t("feedback.notes")} />
            <ol className="mt-3 flex flex-col gap-2.5 text-sm">
              {s.annotations.map((a, i) => (
                <li key={i} className="rounded-xl border border-border px-3.5 py-3">
                  <Tag className={KIND_CLASS[a.kind]}>{t(`feedback.kind.${a.kind}`)}</Tag>
                  <p className="mt-1.5">{pick(a.note)}</p>
                  {a.fix && (
                    <p className="mt-1.5 text-muted-foreground">
                      {t("feedback.try")}{" "}
                      <span lang="en" dir="ltr" className="text-foreground">
                        {a.fix}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t border-border pt-4">
              <Button variant="outline" onClick={askCoach} disabled={coach.request.isPending}>
                <GraduationCap /> {t("feedback.askCoachSpeaking")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
