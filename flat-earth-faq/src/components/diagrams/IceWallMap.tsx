import { useState } from 'react';
import { Grid3x3, Snowflake, Ruler, PlaneTakeoff } from 'lucide-react';
import { DiagramFrame, Readout } from './DiagramFrame';

const SIZE = 460;
const CX = SIZE / 2;
const CY = SIZE / 2;
/** Radius at latitude -90, i.e. the outer rim of the plane. */
const R_RIM = 196;

/**
 * North-polar azimuthal equidistant projection. Latitude maps linearly to
 * radius, so every degree of latitude is the same distance on the page —
 * which is the property this model relies on.
 */
function project(lon: number, lat: number): [number, number] {
  const r = ((90 - lat) / 180) * R_RIM;
  const theta = ((180 - lon) * Math.PI) / 180;
  return [CX + r * Math.sin(theta), CY - r * Math.cos(theta)];
}

const toPath = (coords: Array<[number, number]>) =>
  `M ${coords.map(([lon, lat]) => project(lon, lat).map((n) => n.toFixed(1)).join(',')).join(' L ')} Z`;

/** Coarse coastlines, sampled densely enough to stay recognisable once projected. */
const LANDMASSES: Record<string, Array<[number, number]>> = {
  'North America': [
    [-168, 66], [-166, 60], [-160, 58], [-152, 57], [-145, 60], [-138, 58], [-131, 53],
    [-127, 50], [-124, 46], [-124, 40], [-121, 36], [-117, 32], [-114, 28], [-110, 23],
    [-106, 21], [-100, 18], [-97, 16], [-93, 15], [-88, 16], [-87, 21], [-83, 22],
    [-80, 25], [-81, 29], [-79, 33], [-76, 35], [-74, 39], [-70, 42], [-66, 45],
    [-61, 46], [-56, 50], [-56, 54], [-64, 58], [-70, 60], [-78, 62], [-82, 66],
    [-85, 70], [-91, 70], [-96, 68], [-103, 68], [-110, 68], [-117, 70], [-125, 70],
    [-133, 69], [-141, 70], [-148, 70], [-156, 71], [-163, 70],
  ],
  Greenland: [
    [-45, 60], [-42, 62], [-36, 65], [-30, 68], [-24, 70], [-20, 73], [-19, 76],
    [-22, 79], [-28, 82], [-38, 83], [-48, 82], [-58, 82], [-66, 80], [-71, 78],
    [-68, 74], [-62, 70], [-55, 66], [-50, 63],
  ],
  'South America': [
    [-81, -4], [-79, -8], [-76, -14], [-71, -18], [-70, -23], [-71, -28], [-73, -37],
    [-74, -45], [-75, -52], [-70, -55], [-66, -55], [-65, -48], [-63, -42], [-60, -38],
    [-57, -35], [-53, -34], [-48, -27], [-42, -23], [-39, -17], [-37, -11], [-35, -6],
    [-41, -2], [-48, 0], [-51, 3], [-58, 7], [-62, 9], [-68, 11], [-72, 12], [-77, 9], [-79, 3],
  ],
  Africa: [
    [-17, 15], [-17, 21], [-13, 27], [-6, 32], [0, 35], [8, 37], [11, 34], [17, 32],
    [25, 32], [32, 31], [34, 28], [36, 22], [38, 17], [43, 12], [48, 12], [51, 11],
    [48, 5], [43, 0], [41, -6], [40, -11], [39, -16], [35, -21], [33, -26], [30, -31],
    [25, -34], [21, -34], [17, -29], [13, -23], [12, -17], [10, -8], [9, -1], [9, 4],
    [6, 5], [0, 5], [-5, 5], [-10, 6], [-14, 11],
  ],
  Eurasia: [
    [-10, 36], [-9, 39], [-9, 43], [-4, 44], [-1, 46], [2, 48], [4, 50], [8, 53],
    [9, 55], [11, 58], [13, 60], [18, 63], [20, 66], [21, 70], [26, 71], [32, 70],
    [38, 68], [45, 68], [52, 69], [60, 70], [67, 72], [73, 73], [80, 74], [88, 76],
    [96, 77], [105, 77], [110, 75], [115, 73], [122, 73], [128, 72], [135, 72],
    [141, 72], [148, 71], [155, 70], [162, 69], [168, 68], [174, 66], [178, 65],
    [173, 62], [170, 60], [165, 59], [160, 58], [157, 54], [155, 50], [148, 46],
    [143, 44], [138, 44], [133, 43], [130, 38], [127, 35], [123, 32], [122, 30],
    [121, 26], [120, 22], [116, 21], [109, 19], [107, 14], [104, 9], [101, 4],
    [100, 6], [99, 11], [98, 15], [95, 16], [93, 19], [89, 22], [87, 20], [84, 19],
    [80, 16], [77, 9], [75, 12], [73, 17], [71, 20], [68, 23], [64, 25], [60, 25],
    [57, 25], [53, 26], [50, 27], [48, 25], [45, 23], [44, 18], [44, 12], [48, 13],
    [43, 20], [38, 24], [35, 28], [33, 30], [31, 31], [29, 36], [26, 38], [23, 38],
    [20, 40], [16, 40], [13, 44], [10, 44], [5, 43], [2, 41], [-2, 39], [-6, 37],
  ],
  Australia: [
    [113, -22], [113, -26], [115, -31], [118, -35], [123, -34], [129, -32], [133, -32],
    [137, -35], [140, -38], [144, -38], [148, -37], [151, -33], [153, -29], [153, -25],
    [148, -20], [146, -19], [143, -14], [142, -11], [139, -12], [136, -12], [132, -12],
    [130, -12], [127, -14], [124, -16], [122, -18], [117, -20],
  ],
  'New Zealand': [[166, -46], [171, -44], [174, -41], [178, -38], [176, -35], [173, -37], [170, -41], [167, -44]],
  Japan: [[130, 31], [135, 34], [139, 35], [141, 39], [143, 43], [145, 44], [142, 45], [139, 41], [136, 36], [131, 33]],
  Britain: [[-5, 50], [1, 51], [2, 53], [-1, 56], [-3, 58], [-5, 58], [-6, 55], [-5, 52]],
  Madagascar: [[43, -12], [48, -14], [50, -18], [50, -25], [46, -25], [44, -21], [43, -16]],
};

