import { Navigate, Outlet } from "react-router";
import { useRuntime } from "../context/RuntimeContext";
import { useAppBootstrap } from "../context/AppBootstrapContext";
import { useLocale } from "../context/LocaleContext";
export function AuthGuard() {
 const {isAuthenticated,isLoading}=useRuntime();const {bootstrap,isLoading:pending,error,refresh}=useAppBootstrap();const {t}=useLocale();
 if(isLoading||(isAuthenticated&&pending&&!bootstrap))return <div className="state" role="status">{t("loading")}</div>;
 if(!isAuthenticated)return <Navigate to="/login" replace/>;
 if(!bootstrap)return <main className="state"><h1>{t("error")}</h1>{error&&<button onClick={()=>void refresh()}>{t("retry")}</button>}</main>;
 return <Outlet/>;
}
