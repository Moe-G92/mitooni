import { expect, it } from "vitest";
import { safeNext } from "@/auth/redirect";
it("resumes only a canonical study UUID path and keeps all redirects on product allowlist", () => {
  const path = "/study/a6d8cf4b-150c-414a-be0f-b6203e80d402";
  expect(safeNext(path)).toBe(path);
  expect(safeNext("/app/practice")).toBe("/app/practice");
  for (const value of [
    "//evil.invalid",
    "https://evil.invalid",
    path + "?x=1",
    path + "#x",
    path + "/",
    path + "\n",
    path.replace("/study/", "/study\\"),
    "/study/not-an-id",
    "/study/%2e%2e",
    "/sign-in",
    "/callback",
    path.toUpperCase(),
  ])
    expect(safeNext(value)).toBe("/app");
});
