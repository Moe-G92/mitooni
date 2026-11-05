import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "../i18n";
import { applyPrefs } from "@/lib/prefs";
import { App } from "@/app/App";

applyPrefs();

async function start() {
  // The prototype answers /api with Mock Service Worker. Set VITE_USE_MOCKS=false to hit a real backend.
  {
    const { worker } = await import("../mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
