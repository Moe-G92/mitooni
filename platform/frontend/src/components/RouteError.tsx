import { useNavigate } from "react-router";
import { useLocale } from "../context/LocaleContext";
export function RouteError(){const {t}=useLocale();const navigate=useNavigate();return <main className="state"><h1>{t("shellError")}</h1><button onClick={()=>void navigate("/topics",{replace:true})}>{t("retry")}</button></main>;}
