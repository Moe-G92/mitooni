import { useEffect, useRef, useState } from "react";
import { Button } from "../../Button";
import type { MediaState, StimulusBlock, WidgetLocale } from "./types";

/** The parent supplies authenticated, validated blobs; this component never fetches. */
export function PrivateMedia({
  blob,
  kind,
  alt,
  ownerKey,
  locale = "fa",
  loading,
  error,
  onRetry,
}: MediaState & {
  kind: "audio" | "image";
  alt: string;
  ownerKey: string;
  locale?: WidgetLocale;
  onRetry?: () => void;
}) {
  const [resource, setResource] = useState<{
    blob: Blob;
    ownerKey: string;
    url: string;
  } | null>(null);
  const [failed, setFailed] = useState<Blob | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const fa = locale === "fa";
  useEffect(() => {
    if (!blob) return;
    const allowed =
      kind === "image"
        ? /^image\/(png|jpeg|webp)$/
        : /^audio\/(wav|x-wav|mpeg|mp4|ogg|webm)$/;
    if (!allowed.test(blob.type)) return;
    const url = URL.createObjectURL(blob);
    setResource({ blob, ownerKey, url });
    const element = audio.current;
    return () => {
      element?.pause();
      element?.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [blob, ownerKey, kind]);
  const current =
    resource && resource.blob === blob && resource.ownerKey === ownerKey
      ? resource
      : null;
  const invalid =
    !!blob &&
    !(
      kind === "image"
        ? /^image\/(png|jpeg|webp)$/
        : /^audio\/(wav|x-wav|mpeg|mp4|ogg|webm)$/
    ).test(blob.type);
  return (
    <figure className="my-5 min-w-0" lang={locale} dir={fa ? "rtl" : "ltr"}>
      {error || invalid || (blob && failed === blob) ? (
        <div role="alert" className="space-y-2">
          <p>
            {fa
              ? "رسانه پخش نشد. دوباره تلاش کنید."
              : "Media could not be loaded. Try again."}
          </p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              {fa ? "تلاش دوباره" : "Try again"}
            </Button>
          )}
        </div>
      ) : !current ? (
        <p role="status">
          {loading
            ? fa
              ? "در حال دریافت رسانه…"
              : "Loading media…"
            : fa
              ? "رسانه در دسترس نیست."
              : "Media is unavailable."}
        </p>
      ) : kind === "image" ? (
        <img
          key={current.url}
          src={current.url}
          alt={alt}
          onError={() => setFailed(blob!)}
          className="h-auto max-w-full rounded-[10px]"
        />
      ) : (
        <audio
          key={current.url}
          ref={audio}
          src={current.url}
          controls
          preload="metadata"
          aria-label={alt}
          onError={() => setFailed(blob!)}
          className="w-full max-w-full"
        />
      )}
    </figure>
  );
}

export function StimulusBlocks({
  blocks,
  media = {},
  ownerKey,
  locale = "fa",
  onRetryMedia,
}: {
  blocks: readonly StimulusBlock[];
  media?: Readonly<Record<string, MediaState>>;
  ownerKey: string;
  locale?: WidgetLocale;
  onRetryMedia?: (id: string) => void;
}) {
  return (
    <div lang="en" dir="ltr" className="min-w-0 space-y-5 text-left leading-7">
      {blocks.map((block) =>
        block.kind === "text" ? (
          <p key={block.id} className="whitespace-pre-wrap break-words">
            {block.text}
          </p>
        ) : (
          <PrivateMedia
            key={block.id}
            {...media[block.mediaId]}
            kind={block.kind}
            alt={block.alt}
            ownerKey={ownerKey}
            locale={locale}
            onRetry={
              onRetryMedia ? () => onRetryMedia(block.mediaId) : undefined
            }
          />
        ),
      )}
    </div>
  );
}
