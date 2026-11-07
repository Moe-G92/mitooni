import { useNavigate } from "react-router";
import { Button } from "../../Button";
import type { Mocks, Session } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";
import { useOperation, useSkillName } from "./useOperation";
export default function MocksPage() {
  const resource = useLearnerResource<Mocks>("/mocks"); const { text } = useLearnerLocale(); const skillName = useSkillName(); const op = useOperation(); const navigate = useNavigate();
  if (!resource.data) return resource.loading ? <Loading /> : <Failure error={resource.error} onRetry={resource.reload} />;
  return <div className="mx-auto max-w-5xl space-y-6"><PageTitle>{text("آزمون‌های آزمایشی", "Mock tests")}</PageTitle>{!!resource.error && <Failure error={resource.error} onRetry={resource.reload} />}
    <Panel>{resource.data.mocks.length === 0 ? <p>{text("هنوز آزمون آزمایشی در دسترس نیست.", "No mock tests are available yet.")}</p> : <ul className="divide-y divide-border">{resource.data.mocks.map((mock) => <li className="flex flex-wrap items-center justify-between gap-4 py-5" key={mock.id}><div className="min-w-0 flex-1"><h2 className="break-words text-lg font-semibold" dir="auto">{mock.title}</h2><p className="mt-2">{mock.examTrack === "academic" ? "Academic" : "General Training"} · {Math.ceil(mock.durationSeconds / 60)} {text("دقیقه", "min")}</p><p className="mt-2 text-sm text-muted-foreground">{mock.skills.map(skillName).join(" · ")}</p>{mock.skills.length !== 4 && <p className="mt-2">{text("این آزمون همهٔ چهار مهارت را شامل نمی‌شود.", "This test does not cover all four skills.")}</p>}{!mock.available && <p className="mt-2">{text("محتوای این آزمون هنوز در دسترس نیست.", "This test's content is not available yet.")}</p>}</div><Button variant="outline" disabled={!mock.available || op.pending || op.locked} onClick={() => void op.run<Session>("/sessions", { kind: "mock", mockId: mock.id, mockVersion: mock.version }, (session) => navigate(`/app/sessions/${encodeURIComponent(session.id)}`))}>{op.pending ? text("در حال آماده‌سازی", "Preparing") : text("آماده‌سازی آزمون", "Prepare test")}</Button></li>)}</ul>}</Panel>
    {!!op.error && <Failure error={op.error} onRetry={() => void op.retry()} />}
  </div>;
}
