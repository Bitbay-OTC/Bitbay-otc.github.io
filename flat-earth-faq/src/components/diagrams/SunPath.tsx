import { useMemo, useState } from 'react';
import { Play, Pause, Spline } from 'lucide-react';
import { DiagramFrame, Readout } from './DiagramFrame';
import { useAnimationFrame } from '../../lib/useAnimationFrame';
import { useReducedMotion } from '../../lib/useReducedMotion';

const SIZE = 420;
const CX = SIZE / 2;
const CY = SIZE / 2;
/** Radius of the rim, i.e. latitude -90. */
const R_RIM = 185;
/** Reach of the sun's light across the plane, in the same units. */
const SPOTLIGHT = 96;

/** Latitude to radius on a north-polar azimuthal equidistant layout. */
const radiusFor = (lat: number) => ((90 - lat) / 180) * R_RIM;

const RINGS = [
  { lat: 66.5, label: 'Arctic circle', tone: '#7ceaff' },
  { lat: 23.5, label: 'Tropic of Cancer', tone: '#3b4a6b' },
  { lat: 0, label: 'Equator', tone: '#64748b' },
  { lat: -23.5, label: 'Tropic of Capricorn', tone: '#3b4a6b' },
  { lat: -66.5, label: 'Antarctic circle', tone: '#3b4a6b' },
];

type Season = 'june' | 'equinox' | 'december';

const SEASONS: Record<Season, { label: string; lat: number; note: string }> = {
  june: {
    label: 'June solstice',
    lat: 23.5,
    note: 'Tightest circle. The sun never leaves the arctic sky — the midnight sun.',
  },
  equinox: {
    label: 'Equinox',
    lat: 0,
    note: 'The sun tracks the equator ring and day and night run about even.',
  },
  december: {
    label: 'December solstice',
    lat: -23.5,
    note: 'Widest circle. The centre falls outside the lit region and the arctic goes dark.',
  },
};

/** Deterministic star field so the backdrop does not flicker between renders. */
const STARS = Array.from({ length: 70 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  return {
    x: (a - Math.floor(a)) * SIZE,
    y: (b - Math.floor(b)) * SIZE,
    r: 0.5 + ((a - Math.floor(a)) * 1.2),
  };
});

