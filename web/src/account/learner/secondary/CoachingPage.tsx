import type { Coaching } from "../contracts";
import { useLearnerResource } from "../hooks";
import { Failure, Loading, PageTitle, Panel, useLearnerLocale } from "../ui";
export default function CoachingPage() {
  const { text } = useLearnerLocale();
  const { data, loading, error, reload } = useLearnerResource<Coaching>("/coaching");
  return <><PageTitle>{text("مربی انسانی", "Human coaching")}</PageTitle><Panel>{Boolean(error) && <Failure error={error} onRetry={reload} />}{loading && !data && <Loading />}{data && <><p>{data.available ? text("اطلاعات درخواست مربی هنوز در دسترس نیست. بعداً دوباره بررسی کن.", "Coaching request details are not available yet. Check again later.") : text("درخواست مربی انسانی اکنون فعال نیست.", "Human coaching requests are currently unavailable.")}</p>{data.requests.length > 0 && <ul className="mt-5 divide-y divide-border">{data.requests.map((request, index) => <li className="py-3" key={request.id ?? index}><p>{text("درخواست مربی", "Coaching request")}</p>{request.status && <p className="text-sm text-muted-foreground"><bdi>{request.status}</bdi></p>}</li>)}</ul>}</>}</Panel></>;
}
