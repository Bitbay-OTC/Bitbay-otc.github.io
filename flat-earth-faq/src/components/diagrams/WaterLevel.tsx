import { useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { DiagramFrame, Readout } from './DiagramFrame';
import { useAnimationFrame } from '../../lib/useAnimationFrame';
import { useReducedMotion } from '../../lib/useReducedMotion';

const VIEW_W = 360;
const VIEW_H = 220;
const LEFT_X = 40;
const RIGHT_X = 310;
const BASE_Y = 150;
const POST_H = 46;
const MAX_MI = 60;
/** Vertical exaggeration so the curve is visible; the readout stays true. */
const MAX_SAG_PX = 70;

type View = 'laser' | 'fill';

/** The 8 inches per mile squared approximation, returned in feet. */
function dropFeet(miles: number): number {
  return (8 * miles * miles) / 12;
}

function sagPx(miles: number): number {
  return MAX_SAG_PX * (miles / MAX_MI) ** 2;
}

interface SceneProps {
  curved: boolean;
  view: View;
  /** 0 to 1: laser travel in `laser` view, water height in `fill` view. */
  progress: number;
  miles: number;
}

function Scene({ curved, view, progress, miles }: SceneProps) {
  const sag = curved ? sagPx(miles) : 0;
  const span = RIGHT_X - LEFT_X;

  /** Surface height at a horizontal position. */
  const surfaceAt = (x: number) => BASE_Y + sag * ((x - LEFT_X) / span) ** 2;

  const surfacePath = `M 14 ${surfaceAt(14).toFixed(1)} ${Array.from({ length: 30 }, (_, i) => {
    const x = 14 + ((VIEW_W - 28) / 29) * i;
    return `L ${x.toFixed(1)} ${surfaceAt(x).toFixed(1)}`;
  }).join(' ')}`;

  const beamY = BASE_Y - POST_H;
  const beamX = LEFT_X + span * progress;
  const posts = [0, 0.5, 1].map((f) => ({
    x: LEFT_X + span * f,
    top: BASE_Y + sag * f * f - POST_H,
    base: BASE_Y + sag * f * f,
  }));

  // `fill` view: the basin fills from the bottom up.
  const fillTop = BASE_Y + 30 - (BASE_Y + 30 - (BASE_Y - 40)) * progress;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" role="presentation">
      <defs>
        <linearGradient id={`wl-water-${curved}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={curved ? '#7a5b1f' : '#155a74'} />
          <stop offset="100%" stopColor={curved ? '#2a1e08' : '#07202e'} />
        </linearGradient>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill="#080d18" rx="10" />

      {view === 'laser' ? (
        <>
          <path
            d={`${surfacePath} L ${VIEW_W - 14} ${VIEW_H - 12} L 14 ${VIEW_H - 12} Z`}
            fill={`url(#wl-water-${curved})`}
          />
          <path
            d={surfacePath}
            fill="none"
            stroke={curved ? '#e0a828' : '#38e0ff'}
            strokeWidth="2"
          />

          {posts.map((post, index) => (
            <g key={index}>
              <rect x={post.x - 2.5} y={post.top} width="5" height={post.base - post.top} rx="1.5" fill="#64748b" />
              <circle
                cx={post.x}
                cy={post.top}
                r="6"
                fill="none"
                stroke={curved ? '#e0a828' : '#38e0ff'}
                strokeWidth="1.6"
              />
              <circle cx={post.x} cy={post.top} r="2" fill={curved ? '#e0a828' : '#38e0ff'} />
              <text x={post.x} y={post.top - 12} textAnchor="middle" className="fill-steel-400 text-[9px]">
                {index === 0 ? '0' : index === 1 ? `${(miles / 2).toFixed(0)} mi` : `${miles.toFixed(0)} mi`}
              </text>
            </g>
          ))}

          {/* The beam always leaves the first target dead level. */}
          <line
            x1={LEFT_X}
            y1={beamY}
            x2={Math.max(beamX, LEFT_X)}
            y2={beamY}
            stroke="#ff4d6d"
            strokeWidth="2"
            strokeOpacity="0.9"
          />
          {progress > 0.02 && <circle cx={beamX} cy={beamY} r="3.5" fill="#ff4d6d" />}

          {curved && sag > 4 && progress > 0.98 && (
            <g>
              <line
                x1={RIGHT_X + 16}
                y1={beamY}
                x2={RIGHT_X + 16}
                y2={beamY + sag}
                stroke="#e0a828"
                strokeWidth="1.4"
              />
              <line x1={RIGHT_X + 11} y1={beamY} x2={RIGHT_X + 21} y2={beamY} stroke="#e0a828" strokeWidth="1.4" />
              <line
                x1={RIGHT_X + 11}
                y1={beamY + sag}
                x2={RIGHT_X + 21}
                y2={beamY + sag}
                stroke="#e0a828"
                strokeWidth="1.4"
              />
              <text x={RIGHT_X + 25} y={beamY + sag / 2 + 3} className="fill-gold-400 text-[9px] font-semibold">
                {dropFeet(miles) >= 1000
                  ? `${(dropFeet(miles) / 1000).toFixed(1)}k ft`
                  : `${Math.round(dropFeet(miles))} ft`}
              </text>
            </g>
          )}
        </>
      ) : (
        <>
          {/* A basin being filled. Only the shape of the settled top differs. */}
          <path
            d={`M 22 ${BASE_Y - 60} L 22 ${VIEW_H - 16} L ${VIEW_W - 22} ${VIEW_H - 16} L ${VIEW_W - 22} ${BASE_Y - 60}`}
            fill="none"
            stroke="#3b4a6b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {progress > 0.01 && (
            <>
              <path
                d={
                  curved
                    ? `M 24 ${fillTop} Q ${VIEW_W / 2} ${fillTop - 34} ${VIEW_W - 24} ${fillTop} L ${VIEW_W - 24} ${VIEW_H - 18} L 24 ${VIEW_H - 18} Z`
                    : `M 24 ${fillTop} L ${VIEW_W - 24} ${fillTop} L ${VIEW_W - 24} ${VIEW_H - 18} L 24 ${VIEW_H - 18} Z`
                }
                fill={`url(#wl-water-${curved})`}
              />
              <path
                d={
                  curved
                    ? `M 24 ${fillTop} Q ${VIEW_W / 2} ${fillTop - 34} ${VIEW_W - 24} ${fillTop}`
                    : `M 24 ${fillTop} L ${VIEW_W - 24} ${fillTop}`
                }
                fill="none"
                stroke={curved ? '#e0a828' : '#38e0ff'}
                strokeWidth="2.5"
              />
            </>
          )}
          {/* A true horizontal to compare the settled surface against. */}
          <line
            x1="18"
            y1={BASE_Y - 40}
            x2={VIEW_W - 18}
            y2={BASE_Y - 40}
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeDasharray="5 5"
            strokeOpacity="0.6"
          />
          <text x={VIEW_W - 18} y={BASE_Y - 46} textAnchor="end" className="fill-steel-500 text-[9px]">
            true level
          </text>
        </>
      )}

      <text x="18" y="26" className={`text-[11px] font-semibold ${curved ? 'fill-gold-400' : 'fill-glow-300'}`}>
        {curved ? 'If the surface curves' : 'Water finds its level'}
      </text>
      <text x="18" y="41" className="fill-steel-500 text-[9px]">
        {curved
          ? view === 'laser'
            ? 'far targets sink below the beam'
            : 'the settled top would have to bulge'
          : view === 'laser'
            ? 'the beam crosses every target centre'
            : 'the settled top is flat, every time'}
      </text>
    </svg>
  );
}

