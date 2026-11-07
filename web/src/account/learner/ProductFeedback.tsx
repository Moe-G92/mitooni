import { useRef, useState, type FormEvent } from "react";
import { useLocation, useParams } from "react-router";
import { Button } from "../Button";
import { useLearnerResource } from "./hooks";
import type { ProductFeedback as Feedback } from "./contracts";
import { Failure, Panel, useLearnerLocale } from "./ui";

export function ProductFeedback() {
  const { text } = useLearnerLocale();
  const [open, setOpen] = useState(false);
  return <div className="mt-8 border-t border-border pt-5"><Button type="button" variant="ghost" aria-expanded={open} aria-controls="product-feedback" onClick={() => setOpen(!open)}>{text("بازخورد دربارهٔ برنامه", "App feedback")}</Button>{open && <div id="product-feedback" className="mt-4"><FeedbackForm /></div>}</div>;
}
function FeedbackForm() {
  const { text } = useLearnerLocale();
  const { data, client, error, reload } = useLearnerResource<Feedback>("/feedback");
  const { pathname } = useLocation();
  const { workspaceId } = useParams();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const op = useRef<{ body: { text: string; route: string; workspaceId: string | null; expectedRevision: number }; key: string } | null>(null);
  async function save(retry = false) {
    if (!data || busy) return;
    const operation = retry && op.current ? op.current : { body: { text: message.trim(), route: pathname, workspaceId: workspaceId ?? null, expectedRevision: data.revision }, key: crypto.randomUUID() };
    op.current = operation;
    setBusy(true); setFailure(null); setSaved(false);
    try { await client.mutate<Feedback>("/feedback", operation.body, operation.key); op.current = null; setMessage(""); setSaved(true); reload(); }
    catch (cause) { setFailure(cause); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void save(); }
  return <Panel><form onSubmit={submit} className="space-y-4"><label htmlFor="product-feedback-text" className="block font-medium">{text("تجربهٔ تو در این صفحه", "Your experience on this page")}</label><textarea id="product-feedback-text" dir="auto" maxLength={2000} required rows={4} value={message} disabled={busy || Boolean(failure)} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-xl border border-input p-3" />{Boolean(error) && <Failure error={error} onRetry={reload} />}{Boolean(failure) && <Failure error={failure} onRetry={() => void save(true)} />}{saved && <p role="status">{text("بازخوردت ذخیره شد", "Your feedback was saved")}</p>}<Button type="submit" disabled={!data || busy || Boolean(failure) || !message.trim()}>{busy ? text("در حال ذخیره", "Saving") : text("ذخیرهٔ بازخورد", "Save feedback")}</Button></form>{data && data.items.length > 0 && <details className="mt-5"><summary className="min-h-11 cursor-pointer py-2">{text("بازخوردهای من", "My feedback")}</summary><ul className="divide-y divide-border">{data.items.map((item) => <li key={item.id} className="py-3"><p dir="auto" className="whitespace-pre-wrap break-words">{item.text}</p><p dir="ltr" className="mt-2 break-words text-sm text-muted-foreground">{item.route}</p></li>)}</ul></details>}</Panel>;
}
