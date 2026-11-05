export type AuthConfig = { url: string; key: string; apiBase: string };
function publicKey(key: string) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try {
    const payload = JSON.parse(
      atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return key.split(".").length === 3 && payload.role === "anon";
  } catch {
    return false;
  }
}
export function authConfig(values: Record<string, unknown>): AuthConfig | null {
  const url = values.VITE_MITOONI_AUTH_URL,
    key = values.VITE_MITOONI_AUTH_PUBLISHABLE_KEY;
  if (typeof url !== "string" || typeof key !== "string" || !publicKey(key))
    return null;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== "/"
    )
      return null;
    const base = values.VITE_MITOONI_API_BASE ?? "";
    if (typeof base !== "string") return null;
    if (base) {
      const api = new URL(base);
      if (
        api.protocol !== "https:" ||
        api.username ||
        api.password ||
        api.pathname !== "/" ||
        api.search ||
        api.hash
      )
        return null;
    }
    return { url: parsed.origin, key, apiBase: base.replace(/\/$/, "") };
  } catch {
    return null;
  }
}
