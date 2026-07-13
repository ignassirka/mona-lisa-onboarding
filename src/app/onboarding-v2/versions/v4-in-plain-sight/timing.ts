/** Centralized timing for V4 "In Plain Sight" (ms unless noted). Tunable.
 * Entrance order (unprotected act): padlock → title → subtitle → diary entries
 * (one by one) → CTA. */
export const V4_TIMING = {
  padlockAppear: 0, // padlock icon fade-in delay
  headlineAppear: 350, // main title fade-in delay
  subtextAppear: 700, // subtitle fade-in delay
  feedStart: 1250, // delay before the first diary entry appears (after subtitle settles)
  entryInterval: 1100, // cadence for entries 1–4 (slowed down)
  entrySlowInterval: 1900, // cadence for any entries beyond the initial fast batch
  typeSpeedMsPerChar: 42, // typewriter speed (slowed down)
  ctaAfterEntry: 5, // CTA appears once this many entries have appeared (5 = all, current entry count)
  redactionPerEntry: 600, // scramble duration per entry
  redactionStagger: 250, // delay between consecutive entry redactions
  gradientShift: 1500, // background gradient crossfade
  finalCardIn: 400, // "From now on…" seal card entrance
} as const;
