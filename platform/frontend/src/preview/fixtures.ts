import type { ShellServices } from "../context/RuntimeContext";
// Synthetic preview only; this module has no network or provider SDK imports.
export function createFixtureServices():ShellServices {
 let theme="system";
 try { theme=localStorage.getItem("mitooni-appearance-theme")??"system"; } catch { /* in-memory fallback */ }
 return {getUserProfile:async()=>({display_name:"",preferences:{appearance:{theme}}}),updateUserPreferences:async patch=>{theme=patch.appearance?.theme??theme;},bootstrap:async()=>({id:"synthetic-local-learner"})};
}
