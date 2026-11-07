import { webcrypto } from "node:crypto";
import { File as NodeFile } from "node:buffer";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SessionController } from "@/auth/session";
import { setPrefs } from "@/lib/prefs";
import { GuardedTransport } from "../request";
import { SpeakingClient, speakingBinding } from "./speakingClient";
import { Candidate, Recording, type RecordingData } from "./speakingContracts";
import { SpeakingPanel } from "./SpeakingPanel";
import { encodeWav } from "./wav";
import { sha256 } from "./media";
import type { SnapshotData } from "./contracts";
const hash = "a".repeat(64),
  targetHash = "b".repeat(64);
const s = {
  packageHash: hash,
  targetHash,
  target: { id: "synthetic-speaking", skill: "speaking" },
  task: {
    assets: [],
    instructions: "",
    speaking: { permissionGranted: true, available: true },
    sections: [
      {
        id: "part-1",
        title: "A familiar place",
        text: "Describe a place",
        instructions: "",
        minimumWords: null,
        table: null,
        questions: [],
      },
    ],
  },
} as unknown as SnapshotData;
const criteria = [
  "fluency-coherence",
  "lexical-resource",
  "grammatical-range-accuracy",
  "pronunciation",
] as const;
const candidate = () => ({
  kind: "qualitative_speaking_feedback" as const,
  criteria: criteria.map((criterionId) => ({
    criterionId,
    status: "insufficient_evidence" as const,
    observation: "Synthetic evidence is insufficient",
    revisionAction: "Record a longer response",
    evidence: [],
    limitation: "No real speech evaluation",
  })),
  limitations: ["Synthetic controlled fixture only"],
  timestampStatus: "model_estimated_unverified" as const,
  assessmentScope: "recorded_rehearsal" as const,
});
async function recording(): Promise<RecordingData> {
  const wav = encodeWav([new Float32Array(2000)], 8000);
  return {
    recordingId: "11111111-1111-4111-8111-111111111111",
    jobId: "22222222-2222-4222-8222-222222222222",
    taskId: "part-1",
    packageHash: hash,
    targetHash,
    status: "queued",
    revision: 1,
    recordingSha256: await sha256(new Uint8Array(await wav.blob.arrayBuffer())),
    durationSeconds: 0.25,
    sizeBytes: wav.blob.size,
    error: null,
    result: null,
    conditions: {
      kind: "recorded_rehearsal",
      locallyRevealed: false,
      externalExposure: "unknown",
    },
    createdAt: "2026-11-06T12:00:00Z",
    limitations: ["Controlled synthetic fixture"],
  };
}
async function auth() {
  let who = "a";
  const session = new SessionController({
    initialize: async () => null,
    subscribe: () => () => {},
    signIn: async (email) => ({ subject: (who = email), token: email }),
    refresh: async () => ({ subject: who, token: who }),
    signOut: async () => {},
  });
  await session.start();
  await session.signIn("a", "");
  return session;
}
function collection(records: RecordingData[], available = true) {
  return { packageHash: hash, targetHash, recordings: records, available };
}
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  setPrefs({ locale: "en" });
  const OriginalURL = URL;
  vi.stubGlobal(
    "URL",
    class extends OriginalURL {
      static createObjectURL = vi.fn(() => "blob:synthetic-wav");
      static revokeObjectURL = vi.fn();
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("requires exactly four qualitative criteria, bound audio evidence and no scores", async () => {
  expect(Candidate.safeParse(candidate()).success).toBe(true);
  expect(Candidate.safeParse({ ...candidate(), band: 7 }).success).toBe(false);
  const r = await recording();
  r.status = "completed";
  r.result = candidate();
  expect(Recording.safeParse(r).success).toBe(true);
  r.result.criteria[0] = {
    ...r.result.criteria[0],
    status: "observed",
    evidence: [
      {
        recordingSha256: "c".repeat(64),
        startSeconds: 0,
        endSeconds: 0.2,
        observation: "Wrong audio",
      },
    ],
  };
  expect(Recording.safeParse(r).success).toBe(false);
  r.result.criteria[0].evidence[0].recordingSha256 = r.recordingSha256;
  r.result.criteria[0].evidence[0].endSeconds = 0.5;
  expect(Recording.safeParse(r).success).toBe(false);
});
it("freezes actual WAV bytes, hashes, task, owner and idempotency key on exact retry", async () => {
  const session = await auth(),
    calls: RequestInit[] = [];
  let first = true;
  const r = await recording();
  const http = new GuardedTransport(session, "", async (_url, options) => {
    calls.push(options!);
    if (first) {
      first = false;
      throw Error("lost ACK");
    }
    return Response.json(r);
  });
  const client = new SpeakingClient(http),
    op = await client.prepare(
      s,
      "part-1",
      encodeWav([new Float32Array(2000)], 8000),
    );
  await expect(client.upload(op)).rejects.toThrow("lost ACK");
  await client.upload(op);
  expect(calls[0].body).toBe(calls[1].body);
  expect(new Uint8Array(await (calls[0].body as Blob).arrayBuffer())).toEqual(
    new Uint8Array(await op.blob.arrayBuffer()),
  );
  const headers = new Headers(calls[1].headers);
  expect(headers.get("X-Package-Hash")).toBe(hash);
  expect(headers.get("X-Target-Hash")).toBe(targetHash);
  expect(headers.get("X-Speaking-Task-Id")).toBe("part-1");
  expect(headers.get("X-Recording-Sha256")).toBe(op.sha256);
  expect(headers.get("Idempotency-Key")).toBe(
    new Headers(calls[0].headers).get("Idempotency-Key"),
  );
  await session.signIn("b", "");
  await expect(client.upload(op)).rejects.toThrow("account_changed");
  expect(calls).toHaveLength(2);
});
it("list and private playback send version hashes and verify exact recorded bytes", async () => {
  const session = await auth(),
    r = await recording(),
    wav = encodeWav([new Float32Array(2000)], 8000);
  const calls: RequestInit[] = [];
  const client = new SpeakingClient(
    new GuardedTransport(session, "", async (url, options) => {
      calls.push(options!);
      return String(url).endsWith("/audio")
        ? new Response(await wav.blob.arrayBuffer(), {
            headers: { "Content-Type": "audio/wav" },
          })
        : Response.json(collection([r]));
    }),
  );
  await client.list(speakingBinding(s));
  const audio = await client.audio(
    speakingBinding(s),
    r,
    new AbortController().signal,
  );
  expect(audio.size).toBe(wav.blob.size);
  expect(
    calls.every(
      (c) => new Headers(c.headers).get("X-Target-Hash") === targetHash,
    ),
  ).toBe(true);
  const wrong = { ...r, recordingSha256: "c".repeat(64) };
  await expect(
    client.audio(speakingBinding(s), wrong, new AbortController().signal),
  ).rejects.toThrow("invalid_recording_bytes");
});
it("UI supports local WAV preview, exact lost-ACK retry, and recovered qualitative result", async () => {
  const session = await auth(),
    r = await recording(),
    posts: RequestInit[] = [];
  let accepted = false,
    completed = false;
  const http = new GuardedTransport(session, "", async (_url, options) => {
    if (options?.method === "POST") {
      posts.push(options);
      if (posts.length === 1) throw Error("connection lost");
      accepted = true;
      return Response.json(r);
    }
    return Response.json(
      collection(
        accepted
          ? [completed ? { ...r, status: "completed", result: candidate() } : r]
          : [],
      ),
    );
  });
  render(
    <SpeakingPanel
      snapshot={s}
      http={http}
      disabled={false}
      deny={() => {}}
      onBusy={() => {}}
    />,
  );
  await screen.findByText("No submitted recordings");
  const wav = encodeWav([new Float32Array(2000)], 8000);
  const file = new NodeFile([await wav.blob.arrayBuffer()], "synthetic.wav", {
    type: "audio/wav",
  });
  fireEvent.change(screen.getByLabelText("Choose PCM WAV file"), {
    target: { files: [file] },
  });
  await screen.findByText("Local recording preview");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Submit recording" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Submit recording" }));
  await screen.findByText(/Submission result is unknown/);
  expect(screen.getByLabelText("Choose PCM WAV file")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Recording submitted");
  expect(posts[0].body).toBe(posts[1].body);
  expect(new Headers(posts[0].headers).get("Idempotency-Key")).toBe(
    new Headers(posts[1].headers).get("Idempotency-Key"),
  );
  completed = true;
  fireEvent.click(screen.getByRole("button", { name: "Check recordings" }));
  await screen.findByText("Qualitative speaking feedback");
  expect(screen.getAllByText("Insufficient audio evidence")).toHaveLength(4);
  expect(
    screen.getByText(
      "Audio timestamps are model estimates and have not been verified",
    ),
  ).toBeVisible();
});
it("unconfigured provider permits local preview but no accepted upload or phantom queue", async () => {
  const session = await auth();
  let posts = 0;
  const http = new GuardedTransport(session, "", async (_url, options) => {
    if (options?.method === "POST") posts++;
    return Response.json(collection([], false));
  });
  render(
    <SpeakingPanel
      snapshot={{
        ...s,
        task: {
          ...s.task,
          speaking: { permissionGranted: true, available: false },
        },
      }}
      http={http}
      disabled={false}
      deny={() => {}}
      onBusy={() => {}}
    />,
  );
  await screen.findByText("No submitted recordings");
  const wav = encodeWav([new Float32Array(2000)], 8000);
  fireEvent.change(screen.getByLabelText("Choose PCM WAV file"), {
    target: {
      files: [new NodeFile([await wav.blob.arrayBuffer()], "synthetic.wav")],
    },
  });
  await screen.findByText("Local recording preview");
  expect(
    screen.getByRole("button", { name: "Submit recording" }),
  ).toBeDisabled();
  expect(posts).toBe(0);
});
