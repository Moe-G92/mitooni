import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useCreateAttempt } from "@/api/queries";
import { PageFallback } from "@/app/RouteStates";

/** /exam/new/:testId?mode=practice creates an attempt and opens the exam shell. */
export default function NewAttempt() {
  const { testId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const create = useCreateAttempt();
  const done = useRef(false);

  useEffect(() => {
    // The request is not cancelled by effect cleanup, so marking it started up front
    // stops React StrictMode's second effect run from creating a second attempt.
    if (!testId || done.current) return;
    done.current = true;
    const mode = params.get("mode") === "practice" ? "practice" : "exam";
    create.mutate(
      { testId, mode },
      {
        onSuccess: (a) => navigate(`/exam/${a.id}`, { replace: true }),
        onError: () => navigate("/app/mocks", { replace: true }),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  return <PageFallback />;
}
