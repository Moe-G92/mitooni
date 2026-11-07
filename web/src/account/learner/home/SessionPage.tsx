import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../../Button";
import type { Session, Workspace } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";
import { useOperation, useSkillName } from "./useOperation";

export default function SessionPage() {
  const { sessionId = "" } = useParams(); const resource = useLearnerResource<Session>(`/sessions/${encodeURIComponent(sessionId)}`); const { text, locale } = useLearnerLocale(); const skillName = useSkillName(); const navigate = useNavigate(); const op = useOperation();
  const [upload, setUpload] = useState(false);
  const [sound, setSound] = useState(false); const [microphone, setMicrophone] = useState(false); const [confirmed, setConfirmed] = useState(false); const [deviceError, setDeviceError] = useState(false); const [checking, setChecking] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function checkMicrophone() {
    setChecking(true); setDeviceError(false);
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach((track) => track.stop()); if (mounted.current) setMicrophone(true); }
    catch { if (mounted.current) setDeviceError(true); }
    finally { if (mounted.current) setChecking(false); }
  }
  async function playSound() {
    setDeviceError(false);
    try { const context = new AudioContext(); await context.resume(); const oscillator = context.createOscillator(); const gain = context.createGain(); gain.gain.value = 0.08; oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.6); oscillator.onended = () => { void context.close(); }; }
    catch { setDeviceError(true); }
  }
  if (!resource.data) return resource.loading ? <Loading /> : <Failure error={resource.error} onRetry={resource.reload} />;
  const data = resource.data;
  const current = data.sections.find((section) => section.status === "running") ?? data.sections.find((section) => section.status === "ready");
  const status: Record<Session["sections"][number]["status"], string> = { locked: text("قفل‌شده", "Locked"), ready: text("آماده", "Ready"), running: text("در حال انجام", "In progress"), submitted: text("ثبت‌شده", "Submitted"), expired: text("زمان تمام شده", "Time ended"), review_pending: text("در انتظار بازخورد", "Awaiting feedback"), reviewed: text("بازبینی‌شده", "Reviewed") };
  const ready = !!current && (current.skill !== "listening" || sound) && (current.skill !== "speaking" || microphone || upload) && confirmed;
  return <div className="mx-auto max-w-4xl space-y-6"><PageTitle>{data.kind === "baseline" ? text("تمرین شروع", "Starting practice") : text("آزمون آزمایشی", "Mock test")}</PageTitle>{!!resource.error && <Failure error={resource.error} onRetry={resource.reload} />}
    {current ? <Panel title={skillName(current.skill)}><h2 className="mb-4 text-lg font-semibold" dir="auto">{current.title}</h2><p className="mb-4">{Math.ceil(current.durationSeconds / 60)} {text("دقیقه", "minutes")}</p>
      {current.deadlineAt && <p className="mb-4">{text("پایان این بخش:", "Section ends:")} <bdi>{new Date(current.deadlineAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-GB")}</bdi></p>}
      {current.skill === "listening" && <div className="mb-4 space-y-3"><Button variant="outline" onClick={() => void playSound()}>{text("پخش صدای آزمایشی", "Play test sound")}</Button><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={sound} onChange={(event) => setSound(event.target.checked)} />{text("صدا را واضح می‌شنوم", "I can hear the sound clearly")}</label></div>}
      {current.skill === "speaking" && <div className="mb-4"><Button variant="outline" disabled={checking} onClick={() => void checkMicrophone()}>{microphone ? text("میکروفون آماده است", "Microphone ready") : checking ? text("در حال بررسی", "Checking") : text("بررسی دسترسی میکروفون", "Check microphone access")}</Button><label className="mt-3 flex min-h-11 items-center gap-3"><input type="checkbox" checked={upload} onChange={(event) => setUpload(event.target.checked)} />{text("فایل WAV ضبط‌شده را در بخش آزمون بارگذاری می‌کنم", "I will upload a recorded WAV file in the test section")}</label></div>}
      {deviceError && <p role="alert" className="mb-4">{text("دستگاه در دسترس نیست. تنظیمات صدا و مجوز میکروفون مرورگر را بررسی و دوباره تلاش کن.", "Device unavailable. Check your sound settings and browser microphone permission, then retry.")}</p>}
      <label className="mb-4 flex min-h-11 items-center gap-3"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{current.status === "running" ? text("آماده‌ام ادامه دهم؛ زمان متوقف نشده است.", "I am ready to resume; the timer has continued.") : text("آماده‌ام؛ با باز کردن بخش، زمان شروع می‌شود.", "I am ready; opening the section starts its timer.")}</label>
      <Button disabled={!ready || op.pending || op.locked} onClick={() => void op.run<Workspace>("/workspaces/resolve", { sessionId: data.id, sectionId: current.id, conditionPreset: "independent" }, (workspace) => navigate(`/learn/${encodeURIComponent(workspace.id)}`))}>{op.pending ? text("در حال باز کردن", "Opening") : current.status === "running" ? text("ادامهٔ بخش", "Resume section") : text("شروع بخش", "Start section")}</Button>{!!op.error && <Failure error={op.error} onRetry={() => void op.retry()} />}
    </Panel> : <Panel><p>{data.status === "completed" ? text("آزمون تکمیل شده است.", "Your test is complete.") : text("بخش آماده‌ای باقی نمانده است. پاسخ‌های ثبت‌شده را در نتایج ببین.", "No sections are ready. View submitted work in Results.")}</p><Link to="/app/results" className="mt-4 inline-flex min-h-11 items-center text-primary underline">{text("مشاهدهٔ نتایج", "View results")}</Link><Button variant="outline" className="ms-4" onClick={resource.reload}>{text("بررسی وضعیت", "Refresh status")}</Button></Panel>}
    <Panel title={text("بخش‌ها", "Sections")}><ol className="divide-y divide-border">{data.sections.map((section) => <li key={section.id} className="flex flex-wrap justify-between gap-3 py-4"><span>{skillName(section.skill)}</span><span className="text-sm text-muted-foreground">{Math.ceil(section.durationSeconds / 60)} {text("دقیقه", "min")} · {status[section.status]}</span>{section.workspaceId && !["ready", "locked", "running"].includes(section.status) && <Link className="inline-flex min-h-11 items-center text-primary underline" to={`/learn/${encodeURIComponent(section.workspaceId)}`}>{text("مشاهدهٔ پاسخ‌ها", "View work")}</Link>}</li>)}</ol></Panel>
  </div>;
}
