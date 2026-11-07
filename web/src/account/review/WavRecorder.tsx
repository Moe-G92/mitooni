import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionController } from "@/auth/session";
import { Button } from "../Button";
import { WavCapture } from "./capture";
import { readWav, type LocalWav } from "./wav";
import { useSpeakingWords } from "./speakingWords";
export function WavRecorder({
  session,
  disabled,
  onReady,
  onBusy,
}: {
  session: SessionController;
  disabled: boolean;
  onReady: (wav: LocalWav) => void;
  onBusy: (busy: boolean) => void;
}) {
  const w = useSpeakingWords();
  const [phase, setPhase] = useState<
      "idle" | "permission" | "recording" | "stopping"
    >("idle"),
    [error, setError] = useState<"capture" | "invalid" | null>(null),
    [elapsed, setElapsed] = useState(0);
  const capture = useRef<WavCapture | null>(null),
    mounted = useRef(true),
    generation = useRef(0),
    started = useRef(0);
  const cancel = useCallback(() => {
    generation.current++;
    capture.current?.cancel();
    capture.current = null;
    setPhase("idle");
  }, []);
  const finish = useCallback(async () => {
    const current = capture.current;
    if (!current) return;
    const turn = generation.current,
      owner = session.capture();
    setPhase("stopping");
    try {
      const wav = await current.stop();
      session.assert(owner);
      if (mounted.current && turn === generation.current) {
        capture.current = null;
        onReady(wav);
        setPhase("idle");
      }
    } catch {
      if (mounted.current && turn === generation.current) {
        capture.current = null;
        setError("capture");
        setPhase("idle");
      }
    }
  }, [session, onReady]);
  useEffect(() => {
    onBusy(phase !== "idle");
  }, [phase, onBusy]);
  useEffect(() => {
    mounted.current = true;
    const owner = session.capture();
    const unsubscribe = session.subscribe(() => {
      try {
        session.assert(owner);
      } catch {
        cancel();
      }
    });
    return () => {
      mounted.current = false;
      // Invalidate pending microphone permission; this ref is an ownership counter.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      unsubscribe();
      capture.current?.cancel();
      capture.current = null;
      onBusy(false);
    };
  }, [session, cancel, onBusy]);
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
  async function start() {
    if (disabled || phase !== "idle") return;
    const owner = session.capture(),
      turn = ++generation.current;
    setError(null);
    setPhase("permission");
    setElapsed(0);
    const current = new WavCapture(
      () => void finish(),
      () => {
        if (mounted.current && turn === generation.current) {
          setError("capture");
          setPhase("idle");
          capture.current = null;
        }
      },
    );
    capture.current = current;
    try {
      await current.start();
      session.assert(owner);
      if (mounted.current && turn === generation.current) {
        started.current = Date.now();
        setPhase("recording");
      }
    } catch {
      if (mounted.current && turn === generation.current) {
        current.cancel();
        capture.current = null;
        setPhase("idle");
        setError("capture");
      }
    }
  }
  async function choose(file: File | undefined) {
    if (!file || disabled || phase !== "idle") return;
    const owner = session.capture(),
      turn = ++generation.current;
    setError(null);
    setPhase("stopping");
    try {
      const wav = await readWav(file);
      session.assert(owner);
      if (mounted.current && turn === generation.current) onReady(wav);
    } catch {
      if (mounted.current && turn === generation.current) setError("invalid");
    } finally {
      if (mounted.current && turn === generation.current) setPhase("idle");
    }
  }
  return (
    <div className="space-y-3">
      {error && (
        <p role="alert">{error === "invalid" ? w.invalid : w.captureError}</p>
      )}
      <div role="status">
        {phase === "permission"
          ? w.permission
          : phase === "stopping"
            ? w.stopping
            : phase === "recording"
              ? `${w.recording} · ${elapsed} / 180 s`
              : ""}
      </div>
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
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
