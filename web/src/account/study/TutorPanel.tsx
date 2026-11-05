import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "../Button";
import { StudyError } from "./StudyError";
import { Textarea } from "@/components/ui/form";
import {
  activeTurn,
  type Intent,
  type Workspace,
  type Turn,
} from "./contracts";
import { messageMatchesCurrentWork } from "./messages";
import { useStudyWords } from "./locale";
export function TutorPanel({
  workspace,
  turn,
  busy,
  pollError,
  uncertain,
  onSend,
  onCheck,
  onRetryRequest,
  onCancel,
  onAccept,
  syntheticPreview = false,
}: {
  syntheticPreview?: boolean;
  workspace: Workspace;
  turn: Turn | null;
  busy: boolean;
  pollError: unknown;
  uncertain: boolean;
  onSend: (intent: Intent, message: string) => Promise<void>;
  onCheck: () => void;
  onRetryRequest?: () => Promise<void>;
  onCancel: () => Promise<void>;
  onAccept: (id: string, revision: number) => Promise<void>;
}) {
  const w = useStudyWords(),
    [message, setMessage] = useState("");
  const latestMessage = workspace.messages.at(-1);
  const previousMessage = useRef(latestMessage?.id);
  useEffect(() => {
    if (latestMessage && latestMessage.id !== previousMessage.current) {
      setMessage((current) =>
        current === latestMessage.requestText ? "" : current,
      );
      previousMessage.current = latestMessage.id;
    }
  }, [latestMessage]);
  const allowed =
    workspace.capabilities.includes("tutor:use") &&
    (workspace.attempt.currentConditions === "supported" ||
      workspace.attempt.status === "submitted");
  const active =
    activeTurn(turn) ||
    Boolean(
      workspace.activeTurnId && (!turn || turn.id !== workspace.activeTurnId),
    );
  const send = (intent: Intent) => void onSend(intent, message);
  return (
    <section
      aria-labelledby="tutor-heading"
      className="min-w-0 rounded-card border border-border bg-card"
    >
      <header className="border-b border-border p-4">
        <h2 id="tutor-heading" className="text-lg font-semibold">
          {w.tutor}
        </h2>
        {(syntheticPreview || turn?.runnerKind === "synthetic") && (
          <p className="mt-1 text-sm text-muted-foreground">{w.synthetic}</p>
        )}
      </header>
      <div className="space-y-5 p-4">
        {workspace.messages.map((item) =>
          messageMatchesCurrentWork(item, workspace) ? (
            <article
              key={item.id}
              className="space-y-3 border-b border-border pb-5 last:border-0 last:pb-0"
            >
              {item.requestText && (
                <div className="rounded-xl bg-muted p-3">
                  <p className="mb-1 text-xs font-semibold">{w.you}</p>
                  <p
                    className="whitespace-pre-wrap break-words text-sm leading-6"
                    dir="auto"
                  >
                    {item.requestText}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>
                  {item.provenance.runnerKind === "synthetic"
                    ? w.syntheticShort
                    : w.ai}
                </span>
                <bdi>
                  ·{" "}
                  {item.provenance.workRef.kind === "attempt" &&
                  item.provenance.workRef.id === workspace.attempt.id &&
                  item.provenance.workRef.revision ===
                    workspace.attempt.draftRevision
                    ? w.submitted
                    : item.provenance.workRef.kind === "draft" &&
                        item.provenance.workRef.id === workspace.draft.id &&
                        item.provenance.workRef.revision ===
                          workspace.draft.revision
                      ? w.savedVersion
                      : w.earlierWork}{" "}
                  {item.provenance.workRef.revision}
                </bdi>
              </div>
              <h3 className="font-semibold">
                {item.kind === "feedback"
                  ? w.feedbackTitle
                  : item.kind === "question"
                    ? w.question
                    : w.explanation}
              </h3>
              <p
                className="whitespace-pre-wrap break-words leading-7"
                dir="auto"
              >
                {item.text}
              </p>
              {item.observations.map((observation, index) => (
                <p
                  key={index}
                  className="whitespace-pre-wrap break-words text-sm leading-6"
                  dir="auto"
                >
                  {observation.text}
                </p>
              ))}
              {item.workSpans.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold">{w.quotation}</h4>
                  {item.workSpans.map((span, index) => (
                    <blockquote
                      key={index}
                      lang="en"
                      dir="ltr"
                      className="mt-2 border-s-2 border-primary ps-3 text-sm leading-6 whitespace-pre-wrap break-words"
                    >
                      {span.quote}
                    </blockquote>
                  ))}
                </div>
              )}
              {item.citations.length > 0 && (
                <div className="text-xs">
                  <h4 className="font-semibold">{w.source}</h4>
                  <ul className="mt-1 space-y-1">
                    {item.citations.map((citation) => {
                      const anchor = workspace.task.anchors.find(
                        (value) => value.id === citation.anchorId,
                      );
                      return (
                        <li key={citation.anchorId} dir="auto">
                          {anchor ? (
                            <details>
                              <summary className="flex min-h-11 cursor-pointer items-center font-medium underline decoration-border underline-offset-4">
                                {citation.label}
                              </summary>
                              <p className="whitespace-pre-wrap break-words leading-6">
                                {anchor.text}
                              </p>
                            </details>
                          ) : (
                            citation.label
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {item.proposalId &&
                workspace.proposals.some(
                  (p) => p.id === item.proposalId && p.status === "accepted",
                ) && (
                  <Link
                    to="/app"
                    className="inline-flex min-h-11 min-w-11 items-center rounded-lg border border-border px-4 font-medium text-primary"
                  >
                    {w.continue}
                  </Link>
                )}
              {item.proposalId &&
                workspace.proposals
                  .filter(
                    (p) => p.id === item.proposalId && p.status === "proposed",
                  )
                  .map((proposal) => (
                    <Button
                      key={proposal.id}
                      variant="outline"
                      disabled={busy || active}
                      onClick={() =>
                        void onAccept(
                          proposal.id,
                          proposal.expectedJourneyRevision,
                        )
                      }
                    >
                      {w.acceptance}
                    </Button>
                  ))}
            </article>
          ) : (
            <p key={item.id} role="alert">
              {w.failed}
            </p>
          ),
        )}
        {workspace.messages.length === 0 && !active && !allowed && (
          <p className="text-sm text-muted-foreground">{w.independentTutor}</p>
        )}
        <div role="status" aria-live="polite">
          {active ? (
            <p className="text-sm">
              {turn?.status === "cancel-requested" ? w.stopPending : w.pending}
            </p>
          ) : turn?.status === "failed" ? (
            <p>{w.failed}</p>
          ) : turn?.status === "dispatch-unknown" ? (
            <p>{w.uncertain}</p>
          ) : turn?.status === "canceled" ? (
            <p>{w.canceled}</p>
          ) : turn?.status === "completed" ? (
            <p className="text-sm">{w.ready}</p>
          ) : null}
        </div>
        {(pollError || uncertain) && (
          <div role="alert">
            <p>{uncertain ? w.uncertain : w.interrupted}</p>
            {Boolean(pollError) && <StudyError error={pollError} />}
            <Button variant="outline" disabled={busy} onClick={onCheck}>
              {w.check}
            </Button>
            {uncertain && onRetryRequest && (
              <Button
                className="ms-2"
                variant="outline"
                disabled={busy}
                onClick={() => void onRetryRequest()}
              >
                {w.retryRequest}
              </Button>
            )}
          </div>
        )}
        {active &&
          turn &&
          (!workspace.activeTurnId || workspace.activeTurnId === turn.id) && (
            <Button
              variant="outline"
              disabled={busy || turn.status === "cancel-requested"}
              onClick={() => void onCancel()}
            >
              {w.cancelTurn}
            </Button>
          )}
        {allowed &&
          turn?.status === "dispatch-unknown" &&
          turn.retryAction === "explicit_new_turn" && (
            <Button
              variant="outline"
              disabled={busy || uncertain}
              onClick={() =>
                send(
                  turn.intent === "feedback" &&
                    workspace.attempt.status !== "submitted"
                    ? "explain"
                    : turn.intent,
                )
              }
            >
              {w.newResponse}
            </Button>
          )}
        {allowed && turn?.status !== "dispatch-unknown" && (
          <div className="space-y-3 border-t border-border pt-4">
            <label
              className="block text-sm font-medium"
              htmlFor="tutor-message"
            >
              {w.message}
            </label>
            <Textarea
              id="tutor-message"
              rows={3}
              maxLength={3000}
              dir="auto"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy || active || uncertain}
            />
            <div className="flex flex-wrap gap-2">
              {Boolean(message.trim()) && (
                <Button
                  disabled={busy || active || uncertain}
                  onClick={() =>
                    send(
                      workspace.attempt.status === "submitted"
                        ? "feedback"
                        : "explain",
                    )
                  }
                >
                  {w.send}
                </Button>
              )}
              {workspace.attempt.status === "open" ? (
                <>
                  <Button
                    variant={
                      workspace.messages.length === 0 && !message.trim()
                        ? "default"
                        : "outline"
                    }
                    disabled={busy || active || uncertain}
                    onClick={() => send("explain")}
                  >
                    {workspace.messages.length === 0 ? w.begin : w.explain}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || active || uncertain}
                    onClick={() => send("hint")}
                  >
                    {w.hint}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    disabled={busy || active || uncertain}
                    onClick={() => send("feedback")}
                  >
                    {w.feedback}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || active || uncertain}
                    onClick={() => send("propose_next")}
                  >
                    {w.next}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
