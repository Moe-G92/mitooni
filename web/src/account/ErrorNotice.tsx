import { AccountError } from "./transport";
import { useWords } from "./locale";
import { Button } from "./Button";
export function ErrorNotice({
  error,
  onReload,
}: {
  error: unknown;
  onReload?: () => void;
}) {
  const w = useWords();
  const conflict = error instanceof AccountError && error.status === 409;
  return (
    <div
      role="alert"
      className="my-4 rounded-xl border border-border bg-card p-4 text-sm"
    >
      <p>{conflict ? w.conflict : w.error}</p>
      {error instanceof AccountError && error.requestId && (
        <p className="mt-2 text-xs text-muted-foreground">
          {w.request}: <bdi>{error.requestId}</bdi>
        </p>
      )}
      {conflict && onReload && (
        <Button
          type="button"
          className="mt-3"
          variant="outline"
          onClick={onReload}
        >
          {w.reload}
        </Button>
      )}
    </div>
  );
}
