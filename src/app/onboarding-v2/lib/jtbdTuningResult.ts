import type { JtbdId } from "./jtbdData";
// Per-feature decorative icons exported from Figma node 19586 (the upsell row
// illustrations). A few features without a dedicated illustration fall back to
// the existing Proton VPN "profile" glyphs used by the country browser.
import iconNetShield from "../assets/feature-netshield.svg";
import iconSecureCore from "../assets/feature-secure-core.svg";
import iconModerateNat from "../assets/feature-moderate-nat.svg";
import iconServerBreadth from "../assets/feature-server-breadth.svg";
import iconVpnAccelerator from "../assets/feature-vpn-accelerator.svg";
import iconPortForwarding from "../assets/feature-port-forwarding.svg";
import iconP2pServers from "../assets/feature-p2p-servers.svg";
import iconNetworkWarning from "../assets/feature-network-warning.svg";
import iconStreaming from "../../../imports/profile-icons/profile-icon-streaming.svg";
import iconAnticensorship from "../../../imports/profile-icons/profile-icon-anticensorship.svg";
import iconSecurity from "../../../imports/profile-icons/profile-icon-security.svg";
import iconBusiness from "../../../imports/profile-icons/profile-icon-business.svg";

// The tuning-result keys are identical to the existing onboarding `JtbdId`
// union, so we alias rather than introduce a second source of truth.
export type JTBDKey = JtbdId;

export interface EnabledFeature {
  /** Plain-language outcome (left side, bold) */
  outcome: string;
  /** Settings name shown on the right (muted) */
  settingsName: string;
  /** Applied value shown in the pill */
  value: string;
  /** Tooltip content for the (i) icon — plain-language label explanation */
  tooltip?: string;
}

export interface PaidFeature {
  /** Plain-language outcome (left side, muted) */
  outcome: string;
  /** Feature name shown on the right */
  featureName: string;
  /** Imported Figma decorative asset URL for this row */
  asset: string;
  /** Tooltip content for the (i) icon — plain-language label explanation */
  tooltip?: string;
}

export interface JTBDTuningResult {
  jtbdKey: JTBDKey;
  /** Goes inside: Tuned for "___" */
  jtbdLabel: string;
  /** Exactly 2 — Protocol and Kill Switch, in that order. These are the
   * only free settings this prototype can genuinely tune per-JTBD (confirmed
   * at checkpoint, replacing the earlier illustrative 3-setting-per-JTBD
   * list, which included settings — LAN setting, NAT type, Hidden IP,
   * Encrypted connection, Alternative Routing, WireGuard Kernel, Device
   * support — that aren't actually wired to JTBD selection). `settingsName`
   * is now literally `"Protocol"` / `"Kill Switch"` for every row (never a
   * more specific variant like "Smart Protocol"/"Stealth protocol") — the
   * per-JTBD nuance lives entirely in `value` (`"Smart"` / `"WireGuard UDP"`
   * / `"Stealth"` for Protocol; `"Advanced"` / `"Standard"` for Kill
   * Switch). */
  enabled: [EnabledFeature, EnabledFeature];
  paid: [PaidFeature, PaidFeature]; // exactly 2
  tip: string | null;
}

/** The two Protocol values' tooltip text is identical everywhere it's used
 * (the setting behaves the same regardless of which JTBD picked it) — kept
 * as shared constants so the explanation can never drift between JTBDs. */
const PROTOCOL_TOOLTIP = {
  smart: "Automatically picks the best way to connect for your network — no manual choice needed.",
  wireguardUdp: "The fastest connection method, prioritizing speed and low latency over reliability on rough networks.",
  stealth: "Disguises your VPN connection as regular traffic, so networks that block VPNs let it through.",
} as const;

/** Same "identical everywhere" precedent as `PROTOCOL_TOOLTIP`, for Kill
 * Switch's two values. */
const KILL_SWITCH_TOOLTIP = {
  advanced: "Only allows internet access while connected to Proton VPN — even after you restart your computer.",
  standard: "Automatically disconnects your internet if the VPN connection is ever lost.",
} as const;

