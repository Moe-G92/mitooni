import { useEffect, useRef, useState } from "react";
import { Button } from "../../Button";
import { WavCapture } from "./capture";
import { readWav } from "./wav";
import type { WidgetLocale } from "./types";

type Phase = "idle" | "permission" | "recording" | "stopping";
const words = {
  en: {
    record: "Record",
    stop: "Stop",
    cancel: "Cancel",
    file: "Choose WAV recording",
    permission: "Allow microphone access to record.",
    stopping: "Preparing recording…",
    recording: "Recording",
    denied:
      "Microphone access was denied. Allow it in browser settings or choose a WAV recording.",
    error: "Recording failed. Try again or choose a WAV recording.",
    invalid:
      "Choose a PCM16 WAV recording between 0.25 and 180 seconds (up to 18 MB).",
    ready: "Recording ready.",
  },
  fa: {
    record: "ضبط",
    stop: "پایان ضبط",
    cancel: "لغو",
    file: "انتخاب فایل ضبط WAV",
    permission: "برای ضبط، دسترسی میکروفن را تأیید کنید.",
    stopping: "در حال آماده‌سازی ضبط…",
    recording: "در حال ضبط",
    denied:
      "دسترسی میکروفن رد شد. آن را در تنظیمات مرورگر فعال کنید یا فایل WAV انتخاب کنید.",
    error: "ضبط انجام نشد. دوباره تلاش کنید یا فایل WAV انتخاب کنید.",
    invalid:
      "فایل PCM16 WAV بین ۰٫۲۵ تا ۱۸۰ ثانیه و حداکثر ۱۸ مگابایت انتخاب کنید.",
    ready: "فایل ضبط آماده است.",
  },
};

/** A new ownerKey destroys in-flight captures. onReady only emits a validated WAV blob. */
export function SpeakingRecorder({
  ownerKey,
  disabled = false,
  locale = "fa",
  onReady,
  onBusy,
}: {
  ownerKey: string;
  disabled?: boolean;
  locale?: WidgetLocale;
  onReady: (blob: Blob) => void;
  onBusy?: (busy: boolean) => void;
}) {
  // Keyed ownership prevents a late permission result from reaching a different account/attempt.
  return (
    <Recorder
      key={ownerKey}
      disabled={disabled}
      locale={locale}
      onReady={onReady}
      onBusy={onBusy}
    />
  );
}
function Recorder({
  disabled,
  locale,
  onReady,
  onBusy,
}: {
  disabled: boolean;
  locale: WidgetLocale;
  onReady: (blob: Blob) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const w = words[locale];
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<"denied" | "error" | "invalid" | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const capture = useRef<WavCapture | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const started = useRef(0);
  const stopping = useRef(false);
  const callbacks = useRef({ onReady, onBusy });
  callbacks.current = { onReady, onBusy };
  const finishRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      capture.current?.cancel();
      capture.current = null;
      callbacks.current.onBusy?.(false);
    };
  }, []);
  useEffect(() => {
    callbacks.current.onBusy?.(phase !== "idle");
  }, [phase]);
  useEffect(() => {
    if (phase !== "recording") return;
    const timer = setInterval(
      () =>
        setElapsed(
          Math.min(180, Math.floor((Date.now() - started.current) / 1000)),
        ),
      500,
    );
    return () => clearInterval(timer);
  }, [phase]);
  function cancel() {
    generation.current++;
    capture.current?.cancel();
    capture.current = null;
    stopping.current = false;
    setPhase("idle");
  }
  async function finish() {
    const current = capture.current;
    if (!current || stopping.current) return;
    stopping.current = true;
    const turn = generation.current;
    setPhase("stopping");
    try {
      const wav = await current.stop();
      if (mounted.current && generation.current === turn) {
        capture.current = null;
        stopping.current = false;
        callbacks.current.onReady(wav.blob);
        setReady(true);
        setPhase("idle");
      }
    } catch {
      if (mounted.current && generation.current === turn) {
        capture.current = null;
        stopping.current = false;
        setError("error");
        setPhase("idle");
      }
    }
  }
  finishRef.current = finish;
  async function start() {
    if (disabled || phase !== "idle" || capture.current) return;
    const turn = ++generation.current;
    setError(null);
    setReady(false);
    setElapsed(0);
    setPhase("permission");
    const current = new WavCapture(
      () => void finishRef.current(),
      () => {
        if (mounted.current && generation.current === turn) {
          capture.current = null;
          setError("error");
          setPhase("idle");
        }
      },
    );
    capture.current = current;
    try {
      await current.start();
      if (mounted.current && generation.current === turn) {
        started.current = Date.now();
        setPhase("recording");
      }
    } catch (cause) {
      if (mounted.current && generation.current === turn) {
        current.cancel();
        capture.current = null;
        setError(
          cause instanceof DOMException && cause.name === "NotAllowedError"
            ? "denied"
            : "error",
        );
        setPhase("idle");
      }
    }
  }
  async function choose(file?: File) {
    if (!file || disabled || phase !== "idle") return;
    const turn = ++generation.current;
    setError(null);
    setReady(false);
    setPhase("stopping");
    try {
      const wav = await readWav(file);
      if (mounted.current && generation.current === turn) {
        callbacks.current.onReady(wav.blob);
        setReady(true);
      }
    } catch {
      if (mounted.current && generation.current === turn) setError("invalid");
    } finally {
      if (mounted.current && generation.current === turn) setPhase("idle");
    }
  }
  return (
    <div
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className="space-y-3"
    >
      {error && <p role="alert">{w[error]}</p>}
      <p role="status">
        {phase === "permission"
          ? w.permission
          : phase === "stopping"
            ? w.stopping
            : phase === "recording"
              ? w.recording
              : ready
                ? w.ready
                : ""}
      </p>
      {phase === "recording" && (
        <p className="tabular-nums" dir="ltr">
          {elapsed} / 180 s
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {phase === "idle" ? (
          <Button disabled={disabled} onClick={() => void start()}>
            {w.record}
          </Button>
        ) : (
          <>
            {phase === "recording" && (
              <Button onClick={() => void finish()}>{w.stop}</Button>
            )}
            <Button variant="outline" onClick={cancel}>
              {w.cancel}
            </Button>
          </>
        )}
      </div>
      <label className="grid gap-2 text-sm">
        {w.file}
        <input
          type="file"
          accept="audio/wav,.wav"
          disabled={disabled || phase !== "idle"}
          className="min-h-11 min-w-0 w-full rounded-[10px] border border-input bg-card p-2 file:me-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-secondary file:px-3"
          onChange={(event) => {
            void choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
