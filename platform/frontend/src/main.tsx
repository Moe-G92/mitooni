import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ProductionUnavailable } from "./production/ProductionUnavailable";
// Production has no fixture router, session, SDK client or provider side effects.
createRoot(document.getElementById("root")!).render(<React.StrictMode><ProductionUnavailable /></React.StrictMode>);
