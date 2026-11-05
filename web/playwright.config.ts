import { defineConfig } from "@playwright/test";

/*
 * End-to-end tests against the dev server with the mock API.
 * Uses the installed Google Chrome, with a fake camera and microphone
 * so the Speaking room can record.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: true,
  workers: 3,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5174",
    channel: "chrome",
    storageState: { cookies: [], origins: [{ origin: "http://localhost:5174", localStorage: [{ name: "mitooni-ui-prefs-v1", value: JSON.stringify({locale:"en",theme:"light"}) }] }] },
    headless: true,
    viewport: { width: 1280, height: 800 },
    permissions: ["camera", "microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx vite --config vite.prototype.config.ts --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
