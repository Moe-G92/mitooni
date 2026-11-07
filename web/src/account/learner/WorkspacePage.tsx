import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { BookOpen, Headphones, Mic, PenLine } from "lucide-react";
import { Button } from "../Button";
import { BrandMark } from "../BrandMark";
import { TopControls } from "../TopControls";
import { AccountError } from "../request";
import { useLearnerClient, useLearnerResource } from "./hooks";
import type { ItemResponse, Job, Plan, Workspace } from "./contracts";
import SaveWord from "./secondary/SaveWord";
import { ProductFeedback } from "./ProductFeedback";
import type { z } from "zod";
import type { OutputSchema } from "./contracts";
import { Failure, Loading, Panel, useLearnerLocale } from "./ui";
import { ActivityFields, PrivateMedia, SpeakingRecorder, type LearnerItem, type LearnerResponse, type MediaState } from "./widgets";
import { MockListeningPlayer } from "./widgets/MockListeningPlayer";

const segment = (value: string) => encodeURIComponent(value);
type Operation = { path: string; body: unknown; key: string; method: "POST" | "PATCH"; effect: "workspace" | "job" | "plan" };
const itemKind: Record<string, LearnerItem["kind"]> = { single_choice: "choice", short_text: "gap", extended_text: "essay", matching: "matching", multi_select: "multi", ordered: "ordered" };
const responseKind: Record<string, ItemResponse["kind"]> = { single_choice: "choice", short_text: "short_text", extended_text: "essay", matching: "matching", multi_select: "multi_select", ordered: "ordered", spoken_response: "recording" };
const values = (workspace: Workspace): LearnerResponse => Object.fromEntries(workspace.draft.responses.map((response) => [response.itemId, response.value]));
function toResponses(workspace: Workspace, response: LearnerResponse): ItemResponse[] {
  return workspace.task.sections.flatMap((section) => section.questions).filter((item) => response[item.id] !== undefined).map((item) => ({ itemId: item.id, kind: responseKind[item.responseType], value: response[item.id] }));
}

export default function WorkspacePage() {
  const { workspaceId = "" } = useParams();
  return <WorkspaceView key={workspaceId} id={workspaceId} />;
}

