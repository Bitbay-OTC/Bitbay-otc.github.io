import { useMemo } from 'react';

/**
 * A fixed, very faint star layer behind the whole page. Positions come from a
 * cheap deterministic hash so they never move between renders.
 */
export function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => {
        const a = Math.sin(i * 127.1) * 43758.5453;
        const b = Math.sin(i * 311.7) * 43758.5453;
        const c = Math.sin(i * 74.7) * 43758.5453;
        return {
          left: `${(a - Math.floor(a)) * 100}%`,
          top: `${(b - Math.floor(b)) * 100}%`,
          size: 1 + (c - Math.floor(c)) * 1.6,
          delay: `${((c - Math.floor(c)) * 5).toFixed(2)}s`,
          opacity: 0.18 + (a - Math.floor(a)) * 0.35,
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {stars.map((star, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}
