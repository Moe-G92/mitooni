import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, BookOpen, Headphones, Mic, PenLine } from "lucide-react";
import type { Skill } from "@/api/schemas";
import { useAttempts, usePractice } from "@/api/queries";
import { useT } from "@/i18n";
import { formatNumber, formatPercent } from "@/lib/format";
import { startHref } from "@/lib/links";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, ErrorState, Segmented, Skeleton, StrengthTag, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";

const SKILLS: { skill: Skill; icon: typeof BookOpen }[] = [
  { skill: "listening", icon: Headphones },
  { skill: "reading", icon: BookOpen },
  { skill: "writing", icon: PenLine },
  { skill: "speaking", icon: Mic },
];

const strengthOf = (a: number) => (a < 0.55 ? "weakness" : a < 0.78 ? "fair" : "strength");

/* Practice rooms from the canvas: one tinted card per skill, each opening that skill's practice screen. */
const ROOM_TONE: Record<Skill, { card: string; ink: string }> = {
  listening: { card: "bg-pale-wisteria border-primary", ink: "text-midnight-iris" },
  reading: { card: "bg-pink-tint border-magenta", ink: "text-magenta" },
  writing: { card: "bg-[#FFECEE] border-coral", ink: "text-weak" },
  speaking: { card: "bg-strength-soft border-strength", ink: "text-strength" },
};

function Rooms() {
  const { t } = useT();
  return (
    <ul aria-label={t("practice.rooms")} className="mb-5.5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
      {SKILLS.map(({ skill }) => {
        const tone = ROOM_TONE[skill];
        return (
          <li key={skill} className="min-w-0">
            <Link
              to={`/practice/${skill}`}
              className={cn("flex h-full flex-col gap-1 rounded-[18px] border-t-[6px] px-4.5 py-4 text-foreground transition-[filter] hover:brightness-[0.97]", tone.card)}
            >
              <span className={cn("text-[11px] font-bold tracking-[0.1em] uppercase", tone.ink)}>{t(`practice.room.${skill}.kicker`)}</span>
              <b className={cn("font-archivo text-[22px] font-extrabold", tone.ink)}>{t(`skills.${skill}`)}</b>
              <span className="text-[13px] text-[#3a4855]">{t(`practice.room.${skill}.line`)}</span>
              <span className={cn("mt-auto inline-flex items-center gap-1 pt-1.5 text-[13px] font-bold", tone.ink)}>
                {t("practice.enter")} <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Practice() {
  const { t, locale } = useT();
  const [params, setParams] = useSearchParams();
  const catalog = usePractice();
  const open = useAttempts("in-progress");
  const focusType = params.get("type");
  const skillParam = params.get("skill");
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  // "Practise Listening" on the Overview arrives with ?skill=listening.
  const [skill, setSkill] = useState<Skill>(SKILLS.some((x) => x.skill === skillParam) ? (skillParam as Skill) : "reading");

  // "Focus here" links arrive with ?type=; open the skill that has it.
  useEffect(() => {
    if (!focusType || !catalog.data) return;
    const hit = catalog.data.find((s) => s.types.some((x) => x.type === focusType));
    if (hit) setSkill(hit.skill);
  }, [focusType, catalog.data]);

  const practiceOpen = open.data?.filter((a) => a.mode === "practice" || a.kind === "practice") ?? [];

  return (
    <>
      <PageHeader title={t("practice.title")} sub={t("practice.sub")} />
      <Rooms />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented<"practice" | "exam">
          label={t("practice.modeLabel")}
          value={mode}
          onChange={setMode}
          items={[
            { value: "practice", label: t("practice.modePractice") },
            { value: "exam", label: t("practice.modeTest") },
          ]}
        />
        <p className="text-sm text-muted-foreground">{mode === "practice" ? t("practice.modePracticeNote") : t("practice.modeTestNote")}</p>
      </div>

      {practiceOpen.length > 0 && (
        <Card className="mb-4">
          <h2 className="text-[15px] font-medium">{t("practice.unfinished")}</h2>
          <ul className="mt-2">
            {practiceOpen.map((a) => (
              <li key={a.id} className="flex items-center gap-3 border-t border-border py-2.5 first:border-0">
                <span className="flex-1 text-sm">{a.testTitle}</span>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/exam/${a.id}`}>{t("common.resume")}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {catalog.isError && <ErrorState message={t("errors.load")} onRetry={() => catalog.refetch()} />}
      {catalog.isLoading && <Skeleton className="h-80" />}
      {catalog.data && (
        <Tabs
          value={skill}
          onValueChange={(v) => {
            setSkill(v as Skill);
            if (focusType || skillParam) setParams({}, { replace: true });
          }}
        >
          <TabsList className="mb-4 flex-wrap">
            {SKILLS.map(({ skill: s, icon: Icon }) => (
              <TabsTrigger key={s} value={s} className="inline-flex items-center gap-2">
                <Icon className="size-4" aria-hidden="true" /> {t(`skills.${s}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          {catalog.data.map((group) => (
            <TabsContent key={group.skill} value={group.skill}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.types.flatMap((tp) =>
                  tp.sets.map((set) => {
                    const highlight = tp.type !== null && tp.type === focusType;
                    return (
                      <Card key={set.id} className={cn("flex flex-col", highlight && "ring-2 ring-primary")}>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-medium">
                            {tp.type ? t(`types.${tp.type}`) : group.skill === "writing" ? t("practice.writingTask", { n: set.title.slice(-1) }) : t("practice.speakingPart", { n: set.title.slice(-1) })}
                          </h3>
                          {tp.accuracy !== null && <StrengthTag strength={strengthOf(tp.accuracy)} label={t(`strength.${strengthOf(tp.accuracy)}`)} />}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {set.questions > 0
                            ? t("practice.meta", { count: set.questions, q: formatNumber(set.questions, locale), m: formatNumber(set.minutes, locale) })
                            : t("practice.metaMinutes", { m: formatNumber(set.minutes, locale) })}
                        </p>
                        {tp.accuracy !== null ? (
                          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                            <Bar value={tp.accuracy} className="flex-1" label={t("practice.accuracy")} />
                            {formatPercent(tp.accuracy, locale)}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-faint">{tp.attempts ? t("practice.done", { n: formatNumber(tp.attempts, locale) }) : t("practice.notTried")}</p>
                        )}
                        <Button asChild size="sm" variant={highlight ? "default" : "outline"} className="mt-4 self-start">
                          <Link to={startHref(set.id, mode)}>{mode === "practice" ? t("practice.practise") : t("practice.takeTimed")}</Link>
                        </Button>
                      </Card>
                    );
                  }),
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </>
  );
}
