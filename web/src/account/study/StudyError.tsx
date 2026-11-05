import { AccountError } from "../request";
import { Button } from "../Button";
import { useStudyWords } from "./locale";
export function StudyError({
  error,
  onDiscard,
}: {
  error: unknown;
  onDiscard?: () => void;
}) {
  const w = useStudyWords();
  const failure = error instanceof AccountError ? error : null;
  const message =
    failure?.status === 403
      ? w.permission
      : failure?.status === 409
        ? w.conflict
        : failure?.code.includes("provider")
          ? w.unavailableProvider
          : w.error;
  return (
    <div
      role="alert"
      className="my-4 rounded-xl border border-border bg-card p-4 text-sm"
    >
      <p>{message}</p>
      {failure?.requestId && (
        <p className="mt-2 text-xs text-muted-foreground">
          {w.request}: <bdi>{failure.requestId}</bdi>
        </p>
      )}
      {failure?.status === 409 && onDiscard && (
        <Button className="mt-3" variant="outline" onClick={onDiscard}>
          {w.discard}
        </Button>
      )}
    </div>
  );
}
