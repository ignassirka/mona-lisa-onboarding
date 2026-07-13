import type { ReactNode } from "react";
import type { OnboardingStage } from "../OnboardingV2";

/** Prototype "Tone of voice" axis. Controls *content only* — every layout,
 * concept, animation and timing stays identical across tones. `straightforward`
 * is the default (the original shipped copy).
 *
 * Today only the connection stage supplies tone-specific copy (see
 * CONNECTION_COPY + STAGE_SUPPORTS_TONE). The structure is deliberately generic
 * so other stages can opt in later: add their copy shape here and add the stage
 * to STAGE_SUPPORTS_TONE. */
export type ToneOfVoice = "straightforward" | "reassuring" | "empowering" | "educational";

/** Options for the prototype-HUD dropdown, in display order. */
export const TONE_OPTIONS: { value: ToneOfVoice; label: string }[] = [
  { value: "straightforward", label: "Straightforward" },
  { value: "reassuring", label: "Reassuring" },
  { value: "empowering", label: "Empowering" },
  { value: "educational", label: "Educational" },
];

/** Stages whose copy is tone-aware. The HUD hides the tone dropdown for
 * stages not in this set. Both "connection" and "tuning" opt in — the
 * dropdown is a single global control (one `tone` state in `App.tsx`,
 * threaded down through `OnboardingV2`); each stage just decides for itself
 * whether it renders tone-aware copy. */
export const STAGE_SUPPORTS_TONE: ReadonlySet<OnboardingStage> = new Set<OnboardingStage>(["connection", "tuning"]);

/** Copy for the "Location map spotlight" versions (v1 Centered / v2 Split).
 * Headlines carry a phase-colored accent span; subtexts interpolate the ISP. */
export interface MapSpotlightCopy {
  exposedHeadline: ReactNode;
  exposedSub: (isp: string) => ReactNode;
  connectingHeadline: ReactNode;
  protectedHeadline: ReactNode;
  protectedSub: (isp: string) => ReactNode;
  ctaProtect: string;
  /** Split-view card heading (v2) before connect. */
  cardHeadingIdle: string;
  /** Split-view card heading (v2) while connecting. */
  cardHeadingActive: string;
}

/** Copy for the "Browsing experience" (diary) versions (v4 Centered /
 * v4-split Split). The diary *entries* themselves stay tone-invariant (they are
 * deliberately mundane examples); tone lives in the framing, CTA and labels. */
export interface BrowsingCopy {
  /** Right-hand per-entry "eye" indicator before redaction. */
  visibleLabel: string;
  exposedHeadline: string;
  exposedSub: string;
  cta: string;
  connectingHeadline: string;
  protectedHeadline: string;
  sealCard: string;
  continue: string;
  /** Per-entry lock label while redacting (was hardcoded "Protecting…"). */
  redactingLabel: string;
  /** Per-entry lock label once sealed (was hardcoded "Protected"). */
  sealedLabel: string;
}

/** Copy for the "Hybrid" version (title/subtext/CTA — the map-spotlight-shaped
 * half of Hybrid's layout). The activity cards' `visibleLabel`/`redactingLabel`/
 * `sealedLabel` are NOT duplicated here — Hybrid reuses `browsing`'s for those,
 * since the cards are the same reused `ActivityEntry` component. */
export interface HybridCopy {
  exposedHeadline: ReactNode;
  exposedSub: (isp: string) => ReactNode;
  connectingHeadline: ReactNode;
  protectedHeadline: ReactNode;
  protectedSub: (isp: string) => ReactNode;
  ctaProtect: string;
}

export interface ConnectionCopy {
  mapSpotlight: MapSpotlightCopy;
  browsing: BrowsingCopy;
  hybrid: HybridCopy;
}

