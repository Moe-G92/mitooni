import type { z } from "zod";
import { AccountError, type GuardedTransport } from "../request";
import type { SnapshotData } from "./contracts";
import { boundedBytes, sha256 } from "./media";
import { Recording, Recordings, type RecordingData } from "./speakingContracts";
import { inspectWav, MAX_WAV_BYTES, type LocalWav } from "./wav";
const slug = /^[a-z0-9][a-z0-9-]{0,127}$/,
  uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export type SpeakingBinding = {
  targetId: string;
  packageHash: string;
  targetHash: string;
};
export type Upload = Readonly<{
  binding: SpeakingBinding;
  taskId: string;
  blob: Blob;
  sha256: string;
  key: string;
  owner: { subject: string; epoch: number };
}>;
export const speakingBinding = (s: SnapshotData): SpeakingBinding => ({
  targetId: s.target.id,
  packageHash: s.packageHash,
  targetHash: s.targetHash,
});
export class SpeakingClient {
  constructor(readonly http: GuardedTransport) {}
  private path(binding: SpeakingBinding, recordingId?: string) {
    if (
      !slug.test(binding.targetId) ||
      (recordingId !== undefined && !uuid.test(recordingId))
    )
      throw new AccountError(502, "invalid_speaking_path");
    return `/content-review/targets/${binding.targetId}/speaking-recordings${recordingId ? `/${recordingId}/audio` : ""}`;
  }
  private headers(binding: SpeakingBinding) {
    return {
      "X-Package-Hash": binding.packageHash,
      "X-Target-Hash": binding.targetHash,
    };
  }
  private async parse<T>(
    schema: z.ZodType<T>,
    response: Response,
    owner: { subject: string; epoch: number },
  ) {
    const bytes = await boundedBytes(response, 1024 * 1024);
    this.http.session.assert(owner);
    let value: unknown;
    try {
      value = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new AccountError(502, "invalid_speaking_response");
    }
    const parsed = schema.safeParse(value);
    if (!parsed.success)
      throw new AccountError(502, "invalid_speaking_response");
    return parsed.data;
  }
  async list(binding: SpeakingBinding, signal?: AbortSignal) {
    const owner = this.http.session.capture();
    const data = await this.parse(
      Recordings,
      await this.http.rawResponse(this.path(binding), {
        headers: this.headers(binding),
        signal,
      }),
      owner,
    );
    if (
      data.packageHash !== binding.packageHash ||
      data.targetHash !== binding.targetHash ||
      data.recordings.some(
        (r) =>
          r.packageHash !== binding.packageHash ||
          r.targetHash !== binding.targetHash,
      )
    )
      throw new AccountError(409, "content_changed");
    return data;
  }
  async prepare(
    s: SnapshotData,
    taskId: string,
    wav: LocalWav,
  ): Promise<Upload> {
    const owner = this.http.session.capture();
    if (
      !s.task.sections.some((section) => section.id === taskId) ||
      s.target.skill !== "speaking" ||
      !s.task.speaking?.permissionGranted
    )
      throw new AccountError(403, "speaking_denied");
    const bytes = new Uint8Array(await wav.blob.arrayBuffer());
    inspectWav(bytes);
    const digest = await sha256(bytes);
    this.http.session.assert(owner);
    return Object.freeze({
      binding: Object.freeze(speakingBinding(s)),
      taskId,
      blob: new Blob([bytes], { type: "audio/wav" }),
      sha256: digest,
      key: crypto.randomUUID(),
      owner: Object.freeze(owner),
    });
  }
  async upload(op: Upload, signal?: AbortSignal) {
    this.http.session.assert(op.owner);
    const response = await this.http.rawResponse(this.path(op.binding), {
      method: "POST",
      body: op.blob,
      operationId: op.key,
      headers: {
        ...this.headers(op.binding),
        "Content-Type": "audio/wav",
        "X-Speaking-Task-Id": op.taskId,
        "X-Recording-Sha256": op.sha256,
      },
      signal,
    });
    const data = await this.parse(Recording, response, op.owner);
    if (
      data.packageHash !== op.binding.packageHash ||
      data.targetHash !== op.binding.targetHash ||
      data.taskId !== op.taskId ||
      data.recordingSha256 !== op.sha256
    )
      throw new AccountError(502, "invalid_speaking_binding");
    return data;
  }
  async audio(
    binding: SpeakingBinding,
    recording: RecordingData,
    signal: AbortSignal,
  ) {
    const owner = this.http.session.capture();
    const response = await this.http.rawResponse(
      this.path(binding, recording.recordingId),
      { headers: this.headers(binding), signal },
    );
    if (response.headers.get("Content-Type")?.split(";")[0] !== "audio/wav")
      throw new AccountError(502, "invalid_audio_type");
    const bytes = await boundedBytes(response, MAX_WAV_BYTES);
    const decoded = inspectWav(bytes);
    if (
      bytes.length !== recording.sizeBytes ||
      Math.abs(decoded.durationSeconds - recording.durationSeconds) > 0.001 ||
      (await sha256(bytes)) !== recording.recordingSha256
    )
      throw new AccountError(502, "invalid_recording_bytes");
    this.http.session.assert(owner);
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    return new Blob([bytes], { type: "audio/wav" });
  }
}
