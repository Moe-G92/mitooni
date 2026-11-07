import type { ReactNode } from "react";
import { usePrefs } from "@/lib/prefs";
import { AccountError } from "../request";
import { Button } from "../Button";

// eslint-disable-next-line react-refresh/only-export-components -- shared locale hook follows account locale API.
export function useLearnerLocale() {
  const { locale } = usePrefs();
  return { locale, fa: locale === "fa", text: (fa: string, en: string) => locale === "fa" ? fa : en };
}

export function Panel({ children, title, className = "" }: { children: ReactNode; title?: string; className?: string }) {
  return <section className={`min-w-0 rounded-card border border-border bg-card p-5 sm:p-6 ${className}`}>
    {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}{children}
  </section>;
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 tabIndex={-1} className="text-2xl font-semibold text-foreground">{children}</h1>{action}</div>;
}

export function Loading() {
  const { text } = useLearnerLocale();
  return <div role="status" className="space-y-4 py-5"><span>{text("در حال بارگذاری", "Loading")}</span><div aria-hidden="true" className="h-36 rounded-card bg-muted" /></div>;
}

const errors: Record<string, [string, string]> = {
  revision_conflict: ["اطلاعات در برگهٔ دیگری تغییر کرده. نسخهٔ ذخیره‌شده را دوباره بارگذاری کن؛ نوشتهٔ فعلی تو باقی می‌ماند.", "This work changed in another tab. Reload the saved version; your current text is preserved."],
  content_withdrawn: ["این محتوای آموزشی دیگر در دسترس نیست. کار ذخیره‌شدهٔ تو حفظ شده است.", "This learning material is no longer available. Your saved work is retained."],
  content_gap: ["هنوز فعالیت مناسبی در این بخش موجود نیست.", "There is no suitable activity available in this section yet."],
  provider_unavailable: ["مربی هوش مصنوعی اکنون در دسترس نیست. کار تو ذخیره می‌شود؛ بعداً دوباره تلاش کن.", "The AI tutor is unavailable. Your work can still be saved. Try again later."],
  budget_exhausted: ["ظرفیت بازخورد هوش مصنوعی به پایان رسیده است. کار تو حفظ شده است.", "AI feedback capacity has been reached. Your work is retained."],
  dispatch_unknown: ["وضعیت درخواست بازخورد هنوز مشخص نیست. وضعیت همین درخواست را بررسی کن.", "The feedback request status is uncertain. Check this request again."],
  deadline_passed: ["زمان این بخش تمام شده است. وضعیت پاسخ‌های ذخیره‌شده را بررسی کن.", "This section has ended. Check the status of your saved answers."],
  condition_switch_required: ["برای دریافت راهنمایی باید از حالت مستقل خارج شوی.", "Switch out of independent conditions to receive help."],
  access_required: ["دسترسی یادگیری برای این حساب فعال نیست.", "Learning access is not active for this account."],
  invalid_audio: ["فایل ضبط‌شده قابل استفاده نیست. دوباره صدای خود را ضبط کن.", "This recording could not be used. Record a new take."],
  storage_limit: ["ظرفیت ذخیرهٔ صدا پر شده است. دوباره تلاش کن یا با پشتیبانی تماس بگیر.", "Recording storage is full. Retry or contact support."],
};

export function Failure({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { fa, text } = useLearnerLocale();
  const pair = error instanceof AccountError ? errors[error.code] : undefined;
  return <div role="alert" className="my-4 rounded-xl border border-border bg-card p-4">
    <p>{pair?.[fa ? 0 : 1] ?? text("انجام نشد. اتصال را بررسی کن و دوباره تلاش کن.", "That did not work. Check your connection and try again.")}</p>
    {onRetry && <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>{text("تلاش دوباره", "Retry")}</Button>}
  </div>;
}
