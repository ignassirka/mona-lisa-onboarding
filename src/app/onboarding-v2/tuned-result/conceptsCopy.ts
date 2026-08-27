import type { JtbdId } from "../lib/jtbdData";

/** Structural-only copy for the alternative "tuning" concepts
 * (`tuned-result/concepts/*`). The intent-driven title/subtitle/summary
 * copy itself stays in `copy.ts` / `toneOfVoice.tsx`'s `TUNING_COPY`
 * (untouched, shared by every concept including the default) — this file
 * only holds the NEW static labels each alternative pattern's own
 * structure needs (section headings, status labels), matching this
 * codebase's existing centralized-copy convention (no i18n framework; see
 * `copy.ts`, `jtbdUpsell.ts`, `checkoutCopy.ts`). No counts or settings
 * content live here — those are always derived. */
export const TUNING_CONCEPTS_COPY = {
  progressRing: {
    completeLabel: "Setup complete",
  },
  checklist: {
    progressLabel: (applied: number, total: number) => `${applied} of ${total} complete`,
  },
  receipt: {
    heading: "Here's your setup",
    recommendedHeading: "Recommended with VPN Plus",
  },

  // ── The 5 profiles-first concepts. Shared strings (the baseline's name,
  // the persistence caption, the Plus availability label) live in
  // `profiles/profilesCopy.ts` instead; these are each concept's own
  // structural labels. See docs/specs/profiles-tuning/. ──

  profilesBaseline: {
    anchorTitleDuring: "Turning on your protection…",
    anchorTitleComplete: "Your protection is on.",
    anchorDisclosureLabel: "What we changed",
    anchorSettingsCount: (n: number) => `${n} ${n === 1 ? "setting" : "settings"}`,
    shortcutsHeader: "One-tap shortcuts, built for what you picked",
    plusFeatureLine: (featureName: string) => `Also with VPN Plus: ${featureName}`,
  },

  profilesRehearsal: {
    stageBaselineDuring: "Turning on your protection…",
    stageBaselineRest: "This is you now — protected, set up for everything you picked.",
    tilesHeader: "Try any of these — nothing changes until you choose to keep it",
    rehearseAllLabel: "Rehearse everything",
    rehearsingLabel: "Rehearsing",
    keepLabel: "Keep this in my sidebar",
    demonstrationNote: "This is a preview of what this shortcut does.",
    freeLocationNote: "On the free plan this would use a free location. The settings are the same.",
    combinationNote: "Both of these sit on top of the protection you already have.",
  },

  profilesShelf: {
    baselineDuring: "Turning on your protection…",
    baselineStatus: "On now — covers everything you picked.",
    shelfIntro: "Your protection is already on. These are shortcuts you can use any time.",
  },

  profilesDeck: {
    nowHeader: "Now",
    withHeader: "With this setup",
    noChange: "No change",
    tryLabel: "Try it now",
    triedLabel: "You tried this",
    keepLabel: "Keep it in my sidebar",
    everythingCardName: "Everything at once",
    everythingCardBody:
      "This is what's running already. It covers every interest you picked, and it stays on whether or not you use a shortcut.",
    freeLocationSubstitution: "We'll use a free location for this. The setup is the same.",
  },

  // ── "Profile-first" (Plus-only). Unlike the five above it has no Free
  // state at all, so none of its copy needs a locked/aspirational register.
  // Everything parameterized here is fed a DERIVED count by the caller. ──
  profileFirst: {
    profilesRowLabel: (n: number) =>
      n === 1
        ? "A personalized profile, with every setting already applied"
        : `${n} personalized profiles, with every setting already applied`,
    profilesNarration: "Building your profiles…",
    /** Replaces the shared `counterSubtext`, which says "settings". This
     * concept's rows are a profiles block and two features, so counting
     * them as settings would be wrong. */
    counter: (applied: number, total: number) => `Applying ${applied} of ${total}`,
    summary: (profiles: number, features: number) =>
      `${profiles} profile${profiles === 1 ? "" : "s"} and ${features} Plus feature${features === 1 ? "" : "s"}, ready to use.`,
    /** Every profile is live for a Plus user, so its features read "On" —
     * there's no locked state on this concept to soften. */
    featureValue: "On",
    tabsLabel: "Choose a profile to preview",
  },

  profilesCarousel: {
    /** Unlike every other concept, this one's title and subtext are
     * TONE-CONSTANT rather than drawn from `TUNING_COPY`.
     *
     * The shared titles describe the tuning as a set of applied settings
     * ("Tuned for your 3 interests"), and each tone re-voices that framing.
     * This concept's whole claim is the opposite: the outcome is a set of
     * OBJECTS you were given, and there's no tonal variant of the shared
     * copy that says that. Same precedent as the profiles' own
     * `effectSentence`/`deltaSentence`, which are tone-constant for the
     * same reason. */
    /** Deliberately doesn't name "profiles" — that word is earned once
     * they've actually resolved into cards (see `titleComplete`); while
     * building, this describes the outcome rather than the mechanism, which
     * is also why it's a plain string rather than a per-count function like
     * every other concept's during-title. */
    titleDuring: "Crafting the experience around what you do online…",
    titleComplete: (n: number) => (n === 1 ? "A profile built around what you do online" : `${n} profiles built around what you do online`),
    /** Shown for the entire build, in place of the shared "N of M settings"
     * counter — also deliberately generic, for the same reason as
     * `titleDuring`: nothing has resolved into a nameable profile yet. */
    loadingSubtitle: "We're handling every setting so you don't have to.",
    /** The steady line shown once `rowsComplete` — now free to be concrete,
     * since every card has actually finished by the time a user reads it. */
    summary: "Every setting's already in place — just connect and go.",
    connect: "Connect",
    carouselLabel: "Your personalized profiles",
    /** Per-card spinner narration, one profile at a time — see
     * `useProfilesCarouselData`. */
    cardNarration: (profileName: string) => `Personalizing your ${profileName} profile…`,
    scrollPrev: "Show previous profiles",
    scrollNext: "Show more profiles",
    globalSettingsLabel: "Settings that apply everywhere",
  },

  /** Profiles carousel v2 deliberately holds only what's genuinely NEW.
   * Everything the SCREEN says — the during/complete titles, the loading
   * subtitle, the summary, "Connect", the carousel's labels and the per-card
   * narration — is read from `profilesCarousel` above, because the two
   * concepts differ in what a CARD shows, not in what the screen claims.
   * Duplicating those strings here is how the two versions would start
   * drifting apart on copy nobody meant to change. */
  profilesCarouselV2: {
    /** The one-line promise a card reveals on hover, in place of its chips.
     *
     * Deliberately not the profiles' existing `effectSentence`, which is a
     * 20-plus-word sentence naming a destination: at this card's width that
     * wraps to three lines and eats the settings list's room, and the
     * destination is already stated by the dropdown directly below it.
     *
     * Two hard constraints, both structural rather than editorial. Parallel
     * construction, so the line reads as the same kind of claim wherever you
     * hover. And **at most ~34 characters**, because the card's text column
     * is 248px: a line that wraps pushes that card's divider and settings
     * rows 18px below its neighbours', and six lists that don't align are
     * six lists nobody can compare. "Tuned for" rather than a longer opener
     * is what buys the content its 24 characters. */
    hoverSubtitle: {
      privacy: "Tuned for the strictest protection",
      streaming: "Tuned for your favourite shows",
      downloading: "Tuned for protected transfers",
      gaming: "Tuned for fast, responsive play",
      travel: "Tuned for Wi-Fi you don't control",
      bypass: "Tuned for networks that block VPNs",
    } as Record<JtbdId, string>,
    /** Names the hover disclosure for assistive tech, which otherwise gets a
     * bare list appearing out of nowhere. */
    settingsLabel: "What this profile does for you",
  },

  /** The Free-only sibling of `profilesCarouselV2`. Holds only what the Plus
   * version has no equivalent for: the boundary band's heading, and the
   * narration for the one group placeholder that stands in for the whole card
   * row.
   *
   * Everything the SCREEN says comes from the shared, tone-aware
   * `TUNING_COPY`/`copy.ts` helpers — the opposite of what v2 does, and
   * deliberately. v2's tone-constant title claims the profiles ARE the
   * outcome ("3 profiles built around what you do online"), which is exactly
   * the claim a Free run can't make: here the outcome is the two settings
   * actually applied, and the profiles are a preview of what Plus would add.
   * The shared "Tuned for your N interests" says that, in all four tones. */
  profilesCarouselV2Free: {
    /** The boundary band's heading, in place of `plusSectionHeader`'s "More
     * benefits for your interests available with VPN Plus". Names the count
     * AND the reason the cards below are dimmed, in one line, so the dimming
     * is never left unexplained.
     *
     * The parenthetical is this band's own phrasing of
     * `PLUS_AVAILABILITY_LABEL` (`profiles/profilesCopy.ts`) — the same claim,
     * lowercased to sit inside a sentence. Written out rather than composed
     * from that constant because case-folding it in code would also fold
     * "VPN Plus". */
    profilesBandHeader: (n: number) =>
      n === 1
        ? "1 advanced profile built around what you do online (available with VPN Plus)"
        : `${n} advanced profiles built around what you do online (available with VPN Plus)`,
    /** ONE narration line for the whole card row, not one per card. v2
     * narrates each profile by name because its cards resolve strictly one at
     * a time and a generic line couldn't say which was which; here they
     * arrive together, so there's no such question to answer. It also can't
     * borrow v2's "Personalizing your {name} profile…" — on a Free run these
     * aren't the user's to personalize. */
    blockNarration: "Matching profiles to what you picked…",
    /** Names the dimmed card row for assistive tech. Deliberately not
     * `profilesCarousel`'s "Your personalized profiles" — a possessive this
     * run hasn't earned. */
    carouselLabel: "Profiles available with VPN Plus",
  },

  profilesDraft: {
    draftsHeader: "We drafted these for you — keep what's useful",
    protectionPinnedNote: "Always on. This one isn't optional.",
    combineLabel: "Combine into one",
    splitLabel: "Split back apart",
    combinedBadge: "Combined",
    combinedDestinationNote: "These use different locations, so this one connects to the fastest country.",
    renameHint: "Rename this profile",
    previewCaption: "This is what you'll find in your app.",
    quotaNote: (n: number) => `Keep ${n} on the free plan. VPN Plus keeps as many as you like.`,
    emptyPreview: "No shortcuts kept. Your protection stays on either way.",
  },
} as const;
