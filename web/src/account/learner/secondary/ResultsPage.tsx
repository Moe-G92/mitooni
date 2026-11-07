import { Link } from "react-router";
import { Button } from "../../Button";
import type { Results } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";
import { Attempts } from "./Attempts";
export default function ResultsPage() {
  const { text } = useLearnerLocale();
  const { data, loading, error, reload } = useLearnerResource<Results>("/results");
  return <><PageTitle>{text("نتایج", "Results")}</PageTitle><Panel>
    {Boolean(error) && <Failure error={error} onRetry={reload} />}{loading && !data && <Loading />}
    {data && (data.attempts.length ? <Attempts attempts={data.attempts} /> : <div><p>{text("هنوز پاسخ ثبت‌شده‌ای نداری.", "You have no submitted work yet.")}</p><Button asChild className="mt-4"><Link to="/app/practice">{text("شروع تمرین", "Start practice")}</Link></Button></div>)}
  </Panel></>;
}
