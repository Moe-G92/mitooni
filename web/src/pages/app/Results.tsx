import { useState } from "react";
import { Link } from "react-router";
import type { ResultSummary } from "@/api/schemas";
import { useResults } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Segmented, Skeleton, Tag } from "@/components/ui/misc";

type Filter = "all" | "full" | "section" | "practice";

export default function Results() {
  const { t, locale } = useT();
  const results = useResults();
  const [filter, setFilter] = useState<Filter>("all");
  const list = (results.data ?? []).filter((r) => filter === "all" || r.kind === filter);

  return (
    <>
      <PageHeader title={t("results.title")} sub={t("results.sub")} />
      <div className="mb-4">
        <Segmented<Filter>
          label={t("results.filter")}
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: t("results.all") },
            { value: "full", label: t("results.full") },
            { value: "section", label: t("results.section") },
            { value: "practice", label: t("results.practice") },
          ]}
        />
      </div>
      {results.isError && <ErrorState message={t("errors.load")} onRetry={() => results.refetch()} />}
      {results.isLoading && <Skeleton className="h-64" />}
      {results.data && list.length === 0 && (
        <EmptyState
          title={t("results.empty")}
          body={t("results.emptyBody")}
          action={
            <Button asChild>
              <Link to="/app/mocks">{t("nav.mocks")}</Link>
            </Button>
          }
        />
      )}
      {list.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-5 py-3 text-start font-medium">{t("results.date")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("results.test")}</th>
                {(["listening", "reading", "writing", "speaking"] as const).map((s) => (
                  <th key={s} className="px-3 py-3 text-center font-medium">
                    {t(`skills.${s}`)}
                  </th>
                ))}
                <th className="px-5 py-3 text-center font-medium">{t("skills.overall")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r: ResultSummary) => (
                <tr key={r.attemptId} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{formatDate(r.completedAt, locale)}</td>
                  <td className="px-3 py-3">
                    <Link to={`/app/results/${r.attemptId}`} className="font-medium hover:underline">
                      {r.testTitle}
                    </Link>
                    {r.mode === "practice" && <Tag className="ms-2 bg-muted text-muted-foreground">{t("results.practiceTag")}</Tag>}
                  </td>
                  {(["listening", "reading", "writing", "speaking"] as const).map((s) => (
                    <td key={s} className="px-3 py-3 text-center font-mono">
                      {formatBand(r.skills.find((x) => x.skill === s)?.band, locale)}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-center font-mono font-medium">{formatBand(r.overall, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
