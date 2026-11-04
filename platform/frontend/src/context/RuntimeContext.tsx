import { createContext, useContext, type ReactNode } from "react";
export type Profile = { display_name: string; preferences: { appearance?: { theme?: string } } };
export type ShellServices = { getUserProfile: () => Promise<Profile>; updateUserPreferences: (patch: Profile["preferences"]) => Promise<void>; bootstrap: () => Promise<{ id: string }> };
export type Runtime = { user: { id: string; name: string } | null; isAuthenticated: boolean; isLoading: boolean; logout: () => Promise<void>; services: ShellServices };
const RuntimeContext = createContext<Runtime | null>(null);
export function RuntimeProvider({ value, children }: { value: Runtime; children: ReactNode }) { return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>; }
export function useRuntime() { const value = useContext(RuntimeContext); if (!value) throw new Error("Shell runtime missing"); return value; }
