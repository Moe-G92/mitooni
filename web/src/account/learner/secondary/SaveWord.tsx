import { useRef, useState, type FormEvent } from "react";
import { Button } from "../../Button";
import type { Vocabulary } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, useLearnerLocale } from "../ui";

type AddOperation = { key: ReturnType<typeof crypto.randomUUID>; body: { word: string; meaning?: string; example?: string; sourceTaskId: string; expectedRevision: number } };
function SaveWordForm({ taskId, context }: { taskId: string; context: string }) {
  const { text } = useLearnerLocale();
  const { data, error, loading, reload, client } = useLearnerResource<Vocabulary>("/vocabulary");
  const [form, setForm] = useState({ word: "", meaning: "", example: context.slice(0, 1000) });
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const operation = useRef<AddOperation | null>(null);
  async function save(retry = false) {
    if (!data || !data.available || pending) return;
    if (!retry) operation.current = { key: crypto.randomUUID(), body: { word: form.word.trim(), meaning: form.meaning.trim() || undefined, example: form.example.trim() || undefined, sourceTaskId: taskId, expectedRevision: data.revision } };
    const request = operation.current;
    if (!request) return;
    setPending(true); setFailure(null); setSaved(false);
    try {
      await client.mutate<Vocabulary>("/vocabulary", request.body, request.key);
      operation.current = null; setSaved(true); setForm({ ...form, word: "", meaning: "" }); reload();
    } catch (error) { setFailure(error); } finally { setPending(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void save(); }
  const field = "min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-ring";
  return <div className="mt-3 space-y-3">{Boolean(error) && <Failure error={error} onRetry={reload} />}{loading && !data && <Loading />}{Boolean(failure) && <><Failure error={failure} onRetry={() => void save(true)} /><Button type="button" variant="outline" onClick={() => { operation.current = null; setFailure(null); reload(); }}>{text("بارگذاری نسخهٔ ذخیره‌شده", "Reload saved version")}</Button></>}{data && (data.available ? <form onSubmit={submit} className="space-y-3">
    <label className="block"><span className="mb-2 block">{text("واژه", "Word")}</span><input className={field} lang="en" dir="ltr" required maxLength={120} value={form.word} onChange={event => { setForm({ ...form, word: event.target.value }); setSaved(false); }} disabled={pending || Boolean(failure)} /></label>
    <label className="block"><span className="mb-2 block">{text("معنی", "Meaning")}</span><input className={field} dir="auto" maxLength={1000} value={form.meaning} onChange={event => setForm({ ...form, meaning: event.target.value })} disabled={pending || Boolean(failure)} /></label>
    <label className="block"><span className="mb-2 block">{text("مثال", "Example")}</span><textarea className={field} lang="en" dir="ltr" maxLength={1000} value={form.example} onChange={event => setForm({ ...form, example: event.target.value })} disabled={pending || Boolean(failure)} /></label>
    <Button type="submit" disabled={pending || loading || Boolean(failure) || !form.word.trim()}>{pending ? text("در حال ذخیره", "Saving") : text("ذخیرهٔ واژه", "Save word")}</Button>
  </form> : <p>{text("واژگان اکنون در دسترس نیست.", "Vocabulary is currently unavailable.")}</p>)}{saved && <p role="status">{text("واژه ذخیره شد.", "Word saved.")}</p>}</div>;
}
export default function SaveWord(props: { taskId: string; context: string }) {
  const { text } = useLearnerLocale();
  const [opened, setOpened] = useState(false);
  return <details className="mt-4" onToggle={event => { if (event.currentTarget.open) setOpened(true); }}><summary className="min-h-11 cursor-pointer py-3 font-medium focus-visible:outline-2 focus-visible:outline-ring">{text("ذخیرهٔ واژه", "Save word")}</summary>{opened && <SaveWordForm key={props.taskId} {...props} />}</details>;
}