const RINGS = [
  { lat: 66.5, label: '66.5°N' },
  { lat: 23.5, label: '23.5°N' },
  { lat: 0, label: 'Equator' },
  { lat: -23.5, label: '23.5°S' },
  { lat: -66.5, label: '66.5°S' },
];

const CITIES: Array<{ name: string; lon: number; lat: number }> = [
  { name: 'Sydney', lon: 151.2, lat: -33.9 },
  { name: 'Santiago', lon: -70.7, lat: -33.4 },
  { name: 'Perth', lon: 115.9, lat: -32.0 },
  { name: 'Johannesburg', lon: 28.0, lat: -26.2 },
  { name: 'Buenos Aires', lon: -58.4, lat: -34.6 },
  { name: 'Cape Town', lon: 18.4, lat: -33.9 },
];

const ROUTES: Array<[string, string]> = [
  ['Sydney', 'Santiago'],
  ['Johannesburg', 'Perth'],
  ['Buenos Aires', 'Cape Town'],
];

/** Arc path spanning a longitude range at one latitude. */
function arcAt(lat: number, lonFrom: number, lonTo: number): string {
  const steps = 48;
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const lon = lonFrom + ((lonTo - lonFrom) * i) / steps;
    return project(lon, lat).map((n) => n.toFixed(1)).join(',');
  });
  return `M ${points.join(' L ')}`;
}

