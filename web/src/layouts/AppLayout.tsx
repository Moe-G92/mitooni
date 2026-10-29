import { NavLink, Outlet } from "react-router";
import { BarChart3, BookOpen, Clock, GraduationCap, Home, LineChart, NotebookPen, Settings } from "lucide-react";
import { useMe } from "@/api/queries";
import { useT } from "@/i18n";
import { formatBand, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";

const NAV = [
  { to: "/app", key: "nav.overview", icon: Home, end: true },
  { to: "/app/practice", key: "nav.practice", icon: NotebookPen },
  { to: "/app/mocks", key: "nav.mocks", icon: Clock },
  { to: "/app/results", key: "nav.results", icon: BarChart3 },
  { to: "/app/progress", key: "nav.progress", icon: LineChart },
  { to: "/app/vocabulary", key: "nav.vocabulary", icon: BookOpen },
  { to: "/app/coach", key: "nav.coach", icon: GraduationCap },
  { to: "/app/settings", key: "nav.settings", icon: Settings },
] as const;

/* Sidebar shell from docs/mockups/dashboard.html. Collapses to an icon row under 760px. */
export function AppLayout() {
  const { t, locale } = useT();
  const me = useMe();
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
        {t("nav.skip")}
      </a>
      <aside className="flex min-w-0 items-center gap-3 border-b border-border px-4 py-3 md:flex-col md:items-stretch md:gap-5.5 md:border-e md:border-b-0 md:px-4 md:py-5.5 md:sticky md:top-0 md:h-screen">
        <BrandMark />
        <nav aria-label={t("nav.label")} className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto md:flex-none md:flex-col">
          {NAV.map(({ to, key, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "bg-card text-foreground shadow-[0_1px_0_var(--border)]",
                )
              }
            >
              <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only md:not-sr-only">{t(key)}</span>
            </NavLink>
          ))}
        </nav>
        {me.data && (
          <div className="mt-auto hidden rounded-[14px] border border-border p-3 text-[13px] text-muted-foreground md:block">
            <b className="block font-medium text-foreground">
              {t("nav.target", { band: formatBand(me.data.targets.overall, locale) })}
            </b>
            {me.data.testDate ? t("nav.examOn", { date: formatDate(me.data.testDate, locale) }) : t("nav.noTestDate")}
          </div>
        )}
      </aside>
      <main id="main" className="min-w-0 px-4 pt-4.5 pb-12 md:px-7.5 md:pt-6.5">
        <Outlet />
      </main>
    </div>
  );
}