export const JTBD_TUNING_RESULT: Record<JTBDKey, JTBDTuningResult> = {
  privacy: {
    jtbdKey: "privacy",
    jtbdLabel: "Privacy and security",
    enabled: [
      {
        outcome: "Automatically picks the most secure way to connect for your network",
        settingsName: "Protocol",
        value: "Smart",
        tooltip: PROTOCOL_TOOLTIP.smart,
      },
      {
        outcome: "Your internet only works while you're protected — even if you restart your computer",
        settingsName: "Kill Switch",
        value: "Advanced",
        tooltip: KILL_SWITCH_TOOLTIP.advanced,
      },
    ],
    paid: [
      {
        outcome: "Block ads, trackers, and malware before they reach you",
        featureName: "NetShield",
        asset: iconNetShield,
        tooltip: "Blocks ads, trackers, and known malicious sites before they load.",
      },
      {
        outcome: "Routes you through extra-secure servers in privacy-friendly countries",
        featureName: "Secure Core",
        asset: iconSecureCore,
        tooltip:
          "Routes your connection through an extra server in a privacy-friendly country before it reaches its destination.",
      },
    ],
    tip: null,
  },

  gaming: {
    jtbdKey: "gaming",
    jtbdLabel: "Gaming",
    enabled: [
      {
        outcome: "Uses the fastest connection method available, built to keep your ping low",
        settingsName: "Protocol",
        value: "WireGuard UDP",
        tooltip: PROTOCOL_TOOLTIP.wireguardUdp,
      },
      {
        outcome: "If your protection drops mid-match, your internet drops with it — so you're never exposed",
        settingsName: "Kill Switch",
        value: "Standard",
        tooltip: KILL_SWITCH_TOOLTIP.standard,
      },
    ],
    paid: [
      {
        outcome: "Easier to find matches and stay connected to other players",
        featureName: "Moderate NAT",
        asset: iconModerateNat,
        tooltip:
          "Relaxes connection rules so you can match with and stay connected to other players more easily.",
      },
      {
        outcome: "Play on servers in other regions — 148 countries on Plus",
        featureName: "Server breadth",
        asset: iconServerBreadth,
        tooltip: "Access to game servers across 148 countries, not just your own.",
      },
    ],
    tip: "A VPN will not lower your ping below your normal connection. With more locations on Plus, you can pick a server that keeps the difference small.",
  },

  bypass: {
    jtbdKey: "bypass",
    jtbdLabel: "Bypassing restrictions",
    enabled: [
      {
        outcome: "Disguises your connection so networks that block VPNs let it through",
        settingsName: "Protocol",
        value: "Stealth",
        tooltip: PROTOCOL_TOOLTIP.stealth,
      },
      {
        outcome: "Your internet only works while you're protected — even after a restart — so you're never caught unprotected",
        settingsName: "Kill Switch",
        value: "Advanced",
        tooltip: KILL_SWITCH_TOOLTIP.advanced,
      },
    ],
    paid: [
      {
        outcome: "Connects you to the fastest server outside your country, automatically",
        featureName: "Fastest outside-country",
        asset: iconAnticensorship,
        tooltip: "Finds and connects to the quickest server outside your country.",
      },
      {
        outcome: "Save your setup and reconnect with one tap",
        featureName: "Bypass profile",
        asset: iconSecurity,
        tooltip: "Saves your preferred connection setup for one-tap use next time.",
      },
    ],
    tip: "If a site or service still won't load, try connecting to a different server.",
  },

  travel: {
    jtbdKey: "travel",
    jtbdLabel: "Travel and Wi-Fi safety",
    enabled: [
      {
        outcome: "Automatically finds a way to connect, even on hotel or airport Wi-Fi that blocks VPNs",
        settingsName: "Protocol",
        value: "Smart",
        tooltip: PROTOCOL_TOOLTIP.smart,
      },
      {
        outcome: "If your protection drops on public Wi-Fi, your internet drops with it — so you're never exposed",
        settingsName: "Kill Switch",
        value: "Standard",
        tooltip: KILL_SWITCH_TOOLTIP.standard,
      },
    ],
    paid: [
      {
        outcome: "One tap to look like you're back home",
        featureName: "Home country profile",
        asset: iconBusiness,
        tooltip: "A saved one-tap setup that connects you back to your home country.",
      },
      {
        outcome: "Get warned before connecting to risky Wi-Fi",
        featureName: "Network warning",
        asset: iconNetworkWarning,
        tooltip: "Alerts you before you join a network that looks risky.",
      },
    ],
    tip: "Proton VPN is compatible with hotels, airports, and café captive portals.",
  },

  streaming: {
    jtbdKey: "streaming",
    jtbdLabel: "Streaming and content",
    enabled: [
      {
        outcome: "Uses the fastest connection method available, built for smooth playback",
        settingsName: "Protocol",
        value: "WireGuard UDP",
        tooltip: PROTOCOL_TOOLTIP.wireguardUdp,
      },
      {
        outcome: "If your protection drops while you're watching, your internet drops too — so nothing slips out",
        settingsName: "Kill Switch",
        value: "Standard",
        tooltip: KILL_SWITCH_TOOLTIP.standard,
      },
    ],
    paid: [
      {
        outcome: "Watch shows from other countries — US Netflix, UK Prime, and more",
        featureName: "Streaming servers",
        asset: iconStreaming,
        tooltip: "Servers chosen to work with streaming services in other countries.",
      },
      {
        outcome: "Smoother 4K and live video",
        featureName: "VPN Accelerator",
        asset: iconVpnAccelerator,
        tooltip: "Improves connection performance, which helps with high-quality and live video.",
      },
    ],
    tip: "Connect first, then open the app or site you want to watch.",
  },

  downloading: {
    jtbdKey: "downloading",
    jtbdLabel: "Downloading",
    enabled: [
      {
        outcome: "Automatically picks the fastest way to connect, so your download doesn't slow down",
        settingsName: "Protocol",
        value: "Smart",
        tooltip: PROTOCOL_TOOLTIP.smart,
      },
      {
        outcome: "Your internet only works while you're protected, so a download never continues unprotected",
        settingsName: "Kill Switch",
        value: "Advanced",
        tooltip: KILL_SWITCH_TOOLTIP.advanced,
      },
    ],
    paid: [
      {
        outcome: "Share files with others more easily — up to 10x faster on Plus",
        featureName: "Port Forwarding",
        asset: iconPortForwarding,
        tooltip: "Opens specific connection paths so file-sharing works faster.",
      },
      {
        outcome: "Connect to servers set up for file-sharing, picked automatically",
        featureName: "P2P servers",
        asset: iconP2pServers,
        tooltip: "Servers designed for file-sharing, chosen automatically when you need them.",
      },
    ],
    tip: "For torrenting and file-sharing, connect to a P2P server first — that is part of Plus.",
  },
};

