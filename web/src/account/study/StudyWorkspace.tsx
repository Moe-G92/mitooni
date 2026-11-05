import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../Button";
import { StudyError } from "./StudyError";
import { Textarea } from "@/components/ui/form";
import { StudyShell } from "./StudyShell";
import { useWorkspace } from "./useWorkspace";
import { TutorPanel } from "./TutorPanel";
import { useStudyWords } from "./locale";
import { cn } from "@/lib/utils";
export default function StudyWorkspace() {
  const { workspaceId = "" } = useParams();
  return <Workspace key={workspaceId} id={workspaceId} />;
}
function Workspace({ id }: { id: string }) {
  const state = useWorkspace(id),
    w = useStudyWords(),
    navigate = useNavigate();
  const [paneChoice, setPane] = useState<"task" | "tutor" | null>(null),
    [help, setHelp] = useState(false),
    [leave, setLeave] = useState<string | null>(null);
  const ws = state.workspace;
  const pane =
    paneChoice ??
    (ws?.attempt.currentConditions === "supported" ? "tutor" : "task");
  useEffect(() => {
    if (ws?.attempt.currentConditions === "supported") {
      if (help) setPane("tutor");
      setHelp(false);
    }
  }, [ws?.attempt.currentConditions, help]);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => {
      if (state.dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [state.dirty]);
  useEffect(() => {
    if (!state.dirty) return;
    const guard = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!anchor) return;
      const url = new URL(
        (anchor as HTMLAnchorElement).href,
        window.location.href,
      );
      if (
        url.origin === window.location.origin &&
        /^\/(app|study)(?:\/|$)/.test(url.pathname) &&
        url.pathname !== window.location.pathname
      ) {
        event.preventDefault();
        event.stopPropagation();
        setLeave(url.pathname);
      }
    };
    document.addEventListener("click", guard, true);
    return () => document.removeEventListener("click", guard, true);
  }, [state.dirty]);
  const exit = () => {
    if (state.dirty) setLeave("/app/practice");
    else navigate("/app/practice");
  };
  return (
    <StudyShell
      kind={ws?.task.kind}
      title={ws?.task.title ?? (state.error ? w.error : w.load)}
      onExit={exit}
    >
      {state.local && (
        <aside className="border-b border-border px-4 py-2 text-center text-xs">
          {w.noTeachingApproval}
        </aside>
      )}
      {!ws ? (
        <div className="mx-auto max-w-xl p-6">
          {state.error ? (
            <>
              <StudyError error={state.error} />
              <Button onClick={() => void state.reload()}>{w.retry}</Button>
            </>
          ) : (
            <p role="status">{w.load}</p>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-6">
          {leave && (
            <section
              aria-label={w.exit}
              className="mb-5 rounded-card border border-border bg-card p-4"
            >
              <p>{w.dirtyExit}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setLeave(null)}>
                  {w.restore}
                </Button>
                <Button onClick={() => navigate(leave ?? "/app/practice")}>
                  {w.discardLeave}
                </Button>
              </div>
            </section>
          )}
          {Boolean(state.error) && (
            <div>
              <StudyError
                error={state.error}
                onDiscard={() => void state.reload(true)}
              />
              <Button
                variant="outline"
                disabled={state.busy}
                onClick={() => void state.reload(false)}
              >
                {w.retry}
              </Button>
            </div>
          )}
          <div
            className="mb-4 flex gap-2 md:hidden"
            role="group"
            aria-label={w.task}
          >
            <Button
              variant={pane === "task" ? "default" : "outline"}
              aria-pressed={pane === "task"}
              onClick={() => setPane("task")}
            >
              {w.task}
            </Button>
            <Button
              variant={pane === "tutor" ? "default" : "outline"}
              aria-pressed={pane === "tutor"}
              onClick={() => setPane("tutor")}
            >
              {w.tutor}
            </Button>
          </div>
          <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:grid-cols-[minmax(0,1fr)_380px]">
            <section
              aria-label={w.task}
              className={cn(
                "min-w-0 space-y-5",
                pane !== "task" && "hidden md:block",
              )}
            >
              <article
                lang="en"
                dir="ltr"
                className="rounded-card border border-border bg-card p-5 sm:p-6"
              >
                {ws.task.stimulus && (
                  <div className="mb-6 whitespace-pre-wrap break-words text-base leading-8">
                    {ws.task.stimulus}
                  </div>
                )}
                <p className="font-medium whitespace-pre-wrap break-words leading-7">
                  {ws.task.prompt}
                </p>
              </article>
              <section className="rounded-card border border-border bg-card p-5 sm:p-6">
                <p
                  role="status"
                  className="mb-3 text-xs font-medium text-muted-foreground"
                >
                  {ws.attempt.currentConditions === "independent"
                    ? w.independent
                    : w.supported}
                </p>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="study-response"
                    className="text-lg font-semibold"
                  >
                    {w.draft}
                  </label>
                  <span role="status" className="text-xs text-muted-foreground">
                    {ws.attempt.status === "submitted"
                      ? w.submitted
                      : state.busy
                        ? w.working
                        : state.dirty
                          ? w.unsaved
                          : w.saved}{" "}
                    · <bdi>{ws.draft.revision}</bdi>
                  </span>
                </div>
                <Textarea
                  id="study-response"
                  lang="en"
                  dir="ltr"
                  rows={ws.task.kind === "task2" ? 14 : 5}
                  maxLength={20000}
                  value={state.text}
                  onChange={(e) => state.edit(e.target.value)}
                  disabled={
                    state.busy ||
                    !ws.capabilities.includes("draft:write") ||
                    ws.attempt.status !== "open"
                  }
                  className="text-base leading-7"
                />
                <div
                  className="mt-2 text-end text-xs text-muted-foreground"
                  aria-live="off"
                >
                  <bdi>
                    {state.text.trim()
                      ? state.text.trim().split(/\s+/).length
                      : 0}
                  </bdi>{" "}
                  {w.words}
                </div>
                {ws.rawCheck &&
                  ws.rawCheck.workRef.kind === "attempt" &&
                  ws.rawCheck.workRef.id === ws.attempt.id &&
                  ws.rawCheck.workRef.revision === ws.attempt.draftRevision && (
                    <p className="mt-3 font-medium">
                      {w.raw}:{" "}
                      <bdi>
                        {ws.rawCheck.correctCount} / {ws.rawCheck.itemCount}
                      </bdi>
                    </p>
                  )}
                {ws.attempt.status === "submitted" && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {w.readonly}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {ws.attempt.status === "open" && (
                    <>
                      <Button
                        variant="outline"
                        disabled={
                          state.busy ||
                          !state.dirty ||
                          !ws.capabilities.includes("draft:write")
                        }
                        onClick={() => void state.save()}
                      >
                        {w.save}
                      </Button>
                      <Button
                        disabled={
                          state.busy ||
                          !state.text.trim() ||
                          !ws.capabilities.includes("attempt:submit")
                        }
                        onClick={() => void state.submit()}
                      >
                        {w.submit}
                      </Button>
                    </>
                  )}
                  {ws.capabilities.includes("attempt:revise") && (
                    <Button
                      disabled={state.busy}
                      onClick={() => void state.revise()}
                    >
                      {w.revise}
                    </Button>
                  )}
                  {ws.capabilities.includes("support:switch") && (
                    <Button
                      variant="outline"
                      disabled={state.busy}
                      aria-expanded={help}
                      aria-controls="study-help-switch"
                      onClick={() => setHelp((v) => !v)}
                    >
                      {w.help}
                    </Button>
                  )}
                </div>
                {help && (
                  <div
                    id="study-help-switch"
                    className="mt-4 border-t border-border pt-4"
                  >
                    <p>{w.helpEffect}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={state.busy}
                        onClick={() => setHelp(false)}
                      >
                        {w.cancel}
                      </Button>
                      <Button
                        disabled={state.busy}
                        onClick={() => {
                          void state.assistance();
                        }}
                      >
                        {w.confirm}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </section>
            <div
              className={cn("min-w-0", pane !== "tutor" && "hidden md:block")}
            >
              <TutorPanel
                workspace={ws}
                syntheticPreview={state.local}
                turn={state.turn}
                busy={state.busy}
                pollError={state.pollError}
                uncertain={state.sendUncertain}
                onSend={state.send}
                onCheck={state.check}
                onRetryRequest={
                  state.retryAvailable ? state.retryRequest : undefined
                }
                onCancel={state.cancel}
                onAccept={state.accept}
              />
            </div>
          </div>
        </div>
      )}
    </StudyShell>
  );
}
