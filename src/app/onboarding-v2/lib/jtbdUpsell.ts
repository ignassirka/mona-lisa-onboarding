import type { JTBDKey } from "./jtbdTuningResult";

export interface UpsellBenefit {
  /** Bold headline (the outcome) */
  outcome: string;
  /** Feature name shown after "via" */
  featureName: string;
  learnMore: boolean;
  /** Tooltip content for the (i) icon — shown on hover */
  tooltip?: string;
}

export interface JTBDUpsell {
  jtbdKey: JTBDKey;
  /** The word/phrase injected into the subheading: "Based on your ___ pick" */
  jtbdWord: string;
  /** Exactly 3 benefit cards, most compelling Plus unlocks for this JTBD */
  benefits: [UpsellBenefit, UpsellBenefit, UpsellBenefit];
}

export const JTBD_UPSELL: Record<JTBDKey, JTBDUpsell> = {
  privacy: {
    jtbdKey: "privacy",
    jtbdWord: "privacy",
    benefits: [
      {
        outcome: "Block trackers, ads, and malware on every Wi-Fi",
        featureName: "NetShield",
        learnMore: true,
        tooltip: "Blocks ads, trackers, and malware at the network level on every network you join.",
      },
      {
        outcome: "Route through high-security servers in safe jurisdictions",
        featureName: "Secure Core",
        learnMore: true,
        tooltip: "Routes your traffic through hardened servers in privacy-friendly countries first.",
      },
      {
        outcome: "Get a local IP almost anywhere you travel",
        featureName: "Servers in 60+ countries",
        learnMore: true,
        tooltip: "Connect through servers across 60+ countries to get a local IP almost anywhere.",
      },
    ],
  },
  gaming: {
    jtbdKey: "gaming",
    jtbdWord: "gaming",
    benefits: [
      {
        outcome: "Better matchmaking and fewer peer-connection problems",
        featureName: "Moderate NAT",
        learnMore: true,
        tooltip: "Eases NAT restrictions for better matchmaking and fewer connection issues.",
      },
      {
        outcome: "Reach games and lobbies in other regions",
        featureName: "Servers in 60+ countries",
        learnMore: true,
        tooltip: "Connect through servers across 60+ countries to reach games and lobbies abroad.",
      },
      {
        outcome: "One-tap saved setups for the games you play",
        featureName: "Game profiles",
        learnMore: true,
        tooltip: "Save your preferred server and settings per game for one-tap reconnection.",
      },
    ],
  },
  bypass: {
    jtbdKey: "bypass",
    jtbdWord: "bypassing restrictions",
    benefits: [
      {
        outcome: "Automatically connect to the fastest non-local server",
        featureName: "Fastest outside-country",
        learnMore: true,
        tooltip: "Auto-connects to the fastest server outside your country to avoid local blocks.",
      },
      {
        outcome: "Reach blocked sites from servers in 60+ countries",
        featureName: "Servers in 60+ countries",
        learnMore: true,
        tooltip: "Connect through servers across 60+ countries to reach sites blocked locally.",
      },
      {
        outcome: "Saved profile for your preferred bypass setup",
        featureName: "Bypass profile",
        learnMore: true,
        tooltip: "Save your preferred bypass setup for one-tap reconnection.",
      },
    ],
  },
  travel: {
    jtbdKey: "travel",
    jtbdWord: "travel and Wi-Fi safety",
    benefits: [
      {
        outcome: "Get a local IP almost anywhere you travel",
        featureName: "Servers in 60+ countries",
        learnMore: true,
        tooltip: "Connect through servers across 60+ countries to get a local IP almost anywhere.",
      },
      {
        outcome: "Saved profile for connecting back to your home country's IP",
        featureName: "Home country profile",
        learnMore: true,
        tooltip: "Save a profile to quickly connect back to your home country's IP.",
      },
      {
        outcome: "Get warned before connecting to risky Wi-Fi",
        featureName: "Network warning",
        learnMore: true,
        tooltip: "Alerts you before connecting to risky or unsecured Wi-Fi.",
      },
    ],
  },
  streaming: {
    jtbdKey: "streaming",
    jtbdWord: "streaming",
    benefits: [
      {
        outcome: "Watch shows from other countries - US Netflix, UK Prime, and more",
        featureName: "Streaming servers",
        learnMore: true,
        tooltip: "Servers optimized for accessing streaming libraries in other countries.",
      },
      {
        outcome: "Smoother 4K and live video",
        featureName: "VPN Accelerator",
        learnMore: true,
        tooltip: "Boosts connection speeds for smoother 4K and live video.",
      },
      {
        outcome: "Watch on your TV or Chromecast while connected",
        featureName: "TV and casting",
        learnMore: true,
        tooltip: "Use Proton VPN on your TV and cast to Chromecast while protected.",
      },
    ],
  },
  downloading: {
    jtbdKey: "downloading",
    jtbdWord: "downloading",
    benefits: [
      {
        outcome: "Torrenting and file-sharing, up to 10x faster",
        featureName: "Port Forwarding",
        learnMore: true,
        tooltip: "Opens ports for faster torrenting and file-sharing.",
      },
      {
        outcome: "Servers built and auto-picked for file-sharing",
        featureName: "P2P servers",
        learnMore: true,
        tooltip: "Servers tuned and auto-selected for file-sharing traffic.",
      },
      {
        outcome: "Steady speed on long downloads",
        featureName: "VPN Accelerator",
        learnMore: true,
        tooltip: "Maintains higher, steadier speeds throughout long downloads.",
      },
    ],
  },
};

