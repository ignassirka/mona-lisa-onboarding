/** Copy for the 5 alternative "Upgrade to Plus" upsell layouts
 * (`versions/upsell/*`). The intent-driven benefit/subtitle/pricing copy
 * itself stays in `jtbdUpsell.ts` (untouched, shared by every layout
 * including the default `VPNPlusUpsell`) — this file only holds the NEW
 * static structural labels each alternative pattern needs (column headers,
 * section headings, plan-card labels), matching this codebase's existing
 * centralized-copy convention (no i18n framework; see `jtbdUpsell.ts`,
 * `checkoutCopy.ts`, `toneOfVoice.tsx`). No pricing, stats, or claims live
 * here — only structural labels; all numbers still come from
 * `UPSELL_PRICING` in `jtbdUpsell.ts`. */
export const UPSELL_VERSIONS_COPY = {
  /** Shared headline every alternative (except Hero Spotlight, which uses
   * the top benefit's own outcome as its headline) shows verbatim,
   * matching the default screen's own headline. */
  headline: "What VPN Plus unlocks for you",
  comparisonTable: {
    freeColumn: "Free",
    plusColumn: "Plus",
  },
  valueStack: {
    includedHeading: "Everything VPN Plus turns on for you",
    trustHeading: "Also included on every plan",
  },
  cardGrid: {
    sectionHeading: "Built around your picks",
  },
  planSelector: {
    annualLabel: "Annual",
    annualNote: "billed yearly",
    monthlyLabel: "Monthly",
    bestValueBadge: "Best value",
    includedHeading: "What's included",
  },
  heroSpotlight: {
    eyebrow: "Your top unlock",
    restHeading: "Plus, also unlocked",
  },

  /** Shared across the four "profiles + features" layouts (Hero-and-tabs,
   * Carousel band, Paired rows, Fanned deck), which all combine the ranked
   * Plus features with the profile cards from the tuning screen's "Profiles
   * carousel v2". Shared rather than per-layout because these four differ in
   * ARRANGEMENT, not in what the screen claims — four copies of the same
   * heading is how they'd drift apart on wording nobody meant to change.
   *
   * Every count comes from the real number of profiles on screen
   * (`profilesForSelection`), never a fixed figure, and the singular forms
   * exist because a one-pick run is a normal case here, not an edge case. */
  profilesCombined: {
    /** Headline for the layouts that lead with the profiles rather than the
     * features. Deliberately NOT the shared "What VPN Plus unlocks for you":
     * on those layouts the first thing on screen is a set of named, built
     * objects, and the headline should be about them. */
    profilesHeadline: (n: number) => (n === 1 ? "Your profile is ready — and locked" : `Your ${n} profiles are ready — and locked`),
    /** The transition from the profiles to the features beneath them. Names
     * the quantity because "all 3" is something a person can want, where "the
     * profiles" is not. */
    unlockLine: (n: number) => (n === 1 ? "Unlock it with VPN Plus — which also turns on:" : `Unlock all ${n} with VPN Plus — which also turns on:`),
    /** Intro line ABOVE the fanned deck, where the cards stand in for the 3D
     * product render the default screen uses. Forward-looking ("you'll also
     * be able to use…") rather than a plain label, since this is the one
     * place on that layout that states the deck is itself an unlock, not just
     * decoration standing in for one. */
    deckIntro: (n: number) =>
      n === 1
        ? "You'll also be able to use this personalized profile, built around what you do online"
        : `You'll also be able to use these ${n} personalized profiles, built around what you do online`,
    /** Accessible name for the profile group on every one of these layouts.
     * Not the tuning screen's "Your personalized profiles" — the possessive
     * is the one claim this screen can't make, since the whole point is that
     * they aren't the user's yet. */
    groupLabel: "Profiles available with VPN Plus",
    /** Heading above the feature list on the layouts where the profiles came
     * first, so the features read as the mechanism behind the cards rather
     * than as a competing pitch. */
    featuresHeading: "What powers them",
    /** The tab strip's accessible name on the hero-and-tabs layout. */
    tabsLabel: "Choose a profile to preview",
    /** Eyebrow on the paired layout, where each row is one profile AND the
     * feature it's the reason for. */
    pairedEyebrow: "Built from your picks",
    /** Row caption on the paired layout for a profile that contributed none
     * of the displayed features — see `useUpsellProfiles` on why that's an
     * honest state rather than a gap to fill. */
    pairedSettingsOnly: "Pre-configured and ready",
    /** The paired layout's trailing strip, for profiles with no displayed
     * feature to pair with. They still appear — they're real and they're the
     * user's picks — just as thumbnails rather than as full rows, so a 6-pick
     * run doesn't turn into six rows of which half have nothing to say. */
    pairedMore: (n: number) => (n === 1 ? "And 1 more profile, ready to unlock" : `And ${n} more profiles, ready to unlock`),
  },
} as const;
