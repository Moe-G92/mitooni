import { Link } from "react-router";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-5xl text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">{t("errors.notFound")}</h1>
      <p className="text-muted-foreground">{t("errors.notFoundBody")}</p>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/app">{t("errors.home")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">{t("errors.homePage")}</Link>
        </Button>
      </div>
    </div>
  );
}
