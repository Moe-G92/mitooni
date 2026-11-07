import { webcrypto } from "node:crypto";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SessionController } from "@/auth/session";
import { setPrefs } from "@/lib/prefs";
import { GuardedTransport } from "../request";
import {
  assetPath,
  boundedBytes,
  fetchAsset,
  sha256,
  type MediaBinding,
} from "./media";
import { MediaAsset } from "./MediaAsset";
import type { AssetData, SnapshotData } from "./contracts";
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const binding: MediaBinding = {
  targetId: "test-target",
  packageHash: "a".repeat(64),
  targetHash: "b".repeat(64),
};
const path = `/api/content-review/targets/test-target/assets/chart?packageHash=${binding.packageHash}&targetHash=${binding.targetHash}`;
async function asset(): Promise<AssetData> {
  return {
    id: "chart",
    kind: "writing_chart",
    mediaType: "image/png",
    sha256: await sha256(png),
    width: 100,
    height: 50,
    alt: "Synthetic chart",
    url: path,
  };
}
async function auth() {
  let current = "a";
  const refresh = vi.fn(async () => ({ subject: current, token: "refreshed" }));
  const session = new SessionController({
    initialize: async () => null,
    subscribe: () => () => {},
    signIn: async (email) => ({ subject: (current = email), token: email }),
    refresh,
    signOut: async () => {},
  });
  await session.start();
  await session.signIn("a", "");
  return { session, refresh };
}
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  setPrefs({ locale: "en" });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("constructs exactly the target/version media path and rejects alternate origins/paths/query", async () => {
  const a = await asset();
  expect(assetPath(binding, a)).toBe(path.slice(4));
  for (const url of [
    "https://evil.invalid" + path,
    "//evil.invalid" + path,
    path + "&token=secret",
    path.replace("test-target", "another-target"),
    path.replace("/assets/", "/assets/%2f"),
  ])
    expect(() => assetPath(binding, { ...a, url })).toThrow(
      "invalid_media_path",
    );
});
it("raw transport retains configured API base, no-store and redirect-error and refreshes once", async () => {
  const { session, refresh } = await auth();
  const calls: [unknown, RequestInit][] = [];
  const http = new GuardedTransport(
    session,
    "https://configured.invalid",
    async (url, options) => {
      calls.push([url, options!]);
      return calls.length === 1
        ? new Response(null, { status: 401 })
        : new Response(png, { headers: { "Content-Type": "image/png" } });
    },
  );
  await fetchAsset(http, binding, await asset(), new AbortController().signal);
  expect(refresh).toHaveBeenCalledOnce();
  expect(calls).toHaveLength(2);
  expect(calls[1][0]).toBe("https://configured.invalid" + path);
  expect(calls[1][1]).toMatchObject({
    method: "GET",
    redirect: "error",
    credentials: "omit",
    cache: "no-store",
  });
  expect(new Headers(calls[1][1].headers).get("Authorization")).toBe(
    "Bearer refreshed",
  );
});
it("raw repeated401 clears the session and arbitrary/encoded media URLs never dispatch", async () => {
  const { session } = await auth();
  const fetcher = vi.fn(async () => new Response(null, { status: 401 }));
  const http = new GuardedTransport(session, "", fetcher);
  for (const bad of [
    "https://evil.invalid",
    "//evil.invalid",
    "/content-review/targets/a/assets/%2f",
    "/content-review/targets/a/../asset",
    "/content-review/targets/a#fragment",
  ])
    await expect(http.rawResponse(bad)).rejects.toThrow("invalid_media_path");
  expect(fetcher).not.toHaveBeenCalled();
  await expect(http.rawResponse(path.slice(4))).rejects.toThrow(
    "unauthenticated",
  );
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(session.getSnapshot().session).toBeNull();
});
it("validates actual MIME, signature, digest and streamed size, not Content-Length", async () => {
  const { session } = await auth();
  const a = await asset();
  for (const [body, type, hash] of [
    [png, "image/svg+xml", a.sha256],
    [new Uint8Array([1, 2, 3]), "image/png", a.sha256],
    [png, "image/png", "c".repeat(64)],
  ] as const) {
    const http = new GuardedTransport(
      session,
      "",
      async () => new Response(body, { headers: { "Content-Type": type } }),
    );
    await expect(
      fetchAsset(
        http,
        binding,
        { ...a, sha256: hash },
        new AbortController().signal,
      ),
    ).rejects.toThrow();
  }
  await expect(
    boundedBytes(
      new Response(new Uint8Array(12), { headers: { "Content-Length": "1" } }),
      10,
    ),
  ).rejects.toThrow("media_too_large");
});
it("rejects a late binary response after account replacement", async () => {
  const { session } = await auth();
  let release!: (r: Response) => void;
  let called = false;
  const http = new GuardedTransport(session, "", async () => {
    called = true;
    return new Promise<Response>((r) => {
      release = r;
    });
  });
  const pending = fetchAsset(
    http,
    binding,
    await asset(),
    new AbortController().signal,
  );
  await waitFor(() => expect(called).toBe(true));
  await session.signIn("b", "");
  release(new Response(png, { headers: { "Content-Type": "image/png" } }));
  await expect(pending).rejects.toThrow("account_changed");
});
it("owns Blob URLs and revokes them immediately on account change and unmount", async () => {
  const { session } = await auth();
  const create = vi.fn(() => "blob:synthetic-private");
  const revoke = vi.fn();
  const OriginalURL = URL;
  vi.stubGlobal(
    "URL",
    class extends OriginalURL {
      static createObjectURL = create;
      static revokeObjectURL = revoke;
    },
  );
  const a = await asset();
  const snapshot = {
    ...binding,
    target: { id: binding.targetId },
  } as unknown as SnapshotData;
  const http = new GuardedTransport(
    session,
    "",
    async () => new Response(png, { headers: { "Content-Type": "image/png" } }),
  );
  const view = render(
    <MediaAsset http={http} snapshot={snapshot} asset={a} deny={() => {}} />,
  );
  expect(
    await screen.findByRole("img", { name: "Synthetic chart" }),
  ).toHaveAttribute("src", "blob:synthetic-private");
  await act(async () => {
    await session.signIn("b", "");
  });
  expect(revoke).toHaveBeenCalledWith("blob:synthetic-private");
  expect(screen.queryByRole("img")).toBeNull();
  view.unmount();
  expect(create).toHaveBeenCalledOnce();
});
it("media403 delegates whole-target purge and creates no Blob URL", async () => {
  const { session } = await auth();
  const deny = vi.fn();
  const a = await asset();
  const snapshot = {
    ...binding,
    target: { id: binding.targetId },
  } as unknown as SnapshotData;
  const http = new GuardedTransport(session, "", async () =>
    Response.json({ detail: { code: "review_denied" } }, { status: 403 }),
  );
  render(<MediaAsset http={http} snapshot={snapshot} asset={a} deny={deny} />);
  await waitFor(() => expect(deny).toHaveBeenCalledOnce());
  expect(screen.queryByRole("img")).toBeNull();
});
