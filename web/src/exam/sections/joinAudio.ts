/*
 * The API stores one Speaking recording per part, but the candidate records
 * each question as its own take. This joins a part's takes into one mono WAV
 * file (16 kHz, enough for speech) with a short pause between answers. If the
 * browser cannot decode the takes, the raw blobs are joined instead.
 */

const RATE = 16000;
const GAP_SEC = 0.6;

function encodeWav(samples: Float32Array, rate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

export async function joinTakes(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 1) return blobs[0];
  try {
    const ctx = new OfflineAudioContext(1, 1, RATE);
    const decoded = [];
    for (const b of blobs) decoded.push(await ctx.decodeAudioData(await b.arrayBuffer()));
    const gap = Math.round(GAP_SEC * RATE);
    const total = decoded.reduce((n, d) => n + d.length, 0) + gap * (decoded.length - 1);
    const out = new Float32Array(total);
    let at = 0;
    for (const d of decoded) {
      // Mix every channel down to mono.
      for (let c = 0; c < d.numberOfChannels; c++) {
        const ch = d.getChannelData(c);
        for (let i = 0; i < ch.length; i++) out[at + i] += ch[i] / d.numberOfChannels;
      }
      at += d.length + gap;
    }
    return encodeWav(out, RATE);
  } catch {
    return new Blob(blobs, { type: blobs[0]?.type || "audio/webm" });
  }
}
