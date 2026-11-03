import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Menu as MenuIcon, X } from "lucide-react";
import { useMe } from "@/api/queries";
import { useT } from "@/i18n";
import { LogoMark } from "@/components/Logo";
import { LanguageSwitch } from "@/components/TopControls";
import { Container } from "@/components/public/ui";
import { pillClass } from "@/components/public/pill";
import { Mixed } from "@/components/public/Mixed";
import { cn } from "@/lib/utils";

/*
 * Public pages (canvas Main.dc.html): a pink top bar with the logo and the
 * language switch, a Deep Wisteria nav strip, a white page and a Deep Wisteria
 * footer. Below 1024px the nav collapses into a menu button in the strip.
 */

/** The nav strip ("Your study room" is the app; signed-out visitors land on sign-in). */
const NAV = [
  { to: "/how-it-works", key: "how" },
  { to: "/what-is-ielts", key: "what" },
  { to: "/coaching", key: "coaching" },
  { to: "/app", key: "studyRoom" },
  { to: "/faq", key: "faq" },
] as const;

/** The footer's Product column. */
const PRODUCT = [
  { to: "/how-it-works", key: "how" },
  { to: "/what-is-ielts", key: "what" },
  { to: "/app/mocks", key: "mocks" },
  { to: "/coaching", key: "coaching" },
  { to: "/faq", key: "faq" },
] as const;

const stripLink =
  "block px-4 py-3.5 font-archivo text-[15px] leading-6 font-semibold text-white no-underline hover:bg-white/10 hover:text-white aria-[current=page]:bg-white/[0.12]";

function Wordmark({ light = false, size = "lg" }: { light?: boolean; size?: "lg" | "sm" }) {
  return (
    <span className="inline-flex items-center gap-2.5" dir="ltr">
      <LogoMark light={light} className={size === "lg" ? "size-10" : "size-7"} />
      <span
        className={cn("font-archivo leading-none font-bold tracking-[-0.03em]", size === "lg" ? "text-[24px]" : "text-[20px]", light ? "text-white" : "text-midnight-iris")}
        style={{ fontFamily: '"Archivo Variable", sans-serif' }}
      >
        {brand.name}
      </span>
    </span>
  );
}

export function PublicLayout() {
  const { t } = useT();
  const me = useMe();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const signedIn = !!me.data;

  // Close the small-screen menu after every navigation; start each page at the top.
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const links = NAV.map(({ to, key }) => (
    <li key={to}>
      <NavLink to={to} end={to === "/app"} className={stripLink}>
        <Mixed text={t(`mk.nav.${key}`)} />
      </NavLink>
    </li>
  ));

  return (
    <div className="mk min-h-screen bg-white font-gabarito text-[15px] leading-normal text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[1100] focus:rounded-lg focus:bg-midnight-iris focus:px-6 focus:py-3 focus:text-white"
      >
        {t("nav.skip")}
      </a>
      <header className="bg-pink-tint">
        <Container className="flex items-center gap-3 py-5 max-sm:py-4">
          <Link to="/" aria-label={t("mk.nav.home")} className="flex items-center no-underline">
            <Wordmark />
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LanguageSwitch className="h-9 rounded-[10px] bg-white px-3" />
          </div>
        </Container>
        <div className="bg-primary">
          <Container className="flex min-h-[52px] items-center gap-1">
            <nav aria-label={t("mk.nav.label")} className="max-lg:hidden">
              <ul className="m-0 flex list-none flex-wrap items-center gap-1 p-0">{links}</ul>
            </nav>
            <button
              type="button"
              className="-ms-2 inline-flex items-center gap-2 rounded-lg px-2 py-2.5 font-archivo text-[15px] font-semibold text-white hover:bg-white/10 lg:hidden"
              aria-expanded={open}
              aria-controls="public-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <MenuIcon className="size-5" aria-hidden="true" />}
              {open ? t("mk.nav.close") : t("mk.nav.menu")}
            </button>
            <div className="ms-auto flex items-center gap-1">
              {signedIn ? (
                <Link to="/app" className={pillClass("red", "md")}>
                  {t("mk.nav.open")}
                </Link>
              ) : (
                <>
                  <NavLink to="/sign-in" className={cn(stripLink, "max-[360px]:px-2")}>
                    {t("mk.nav.signIn")}
                  </NavLink>
                  <Link to="/sign-up" className={pillClass("red", "md", "whitespace-nowrap")}>
                    {t("mk.nav.try")}
                  </Link>
                </>
              )}
            </div>
          </Container>
          {open && (
            <nav id="public-menu" aria-label={t("mk.nav.label")} className="border-t border-white/15 lg:hidden">
              <Container>
                <ul className="m-0 flex list-none flex-col py-2 ps-0 [&_a]:rounded-lg">{links}</ul>
              </Container>
            </nav>
          )}
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="bg-primary text-white">
        <Container className="pt-14 pb-8">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-10">
            <div>
              <Wordmark light size="sm" />
              <p className="mt-4 max-w-[320px] font-archivo text-[15px] leading-6 text-white/85">
                <Mixed text={t("mk.footer.disclaimer")} />
              </p>
            </div>
            <div>
              <h2 className="m-0 font-archivo text-[16px] leading-6 font-semibold text-white/85">{t("mk.footer.product")}</h2>
              <ul className="mt-4 flex list-none flex-col gap-2.5 p-0 font-archivo text-[16px] leading-6">
                {PRODUCT.map(({ to, key }) => (
                  <li key={key}>
                    <Link to={to} className="text-white no-underline hover:text-white hover:underline">
                      <Mixed text={t(`mk.nav.${key}`)} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="m-0 font-archivo text-[16px] leading-6 font-semibold text-white/85">{t("mk.footer.account")}</h2>
              <ul className="mt-4 flex list-none flex-col gap-2.5 p-0 font-archivo text-[16px] leading-6">
                <li>
                  <Link to="/sign-in" className="text-white no-underline hover:text-white hover:underline">
                    {t("mk.nav.signIn")}
                  </Link>
                </li>
                <li>
                  <Link to="/sign-up" className="text-white no-underline hover:text-white hover:underline">
                    {t("mk.footer.create")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="m-0 font-archivo text-[16px] leading-6 font-semibold text-white/85">{t("mk.footer.language")}</h2>
              <div className="mt-4">
                <LanguageSwitch className="w-full border-white/30 bg-transparent text-white hover:bg-white/10" />
              </div>
            </div>
          </div>
          <p className="mt-12 border-t border-white/15 pt-6 font-archivo text-[14px] text-white/85">
            <Mixed text={t("mk.footer.rights")} />
          </p>
        </Container>
      </footer>
    </div>
  );
}
