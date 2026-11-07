import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SessionController } from "@/auth/session";
import { AccountError, type GuardedTransport } from "../request";
import { Button } from "../Button";
import type { SnapshotData } from "./contracts";
import {
  SpeakingClient,
  type SpeakingBinding,
  type Upload,
} from "./speakingClient";
import type { RecordingData } from "./speakingContracts";
import { useSpeakingWords } from "./speakingWords";
import { WavRecorder } from "./WavRecorder";
import type { LocalWav } from "./wav";
function OwnedAudio({
  blob,
  session,
  label,
  span,
}: {
  blob: Blob;
  session: SessionController;
  label: string;
  span?: { start: number; end: number } | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const owner = session.capture();
    const next = URL.createObjectURL(blob);
    setUrl(next);
    const unsubscribe = session.subscribe(() => {
      try {
        session.assert(owner);
      } catch {
        audio.current?.pause();
        URL.revokeObjectURL(next);
        setUrl(null);
      }
    });
    return () => {
      unsubscribe();
      URL.revokeObjectURL(next);
    };
  }, [blob, session]);
  const seek = useCallback(() => {
    if (span && audio.current) {
      audio.current.currentTime = span.start;
      void audio.current.play().catch(() => {});
    }
  }, [span]);
  useEffect(() => {
    if (audio.current?.readyState) seek();
  }, [seek, url]);
  return url ? (
    <audio
      ref={audio}
      src={url}
      aria-label={label}
      controls
      preload="metadata"
      className="w-full max-w-full"
      onLoadedMetadata={seek}
      onTimeUpdate={() => {
        if (span && audio.current && audio.current.currentTime >= span.end)
          audio.current.pause();
      }}
    />
  ) : null;
}
function RecordingView({
  recording,
  title,
  client,
  binding,
  deny,
}: {
  recording: RecordingData;
  title: string;
  client: SpeakingClient;
  binding: SpeakingBinding;
  deny: () => void;
}) {
  const w = useSpeakingWords();
  const [blob, setBlob] = useState<Blob | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [span, setSpan] = useState<{ start: number; end: number } | null>(null);
  const abort = useRef<AbortController | null>(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const owner = client.http.session.capture();
    const unsubscribe = client.http.session.subscribe(() => {
      try {
        client.http.session.assert(owner);
      } catch {
        abort.current?.abort();
        setBlob(null);
      }
    });
    return () => {
      mounted.current = false;
      unsubscribe();
      abort.current?.abort();
    };
  }, [client]);
  async function load(evidence?: { start: number; end: number }) {
    if (blob) {
      setSpan(evidence ?? null);
      return;
    }
    if (busy) return;
    const owner = client.http.session.capture();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError(false);
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const audio = await client.audio(binding, recording, controller.signal);
      client.http.session.assert(owner);
      if (mounted.current && !controller.signal.aborted) {
        setBlob(audio);
        setSpan(evidence ?? null);
      }
    } catch (e) {
      try {
        client.http.session.assert(owner);
        if (mounted.current) {
          if (e instanceof AccountError && e.status === 403) {
            setBlob(null);
            deny();
          } else setError(true);
        }
      } catch {
        /* Former owner. */
      }
    } finally {
      clearTimeout(timer);
      try {
        client.http.session.assert(owner);
        if (mounted.current) setBusy(false);
      } catch {
        /* Former owner. */
      }
    }
  }
  const status =
    recording.status === "failed" ? w.failedJob : w[recording.status];
  return (
    <article className="min-w-0 border-t border-border py-5">
      <h4 className="font-semibold" dir="auto">
        {title}
      </h4>
      <p role="status" className="my-2">
        {status} ·{" "}
        <bdi dir="ltr">{Math.round(recording.durationSeconds * 10) / 10} s</bdi>
      </p>
      <p className="mb-3 text-sm text-muted-foreground">
        {w.scope} ·{" "}
        <time dir="ltr" dateTime={recording.createdAt}>
          {recording.createdAt.replace("T", " ").replace(/\.\d+/, "")}
        </time>
      </p>
      {!blob && (
        <Button variant="outline" disabled={busy} onClick={() => void load()}>
          {busy ? w.uploading : w.play}
        </Button>
      )}
      {error && <p role="alert">{w.failed}</p>}
      {blob && (
        <OwnedAudio
          blob={blob}
          session={client.http.session}
          label={`${w.play} ${recording.taskId}`}
          span={span}
        />
      )}
      {recording.limitations.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 ps-5 text-sm">
          {recording.limitations.map((limit, i) => (
            <li key={i} dir="auto">
              {limit}
            </li>
          ))}
        </ul>
      )}
      {recording.result && (
        <section className="mt-5">
          <h5 className="font-semibold">{w.feedback}</h5>
          <p className="my-3 text-sm">{w.timestamps}</p>
          <div className="grid gap-x-6 md:grid-cols-2">
            {recording.result.criteria.map((criterion) => (
              <section key={criterion.criterionId} className="my-5">
                <h6 className="font-semibold">
                  {w.criteria[criterion.criterionId]}
                </h6>
                {criterion.status === "insufficient_evidence" && (
                  <p>{w.insufficient}</p>
                )}
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="font-medium">{w.observation}</dt>
                    <dd dir="auto" className="whitespace-pre-wrap break-words">
                      {criterion.observation}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">{w.revision}</dt>
                    <dd dir="auto" className="whitespace-pre-wrap break-words">
                      {criterion.revisionAction}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">{w.limitation}</dt>
                    <dd dir="auto" className="whitespace-pre-wrap break-words">
                      {criterion.limitation}
                    </dd>
                  </div>
                </dl>
                {criterion.evidence.map((e, i) => (
                  <div key={i} className="mt-3">
                    <p dir="auto">{e.observation}</p>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void load({ start: e.startSeconds, end: e.endSeconds })
                      }
                    >
                      {w.evidence} · {e.startSeconds}–{e.endSeconds} s
                    </Button>
                  </div>
                ))}
              </section>
            ))}
          </div>
          <ul className="list-disc space-y-2 ps-5">
            {recording.result.limitations.map((limit, i) => (
              <li key={i} dir="auto">
                {limit}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
export function SpeakingPanel({
  snapshot,
  http,
  disabled,
  deny,
  onBusy,
  resultsContainer,
}: {
  snapshot: SnapshotData;
  http: GuardedTransport;
  disabled: boolean;
  deny: () => void;
  onBusy: (busy: boolean) => void;
  resultsContainer?: HTMLElement | null;
}) {
  const w = useSpeakingWords();
  const client = useMemo(() => new SpeakingClient(http), [http]);
  const { packageHash, targetHash } = snapshot;
  const targetId = snapshot.target.id;
  const binding = useMemo(
    () => ({ packageHash, targetHash, targetId }),
    [packageHash, targetHash, targetId],
  );
  const [taskId, setTaskId] = useState(snapshot.task.sections[0]?.id ?? ""),
    [local, setLocal] = useState<LocalWav | null>(null),
    [records, setRecords] = useState<RecordingData[]>([]),
    [available, setAvailable] = useState(
      snapshot.task.speaking?.available === true,
    ),
    [refresh, setRefresh] = useState(0),
    [loading, setLoading] = useState(true),
    [capturing, setCapturing] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState<
      "load" | "uncertain" | "unavailable" | "limit" | "stale" | null
    >(null),
    [submitted, setSubmitted] = useState(false);
  const pending = useRef<Upload | null>(null),
    abortUpload = useRef<AbortController | null>(null),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const owner = http.session.capture();
    const unsubscribe = http.session.subscribe(() => {
      try {
        http.session.assert(owner);
      } catch {
        abortUpload.current?.abort();
        pending.current = null;
        setLocal(null);
        setRecords([]);
      }
    });
    return () => {
      mounted.current = false;
      unsubscribe();
      abortUpload.current?.abort();
      pending.current = null;
      onBusy(false);
    };
  }, [http, onBusy]);
  useEffect(() => {
    onBusy(capturing || uploading || error === "uncertain");
  }, [capturing, uploading, error, onBusy]);
  useEffect(() => {
    const abort = new AbortController();
    let disposed = false;
    const owner = http.session.capture();
    setLoading(true);
    void client
      .list(binding, abort.signal)
      .then((data) => {
        http.session.assert(owner);
        if (!abort.signal.aborted) {
          setRecords(data.recordings);
          setAvailable(data.available);
          setError((e) =>
            e === "load" || (e === "unavailable" && data.available) ? null : e,
          );
        }
      })
      .catch((e) => {
        try {
          http.session.assert(owner);
          if (!disposed) {
            if (e instanceof AccountError && e.status === 403) {
              setRecords([]);
              setLocal(null);
              pending.current = null;
              deny();
            } else
              setError(
                e instanceof AccountError && e.status === 409
                  ? "stale"
                  : "load",
              );
          }
        } catch {
          /* Former owner. */
        }
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    const timeout = setTimeout(() => abort.abort(), 15000);
    return () => {
      disposed = true;
      clearTimeout(timeout);
      abort.abort();
    };
  }, [client, http, binding, refresh, deny]);
  useEffect(() => {
    if (
      !records.some((r) => r.status === "queued" || r.status === "running") ||
      error === "load" ||
      error === "stale"
    )
      return;
    const timer = setTimeout(() => setRefresh((v) => v + 1), 2000);
    return () => clearTimeout(timer);
  }, [records, error]);
  const ready = useCallback((wav: LocalWav) => {
    setLocal(wav);
    setSubmitted(false);
  }, []);
  async function upload() {
    if (uploading || disabled || (!pending.current && (!local || !available)))
      return;
    const owner = http.session.capture();
    const abort = new AbortController();
    abortUpload.current = abort;
    const timer = setTimeout(() => abort.abort(), 90000);
    setUploading(true);
    setError(null);
    setSubmitted(false);
    try {
      if (!pending.current)
        pending.current = await client.prepare(snapshot, taskId, local!);
      http.session.assert(owner);
      if (!mounted.current) return;
      if (abort.signal.aborted) throw new DOMException("Aborted", "AbortError");
      const item = await client.upload(pending.current, abort.signal);
      http.session.assert(owner);
      if (mounted.current) {
        pending.current = null;
        setRecords((previous) => [
          item,
          ...previous.filter((r) => r.recordingId !== item.recordingId),
        ]);
        setLocal(null);
        setSubmitted(true);
      }
    } catch (e) {
      try {
        http.session.assert(owner);
        if (mounted.current) {
          if (e instanceof AccountError && e.status === 403) {
            setLocal(null);
            setRecords([]);
            pending.current = null;
            deny();
          } else if (
            e instanceof AccountError &&
            e.status === 503 &&
            e.code === "speaking_unavailable"
          ) {
            pending.current = null;
            setAvailable(false);
            setError("unavailable");
          } else if (
            e instanceof AccountError &&
            e.status >= 400 &&
            e.status < 500
          ) {
            pending.current = null;
            setError(
              e.status === 429 ? "limit" : e.status === 409 ? "stale" : "load",
            );
          } else setError("uncertain");
        }
      } catch {
        /* Former owner. */
      }
    } finally {
      clearTimeout(timer);
      try {
        http.session.assert(owner);
        if (mounted.current) setUploading(false);
      } catch {
        /* Former owner. */
      }
    }
  }
  const ResultsHeading = resultsContainer === undefined ? "h4" : "h3";
  const results = (
    <section className="min-w-0 rounded-card border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ResultsHeading className="text-lg font-semibold">
          {w.saved}
        </ResultsHeading>
        <Button
          variant="outline"
          disabled={uploading || capturing}
          onClick={() => setRefresh((v) => v + 1)}
        >
          {w.refresh}
        </Button>
      </div>
      {submitted && <p role="status">{w.submitted}</p>}
      {loading && <p role="status">{w.refresh}</p>}
      {!loading && !records.length && <p className="my-3">{w.noRecordings}</p>}
      {records.map((record) => (
        <RecordingView
          key={record.recordingId}
          recording={record}
          title={
            snapshot.task.sections.find(
              (section) => section.id === record.taskId,
            )?.title ?? record.taskId
          }
          client={client}
          binding={binding}
          deny={deny}
        />
      ))}
    </section>
  );
  const locked =
    disabled ||
    capturing ||
    uploading ||
    error === "uncertain" ||
    error === "stale";
  return (
    <>
      <section className="mb-6 min-w-0 rounded-card border border-border bg-card p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold">{w.title}</h3>
        {!available && <p className="mb-4">{w.unavailable}</p>}
        <label className="mb-4 grid gap-2">
          {w.task}
          <select
            className="min-h-11 min-w-0 rounded-[10px] border border-input bg-card px-3"
            disabled={locked || Boolean(local)}
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
          >
            {snapshot.task.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <WavRecorder
          session={http.session}
          disabled={locked || Boolean(local)}
          onReady={ready}
          onBusy={setCapturing}
        />
        {local && (
          <div className="my-5 space-y-3">
            <h4 className="font-semibold">{w.preview}</h4>
            <OwnedAudio
              blob={local.blob}
              session={http.session}
              label={w.preview}
            />
            <p className="text-sm tabular-nums">
              {Math.round(local.durationSeconds * 10) / 10} s ·{" "}
              {local.sampleRate} Hz
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={locked || !available || loading}
                onClick={() => void upload()}
              >
                {uploading ? w.uploading : w.upload}
              </Button>
              <Button
                variant="outline"
                disabled={locked}
                onClick={() => {
                  setLocal(null);
                  setSubmitted(false);
                }}
              >
                {w.discard}
              </Button>
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="my-4">
            <p>
              {error === "uncertain"
                ? w.uncertain
                : error === "unavailable"
                  ? w.unavailable
                  : error === "limit"
                    ? w.limit
                    : error === "stale"
                      ? w.stale
                      : w.failed}
            </p>
            {error === "uncertain" && (
              <Button disabled={uploading} onClick={() => void upload()}>
                {w.retry}
              </Button>
            )}
          </div>
        )}
      </section>
      {resultsContainer === undefined
        ? results
        : resultsContainer
          ? createPortal(results, resultsContainer)
          : null}
    </>
  );
}
