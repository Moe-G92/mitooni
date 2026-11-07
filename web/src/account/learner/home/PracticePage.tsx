import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Bootstrap, Plan, Skill } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";
import { StepList } from "./shared";
import { Button } from "../../Button";
import { useOperation, useSkillName } from "./useOperation";
export default function PracticePage() {
  const resource = useLearnerResource<Bootstrap>("/bootstrap"); const { text } = useLearnerLocale(); const op = useOperation(); const skillName = useSkillName(); const [search] = useSearchParams(); const initialSkill = search.get("skill"); const [skill, setSkill] = useState<Skill | "all">((["listening", "reading", "writing", "speaking"] as string[]).includes(initialSkill ?? "") ? initialSkill as Skill : "all");
  if (resource.loading && !resource.data) return <Loading />;
  return <div className="mx-auto max-w-5xl space-y-6"><PageTitle action={<label className="flex items-center gap-3">{text("مهارت", "Skill")}<select className="min-h-11 rounded-xl border border-border bg-card px-3" value={skill} onChange={(event) => setSkill(event.target.value as Skill | "all")}><option value="all">{text("همه", "All")}</option>{(["listening", "reading", "writing", "speaking"] as Skill[]).map((item) => <option key={item} value={item}>{skillName(item)}</option>)}</select></label>}>{text("تمرین", "Practice")}</PageTitle>
    {!!resource.error && <Failure error={resource.error} onRetry={resource.reload} />}
    <Panel>{resource.data?.activePlan ? <StepList plan={resource.data.activePlan} skill={skill === "all" ? undefined : skill} /> : !resource.error && (resource.data?.preferences ? <Button disabled={op.pending || op.locked} onClick={() => void op.run<Plan>("/plans", { expectedPreferencesRevision: resource.data!.preferencesRevision, expectedEvidenceRevision: resource.data!.evidenceRevision }, resource.reload)}>{op.pending ? text("در حال ساخت", "Creating") : text("ساخت برنامهٔ تمرین", "Create practice plan")}</Button> : <Link className="inline-flex min-h-11 items-center text-primary underline" to="/app">{text("تنظیم برنامه", "Set up preparation")}</Link>)}</Panel>
    {!!op.error && <Failure error={op.error} onRetry={() => void op.retry()} />}
  </div>;
}
