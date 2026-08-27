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

/** Additional timing for the alternative "tuning" concepts
 * (`tuned-result/concepts/*`) — purely presentational transition durations
 * for each concept's own distinctive body treatment (ring stroke, receipt
 * line drop, rehearsal travel). The shared ROW SCHEDULE itself (spinner
 * hold, resolve, boundary, row gap, Continue delay) stays
 * `TUNED_RESULT_TIMING`, unmodified and identical across the default and
 * every concept — these values only ever animate something that has already
 * resolved via that shared schedule, or a POST-materialization interaction,
 * never the schedule itself. */
export const TUNING_CONCEPT_TIMING = {
  /** Progress-ring: how long the ring's stroke animates toward its new
   * percentage each time a row resolves. */
  ringFillMs: 500,
  /** Receipt: how long a newly-added line's drop-in animation takes. */
  lineDropMs: 300,

  // ── The profiles-first concepts (docs/specs/profiles-tuning/). All of
  // these time USER-TRIGGERED interactions that happen after the shared
  // materialization has finished, so none of them can affect the pacing a
  // user experiences on any other concept. ──

  /** "The Rehearsal" — one rehearsal plays destination-in
   * (`rehearseTravelMs`), then narration lines one at a time
   * (`rehearseStepMs` each), holds on the finished state
   * (`rehearseHoldMs`), then returns to the protected baseline
   * (`rehearseReturnMs`). The RETURN is as load-bearing as the rehearsal
   * itself: seeing protection come back is what makes experimenting feel
   * free rather than consequential, so it's never skipped for speed. Under
   * reduced motion the three narration steps collapse into one static
   * state, but the hold and the return still happen. */
  rehearseTravelMs: 700,
  rehearseStepMs: 900,
  rehearseHoldMs: 1200,
  rehearseReturnMs: 500,

  /** "The Deck" — card-to-card travel when paging between profiles. */
  deckSlideMs: 350,

  // ── "Profiles carousel" — each profile gets its own narrated "being
  // built" beat, same personalization illusion every settings row elsewhere
  // already has, just shaped as a card instead of a row. Cards resolve
  // strictly one at a time (never in parallel) so the labor actually reads
  // as labor rather than as a single decorative sweep; the two global
  // setting rows only start once every card has resolved. See
  // `useProfilesCarouselData`. ──

  /** How long one profile's spinner phase holds before it resolves. */
  carouselCardSpinnerMs: 2500,
  /** The crossfade into that profile's finished card. */
  carouselCardResolveMs: 300,
  /** Pause after one card resolves before the next card's spinner starts.
   * Sums with the two above to exactly 3000ms per profile — each profile
   * card takes 3 sec to generate. */
  carouselCardGapMs: 200,
  /** One global-setting row's rise-and-settle, once every card has
   * resolved. */
  carouselRowRiseMs: 420,
  /** How long a global-setting row sits visibly OFF before flipping itself
   * on. The pause is the point — a row that arrives already on has nothing
   * to show, whereas watching it flip is what makes it read as something
   * being done for you rather than a static list. */
  carouselToggleFlipMs: 380,
  /** Hover disclosure on a card: identity travelling up as the settings
   * open beneath it. */
  carouselHoverMs: 300,

  // ── Both "Profiles carousel v2" concepts (Plus-only and Free-only) — the
  // light band that passes diagonally through a card. Decorative in the
  // strict sense: it animates nothing the shared schedule owns, so neither
  // key can move a single beat of pacing. The loop runs entirely inside a
  // placeholder's own spinner phase, and the one-shot sweep plays over a
  // card that has ALREADY resolved. ──

  /** One pass of the loading shimmer. Deliberately short: at 700ms a
   * placeholder gets roughly three full passes inside `carouselCardSpinnerMs`
   * (and one inside the Free concept's shorter `spinnerHold`), which is what
   * makes it read as a repeating shimmer rather than as one slow sheen that
   * happens to be interrupted when the card resolves. */
  carouselShimmerLoopMs: 700,
  /** Pause between passes — the "blink" in a blinking effect. A gapless
   * sweep reads as a progress bar, i.e. as a claim about how far along
   * something is; a pass, a beat, then another pass reads as work
   * happening. */
  carouselShimmerGapMs: 200,
  /** The single "freshness" pass over a card that just resolved. Slower than
   * a loop pass, because this one is meant to be noticed once rather than
   * felt continuously. */
  carouselFreshnessSweepMs: 900,
  /** Stagger between freshness sweeps when several cards resolve at the same
   * instant. Only the Free concept needs it — its cards arrive as one group,
   * and six identical sweeps firing on the same frame read as a single
   * screen-wide flash rather than as six cards each finishing. The Plus
   * carousel resolves strictly one card at a time, so it passes nothing. */
  carouselFreshnessStaggerMs: 90,
  /** One full breath of a placeholder's inner halo — up and back down.
   * Deliberately equal to `carouselShimmerLoopMs + carouselShimmerGapMs`: on
   * the same cadence the travelling band and the breathing edge read as one
   * thing lighting the card, whereas two unrelated periods read as two
   * animations that happen to share a surface. Placeholder-only, so it can't
   * reach a resolved card. */
  carouselHaloPulseMs: 900,
} as const;
