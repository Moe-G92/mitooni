import { useRef, useState } from "react";
import { Button } from "../../Button";
import type { LearnerClient } from "../client";
import type { Vocabulary } from "../contracts";
import { Failure, useLearnerLocale } from "../ui";

type Recall = "again" | "known";
type RecallOperation = { path: string; body: { recall: Recall; expectedRevision: number }; key: ReturnType<typeof crypto.randomUUID> };
export function VocabularyReview({ data, loading, client, reload }: { data: Vocabulary; loading: boolean; client: Pick<LearnerClient, "mutate">; reload: () => void }) {
  const { locale, text } = useLearnerLocale();
  const [updated, setUpdated] = useState<Vocabulary | null>(null);
  const current = updated && updated.revision > data.revision ? updated : data;
  const due = current.items.filter(item => item.due);
  const [reviewing, setReviewing] = useState(false);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const operation = useRef<RecallOperation | null>(null);
  const active = due[position % Math.max(1, due.length)];
  function date(value: string) { return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  async function recall(value?: Recall) {
    if (pending || !active || !revealed) return;
    if (value) operation.current = { path: `/vocabulary/${encodeURIComponent(active.id)}/reviews`, key: crypto.randomUUID(), body: { recall: value, expectedRevision: current.revision } };
    const request = operation.current;
    if (!request) return;
    setPending(true); setError(null); setSaved(false);
    try {
      const result = await client.mutate<Vocabulary>(request.path, request.body, request.key);
      setUpdated(result); operation.current = null; setSaved(true); setRevealed(false);
      // "Again" stays due; rotate to another due word when one exists.
      setPosition(value === "again" || request.body.recall === "again" ? position + 1 : position);
      reload();
    } catch (failure) { setError(failure); } finally { setPending(false); }
  }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{text("برای مرور", "Due for review")}: <span className="tabular-nums">{due.length}</span></p><Button type="button" variant="outline" disabled={pending || Boolean(error)} onClick={() => { setReviewing(!reviewing); setRevealed(false); setPosition(0); setError(null); setSaved(false); }}>{reviewing ? text("نمایش فهرست", "Show list") : text("مرور واژه‌ها", "Review words")}</Button></div>
    {saved && <p className="mt-4" role="status">{text("مرور ذخیره شد.", "Recall saved.")}</p>}
    {Boolean(error) && <><Failure error={error} onRetry={() => void recall()} /><Button type="button" variant="outline" disabled={pending} onClick={() => { operation.current = null; setError(null); setRevealed(false); reload(); }}>{text("بارگذاری نسخهٔ ذخیره‌شده", "Reload saved version")}</Button></>}
    {reviewing ? active ? <div className="mt-5" aria-busy={pending}>
      <h3 dir="ltr" lang="en" className="break-words text-2xl font-semibold">{active.word}</h3>
      {revealed && <div className="mt-4 space-y-3">{active.meaning ? <p dir="auto" className="whitespace-pre-wrap break-words">{active.meaning}</p> : <p>{text("معنی ذخیره نشده است.", "No meaning saved.")}</p>}{active.example && <p dir="ltr" lang="en" className="whitespace-pre-wrap break-words">{active.example}</p>}</div>}
      <div className="mt-5 flex flex-wrap gap-3">{!revealed ? <Button type="button" onClick={() => setRevealed(true)} disabled={loading}>{text("نمایش معنی", "Reveal meaning")}</Button> : <><Button type="button" variant="outline" disabled={pending || loading || Boolean(error)} onClick={() => void recall("again")}>{text("دوباره", "Again")}</Button><Button type="button" disabled={pending || loading || Boolean(error)} onClick={() => void recall("known")}>{text("یادم بود", "Remembered")}</Button></>}{pending && <p role="status">{text("در حال ذخیره", "Saving")}</p>}</div>
    </div> : <p className="mt-5">{text("اکنون واژه‌ای برای مرور نداری.", "No words are due for review now.")}</p> : <ul className="mt-5 divide-y divide-border">{current.items.map(item => <li key={item.id} className="space-y-2 py-4 first:pt-0 last:pb-0"><h3 dir="ltr" lang="en" className="break-words font-semibold">{item.word}</h3>{item.meaning && <p dir="auto" className="whitespace-pre-wrap break-words">{item.meaning}</p>}{item.example && <p dir="ltr" lang="en" className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.example}</p>}<p className="text-sm text-muted-foreground">{item.due ? text("زمان مرور رسیده", "Due now") : <>{text("مرور بعدی", "Next review")}: <time dateTime={item.dueAt}>{date(item.dueAt)}</time></>}</p></li>)}</ul>}
  </>;
}
