// BarEx RootLayout routing/loading composition, without acquisition, referral,
// pixels or inactive consent-dock imports. Consent state remains in App.
import { Outlet, useNavigation } from "react-router";
import { useAppShellMounted, useDelayedFlag } from "../lib/motion";
import { useLocale } from "../context/LocaleContext";
export function RootLayout() { const navigation=useNavigation();const inShell=useAppShellMounted();const loading=useDelayedFlag(navigation.state!=="idle",150);const {t}=useLocale();return <><Outlet/>{loading&&!inShell&&<div className="route-loading" role="status">{t("loading")}</div>}</>; }
