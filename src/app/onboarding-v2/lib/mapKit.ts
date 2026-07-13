// ─── Map kit for Onboarding v2 ────────────────────────────────────────────────
// Self-contained Leaflet helpers adapted from v1's WorldMap. Keeps the proven
// dark tile layer, pulsating pin, and pin-color logic without depending on v1.

import { ENTRANCE_TIMING, sec } from "./entranceTiming";

export type PinStatus = "unprotected" | "connecting" | "protected";

export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const COLORS: Record<PinStatus, string> = {
  unprotected: "#F7607B",
  connecting: "#8882A0",
  protected: "#2CFFCC",
};

export const PIN_CSS = `
  @keyframes ulp2-pulse {
    0%, 100% { transform: scale(0.96); }
    50%      { transform: scale(1.04); }
  }
  @keyframes ob2-pin-in {
    0%   { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  .ob2-pin {
    background: transparent !important;
    border: none !important;
    overflow: visible !important;
    transition: opacity 0.6s ease-out;
  }
  .ob2-pin > div { overflow: visible !important; }
  .ob2-pin--hidden { opacity: 0 !important; }
`;

/** Soft outer radial ring that gently pulses (matches v1's Figma pin). */
function outerRing(color: string, opacity: string, pulseDelay = 0): string {
  return `<svg width="96" height="96" viewBox="0 0 96 96" fill="none"
    style="position:absolute;top:0;left:0;transform-origin:48px 48px;animation:ulp2-pulse 2.8s ease-in-out ${pulseDelay}s infinite;"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ob2rg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
        gradientTransform="translate(48 48) rotate(90) scale(48)">
        <stop offset="0.442708" stop-opacity="0"/>
        <stop offset="1"/>
      </radialGradient>
    </defs>
    <mask id="ob2m" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="96" height="96">
      <circle cx="48" cy="48" r="48" fill="url(#ob2rg)"/>
    </mask>
    <g mask="url(#ob2m)">
      <circle cx="48" cy="48" r="48" fill="${color}" fill-opacity="${opacity}"/>
    </g>
  </svg>`;
}

/**
 * Builds the 96×96 pulsating pin HTML for a given status.
 * When `entrance` is true, the pin springs in (scale 0→1 with overshoot) at
 * `pinAppear` and the pulsation ring only starts at `bracketsStart` so the
 * rings don't play while the pin is still scaling in.
 */
export function createPinHTML(status: PinStatus, entrance = false): string {
  const color = COLORS[status];
  const showPulse = status !== "connecting";
  const wrapperAnim = entrance
    ? `animation: ob2-pin-in ${sec(ENTRANCE_TIMING.pinSpringDuration)}s cubic-bezier(0.34,1.56,0.64,1) ${sec(ENTRANCE_TIMING.pinAppear)}s both;`
    : "";
  const pulseDelay = entrance ? sec(ENTRANCE_TIMING.bracketsStart) : 0;
  return `
    <div style="position:relative;width:96px;height:96px;pointer-events:none;${wrapperAnim}">
      ${showPulse ? outerRing(color, "0.5", pulseDelay) : ""}
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none"
        style="position:absolute;top:0;left:0;" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="ob2pf" x="32" y="33" width="32" height="32"
            filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="bg"/>
            <feColorMatrix in="SourceAlpha" type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="1"/>
            <feGaussianBlur stdDeviation="2"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0"/>
            <feBlend mode="normal" in2="bg" result="shadow"/>
            <feBlend mode="normal" in="SourceGraphic" in2="shadow" result="shape"/>
          </filter>
        </defs>
        <g filter="url(#ob2pf)"><circle cx="48" cy="48" r="12" fill="white"/></g>
        <circle cx="48" cy="48.1875" r="6" fill="${color}"/>
      </svg>
    </div>
  `;
}
