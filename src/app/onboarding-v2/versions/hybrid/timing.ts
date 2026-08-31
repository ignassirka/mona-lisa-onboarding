/** Centralized timing for "Hybrid" (ms unless noted). Tunable.
 *
 * Entrance order: map pin (the shared map's own zoom/gradient/pin/bracket
 * timing — `ENTRANCE_TIMING.pinAppear`/`bracketsStart`, unchanged) → location
 * chip → [beat] → activity card + CTA (together) → padlock icon → title →
 * subtext. The chip→footer beat is Hybrid's causal Act 1 sequence; icon/
 * title/subtext run in parallel with it. */
export const HYBRID_TIMING = {
  // ── Opening entrance (Act 1) ──
  chipAppear: 2300, // chip fades in once the pin + reticle brackets have settled
  chipEntranceDuration: 500, // LocationChip fade/slide duration — chip is "settled" after this
  beatAfterChipSettle: 450, // pause after chip settles before the footer group (causal beat)
  padlockAppear: 2700, // padlock icon, after the chip
  headlineAppear: 3000, // title
  subtextAppear: 3300, // subtitle
  /** chipAppear + chipEntranceDuration + beatAfterChipSettle */
  cardsStart: 3250, // activity card — after chip settles + beat
  cardStagger: 175, // legacy stagger slot (single cycling card uses index 0 only)
  /** Same beat as `cardsStart` — card + CTA enter together. */
  ctaAppear: 3250,

  // ── Act 2 — connecting transforms (chip scrambles; card labels redact) ──
  chipScrambleDelay: 200, // chip scramble begins this long after connecting starts
  chipScrambleDuration: 600,
  cardsRedactDelay: 300, // first card label redaction begins this long after connecting starts
  cardRedactStagger: 250, // gap between each card's label redaction (oldest-first)

} as const;

/** Convenience: milliseconds → seconds (Framer Motion uses seconds). */
export const sec = (ms: number): number => ms / 1000;