export function WaterLevel() {
  const [view, setView] = useState<View>('laser');
  const [miles, setMiles] = useState(36);
  const [progress, setProgress] = useState(1);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useAnimationFrame(playing, (delta) => {
    setProgress((current) => {
      const next = current + delta * 0.45;
      if (next >= 1) {
        setPlaying(false);
        return 1;
      }
      return next;
    });
  });

  const run = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setProgress(0);
    setPlaying(true);
  };

  return (
    <DiagramFrame
      title="The same water, two assumptions"
      caption="On the left, still water settles level and a laser crosses every target centre. On the right, the same span with 8 inches per mile squared taken out of it."
      controls={
        <>
          <div className="flex rounded-lg border border-steel-700 p-0.5">
            {(
              [
                ['laser', 'Laser test'],
                ['fill', 'Fill a basin'],
              ] as Array<[View, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setView(value);
                  setProgress(1);
                  setPlaying(false);
                }}
                aria-pressed={view === value}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  view === value ? 'bg-glow-400/15 text-glow-300' : 'text-steel-400 hover:text-steel-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={run} className={`diagram-btn ${playing ? 'diagram-btn-active' : ''}`}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {view === 'laser' ? 'Fire laser' : 'Pour water'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setProgress(1);
            }}
            className="diagram-btn"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </>
      }
      readout={
        view === 'laser' ? (
          <>
            <Readout label="Span" value={`${miles.toFixed(0)} mi`} accent="glow" />
            <Readout
              label="Predicted drop"
              value={
                dropFeet(miles) >= 1000
                  ? `${(dropFeet(miles) / 1000).toFixed(2)}k ft`
                  : `${Math.round(dropFeet(miles))} ft`
              }
              accent="gold"
            />
          </>
        ) : null
      }
      legend={[
        { label: 'Level surface', color: '#38e0ff' },
        { label: 'Curved surface', color: '#e0a828' },
        { label: 'Laser beam', color: '#ff4d6d' },
      ]}
      footnote={`The curve on the right is exaggerated vertically so it is visible at this width. The drop figure quoted is the real one for the selected span.${
        reducedMotion ? ' Animation is paused because your system asks for reduced motion.' : ''
      }`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Scene curved={false} view={view} progress={progress} miles={miles} />
        <Scene curved view={view} progress={progress} miles={miles} />
      </div>

      {view === 'laser' && (
        <div className="mt-3 flex items-center gap-3 px-1">
          <label htmlFor="water-span" className="shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-steel-500">
            Span
          </label>
          <input
            id="water-span"
            type="range"
            min="4"
            max={MAX_MI}
            step="1"
            value={miles}
            onChange={(event) => setMiles(Number(event.target.value))}
            className="slider slider-gold"
          />
          <span className="w-16 shrink-0 text-right font-mono text-xs text-steel-300">{miles} mi</span>
        </div>
      )}
    </DiagramFrame>
  );
}
