import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Menu as MenuIcon } from "lucide-react";
import { useMe } from "@/api/queries";
import { useT } from "@/i18n";
import { Logo } from "@/components/Logo";
import { LanguageSwitch, ThemeToggle } from "@/components/TopControls";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

/*
 * Public pages in the reasonal.co layout: a white page, every section a 32px
 * rounded card, a floating translucent header and a dark rounded footer.
 * Fonts: Archivo for headings and body, Gabarito for small labels; Persian
 * uses Vazirmatn at the same sizes (see index.css).
 */

const navLink =
  "rounded-full px-5 py-2 font-archivo text-[18px] leading-6 font-medium text-mk-ink transition-colors hover:bg-mk-ink/5 aria-[current=page]:bg-mk-ink/5";

export function MkButton({ to, children, light = false, className }: { to: string; children: React.ReactNode; light?: boolean; className?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-gabarito text-[16px] leading-6 font-semibold transition-colors",
        light ? "bg-white text-ink-black hover:bg-white/90" : "bg-mk-ink text-mk-page hover:bg-mk-ink/90",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function PublicLayout() {
  const { t } = useT();
  const me = useMe();
  const { pathname } = useLocation();
  const ctaTo = me.data ? "/app" : "/sign-in";
  const ctaLabel = me.data ? t("mk.nav.open") : t("mk.nav.try");
  const onHome = pathname === "/";

  return (
    <div className="mk min-h-screen bg-mk-page font-gabarito text-mk-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[1100] focus:rounded-lg focus:bg-mk-ink focus:px-6 focus:py-3 focus:text-mk-page">
        {t("nav.skip")}
      </a>
      <header className="fixed inset-x-0 top-0 z-[1000] p-6 md:p-8">
        <div className="relative mx-auto flex h-[60px] max-w-[1408px] items-center gap-3 rounded-2xl bg-mk-page/85 px-4 shadow-[0_1px_0_var(--mk-line)] backdrop-blur-md">
          <Link to="/" className="z-10 flex items-center" aria-label="Bandwidth">
            <Logo />
          </Link>
          <nav aria-label={t("pub.nav")} className="absolute inset-0 hidden items-center justify-center lg:flex">
            <NavLink to="/how-it-works" className={navLink}>
              {t("mk.nav.how")}
            </NavLink>
            <NavLink to="/coaching" className={navLink}>
              {t("mk.nav.coaching")}
            </NavLink>
            <Link to={onHome ? "#faq" : "/#faq"} className={navLink}>
              {t("mk.nav.faq")}
            </Link>
          </nav>
          <div className="z-10 ms-auto flex items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
            <Menu>
              <MenuTrigger className="grid size-[34px] place-items-center rounded-[10px] border border-border bg-card lg:hidden" aria-label={t("mk.nav.menu")}>
                <MenuIcon className="size-[17px]" />
              </MenuTrigger>
              <MenuContent>
                <MenuItem asChild>
                  <Link to="/how-it-works">{t("mk.nav.how")}</Link>
                </MenuItem>
                <MenuItem asChild>
                  <Link to="/coaching">{t("mk.nav.coaching")}</Link>
                </MenuItem>
                <MenuItem asChild>
                  <Link to="/#faq">{t("mk.nav.faq")}</Link>
                </MenuItem>
              </MenuContent>
            </Menu>
            <MkButton to={ctaTo} className="hidden sm:inline-flex">
              {ctaLabel}
            </MkButton>
          </div>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="px-4 pb-4 max-md:px-3 max-md:pb-3">
        <div className="mx-auto max-w-[1440px] rounded-[32px] bg-mk-footer px-8 py-12 text-white md:px-14">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <Logo light />
              <p className="mt-4 max-w-xs font-archivo text-[16px] leading-6 text-white/60">{t("mk.footer.disclaimer")}</p>
            </div>
            <div>
              <h3 className="font-archivo text-[18px] leading-6 font-medium tracking-[0.02em] text-white/60">{t("mk.footer.product")}</h3>
              <ul className="mt-4 flex flex-col gap-3 font-archivo text-[18px] leading-6">
                <li>
                  <Link to="/how-it-works" className="hover:underline">
                    {t("mk.nav.how")}
                  </Link>
                </li>
                <li>
                  <Link to="/coaching" className="hover:underline">
                    {t("mk.nav.coaching")}
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="hover:underline">
                    {t("mk.nav.faq")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-archivo text-[18px] leading-6 font-medium tracking-[0.02em] text-white/60">{t("mk.footer.account")}</h3>
              <ul className="mt-4 flex flex-col gap-3 font-archivo text-[18px] leading-6">
                <li>
                  <Link to="/sign-in" className="hover:underline">
                    {t("mk.nav.signIn")}
                  </Link>
                </li>
                <li>
                  <Link to="/sign-up" className="hover:underline">
                    {t("mk.footer.create")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-archivo text-[18px] leading-6 font-medium tracking-[0.02em] text-white/60">{t("mk.footer.language")}</h3>
              <div className="mt-4">
                <LanguageSwitch className="border-white/20 bg-transparent text-white hover:bg-white/10" />
              </div>
            </div>
          </div>
          <p className="mt-12 border-t border-white/15 pt-6 font-archivo text-[14px] text-white/60">{t("mk.footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
}