/**
 * Pricing & trust — values verified against Proton's public pricing/policy
 * (June 2026), not invented:
 *  - Monthly $9.99: confirmed across multiple sources.
 *  - Yearly $4.99/mo: confirmed on the existing Figma screen. NOTE: Proton's
 *    current public 1-year rate is $3.99/mo; the $4.99 figure may be a
 *    region/promo difference — confirm with the team before shipping.
 *  - savings 50% and $0.16/day follow arithmetically from $4.99 vs $9.99.
 *  - 30-day money-back guarantee: confirmed (excludes cash/bank-transfer buys).
 */
export const UPSELL_PRICING = {
  yearlyMonthlyPrice: "$4.99",
  billingNote: "billed yearly",
  currencyNote: "Local currency at checkout.",
  anchorMonthlyPrice: "$9.99",
  savingsPercent: "50%",
  perDay: "$0.16",
  guaranteeTerms: "30-day money-back guarantee",
} as const;

export const UPSELL_EVERYTHING_ELSE =
  "And everything else VPN Plus unlocks: servers in 60+ countries, higher speeds with VPN Accelerator, up to 10 devices, and priority support.";

/** Factual trust signals — icons exported from Figma node 323-21045, text from same. */
export const UPSELL_TRUST_SIGNALS = [
  { label: "Open-source", asset: "usp-open-source" },
  { label: "Swiss-based", asset: "usp-swiss-based" },
  { label: "No-logs policy", asset: "usp-no-logs" },
] as const;

/** Welcome copy for the Plus Welcome screen — one entry per JTBD. */
export interface PlusWelcomeCopy {
  /** JTBD-aware subheading confirming what the user just unlocked. */
  subheading: string;
}

export const JTBD_PLUS_WELCOME: Record<JTBDKey, PlusWelcomeCopy> = {
  streaming: {
    subheading: "Your streaming setup is now fully unlocked. Here's everything working for you.",
  },
  privacy: {
    subheading: "Your privacy setup is now fully unlocked. Here's everything protecting you.",
  },
  gaming: {
    subheading: "Your gaming setup is now fully unlocked. Here's everything tuned for you.",
  },
  travel: {
    subheading: "Your travel setup is now fully unlocked. Here's everything keeping you safe.",
  },
  bypass: {
    subheading: "Your access setup is now fully unlocked. Here's everything working for you.",
  },
  downloading: {
    subheading: "Your download setup is now fully unlocked. Here's everything tuned for you.",
  },
};

// ── Multiple mode ("Selection" prototype control) — additive; every Single-
// mode export above is untouched. Both stage-3 screens (`VPNPlusUpsell`,
// `PlusWelcomeState`) only activate the code below once `selectedJtbds.length
// >= 2` (the same "1 selected → exactly as today" gate `TunedResult` already
// uses), so Single mode's rendering never changes. ──────────────────────

/** Upsell-only display cap for Multiple mode's highlighted paid features —
 * intentionally independent from the result screen's own `paidFeatureCap`
 * (`tuned-result/timing.ts`, currently 1): the upsell is a persuasive
 * marketing screen that highlights more of the SAME ranked union (confirmed
 * at checkpoint) than the minimal in-app result/welcome teaser does. Both
 * always draw from the same `rankPaidFeatures` order, so there's never a
 * disagreement about which feature ranks highest — only how many of that
 * one ranked list each screen chooses to reveal. */
export const UPSELL_MULTIPLE_HIGHLIGHT_CAP = 3;

/** Upsell subtitle, Multiple mode (2+ selected) — "Based on your {count}
 * picks, here is what VPN Plus turns on." Full i18n string, not built via
 * concatenation. Single mode's own "Based on your {jtbdWord} pick…" string
 * (inline in `VPNPlusUpsell.tsx`) is untouched; this is never called for
 * exactly 1 selection (see the gate note above). */
export function upsellSubtitleMultiple(count: number): string {
  return `Based on your ${count} picks, here is what VPN Plus turns on.`;
}

/** Plus-welcome subtitle, Multiple mode (2+ selected) — "Your setup for
 * {count} interests is now fully unlocked. Here's everything protecting
 * you." Full i18n string. `JTBD_PLUS_WELCOME[jtbdKey].subheading` (Single
 * mode) is untouched; this is never called for exactly 1 selection. */
export function plusWelcomeSubtitleMultiple(count: number): string {
  return `Your setup for ${count} interests is now fully unlocked. Here's everything protecting you.`;
}
