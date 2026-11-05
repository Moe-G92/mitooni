import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, BookOpen, PenLine } from "lucide-react";
import { useStudy } from "./useStudy";
import { type Journey } from "./contracts";
import { useStudyWords } from "./locale";
import { Button } from "../Button";
import { StudyError } from "./StudyError";
import { pageTitleClass } from "@/components/dashboard/styles";
export default function StudyHome({ catalog = false }: { catalog?: boolean }) {
  const { client, session, account, local } = useStudy();
  const w = useStudyWords(),
    navigate = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null),
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  const mounted = useRef(true),
    op = useRef<{ signature: string; key: string } | null>(null);
  const allowed = account?.membership.entitlements.includes("study:use");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!allowed) return;
    const owner = session.capture(),
      abort = new AbortController();
    setError(null);
    void client
      .journey(abort.signal)
      .then((j) => {
        session.assert(owner);
        if (!abort.signal.aborted) setJourney(j);
      })
      .catch((e) => {
        try {
          session.assert(owner);
          if (!abort.signal.aborted) setError(e);
        } catch {
          /* stale owner */
        }
      });
    return () => abort.abort();
  }, [client, session, allowed, refresh]);
  const open = async (
    stepId: string,
    conditionPreset: "supported" | "independent",
  ) => {
    if (!journey || busy) return;
    const owner = session.capture(),
      body = {
        stepId,
        conditionPreset,
        expectedJourneyRevision: journey.revision,
      },
      signature = JSON.stringify(body);
    if (op.current?.signature !== signature)
      op.current = { signature, key: crypto.randomUUID() };
    setBusy(true);
    setError(null);
    try {
      const workspace = await client.resolve(
        stepId,
        conditionPreset,
        journey.revision,
        op.current.key,
      );
      session.assert(owner);
      if (mounted.current) {
        op.current = null;
        navigate(`/study/${encodeURIComponent(workspace.id)}`);
      }
    } catch (e) {
      try {
        session.assert(owner);
        if (mounted.current) setError(e);
      } catch {
        /* stale owner */
      }
    } finally {
      try {
        session.assert(owner);
        if (mounted.current) setBusy(false);
      } catch {
        /* stale owner */
      }
    }
  };
  const steps = journey
    ? catalog
      ? journey.steps
      : journey.steps.filter((step) => step.state === "available").slice(0, 1)
    : [];
  return (
    <>
      <h1 className={pageTitleClass}>{catalog ? w.practice : w.today}</h1>
      {local && (
        <p className="mt-3 text-sm text-muted-foreground">
          {w.noTeachingApproval}
        </p>
      )}
      {!allowed ? (
        <p className="mt-6">{w.permission}</p>
      ) : error ? (
        <>
          <StudyError error={error} />
          <Button onClick={() => setRefresh((v) => v + 1)}>{w.retry}</Button>
        </>
      ) : !journey ? (
        <p role="status" className="mt-6">
          {w.load}
        </p>
      ) : steps.length === 0 ? (
        <p className="mt-6">{w.unavailable}</p>
      ) : (
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <section
              key={step.stepId}
              className="rounded-card border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                {step.skill === "reading" ? (
                  <BookOpen
                    className="mt-1 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <PenLine
                    className="mt-1 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                )}
                <h2 className="text-xl font-semibold" dir="auto">
                  {step.title}
                </h2>
              </div>
              {step.state === "locked" || step.conditionPresets.length === 0 ? (
                <p className="mt-4 text-sm">{w.unavailable}</p>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2">
                  {step.conditionPresets.map((preset) => (
                    <Button
                      key={preset}
                      variant={preset === "supported" ? "default" : "outline"}
                      disabled={busy}
                      onClick={() => void open(step.stepId, preset)}
                    >
                      {preset === "supported"
                        ? step.state === "completed"
                          ? w.openSaved
                          : w.supported
                        : w.independent}
                      <ArrowRight
                        className="size-4 rtl:rotate-180"
                        aria-hidden="true"
                      />
                    </Button>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
