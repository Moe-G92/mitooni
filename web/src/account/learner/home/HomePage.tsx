import { useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../../Button";
import { useAccount } from "../../state";
import type { Bootstrap, Preferences } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";
import { TodayBoard } from "./TodayBoard";
import { useOperation } from "./useOperation";

function Setup({ bootstrap, saved, full }: { bootstrap: Bootstrap; saved: () => void; full: boolean }) {
  const { account } = useAccount(); const { text, locale } = useLearnerLocale(); const op = useOperation();
  const profile = account!.profile!;
  const [track, setTrack] = useState<Preferences["examTrack"]>(bootstrap.preferences?.examTrack ?? "academic");
  const [hours, setHours] = useState(String(bootstrap.preferences?.weeklyHours ?? profile.weeklyHours));
  const [date, setDate] = useState((bootstrap.preferences ? bootstrap.preferences.testDate : profile.testDate) ?? "");
  const [level, setLevel] = useState((bootstrap.preferences ? bootstrap.preferences.selfReportedLevel : profile.currentLevel) === null ? "" : String(bootstrap.preferences ? bootstrap.preferences.selfReportedLevel : profile.currentLevel));
  const [targets, setTargets] = useState(bootstrap.preferences?.targets ?? profile.targets);
  const control = "mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3";
  return <Panel title={text("برنامهٔ تو", "Your preparation")}><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void op.run<Preferences>("/preferences", { expectedRevision: bootstrap.preferencesRevision, examTrack: track, weeklyHours: Number(hours), testDate: date || null, targets, selfReportedLevel: level === "" ? null : Number(level), locale }, saved, "PATCH"); }}>
    <fieldset disabled={op.pending || op.locked} className="grid gap-5 sm:grid-cols-2">
      <label>{text("نوع آزمون", "Test track")}<select className={control} value={track} onChange={(event) => setTrack(event.target.value as Preferences["examTrack"])}><option value="academic">Academic</option><option value="general_training">General Training</option></select></label>
      {full && <label>{text("ساعت مطالعه در هفته", "Weekly study hours")}<input className={control} type="number" min={0} max={60} step={1} required value={hours} onChange={(event) => setHours(event.target.value)} /></label>}
      {full && <label>{text("تاریخ آزمون (اختیاری)", "Test date (optional)")}<input className={control} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>}
      <label>{text("سطح فعلی به ارزیابی خودت", "Self-reported current band")}<select className={control} value={level} onChange={(event) => setLevel(event.target.value)}><option value="">{text("نمی‌دانم", "Unknown")}</option>{Array.from({ length: 19 }, (_, i) => i / 2).map((band) => <option key={band} value={band}>{band}</option>)}</select></label>
    </fieldset>
    {full && <fieldset disabled={op.pending || op.locked}><legend className="mb-3 font-semibold">{text("نمرهٔ هدف", "Target bands")}</legend><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{(Object.keys(targets) as (keyof typeof targets)[]).map((key) => <label key={key}>{({overall: text("کل", "Overall"), reading: text("خواندن", "Reading"), listening: text("شنیدن", "Listening"), writing: text("نوشتن", "Writing"), speaking: text("صحبت کردن", "Speaking")})[key]}<input className={control} type="number" required min={0} max={9} step={0.5} value={targets[key]} onChange={(event) => setTargets({ ...targets, [key]: Number(event.target.value) })} /></label>)}</div></fieldset>}
    {!!op.error && <Failure error={op.error} onRetry={() => void op.retry()} />}<Button type="submit" disabled={op.pending || op.locked}>{op.pending ? text("در حال ذخیره", "Saving") : text("ذخیره و ادامه", "Save and continue")}</Button>
  </form></Panel>;
}
export default function HomePage() {
  const [search, setSearch] = useSearchParams();
  const [editing, setEditing] = useState(search.get("prepare") === "1");
  const resource = useLearnerResource<Bootstrap>("/bootstrap"); const { text } = useLearnerLocale();
  if (resource.loading && !resource.data) return <Loading />;
  if (!resource.data) return <Failure error={resource.error} onRetry={resource.reload} />;
  const data = resource.data;
  return <div className="mx-auto max-w-5xl space-y-6"><PageTitle action={data.preferences && <Button variant="outline" onClick={() => setEditing(!editing)}>{editing ? text("بستن", "Close") : text("تنظیم برنامه", "Preparation settings")}</Button>}>{text("امروز", "Today")}</PageTitle>{!!resource.error && <Failure error={resource.error} onRetry={resource.reload} />}
    {!data.preferences || editing ? <Setup bootstrap={data} full={!!data.preferences} saved={() => { setEditing(false); setSearch({}, { replace: true }); resource.reload(); }} /> : <TodayBoard data={data} />}
  </div>;
}
