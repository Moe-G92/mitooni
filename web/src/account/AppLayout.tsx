import { NavLink, Outlet, useMatch } from "react-router";
import {
  BarChart3,
  BookOpen,
  Clock,
  GraduationCap,
  Home,
  LineChart,
  NotebookPen,
  Settings,
} from "lucide-react";
import { useMe } from "./state";
import { useT } from "./locale";
import { formatBand, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";
import { TopControls } from "./TopControls";
import { Chip } from "@/components/ui/misc";
import { ProductFeedback } from "./learner/ProductFeedback";
import { useLearnerResource } from "./learner/hooks";
import type { Bootstrap } from "./learner/contracts";

const NAV = [
  { to: "/app", key: "nav.overview", icon: Home, end: true },
  { to: "/app/plan", key: "nav.plan", icon: GraduationCap },
  { to: "/app/practice", key: "nav.practice", icon: NotebookPen },
  { to: "/app/mocks", key: "nav.mocks", icon: Clock },
  { to: "/app/results", key: "nav.results", icon: BarChart3 },
  { to: "/app/progress", key: "nav.progress", icon: LineChart },
  { to: "/app/vocabulary", key: "nav.vocabulary", icon: BookOpen },
  { to: "/app/coach", key: "nav.coach", icon: GraduationCap },
  { to: "/app/settings", key: "nav.settings", icon: Settings },
] as const;

/*
 * Two shells from the mitooni canvas. The Overview ("Today") board has a white
 * top bar with the nav as pills; every other dashboard board keeps the Deep
 * Wisteria sidebar with a Canary marker on the active item.
 */
export function AppLayout() {
  const today = useMatch({ path: "/app", end: true });
  return today ? <TopBarShell /> : <SidebarShell />;
}

function SkipLink() {
  const { t } = useT();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
    >
      {t("nav.skip")}
    </a>
  );
}

/*
 * Top bar for the Overview: logo, nav (Today first, Settings sits behind the
 * account button), then the exam type and the global controls. Under 1280px
 * the nav moves to its own row and scrolls sideways.
 */
function TopBarShell() {
  const { t, locale } = useT();
  const { data } = useLearnerResource<Bootstrap>("/bootstrap");
  return (
    <div className="min-h-screen">
      <SkipLink />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <BrandMark />
          <nav
            aria-label={t("nav.label")}
            className="order-last -mx-1 flex w-full gap-0.5 overflow-x-auto px-1 xl:order-none xl:mx-0 xl:w-auto xl:flex-wrap xl:px-0"
          >
            {NAV.filter((n) => n.to !== "/app/settings").map(
              ({ to, key, ...rest }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={"end" in rest}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex min-h-11 min-w-11 shrink-0 items-center rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-pink-tint font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )
                  }
                >
                  {to === "/app" ? t("nav.today") : key === "nav.plan" ? (locale === "fa" ? "برنامه" : "Plan") : t(key)}
                </NavLink>
              ),
            )}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <Chip className="hidden text-foreground sm:inline-flex">
              {data?.preferences?.examTrack === "general_training" ? "IELTS General Training" : data?.preferences ? "IELTS Academic" : "IELTS"}
            </Chip>
            <TopControls />
          </div>
        </div>
      </header>
      <main
        id="main"
        className="mx-auto min-w-0 max-w-[1280px] px-4 pt-6 pb-14 md:px-8 md:pt-10"
      >
        <Outlet />
        <ProductFeedback />
      </main>
    </div>
  );
}

/*
 * Sidebar shell: Deep Wisteria with a Canary marker on the active item.
 * Inactive items use white at 80% (the canvas has 68%, which falls under WCAG
 * AA on Deep Wisteria). Collapses to an icon row under 768px.
 */
function SidebarShell() {
  const { t, locale } = useT();
  const me = useMe();
  const { data } = useLearnerResource<Bootstrap>("/bootstrap");
  const goals = data?.preferences;
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)]">
      <SkipLink />
      {/* The aside stretches with the page so the colour runs to the bottom; its content stays in view. */}
      <aside className="min-w-0 bg-sidebar text-sidebar-foreground">
        <div className="flex min-w-0 items-center gap-3 px-3 py-3 md:sticky md:top-0 md:h-screen md:flex-col md:items-stretch md:gap-5.5 md:overflow-y-auto md:px-4 md:py-5.5">
          <BrandMark light />
          <nav
            aria-label={t("nav.label")}
            className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto md:flex-none md:flex-col md:overflow-visible"
          >
            {NAV.map(({ to, key, icon: Icon, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in rest}
                aria-label={key === "nav.plan" ? (locale === "fa" ? "برنامه" : "Plan") : t(key)}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2.5 rounded-[10px] min-h-11 min-w-11 p-2.5 text-[15px] text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-canary-yellow",
                    isActive &&
                      "bg-sidebar-active text-white shadow-[inset_3px_0_0_var(--canary-yellow)] rtl:shadow-[inset_-3px_0_0_var(--canary-yellow)]",
                  )
                }
              >
                <Icon
                  className="size-[18px] shrink-0"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span className="hidden md:inline">{key === "nav.plan" ? (locale === "fa" ? "برنامه" : "Plan") : t(key)}</span>
              </NavLink>
            ))}
          </nav>
          {me.data && (
            <div className="mt-auto hidden rounded-[14px] border border-white/15 p-3 text-[13px] text-white/80 md:block">
              <b className="block font-medium text-white">
                {t("nav.target", {
                  band: formatBand(goals?.targets.overall ?? me.data.targets.overall, locale),
                })}
              </b>
              {(goals ? goals.testDate : me.data.testDate)
                ? t("nav.examOn", {
                    date: formatDate((goals ? goals.testDate : me.data.testDate)!, locale),
                  })
                : t("nav.noTestDate")}
            </div>
          )}
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 pt-5 pb-12 md:px-7.5 md:pt-6.5">
        <Outlet />
        <ProductFeedback />
      </main>
    </div>
  );
}
