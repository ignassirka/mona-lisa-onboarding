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
 * into the JTBD category icon (`iconCrossfade`) — or, in Multiple mode
 * with 2+ selections, into a row of those same picker icons with per-icon
 * stagger (`iconRowStagger`) — and the subtext crossfades
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
  /** Per-icon left-to-right stagger within the Multiple-mode icon-row
   * crossfade (layered inside `iconCrossfade`). Disabled when
   * `prefers-reduced-motion` is active. */
  iconRowStagger: 70,
  reducedIntroHold: 500,
  spinnerHold: 1000,
  resolveDuration: 300,
  rowGap: 200,
  boundaryIn: 300,
  continueGapAfterTip: 200,
  continueIn: 300,
  titleCompleteCrossfade: 300,
  subtextCrossfade: 250,

  // ── Multiple mode ("Selection" prototype control) pacing guard — the
  // merged free list can exceed the single-mode fixed 2 rows, though with
  // only 2 unique settings (`"Protocol"` / `"Kill Switch"`) across all 6
  // JTBDs it now never actually exceeds 2 either; past
  // `pacingGuardRowThreshold` total rows, `spinnerHold` is compressed to
  // `spinnerHoldCompressed` so total passive materialization time stays
  // under ~12s. Single mode's totalRows is always 4 (2 enabled + 2 paid),
  // so this never activates there — purely additive. ──
  pacingGuardRowThreshold: 6,
  spinnerHoldCompressed: 700,

  // ── Multiple mode result curation — display caps for the FREE and PLUS
  // sections (see `lib/jtbdMerge.ts` → `rankFreeSettings`/`rankPaidFeatures`/
  // `capList`). The merged/deduped FREE union now maxes out at 2 unique
  // settings (`"Protocol"` / `"Kill Switch"`, see `JTBD_TUNING_RESULT`),
  // well under `freeRowCap`; the PAID union can still be as large as 12
  // features across 6 selected JTBDs. Capping the DISPLAYED rows
  // completion counts (`TunedResult.tsx`) still reflect the true,
  // uncapped totals — only what's shown is curated, never the numbers.
  // `paidFeatureCap` (1) + the profiles-summary row = 2 total Plus-section
  // rows, confirmed at checkpoint ("profile and something else depending on
  // the selection"). Neither section shows a "+more" overflow footnote
  // (confirmed at checkpoint) — anything beyond the caps is simply not
  // listed. The completion subtext (`TunedResult.tsx`) counts against these
  // same caps (the DISPLAYED rows), not the true merged-union totals —
  // confirmed at a checkpoint, superseding the original "always true
  // totals" rule: the count must match what's actually on screen. ──
  freeRowCap: 4,
  paidFeatureCap: 1,

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

/** Additional timing for the 3 alternative "tuning" concepts
 * (`tuned-result/concepts/*`) — purely presentational transition durations
 * for each concept's own distinctive body treatment (ring stroke, receipt
 * line drop). The shared ROW SCHEDULE itself (spinner hold, resolve,
 * boundary, row gap, Continue delay) stays `TUNED_RESULT_TIMING`,
 * unmodified and identical across the default and all 3 concepts — these
 * values only ever animate a value that has already resolved via that
 * shared schedule, never re-time the schedule itself. */
export const TUNING_CONCEPT_TIMING = {
  /** Progress-ring: how long the ring's stroke animates toward its new
   * percentage each time a row resolves. */
  ringFillMs: 500,
  /** Receipt: how long a newly-added line's drop-in animation takes. */
  lineDropMs: 300,
} as const;
