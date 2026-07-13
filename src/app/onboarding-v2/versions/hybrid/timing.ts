/** Centralized timing for "Hybrid" (ms unless noted). Tunable.
 *
 * Entrance order: map pin (the shared map's own zoom/gradient/pin/bracket
 * timing — `ENTRANCE_TIMING.pinAppear`/`bracketsStart`, unchanged) → location
 * chip → padlock icon → title → subtext → activity cards (one by one) → CTA.
 * Everything from the chip onward is Hybrid's own dedicated timeline (not
 * `ENTRANCE_TIMING`'s padlock/headline/subtext beats — those are reused by
 * v1/v2 in their own, different order, so Hybrid needs its own values to
 * reorder around the chip). */
export const HYBRID_TIMING = {
  // ── Opening entrance (Act 1) ──
  chipAppear: 2300, // chip fades in once the pin + reticle brackets have settled
  padlockAppear: 2700, // padlock icon, after the chip
  headlineAppear: 3000, // title
  subtextAppear: 3300, // subtitle
  cardsStart: 3700, // first activity card starts fading in, after the subtext settles
  cardStagger: 150, // gap between each activity card's entrance
  ctaAppear: 4450, // CTA button appears once the 3 cards have settled

  // ── Act 2 — connecting transforms (fire together, lightly staggered so
  // the "going dark" reads as one coordinated moment, not three separate ones) ──
  chipScrambleDelay: 200, // chip scramble begins this long after connecting starts
  chipScrambleDuration: 600,
  cardsRedactDelay: 300, // first card redaction begins this long after connecting starts
  cardRedactStagger: 250, // gap between each card's redaction (oldest-first)
  // Per-card redaction duration is NOT configurable here — `ActivityEntry`
  // (reused unchanged) hardcodes its own `V4_TIMING.redactionPerEntry`
  // (600ms), so `chipScrambleDuration` above is set to match it.

  // ── Safety net — no real connect service exists in this codebase to time
  // out (the simulated connect is a fixed ~3.2s delay), so this can't
  // currently fire; kept as a forward-looking safeguard. ──
  connectTimeoutMs: 15000,
} as const;

/** Convenience: milliseconds → seconds (Framer Motion uses seconds). */
export const sec = (ms: number): number => ms / 1000;
