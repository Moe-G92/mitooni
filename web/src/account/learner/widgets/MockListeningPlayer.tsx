import { useEffect, useRef, useState } from "react";
import { Button } from "../../Button";
import type { WidgetLocale } from "./types";

export type MockListeningAsset = {
  id: string;
  durationSeconds: number;
  blob: Blob;
};
/** One-pass presentation; the server owns the start marker and section deadline. */
export function MockListeningPlayer({
  assets,
  startedAt,
  serverNow,
  onStart,
  starting,
  locale = "fa",
}: {
  assets: readonly MockListeningAsset[];
  startedAt: string | null;
  serverNow: string;
  onStart: () => void;
  starting: boolean;
  locale?: WidgetLocale;
}) {
  const fa = locale === "fa";
  const audio = useRef<HTMLAudioElement>(null);
  const resources = useRef<{ id: string; blob: Blob; url: string }[]>([]);
  const [ready, setReady] = useState(false);
  const [mediaRevision, setMediaRevision] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [requested, setRequested] = useState(false);
  const hadStarting = useRef(false);
  const selected = useRef(-1);
  const generation = useRef(0);
  const anchor = useRef({
    marker: "",
    server: "",
    base: 0,
    at: performance.now(),
  });
  const acceptedMarker = useRef<string | null>(null);
  if (startedAt) acceptedMarker.current = startedAt;
  const marker = acceptedMarker.current;
  const now = performance.now();
  if (
    marker &&
    (anchor.current.marker !== marker || anchor.current.server !== serverNow)
  ) {
    const supplied = (Date.parse(serverNow) - Date.parse(marker)) / 1000;
    const previous =
      anchor.current.marker === marker
        ? anchor.current.base + Math.max(0, now - anchor.current.at) / 1000
        : 0;
    anchor.current = {
      marker,
      server: serverNow,
      base: Math.max(previous, Number.isFinite(supplied) ? supplied : 0),
      at: now,
    };
  }
  const elapsed = () =>
    marker
      ? anchor.current.base +
        Math.max(0, performance.now() - anchor.current.at) / 1000
      : 0;
  const valid =
    assets.length === 4 &&
    assets.every(
      (asset) =>
        Number.isFinite(asset.durationSeconds) &&
        asset.durationSeconds > 0 &&
        asset.blob.size > 0 &&
        /^audio\/(mpeg|mp4|ogg|wav|x-wav|webm)$/.test(asset.blob.type),
    );
  const total = valid
    ? assets.reduce((sum, asset) => sum + asset.durationSeconds, 0)
    : 0;
  const position = () => {
    let offset = elapsed();
    for (let index = 0; index < assets.length; index++) {
      if (offset < assets[index].durationSeconds) return { index, offset };
      offset -= assets[index].durationSeconds;
    }
    return null;
  };
  const playRef = useRef<() => void>(() => {});
  const syncRef = useRef<() => void>(() => {});
  playRef.current = () => {
    const element = audio.current,
      current = position();
    if (!marker || !ready || !valid || !element || !current) return;
    if (selected.current !== current.index) {
      syncRef.current();
      return;
    }
    const turn = ++generation.current;
    try {
      element.currentTime = current.offset;
      void element
        .play()
        .then(() => {
          if (turn === generation.current) setBlocked(false);
        })
        .catch(() => {
          if (turn === generation.current) setBlocked(true);
        });
    } catch {
      setBlocked(true);
    }
  };
  syncRef.current = () => {
    const element = audio.current,
      current = position();
    if (!element || !marker || !ready || !valid) return;
    if (!current) {
      if (selected.current !== -1) {
        selected.current = -1;
        element.pause();
        setBlocked(false);
      }
      return;
    }
    if (selected.current !== current.index) {
      generation.current++;
      selected.current = current.index;
      element.src = resources.current[current.index].url;
      element.load();
      if (element.readyState >= 1) playRef.current();
    }
  };
  useEffect(() => {
    const previous = resources.current;
    if (
      previous.length === assets.length &&
      previous.every(
        (entry, i) =>
          entry.id === assets[i].id && entry.blob === assets[i].blob,
      )
    )
      return;
    generation.current++;
    selected.current = -1;
    resources.current = assets.map((asset) => ({
      id: asset.id,
      blob: asset.blob,
      url: URL.createObjectURL(asset.blob),
    }));
    previous.forEach((entry) => URL.revokeObjectURL(entry.url));
    setReady(true);
    setMediaRevision((value) => value + 1);
  }, [assets]);
  useEffect(() => {
    const element = audio.current;
    return () => {
      // This ref is a playback ownership counter, not a retained DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      element?.pause();
      element?.removeAttribute("src");
      resources.current.forEach((entry) => URL.revokeObjectURL(entry.url));
      resources.current = [];
    };
  }, []);
  useEffect(() => {
    if (starting) hadStarting.current = true;
    else if (hadStarting.current) {
      hadStarting.current = false;
      setRequested(false);
    }
  }, [starting]);
  useEffect(() => {
    syncRef.current();
    if (!marker) return;
    const tick = () => {
      setSeconds(elapsed());
      syncRef.current();
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
    // The monotonic anchor and callbacks always read the latest server snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker, ready, serverNow, total, mediaRevision]);
  const ended = !!marker && valid && seconds >= total;
  return (
    <div lang={locale} dir={fa ? "rtl" : "ltr"} className="space-y-3">
      <audio
        ref={audio}
        hidden
        preload="auto"
        onLoadedMetadata={() => playRef.current()}
        onEnded={() => syncRef.current()}
        onError={() => setBlocked(true)}
        onPause={() => {
          if (marker && position()) setBlocked(true);
        }}
      />
      <p role="status">
        {!valid
          ? fa
            ? "چهار بخش صوتی هنوز آماده نیست."
            : "The four audio sections are not ready."
          : ended
            ? fa
              ? "پخش پایان یافت."
              : "Audio has finished."
            : blocked
              ? fa
                ? "برای ادامه، پخش صدا را فعال کنید. زمان آزمون ادامه دارد."
                : "Resume audio to continue. Test time keeps running."
              : marker
                ? fa
                  ? "در حال پخش"
                  : "Playing"
                : starting || requested
                  ? fa
                    ? "در حال شروع…"
                    : "Starting…"
                  : fa
                    ? "صدا آماده است."
                    : "Audio is ready."}
      </p>
      {marker && (
        <p aria-hidden="true" dir="ltr" className="tabular-nums">
          {Math.floor(Math.min(seconds, total))} / {Math.ceil(total)} s
        </p>
      )}
      {!marker ? (
        <Button
          disabled={!valid || !ready || starting || requested}
          onClick={() => {
            setRequested(true);
            onStart();
          }}
        >
          {fa ? "شروع پخش" : "Start audio"}
        </Button>
      ) : blocked && !ended ? (
        <Button
          onClick={() => {
            if (audio.current?.error) {
              selected.current = -1;
              syncRef.current();
            } else playRef.current();
          }}
        >
          {fa ? "ادامه پخش" : "Resume audio"}
        </Button>
      ) : null}
      <label className="flex min-h-11 items-center gap-3">
        {fa ? "بلندی صدا" : "Volume"}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          defaultValue="1"
          className="min-h-11 min-w-0 flex-1 accent-primary"
          onChange={(event) => {
            if (audio.current)
              audio.current.volume = Number(event.target.value);
          }}
        />
      </label>
    </div>
  );
}
