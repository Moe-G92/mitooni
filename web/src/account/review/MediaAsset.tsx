import { useEffect, useMemo, useState } from "react";
import type { GuardedTransport } from "../request";
import { AccountError } from "../request";
import { Button } from "../Button";
import type { AssetData, SnapshotData } from "./contracts";
import { fetchAsset } from "./media";
import { useReviewWords } from "./words";
export function MediaAsset({
  http,
  snapshot,
  asset,
  deny,
}: {
  http: GuardedTransport;
  snapshot: SnapshotData;
  asset: AssetData;
  deny: () => void;
}) {
  const { w } = useReviewWords();
  const [state, setState] = useState<{ url: string | null; error: boolean }>({
    url: null,
    error: false,
  });
  const [retry, setRetry] = useState(0);
  const { packageHash, targetHash } = snapshot;
  const targetId = snapshot.target.id;
  const { id, mediaType, sha256, url: assetUrl } = asset;
  const binding = useMemo(
    () => ({ packageHash, targetHash, targetId }),
    [packageHash, targetHash, targetId],
  );
  const descriptor = useMemo(
    () => ({ id, mediaType, sha256, url: assetUrl }),
    [id, mediaType, sha256, assetUrl],
  );
  useEffect(() => {
    const owner = http.session.capture();
    const abort = new AbortController();
    let url: string | null = null;
    let disposed = false;
    const dispose = () => {
      disposed = true;
      abort.abort();
      if (url) {
        URL.revokeObjectURL(url);
        url = null;
      }
    };
    const unsubscribe = http.session.subscribe(() => {
      try {
        http.session.assert(owner);
      } catch {
        dispose();
        setState({ url: null, error: false });
      }
    });
    const timer = setTimeout(() => abort.abort(), 60000);
    setState({ url: null, error: false });
    void fetchAsset(http, binding, descriptor, abort.signal)
      .then((blob) => {
        http.session.assert(owner);
        if (!abort.signal.aborted) {
          url = URL.createObjectURL(blob);
          setState({ url, error: false });
        }
      })
      .catch((error) => {
        try {
          http.session.assert(owner);
          if (disposed) return;
          if (error instanceof AccountError && error.status === 403) {
            dispose();
            deny();
          } else if (!abort.signal.aborted)
            setState({ url: null, error: true });
          else if (url === null) setState({ url: null, error: true });
        } catch {
          /* Former owner discarded. */
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      unsubscribe();
      dispose();
    };
  }, [http, binding, descriptor, retry, deny]);
  return (
    <figure className="my-5 min-w-0">
      {state.error ? (
        <div role="alert">
          <p>{w.mediaFailed}</p>
          <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
            {w.retry}
          </Button>
        </div>
      ) : !state.url ? (
        <p role="status">{w.mediaLoading}</p>
      ) : asset.mediaType === "image/png" ? (
        <img
          src={state.url}
          alt={asset.alt}
          width={asset.width ?? undefined}
          height={asset.height ?? undefined}
          onError={() => {
            if (state.url) URL.revokeObjectURL(state.url);
            setState({ url: null, error: true });
          }}
          className="h-auto max-w-full"
        />
      ) : (
        <audio
          src={state.url}
          aria-label={`${asset.alt || w.audio} ${asset.id}`}
          onError={() => {
            if (state.url) URL.revokeObjectURL(state.url);
            setState({ url: null, error: true });
          }}
          controls
          preload="metadata"
          className="w-full max-w-full"
        />
      )}
    </figure>
  );
}
