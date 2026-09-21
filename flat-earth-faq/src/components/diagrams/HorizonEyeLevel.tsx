import { useState } from 'react';
import { DiagramFrame, Readout } from './DiagramFrame';

const EARTH_RADIUS_MI = 3959;
/** Pixels per mile. Chosen so a 30 mile ascent fills the drawing width. */
const SCALE = 1.04;
/** Radius in pixels, used for the parabolic approximation of the surface. */
const R_PX = EARTH_RADIUS_MI * SCALE;

const VIEW_W = 720;
const VIEW_H = 300;
const OBS_X = 110;
const GROUND_Y = 182;

type Mode = 'flat' | 'globe' | 'both';

const PRESETS = [
  { label: 'Sea level', miles: 0.0011 },
  { label: 'Airliner', miles: 6.6 },
  { label: 'Weather balloon', miles: 20 },
  { label: 'Red Bull jump', miles: 24 },
];

/** Height of the globe surface at horizontal pixel `x`, as a parabola. */
function surfaceY(x: number): number {
  const dx = x - OBS_X;
  return GROUND_Y + (dx * dx) / (2 * R_PX);
}

export function HorizonEyeLevel() {
  const [mode, setMode] = useState<Mode>('both');
  const [altitude, setAltitude] = useState(20);

  const eyeY = GROUND_Y - altitude * SCALE;

  // Geometric horizon distance for a sphere, and the matching dip angle.
  const horizonMi = Math.sqrt(altitude * (2 * EARTH_RADIUS_MI + altitude));
  const horizonPx = Math.min(horizonMi * SCALE, VIEW_W - OBS_X - 40);
  const horizonX = OBS_X + horizonPx;
  const horizonY = surfaceY(horizonX);
  const dipDeg = (Math.acos(EARTH_RADIUS_MI / (EARTH_RADIUS_MI + altitude)) * 180) / Math.PI;

  // The sight line continues a little past the tangent point so the drop reads.
  const sightEndX = VIEW_W - 22;
  const sightSlope = horizonPx > 1 ? (horizonY - eyeY) / horizonPx : 0;
  const sightEndY = eyeY + sightSlope * (sightEndX - OBS_X);

  const showFlat = mode === 'flat' || mode === 'both';
  const showGlobe = mode === 'globe' || mode === 'both';

  const surfacePath = `M 18 ${surfaceY(18).toFixed(1)} ${Array.from({ length: 36 }, (_, i) => {
    const x = 18 + ((VIEW_W - 36) / 35) * i;
    return `L ${x.toFixed(1)} ${surfaceY(x).toFixed(1)}`;
  }).join(' ')}`;

  const feet = Math.round(altitude * 5280).toLocaleString('en-US');

  return (
    <DiagramFrame
      title="Line of sight from altitude"
      caption="A cross-section drawn to scale at roughly one pixel per mile. Raise the observer and watch where each model puts the horizon relative to eye level."
      controls={
        <>
          <div className="flex rounded-lg border border-steel-700 p-0.5">
            {(['flat', 'globe', 'both'] as Mode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                  mode === value ? 'bg-glow-400/15 text-glow-300' : 'text-steel-400 hover:text-steel-200'
                }`}
              >
                {value === 'both' ? 'Compare' : value}
              </button>
            ))}
          </div>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setAltitude(preset.miles)}
              className={`diagram-btn ${
                Math.abs(altitude - preset.miles) < 0.01 ? 'diagram-btn-active' : ''
              }`}
            >
              {preset.label}
            </button>
          ))}
        </>
      }
      readout={
        <>
          <Readout label="Altitude" value={`${feet} ft`} accent="glow" />
          <Readout label="Horizon" value={`${horizonMi.toFixed(1)} mi`} />
          <Readout label="Globe dip" value={`${dipDeg.toFixed(2)}°`} accent="gold" />
          <Readout label="Flat dip" value="0.00°" accent="glow" />
        </>
      }
      legend={[
        { label: 'Eye level (true horizontal)', color: '#38e0ff', dashed: true },
        { label: 'Sight line on a globe', color: '#f5c451' },
        { label: 'Surface falling away', color: '#3b4a6b' },
      ]}
      footnote="Drawn to scale: the vertical and horizontal axes share one pixels-per-mile ratio, so the dip angle you see is the dip angle the sphere predicts."
    >
      <div className="space-y-3">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full"
          role="img"
          aria-label={`Cross-section showing an observer at ${feet} feet. On a flat plane the horizon sits on the eye-level line. On a globe it sits ${dipDeg.toFixed(2)} degrees below it.`}
        >
          <defs>
            <linearGradient id="hz-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b1120" />
              <stop offset="100%" stopColor="#111c33" />
            </linearGradient>
            <linearGradient id="hz-sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14304a" />
              <stop offset="100%" stopColor="#081426" />
            </linearGradient>
            <marker id="hz-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="#f5c451" />
            </marker>
          </defs>

          <rect width={VIEW_W} height={VIEW_H} fill="url(#hz-sky)" />

          {/* The globe surface: a parabola, which at this scale is the sphere. */}
          {showGlobe && (
            <path d={`${surfacePath} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`} fill="url(#hz-sea)" />
          )}

          {/* The flat plane: a horizontal surface running to the edge of sight. */}
          {showFlat && (
            <>
              <rect
                x="0"
                y={GROUND_Y}
                width={VIEW_W}
                height={VIEW_H - GROUND_Y}
                fill={showGlobe ? 'rgba(56,224,255,0.07)' : 'url(#hz-sea)'}
              />
              <line
                x1="0"
                y1={GROUND_Y}
                x2={VIEW_W}
                y2={GROUND_Y}
                stroke="#38e0ff"
                strokeWidth="2"
                strokeOpacity={showGlobe ? 0.7 : 1}
              />
            </>
          )}

          {/* Stroked after the flat overlay so the curve stays readable in compare mode. */}
          {showGlobe && <path d={surfacePath} fill="none" stroke="#8aa2c4" strokeWidth="2.2" />}

          {/* Eye-level reference: a true horizontal through the observer. */}
          <line
            x1={OBS_X}
            y1={eyeY}
            x2={sightEndX}
            y2={eyeY}
            stroke="#38e0ff"
            strokeWidth="2"
            strokeDasharray="7 6"
          />
          <text x={sightEndX} y={eyeY - 9} textAnchor="end" className="fill-glow-300 text-[11px] font-semibold">
            eye level
          </text>

          {showFlat && (
            <g>
              <circle cx={sightEndX} cy={eyeY} r="5" fill="#38e0ff" />
              <text
                x={sightEndX - 10}
                y={eyeY + 16}
                textAnchor="end"
                className="fill-glow-300 text-[10px]"
              >
                flat model horizon — on the line
              </text>
            </g>
          )}

          {showGlobe && horizonPx > 6 && (
            <>
              <line
                x1={OBS_X}
                y1={eyeY}
                x2={sightEndX}
                y2={sightEndY}
                stroke="#f5c451"
                strokeWidth="2"
                markerEnd="url(#hz-arrow)"
              />
              <circle cx={horizonX} cy={horizonY} r="5" fill="#f5c451" />
              <text x={horizonX} y={horizonY + 20} textAnchor="middle" className="fill-gold-400 text-[10px]">
                globe horizon — {dipDeg.toFixed(2)}° below
              </text>

              {/* The dip wedge, drawn at the observer. */}
              <path
                d={`M ${OBS_X + 78} ${eyeY} A 78 78 0 0 1 ${(OBS_X + 78 * Math.cos(Math.atan(sightSlope))).toFixed(1)} ${(eyeY + 78 * Math.sin(Math.atan(sightSlope))).toFixed(1)}`}
                fill="none"
                stroke="#f5c451"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />
              <text
                x={OBS_X + 92}
                y={eyeY + 16}
                className="fill-gold-400 text-[11px] font-semibold"
              >
                {dipDeg.toFixed(2)}°
              </text>
            </>
          )}

          {/* Observer: a balloon when high, a figure on the surface when low. */}
          <g>
            <line
              x1={OBS_X}
              y1={eyeY}
              x2={OBS_X}
              y2={GROUND_Y}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <circle cx={OBS_X} cy={eyeY - 13} r="10" fill="#cbd5e1" fillOpacity="0.9" />
            <path d={`M ${OBS_X - 5} ${eyeY - 5} L ${OBS_X} ${eyeY - 1} L ${OBS_X + 5} ${eyeY - 5} Z`} fill="#cbd5e1" />
            <rect x={OBS_X - 4} y={eyeY - 1} width="8" height="6" rx="1" fill="#94a3b8" />
            <text x={OBS_X - 16} y={eyeY + 4} textAnchor="end" className="fill-steel-300 text-[10px]">
              observer
            </text>
          </g>

          {showGlobe && (
            <text x="24" y={surfaceY(24) + 16} className="fill-steel-400 text-[10px]">
              surface falling away
            </text>
          )}
        </svg>

        <div className="flex items-center gap-3 px-1">
          <label htmlFor="horizon-altitude" className="shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-steel-500">
            Altitude
          </label>
          <input
            id="horizon-altitude"
            type="range"
            min="0.0011"
            max="30"
            step="0.1"
            value={altitude}
            onChange={(event) => setAltitude(Number(event.target.value))}
            className="slider"
          />
          <span className="w-20 shrink-0 text-right font-mono text-xs text-steel-300">
            {altitude < 1 ? `${Math.round(altitude * 5280)} ft` : `${altitude.toFixed(1)} mi`}
          </span>
        </div>
      </div>
    </DiagramFrame>
  );
}
