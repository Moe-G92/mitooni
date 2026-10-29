/*
 * Camera and microphone for the Speaking room. The stream is kept here so the
 * device check and the room share one permission prompt.
 */

export const media: { stream: MediaStream | null; hasVideo: boolean; hasAudio: boolean } = {
  stream: null,
  hasVideo: false,
  hasAudio: false,
};

export async function openDevices(): Promise<typeof media> {
  if (media.stream && media.stream.getTracks().some((t) => t.readyState === "live")) return media;
  try {
    media.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 360 } });
  } catch {
    try {
      media.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      media.stream = null;
    }
  }
  media.hasAudio = !!media.stream?.getAudioTracks().length;
  media.hasVideo = !!media.stream?.getVideoTracks().length;
  return media;
}

export function closeDevices() {
  media.stream?.getTracks().forEach((t) => t.stop());
  media.stream = null;
}

/** Reads the microphone level (0..1) every 100ms. */
export function watchLevel(stream: MediaStream, onLevel: (rms: number) => void): () => void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  src.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  const id = window.setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    onLevel(Math.sqrt(sum / buf.length));
  }, 100);
  return () => {
    window.clearInterval(id);
    void ctx.close();
  };
}

/** Picks a recording format the browser supports. */
export function recorderMime(): string | undefined {
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}
