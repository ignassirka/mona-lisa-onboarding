import { motion } from "motion/react";

// Organic, enveloping "force field" aura that wraps the user's pin on the
// Protected screen. The calm, fluid counterpart to TargetingReticle — same
// footprint (200×200 viewBox) and craft, opposite mood. Teal palette only.

const TEAL = "#2CFFCC";
const C = 100;
const DISPLAY = 230;

/** Polar → cartesian. deg measured clockwise from the top (12 o'clock). */
function pt(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

/** SVG arc path from startDeg to endDeg (clockwise) on radius r. */
function arcPath(r: number, startDeg: number, endDeg: number): string {
  const [x1, y1] = pt(r, startDeg);
  const [x2, y2] = pt(r, endDeg);
  const large = Math.abs(endDeg - startDeg) % 360 > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

const AURA_CSS = `
  @keyframes aura-cw  { to { transform: rotate(360deg); } }
  @keyframes aura-ccw { to { transform: rotate(-360deg); } }
  @keyframes aura-arc-breathe { 0%,100% { opacity: 0.5; } 50% { opacity: 0.8; } }
  @keyframes aura-halo { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
  @keyframes aura-pdrift { 0%,100% { transform: translateY(0); opacity: 0.15; } 50% { transform: translateY(4px); opacity: 0.4; } }
  @keyframes aura-chev-up    { 0%,100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-2px); opacity: 0.25; } }
  @keyframes aura-chev-right { 0%,100% { transform: translateX(0); opacity: 0.4; } 50% { transform: translateX(2px); opacity: 0.25; } }
  @keyframes aura-chev-down  { 0%,100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(2px); opacity: 0.25; } }
  @keyframes aura-chev-left  { 0%,100% { transform: translateX(0); opacity: 0.4; } 50% { transform: translateX(-2px); opacity: 0.25; } }
  @keyframes aura-shimmer {
    0%   { transform: rotate(0deg);   opacity: 0.2; }
    8%   { opacity: 0.5; }
    38%  { transform: rotate(165deg); opacity: 0.5; }
    48%  { transform: rotate(180deg); opacity: 0.2; }
    62%  { transform: rotate(180deg); opacity: 0.2; }
    70%  { opacity: 0.5; }
    95%  { transform: rotate(350deg); opacity: 0.5; }
    100% { transform: rotate(360deg); opacity: 0.2; }
  }
  .aura-origin { transform-box: view-box; transform-origin: 100px 100px; }
`;

// ── Layer 1: 4 shield arcs (60°, 30° gaps) ──
const L1_ARCS = [0, 90, 180, 270].map((s, i) => ({ d: arcPath(90, s, s + 60), delay: i * 1.25 }));
// ── Layer 2: 3 inner arcs (40°) ──
const L2_ARCS = [0, 120, 240].map((s) => arcPath(68, s, s + 40));
// ── Layer 6: chevrons pointing OUTWARD at cardinal points ──
const CHEVRONS = [
  { d: "M95,52 L100,47 L105,52", anim: "aura-chev-up", delay: 0 },
  { d: "M148,95 L153,100 L148,105", anim: "aura-chev-right", delay: 0.75 },
  { d: "M95,148 L100,153 L105,148", anim: "aura-chev-down", delay: 1.5 },
  { d: "M52,95 L47,100 L52,105", anim: "aura-chev-left", delay: 2.25 },
];
// ── Layer 5: drifting particles (varied orbit speed / radius / phase) ──
const PARTICLES = [
  { r: 60, size: 2.4, dur: 14, drift: 5, phase: 0.0, delay: 0 },
  { r: 64, size: 1.8, dur: 17, drift: 6, phase: 0.14, delay: 0.6 },
  { r: 58, size: 2.8, dur: 12, drift: 4, phase: 0.28, delay: 1.2 },
  { r: 66, size: 2.0, dur: 18, drift: 7, phase: 0.42, delay: 0.3 },
  { r: 62, size: 2.2, dur: 15, drift: 5, phase: 0.56, delay: 1.5 },
  { r: 59, size: 1.6, dur: 13, drift: 4, phase: 0.70, delay: 0.9 },
  { r: 65, size: 2.6, dur: 16, drift: 6, phase: 0.85, delay: 2.0 },
];
const SHIMMER = arcPath(90, -12.5, 12.5);

export default function ShieldAura({ x, y, visible }: { x: number; y: number; visible: boolean }) {
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
        filter: "drop-shadow(0 0 8px rgba(44,255,204,0.35))",
      }}
      initial={{ opacity: 0, scale: 0.82 }}
      animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={visible ? { delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] } : { duration: 0.3 }}
    >
      <svg width={DISPLAY} height={DISPLAY} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{AURA_CSS}</style>
        <defs>
          <filter id="aura-halo-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="aura-shimmer-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Layer 4: breathing halo (blurred ring) */}
        <circle
          className="aura-origin"
          cx={C}
          cy={C}
          r={76}
          stroke={TEAL}
          strokeOpacity={0.18}
          strokeWidth={4}
          filter="url(#aura-halo-blur)"
          style={{ animation: "aura-halo 6s ease-in-out infinite" }}
        />

        {/* Layer 5: drifting particles */}
        {PARTICLES.map((p, i) => (
          <g
            key={i}
            className="aura-origin"
            style={{ animation: `aura-cw ${p.dur}s linear ${-(p.dur * p.phase).toFixed(2)}s infinite` }}
          >
            <circle
              cx={C}
              cy={C - p.r}
              r={p.size}
              fill={TEAL}
              style={{ animation: `aura-pdrift ${p.drift}s ease-in-out ${p.delay}s infinite` }}
            />
          </g>
        ))}

        {/* Layer 3: encryption dotted rings (overlapping → moiré shimmer) */}
        <circle
          className="aura-origin"
          cx={C}
          cy={C}
          r={58}
          stroke={TEAL}
          strokeOpacity={0.25}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="0.01 4.545"
          style={{ animation: "aura-cw 15s linear infinite" }}
        />
        <circle
          className="aura-origin"
          cx={C}
          cy={C}
          r={58}
          stroke={TEAL}
          strokeOpacity={0.22}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="0.01 4.545"
          strokeDashoffset={2.27}
          style={{ animation: "aura-ccw 18s linear infinite" }}
        />

        {/* Layer 2: counter-rotating inner arcs */}
        <g className="aura-origin" style={{ animation: "aura-ccw 35s linear infinite" }}>
          {L2_ARCS.map((d) => (
            <path key={d} d={d} stroke={TEAL} strokeOpacity={0.35} strokeWidth={1.5} strokeLinecap="round" fill="none" />
          ))}
        </g>

        {/* Layer 6: outward shield chevrons */}
        {CHEVRONS.map((ch) => (
          <path
            key={ch.d}
            d={ch.d}
            stroke={TEAL}
            strokeOpacity={0.4}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ transformBox: "fill-box", transformOrigin: "center", animation: `${ch.anim} 3s ease-in-out ${ch.delay}s infinite` }}
          />
        ))}

        {/* Layer 1: outer shield arcs (slow CW, each breathing) */}
        <g className="aura-origin" style={{ animation: "aura-cw 25s linear infinite" }}>
          {L1_ARCS.map((a) => (
            <path
              key={a.d}
              d={a.d}
              stroke={TEAL}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              style={{ animation: `aura-arc-breathe 5s ease-in-out ${a.delay}s infinite` }}
            />
          ))}
        </g>

        {/* Layer 7: ambient shimmer (organic drift + pause) */}
        <g className="aura-origin" style={{ animation: "aura-shimmer 10s ease-in-out infinite" }}>
          <path d={SHIMMER} stroke={TEAL} strokeWidth={2.5} strokeLinecap="round" fill="none" filter="url(#aura-shimmer-glow)" />
        </g>
      </svg>
    </motion.div>
  );
}