export function SunPath() {
  const [season, setSeason] = useState<Season>('june');
  const [angle, setAngle] = useState(0);
  const [showSpiral, setShowSpiral] = useState(false);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(!reducedMotion);

  useAnimationFrame(playing, (delta) => {
    setAngle((current) => (current + delta * 0.55) % (Math.PI * 2));
  });

  const sunRadius = radiusFor(SEASONS[season].lat);
  const sunX = CX + sunRadius * Math.sin(angle);
  const sunY = CY - sunRadius * Math.cos(angle);

  // The north pole is lit whenever the sun's circle sits inside its own reach.
  const poleLit = sunRadius < SPOTLIGHT;

  const spiralPath = useMemo(() => {
    const from = radiusFor(23.5);
    const to = radiusFor(-23.5);
    const turns = 7;
    const points: string[] = [];
    for (let i = 0; i <= 480; i += 1) {
      const t = i / 480;
      const r = from + (to - from) * t;
      const a = t * Math.PI * 2 * turns;
      points.push(`${(CX + r * Math.sin(a)).toFixed(1)},${(CY - r * Math.cos(a)).toFixed(1)}`);
    }
    return `M ${points.join(' L ')}`;
  }, []);

  // Sub-solar longitude under this projection, and the UTC hour it implies.
  const lon = ((180 - (angle * 180) / Math.PI + 540) % 360) - 180;
  const utcHour = (((12 - lon / 15) % 24) + 24) % 24;
  const clock = `${String(Math.floor(utcHour)).padStart(2, '0')}:${String(
    Math.floor((utcHour % 1) * 60),
  ).padStart(2, '0')}`;

  return (
    <DiagramFrame
      title="One local sun, seen from above the plane"
      caption="Looking straight down on the north pole. The sun circles once a day and its circle widens and narrows through the year, which is what produces the seasons in this model."
      controls={
        <>
          <div className="flex flex-wrap rounded-lg border border-steel-700 p-0.5">
            {(Object.keys(SEASONS) as Season[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSeason(value)}
                aria-pressed={season === value}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  season === value ? 'bg-gold-500/15 text-gold-400' : 'text-steel-400 hover:text-steel-200'
                }`}
              >
                {SEASONS[value].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            className={`diagram-btn ${playing ? 'diagram-btn-gold' : ''}`}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Trace the day'}
          </button>
          <button
            type="button"
            onClick={() => setShowSpiral((value) => !value)}
            aria-pressed={showSpiral}
            className={`diagram-btn ${showSpiral ? 'diagram-btn-active' : ''}`}
          >
            <Spline className="h-3.5 w-3.5" />
            Year spiral
          </button>
        </>
      }
      readout={
        <>
          <Readout label="Sub-solar longitude" value={`${lon >= 0 ? '' : '-'}${Math.abs(lon).toFixed(0)}°`} accent="gold" />
          <Readout label="Clock" value={`${clock} UTC`} />
          <Readout
            label="North pole"
            value={poleLit ? 'daylight' : 'darkness'}
            accent={poleLit ? 'gold' : 'steel'}
          />
        </>
      }
      legend={[
        { label: "The sun's daily circle", color: '#f5c451', dashed: true },
        { label: 'Reach of its light', color: '#fbd074' },
        { label: 'Arctic circle', color: '#7ceaff' },
      ]}
      footnote="A schematic of the model's own geometry: ring spacing follows the azimuthal equidistant layout, and the lit area is drawn as a fixed reach rather than a measured one."
    >
      <div className="mx-auto max-w-[460px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full"
          role="img"
          aria-label={`Top-down view of the flat earth model at the ${SEASONS[season].label}, with the sun on a circle above latitude ${SEASONS[season].lat} degrees. The north pole is currently in ${poleLit ? 'daylight' : 'darkness'}.`}
        >
          <defs>
            <radialGradient id="sp-spotlight">
              <stop offset="0%" stopColor="#fff0c4" stopOpacity="0.62" />
              <stop offset="45%" stopColor="#f5c451" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#f5c451" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sp-disc">
              <stop offset="0%" stopColor="#16233d" />
              <stop offset="100%" stopColor="#090e1b" />
            </radialGradient>
            <radialGradient id="sp-sun">
              <stop offset="0%" stopColor="#fffbe8" />
              <stop offset="55%" stopColor="#f5c451" />
              <stop offset="100%" stopColor="#e0a828" />
            </radialGradient>
            <clipPath id="sp-clip">
              <circle cx={CX} cy={CY} r={R_RIM} />
            </clipPath>
          </defs>

          <rect width={SIZE} height={SIZE} fill="#04060d" rx="14" />
          {STARS.map((star, index) => (
            <circle
              key={index}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill="#cbd5e1"
              opacity={0.18 + (index % 5) * 0.06}
            />
          ))}

          {/* The plane itself. */}
          <circle cx={CX} cy={CY} r={R_RIM} fill="url(#sp-disc)" />

          <g clipPath="url(#sp-clip)">
            {/* Longitude spokes: note how far apart they get toward the rim. */}
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i / 24) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={CX}
                  y1={CY}
                  x2={CX + R_RIM * Math.sin(a)}
                  y2={CY - R_RIM * Math.cos(a)}
                  stroke="#1b2540"
                  strokeWidth="1"
                />
              );
            })}

            {RINGS.map((ring) => (
              <circle
                key={ring.lat}
                cx={CX}
                cy={CY}
                r={radiusFor(ring.lat)}
                fill="none"
                stroke={ring.tone}
                strokeWidth={ring.lat === 66.5 ? 1.6 : 1}
                strokeOpacity={ring.lat === 66.5 ? 0.75 : 0.5}
                strokeDasharray={ring.lat === 0 ? undefined : '4 5'}
              />
            ))}

            {/* Ice rim. */}
            <circle
              cx={CX}
              cy={CY}
              r={R_RIM - 8}
              fill="none"
              stroke="#d8f3ff"
              strokeWidth="16"
              strokeOpacity="0.22"
            />
            <circle cx={CX} cy={CY} r={R_RIM - 1} fill="none" stroke="#d8f3ff" strokeWidth="2" strokeOpacity="0.65" />

            {showSpiral && (
              <path d={spiralPath} fill="none" stroke="#38e0ff" strokeWidth="1.1" strokeOpacity="0.55" />
            )}

            {/* The sun's circle for the selected season. */}
            <circle
              cx={CX}
              cy={CY}
              r={sunRadius}
              fill="none"
              stroke="#f5c451"
              strokeWidth="1.6"
              strokeDasharray="6 7"
              strokeOpacity="0.85"
            />

            {/* Its light falling on the plane. */}
            <circle cx={sunX} cy={sunY} r={SPOTLIGHT} fill="url(#sp-spotlight)" />
          </g>

          <circle cx={CX} cy={CY} r={R_RIM} fill="none" stroke="#2a3a5c" strokeWidth="2" />

          {/* The sun. */}
          <g>
            <circle cx={sunX} cy={sunY} r="16" fill="#f5c451" opacity="0.22" />
            <circle cx={sunX} cy={sunY} r="8.5" fill="url(#sp-sun)" />
          </g>

          {/* North pole marker. */}
          <circle cx={CX} cy={CY} r="3.5" fill={poleLit ? '#f5c451' : '#64748b'} />
          <text x={CX + 8} y={CY - 6} className="fill-steel-400 text-[10px]">
            N pole
          </text>

          {/* Ring labels run down the left of centre, clear of the pole marker. */}
          {RINGS.map((ring) => (
            <text
              key={ring.lat}
              x={CX - 7}
              y={CY + radiusFor(ring.lat) - 5}
              textAnchor="end"
              className="fill-steel-400 text-[9px]"
              opacity={0.9}
            >
              {ring.label}
            </text>
          ))}

          <text x={CX} y={SIZE - 10} textAnchor="middle" className="fill-ice text-[10px]" opacity="0.6">
            ice rim
          </text>
        </svg>

        <p className="mt-2 px-1 text-center text-xs text-steel-400">
          {SEASONS[season].note}
          {reducedMotion && ' Animation starts paused on this device.'}
        </p>
      </div>
    </DiagramFrame>
  );
}
