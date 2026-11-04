// Source consent invariant retained; no optional vendors or dock are registered.
import { createContext, useContext, type ReactNode } from "react";
const ConsentContext=createContext({necessary:true,marketing:false});
export function ConsentProvider({children}:{children:ReactNode}) { return <ConsentContext.Provider value={{necessary:true,marketing:false}}>{children}</ConsentContext.Provider>; }
export const useConsent=()=>useContext(ConsentContext);
