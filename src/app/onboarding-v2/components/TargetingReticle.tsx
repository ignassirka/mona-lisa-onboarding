import { motion } from "motion/react";
import { ENTRANCE_TIMING, sec } from "../lib/entranceTiming";

// Futuristic sci-fi targeting reticle that frames the user's pin on the
// Unprotected screen. Pure-SVG, multi-layered, with continuous CSS animations.
// Everything is in the danger/coral palette (#F7607B) to match the pin.

const CORAL = "#F7607B";
const C = 100; // viewBox centre
const DISPLAY = 230; // rendered px size
const SNAP_EASE = [0.34, 1.56, 0.64, 1] as const;

/** Polar → cartesian. deg measured clockwise from the top (12 o'clock). */
function pt(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

const RETICLE_CSS = `
  @keyframes ret-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
  @keyframes ret-cw  { to { transform: rotate(360deg); } }
  @keyframes ret-ccw { to { transform: rotate(-360deg); } }
  @keyframes ret-tick { 0%,100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  @keyframes ret-arrow { 0%,100% { transform: scale(0.85); } 50% { transform: scale(1); } }
  .ret-spin-origin { transform-box: view-box; transform-origin: 100px 100px; }
  .ret-breathe { animation: ret-breathe 4s ease-in-out infinite; }
  .ret-outer   { animation: ret-cw 20s linear infinite; }
  .ret-inner   { animation: ret-ccw 30s linear infinite; }
  .ret-tickring{ animation: ret-cw 60s linear infinite; }
  .ret-scan    { animation: ret-cw 6s linear infinite; }
  .ret-tickmark{ animation: ret-tick 3s ease-in-out infinite; }
  .ret-arrow   { transform-box: fill-box; transform-origin: center; animation: ret-arrow 2.5s ease-in-out infinite; }
`;

// ── Layer 1: corner brackets (refined L-shapes) ──
const BRACKETS = [
  "M28,48 L28,28 L48,28",
  "M152,28 L172,28 L172,48",
  "M28,152 L28,172 L48,172",
  "M152,172 L172,172 L172,152",
];

// ── Layer 2: crosshair lines + measurement ticks ──
const CROSS_DEGS = [0, 90, 180, 270];
const CROSS_R0 = 14;
const CROSS_R1 = 58;
const CROSS_TICK_RS = [30, 44];

function crosshairTick(r: number, deg: number, idx: number) {
  const [cx, cy] = pt(r, deg);
  const a = ((deg - 90) * Math.PI) / 180 + Math.PI / 2; // perpendicular
  const dx = 3 * Math.cos(a);
  const dy = 3 * Math.sin(a);
  // Staggered ripple outward from centre
  const delay = (idx * 0.4).toFixed(2);
  return (
    <line
      key={`${deg}-${r}`}
      x1={cx - dx}
      y1={cy - dy}
      x2={cx + dx}
      y2={cy + dy}
      stroke={CORAL}
      strokeWidth={1}
      className="ret-tickmark"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

// ── Layer 5: graduated tick ring (60 marks, every 5th longer) ──
const TICK_RING = Array.from({ length: 60 }, (_, i) => {
  const deg = i * 6;
  const long = i % 5 === 0;
  const r0 = long ? 51 : 53;
  const r1 = long ? 61 : 59;
  const [x1, y1] = pt(r0, deg);
  const [x2, y2] = pt(r1, deg);
  return { x1, y1, x2, y2, key: i };
});

// ── Layer 6: directional triangles (point inward) ──
const ARROWS = [
  { points: "96,52 104,52 100,57", delay: 0 },
  { points: "148,96 148,104 143,100", delay: 0.6 },
  { points: "96,148 104,148 100,143", delay: 1.2 },
  { points: "52,96 52,104 57,100", delay: 1.8 },
];

// ── Layer 7: scan arc geometry (near the top, on the outer ring) ──
const SCAN_START = pt(68, -18);
const SCAN_END = pt(68, 18);

export default function TargetingReticle({ x, y, visible }: { x: number; y: number; visible: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-[40]"
      style={{
        left: x,
        top: y,
        width: DISPLAY,
        height: DISPLAY,
        marginLeft: -DISPLAY / 2,
        marginTop: -DISPLAY / 2,
        filter: "drop-shadow(0 0 6px rgba(247,96,123,0.4))",
      }}
      initial={{ opacity: 0, scale: 0.82 }}
      animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={
        visible
          ? { delay: sec(ENTRANCE_TIMING.bracketsStart), duration: 0.6, ease: SNAP_EASE }
          : { duration: 0.25 }
      }
    >
      <svg width={DISPLAY} height={DISPLAY} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{RETICLE_CSS}</style>
        <defs>
          <linearGradient id="ret-scan-grad" gradientUnits="userSpaceOnUse" x1={SCAN_START[0]} y1={SCAN_START[1]} x2={SCAN_END[0]} y2={SCAN_END[1]}>
            <stop offset="0" stopColor={CORAL} stopOpacity="0" />
            <stop offset="1" stopColor={CORAL} stopOpacity="0.7" />
          </linearGradient>
          <filter id="ret-scan-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Layer 5: graduated tick ring */}
        <g className="ret-spin-origin ret-tickring">
          {TICK_RING.map((t) => (
            <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={CORAL} strokeOpacity={0.2} strokeWidth={0.8} />
          ))}
        </g>

        {/* Layer 4: inner counter-rotating dashed ring */}
        <circle
          className="ret-spin-origin ret-inner"
          cx={C}
          cy={C}
          r={46}
          stroke={CORAL}
          strokeOpacity={0.25}
          strokeWidth={1}
          strokeDasharray="5 7"
        />

        {/* Layer 3: outer rotating dashed ring */}
        <circle
          className="ret-spin-origin ret-outer"
          cx={C}
          cy={C}
          r={68}
          stroke={CORAL}
          strokeOpacity={0.3}
          strokeWidth={1}
          strokeDasharray="4 6.6"
        />

        {/* Layer 2: crosshair lines + ticks */}
        <g>
          {CROSS_DEGS.map((deg) => {
            const [x0, y0] = pt(CROSS_R0, deg);
            const [x1, y1] = pt(CROSS_R1, deg);
            return <line key={deg} x1={x0} y1={y0} x2={x1} y2={y1} stroke={CORAL} strokeOpacity={0.4} strokeWidth={1} />;
          })}
          {CROSS_DEGS.flatMap((deg) => CROSS_TICK_RS.map((r, idx) => crosshairTick(r, deg, idx)))}
        </g>

        {/* Layer 6: directional triangles */}
        {ARROWS.map((a) => (
          <polygon
            key={a.points}
            className="ret-arrow"
            points={a.points}
            fill={CORAL}
            fillOpacity={0.5}
            style={{ animationDelay: `${a.delay}s` }}
          />
        ))}

        {/* Layer 7: orbiting scan highlight */}
        <g className="ret-spin-origin ret-scan">
          <path
            d={`M${SCAN_START[0]},${SCAN_START[1]} A68 68 0 0 1 ${SCAN_END[0]},${SCAN_END[1]}`}
            stroke="url(#ret-scan-grad)"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            filter="url(#ret-scan-glow)"
          />
        </g>

        {/* Layer 1: corner brackets (breathing) */}
        <g className="ret-spin-origin ret-breathe">
          {BRACKETS.map((d) => (
            <path key={d} d={d} stroke={CORAL} strokeWidth={2} strokeLinecap="round" fill="none" />
          ))}
        </g>
      </svg>
    </motion.div>
  );
}
