import "./index.css";
import { authConfig } from "./auth/config";
import { mountAccount } from "./account/mount";
const config=authConfig(import.meta.env);
void mountAccount(async()=>config?(await import("./auth/supabaseAuth")).createAuthPort(config):null,config?.apiBase??"");