function WorkspaceView({ id }: { id: string }) {
  const { text, locale } = useLearnerLocale();
  const resource = useLearnerResource<Workspace>(`/workspaces/${segment(id)}`);
  const { client, session, epoch } = useLearnerClient();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [response, setResponse] = useState<LearnerResponse>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const currentJob = useRef<Job | null>(null);
  const recoveryFence = useRef(0);
  const commitJob = useCallback((next: Job) => {
    currentJob.current = next;
    setJob(next);
  }, []);
  const [pollError, setPollError] = useState<unknown>(null);
  const [pollVersion, setPollVersion] = useState(0);
  const [pane, setPane] = useState<"task" | "tutor">("task");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [help, setHelp] = useState(false);
  const [leave, setLeave] = useState(false);
  const [question, setQuestion] = useState("");
  const [recordingBusy, setRecordingBusy] = useState(false);
  const previousStatus = useRef<Workspace["attempt"]["status"] | null>(null);
  const [upload, setUpload] = useState<{ itemId: string; blob: Blob; key: string; revision: number; attemptId: string } | null>(null);
  const dirty = workspace ? JSON.stringify(toResponses(workspace, response)) !== JSON.stringify(workspace.draft.responses) : false;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const ownerKey = `${epoch}:${id}:${workspace?.attempt.id ?? "loading"}`;
  const denied = (resource.error instanceof AccountError && ([401, 403, 404].includes(resource.error.status) || resource.error.code === "content_withdrawn")) || (error instanceof AccountError && ([401, 403].includes(error.status) || error.code === "content_withdrawn"));
  useEffect(() => {
    if (resource.data && !dirtyRef.current) { setWorkspace(resource.data); setResponse(values(resource.data)); }
  }, [resource.data]);
  useEffect(() => {
    const status = workspace?.attempt.status;
    if (status && status !== "open" && previousStatus.current === "open") {
      setPane("tutor");
      document.getElementById("learner-submission-result")?.focus();
    }
    previousStatus.current = status ?? null;
  }, [workspace?.attempt.status]);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => { if (dirtyRef.current || recordingBusy) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [recordingBusy]);
  useEffect(() => {
    const hintedId = workspace?.latestJobId;
    if (!hintedId || currentJob.current?.id === hintedId) return;
    if (currentJob.current && ["queued", "running", "cancel_requested"].includes(currentJob.current.status)) return;
    const owner = session.capture();
    const fence = recoveryFence.current;
    const abort = new AbortController();
    void client.read<Job>(`/jobs/${segment(hintedId)}`, abort.signal).then((next) => {
      session.assert(owner);
      if (abort.signal.aborted || fence !== recoveryFence.current) return;
      if (next.id !== hintedId || next.workspaceId !== id) throw new AccountError(502, "invalid_learner_response");
      const accepted = currentJob.current;
      if (accepted && accepted.id !== next.id && !(Date.parse(next.createdAt) > Date.parse(accepted.createdAt))) return;
      commitJob(next);
    }).catch((failure) => { if (!abort.signal.aborted && fence === recoveryFence.current) setPollError(failure); });
    return () => abort.abort();
  }, [workspace?.latestJobId, client, session, id, commitJob, pollVersion]);
  useEffect(() => {
    if (!job || !["queued", "running", "cancel_requested"].includes(job.status)) return;
    const abort = new AbortController();
    const timeout = setTimeout(() => {
      void client.read<Job>(`/jobs/${segment(job.id)}`, abort.signal).then((next) => {
        if (abort.signal.aborted) return;
        commitJob(next); setPollError(null);
        if (["completed", "failed", "canceled", "dispatch_unknown"].includes(next.status)) resource.reload();
      }).catch((failure) => { if (!abort.signal.aborted) setPollError(failure); });
    }, 1200);
    return () => { clearTimeout(timeout); abort.abort(); };
  }, [job, client, pollVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(op: Operation) {
    if (busy) return;
    const owner = session.capture();
    setBusy(true); setError(null); setOperation(op);
    try {
      if (op.effect === "workspace") {
        const next = await client.mutate<Workspace>(op.path, op.body, op.key, op.method);
        session.assert(owner);
        if (next.id !== id) { setOperation(null); navigate(`/learn/${segment(next.id)}`); return; }
        setWorkspace(next); setResponse(values(next));
      } else if (op.effect === "job") {
        recoveryFence.current++;
        const next = await client.mutate<Job>(op.path, op.body, op.key, op.method);
        session.assert(owner); commitJob(next); setPollError(null); setPane("tutor"); setQuestion("");
      } else {
        await client.mutate<Plan>(op.path, op.body, op.key, op.method);
        session.assert(owner); navigate("/app/plan");
      }
      setOperation(null);
    } catch (failure) { try { session.assert(owner); setError(failure); } catch { /* actor changed */ } }
    finally { try { session.assert(owner); setBusy(false); } catch { /* actor changed */ } }
  }
  const act = (path: string, body: unknown, effect: Operation["effect"] = "workspace", method: "POST" | "PATCH" = "POST") => void run({ path, body, effect, method, key: crypto.randomUUID() });
  const save = () => { if (workspace) act(`/workspaces/${segment(id)}/draft`, { expectedDraftRevision: workspace.draft.revision, responses: toResponses(workspace, response) }, "workspace", "PATCH"); };
  const refresh = () => { setOperation(null); setError(null); resource.reload(); };
  async function uploadRecording(itemId: string, blob: Blob, retry = false) {
    if (!workspace || busy) return;
    const owner = session.capture();
    const op = retry && upload ? upload : { itemId, blob, key: crypto.randomUUID(), revision: workspace.draft.revision, attemptId: workspace.attempt.id };
    setUpload(op); setBusy(true); setError(null);
    try {
      const recorded = await client.recording(op.attemptId, op.itemId, op.revision, op.blob, op.key);
      session.assert(owner);
      setResponse((old) => ({ ...old, [op.itemId]: recorded.id })); setUpload(null);
    } catch (failure) { try { session.assert(owner); setError(failure); } catch { /* stale actor */ } }
    finally { try { session.assert(owner); setBusy(false); } catch { /* stale actor */ } }
  }
  if (denied) return <div className="mx-auto max-w-xl p-6"><Failure error={error ?? resource.error} /><Button asChild><Link to="/app">{text("بازگشت", "Back")}</Link></Button></div>;
  if (!workspace) return <div className="mx-auto max-w-3xl p-6">{resource.error ? <Failure error={resource.error} onRetry={resource.reload} /> : <Loading />}</div>;
  const ws = workspace;
  const disabled = busy || recordingBusy || ws.attempt.status !== "open" || Boolean((operation || upload) && error);
  const can = (capability: string) => ws.capabilities.includes(capability);
  const section = ws.task.sections[sectionIndex];
  const Icon = { reading: BookOpen, listening: Headphones, writing: PenLine, speaking: Mic }[ws.task.skill];
  const output = job?.status === "completed" ? job.output : ws.feedback;
  const history = resource.data?.messages ?? ws.messages;
  const activeJob = job && ["queued", "running", "cancel_requested"].includes(job.status);
  const nextLink = ws.sessionId ? `/app/sessions/${segment(ws.sessionId)}` : "/app/plan";
  const ask = (intent: "explain" | "hint" | "propose_next", message = "") => act(`/workspaces/${segment(id)}/turns`, { expectedWorkspaceRevision: ws.revision, workRef: { kind: ws.attempt.status === "open" ? "draft" : "attempt", id: ws.attempt.status === "open" ? ws.id : ws.attempt.id, revision: ws.draft.revision }, intent, message }, "job");
  return <div className="min-h-dvh bg-background">
    <a href="#learner-work" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3">{text("رفتن به تمرین", "Skip to work")}</a>
    <header className="flex min-h-18 flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-8"><BrandMark /><div className="ms-auto flex items-center gap-3"><TopControls /><Button variant="outline" disabled={recordingBusy} onClick={() => dirty ? setLeave(true) : navigate(nextLink)}>{text("بازگشت", "Back")}</Button></div></header>
    <div className={`border-b border-border px-4 py-6 md:px-8 ${ws.task.skill === "writing" ? "bg-[#A61E2A] text-white" : "bg-pink-tint text-midnight-iris"}`}><div className="mx-auto flex max-w-[1280px] items-start gap-3"><Icon className="mt-1 size-6 shrink-0" aria-hidden="true" /><div className="min-w-0"><h1 lang="en" dir="ltr" className="break-words font-archivo text-2xl font-bold md:text-3xl">{ws.task.title}</h1><p className="mt-2 text-sm">{ws.attempt.conditions.current === "independent" ? text("تمرین مستقل", "Independent work") : text("تمرین با راهنمایی", "Supported work")}</p></div>{ws.attempt.status === "open" && ws.attempt.deadlineAt && <Timer deadline={ws.attempt.deadlineAt} serverNow={ws.serverNow} onExpire={resource.reload} />}</div></div>
    <main id="learner-work" className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
      {ws.attempt.status !== "open" && <section className="mb-6 rounded-card border border-border bg-card p-5 sm:p-6" aria-labelledby="learner-submission-result"><h2 id="learner-submission-result" tabIndex={-1} className="text-xl font-semibold">{ws.rawCheck ? text("نتیجهٔ تمرین", "Practice result") : text("پاسخ ثبت شد", "Response submitted")}</h2>{ws.rawCheck && <p className="mt-3 text-2xl font-semibold tabular-nums"><bdi>{ws.rawCheck.correctCount} / {ws.rawCheck.itemCount}</bdi> <span className="text-base font-normal">{text("پاسخ درست", "correct answers")}</span></p>}<div className="mt-4 flex flex-wrap gap-3">{can("tutor:use") && <Button disabled={busy || Boolean(activeJob)} onClick={() => act(`/attempts/${segment(ws.attempt.id)}/feedback`, { expectedWorkspaceRevision: ws.revision }, "job")}>{text("دریافت بازخورد", "Get feedback")}</Button>}<Button variant="outline" asChild><Link to={nextLink}>{ws.sessionId ? text("بخش بعدی", "Next section") : text("ادامهٔ برنامه", "Continue plan")}</Link></Button>{can("attempt:revise") && <Button variant="outline" disabled={busy} onClick={() => act(`/attempts/${segment(ws.attempt.id)}/revisions`, { expectedWorkspaceRevision: ws.revision })}>{text("اصلاح پاسخ", "Revise response")}</Button>}</div></section>}
      {leave && <Panel title={text("تغییرها ذخیره نشده‌اند", "Unsaved changes")}><div className="flex flex-wrap gap-3"><Button onClick={() => setLeave(false)}>{text("ادامهٔ تمرین", "Keep working")}</Button><Button variant="outline" onClick={() => navigate(nextLink)}>{text("خروج بدون ذخیره", "Leave without saving")}</Button></div></Panel>}
      {Boolean(error || resource.error) && <><Failure error={error ?? resource.error} onRetry={() => operation ? void run(operation) : upload ? void uploadRecording(upload.itemId, upload.blob, true) : resource.reload()} /><Button variant="outline" onClick={refresh}>{text("بررسی نسخهٔ ذخیره‌شده", "Check saved version")}</Button>{dirty && <p className="mt-2 text-sm">{text("نوشتهٔ فعلی تو تا کنار گذاشتن آن باقی می‌ماند.", "Your current response stays here until you discard it.")}</p>}</>}
      {resource.data && resource.data.revision !== ws.revision && dirty && <Panel title={text("نسخهٔ ذخیره‌شده تغییر کرده است", "The saved version has changed")}><Button variant="outline" onClick={() => { setWorkspace(resource.data); setResponse(values(resource.data!)); setOperation(null); setError(null); }}>{text("کنار گذاشتن نوشتهٔ فعلی و بارگذاری", "Discard current edits and load saved work")}</Button></Panel>}
      {ws.attempt.status !== "open" && ws.answerReview && <div className="my-5"><AnswerReview workspace={ws} /></div>}
      <div className="my-4 flex gap-2 md:hidden" role="group" aria-label={text("بخش تمرین", "Workspace pane")}><Button aria-pressed={pane === "task"} variant={pane === "task" ? "default" : "outline"} onClick={() => setPane("task")}>{text("تمرین", "Task")}</Button><Button aria-pressed={pane === "tutor"} variant={pane === "tutor" ? "default" : "outline"} onClick={() => setPane("tutor")}>{text("مربی و بازخورد", "Tutor and feedback")}</Button></div>
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={`min-w-0 space-y-5 ${pane !== "task" ? "hidden md:block" : ""}`}>
          {ws.task.kind === "unavailable" && <Panel title={text("کار ذخیره‌شدهٔ تو", "Your saved work")}><p className="mb-5">{text("این محتوای آموزشی دیگر در دسترس نیست. پاسخ‌های تو حفظ شده‌اند.", "This learning material is no longer available. Your responses have been retained.")}</p><ol className="space-y-4">{ws.draft.responses.map((item, index) => <li key={item.itemId}><span className="text-sm text-muted-foreground">{text("پاسخ", "Response")} <bdi>{index + 1}</bdi></span>{item.kind === "recording" ? <p>{text("صدای ذخیره‌شده", "Saved recording")}</p> : <p dir="auto" className="mt-2 whitespace-pre-wrap break-words">{typeof item.value === "string" ? item.value : Array.isArray(item.value) ? item.value.join(", ") : Object.values(item.value).join(", ")}</p>}</li>)}</ol></Panel>}
          {ws.task.sections.length > 1 && <nav aria-label={text("بخش‌های تمرین", "Task sections")} className="flex gap-2 overflow-x-auto">{ws.task.sections.map((part, index) => <Button key={part.id} variant={index === sectionIndex ? "default" : "outline"} aria-current={index === sectionIndex ? "step" : undefined} className="shrink-0" onClick={() => setSectionIndex(index)}>{part.title || `${text("بخش", "Part")} ${index + 1}`}</Button>)}</nav>}
          {ws.playbackPolicy === "one_pass" && <MockListeningAudio key={ws.attempt.id} workspace={ws} ownerKey={ownerKey} busy={busy || Boolean(operation && error)} onAccessDenied={setError} onStart={() => act(`/workspaces/${segment(id)}/playback/start`, { expectedWorkspaceRevision: ws.revision })} />}
          <TaskMedia workspace={ws} ownerKey={ownerKey} assetIds={section?.assetIds} onAccessDenied={setError} />
          {section && <Panel><article lang="en" dir="ltr" className="min-w-0 text-left leading-8">{section.title && <h2 className="mb-4 text-xl font-semibold">{section.title}</h2>}{section.instructions && <p className="mb-5 whitespace-pre-wrap font-medium">{section.instructions}</p>}{section.text && <div className="mb-6 whitespace-pre-wrap break-words">{section.text}</div>}{section.table && <TaskTable table={section.table} />}
            <ActivityFields locale={locale} items={section.questions.filter((item) => item.responseType !== "spoken_response").map((item) => ({ id: item.id, kind: itemKind[item.responseType], prompt: item.prompt, options: item.options.map((option) => ({ id: option.id, label: option.text })), maxLength: item.responseType === "extended_text" ? 20000 : 1000 }))} response={response} onChange={setResponse} disabled={disabled || !can("draft:write")} />
            {section.questions.filter((item) => item.responseType === "spoken_response").map((item) => <section key={item.id} className="mt-7 space-y-3"><h3 className="whitespace-pre-wrap font-medium">{item.prompt}</h3>{typeof response[item.id] === "string" && response[item.id] && <SavedRecording recordingId={String(response[item.id])} ownerKey={ownerKey} onAccessDenied={setError} />}{can("recording:write") && <SpeakingRecorder ownerKey={`${ownerKey}:${item.id}`} onBusy={setRecordingBusy} disabled={busy || ws.attempt.status !== "open"} locale={locale} onReady={(blob) => void uploadRecording(item.id, blob)} />}</section>)}
          </article></Panel>}
          <Panel><div role="status" className="mb-4 text-sm text-muted-foreground">{busy ? text("در حال انجام", "Working") : ws.attempt.status !== "open" ? text("پاسخ ثبت شده است", "Response submitted") : dirty ? text("تغییرهای ذخیره‌نشده", "Unsaved changes") : text("ذخیره شده", "Saved")}</div><div className="flex flex-wrap gap-3">
            {can("draft:write") && <Button variant="outline" disabled={disabled || !dirty} onClick={save}>{text("ذخیره", "Save")}</Button>}
            {can("attempt:submit") && <Button disabled={disabled || dirty} onClick={() => act(`/attempts/${segment(ws.attempt.id)}/submit`, { expectedWorkspaceRevision: ws.revision, expectedDraftRevision: ws.draft.revision, expectedConditionsRevision: ws.attempt.conditions.revision })}>{text("ثبت پاسخ", "Submit response")}</Button>}
            {can("attempt:revise") && <Button disabled={busy} variant="outline" onClick={() => act(`/attempts/${segment(ws.attempt.id)}/revisions`, { expectedWorkspaceRevision: ws.revision })}>{text("اصلاح پاسخ", "Revise response")}</Button>}
            {can("support:switch") && <Button variant="outline" disabled={busy || dirty} onClick={() => setHelp(true)}>{text("دریافت راهنمایی", "Get help")}</Button>}
            {ws.attempt.status !== "open" && <Button asChild><Link to={nextLink}>{text("ادامه", "Continue")}</Link></Button>}
          </div>{dirty && <p className="mt-3 text-sm text-muted-foreground">{text("پیش از ثبت پاسخ یا درخواست راهنمایی، تغییرها را ذخیره کن.", "Save your changes before submitting or asking for help.")}</p>}</Panel>
          {help && <Panel title={text("خروج از حالت مستقل", "Leave independent conditions")}><p>{text("با دریافت راهنمایی، این تلاش با راهنمایی ثبت می‌شود و دیگر مستقل به حساب نمی‌آید.", "Receiving help records this attempt as supported. It will no longer count as independent work.")}</p><div className="mt-4 flex flex-wrap gap-3"><Button disabled={busy} onClick={() => { setHelp(false); act(`/workspaces/${segment(id)}/assistance`, { expectedWorkspaceRevision: ws.revision, expectedConditionsRevision: ws.attempt.conditions.revision, action: "switch_to_supported" }); }}>{text("دریافت راهنمایی", "Receive help")}</Button><Button variant="outline" onClick={() => setHelp(false)}>{text("لغو", "Cancel")}</Button></div></Panel>}
        </div>
        <aside className={`min-w-0 space-y-5 ${pane !== "tutor" ? "hidden md:block" : ""}`} aria-label={text("مربی و بازخورد", "Tutor and feedback")}>
          {ws.task.teachingAnchors.length > 0 && <Panel title={text("درس", "Lesson")}><div className="space-y-5">{ws.task.teachingAnchors.map((anchor) => <article key={anchor.id} id={`anchor-${anchor.id}`}><h3 className="font-semibold" dir="auto">{anchor.label}</h3><p className="mt-2 whitespace-pre-wrap break-words" dir="auto">{anchor.text}</p></article>)}</div></Panel>}
          <Panel title={text("مربی", "Tutor")}>
            {history.length > 0 && <div className="mb-5 space-y-6 divide-y divide-border">{history.map((message) => <article key={message.id} className="space-y-3 pt-4 first:pt-0"><p dir="auto" className="whitespace-pre-wrap rounded-xl bg-secondary p-3">{message.requestText}</p><ConversationOutput output={message.output} /></article>)}</div>}
            {job && activeJob && <div role="status" className="mb-4">{text("در حال آماده‌سازی پاسخ", "Preparing response")}<Button variant="outline" className="mt-3" disabled={busy || job.status === "cancel_requested"} onClick={() => act(`/jobs/${segment(job.id)}/cancel`, { expectedRevision: job.revision }, "job")}>{text("توقف درخواست", "Cancel request")}</Button></div>}
            {Boolean(pollError) && <Failure error={pollError} onRetry={() => { setPollError(null); setPollVersion((value) => value + 1); }} />}
            {job?.error && <Failure error={new AccountError(503, job.error.code)} onRetry={() => { void client.read<Job>(`/jobs/${segment(job.id)}`).then((next) => { if (currentJob.current?.id === next.id) commitJob(next); }).catch(setPollError); }} />}
            {output && <div className="space-y-4">{(!job || !history.some((message) => message.jobId === job.id)) && <ConversationOutput output={output} />}{output.proposal && ws.planId && <Button disabled={busy || dirty} onClick={() => act(`/plans/${segment(ws.planId!)}/proposals/${segment(output.proposal!.id)}/accept`, { expectedPlanVersion: output.proposal!.expectedPlanVersion, expectedEvidenceRevision: output.proposal!.expectedEvidenceRevision }, "plan")}>{text("به‌روزرسانی برنامه", "Update plan")}</Button>}</div>}
            {can("tutor:use") ? <><div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" disabled={busy || dirty || Boolean(activeJob)} onClick={() => ask("explain")}>{text("توضیح درس", "Explain lesson")}</Button>{ws.attempt.status === "open" && <Button variant="outline" disabled={busy || dirty || Boolean(activeJob)} onClick={() => ask("hint")}>{text("راهنمایی", "Hint")}</Button>}</div><form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); ask("explain", question); }}><label htmlFor="learner-tutor-question" className="block font-medium">{output?.checkQuestion ? text("پاسخ تو", "Your response") : text("سؤال تو", "Your question")}</label><textarea id="learner-tutor-question" dir="auto" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={3000} rows={3} disabled={busy || Boolean(activeJob)} className="min-h-24 w-full rounded-xl border border-input p-3" /><Button type="submit" disabled={busy || dirty || Boolean(activeJob) || !question.trim()}>{output?.checkQuestion ? text("ارسال پاسخ", "Send response") : text("پرسیدن از مربی", "Ask tutor")}</Button>{ws.attempt.status !== "open" && <Button type="button" variant="outline" disabled={busy || Boolean(activeJob)} onClick={() => act(`/attempts/${segment(ws.attempt.id)}/feedback`, { expectedWorkspaceRevision: ws.revision }, "job")}>{text("دریافت بازخورد", "Get feedback")}</Button>}</form></> : <p className="mt-4 text-sm">{ws.attempt.conditions.current === "independent" ? text("مربی در تمرین مستقل راهنمایی نمی‌کند.", "Tutor help is off during independent work.") : text("مربی هوش مصنوعی اکنون در دسترس نیست. کار تو قابل ذخیره است.", "The AI tutor is unavailable. Your work can still be saved.")}</p>}
          </Panel>
          <SaveWord taskId={ws.task.id} context={output?.text ?? section?.text ?? ""} />
        </aside>
      </div>
      <ProductFeedback />
    </main>
  </div>;
}

function ConversationOutput({ output }: { output: z.infer<typeof OutputSchema> }) {
  const { text } = useLearnerLocale();
  const criterionLabel = (id: string) => ({
    "fluency-coherence": text("روانی و انسجام", "Fluency and coherence"),
    "lexical-resource": text("دامنهٔ واژگان", "Lexical resource"),
    "grammatical-range-accuracy": text("تنوع و دقت دستور زبان", "Grammatical range and accuracy"),
    pronunciation: text("تلفظ", "Pronunciation"),
    "task-response": text("پاسخ به تکلیف", "Task response"),
    "task-achievement": text("انجام تکلیف", "Task achievement"),
    "coherence-cohesion": text("انسجام و پیوستگی", "Coherence and cohesion"),
  })[id] ?? id.replaceAll("-", " ");
  const criteria = (items: NonNullable<z.infer<typeof OutputSchema>["criteria"]>) => items.map((criterion) => <section key={criterion.criterionId}>
    <h3 className="font-semibold" dir="auto">{criterionLabel(criterion.criterionId)}</h3>
    <p dir="auto" className="mt-2 whitespace-pre-wrap">{criterion.observation ?? criterion.text}</p>
    {criterion.revisionAction && <p dir="auto" className="mt-2">{criterion.revisionAction}</p>}
    {criterion.limitation && <p dir="auto" className="mt-2 text-sm text-muted-foreground">{criterion.limitation}</p>}
  </section>);
  return <div className="space-y-4">
    {output.text && <p dir="auto" className="whitespace-pre-wrap break-words leading-7">{output.text}</p>}
    {output.observations?.map((observation, index) => <section key={index}><p dir="auto">{observation.observation ?? observation.text}</p>{observation.revisionAction && <p className="mt-2" dir="auto">{observation.revisionAction}</p>}</section>)}
    {output.criteria && criteria(output.criteria)}
    {output.recordings?.map((recording, index) => <section key={recording.recordingId} className="space-y-4 border-t border-border pt-4"><h3 className="font-semibold">{text("پاسخ ضبط‌شده", "Recorded response")} <bdi>{index + 1}</bdi></h3>{criteria(recording.feedback.criteria)}{recording.feedback.limitations.map((limitation, at) => <p dir="auto" key={at} className="text-sm text-muted-foreground">{limitation}</p>)}</section>)}
    {output.limitations?.map((limitation, index) => <p dir="auto" key={index} className="text-sm text-muted-foreground">{limitation}</p>)}
    {output.citations?.map((citation) => <a key={citation.anchorId} href={`#anchor-${citation.anchorId}`} className="block min-h-11 py-2 underline" dir="auto">{citation.label}</a>)}
    {output.checkQuestion && <p dir="auto" className="border-s-2 border-primary ps-4 font-medium leading-7">{output.checkQuestion}</p>}
  </div>;
}

function AnswerReview({ workspace }: { workspace: Workspace }) {
  const { text } = useLearnerLocale();
  const review = workspace.answerReview!;
  const questions = workspace.task.sections.flatMap((section) => section.questions);
  const responses = workspace.attempt.responses.length ? workspace.attempt.responses : workspace.draft.responses;
  const display = (value: ItemResponse["value"] | undefined) => typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : value ? Object.values(value).join(", ") : "—";
  return <Panel title={text("مرور پاسخ‌ها", "Answer review")}><div className="divide-y divide-border">{review.items.map((item) => {
    const index = questions.findIndex((question) => question.id === item.itemId);
    const question = questions[index];
    const correct = workspace.rawCheck?.items.find((check) => check.itemId === item.itemId)?.correct;
    return <article key={item.itemId} className="space-y-3 py-5 first:pt-0 last:pb-0"><div className="flex flex-wrap items-baseline justify-between gap-3"><h3 className="font-semibold">{text("سؤال", "Question")} <bdi>{index >= 0 ? index + 1 : "—"}</bdi></h3>{correct !== undefined && <span className={`text-sm ${correct ? "text-muted-foreground" : "font-semibold text-weak"}`}>{correct ? text("درست", "Correct") : text("نیاز به مرور", "Review needed")}</span>}</div>{question?.prompt && <p lang="en" dir="ltr" className="whitespace-pre-wrap break-words">{question.prompt}</p>}<dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">{text("پاسخ تو", "Your answer")}</dt><dd lang="en" dir="ltr" className="mt-1 whitespace-pre-wrap break-words">{display(responses.find((response) => response.itemId === item.itemId)?.value)}</dd></div><div><dt className="text-sm text-muted-foreground">{text("پاسخ پذیرفته‌شده", "Accepted answer")}</dt><dd lang="en" dir="ltr" className="mt-1 whitespace-pre-wrap break-words font-medium">{item.acceptedAnswers.map(display).join(" / ")}</dd></div></dl>{item.rationale && <p dir="auto" className="whitespace-pre-wrap break-words leading-7">{item.rationale}</p>}</article>;
  })}</div>{review.answerGroups.length > 0 && <div className="mt-5 space-y-4 border-t border-border pt-5">{review.answerGroups.map((group, index) => <section key={index}><h3 className="font-semibold">{text("سؤال‌های", "Questions")} <bdi>{group.questionIds.map((id) => questions.findIndex((question) => question.id === id) + 1).filter((number) => number > 0).join(", ")}</bdi></h3><p lang="en" dir="ltr" className="mt-2 whitespace-pre-wrap break-words">{group.acceptedAnswers.map(display).join(", ")}</p>{group.orderIndependent && <p className="mt-2 text-sm">{text("ترتیب پاسخ‌ها اهمیتی ندارد", "Answers may be in any order")}</p>}{group.distinct && <p className="mt-2 text-sm">{text("هر پاسخ را یک بار استفاده کن", "Use each answer once")}</p>}</section>)}</div>}</Panel>;
}

function Timer({ deadline, serverNow, onExpire }: { deadline: string; serverNow: string; onExpire: () => void }) {
  const { text } = useLearnerLocale();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((Date.parse(deadline) - Date.parse(serverNow)) / 1000)));
  const expired = useRef(false);
  useEffect(() => {
    const start = performance.now();
    const initial = Math.max(0, (Date.parse(deadline) - Date.parse(serverNow)) / 1000);
    const tick = () => { const left = Math.max(0, Math.ceil(initial - (performance.now() - start) / 1000)); setRemaining(left); if (!left && !expired.current) { expired.current = true; onExpire(); } };
    tick(); const interval = setInterval(tick, 1000); return () => clearInterval(interval);
  }, [deadline, serverNow, onExpire]);
  return <span role="timer" className="ms-auto shrink-0 text-sm tabular-nums" aria-label={text("زمان باقی‌مانده", "Time remaining")}><bdi>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</bdi></span>;
}

function SavedRecording({ recordingId, ownerKey, onAccessDenied }: { recordingId: string; ownerKey: string; onAccessDenied: (failure: unknown) => void }) {
  const { client } = useLearnerClient();
  const { locale, text } = useLearnerLocale();
  const [media, setMedia] = useState<MediaState>({ loading: true });
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setMedia({ loading: true });
    void client.savedRecording(recordingId, abort.signal).then((blob) => {
      if (blob.type !== "audio/wav") throw new AccountError(502, "invalid_audio");
      if (!abort.signal.aborted) setMedia({ blob });
    }).catch((failure) => { if (!abort.signal.aborted) { if (failure instanceof AccountError && [401, 403].includes(failure.status)) onAccessDenied(failure); setMedia({ error: "recording_unavailable" }); } });
    return () => abort.abort();
  }, [client, recordingId, ownerKey, refresh, onAccessDenied]);
  return <PrivateMedia {...media} kind="audio" ownerKey={ownerKey} locale={locale} alt={text("صدای ذخیره‌شدهٔ تو", "Your saved recording")} onRetry={() => setRefresh((value) => value + 1)} />;
}

