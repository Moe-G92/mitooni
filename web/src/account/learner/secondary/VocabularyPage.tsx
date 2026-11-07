import { useRef, useState, type FormEvent } from "react";
import { Button } from "../../Button";
import type { Vocabulary } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";

import { VocabularyReview } from "./VocabularyReview";

type WordInput = { word: string; meaning?: string; example?: string; expectedRevision: number };
export default function VocabularyPage() {
  const { text } = useLearnerLocale();
  const { data, error, loading, reload, client } = useLearnerResource<Vocabulary>("/vocabulary");
  const [form, setForm] = useState({ word: "", meaning: "", example: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const operation = useRef<{ body: WordInput; key: ReturnType<typeof crypto.randomUUID> } | null>(null);
  async function save(retry = false) {
    if (!data || saving) return;
    if (!retry || !operation.current) operation.current = { key: crypto.randomUUID(), body: { word: form.word.trim(), meaning: form.meaning.trim() || undefined, example: form.example.trim() || undefined, expectedRevision: data.revision ?? 0 } };
    const pending = operation.current;
    if (!pending) return;
    setSaving(true); setSaveError(null); setSaved(false);
    try {
      await client.mutate<Vocabulary>("/vocabulary", pending.body, pending.key);
      setForm({ word: "", meaning: "", example: "" }); operation.current = null; setSaved(true); reload();
    } catch (failure) { setSaveError(failure); } finally { setSaving(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void save(); }
  const field = "min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring";
  return <><PageTitle>{text("واژگان", "Vocabulary")}</PageTitle>{Boolean(error) && <Failure error={error} onRetry={reload} />}{loading && !data && <Loading />}{data && <div className="space-y-6">
    <Panel title={text("واژه‌های من", "My words")}>{!data.available ? <p>{text("واژگان اکنون در دسترس نیست.", "Vocabulary is currently unavailable.")}</p> : <>
      {data.items.length === 0 ? <p>{text("هنوز واژه‌ای ذخیره نکرده‌ای.", "You have not saved any words yet.")}</p> : <>
        <VocabularyReview data={data} loading={loading} client={client} reload={reload} />
      </>}
    </>}</Panel>
    {data.available && <Panel title={text("افزودن واژه", "Add word")}>{Boolean(saveError) && <><Failure error={saveError} onRetry={() => void save(true)} /><Button type="button" variant="outline" onClick={() => { operation.current = null; setSaveError(null); reload(); }}>{text("بارگذاری نسخهٔ ذخیره‌شده", "Reload saved version")}</Button></>}<form onSubmit={submit} className="space-y-4">
      <div><label className="mb-2 block font-medium" htmlFor="learner-word">{text("واژه", "Word")}</label><input id="learner-word" className={field} dir="ltr" lang="en" required maxLength={120} value={form.word} onChange={event => { setForm({ ...form, word: event.target.value }); setSaved(false); }} disabled={saving || Boolean(saveError)} /></div>
      <div><label className="mb-2 block font-medium" htmlFor="learner-meaning">{text("معنی", "Meaning")}</label><textarea id="learner-meaning" className={field} dir="auto" maxLength={1000} value={form.meaning} onChange={event => setForm({ ...form, meaning: event.target.value })} disabled={saving || Boolean(saveError)} /></div>
      <div><label className="mb-2 block font-medium" htmlFor="learner-example">{text("مثال", "Example")}</label><textarea id="learner-example" className={field} dir="ltr" lang="en" maxLength={1000} value={form.example} onChange={event => setForm({ ...form, example: event.target.value })} disabled={saving || Boolean(saveError)} /></div>
      {saved && <p role="status">{text("واژه ذخیره شد.", "Word saved.")}</p>}
      <Button type="submit" disabled={saving || Boolean(saveError) || loading || !form.word.trim()}>{saving ? text("در حال ذخیره", "Saving") : text("ذخیرهٔ واژه", "Save word")}</Button>
    </form></Panel>}
  </div>}</>;
}
