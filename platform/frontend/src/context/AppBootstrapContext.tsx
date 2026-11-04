// Adapted orchestration seam from BarEx AppBootstrapContext: auth-scoped load,
// keep resolved data during refresh, ignore stale account responses, explicit retry.
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useRuntime } from "./RuntimeContext";
const Context=createContext<{bootstrap:{id:string}|null;isLoading:boolean;error:string|null;refresh:()=>Promise<void>}>({bootstrap:null,isLoading:true,error:null,refresh:async()=>{}});
export function AppBootstrapProvider({children}:{children:ReactNode}) {
 const {user,isAuthenticated,services}=useRuntime();
 const [bootstrap,setBootstrap]=useState<{id:string}|null>(null); const [isLoading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);const generation=useRef(0);
 const refresh=useCallback(async()=>{const at=++generation.current;setLoading(true);setError(null);if(!isAuthenticated){setBootstrap(null);setLoading(false);return;}try{const data=await services.bootstrap();if(at===generation.current)setBootstrap(data);}catch{if(at===generation.current)setError("bootstrap");}finally{if(at===generation.current)setLoading(false);}},[isAuthenticated,services]);
 const invalidate=useCallback(()=>{generation.current++;},[]);
 useEffect(()=>{setBootstrap(null);void refresh();return invalidate;},[refresh,user?.id,invalidate]);
 return <Context.Provider value={{bootstrap,isLoading,error,refresh}}>{children}</Context.Provider>;
}
export const useAppBootstrap=()=>useContext(Context);
