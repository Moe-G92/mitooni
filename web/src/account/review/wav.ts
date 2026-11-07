export const MAX_WAV_BYTES = 18 * 1024 * 1024;
export type LocalWav = {
  blob: Blob;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
};
const fail = () => {
  throw new Error("invalid_audio");
};
export function inspectWav(
  bytes: Uint8Array<ArrayBuffer>,
): Omit<LocalWav, "blob"> {
  if (bytes.length < 44 || bytes.length > MAX_WAV_BYTES) return fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (
    text(0, 4) !== "RIFF" ||
    text(8, 12) !== "WAVE" ||
    view.getUint32(4, true) + 8 !== bytes.length
  )
    return fail();
  let offset = 12,
    formats = 0,
    dataChunks = 0,
    dataBytes = 0,
    channels = 0,
    rate = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return fail();
    const kind = text(offset, offset + 4),
      size = view.getUint32(offset + 4, true),
      end = offset + 8 + size;
    if (end > bytes.length) return fail();
    if (kind === "fmt ") {
      formats++;
      if (size < 16) return fail();
      const encoding = view.getUint16(offset + 8, true);
      channels = view.getUint16(offset + 10, true);
      rate = view.getUint32(offset + 12, true);
      const byteRate = view.getUint32(offset + 16, true),
        block = view.getUint16(offset + 20, true),
        bits = view.getUint16(offset + 22, true);
      if (
        encoding !== 1 ||
        ![1, 2].includes(channels) ||
        bits !== 16 ||
        rate < 8000 ||
        rate > 48000 ||
        block !== channels * 2 ||
        byteRate !== rate * block
      )
        return fail();
    }
    if (kind === "data") {
      if (formats !== 1) return fail();
      dataChunks++;
      dataBytes = size;
    }
    offset = end + (size % 2);
  }
  const duration = dataBytes / (channels * 2 * rate);
  if (
    offset !== bytes.length ||
    formats !== 1 ||
    dataChunks !== 1 ||
    dataBytes % (channels * 2) !== 0 ||
    !Number.isFinite(duration) ||
    duration < 0.25 ||
    duration > 180
  )
    return fail();
  return { durationSeconds: duration, sampleRate: rate, channels };
}
export function encodeWav(
  chunks: readonly Float32Array[],
  sampleRate: number,
): LocalWav {
  const frames = chunks.reduce((n, chunk) => n + chunk.length, 0);
  if (
    !Number.isInteger(sampleRate) ||
    sampleRate < 8000 ||
    sampleRate > 48000 ||
    frames < sampleRate * 0.25 ||
    frames > sampleRate * 180
  )
    return fail();
  const bytes = new Uint8Array(44 + frames * 2),
    view = new DataView(bytes.buffer);
  const write = (start: number, value: string) =>
    [...value].forEach((char, i) => {
      bytes[start + i] = char.charCodeAt(0);
    });
  write(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, frames * 2, true);
  let offset = 44;
  for (const chunk of chunks)
    for (const value of chunk) {
      if (!Number.isFinite(value)) return fail();
      const v = Math.max(-1, Math.min(1, value));
      view.setInt16(
        offset,
        v < 0 ? Math.round(v * 32768) : Math.round(v * 32767),
        true,
      );
      offset += 2;
    }
  return {
    blob: new Blob([bytes], { type: "audio/wav" }),
    ...inspectWav(bytes),
  };
}
export async function readWav(file: Blob): Promise<LocalWav> {
  if (file.size < 44 || file.size > MAX_WAV_BYTES) return fail();
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    blob: new Blob([bytes], { type: "audio/wav" }),
    ...inspectWav(bytes),
  };
}