/** Structural (non-per-JTBD) copy for the "Personalized JTBD tuning" stage —
 * the picker's title/subtitle, the tuned-result header's intro/completion
 * text. Per-JTBD content (the 3 enabled + 2 paid feature outcomes and the
 * tip, re-voiced per tone) lives separately in
 * `lib/jtbdTuningToneCopy.ts` (a sibling of the base `lib/jtbdTuningResult.ts`
 * data it re-voices), since it's keyed by JTBD × tone rather than tone alone
 * — cramming 6 JTBDs' worth of outcome sentences into this file would break
 * the "one file per content concern" convention every other data file here
 * already follows (`jtbdData.ts`, `jtbdUpsell.ts`, etc.).
 *
 * Kept CONSTANT across tones (confirmed via checkpoint, not part of this
 * shape): the 6 JTBD option labels, technical settings names/values/feature
 * names, the "Available with VPN Plus" badge + Split by Status column
 * headers, the counter format ("Applying X of N settings"), the picker's
 * witty "wink" line, the per-row narration verbs ("Enabling…"/"Checking…"),
 * and the neutral navigation labels (Skip/Back/the pre-selection "Continue"/
 * the dynamic "Tune for {jtbd}" CTA) — mirroring stage 1's own precedent,
 * where `browsing.continue` is ALSO identical ("Continue") across all 4
 * tones; only the more expressive/emotive strings vary. */
export interface TuningCopy {
  pickerTitle: string;
  pickerSubtitle: string;
  /** Tuned-result header, Phase 1/3 ("during") static intro subtext. */
  introSubtext: string;
  /** Tuned-result header title, Phases 1 & 3: "{verb} for {jtbd}…". */
  titleDuring: (jtbdWord: string) => string;
  /** Tuned-result header title, Phase 4 (complete). */
  titleComplete: (jtbdWord: string) => string;
  /** Tuned-result header subtext, Phase 4 (complete) — counts are derived by
   * the caller and passed in; only the wording around them varies. */
  summarySubtext: (applied: number, locked: number) => string;
}

/** All tuning-stage structural copy, keyed by tone. `straightforward`
 * reproduces the original shipped strings verbatim (same precedent as
 * `CONNECTION_COPY.straightforward`). */
export const TUNING_COPY: Record<ToneOfVoice, TuningCopy> = {
  straightforward: {
    pickerTitle: "Pick the one that matters most right now",
    pickerSubtitle: "We'll tune Proton VPN for it. You can change any setting later on.",
    introSubtext: "Applying the settings to optimize the experience for you.",
    titleDuring: (word) => `Tuning for ${word}\u2026`,
    titleComplete: (word) => `Tuned for ${word}`,
    summarySubtext: (applied, locked) =>
      locked > 0 ? `${applied} settings applied \u00b7 ${locked} available with VPN Plus` : `${applied} settings applied.`,
  },
  reassuring: {
    pickerTitle: "What would help you most right now?",
    pickerSubtitle: "We'll take care of the setup \u2014 you can always change it later.",
    introSubtext: "We're taking care of the details, so you don't have to.",
    titleDuring: (word) => `Getting things ready for ${word}\u2026`,
    titleComplete: (word) => `You're all set for ${word}`,
    summarySubtext: (applied, locked) =>
      locked > 0 ? `${applied} settings taken care of \u00b7 ${locked} available with VPN Plus` : `${applied} settings taken care of.`,
  },
  empowering: {
    pickerTitle: "What do you want to take control of?",
    pickerSubtitle: "You pick, we tune. Change anything later, anytime.",
    introSubtext: "You're getting the settings that work best for you.",
    titleDuring: (word) => `Optimizing for ${word}\u2026`,
    titleComplete: (word) => `You're set up for ${word}`,
    summarySubtext: (applied, locked) =>
      locked > 0 ? `${applied} settings working for you \u00b7 ${locked} available with VPN Plus` : `${applied} settings working for you.`,
  },
  educational: {
    pickerTitle: "Which of these matters most to you?",
    pickerSubtitle: "We'll tune the settings that make the biggest difference. You can change any of them later.",
    introSubtext: "Applying the settings that make the biggest difference here.",
    titleDuring: (word) => `Configuring for ${word}\u2026`,
    titleComplete: (word) => `Configured for ${word}`,
    summarySubtext: (applied, locked) =>
      locked > 0 ? `${applied} settings configured \u00b7 ${locked} available with VPN Plus` : `${applied} settings configured.`,
  },
};

