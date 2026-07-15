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
  /** Tooltip content for the (i) icon — shown on hover */
  tooltip?: string;
}

export interface PaidFeature {
  /** Plain-language outcome (left side, muted) */
  outcome: string;
  /** Feature name shown on the right */
  featureName: string;
  /** Imported Figma decorative asset URL for this row */
  asset: string;
  /** Tooltip content for the (i) icon — shown on hover */
  tooltip?: string;
}

export interface JTBDTuningResult {
  jtbdKey: JTBDKey;
  /** Goes inside: Tuned for "___" */
  jtbdLabel: string;
  enabled: [EnabledFeature, EnabledFeature, EnabledFeature]; // exactly 3
  paid: [PaidFeature, PaidFeature]; // exactly 2
  tip: string | null;
}

export const JTBD_TUNING_RESULT: Record<JTBDKey, JTBDTuningResult> = {
  privacy: {
    jtbdKey: "privacy",
    jtbdLabel: "Privacy and security",
    enabled: [
      {
        outcome: "Stop all traffic if the VPN drops, so your real IP never leaks",
        settingsName: "Kill Switch",
        value: "On",
        tooltip: "Instantly blocks internet access if the VPN connection drops, so your real IP can't leak.",
      },
      {
        outcome: "Block local network access for stricter isolation",
        settingsName: "LAN setting",
        value: "Blocked",
        tooltip: "Stops other devices on your local network from reaching your device.",
      },
      {
        outcome: "Block unsolicited incoming connections",
        settingsName: "NAT type",
        value: "Strict",
        tooltip: "Rejects unrequested incoming connections for a tighter security profile.",
      },
    ],
    paid: [
      {
        outcome: "Block ads, trackers, and malware before they reach you",
        featureName: "NetShield",
        asset: iconNetShield,
        tooltip: "Blocks ads, trackers, and malware at the network level.",
      },
      {
        outcome: "Route through high-security servers in safe jurisdictions",
        featureName: "Secure Core",
        asset: iconSecureCore,
        tooltip: "Routes your traffic through hardened servers in privacy-friendly countries first.",
      },
    ],
    tip: null, // source screen was cut off — confirm or pull tip from Figma
  },

  gaming: {
    jtbdKey: "gaming",
    jtbdLabel: "Gaming",
    enabled: [
      {
        outcome: "Hide your real IP from other players, so it can't be used to attack you",
        settingsName: "Hidden IP",
        value: "On",
        tooltip: "Masks your real IP from other players so it can't be used to target you.",
      },
      {
        outcome: "Keep your real IP hidden if the connection drops mid-match",
        settingsName: "Kill Switch",
        value: "On",
        tooltip: "Cuts internet if the VPN drops, keeping your real IP hidden mid-match.",
      },
      {
        outcome: "Play on Wi-Fi that blocks games - school, work, or dorm networks",
        settingsName: "Smart Protocol",
        value: "Auto",
        tooltip: "Automatically picks a protocol that gets through networks that block games.",
      },
    ],
    paid: [
      {
        outcome: "Better matchmaking and fewer peer-connection problems",
        featureName: "Moderate NAT",
        asset: iconModerateNat,
        tooltip: "Eases NAT restrictions for better matchmaking and fewer connection issues.",
      },
      {
        outcome: "Reach games and lobbies in other regions, on servers in 148 countries",
        featureName: "Server breadth",
        asset: iconServerBreadth,
        tooltip: "Connect to game servers and lobbies across 148 countries.",
      },
    ],
    tip: "A VPN will not lower your ping below your normal connection. With more locations on Plus, you can pick a server that keeps the difference small.",
  },

  bypass: {
    jtbdKey: "bypass",
    jtbdLabel: "Bypassing restrictions",
    enabled: [
      {
        outcome: "Automatically choose the protocol that works on your network",
        settingsName: "Smart Protocol",
        value: "Auto",
        tooltip: "Automatically selects the connection protocol that works on your network.",
      },
      {
        outcome: "Reach Proton even when DNS or normal IPs are blocked",
        settingsName: "Alternative Routing",
        value: "On",
        tooltip: "Reaches Proton through alternate paths when DNS or normal IPs are blocked.",
      },
      {
        outcome: "Disguise VPN traffic so it gets through aggressive blockers",
        settingsName: "Stealth protocol",
        value: "On",
        tooltip: "Disguises VPN traffic as regular traffic to slip past aggressive blockers.",
      },
    ],
    paid: [
      {
        outcome: "Automatically connect to the fastest non-local server",
        featureName: "Fastest outside-country",
        asset: iconAnticensorship,
        tooltip: "Auto-connects to the fastest server outside your country to avoid local blocks.",
      },
      {
        outcome: "Saved profile for your preferred bypass setup",
        featureName: "Bypass profile",
        asset: iconSecurity,
        tooltip: "Save your preferred bypass setup for one-tap reconnection.",
      },
    ],
    tip: "Switch to Stealth protocol manually if Smart Protocol does not detect the block.",
  },

  travel: {
    jtbdKey: "travel",
    jtbdLabel: "Travel and Wi-Fi safety",
    enabled: [
      {
        outcome: "Block local Wi-Fi devices for safer public networks",
        settingsName: "LAN setting",
        value: "Off",
        tooltip: "Disables local network access so other devices on public Wi-Fi can't reach you.",
      },
      {
        outcome: "Connect on networks that block other VPN protocols",
        settingsName: "Stealth protocol",
        value: "On",
        tooltip: "Connects on restrictive networks that block standard VPN protocols.",
      },
      {
        outcome: "Block unsolicited incoming connections on public Wi-Fi",
        settingsName: "NAT type",
        value: "Strict",
        tooltip: "Rejects unrequested incoming connections on untrusted public networks.",
      },
    ],
    paid: [
      {
        outcome: "Saved profile for connecting back to your home country's IP",
        featureName: "Home country profile",
        asset: iconBusiness,
        tooltip: "Save a profile to quickly connect back to your home country's IP.",
      },
      {
        outcome: "Get warned before connecting to risky Wi-Fi",
        featureName: "Network warning",
        asset: iconNetworkWarning,
        tooltip: "Alerts you before connecting to risky or unsecured Wi-Fi.",
      },
    ],
    tip: "Proton VPN is compatible with hotels, airports, and café captive portals.",
  },

  streaming: {
    jtbdKey: "streaming",
    jtbdLabel: "Streaming and content",
    enabled: [
      {
        outcome: "Watch privately on YouTube, Twitch, and whatever's available where you are",
        settingsName: "Encrypted connection",
        value: "On",
        tooltip: "Encrypts your traffic so your activity stays private while you watch.",
      },
      {
        outcome: "Watch on your phone, computer, or browser - one device at a time on Free",
        settingsName: "Device support",
        value: "1 device",
        tooltip: "The Free plan supports one device connected at a time.",
      },
      {
        outcome: "Stop IP leaks if the VPN drops while watching",
        settingsName: "Kill Switch",
        value: "On",
        tooltip: "Stops traffic if the VPN drops, preventing IP leaks while streaming.",
      },
    ],
    paid: [
      {
        outcome: "Watch shows from other countries - US Netflix, UK Prime, and more",
        featureName: "Streaming servers",
        asset: iconStreaming,
        tooltip: "Servers optimized for accessing streaming libraries in other countries.",
      },
      {
        outcome: "Smoother 4K and live video",
        featureName: "VPN Accelerator",
        asset: iconVpnAccelerator,
        tooltip: "Boosts connection speeds for smoother 4K and live video.",
      },
    ],
    tip: "Connect first, then open the app or site you want to watch.",
  },

  downloading: {
    jtbdKey: "downloading",
    jtbdLabel: "Downloading",
    enabled: [
      {
        outcome: "Download privately from direct links and other non-torrent sources",
        settingsName: "Encrypted connection",
        value: "On",
        tooltip: "Encrypts your traffic so downloads from direct links stay private.",
      },
      {
        outcome: "Stop a download and hide your real address if the connection drops",
        settingsName: "Kill Switch",
        value: "On",
        tooltip: "Halts downloads and hides your real IP if the connection drops.",
      },
      {
        outcome: "Faster downloads with less strain on your computer",
        settingsName: "WireGuard Kernel",
        value: "On",
        tooltip: "Uses the kernel-level WireGuard module for faster, lighter downloads.",
      },
    ],
    paid: [
      {
        outcome: "Torrenting and file-sharing, up to 10x faster",
        featureName: "Port Forwarding",
        asset: iconPortForwarding,
        tooltip: "Opens ports for faster torrenting and file-sharing.",
      },
      {
        outcome: "Servers built and auto-picked for file-sharing",
        featureName: "P2P servers",
        asset: iconP2pServers,
        tooltip: "Servers tuned and auto-selected for file-sharing traffic.",
      },
    ],
    tip: "For torrenting and file-sharing, connect to a P2P server first - that is part of Plus.",
  },
};

/** Editorial priority for Multiple-mode's capped/ranked FREE settings list
 * (lower number = higher priority) — confirmed at checkpoint. Protection-
 * critical settings (Kill Switch, Smart Protocol, Stealth protocol,
 * Alternative Routing) rank highest; the core encryption/security settings
 * next; niceties (WireGuard Kernel, the informational "Device support" row)
 * rank lowest. Covers every unique `settingsName` across all 6 JTBDs (10
 * total). See `lib/jtbdMerge.ts` → `rankFreeSettings`, and
 * `tuned-result/timing.ts` → `freeRowCap` for the display cap this feeds. */
export const SETTINGS_RANK: Record<string, number> = {
  "Kill Switch": 1,
  "Smart Protocol": 2,
  "Stealth protocol": 3,
  "Alternative Routing": 4,
  "Encrypted connection": 5,
  "NAT type": 6,
  "Hidden IP": 7,
  "LAN setting": 8,
  "WireGuard Kernel": 9,
  "Device support": 10,
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
