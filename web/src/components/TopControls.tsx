import { Link, useNavigate } from "react-router";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useAuth, useMe, useNotificationMutations, useNotifications, useUpdateMe } from "@/api/queries";
import { switchLocale, useT } from "@/i18n";
import { usePrefs } from "@/lib/prefs";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/misc";

const iconBtn =
  "grid size-[34px] place-items-center rounded-[10px] border border-border bg-card text-foreground hover:bg-accent [&_svg]:size-[17px]";

/** Language switch: English is the default, Persian the second language. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { locale } = usePrefs();
  const me = useMe();
  const update = useUpdateMe();
  const next = locale === "en" ? "fa" : "en";
  return (
    <button
      className={cn(iconBtn, "w-auto px-2.5 text-[13px] font-medium", className)}
      onClick={() => {
        switchLocale(next);
        if (me.data) update.mutate({ locale: next });
      }}
      aria-label={next === "fa" ? "تغییر زبان به فارسی" : "Switch to English"}
      lang={next}
    >
      {next === "fa" ? "فارسی" : "English"}
    </button>
  );
}

function Notifications() {
  const { t, locale, pick } = useT();
  const list = useNotifications();
  const { readAll, read } = useNotificationMutations();
  const navigate = useNavigate();
  const unread = list.data?.filter((n) => !n.read).length ?? 0;
  return (
    <Menu>
      <MenuTrigger className={cn(iconBtn, "relative")} aria-label={t("top.notifications", { count: unread })}>
        <Bell />
        {unread > 0 && <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-weak text-[10px] text-white dark:text-background">{unread}</span>}
      </MenuTrigger>
      <MenuContent className="w-80 p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">{t("top.notificationsTitle")}</span>
          {unread > 0 && (
            <button className="text-xs text-primary hover:underline" onClick={() => readAll.mutate()}>
              {t("top.markAllRead")}
            </button>
          )}
        </div>
        {list.data?.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">{t("top.noNotifications")}</p>}
        {list.data?.slice(0, 6).map((n) => (
          <MenuItem
            key={n.id}
            className="flex-col items-start gap-0.5"
            onSelect={() => {
              read.mutate(n.id);
              if (n.href) navigate(n.href);
            }}
          >
            <span className={cn("flex w-full items-center gap-2 text-sm", !n.read && "font-medium")}>
              {!n.read && <i className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
              {pick(n.title)}
            </span>
            <span className="text-xs text-muted-foreground">{pick(n.body)}</span>
            <span className="text-[11px] text-faint">{formatDateTime(n.at, locale)}</span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

function Account() {
  const { t } = useT();
  const me = useMe();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const initials = me.data?.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <Menu>
      <MenuTrigger className={cn(iconBtn, "text-xs font-medium")} aria-label={t("top.account")}>
        {initials || <User />}
      </MenuTrigger>
      <MenuContent>
        <div className="px-3 py-2 text-sm">
          <div className="font-medium">{me.data?.name}</div>
          <div className="text-xs text-muted-foreground" dir="ltr">
            {me.data?.email}
          </div>
        </div>
        <MenuSeparator />
        <MenuItem asChild>
          <Link to="/app/settings">
            <Settings className="size-4" /> {t("nav.settings")}
          </Link>
        </MenuItem>
        <MenuItem
          onSelect={() =>
            signOut.mutate(undefined, {
              onSuccess: () => navigate("/"),
            })
          }
        >
          <LogOut className="size-4" /> {t("top.signOut")}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/** Controls at the end of every app page header. */
export function TopControls() {
  return (
    <div className="flex items-center gap-2">
      <LanguageSwitch />
      <Notifications />
      <Account />
    </div>
  );
}
