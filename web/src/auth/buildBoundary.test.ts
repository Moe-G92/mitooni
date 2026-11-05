import { it, expect } from "vitest";
import { assertAccountModules } from "../../scripts/account-build-boundary";
it("production admission is explicit and denies fixtures regardless of rollup input", () => {
  expect(() =>
    assertAccountModules("production", [
      "src/main.tsx",
      "src/preview/accountLocal.tsx",
    ]),
  ).toThrow();
  expect(() =>
    assertAccountModules("account-local", ["src/auth/supabaseAuth.ts"]),
  ).toThrow();
  expect(() =>
    assertAccountModules("prototype", ["src/mocks/browser.ts"]),
  ).not.toThrow();
});
