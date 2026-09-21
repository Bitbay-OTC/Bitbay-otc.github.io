import { useEffect, useRef } from 'react';

/**
 * Runs `callback(deltaSeconds)` on every animation frame while `active` is true.
 * The callback is held in a ref so a caller can close over fresh state without
 * restarting the loop on every render.
 */
export function useAnimationFrame(active: boolean, callback: (deltaSeconds: number) => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      // Clamp so a backgrounded tab does not resume with one enormous jump.
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      callbackRef.current(delta);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}
