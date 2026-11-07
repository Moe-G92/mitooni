import { mergeConfig, defineConfig } from "vite";
import { createConfig } from "./vite.config";

export default mergeConfig(createConfig("account-local"), defineConfig({
  plugins: [{
    name: "local-learner-entry",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.headers.accept?.includes("text/html") && !req.url?.startsWith("/api") && !req.url?.split("?")[0].includes(".")) req.url = "/learner.html";
        next();
      });
    },
  }],
  server: { port: 5193, strictPort: true, proxy: { "/api": { target: "http://127.0.0.1:8011", changeOrigin: false } } },
  build: { outDir: "dist-learner-local", rollupOptions: { input: "learner.html" } },
}));