export function IceWallMap() {
  const [graticule, setGraticule] = useState(true);
  const [iceRim, setIceRim] = useState(true);
  const [gauge, setGauge] = useState(false);
  const [routes, setRoutes] = useState(false);

  const cityByName = new Map(CITIES.map((city) => [city.name, city]));

  // Both spans cover 36 degrees of longitude, one at 32°N and one at 32°S.
  const northRadius = ((90 - 32) / 180) * R_RIM;
  const southRadius = ((90 + 32) / 180) * R_RIM;
  const spanRatio = southRadius / northRadius;

  return (
    <DiagramFrame
      title="The plane on an azimuthal equidistant layout"
      caption="North pole at the centre, every degree of latitude the same distance outward, and what we call Antarctica becomes a ring of ice around the whole rim."
      controls={
        <>
          <button
            type="button"
            onClick={() => setGraticule((v) => !v)}
            aria-pressed={graticule}
            className={`diagram-btn ${graticule ? 'diagram-btn-active' : ''}`}
          >
            <Grid3x3 className="h-3.5 w-3.5" /> Graticule
          </button>
          <button
            type="button"
            onClick={() => setIceRim((v) => !v)}
            aria-pressed={iceRim}
            className={`diagram-btn ${iceRim ? 'diagram-btn-active' : ''}`}
          >
            <Snowflake className="h-3.5 w-3.5" /> Ice rim
          </button>
          <button
            type="button"
            onClick={() => setGauge((v) => !v)}
            aria-pressed={gauge}
            className={`diagram-btn ${gauge ? 'diagram-btn-gold' : ''}`}
          >
            <Ruler className="h-3.5 w-3.5" /> Longitude gauge
          </button>
          <button
            type="button"
            onClick={() => setRoutes((v) => !v)}
            aria-pressed={routes}
            className={`diagram-btn ${routes ? 'diagram-btn-active' : ''}`}
          >
            <PlaneTakeoff className="h-3.5 w-3.5" /> Southern routes
          </button>
        </>
      }
      readout={
        gauge ? (
          <>
            <Readout label="36° at 32°N" value="short span" accent="glow" />
            <Readout label="36° at 32°S" value={`${spanRatio.toFixed(1)}× longer`} accent="gold" />
          </>
        ) : null
      }
      legend={[
        { label: 'Land', color: '#3f5a7a' },
        { label: 'Ice rim', color: '#d8f3ff' },
        { label: 'Southern routes', color: '#38e0ff' },
      ]}
      footnote="Outlines are coarse, and the 2.1× figure is what this projection itself produces for two equal longitude spans north and south of the equator."
    >
      <div className="mx-auto max-w-[500px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full"
          role="img"
          aria-label="Azimuthal equidistant map with the north pole at the centre and a continuous ring of ice at the outer rim."
        >
          <defs>
            <radialGradient id="iw-ocean">
              <stop offset="0%" stopColor="#0e2138" />
              <stop offset="70%" stopColor="#0c1a2c" />
              <stop offset="100%" stopColor="#081522" />
            </radialGradient>
            <radialGradient id="iw-ice" cx="50%" cy="50%" r="50%">
              <stop offset="88%" stopColor="#d8f3ff" stopOpacity="0" />
              <stop offset="96%" stopColor="#d8f3ff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
            </radialGradient>
            <clipPath id="iw-clip">
              <circle cx={CX} cy={CY} r={R_RIM} />
            </clipPath>
          </defs>

          <rect width={SIZE} height={SIZE} fill="#04060d" rx="14" />
          <circle cx={CX} cy={CY} r={R_RIM} fill="url(#iw-ocean)" />

          <g clipPath="url(#iw-clip)">
            {graticule && (
              <g>
                {Array.from({ length: 24 }, (_, i) => {
                  const lon = -180 + i * 15;
                  const [x, y] = project(lon, -90);
                  return <line key={lon} x1={CX} y1={CY} x2={x} y2={y} stroke="#1b2540" strokeWidth="0.9" />;
                })}
                {RINGS.map((ring) => (
                  <circle
                    key={ring.lat}
                    cx={CX}
                    cy={CY}
                    r={((90 - ring.lat) / 180) * R_RIM}
                    fill="none"
                    stroke="#26334f"
                    strokeWidth="1"
                    strokeDasharray={ring.lat === 0 ? undefined : '4 6'}
                  />
                ))}
              </g>
            )}

            {Object.entries(LANDMASSES).map(([name, coords]) => (
              <path
                key={name}
                d={toPath(coords)}
                fill="#4c6d99"
                fillOpacity="0.92"
                stroke="#93b2d6"
                strokeWidth="0.9"
                strokeLinejoin="round"
              />
            ))}

            {gauge && (
              <g>
                <path d={arcAt(32, -110, -74)} fill="none" stroke="#38e0ff" strokeWidth="4" strokeLinecap="round" />
                <path d={arcAt(-32, 116, 152)} fill="none" stroke="#f5c451" strokeWidth="4" strokeLinecap="round" />
                <text
                  {...(() => {
                    const [x, y] = project(-92, 32);
                    return { x, y: y - 8 };
                  })()}
                  textAnchor="middle"
                  className="fill-glow-300 text-[10px] font-semibold"
                >
                  36° at 32°N
                </text>
                <text
                  {...(() => {
                    const [x, y] = project(134, -32);
                    return { x, y: y - 16 };
                  })()}
                  textAnchor="middle"
                  className="fill-gold-400 text-[10px] font-semibold"
                >
                  36° at 32°S
                </text>
              </g>
            )}

            {routes && (
              <g>
                {ROUTES.map(([from, to]) => {
                  const a = cityByName.get(from)!;
                  const b = cityByName.get(to)!;
                  const [x1, y1] = project(a.lon, a.lat);
                  const [x2, y2] = project(b.lon, b.lat);
                  return (
                    <line
                      key={`${from}-${to}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#38e0ff"
                      strokeWidth="1.8"
                      strokeDasharray="7 5"
                      strokeOpacity="0.9"
                    />
                  );
                })}
                {CITIES.map((city) => {
                  const [x, y] = project(city.lon, city.lat);
                  return (
                    <g key={city.name}>
                      <circle cx={x} cy={y} r="3.2" fill="#38e0ff" />
                      <text x={x + 6} y={y + 3} className="fill-glow-300 text-[9px]">
                        {city.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>

          {iceRim && (
            <>
              <circle cx={CX} cy={CY} r={R_RIM} fill="url(#iw-ice)" />
              <circle cx={CX} cy={CY} r={R_RIM - 1} fill="none" stroke="#d8f3ff" strokeWidth="2" strokeOpacity="0.8" />
              {Array.from({ length: 72 }, (_, i) => {
                const a = (i / 72) * Math.PI * 2;
                const inner = R_RIM - 13;
                return (
                  <line
                    key={i}
                    x1={CX + inner * Math.sin(a)}
                    y1={CY - inner * Math.cos(a)}
                    x2={CX + R_RIM * Math.sin(a)}
                    y2={CY - R_RIM * Math.cos(a)}
                    stroke="#d8f3ff"
                    strokeWidth="1"
                    strokeOpacity="0.35"
                  />
                );
              })}
            </>
          )}

          <circle cx={CX} cy={CY} r={R_RIM} fill="none" stroke="#2a3a5c" strokeWidth="1.5" />

          {/* Centre marker. */}
          <circle cx={CX} cy={CY} r="4" fill="#f5c451" />
          <text x={CX + 8} y={CY + 4} className="fill-gold-400 text-[10px] font-semibold">
            North pole
          </text>

          {graticule &&
            RINGS.map((ring) => (
              <text
                key={ring.lat}
                x={CX - 6}
                y={CY + ((90 - ring.lat) / 180) * R_RIM - 5}
                textAnchor="end"
                className="fill-steel-300 text-[9px]"
                stroke="#04060d"
                strokeWidth="2.5"
                paintOrder="stroke"
              >
                {ring.label}
              </text>
            ))}

          {iceRim && (
            <text x={CX} y={CY + R_RIM + 18} textAnchor="middle" className="fill-ice text-[11px] font-semibold">
              ice rim — what lies past it is unknown
            </text>
          )}
        </svg>
      </div>
    </DiagramFrame>
  );
}
