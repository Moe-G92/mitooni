import { AccountError, type GuardedTransport } from "../request";
import type { AssetData } from "./contracts";
export const MEDIA_LIMIT = 32 * 1024 * 1024;
const slug = /^[a-z0-9][a-z0-9-]{0,127}$/;
const digestPattern = /^[a-f0-9]{64}$/;
export type MediaBinding = {
  packageHash: string;
  targetHash: string;
  targetId: string;
};
export type MediaDescriptor = Pick<
  AssetData,
  "id" | "mediaType" | "sha256" | "url"
>;
export function assetPath(snapshot: MediaBinding, asset: MediaDescriptor) {
  if (
    !slug.test(snapshot.targetId) ||
    !slug.test(asset.id) ||
    !digestPattern.test(snapshot.packageHash) ||
    !digestPattern.test(snapshot.targetHash)
  )
    throw new AccountError(502, "invalid_media_path");
  const path = `/content-review/targets/${snapshot.targetId}/assets/${asset.id}?packageHash=${snapshot.packageHash}&targetHash=${snapshot.targetHash}`;
  if (asset.url !== `/api${path}`)
    throw new AccountError(502, "invalid_media_path");
  return path;
}
export async function boundedBytes(response: Response, limit: number) {
  if (!response.body) throw new AccountError(502, "missing_media_body");
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > limit) throw new AccountError(413, "media_too_large");
      parts.push(chunk.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}
export async function sha256(bytes: Uint8Array<ArrayBuffer>) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
export function mediaSignature(
  bytes: Uint8Array,
  type: AssetData["mediaType"],
) {
  if (type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  const ascii = (a: number, b: number) =>
    String.fromCharCode(...bytes.slice(a, b));
  if (type === "audio/wav")
    return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE";
  return (
    ascii(0, 3) === "ID3" || (bytes[0] === 255 && (bytes[1] & 224) === 224)
  );
}
export async function fetchAsset(
  http: GuardedTransport,
  snapshot: MediaBinding,
  asset: MediaDescriptor,
  signal: AbortSignal,
) {
  const owner = http.session.capture();
  const path = assetPath(snapshot, asset);
  const response = await http.rawResponse(path, { signal });
  const type = response.headers.get("Content-Type")?.split(";")[0].trim();
  if (type !== asset.mediaType)
    throw new AccountError(502, "invalid_media_type");
  const bytes = await boundedBytes(response, MEDIA_LIMIT);
  http.session.assert(owner);
  if (
    !mediaSignature(bytes, asset.mediaType) ||
    (await sha256(bytes)) !== asset.sha256
  )
    throw new AccountError(502, "invalid_media_bytes");
  http.session.assert(owner);
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  return new Blob([bytes], { type: asset.mediaType });
}
