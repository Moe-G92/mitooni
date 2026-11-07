import workletUrl from "./recorder.worklet.js?url&no-inline";
import { encodeWav, type LocalWav } from "./wav";
export type CaptureEnvironment = {
  createContext: () => AudioContext;
  getUserMedia: () => Promise<MediaStream>;
  createNode: (context: AudioContext, maxFrames: number) => AudioWorkletNode;
};
const browserEnvironment: CaptureEnvironment = {
  createContext: () => {
    try {
      return new AudioContext({ sampleRate: 48000 });
    } catch {
      return new AudioContext();
    }
  },
  getUserMedia: () =>
    navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: { ideal: 1 },
        sampleRate: { ideal: 48000 },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    }),
  createNode: (context, maxFrames) =>
    new AudioWorkletNode(context, "mitooni-pcm-recorder", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: { maxFrames },
    }),
};
export class WavCapture {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private gain: GainNode | null = null;
  private node: AudioWorkletNode | null = null;
  private chunks: Float32Array[] = [];
  private frames = 0;
  private generation = 0;
  private finished = false;
  private stopping: Promise<LocalWav> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private ack: (() => void) | null = null;
  private rejectAck: ((reason: Error) => void) | null = null;
  constructor(
    private onLimit: () => void,
    private onError: () => void,
    private environment = browserEnvironment,
  ) {}
  async start() {
    const generation = ++this.generation;
    const current = () => generation === this.generation;
    try {
      const context = this.environment.createContext();
      this.context = context;
      if (
        context.sampleRate < 8000 ||
        context.sampleRate > 48000 ||
        !context.audioWorklet
      )
        throw Error("capture_unavailable");
      await Promise.all([
        context.resume(),
        context.audioWorklet.addModule(workletUrl),
      ]);
      if (!current()) throw new DOMException("Cancelled", "AbortError");
      const stream = await this.environment.getUserMedia();
      if (!current()) {
        stream.getTracks().forEach((track) => track.stop());
        throw new DOMException("Cancelled", "AbortError");
      }
      this.stream = stream;
      const maxFrames = context.sampleRate * 180;
      const node = this.environment.createNode(context, maxFrames);
      this.node = node;
      this.source = context.createMediaStreamSource(stream);
      this.gain = context.createGain();
      this.gain.gain.value = 0;
      node.port.onmessage = (event: MessageEvent) => {
        if (!current()) return;
        if (event.data?.type === "samples") {
          const chunk: unknown = event.data.samples;
          if (
            !(chunk instanceof Float32Array) ||
            chunk.length > 2048 ||
            this.frames + chunk.length > maxFrames
          ) {
            this.cancel();
            this.onError();
            return;
          }
          this.frames += chunk.length;
          this.chunks.push(chunk);
        } else if (event.data?.type === "stopped") {
          this.finished = true;
          if (this.ack) this.ack();
          else this.onLimit();
        }
      };
      node.onprocessorerror = () => {
        this.cancel();
        this.onError();
      };
      for (const track of stream.getTracks())
        track.onended = () => {
          this.cancel();
          this.onError();
        };
      this.source.connect(node);
      node.connect(this.gain);
      this.gain.connect(context.destination);
      this.timer = setTimeout(this.onLimit, 180000);
    } catch (error) {
      if (current()) this.cancel();
      throw error;
    }
  }
  stop(): Promise<LocalWav> {
    if (!this.stopping) this.stopping = this.finish();
    return this.stopping;
  }
  private async finish(): Promise<LocalWav> {
    const context = this.context,
      node = this.node;
    if (!context || !node) throw Error("capture_unavailable");
    clearTimeout(this.timer);
    const generation = this.generation;
    try {
      if (!this.finished)
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            this.ack = null;
            this.rejectAck = null;
            reject(Error("capture_flush_failed"));
          }, 1500);
          this.ack = () => {
            clearTimeout(timer);
            this.ack = null;
            this.rejectAck = null;
            resolve();
          };
          this.rejectAck = (reason) => {
            clearTimeout(timer);
            this.ack = null;
            this.rejectAck = null;
            reject(reason);
          };
          node.port.postMessage({ type: "stop" });
        });
      if (generation !== this.generation)
        throw new DOMException("Cancelled", "AbortError");
      return encodeWav(this.chunks, context.sampleRate);
    } finally {
      this.cancel();
    }
  }
  cancel() {
    this.generation++;
    this.stopping = null;
    clearTimeout(this.timer);
    this.rejectAck?.(new Error("capture_cancelled"));
    this.ack = null;
    if (this.node) {
      this.node.port.onmessage = null;
      this.node.onprocessorerror = null;
      this.node.port.close();
      this.node.disconnect();
    }
    this.source?.disconnect();
    this.gain?.disconnect();
    this.stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    void this.context?.close().catch(() => {});
    this.context = null;
    this.stream = null;
    this.source = null;
    this.gain = null;
    this.node = null;
    this.chunks = [];
    this.frames = 0;
    this.finished = false;
  }
}
