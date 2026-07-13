/**
 * Centralized timing config for the onboarding → main app transition.
 * All values are in milliseconds unless noted.
 * Change values here to tune the whole sequence.
 */
export const TRANSITION_TIMING = {
  /** Onboarding welcome content fades + scales out */
  contentExit: { start: 0, duration: 400 },
  /** Map crossfade: OnboardingV2 overlay fades to transparent */
  mapCrossfade: { start: 0, duration: 500 },
  /** Connection card (top → slides down) */
  connectionCard: { start: 900, duration: 500 },
  /** Connection details (bottom → slides up) */
  connectionDetails: { start: 1150, duration: 500 },
  /** Right feature rail (right → slides left) */
  featureRail: { start: 1400, duration: 500 },
  /** Left panel (left → slides right) — handled externally in App.tsx */
  leftPanel: { start: 1650, duration: 500 },
} as const;

/** Framer-friendly delay in seconds from a TRANSITION_TIMING entry start (ms). */
export function delaySec(startMs: number): number {
  return startMs / 1000;
}
