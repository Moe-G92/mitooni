import { mkdirSync, writeFileSync } from "node:fs";
import type { Plugin, ResolvedConfig } from "vite";
export type AccountBuildRole = "production" | "prototype" | "account-local";
export function assertAccountModules(
  role: AccountBuildRole,
  modules: string[],
) {
  const denied = modules.filter((id) =>
    role === "production"
      ? /^src\/(preview|mocks|data|app)\//.test(id) ||
        id === "src/api/queries.ts"
      : role === "account-local"
        ? id === "src/auth/supabaseAuth.ts" ||
          /^src\/(mocks|data|app)\//.test(id) ||
          id === "src/api/queries.ts"
        : false,
  );
  if (denied.length)
    throw Error(`${role} import boundary violated: ${denied.join(", ")}`);
}
export function accountBuildBoundary(
  role: AccountBuildRole = "production",
): Plugin {
  let config: ResolvedConfig;
  return {
    name: "account-build-boundary",
    configResolved(value) {
      config = value;
    },
    generateBundle(_options, bundle) {
      const modules = Object.values(bundle)
        .flatMap((file) =>
          file.type === "chunk" ? Object.keys(file.modules) : [],
        )
        .filter((id) => id.startsWith(config.root + "/src/"))
        .map((id) => id.slice(config.root.length + 1))
        .sort();
      assertAccountModules(role, modules);
      mkdirSync("review", { recursive: true });
      writeFileSync(
        `review/build-${role}-modules.json`,
        JSON.stringify(modules, null, 2) + "\n",
      );
    },
  };
}