function MockListeningAudio({ workspace, ownerKey, onAccessDenied, onStart, busy }: { workspace: Workspace; ownerKey: string; onAccessDenied: (failure: unknown) => void; onStart: () => void; busy: boolean }) {
  const { client } = useLearnerClient();
  const { text, locale } = useLearnerLocale();
  const [media, setMedia] = useState<Record<string, Blob>>({});
  const [error, setError] = useState<unknown>(null);
  const [refresh, setRefresh] = useState(0);
  const clock = useRef({ stamp: workspace.serverNow, at: performance.now() });
  if (clock.current.stamp !== workspace.serverNow) clock.current = { stamp: workspace.serverNow, at: performance.now() };
  const playback = workspace.listeningPlayback;
  const audio = workspace.task.assets.filter((asset) => asset.mediaType.startsWith("audio/"));
  const order = playback?.orderedAssetIds ?? audio.map((asset) => asset.id);
  const signature = audio.map((asset) => `${asset.id}:${asset.sha256}`).join("|");
  useEffect(() => {
    const abort = new AbortController();
    setMedia({}); setError(null);
    for (const asset of audio) {
      void client.media(workspace.id, asset.id, abort.signal).then(async (blob) => {
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())), (value) => value.toString(16).padStart(2, "0")).join("");
        if (hash !== asset.sha256 || blob.type !== asset.mediaType) throw new AccountError(502, "invalid_media_bytes");
        if (!abort.signal.aborted) setMedia((old) => ({ ...old, [asset.id]: blob }));
      }).catch((failure) => { if (!abort.signal.aborted) { if (failure instanceof AccountError && [401, 403].includes(failure.status)) onAccessDenied(failure); setError(failure); } });
    }
    return () => abort.abort();
  }, [client, workspace.id, ownerKey, signature, refresh, onAccessDenied]); // eslint-disable-line react-hooks/exhaustive-deps
  const parts = order.map((id, index) => ({ id, blob: media[id], durationSeconds: playback?.durationsSeconds[index] ?? audio.find((asset) => asset.id === id)?.durationSeconds ?? 0 }));
  const ready = parts.length > 0 && parts.every((part) => part.blob && part.durationSeconds > 0);
  const now = new Date(Date.parse(clock.current.stamp) + performance.now() - clock.current.at).toISOString();
  return <Panel title={text("صدای آزمون", "Test audio")}>{error ? <Failure error={error} onRetry={() => setRefresh((value) => value + 1)} /> : !ready ? <p role="status">{text("در حال آماده‌سازی صدای آزمون", "Preparing test audio")}</p> : <MockListeningPlayer assets={parts as { id: string; blob: Blob; durationSeconds: number }[]} startedAt={playback?.startedAt ?? null} serverNow={now} onStart={onStart} starting={busy} locale={locale} />}</Panel>;
}

