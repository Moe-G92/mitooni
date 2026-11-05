// Only the known prototype worker is retired. No unrelated registration/cache deletion.
export async function retirePrototypeWorker(
  container: ServiceWorkerContainer | undefined = navigator.serviceWorker,
  storage: Pick<Storage, "getItem" | "setItem"> | null = window.sessionStorage,
  reload: () => void = () => window.location.reload(),
): Promise<"ready" | "reload" | "blocked"> {
  if (!container) return "ready";
  const origin = window.location.origin;
  const known = (worker: ServiceWorker | null) => {
    if (!worker) return false;
    const url = new URL(worker.scriptURL);
    return (
      url.origin === origin &&
      url.pathname === "/mockServiceWorker.js" &&
      !url.search
    );
  };
  const registrations = await container.getRegistrations();
  for (const registration of registrations) {
    const workers = [
      registration.active,
      registration.waiting,
      registration.installing,
    ].filter(Boolean) as ServiceWorker[];
    const exact =
      registration.scope === `${origin}/` &&
      workers.length > 0 &&
      workers.every(known);
    const covers = window.location.href.startsWith(registration.scope);
    if (covers && !exact) return "blocked";
    if (exact && !(await registration.unregister())) return "blocked";
  }
  if (!container.controller) return "ready";
  if (!known(container.controller)) return "blocked";
  try {
    if (!storage || storage.getItem("mitooni:prototype-worker-retired:v1"))
      return "blocked";
    storage.setItem("mitooni:prototype-worker-retired:v1", "1");
  } catch {
    return "blocked";
  }
  reload();
  return "reload";
}
