/** Centralized timing (ms) for the "Personalized JTBD tuning" result step —
 * shared, unmodified, across all 4 layouts (Stacked / Split by Status / Card
 * Grid / Compact List) so switching layouts never changes pacing, only
 * arrangement. Originates from the former "Visual Tuning" version's timing;
 * consolidated here as this is now THE stage, not one alternative among
 * several.
 *
 * Header intro sequence (all mount-relative): the header block fades in
 * (`introFadeIn`) and holds centered until `centerHold`, then travels to its
 * top position over `moveToTop`, during which the loader icon crossfades
 * into the JTBD category icon (`iconCrossfade`) and the subtext crossfades
 * to the live counter. Rows begin only once the block has landed, i.e. at
 * `centerHold + moveToTop`.
 *
 * Per item: Phase 1 (narrated spinner) holds for `spinnerHold`, then Phase 2
 * (resolve) plays over `resolveDuration`; the next item's Phase 1 begins
 * `rowGap` after the current item finishes resolving. The free/paid boundary
 * element (a layout-specific widget — divider+header, a column header, or
 * nothing for Card Grid's plain row separation) gets an extra `boundaryIn +
 * rowGap` pause before the first paid item begins, so the beat is felt
 * consistently even by layouts that render nothing visible there.
 *
 * Completion: once the last item resolves, the title crossfades
 * (`titleCompleteCrossfade`) to its finished form and the subtext
 * (`subtextCrossfade`) to the summary; Continue fades in after
 * `continueGapAfterTip` more (no tip anywhere in this step — removed across
 * all 4 layouts). */
export const TUNED_RESULT_TIMING = {
  introFadeIn: 300,
  centerHold: 2000,
  moveToTop: 600,
  iconCrossfade: 600,
  reducedIntroHold: 500,
  spinnerHold: 1000,
  resolveDuration: 300,
  rowGap: 200,
  boundaryIn: 300,
  continueGapAfterTip: 200,
  continueIn: 300,
  titleCompleteCrossfade: 300,
  subtextCrossfade: 250,

  // ── Stage 3 ("Upgrade to Plus" → VPN Plus Welcome) — the locked→unlocked
  // transition on the result's 2 Plus items, reused as-is across all 4
  // layouts via `TransformingPaidCell`. Centralized here (previously local
  // consts inside `PlusWelcomeState.tsx`) — unchanged values, just moved so
  // every layout shares the exact same choreography. ──
  /** When the 2 Plus items start transforming from locked to unlocked. */
  unlockSettleDelay: 600,
  /** When the confetti burst begins (after the entrance fade settles). */
  unlockConfettiDelay: 400,
  /** How long the "Just unlocked" chip stays visible once it appears. */
  unlockChipFadeMs: 4000,
  /** Stagger between the 2 Plus items' transform start. */
  unlockTransformStagger: 200,
} as const;

/** Convenience: milliseconds → seconds (Framer Motion uses seconds). */
export const sec = (ms: number): number => ms / 1000;
