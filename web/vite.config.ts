import * as path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // When Arash's backend is running, set VITE_USE_MOCKS=false and proxy /api to it here.
    proxy: process.env.API_TARGET ? { "/api": { target: process.env.API_TARGET, changeOrigin: true } } : undefined,
  },
});
