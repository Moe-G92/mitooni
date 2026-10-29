import { setupWorker } from "msw/browser";
import { authHandlers } from "./auth-handlers";
import { handlers } from "./handlers";

// Auth handlers come first, so they take precedence over older auth routes.
export const worker = setupWorker(...authHandlers, ...handlers);
