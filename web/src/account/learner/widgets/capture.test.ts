import { readFileSync } from "node:fs";
import vm from "node:vm";
import { expect, it, vi } from "vitest";
import { WavCapture, type CaptureEnvironment } from "./capture";
import { encodeWav, inspectWav, readWav } from "./wav";
function environment(rate = 8000) {
  const track = { stop: vi.fn(), onended: null as (() => void) | null };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  const source = { connect: vi.fn(), disconnect: vi.fn() },
    gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
  const port = {
    onmessage: null as ((event: { data: unknown }) => void) | null,
    postMessage: vi.fn(),
    close: vi.fn(),
  };
  const node = {
    port,
    connect: vi.fn(),
    disconnect: vi.fn(),
    onprocessorerror: null,
  };
  const context = {
    sampleRate: rate,
    audioWorklet: { addModule: vi.fn(async () => {}) },
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    createMediaStreamSource: () => source,
    createGain: () => gain,
    destination: {},
  };
  const env: CaptureEnvironment = {
    createContext: () => context as unknown as AudioContext,
    getUserMedia: vi.fn(async () => stream),
    createNode: () => node as unknown as AudioWorkletNode,
  };
  return { env, track, stream, source, gain, port, node, context };
}
it("encodes real PCM16 mono WAV at actual sample rate, clamps and validates limits", async () => {
  const chunk = new Float32Array(2000);
  chunk.set([-2, -1, 0, 1, 2]);
  const wav = encodeWav([chunk], 8000);
  const bytes = new Uint8Array(await wav.blob.arrayBuffer());
  expect(inspectWav(bytes)).toEqual({
    durationSeconds: 0.25,
    sampleRate: 8000,
    channels: 1,
  });
  const v = new DataView(bytes.buffer);
  expect([0, 1, 2, 3, 4].map((i) => v.getInt16(44 + i * 2, true))).toEqual([
    -32768, -32768, 0, 32767, 32767,
  ]);
  expect(() => encodeWav([new Float32Array(1999)], 8000)).toThrow(
    "invalid_audio",
  );
  expect(() => encodeWav([chunk], 96000)).toThrow();
  expect(() => encodeWav([new Float32Array(180 * 8000 + 1)], 8000)).toThrow();
  chunk[0] = NaN;
  expect(() => encodeWav([chunk], 8000)).toThrow();
});
it("rejects disguised/trailing/truncated/unsupported WAV rather than relabeling WebM", async () => {
  const wav = encodeWav([new Float32Array(2000)], 8000);
  const valid = new Uint8Array(await wav.blob.arrayBuffer());
  for (const bad of [
    new Uint8Array([26, 69, 223, 163]),
    valid.slice(0, -1),
    new Uint8Array([...valid, 0]),
  ])
    expect(() => inspectWav(bad)).toThrow();
  const float = valid.slice();
  new DataView(float.buffer).setUint16(20, 3, true);
  expect(() => inspectWav(float)).toThrow();
  expect(await readWav(wav.blob)).toMatchObject({
    sampleRate: 8000,
    durationSeconds: 0.25,
  });
});
it("actual worklet mixes channels, flushes a short tail before acknowledgement and clamps frames", () => {
  let Processor!: new (options: unknown) => {
    port: { onmessage: (event: { data: { type: string } }) => void };
    process: (inputs: Float32Array[][]) => boolean;
  };
  const messages: { type: string; samples?: Float32Array }[] = [];
  class Base {
    port = {
      onmessage: null,
      postMessage: (message: { type: string; samples?: Float32Array }) =>
        messages.push(message),
    };
  }
  vm.runInNewContext(
    readFileSync("src/account/learner/widgets/recorder.worklet.js", "utf8"),
    {
      AudioWorkletProcessor: Base,
      registerProcessor: (_name: string, klass: typeof Processor) => {
        Processor = klass;
      },
      Float32Array,
    },
  );
  const processor = new Processor({ processorOptions: { maxFrames: 3 } });
  expect(
    processor.process([
      [new Float32Array([1, 1, 1, 1]), new Float32Array([0, 0, 0, 0])],
    ]),
  ).toBe(false);
  expect(messages.map((m) => m.type)).toEqual(["samples", "stopped"]);
  expect([...messages[0].samples!]).toEqual([0.5, 0.5, 0.5]);
  messages.length = 0;
  const stopped = new Processor({ processorOptions: { maxFrames: 2000 } });
  stopped.process([[new Float32Array([0.25, 0.5])]]);
  expect(messages).toHaveLength(0);
  stopped.port.onmessage({ data: { type: "stop" } });
  expect(messages.map((m) => m.type)).toEqual(["samples", "stopped"]);
  expect([...messages[0].samples!]).toEqual([0.25, 0.5]);
});
it("waits for worklet tail ACK then closes tracks/context and produces admitted WAV", async () => {
  const e = environment();
  const c = new WavCapture(vi.fn(), vi.fn(), e.env);
  await c.start();
  expect(e.gain.gain.value).toBe(0);
  e.port.onmessage!({
    data: { type: "samples", samples: new Float32Array(1984) },
  });
  let finished = false;
  e.port.postMessage.mockImplementation(() =>
    queueMicrotask(() => {
      e.port.onmessage!({
        data: { type: "samples", samples: new Float32Array(16) },
      });
      e.port.onmessage!({ data: { type: "stopped" } });
    }),
  );
  const first = c.stop();
  expect(c.stop()).toBe(first);
  const stop = first.then((w) => {
    finished = true;
    return w;
  });
  expect(finished).toBe(false);
  const wav = await stop;
  expect(wav.durationSeconds).toBe(0.25);
  expect(e.track.stop).toHaveBeenCalledOnce();
  expect(e.context.close).toHaveBeenCalledOnce();
  expect(e.port.close).toHaveBeenCalledOnce();
});
it("cancels late permission without retaining microphone/context", async () => {
  const e = environment();
  let release!: (s: MediaStream) => void;
  const permission = new Promise<MediaStream>((r) => {
    release = r;
  });
  e.env.getUserMedia = vi.fn(() => permission);
  const c = new WavCapture(vi.fn(), vi.fn(), e.env);
  const start = c.start();
  await vi.waitFor(() => expect(e.env.getUserMedia).toHaveBeenCalledOnce());
  c.cancel();
  release(e.stream);
  await expect(start).rejects.toThrow("Cancelled");
  expect(e.track.stop).toHaveBeenCalledOnce();
  expect(e.context.close).toHaveBeenCalledOnce();
  expect(e.source.connect).not.toHaveBeenCalled();
});
it("rejects unsupported rate before mic request and closes failed worklet resources", async () => {
  const e = environment(96000);
  const c = new WavCapture(vi.fn(), vi.fn(), e.env);
  await expect(c.start()).rejects.toThrow("capture_unavailable");
  expect(e.env.getUserMedia).not.toHaveBeenCalled();
  expect(e.context.close).toHaveBeenCalledOnce();
});
it("processor errors stop every resource and report failure", async () => {
  const e = environment();
  const fail = vi.fn();
  const c = new WavCapture(vi.fn(), fail, e.env);
  await c.start();
  (e.node.onprocessorerror as unknown as () => void)();
  expect(fail).toHaveBeenCalledOnce();
  expect(e.track.stop).toHaveBeenCalledOnce();
  expect(e.context.close).toHaveBeenCalledOnce();
});
it("missing flush acknowledgement fails closed and stops microphone resources", async () => {
  vi.useFakeTimers();
  try {
    const e = environment();
    const c = new WavCapture(vi.fn(), vi.fn(), e.env);
    await c.start();
    const stopped = c.stop();
    const assertion = expect(stopped).rejects.toThrow("capture_flush_failed");
    await vi.advanceTimersByTimeAsync(1500);
    await assertion;
    expect(e.track.stop).toHaveBeenCalledOnce();
    expect(e.context.close).toHaveBeenCalledOnce();
  } finally {
    vi.useRealTimers();
  }
});