/** Editorial priority for Multiple-mode's capped/ranked FREE settings list
 * (lower number = higher priority) — Kill Switch ranks above Protocol as the
 * more protection-critical of the two. Now covers the only 2 unique
 * `settingsName` values that exist across all 6 JTBDs (`"Protocol"` and
 * `"Kill Switch"` — see the `enabled` doc comment on `JTBDTuningResult`).
 * See `lib/jtbdMerge.ts` → `rankFreeSettings`, and `tuned-result/timing.ts`
 * → `freeRowCap` for the display cap this feeds. */
export const SETTINGS_RANK: Record<string, number> = {
  "Kill Switch": 1,
  Protocol: 2,
};

/** Editorial priority for Multiple-mode's capped/ranked PAID (VPN Plus)
 * features list (lower number = higher pitch value) — confirmed at
 * checkpoint. Covers every unique `featureName` across all 6 JTBDs (12
 * total). See `lib/jtbdMerge.ts` → `rankPaidFeatures`, and
 * `tuned-result/timing.ts` → `paidFeatureCap` for the display cap this
 * feeds. */
export const FEATURES_RANK: Record<string, number> = {
  NetShield: 1,
  "Secure Core": 2,
  "Streaming servers": 3,
  "VPN Accelerator": 4,
  "Server breadth": 5,
  "P2P servers": 6,
  "Port Forwarding": 7,
  "Moderate NAT": 8,
  "Fastest outside-country": 9,
  "Network warning": 10,
  "Home country profile": 11,
  "Bypass profile": 12,
};
