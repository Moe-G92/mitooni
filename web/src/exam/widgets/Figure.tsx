import { useEffect, useState, type ReactNode } from "react";

const cache = new Map<string, string>();

/**
 * Loads /figures/<id>.svg and inlines it so it follows the contrast setting
 * (figures only use currentColor). Children are positioned over it, for
 * diagram answer boxes.
 */
export function Figure({ id, children, label }: { id: string; children?: ReactNode; label?: string }) {
  const [svg, setSvg] = useState(cache.get(id) ?? "");
  useEffect(() => {
    if (cache.has(id)) return;
    let alive = true;
    fetch(`/figures/${id}.svg`)
      .then((r) => (r.ok ? r.text() : ""))
      .then((t) => {
        cache.set(id, t);
        if (alive) setSvg(t);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id]);
  return (
    <div className="x-figure" role="group" aria-label={label}>
      {/* Figures are our own static files from public/figures. */}
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      {children}
    </div>
  );
}
