import { useEffect, useRef, useState } from "react";

/**
 * Wall-clock countdown. Uses Date.now so a slow tab or a background tab
 * never makes the exam clock drift. Calls onTick once per elapsed second
 * and onExpire once at zero.
 */
export function useCountdown(opts: {
  initialSec: number;
  running: boolean;
  onTick?: (remaining: number, deltaSec: number) => void;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(opts.initialSec);
  const remainingRef = useRef(opts.initialSec);
  const cb = useRef(opts);
  cb.current = opts;

  useEffect(() => {
    if (!opts.running) return;
    let lastWhole = Math.ceil(remainingRef.current);
    const startedAt = Date.now();
    const startRemaining = remainingRef.current;
    const id = window.setInterval(() => {
      const next = Math.max(0, startRemaining - (Date.now() - startedAt) / 1000);
      remainingRef.current = next;
      const whole = Math.ceil(next);
      if (whole !== lastWhole) {
        const delta = lastWhole - whole;
        lastWhole = whole;
        setRemaining(whole);
        cb.current.onTick?.(whole, delta);
        if (whole === 0) {
          window.clearInterval(id);
          cb.current.onExpire?.();
        }
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [opts.running]);

  const reset = (sec: number) => {
    remainingRef.current = sec;
    setRemaining(sec);
  };

  return { remaining, reset };
}