function TaskMedia({ workspace, ownerKey, assetIds, onAccessDenied }: { workspace: Workspace; ownerKey: string; assetIds?: string[]; onAccessDenied: (failure: unknown) => void }) {
  const { client } = useLearnerClient();
  const { locale, text } = useLearnerLocale();
  const [media, setMedia] = useState<Record<string, MediaState>>({});
  const [refresh, setRefresh] = useState(0);
  const assets = workspace.task.assets.filter((asset) => !(workspace.playbackPolicy === "one_pass" && asset.mediaType.startsWith("audio/"))).filter((asset) => assetIds ? assetIds.includes(asset.id) : !workspace.task.sections.some((section) => section.assetIds?.includes(asset.id)));
  const signature = assets.map((asset) => `${asset.id}:${asset.sha256}`).join("|");
  useEffect(() => {
    const abort = new AbortController();
    setMedia({});
    for (const asset of assets) {
      setMedia((old) => ({ ...old, [asset.id]: { loading: true } }));
      void client.media(workspace.id, asset.id, abort.signal).then(async (blob) => {
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())), (value) => value.toString(16).padStart(2, "0")).join("");
        if (hash !== asset.sha256 || blob.type !== asset.mediaType) throw new AccountError(502, "invalid_media_bytes");
        if (!abort.signal.aborted) setMedia((old) => ({ ...old, [asset.id]: { blob } }));
      }).catch((failure) => { if (!abort.signal.aborted) { if (failure instanceof AccountError && [401, 403].includes(failure.status)) onAccessDenied(failure); setMedia((old) => ({ ...old, [asset.id]: { error: "media_unavailable" } })); } });
    }
    return () => abort.abort();
  }, [client, workspace.id, ownerKey, signature, refresh]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!assets.length) return null;
  return <Panel>{assets.map((asset) => <PrivateMedia key={asset.id} ownerKey={ownerKey} kind={asset.mediaType.startsWith("audio/") ? "audio" : "image"} alt={asset.alt || (asset.mediaType.startsWith("audio/") ? text("صدای تمرین", "Practice audio") : workspace.task.title)} locale={locale} {...media[asset.id]} onRetry={() => setRefresh((value) => value + 1)} />)}</Panel>;
}

function TaskTable({ table }: { table: NonNullable<Workspace["task"]["sections"][number]["table"]> }) {
  const rows = Array.isArray(table) ? table : table.rows ?? [];
  const headers = Array.isArray(table) ? [] : table.headers ?? table.header ?? [];
  return <div className="mb-6 max-w-full overflow-x-auto"><table className="w-full border-collapse text-sm">{headers.length > 0 && <thead><tr>{headers.map((header, index) => <th key={index} scope="col" className="border-b border-border px-3 py-2 text-start">{header}</th>)}</tr></thead>}<tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-border px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
}
