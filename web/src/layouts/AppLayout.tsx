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

/*
 * Sidebar shell from the mitooni canvas: Deep Wisteria with a Canary marker on
 * the active item. Inactive items use white at 80% (the canvas has 68%, which
 * falls under WCAG AA on Deep Wisteria). Collapses to an icon row under 768px.
 */
export function AppLayout() {
  const { t, locale } = useT();
  const me = useMe();
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        {t("nav.skip")}
      </a>
      {/* The aside stretches with the page so the colour runs to the bottom; its content stays in view. */}
      <aside className="min-w-0 bg-sidebar text-sidebar-foreground">
        <div className="flex min-w-0 items-center gap-3 px-3 py-3 md:sticky md:top-0 md:h-screen md:flex-col md:items-stretch md:gap-5.5 md:overflow-y-auto md:px-4 md:py-5.5">
          <BrandMark light />
          <nav aria-label={t("nav.label")} className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto md:flex-none md:flex-col md:overflow-visible">
            {NAV.map(({ to, key, icon: Icon, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in rest}
                aria-label={t(key)}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2.5 rounded-[10px] p-2.5 text-[15px] text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-canary-yellow",
                    isActive && "bg-sidebar-active text-white shadow-[inset_3px_0_0_var(--canary-yellow)] rtl:shadow-[inset_-3px_0_0_var(--canary-yellow)]",
                  )
                }
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
                <span className="hidden md:inline">{t(key)}</span>
              </NavLink>
            ))}
          </nav>
          {me.data && (
            <div className="mt-auto hidden rounded-[14px] border border-white/15 p-3 text-[13px] text-white/80 md:block">
              <b className="block font-medium text-white">
                {t("nav.target", {
                  band: formatBand(me.data.targets.overall, locale),
                })}
              </b>
              {me.data.testDate
                ? t("nav.examOn", {
                    date: formatDate(me.data.testDate, locale),
                  })
                : t("nav.noTestDate")}
            </div>
          )}
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 pt-5 pb-12 md:px-7.5 md:pt-6.5">
        <Outlet />
      </main>
    </div>
  );
}
