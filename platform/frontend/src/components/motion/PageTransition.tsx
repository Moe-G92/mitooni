import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useHref, useLocation, useNavigate, useNavigation, useNavigationType } from "react-router";
import { EASE_OUT_SOFT, prefersReducedMotion, useDelayedFlag } from "../../lib/motion";
import { PageSkeleton } from "../ui/skeleton";

/**
 * The one page change every app page uses. The sidebar and header bar sit
 * outside this wrapper and never move.
 *
 * Leaving: a click on an in-app link to another page fades the current page
 * out over 120ms first, then navigates. Programmatic navigations and the
 * browser's back button skip this step and go straight to the entrance.
 * A link opts out with `data-page-fade="off"` (it carries router state, or
 * runs its own transition, like the subject books). If another link is
 * clicked while leaving, the latest click wins.
 *
 * Arriving: the new page opens at the top (back and forward keep the
 * browser's scroll), and the content fades in while rising 16px over 420ms.
 * It runs on pathname changes only, so query-string updates inside a page
 * (switching question, filter, lead) don't replay it. The animation has no fill, so once
 * it ends the wrapper carries no transform and fixed-position children
 * (modals, toasts) position against the viewport again.
 *
 * While a route's code chunk is still downloading, a generic page skeleton
 * covers the old page (after 150ms, so fast switches never flash it).
 */
const EXIT_MS = 120;
const ENTER_MS = 420;
const RISE_PX = 16;

export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const exitRef = useRef<Animation | null>(null);
  // Where the fade-out is heading; null once the navigation has started.
  const targetRef = useRef<string | null>(null);
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const routeBase = useHref("/").replace(/\/$/, "");
  const navigation = useNavigation();
  const routePending = useDelayedFlag(navigation.state === "loading", 150);

  // Leaving: fade the old page out, then navigate.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      if (anchor.closest('[data-page-fade="off"]')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      const el = ref.current;
      if (!el || typeof el.animate !== "function" || prefersReducedMotion()) return;

      // Stops React Router's own Link handler, which skips prevented clicks.
      event.preventDefault();
      const pathname = routeBase && url.pathname.startsWith(routeBase + "/") ? url.pathname.slice(routeBase.length) : url.pathname;
      const to = pathname + url.search + url.hash;
      if (exitRef.current) {
        // Already leaving: the latest click wins. During the fade it changes
        // where we go; after it, it replaces the navigation in flight (for
        // example while the page's code is still downloading).
        if (targetRef.current !== null) targetRef.current = to;
        else void navigate(to);
        return;
      }
      targetRef.current = to;
      const exit = el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: EXIT_MS,
        easing: "ease-in",
        fill: "forwards",
      });
      exitRef.current = exit;
      // Hidden tabs never finish animations, so don't wait on the fade alone.
      const faded = new Promise<void>((resolve, reject) => {
        exit.finished.then(() => resolve(), reject);
        setTimeout(resolve, EXIT_MS + 80);
      });
      faded
        .then(() => {
          const dest = targetRef.current;
          targetRef.current = null;
          if (dest) return navigate(dest);
        })
        .catch(() => {})
        .finally(() => {
          // The router settles a moment before React draws the new page, and
          // the entrance clears this fade when it starts. If the route never
          // changed (a guard sent us back), bring the old page back into view.
          setTimeout(() => {
            if (exitRef.current === exit) {
              exit.cancel();
              exitRef.current = null;
            }
          }, 400);
        });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate, routeBase]);

  // Arriving.
  useLayoutEffect(() => {
    exitRef.current?.cancel();
    exitRef.current = null;
    targetRef.current = null;
    // The app scrolls the window and has no scroll restoration, so a page
    // opened from halfway down another would keep its offset. Runs before the
    // book shelf's own layout effect, which puts the shelf back where it was.
    if (navigationType !== "POP" && !hash) window.scrollTo(0, 0);
    const el = ref.current;
    if (!el || typeof el.animate !== "function" || prefersReducedMotion()) return;
    const animation = el.animate(
      [
        { opacity: 0, transform: `translateY(${RISE_PX}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: ENTER_MS, easing: EASE_OUT_SOFT },
    );
    return () => animation.cancel();
    // Pathname only: the navigation type and hash are read for this change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} data-page-transition="">
        {children}
      </div>
      {routePending && (
        <div
          className="reveal"
          style={{ position: "absolute", inset: 0, zIndex: 5, background: "var(--background)" }}
        >
          <PageSkeleton />
        </div>
      )}
    </div>
  );
}
