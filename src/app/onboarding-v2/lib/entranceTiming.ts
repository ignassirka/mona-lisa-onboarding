// ─── Unprotected-screen entrance choreography ────────────────────────────────
// Single source of truth for the cinematic "surveillance lock-on" intro.
// All values in milliseconds, relative to component mount (T=0).
// Tune the whole sequence here without touching animation code.

export const ENTRANCE_TIMING = {
  mapZoomStart: 0,
  mapZoomDuration: 3500,
  gradientFadeStart: 500,
  gradientFadeDuration: 1500,
  pinAppear: 1500,
  pinSpringDuration: 500,
  bracketsStart: 2000,
  bracketStagger: 100,
  padlockAppear: 2500,
  headlineAppear: 2800,
  subtextAppear: 3100,
  infoCardAppear: 3200,
  infoRowBase: 3400,
  infoRowStagger: 150,
  ctaAppear: 4000,
  totalSequence: 4500,
} as const;

/** Convenience: milliseconds → seconds (Framer Motion uses seconds). */
export const sec = (ms: number): number => ms / 1000;
