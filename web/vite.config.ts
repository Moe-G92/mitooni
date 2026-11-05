import * as path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import {
  accountBuildBoundary,
  type AccountBuildRole,
} from "./scripts/account-build-boundary";
import tailwindcss from "@tailwindcss/vite";
export const createConfig = (role: AccountBuildRole = "production") =>
  defineConfig({
    envDir: false,
    cacheDir: path.resolve(__dirname, `node_modules/.vite-${role}`),
    publicDir: false,
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    plugins: [react(), tailwindcss(), accountBuildBoundary(role)],
    server: {
      host: "127.0.0.1",
      port: 5192,
      watch: {
        ignored: [
          "**/dist/**",
          "**/dist-prototype/**",
          "**/dist-account-local/**",
          "**/review/**",
        ],
      },
    },
    build: { outDir: "dist", emptyOutDir: true },
  });

export default createConfig();
