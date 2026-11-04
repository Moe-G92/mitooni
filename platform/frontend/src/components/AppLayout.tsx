import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { PageTransition } from "./motion/PageTransition";

import { markAppShellMounted } from "../lib/motion";
import {
  Target,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { BackButton } from "./ui/back-button";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRuntime } from "../context/RuntimeContext";
import { useLocale } from "../context/LocaleContext";
import { useAppBootstrap } from "../context/AppBootstrapContext";



import { BookOpen, NotebookPen, ListChecks, ClipboardList, CircleUserRound } from "lucide-react";
import { useCloseOnViewportChange } from "../hooks/useCloseOnViewportChange";
import { ProductLogo, ProductMark } from "./brand/ProductMark";

import { BRAND_NAME } from "../brand/brand";



import { PRIMARY_PRODUCT_NAV } from "../lib/appNavigation";

type NavItem = {
  path: string;
  label: string;
  icon: typeof Target;
};

const PRIMARY_NAV_ITEMS: NavItem[] = PRIMARY_PRODUCT_NAV.map((item) => ({ ...item, icon: Target }));
const MOCKS_ITEM = PRIMARY_NAV_ITEMS[3];



const PROFILE_NAME_UPDATED_EVENT = "mitooni-profile-name-updated";
const SIDEBAR_COLLAPSED_KEY = "mitooni-sidebar-collapsed";
const SIDEBAR_EXPANDED_W = 216;
const SIDEBAR_COLLAPSED_W = 76;

function isOpaqueRouteSegment(part: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(part);
}

function toTitleCaseLabel(part: string): string {
  return part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
}

const PageHeaderSlotCtx = createContext<(node: ReactNode) => void>(() => {});
export function usePageHeaderSlot() { return useContext(PageHeaderSlotCtx); }

// Lets a page override the Clay-bar Back button (for internal, non-URL nav).
// Pass a handler to take over Back; pass null to restore the default. Like the
// header slot, the page is responsible for clearing it on unmount.
const PageBackCtx = createContext<(handler: (() => void) | null) => void>(() => {});
export function usePageBack() { return useContext(PageBackCtx); }

type PageHeaderCrumb = { label: string; path: string };
type PageHeaderInfo = { crumbs: PageHeaderCrumb[] };
const PageHeaderCtx = createContext<(info: PageHeaderInfo | null) => void>(() => {});
export function usePageHeader() { return useContext(PageHeaderCtx); }

const ExamModeCtx = createContext<{ examMode: boolean; setExamMode: (v: boolean) => void }>({
  examMode: false,
  setExamMode: () => {},
});
export function useSetExamMode() { return useContext(ExamModeCtx).setExamMode; }

export function AppLayout() { return <AppLayoutInner />; }

function AppLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, services } = useRuntime();
  const { getUserProfile } = services;
  const { t } = useLocale();
  useAppBootstrap();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) !== "false"; }
    catch { return true; }
  });
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [headerSlot, setHeaderSlot] = useState<ReactNode>(null);
  const [pageHeaderInfo, setPageHeaderInfo] = useState<PageHeaderInfo | null>(null);
  // Wrap in an object so a stored handler isn't mistaken for a setState updater.
  const [backOverride, setBackOverrideState] = useState<{ fn: () => void } | null>(null);
  const setBackOverride = useCallback(
    (handler: (() => void) | null) => setBackOverrideState(handler ? { fn: handler } : null),
    [],
  );
  const [examMode, setExamMode] = useState(false);

  useCloseOnViewportChange("(max-width: 1023px)", useCallback(() => {
    setSidebarOpen(false);
  }, []));

  const collapsed = sidebarCollapsed;
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch {
        // Ignore storage failures; the UI state can remain in memory.
      }
      return next;
    });
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const dialog = document.querySelector<HTMLElement>("[data-mobile-drawer]");
    const previous = document.activeElement as HTMLElement | null;
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button,a[href]') ?? []);
    controls()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setSidebarOpen(false); }
      if (event.key === "Tab") {
        const items=controls(), first=items[0], last=items[items.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown",key);
    return () => { document.removeEventListener("keydown",key); previous?.focus(); };
  }, [sidebarOpen]);

  // While the shell is up, route-chunk waits show a skeleton in the content
  // area (PageTransition) instead of the full-screen loader.
  useEffect(() => markAppShellMounted(), []);

  const homePath = "/topics";
  const isStudyPage = location.pathname === "/study";

  const isTopicsActive =
    location.pathname === "/topics" ||
    location.pathname.startsWith("/topics/") ||
    location.pathname === "/study" ||
    location.pathname === "/workspace" ||
    location.pathname.startsWith("/workspace/");
  const isMocksActive =
    location.pathname === "/mock" || location.pathname.startsWith("/mock/");
  const isNotesActive =
    location.pathname === "/notes" || location.pathname.startsWith("/notes/");
  const isPracticeActive =
    location.pathname === "/practice" || location.pathname.startsWith("/practice/");

  const allNavItems = PRIMARY_NAV_ITEMS.map(item => ({ ...item, label: t(item.label) }));

  const resolvedDisplayName = displayName || user?.name || t("profile");

  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    let mounted = true;
    getUserProfile()
      .then((profile) => {
        if (mounted && profile.display_name?.trim()) {
          setDisplayName(profile.display_name.trim());
        }
      })
      .catch(() => {});

    const handleProfileNameUpdate = (event: Event) => {
      const nextName = (event as CustomEvent<{ displayName?: string }>).detail?.displayName?.trim();
      if (nextName) setDisplayName(nextName);
    };

    window.addEventListener(PROFILE_NAME_UPDATED_EVENT, handleProfileNameUpdate as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener(PROFILE_NAME_UPDATED_EVENT, handleProfileNameUpdate as EventListener);
    };
  }, [getUserProfile]);

  useEffect(() => { document.title = `${t(PRIMARY_PRODUCT_NAV.find(item => location.pathname.startsWith(item.path))?.label ?? "profile")} | ${BRAND_NAME}`; }, [location.pathname, t]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Reset page-pushed header info whenever the route changes.
  // Header slots are cleared by the page effects that create them.
  useEffect(() => {
    setPageHeaderInfo(null);
  }, [location.pathname]);

  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.flatMap((part, i) => {
    const path = "/" + pathParts.slice(0, i + 1).join("/");
    const navItem = allNavItems.find((n) => n.path === path);
    if (navItem) return [{ label: navItem.label, path }];
    if (part === "leads") {
      return [];
    }
    if (isOpaqueRouteSegment(part)) return [];
    return [{ label: part === "profile" ? t("profile") : toTitleCaseLabel(part), path }];
  });

  const pageTitle = breadcrumbs.length > 0
    ? breadcrumbs[breadcrumbs.length - 1].label
    : t("home");



  // ── Shared nav link builder (desktop sidebar) ─────────────────────────────
  function NavLink({
    to,
    active,
    icon,
    label,
    className: extraClass = "",
    tourId,
  }: {
    to: string;
    active: boolean;
    icon: ReactNode;
    label: string;
    className?: string;
    tourId?: string;
  }) {
    return (
      <Link
        to={to}
        aria-label={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        data-tour-id={tourId}
        className={`flex items-center rounded-xl transition-all ${
          active ? "bg-white/12 text-gold-light" : "text-white/80 hover:text-white hover:bg-white/8"
        } ${collapsed ? "justify-center px-0 py-3.5" : "gap-3 px-3 py-2.5"} ${extraClass}`}
        style={{ fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.005em" }}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  }

  return (
    <ExamModeCtx.Provider value={{ examMode, setExamMode }}>
    <PageHeaderCtx.Provider value={setPageHeaderInfo}>
    <PageBackCtx.Provider value={setBackOverride}>
    <PageHeaderSlotCtx.Provider value={setHeaderSlot}>
    <div className="min-h-screen bg-cream flex">
      {/* ── Sidebar — Desktop ───────────────────────────────────────────── */}
      {!examMode && <aside
        className="hidden lg:flex flex-col fixed inset-y-0 start-0 z-40 overflow-x-hidden overflow-y-auto"
        style={{
          background: "#103736",
          width: `${sidebarW}px`,
          transition: "width 0.22s ease",
        }}
      >
        {/* Logo area + collapse toggle */}
        <div className="relative flex-shrink-0" style={{ minHeight: collapsed ? "96px" : "68px" }}>
          {/* Full logo — shown when expanded */}
          {!collapsed && (
            <Link to={homePath} className="app-brand-logo block pt-5 pb-4 ps-5" aria-label={t("brandHome")}>
              <ProductLogo title="" style={{ height: "2.1rem", width: "auto" }} />
            </Link>
          )}

          {/* Logo mark — shown when collapsed */}
          {collapsed && (
            <Link to={homePath} aria-label={t("brandHome")} className="flex justify-center pt-4 pb-1">
              <ProductMark title={t("home")} className="app-brand-logo" style={{ height: "2.6rem", width: "auto" }} />
            </Link>
          )}

          {/* Collapse button — absolute top-right when expanded, centred when collapsed */}
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? t("expand") : t("collapse")}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            style={collapsed
              ? { width: "2.25rem", height: "2.25rem", margin: "0.25rem auto 0", display: "flex" }
              : { width: "1.75rem", height: "1.75rem", position: "absolute", top: "0.75rem", insetInlineEnd: "0.5rem" }
            }
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav aria-label={t("skills")} className={`px-2 flex flex-col gap-1 ${collapsed ? "mt-2" : "mt-6"}`}>
          {/* The four product-level destinations. Study is lead-scoped under Subjects. */}
          <NavLink
            to="/topics"
            active={isTopicsActive}
            label={t("skills")}
            tourId="nav-topics"
            icon={<BookOpen size={30} />}
          />

          <NavLink
            to="/notes"
            active={isNotesActive}
            label={t("notes")}
            tourId="nav-notes"
            icon={<NotebookPen size={28} />}
          />

          <NavLink
            to="/practice"
            active={isPracticeActive}
            label={t("practice")}
            tourId="nav-practice"
            icon={<ListChecks size={28} />}
          />

          <NavLink
            to={MOCKS_ITEM.path}
            active={isMocksActive}
            label={t("mock")}
            tourId="nav-mocks"
            icon={<ClipboardList size={28} />}
          />
        </nav>

        <div className="mt-auto" />
        {/* Profile */}
        <div className="p-2">
          <Link
            to="/profile"
            title={collapsed ? resolvedDisplayName : undefined}
            className={`flex items-center w-full rounded-xl transition-colors hover:bg-white/8 ${
              collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2"
            } ${location.pathname === "/profile" ? "bg-white/12" : ""}`}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: collapsed ? "3rem" : "2.25rem",
                height: collapsed ? "3rem" : "2.25rem",
              }}
            >
              <CircleUserRound color="#d4dfdc" size={collapsed ? 42 : 32} />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-start">
                <div className="text-white truncate" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {resolvedDisplayName}
                </div>
                <div className="text-white/80 truncate" style={{ fontSize: "0.72rem", marginTop: "0.05rem" }}>
                  {t("localAccount")}
                </div>
              </div>
            )}
          </Link>
        </div>
      </aside>}

      {/* ── Mobile header ───────────────────────────────────────────────── */}
      {!examMode && <header className="mobile-app-header lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4" style={{ background: "#103736" }}>
        <div className="mobile-app-brand flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label={t("openMenu")} aria-expanded={sidebarOpen}
            className="min-h-11 min-w-11 flex items-center justify-center text-white/85 p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <ProductLogo title={BRAND_NAME} className="mobile-app-logo app-brand-logo" style={{ height: "1.7rem", width: "auto" }} />
        </div>
        <Link
          to="/profile"
          aria-label={t("profile")}
          className="flex items-center justify-center rounded-lg"
          style={{
            width: "44px",
            height: "44px",
          }}
        >
          <CircleUserRound color="#d4dfdc" size={34} />
        </Link>
      </header>}

      {/* ── Mobile sidebar overlay ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div data-mobile-drawer role="dialog" aria-modal="true" aria-label={t("openMenu")} className="relative w-72 h-full flex flex-col overflow-y-auto" style={{ background: "#103736" }}>
            <div className="px-5 py-4 flex items-center justify-between">
              <ProductLogo title={BRAND_NAME} className="app-brand-logo" style={{ height: "1.8rem", width: "auto" }} />
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label={t("closeMenu")}
                className="min-h-11 min-w-11 flex items-center justify-center text-white/90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav aria-label={t("skills")} className="px-3 mt-2 flex flex-col gap-1">
              <Link
                to="/topics"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                  isTopicsActive ? "bg-white/12 text-gold-light" : "text-white/80 hover:text-white hover:bg-white/8"
                }`}
                style={{ fontSize: "0.975rem", fontWeight: 500 }}
              >
                <BookOpen size={28} />
                {t("skills")}
              </Link>

              <Link
                to="/notes"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                  isNotesActive ? "bg-white/12 text-gold-light" : "text-white/80 hover:text-white hover:bg-white/8"
                }`}
                style={{ fontSize: "0.975rem", fontWeight: 500 }}
              >
                <NotebookPen size={28} />
                {t("notes")}
              </Link>

              <Link
                to="/practice"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                  isPracticeActive ? "bg-white/12 text-gold-light" : "text-white/80 hover:text-white hover:bg-white/8"
                }`}
                style={{ fontSize: "0.975rem", fontWeight: 500 }}
              >
                <ListChecks size={28} />
                {t("practice")}
              </Link>

              <Link
                to={MOCKS_ITEM.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                  isMocksActive ? "bg-white/12 text-gold-light" : "text-white/80 hover:text-white hover:bg-white/8"
                }`}
                style={{ fontSize: "0.975rem", fontWeight: 500 }}
              >
                <ClipboardList size={28} />
                {t("mock")}
              </Link>
            </nav>

            <div className="p-3 mt-3">
              <div className="px-3 py-2.5 flex items-center gap-3 mb-1">
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                  }}
                >
                  <CircleUserRound color="#d4dfdc" size={36} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    {resolvedDisplayName}
                  </div>
                  <div className="text-white/80 truncate" style={{ fontSize: "0.72rem", marginTop: "0.05rem" }}>
                    {t("localAccount")}
                  </div>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-white/75 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
                style={{ fontSize: "0.9rem" }}
              >
                <CircleUserRound color="#d4dfdc" size={28} />
                {t("profile")}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-white/80 hover:text-white/80 hover:bg-white/8 rounded-xl transition-colors w-full"
                style={{ fontSize: "0.9rem" }}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {t("signOut")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main
        className={`app-main-shell mobile-app-main flex-1 min-h-screen overflow-x-hidden${examMode ? "" : " pt-14 lg:pt-0"}`}
        style={{
          "--app-sidebar-width": examMode ? "0px" : `${sidebarW}px`,
          transition: "margin-inline-start 0.22s ease",
        } as CSSProperties}
      >
        {/* Sidebar is an overlay on mobile and consumes layout width on desktop. */}
        <style>{`
          .app-main-shell { margin-inline-start: var(--app-sidebar-width); }
          @media (max-width: 1023px) { .app-main-shell { margin-inline-start: 0; } }
          .mobile-app-header {
            box-sizing: border-box;
            min-height: 3.5rem;
            padding-top: env(safe-area-inset-top);
          }
          .mobile-app-brand { min-width: 0; flex: 1 1 auto; }
          .mobile-app-logo {
            max-width: calc(100vw - 7rem);
            height: 1.55rem !important;
          }
          .app-brand-logo {
            color: #f6f1e7;
            --mitooni-accent: var(--gold-light);
          }
          .app-page-header-slot {
            min-width: 0;
            max-width: 100%;
          }
          .study-global-header {
            display: grid;
            grid-template-columns: auto 1px minmax(0, 1fr);
            align-items: start;
            column-gap: 1rem;
            row-gap: 0.75rem;
          }
          .study-global-header-slot {
            width: 100%;
            container-name: study-header-slot;
            container-type: inline-size;
          }
          @media (max-width: 980px) {
            .study-global-header {
              grid-template-columns: minmax(0, 1fr);
            }
            .study-global-header-divider {
              display: none;
            }
          }
          @media (max-width: 639px) {
            .mobile-app-header {
              height: calc(3.5rem + env(safe-area-inset-top));
            }
            .mobile-app-main {
              padding-top: calc(3.5rem + env(safe-area-inset-top)) !important;
            }
            .app-page-header {
              max-width: calc(100% - 1rem) !important;
              margin-inline-start: 0.5rem !important;
              margin-right: 0.5rem !important;
            }
            .app-page-header-inner-standard {
              flex-wrap: wrap;
              align-items: center;
              row-gap: 0.55rem;
              padding: 0.75rem !important;
            }
            .app-page-header-has-slot > .app-page-header-main {
              flex: 1 1 100%;
              min-width: 0;
            }
            .app-page-header-has-slot > .app-page-header-divider {
              display: none;
            }
            .app-page-header-has-slot > .app-page-header-slot {
              flex: 1 1 100% !important;
              width: 100%;
              min-width: 0;
              max-width: 100%;
              overflow-x: auto;
              overflow-y: hidden;
              scrollbar-width: none;
            }
            .app-page-header-slot::-webkit-scrollbar { display: none; }
            .app-page-header-slot > div {
              min-width: 0;
              max-width: 100%;
              flex-wrap: wrap;
            }
            .app-page-header-main h1 {
              min-width: 0;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              flex-shrink: 1 !important;
            }
            .app-page-header-breadcrumbs { display: none; }
          }
          @media (max-width: 1023px) {
            .app-page-header-inner-standard.app-page-header-has-slot {
              flex-wrap: wrap;
              align-items: center;
              row-gap: 0.55rem;
              padding-top: 0.85rem !important;
              padding-bottom: 0.85rem !important;
            }
            .app-page-header-inner-standard.app-page-header-has-slot > .app-page-header-main {
              flex: 1 1 100%;
              min-width: 0;
            }
            .app-page-header-inner-standard.app-page-header-has-slot > .app-page-header-divider {
              display: none;
            }
            .app-page-header-inner-standard.app-page-header-has-slot > .app-page-header-slot {
              flex: 1 1 100% !important;
              width: 100%;
              min-width: 0;
              max-width: 100%;
              overflow-x: auto;
              overflow-y: hidden;
              scrollbar-width: none;
            }
            .app-page-header-inner-standard.app-page-header-has-slot > .app-page-header-slot::-webkit-scrollbar { display: none; }
            .app-page-header-inner-standard.app-page-header-has-slot > .app-page-header-slot > div {
              min-width: 0;
              max-width: 100%;
              flex-wrap: wrap;
            }
            .mobile-work-surface {
              min-height: min(480px, max(180px, calc(100dvh - 12rem))) !important;
            }
            .notes-work-surface {
              min-height: min(480px, max(180px, calc(100dvh - 9.5rem))) !important;
            }
            .study-format-stage {
              min-height: min(640px, max(180px, calc(100dvh - 11.25rem))) !important;
            }
            .study-shell-frame {
              min-height: min(520px, max(180px, calc(100dvh - 12rem))) !important;
            }
            .mobile-rail-toggle {
              position: absolute !important;
              top: 0.75rem;
              right: 0.75rem;
              z-index: 50;
            }
            .mobile-side-rail {
              position: absolute !important;
              top: 0;
              right: 0;
              bottom: 0;
              width: 0 !important;
              height: 100% !important;
              z-index: 40;
              overflow: visible !important;
              pointer-events: none;
            }
            .mobile-side-rail[data-open="true"] {
              width: min(320px, calc(100% - 0.75rem)) !important;
              pointer-events: auto;
            }
            .mobile-side-rail > * {
              width: 100% !important;
              max-width: 100%;
              height: 100% !important;
              overflow: hidden;
            }
            .mobile-side-rail[data-open="true"] > * {
              box-shadow: -12px 0 28px rgba(12, 25, 41, 0.16);
            }
            .mobile-studio-nav-toggle {
              position: absolute;
              top: 0.75rem;
              right: 0.75rem;
              z-index: 50;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-height: 2rem;
              padding: 0.35rem 0.65rem;
              border: 1px solid var(--border);
              border-radius: 0.5rem;
              background: var(--surface);
              color: var(--foreground);
              font-size: 0.72rem;
              font-weight: 650;
              box-shadow: 0 4px 12px rgba(12, 25, 41, 0.12);
            }
          }
          @media (min-width: 1024px) {
            .mobile-studio-nav-toggle { display: none; }
          }
        `}</style>

        {/* ── Clay header bar ── */}
        {!examMode && <div
          className="app-page-header relative lg:sticky lg:top-2 z-10 mx-4 lg:mx-6 mt-2"
          style={{ maxWidth: "calc(100% - 2rem)", overflow: "visible" }}
        >
          <div
            className={`${isStudyPage ? "study-global-header" : "flex items-center gap-4"} app-page-header-inner ${!isStudyPage ? "app-page-header-inner-standard" : ""} ${headerSlot ? "app-page-header-has-slot" : ""} px-5 ${isStudyPage ? "py-3" : "py-7"} rounded-xl`}
            style={{ background: "#103736" }}
          >
            {/* Left: back button + breadcrumb + title + subtitle — all on one line */}
            {(() => {
              const effectiveCrumbs = pageHeaderInfo?.crumbs ?? breadcrumbs;
              const effectiveTitle = effectiveCrumbs.length > 0
                ? effectiveCrumbs[effectiveCrumbs.length - 1].label
                : pageTitle;
              const previousCrumb = effectiveCrumbs.length > 1
                ? effectiveCrumbs[effectiveCrumbs.length - 2]
                : null;
              const backPath = previousCrumb?.path || homePath;
              return (
                <div className={`app-page-header-main flex items-center gap-2 min-w-0 ${headerSlot ? "flex-shrink-0" : "flex-1"}`}>
                  {/* Back button — shown on all pages; a page may override its action */}
                  <BackButton to={backPath} onClick={backOverride?.fn} />

                  {/* Breadcrumb trail */}
                  {/* Breadcrumb trail — hidden on the study page (Back already returns to the topic) */}
                  {!isStudyPage && (
                    <div
                      className="app-page-header-breadcrumbs flex items-center gap-1 flex-shrink-0"
                      style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", color: "rgba(240,239,232,0.8)" }}
                    >
                      <Link
                        to={homePath}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ color: "rgba(240,239,232,0.8)" }}
                      >
                        {t("home")}
                      </Link>
                      {effectiveCrumbs.slice(0, -1).map((crumb) => (
                        <span key={crumb.path} className="flex items-center gap-1">
                          <span>›</span>
                          <Link
                            to={crumb.path}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center hover:opacity-80 transition-opacity"
                            style={{ color: "rgba(240,239,232,0.8)" }}
                          >
                            {crumb.label}
                          </Link>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Page title — hidden on the study page so the header tools sit further left */}
                  {!isStudyPage && (
                    <h1
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#f0efe8",
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                        whiteSpace: "normal",
                        flexShrink: 1,
                      }}
                    >
                      {effectiveTitle}
                    </h1>
                  )}


                </div>
              );
            })()}

            {/* Right slot */}
            {headerSlot && (
              <>
                <div className={`${isStudyPage ? "study-global-header-divider" : ""} app-page-header-divider`} style={{ width: "1px", alignSelf: "stretch", background: "rgba(240,239,232,0.1)", flexShrink: 0 }} />
                <div
                  className={`app-page-header-slot min-w-0 flex items-center ${isStudyPage ? "study-global-header-slot" : ""}`}
                  style={{ flex: isStudyPage ? "1 1 42rem" : "1 1 0%" }}
                >
                  {headerSlot}
                </div>
              </>
            )}
          </div>
        </div>}

        <div className={examMode ? "" : "p-6 lg:p-8"}>
          <p className="preview-notice shell-preview-notice">{t("preview")}</p>

            <PageTransition>
              <Outlet />
            </PageTransition>

        </div>
      </main>


    </div>
    </PageHeaderSlotCtx.Provider>
    </PageBackCtx.Provider>
    </PageHeaderCtx.Provider>
    </ExamModeCtx.Provider>
  );
}
