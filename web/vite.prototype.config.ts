import { mergeConfig, defineConfig } from "vite";
import { createConfig } from "./vite.config";
export default mergeConfig(
  createConfig("prototype"),
  defineConfig({
    publicDir: "public",
    plugins: [
      {
        name: "prototype-entry",
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (
              req.headers.accept?.includes("text/html") &&
              !req.url?.split("?")[0].includes(".")
            )
              req.url = "/prototype.html";
            next();
          });
        },
      },
    ],
    server: { port: 5190 },
    build: {
      outDir: "dist-prototype",
      rollupOptions: { input: "prototype.html" },
    },
  }),
);
