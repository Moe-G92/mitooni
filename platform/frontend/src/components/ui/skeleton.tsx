/**
 * Loading placeholders shared by every app page.
 *
 * Each page skeleton mirrors the rough shape of the page it stands in for, so
 * nothing jumps when the real content fades in (add `reveal` to the loaded
 * page's root). The shimmer and its reduced-motion fallback live in index.css.
 */
import type { CSSProperties, ReactNode } from "react";

export function Skeleton({
  width = "100%",
  height = "1rem",
  radius,
  className = "",
  style,
}: {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
}

/** Screen-reader status plus a skeleton body. Pages compose their own shapes inside it. */
export function SkeletonFrame({
  label,
  className = "",
  style,
  children,
}: {
  label: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className} style={style}>
      {children}
    </div>
  );
}

/** Generic page: heading, intro line and a grid of cards. Used for route chunk loads. */
export function PageSkeleton({ label = "Loading page" }: { label?: string }) {
  return (
    <SkeletonFrame label={label} className="mx-auto max-w-5xl" style={{ paddingTop: "0.5rem" }}>
      <Skeleton width="14rem" height="1.6rem" />
      <Skeleton width="min(28rem, 80%)" height="0.85rem" style={{ marginTop: "0.9rem" }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height="7.5rem" radius="0.9rem" />
        ))}
      </div>
    </SkeletonFrame>
  );
}
