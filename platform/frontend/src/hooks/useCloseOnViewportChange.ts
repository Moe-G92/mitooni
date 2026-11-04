import { useEffect, useRef } from "react";

/**
 * Notifies transient UI only when the supplied layout breakpoint is crossed.
 * Regular resizes (including soft-keyboard resizes) within the same layout do
 * not disturb an open rail.
 */
export function useCloseOnViewportChange(
  query: string,
  onViewportChange: (matchesQuery: boolean) => void,
) {
  const onViewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    const media = window.matchMedia(query);
    let matchesQuery = media.matches;
    const handleViewportChange = () => {
      if (media.matches === matchesQuery) return;
      matchesQuery = media.matches;
      onViewportChangeRef.current(matchesQuery);
    };

    media.addEventListener("change", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    return () => {
      media.removeEventListener("change", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
    };
  }, [query]);
}
