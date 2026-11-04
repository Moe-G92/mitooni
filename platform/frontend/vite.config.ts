import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
export default defineConfig(({ mode }) => ({
  plugins: [react(), { name: "font-license", generateBundle() { this.emitFile({type:"asset",fileName:"licenses/THIRD_PARTY_NOTICES.txt",source:readFileSync(new URL("./licenses/THIRD_PARTY_NOTICES.txt",import.meta.url),"utf8")}); this.emitFile({type:"asset",fileName:"licenses/Vazirmatn-OFL.txt",source:readFileSync(new URL("./licenses/Vazirmatn-OFL.txt", import.meta.url),"utf8")}); } }, {
    name: "local-preview-entry",
    apply: "serve",
    configureServer(server) { server.middlewares.use((request,response,next)=>{
      const pathname=request.url?.split("?")[0] ?? "";
      if(pathname === "/preview.html") { response.statusCode=302;response.setHeader("Location","/preview/topics");response.end();return; }
      if(pathname === "/preview" || pathname.startsWith("/preview/")) request.url="/preview.html";
      next();
    }); },
  }],
  envDir: false,
  publicDir: false,
  server: { host: "127.0.0.1", fs: { strict: true, allow: [process.cwd()] } },
  build: { outDir: mode === "shell-preview" ? "dist-preview" : "dist", rollupOptions: { input: mode === "shell-preview" ? "preview.html" : "index.html" } },
}));