const coral = (text: string) => <span className="text-[#f7607b]">{text}</span>;
const teal = (text: string) => <span className="text-[#2cffcc]">{text}</span>;

/** All connection-stage copy, keyed by tone. `straightforward` reproduces the
 * original shipped strings verbatim. */
export const CONNECTION_COPY: Record<ToneOfVoice, ConnectionCopy> = {
  straightforward: {
    mapSpotlight: {
      exposedHeadline: <>Your online identity is currently {coral("unprotected")}</>,
      exposedSub: (isp) => (
        <>Your internet provider (&ldquo;{isp}&rdquo;) can see which sites you visit, when, how often, and for how long.</>
      ),
      connectingHeadline: <>Protecting your online activity....</>,
      protectedHeadline: <>Your online identity is now fully {teal("protected")}!</>,
      protectedSub: (isp) => (
        <>You now look like someone else, somewhere else. Your internet provider (&ldquo;{isp}&rdquo;) can see no more than an encrypted connection.</>
      ),
      ctaProtect: "Protect my online identity",
      cardHeadingIdle: "Visible on this network:",
      cardHeadingActive: "Hiding this for you\u2026",
    },
    browsing: {
      visibleLabel: "Visible",
      exposedHeadline: "Your online life is more visible than you'd think",
      exposedSub: "On this network, others can see the everyday things you do.",
      cta: "Protect my online identity",
      connectingHeadline: "Encrypting your activity\u2026",
      protectedHeadline: "Your diary is sealed.",
      sealCard: "From now on, this is all they see.",
      continue: "Continue",
      redactingLabel: "Hiding\u2026",
      sealedLabel: "Hidden",
    },
    hybrid: {
      exposedHeadline: <>You decide who sees you {coral("online")}</>,
      exposedSub: (isp) => (
        <>Right now your provider (&ldquo;{isp}&rdquo;) chooses what it can see. Take that decision back.</>
      ),
      connectingHeadline: <>Protecting your online activity....</>,
      protectedHeadline: <>Your online identity is now fully {teal("protected")}!</>,
      protectedSub: (isp) => (
        <>You now look like someone else, somewhere else. Your provider (&ldquo;{isp}&rdquo;) can see no more than an encrypted connection.</>
      ),
      ctaProtect: "Protect my online identity",
    },
  },

  reassuring: {
    mapSpotlight: {
      exposedHeadline: <>Right now, this connection isn&rsquo;t {coral("private")}</>,
      exposedSub: (isp) => (
        <>Your provider (&ldquo;{isp}&rdquo;) can see where you go online. A moment from now, it won&rsquo;t.</>
      ),
      connectingHeadline: <>Setting up your private connection&hellip;</>,
      protectedHeadline: <>You&rsquo;re {teal("private")} now &mdash; nicely done</>,
      protectedSub: (isp) => (
        <>You look like someone else, somewhere else. Your provider (&ldquo;{isp}&rdquo;) sees only a private, encrypted connection.</>
      ),
      ctaProtect: "Make my connection private",
      cardHeadingIdle: "Currently visible to others:",
      cardHeadingActive: "Tucking this away\u2026",
    },
    browsing: {
      visibleLabel: "Visible",
      exposedHeadline: "Your everyday moments deserve privacy",
      exposedSub: "On this network, the little things you do are visible to others.",
      cta: "Make my connection private",
      connectingHeadline: "Keeping this between us\u2026",
      protectedHeadline: "Your day is private now.",
      sealCard: "From here on, this stays yours alone.",
      continue: "Continue",
      redactingLabel: "Securing\u2026",
      sealedLabel: "Private",
    },
    hybrid: {
      exposedHeadline: <>This connection isn&rsquo;t {coral("private")} yet</>,
      exposedSub: (isp) => (
        <>Your provider (&ldquo;{isp}&rdquo;) can see where you go online right now. That&rsquo;s about to change.</>
      ),
      connectingHeadline: <>Making this connection private&hellip;</>,
      protectedHeadline: <>You&rsquo;re {teal("private")} now &mdash; nicely done</>,
      protectedSub: (isp) => (
        <>You look like someone else, somewhere else. Your provider (&ldquo;{isp}&rdquo;) sees only a private, encrypted connection.</>
      ),
      ctaProtect: "Make my connection private",
    },
  },

  empowering: {
    mapSpotlight: {
      exposedHeadline: <>You decide who sees you {coral("online")}</>,
      exposedSub: (isp) => (
        <>Right now your provider (&ldquo;{isp}&rdquo;) chooses what it can see. Take that decision back.</>
      ),
      connectingHeadline: <>Taking back control&hellip;</>,
      protectedHeadline: <>You&rsquo;re back in {teal("control")}</>,
      protectedSub: (isp) => (
        <>You choose what&rsquo;s visible now. Your provider (&ldquo;{isp}&rdquo;) sees only an encrypted connection.</>
      ),
      ctaProtect: "Take control",
      cardHeadingIdle: "Not yours to control yet:",
      cardHeadingActive: "Taking this back\u2026",
    },
    browsing: {
      visibleLabel: "Visible",
      exposedHeadline: "You decide who sees your day online",
      exposedSub: "On this network, your everyday moments are visible to others. Change that.",
      cta: "Take control",
      connectingHeadline: "Taking it back\u2026",
      protectedHeadline: "It's yours again.",
      sealCard: "From now on, you decide what they see.",
      continue: "Continue",
      redactingLabel: "Claiming\u2026",
      sealedLabel: "Yours",
    },
    hybrid: {
      exposedHeadline: <>Take back control of what&rsquo;s {coral("visible")}</>,
      exposedSub: (isp) => (
        <>Right now your provider (&ldquo;{isp}&rdquo;) decides what it can see. Take that decision back.</>
      ),
      connectingHeadline: <>Taking back control&hellip;</>,
      protectedHeadline: <>You&rsquo;re back in {teal("control")}</>,
      protectedSub: (isp) => (
        <>You choose what&rsquo;s visible now. Your provider (&ldquo;{isp}&rdquo;) sees only an encrypted connection.</>
      ),
      ctaProtect: "Take control",
    },
  },

  educational: {
    mapSpotlight: {
      exposedHeadline: <>Here&rsquo;s what your network can {coral("see")}</>,
      exposedSub: (isp) => (
        <>Without a VPN, your provider (&ldquo;{isp}&rdquo;) logs the sites you visit, when, and for how long.</>
      ),
      connectingHeadline: <>Encrypting your traffic&hellip;</>,
      protectedHeadline: <>Your traffic is now {teal("encrypted")}</>,
      protectedSub: (isp) => (
        <>A VPN routes your traffic through an encrypted tunnel, so your provider (&ldquo;{isp}&rdquo;) sees only that a connection exists.</>
      ),
      ctaProtect: "Encrypt my connection",
      cardHeadingIdle: "Visible without encryption:",
      cardHeadingActive: "Encrypting this\u2026",
    },
    browsing: {
      visibleLabel: "Visible",
      exposedHeadline: "Here's what others on this network can see",
      exposedSub: "Without encryption, the everyday things you do are visible to others nearby.",
      cta: "Encrypt my connection",
      connectingHeadline: "Encrypting each entry\u2026",
      protectedHeadline: "Everything's encrypted now.",
      sealCard: "Encrypted end to end \u2014 this is all they can see.",
      continue: "Continue",
      redactingLabel: "Encrypting\u2026",
      sealedLabel: "Encrypted",
    },
    hybrid: {
      exposedHeadline: <>Here&rsquo;s what your network can {coral("see")}</>,
      exposedSub: (isp) => (
        <>Without a VPN, your provider (&ldquo;{isp}&rdquo;) logs the sites you visit, when, and for how long.</>
      ),
      connectingHeadline: <>Encrypting your traffic&hellip;</>,
      protectedHeadline: <>Your traffic is now {teal("encrypted")}</>,
      protectedSub: (isp) => (
        <>A VPN routes your traffic through an encrypted tunnel, so your provider (&ldquo;{isp}&rdquo;) sees only that a connection exists.</>
      ),
      ctaProtect: "Encrypt my connection",
    },
  },
};
