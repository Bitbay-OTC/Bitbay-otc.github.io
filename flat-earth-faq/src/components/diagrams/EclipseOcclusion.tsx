import { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { DiagramFrame, Readout } from './DiagramFrame';
import { useAnimationFrame } from '../../lib/useAnimationFrame';
import { useReducedMotion } from '../../lib/useReducedMotion';

const VIEW_W = 640;
const VIEW_H = 330;
const LUMINARY_R = 54;
const CXL = VIEW_W / 2;
const CYL = 168;

type Mode = 'solar' | 'lunar' | 'selenelion';

/** Fraction of a disc of radius `r` hidden by an equal-or-larger disc. */
function coverage(distance: number, r: number, occluderR: number): number {
  if (distance >= r + occluderR) return 0;
  if (distance <= Math.abs(occluderR - r)) return occluderR >= r ? 1 : (occluderR / r) ** 2;

  const d = distance;
  const a =
    r * r * Math.acos((d * d + r * r - occluderR * occluderR) / (2 * d * r)) +
    occluderR * occluderR * Math.acos((d * d + occluderR * occluderR - r * r) / (2 * d * occluderR)) -
    0.5 * Math.sqrt((-d + r + occluderR) * (d + r - occluderR) * (d - r + occluderR) * (d + r + occluderR));

  return Math.min(1, a / (Math.PI * r * r));
}

export function EclipseOcclusion() {
  const [mode, setMode] = useState<Mode>('solar');
  const [t, setT] = useState(0.5);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useAnimationFrame(playing && mode !== 'selenelion', (delta) => {
    setT((current) => (current + delta * 0.16) % 1);
  });

  const occluderR = mode === 'solar' ? LUMINARY_R * 1.03 : LUMINARY_R * 0.98;
  const travel = LUMINARY_R * 2 + occluderR * 2 + 60;
  const occluderX = CXL - travel / 2 + travel * t;
  const distance = Math.abs(occluderX - CXL);
  const covered = mode === 'selenelion' ? 0 : coverage(distance, LUMINARY_R, occluderR);
  const totality = covered > 0.995;

  return (
    <DiagramFrame
      title="Occlusion by a local body"
      caption="The model's account of an eclipse: something passes in front of a nearby luminary. No sphere is required, and nothing has to cast a shadow across space."
      controls={
        <>
          <div className="flex flex-wrap rounded-lg border border-steel-700 p-0.5">
            {(
              [
                ['solar', 'Solar'],
                ['lunar', 'Lunar'],
                ['selenelion', 'Selenelion'],
              ] as Array<[Mode, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setPlaying(false);
                  setT(0.5);
                }}
                aria-pressed={mode === value}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  mode === value ? 'bg-gold-500/15 text-gold-400' : 'text-steel-400 hover:text-steel-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode !== 'selenelion' && (
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className={`diagram-btn ${playing ? 'diagram-btn-gold' : ''}`}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? 'Pause' : 'Run the transit'}
            </button>
          )}
        </>
      }
      readout={
        mode === 'selenelion' ? (
          <Readout label="Bodies above horizon" value="sun + moon" accent="gold" />
        ) : (
          <>
            <Readout label="Obscured" value={`${Math.round(covered * 100)}%`} accent="gold" />
            <Readout label="Phase" value={totality ? 'total' : covered > 0 ? 'partial' : 'clear'} />
          </>
        )
      }
      legend={[
        { label: mode === 'lunar' ? 'Moon' : 'Sun', color: mode === 'lunar' ? '#cbd5e1' : '#f5c451' },
        { label: 'Occluding body', color: '#111826' },
        { label: 'Observer horizon', color: '#38e0ff', dashed: true },
      ]}
      footnote="A schematic of the claim rather than a measurement. The model states the occluding body's nature is unknown, and older traditions named such a body Rahu."
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        role="img"
        aria-label={
          mode === 'selenelion'
            ? 'An observer with the sun above one horizon and the eclipsed moon above the opposite horizon at the same moment.'
            : `A dark body crossing in front of the ${mode === 'lunar' ? 'moon' : 'sun'}, currently obscuring ${Math.round(covered * 100)} percent of it.`
        }
      >
        <defs>
          <radialGradient id="ec-sun">
            <stop offset="0%" stopColor="#fffbe8" />
            <stop offset="60%" stopColor="#f5c451" />
            <stop offset="100%" stopColor="#e0a828" />
          </radialGradient>
          <radialGradient id="ec-moon">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>
          <radialGradient id="ec-halo">
            <stop offset="55%" stopColor="#f5c451" stopOpacity="0" />
            <stop offset="72%" stopColor="#fff0c4" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f5c451" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ec-glow">
            <stop offset="0%" stopColor={mode === 'lunar' ? '#cbd5e1' : '#f5c451'} stopOpacity="0.30" />
            <stop offset="100%" stopColor="#f5c451" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect
          width={VIEW_W}
          height={VIEW_H}
          rx="12"
          fill="#04060d"
        />
        {/* The sky dims as the transit deepens. */}
        <rect
          width={VIEW_W}
          height={VIEW_H}
          rx="12"
          fill="#0b1120"
          opacity={mode === 'selenelion' ? 0.5 : 0.25 + covered * 0.5}
        />

        {mode === 'selenelion' ? (
          <g>
            {/* Observer's horizon. */}
            <line
              x1="30"
              y1="238"
              x2={VIEW_W - 30}
              y2="238"
              stroke="#38e0ff"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
            <text x="34" y="258" className="fill-glow-300 text-[10px]">
              the observer&apos;s horizon
            </text>
            <text x="140" y="258" textAnchor="middle" className="fill-steel-500 text-[10px]">
              west
            </text>
            <text x={VIEW_W - 140} y="258" textAnchor="middle" className="fill-steel-500 text-[10px]">
              east
            </text>

            {/* Sun low in the west. */}
            <circle cx="140" cy="192" r="46" fill="url(#ec-glow)" />
            <circle cx="140" cy="192" r="26" fill="url(#ec-sun)" />
            <text x="140" y="150" textAnchor="middle" className="fill-gold-400 text-[11px] font-semibold">
              sun — still up
            </text>

            {/* Eclipsed moon low in the east. */}
            <circle cx={VIEW_W - 140} cy="192" r="26" fill="url(#ec-moon)" />
            <circle cx={VIEW_W - 134} cy="192" r="25" fill="#111826" opacity="0.88" />
            <text
              x={VIEW_W - 140}
              y="150"
              textAnchor="middle"
              className="fill-steel-300 text-[11px] font-semibold"
            >
              moon — eclipsed, also up
            </text>

            {/* Observer. */}
            <circle cx={CXL} cy="231" r="5" fill="#38e0ff" />
            <text x={CXL} y="274" textAnchor="middle" className="fill-steel-400 text-[10px]">
              observer
            </text>

            <line
              x1="166"
              y1="200"
              x2={CXL - 12}
              y2="228"
              stroke="#f5c451"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            <line
              x1={VIEW_W - 166}
              y1="200"
              x2={CXL + 12}
              y2="228"
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />

            <text x={CXL} y="84" textAnchor="middle" className="fill-steel-200 text-[12px] font-semibold">
              A shadow model needs sun, earth and moon in one straight line.
            </text>
            <text x={CXL} y="104" textAnchor="middle" className="fill-steel-400 text-[11px]">
              Here both are above the horizon at once, so they are not aligned.
            </text>
          </g>
        ) : (
          <g>
            {/* The luminary. */}
            <circle cx={CXL} cy={CYL} r={LUMINARY_R * 2} fill="url(#ec-glow)" opacity={1 - covered * 0.8} />
            {totality && mode === 'solar' && (
              <circle cx={CXL} cy={CYL} r={LUMINARY_R * 1.7} fill="url(#ec-halo)" className="animate-pulse-soft" />
            )}
            <circle
              cx={CXL}
              cy={CYL}
              r={LUMINARY_R}
              fill={mode === 'lunar' ? 'url(#ec-moon)' : 'url(#ec-sun)'}
            />
            {mode === 'lunar' && (
              <g opacity="0.35">
                <circle cx={CXL - 18} cy={CYL - 14} r="9" fill="#64748b" />
                <circle cx={CXL + 14} cy={CYL + 10} r="13" fill="#64748b" />
                <circle cx={CXL - 6} cy={CYL + 22} r="6" fill="#64748b" />
              </g>
            )}

            {/* The occluding body. */}
            <circle cx={occluderX} cy={CYL} r={occluderR} fill="#111826" />
            <circle
              cx={occluderX}
              cy={CYL}
              r={occluderR}
              fill="none"
              stroke="#26334f"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />

            {/* Its track. */}
            <line
              x1={CXL - travel / 2}
              y1={CYL}
              x2={CXL + travel / 2}
              y2={CYL}
              stroke="#26334f"
              strokeWidth="1"
              strokeDasharray="4 7"
            />
            <text x={occluderX} y={CYL + LUMINARY_R * 1.7 + 24} textAnchor="middle" className="fill-steel-300 text-[10px]">
              unknown body
            </text>

            <text x={CXL} y="28" textAnchor="middle" className="fill-steel-200 text-[12px] font-semibold">
              {mode === 'solar'
                ? 'Something passes in front of the sun.'
                : 'Something passes in front of the moon.'}
            </text>
            <text x={CXL} y="48" textAnchor="middle" className="fill-steel-400 text-[11px]">
              {totality
                ? 'Total: the disc is fully covered and a ring of light remains.'
                : covered > 0
                  ? `Partial: ${Math.round(covered * 100)}% of the disc is hidden.`
                  : 'Clear: the occluding body has not reached the disc.'}
            </text>
          </g>
        )}
      </svg>

      {mode !== 'selenelion' && (
        <div className="mt-3 flex items-center gap-3 px-1">
          <label htmlFor="eclipse-scrub" className="shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-steel-500">
            Transit
          </label>
          <input
            id="eclipse-scrub"
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={t}
            onChange={(event) => {
              setPlaying(false);
              setT(Number(event.target.value));
            }}
            className="slider slider-gold"
          />
          <span className="w-14 shrink-0 text-right font-mono text-xs text-steel-300">
            {Math.round(covered * 100)}%
          </span>
        </div>
      )}
      {reducedMotion && (
        <p className="mt-2 px-1 text-[0.7rem] italic text-steel-500">
          Animation stays paused here because your system asks for reduced motion. The slider still works.
        </p>
      )}
    </DiagramFrame>
  );
}
