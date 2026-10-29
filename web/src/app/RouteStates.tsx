import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";

export function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <span className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function RouteError() {
  const err = useRouteError();
  const { t } = useT();
  const message = isRouteErrorResponse(err) ? `${err.status} ${err.statusText}` : err instanceof Error ? err.message : String(err);
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{t("errors.title")}</h1>
      <p className="text-muted-foreground">{t("errors.body")}</p>
      <pre className="max-w-full overflow-x-auto rounded-xl bg-muted px-4 py-3 text-start text-xs" dir="ltr">
        {message}
      </pre>
      <Button asChild>
        <Link to="/app">{t("errors.home")}</Link>
      </Button>
    </div>
  );
}
