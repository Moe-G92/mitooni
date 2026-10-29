import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";
import type { SpeakingFeedback } from "@/api/schemas";
import { fetchRecording, useCoachMutations, useMe, useResult } from "@/api/queries";
import { useT } from "@/i18n";
import { formatClock, formatDate, formatNumber } from "@/lib/format";
import { overallBand } from "@/lib/bands";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton, Tag } from "@/components/ui/misc";
import { AnnotatedText } from "./feedback-shared";
import { KIND_CLASS } from "./feedback-kinds";
import { ScoreBreakdown, SectionTabs } from "./ScoreBreakdown";
import { liftFor } from "@/lib/breakdown";

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
  const [tab, setTab] = useState<string>("overall");

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
        {/* Grades first: the whole test, then each part */}
        <SectionTabs
          label={t("feedback.speakingTitle")}
          value={tab}
          onChange={setTab}
          items={[
            { key: "overall", title: t("breakdown.overall"), sub: t("skills.speaking"), band: s.band },
            ...s.parts.map((p) => ({ key: p.partId, title: t("breakdown.part", { n: formatNumber(p.part, locale) }), sub: t(`breakdown.partNames.${p.part}`), band: p.band ?? null })),
          ]}
        />

        {tab === "overall" ? (
          <>
            <blockquote className="col-span-12 rounded-e-xl border-s-[3px] border-rosewood bg-card px-4 py-3 text-sm">{pick(s.summary)}</blockquote>
            <ScoreBreakdown
              criteria={s.criteria}
              criterionLabel={(k) => t(`criteria.${k}`)}
              skillLabel={t("skills.speaking")}
              lift={(k) => {
                const others = r.data!.skills.filter((x) => x.skill !== "speaking").map((x) => x.band);
                const full = r.data!.overall !== null && others.length === 3;
                return liftFor(s.criteria, k, { skill: s.band, overall: r.data!.overall }, (b) => b, full ? (sp) => overallBand([...others, sp]) : null);
              }}
            />
            <Card className="col-span-12 lg:col-span-5">
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
            <Card className="col-span-12 lg:col-span-7">
              <CardLabel title={t("feedback.notes")} />
              <Notes notes={s.annotations} />
              <div className="mt-5 border-t border-border pt-4">
                <Button variant="outline" onClick={askCoach} disabled={coach.request.isPending}>
                  <GraduationCap /> {t("feedback.askCoachSpeaking")}
                </Button>
              </div>
            </Card>
          </>
        ) : (
          s.parts
            .filter((p) => p.partId === tab)
            .map((p) => {
              const own = s.annotations.filter((a) => p.transcript.includes(a.quote));
              return (
                <div key={p.partId} className="contents">
                  <Card className="col-span-12 lg:col-span-7">
                    <CardLabel title={`${t("feedback.part", { n: formatNumber(p.part, locale) })} · ${t(`breakdown.partNames.${p.part}`)}`} note={p.durationSec ? formatClock(p.durationSec, locale) : undefined} />
                    <div className="mt-3">
                      <Recording recordingKey={p.recordingKey} />
                    </div>
                    <div className="mt-4 text-[15px]">
                      <div className="mb-1.5 text-xs text-muted-foreground">{t("feedback.transcript")}</div>
                      <AnnotatedText text={p.transcript} notes={own} />
                    </div>
                  </Card>
                  <Card className="col-span-12 lg:col-span-5">
                    <CardLabel title={t("breakdown.partNotes")} />
                    {own.length ? <Notes notes={own} /> : <p className="mt-3 text-sm text-muted-foreground">{t("feedback.noNotes")}</p>}
                  </Card>
                </div>
              );
            })
        )}
      </div>
    </>
  );
}

function Notes({ notes }: { notes: SpeakingFeedback["annotations"] }) {
  const { t, pick } = useT();
  return (
    <ol className="mt-3 flex flex-col gap-2.5 text-sm">
      {notes.map((a, i) => (
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
  );
}
