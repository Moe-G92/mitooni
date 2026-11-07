/* global AudioWorkletProcessor, registerProcessor */
class MitooniPcmRecorder extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.limit = options.processorOptions.maxFrames;
    this.frames = 0;
    this.buffer = new Float32Array(2048);
    this.used = 0;
    this.active = true;
    this.port.onmessage = (event) => {
      if (event.data?.type === "stop") this.finish();
    };
  }
  flush() {
    if (!this.used) return;
    const samples = this.buffer.slice(0, this.used);
    this.port.postMessage({ type: "samples", samples }, [samples.buffer]);
    this.used = 0;
  }
  finish() {
    if (!this.active) return;
    this.active = false;
    this.flush();
    // MessagePort ordering makes this the acknowledgement after the final tail.
    this.port.postMessage({ type: "stopped" });
  }
  process(inputs) {
    if (!this.active) return false;
    const channels = inputs[0];
    if (!channels?.length) return true;
    for (let i = 0; i < channels[0].length; i++) {
      if (this.frames >= this.limit) {
        this.finish();
        break;
      }
      let sample = 0;
      for (const channel of channels) sample += channel[i] ?? 0;
      this.buffer[this.used++] = sample / channels.length;
      this.frames++;
      if (this.used === this.buffer.length) this.flush();
    }
    if (this.frames >= this.limit) this.finish();
    return this.active;
  }
}
registerProcessor("mitooni-pcm-recorder", MitooniPcmRecorder);
