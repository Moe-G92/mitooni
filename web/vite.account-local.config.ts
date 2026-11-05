import { mergeConfig, defineConfig } from "vite";
import { createConfig } from "./vite.config";
export default mergeConfig(
  createConfig("account-local"),
  defineConfig({
    plugins: [
      {
        name: "local-account-entry",
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (
              req.headers.accept?.includes("text/html") &&
              !req.url?.startsWith("/api") &&
              !req.url?.split("?")[0].includes(".")
            )
              req.url = "/account.html";
            next();
          });
        },
      },
    ],
    server: {
      port: 5191,
      strictPort: true,
      proxy: {
        "/api": { target: "http://127.0.0.1:8009", changeOrigin: false },
      },
    },
    build: {
      outDir: "dist-account-local",
      rollupOptions: { input: "account.html" },
    },
  }),
);
