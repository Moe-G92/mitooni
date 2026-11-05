import { it, expect, vi } from "vitest";
import { retirePrototypeWorker } from "./workerMigration";
import { authConfig } from "./config";
import { safeNext } from "./redirect";
const worker = (name: string) =>
  ({ scriptURL: `${location.origin}/${name}` }) as ServiceWorker;
it("retires only the exact root MSW registration, bounded reload before any API factory", async () => {
  const unregister = vi.fn(async () => true),
    unrelated = vi.fn(async () => true),
    reload = vi.fn();
  const controller = worker("mockServiceWorker.js");
  const container = {
    controller,
    getRegistrations: async () => [
      { scope: `${location.origin}/`, active: controller, unregister },
      {
        scope: `${location.origin}/other/`,
        active: worker("other.js"),
        unregister: unrelated,
      },
    ],
  } as unknown as ServiceWorkerContainer;
  sessionStorage.clear();
  expect(await retirePrototypeWorker(container, sessionStorage, reload)).toBe(
    "reload",
  );
  expect(unregister).toHaveBeenCalledOnce();
  expect(unrelated).not.toHaveBeenCalled();
  expect(reload).toHaveBeenCalledOnce();
  expect(await retirePrototypeWorker(container, sessionStorage, reload)).toBe(
    "blocked",
  );
  expect(reload).toHaveBeenCalledOnce();
});
it("blocks an unrelated controller without unregistering it", async () => {
  const unregister = vi.fn();
  const controller = worker("other.js");
  expect(
    await retirePrototypeWorker(
      {
        controller,
        getRegistrations: async () => [
          { scope: `${location.origin}/`, active: controller, unregister },
        ],
      } as unknown as ServiceWorkerContainer,
      null,
      vi.fn(),
    ),
  ).toBe("blocked");
  expect(unregister).not.toHaveBeenCalled();
});
it("does not admit missing config or unsafe redirects", () => {
  expect(authConfig({})).toBeNull();
  expect(
    authConfig({
      VITE_MITOONI_AUTH_URL: "http://example.invalid",
      VITE_MITOONI_AUTH_PUBLISHABLE_KEY: "x",
    }),
  ).toBeNull();
  for (const path of [
    "//evil.test",
    "https://evil.test",
    "/sign-in",
    "/app\\evil",
    "/app?next=evil",
    "/app\n",
  ])
    expect(safeNext(path)).toBe("/app/settings");
  expect(safeNext("/app/practice")).toBe("/app/practice");
});

it("blocks unknown covering registrations before they claim an uncontrolled page", async () => {
  const unregister = vi.fn(async () => true);
  const unknown = worker("other.js");
  const container = {
    controller: null,
    getRegistrations: async () => [
      {
        scope: `${location.origin}/`,
        active: unknown,
        waiting: null,
        installing: null,
        unregister,
      },
    ],
  } as unknown as ServiceWorkerContainer;
  expect(await retirePrototypeWorker(container, null, vi.fn())).toBe("blocked");
  expect(unregister).not.toHaveBeenCalled();
});
it("allows unrelated non-covering registrations without removing them", async () => {
  const unregister = vi.fn(async () => true);
  const container = {
    controller: null,
    getRegistrations: async () => [
      {
        scope: `${location.origin}/other/`,
        active: worker("other.js"),
        unregister,
      },
    ],
  } as unknown as ServiceWorkerContainer;
  expect(await retirePrototypeWorker(container, null, vi.fn())).toBe("ready");
  expect(unregister).not.toHaveBeenCalled();
});
