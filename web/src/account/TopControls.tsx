// Adapted from Mo components/TopControls.tsx: account menu without simulated notifications.
import { Link } from "react-router";
import { LogOut, Settings, User } from "lucide-react";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/misc";
import { useAccount, useMe } from "./state";
import { useT } from "./locale";
import { LanguageSwitch } from "./LanguageSwitch";
export function TopControls() {
  const { t } = useT();
  const me = useMe();
  const { session } = useAccount();
  const initials = me.data?.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="flex items-center gap-2">
      <LanguageSwitch />
      <Menu>
        <MenuTrigger
          className="grid size-11 place-items-center rounded-[10px] border border-border bg-card text-xs font-medium text-foreground hover:bg-accent"
          aria-label={[initials, t("top.account")].filter(Boolean).join(" ")}
        >
          {initials || <User className="size-4" />}
        </MenuTrigger>
        <MenuContent>
          <div className="px-3 py-2 text-sm">
            <div className="font-medium">{me.data?.name}</div>
            <div className="text-xs text-muted-foreground" dir="ltr">
              {me.data?.email}
            </div>
          </div>
          <MenuSeparator />
          <MenuItem asChild className="min-h-11 min-w-11">
            <Link to="/app/settings">
              <Settings className="size-4" />
              {t("nav.settings")}
            </Link>
          </MenuItem>
          <MenuItem
            className="min-h-11 min-w-11"
            onSelect={() => {
              void session.signOut().catch(() => {
                /* Local identity is already cleared. */
              });
            }}
          >
            <LogOut className="size-4" />
            {t("top.signOut")}
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}
