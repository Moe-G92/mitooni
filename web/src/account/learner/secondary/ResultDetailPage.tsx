import { Link, Navigate, useParams } from "react-router";
import type { Workspace } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, useLearnerLocale } from "../ui";
export default function ResultDetailPage() {
  const { attemptId = "" } = useParams();
  const { text } = useLearnerLocale();
  const { data, loading, error, reload } = useLearnerResource<Workspace>(`/results/${encodeURIComponent(attemptId)}`);
  if (data) return <Navigate to={`/learn/${encodeURIComponent(data.id)}`} replace />;
  return <><PageTitle>{text("مرور پاسخ", "Review work")}</PageTitle><Link className="inline-flex min-h-11 items-center underline" to="/app/results">{text("بازگشت به نتایج", "Back to results")}</Link>{loading && <Loading />}{Boolean(error) && <Failure error={error} onRetry={reload} />}</>;
}
