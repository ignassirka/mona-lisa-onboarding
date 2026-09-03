/** Copy for the alternative "Upgrade to Plus" upsell layouts
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
  headline: "Unlock the full power of Proton VPN",
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
     * features. Deliberately NOT the shared upsell headline
     * (`UPSELL_VERSIONS_COPY.headline`):
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
    /** Intro line ABOVE the hero profile card on `profiles-hero-tabs` — states
     * the count, the Plus unlock, and the personalization claim once before a
     * person starts switching tabs. */
    tabsIntro: (n: number) =>
      n === 1
        ? "You'll also be able to use 1 personalized profile with Plus features, built around what you do online"
        : `You'll also be able to use ${n} personalized profiles with Plus features, built around what you do online`,
    /** Static Plus feature list on `profiles-hero-tabs` — not intent-ranked.
     * These four claims are fixed on that layout so the left column reads as
     * a product overview beside the profile hero, not a replay of the tuning
     * screen's ranked benefits. Icons live beside the row component. */
    staticFeatures: [
      {
        title: "Access all countries",
        subtitle: "Unlock 3000+ secure servers in 68 countries",
      },
      {
        title: "Browse at even higher speeds",
        subtitle: "Unlock faster, less crowded servers with speeds of up to 10 Gbps.",
      },
      {
        title: "Protect 10 devices at once",
        subtitle: "Proton VPN is available on 8 different platforms.",
      },
      {
        title: "Enjoy ad-free browsing",
        subtitle: "Block ads, trackers, and malware with NetShield.",
      },
    ] as const,
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

  /** Shared across the three "features-led" layouts (Profile filmstrip,
   * Peeking deck, Inline profile row), which invert the four layouts above:
   * the ranked Plus features carry the screen and the profiles are demoted to
   * a supporting element. Shared for the same reason `profilesCombined` is —
   * these three differ in HOW far the profiles are demoted, not in what the
   * screen claims about them.
   *
   * Every count is the real number of profiles the selection produces
   * (`profilesForSelection`), never a fixed figure, and singular forms exist
   * because a one-pick run is a normal case here. */
  featuresLed: {
    /** Caption beside the demoted profiles. Opens with "Also unlocked" rather
     * than `profilesCombined.deckIntro`'s "You'll also be able to use…":
     * these layouts state the profiles as one more line item under the
     * features, not as the thing the panel is about. */
    profilesCaption: (n: number) =>
      n === 1
        ? "Also unlocked: 1 personalized profile, built around what you do online"
        : `Also unlocked: ${n} personalized profiles, built around what you do online`,
    /** For `features-led-band`'s bordered profile box, where the box itself
     * (sitting between the feature list and the CTA, the same "this is part
     * of the deal" framing `ValueStack`'s price block and the inline avatar
     * row's own violet panel already use) is what signals "unlocked" —
     * so the sentence inside it states the count and the claim without also
     * repeating "unlocked". */
    profilesBoxCaption: (n: number) =>
      n === 1 ? "1 personalized profile, built around what you do online" : `${n} personalized profiles, built around what you do online`,
    /** The shortest form, for the inline avatar row — where the whole claim
     * has to fit on one line beside the artwork. */
    profilesInline: (n: number) => (n === 1 ? "Your personalized profile" : `Your ${n} personalized profiles`),
    /** Second line of that same row: what they are, once. */
    profilesInlineNote: "Built around your picks, ready the moment you upgrade",
    /** Accessible name for the demoted profile group. Same non-possessive
     * framing as `profilesCombined.groupLabel` and for the same reason —
     * they aren't the user's yet. */
    groupLabel: "Profiles available with VPN Plus",
    /** Overflow indicator on the inline avatar row, which shows at most
     * `AVATAR_CAP` faces while its caption still states the true count. */
    avatarOverflow: (n: number) => `+${n}`,
    /** Heading above the feature list on the layouts that give it one, so the
     * list reads as the screen's subject rather than an unlabelled stack. */
    featuresHeading: "Built around your picks",
  },
} as const;
