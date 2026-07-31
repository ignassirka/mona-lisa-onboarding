import type { JtbdId } from "./jtbdData";
import type { ToneOfVoice } from "./toneOfVoice";
import { JTBD_TUNING_RESULT } from "./jtbdTuningResult";

/** Per-JTBD, tone-voiced outcome sentences + tip — a sibling of the base
 * `JTBD_TUNING_RESULT` (`lib/jtbdTuningResult.ts`), which stays completely
 * unmodified: `settingsName`/`value`/`featureName`/`asset` (product
 * nomenclature and facts) are NEVER re-voiced and are read straight from the
 * base data everywhere; only the plain-language `outcome` sentences and the
 * `tip` change wording per tone here. Same tuple shape/order as the base
 * data's `enabled`/`paid` arrays, so callers can index them identically —
 * `enabled` is a 2-tuple (Protocol, then Kill Switch), matching
 * `JTBDTuningResult.enabled`'s reduced-to-2-settings shape. */
export interface JtbdToneOutcomes {
  enabled: [string, string];
  paid: [string, string];
  tip: string | null;
}

/** All tuning-stage per-JTBD outcome/tip copy, keyed by tone then JTBD.
 * `straightforward` reproduces `JTBD_TUNING_RESULT`'s existing `outcome`/
 * `tip` strings verbatim — built from that data rather than hand-copied, so
 * the two can never drift out of sync. The other three tones re-voice the
 * simplified baseline facts in each tone's register; nothing is invented. */
export const JTBD_TONE_OUTCOMES: Record<ToneOfVoice, Record<JtbdId, JtbdToneOutcomes>> = {
  straightforward: {
    privacy: {
      enabled: [JTBD_TUNING_RESULT.privacy.enabled[0].outcome, JTBD_TUNING_RESULT.privacy.enabled[1].outcome],
      paid: [JTBD_TUNING_RESULT.privacy.paid[0].outcome, JTBD_TUNING_RESULT.privacy.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.privacy.tip,
    },
    gaming: {
      enabled: [JTBD_TUNING_RESULT.gaming.enabled[0].outcome, JTBD_TUNING_RESULT.gaming.enabled[1].outcome],
      paid: [JTBD_TUNING_RESULT.gaming.paid[0].outcome, JTBD_TUNING_RESULT.gaming.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.gaming.tip,
    },
    bypass: {
      enabled: [JTBD_TUNING_RESULT.bypass.enabled[0].outcome, JTBD_TUNING_RESULT.bypass.enabled[1].outcome],
      paid: [JTBD_TUNING_RESULT.bypass.paid[0].outcome, JTBD_TUNING_RESULT.bypass.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.bypass.tip,
    },
    travel: {
      enabled: [JTBD_TUNING_RESULT.travel.enabled[0].outcome, JTBD_TUNING_RESULT.travel.enabled[1].outcome],
      paid: [JTBD_TUNING_RESULT.travel.paid[0].outcome, JTBD_TUNING_RESULT.travel.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.travel.tip,
    },
    streaming: {
      enabled: [JTBD_TUNING_RESULT.streaming.enabled[0].outcome, JTBD_TUNING_RESULT.streaming.enabled[1].outcome],
      paid: [JTBD_TUNING_RESULT.streaming.paid[0].outcome, JTBD_TUNING_RESULT.streaming.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.streaming.tip,
    },
    downloading: {
      enabled: [JTBD_TUNING_RESULT.downloading.enabled[0].outcome, JTBD_TUNING_RESULT.downloading.enabled[1].outcome],
      paid: [JTBD_TUNING_RESULT.downloading.paid[0].outcome, JTBD_TUNING_RESULT.downloading.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.downloading.tip,
    },
  },

  reassuring: {
    privacy: {
      enabled: [
        "The safest way to connect is chosen for you, automatically.",
        "If protection ever drops, your internet stops too — nothing slips out without you knowing.",
      ],
      paid: [
        "Ads, trackers, and malware are stopped before they ever reach you.",
        "You're routed through extra-secure servers in privacy-friendly countries — an extra layer of care.",
      ],
      tip: null,
    },
    gaming: {
      enabled: [
        "You get the fastest connection available, built to keep your ping low.",
        "Even if the connection drops mid-match, you're covered — nothing continues unprotected.",
      ],
      paid: [
        "Finding matches and staying connected to other players gets easier.",
        "You can play on servers in other regions — 148 countries on Plus.",
      ],
      tip: "A VPN won't lower your ping below your normal connection — that's just how it works. With more locations on Plus, you can pick a server that keeps the difference small.",
    },
    bypass: {
      enabled: [
        "Your connection is disguised so blockers let it through, without you lifting a finger.",
        "Your internet only runs while you're protected — even after a restart, you're covered.",
      ],
      paid: [
        "You're connected to the fastest server outside your country, automatically.",
        "Your preferred setup is saved, ready whenever you need it.",
      ],
      tip: "If a site or service still won't load, connecting to a different server usually helps.",
    },
    travel: {
      enabled: [
        "A way to connect is found automatically, even on Wi-Fi that tries to block VPNs.",
        "If protection drops on public Wi-Fi, your internet stops too — you're never left exposed.",
      ],
      paid: [
        "One tap and you look like you're back home.",
        "You'll be warned before connecting to risky Wi-Fi, so you can decide with confidence.",
      ],
      tip: "Proton VPN plays nicely with hotel, airport, and café captive portals — no extra steps needed.",
    },
    streaming: {
      enabled: [
        "You get the fastest connection available, built for smooth, uninterrupted playback.",
        "If protection drops while you're watching, everything stops too — nothing slips out.",
      ],
      paid: [
        "You can watch shows from other countries — US Netflix, UK Prime, and more.",
        "4K and live video play smoother, with less buffering to worry about.",
      ],
      tip: "Just connect first, then open the app or site you want to watch — that's all it takes.",
    },
    downloading: {
      enabled: [
        "You'll always connect the easy way — nothing to configure yourself.",
        "If protection ever drops, your download stops with it — you're never left exposed.",
      ],
      paid: [
        "Sharing files with others runs up to 10x faster on Plus.",
        "Servers set up for file-sharing are picked for you automatically.",
      ],
      tip: "For torrenting and file-sharing, just connect to a P2P server first — that's part of Plus.",
    },
  },

  empowering: {
    privacy: {
      enabled: [
        "You connect the most secure way possible, automatically.",
        "You stay covered — your internet only runs while you're protected.",
      ],
      paid: [
        "You browse ad-, tracker-, and malware-free, automatically.",
        "You route through extra-secure servers in privacy-friendly countries, on your terms.",
      ],
      tip: null,
    },
    gaming: {
      enabled: [
        "You get the fastest connection method, built for low ping.",
        "You stay covered mid-match — nothing continues if protection drops.",
      ],
      paid: [
        "You find matches and stay connected to other players more easily.",
        "You play on servers in other regions — 148 countries on Plus.",
      ],
      tip: "A VPN won't lower your ping below your normal connection. With more locations on Plus, you choose a server that keeps the difference small.",
    },
    bypass: {
      enabled: [
        "You get through blockers — your connection looks ordinary, automatically.",
        "You control the risk — your internet only works while you're protected, even after a restart.",
      ],
      paid: [
        "You connect to the fastest server outside your country, automatically.",
        "You keep a saved setup ready for one-tap reconnection.",
      ],
      tip: "If a site or service still won't load, you can switch to a different server yourself, any time.",
    },
    travel: {
      enabled: [
        "You connect automatically, even where Wi-Fi tries to block VPNs.",
        "You stay covered on public Wi-Fi — nothing leaves your computer unless it's protected.",
      ],
      paid: [
        "One tap and you look like you're back home, anytime.",
        "You get warned before connecting to risky Wi-Fi — you decide what to trust.",
      ],
      tip: "Proton VPN works right through hotel, airport, and café captive portals — no workaround needed.",
    },
    streaming: {
      enabled: [
        "You get the fastest connection method, built for smooth playback.",
        "You stay covered — nothing leaves your computer unless it's protected.",
      ],
      paid: [
        "You watch shows from other countries — US Netflix, UK Prime, and more.",
        "You get smoother 4K and live video, on demand.",
      ],
      tip: "Connect first, then open the app or site you want to watch — you're in control of the order.",
    },
    downloading: {
      enabled: [
        "You connect the fastest way possible, automatically.",
        "You stay covered — your internet only runs while you're protected.",
      ],
      paid: [
        "You share files with others up to 10x faster on Plus.",
        "You connect to servers set up for file-sharing, picked automatically.",
      ],
      tip: "For torrenting and file-sharing, connect to a P2P server first — that's part of Plus, and it's your call.",
    },
  },

  educational: {
    privacy: {
      enabled: [
        "Smart Protocol automatically picks the most secure way to connect for your network.",
        "Advanced Kill Switch only allows internet access while you're connected to Proton VPN — even after a restart.",
      ],
      paid: [
        "NetShield filters ads, trackers, and known malicious sites before they load on your device.",
        "Secure Core sends your connection through an extra server in a privacy-friendly country first.",
      ],
      tip: null,
    },
    gaming: {
      enabled: [
        "WireGuard UDP is the fastest connection method, prioritizing speed and low latency.",
        "Standard Kill Switch automatically disconnects your internet if the VPN connection is ever lost.",
      ],
      paid: [
        "This Plus feature relaxes connection rules so matchmaking and staying connected to other players is easier.",
        "Server breadth gives you game servers across 148 countries on Plus, not just your own region.",
      ],
      tip: "A VPN can't lower your ping below your normal connection — routing adds distance. With more locations on Plus, you can pick a server that keeps that difference small.",
    },
    bypass: {
      enabled: [
        "Stealth protocol disguises your VPN connection as regular traffic, so blockers let it through.",
        "Advanced Kill Switch only allows internet access while you're connected to Proton VPN — even after a restart.",
      ],
      paid: [
        "Fastest outside-country connects you to the quickest server outside your country automatically.",
        "Bypass profile saves your preferred setup for one-tap reconnection next time.",
      ],
      tip: "If a site or service still won't load through Stealth, switching to a different server can help.",
    },
    travel: {
      enabled: [
        "Smart Protocol automatically finds a way to connect, even on networks that try to block VPNs.",
        "Standard Kill Switch automatically disconnects your internet if the VPN connection is ever lost.",
      ],
      paid: [
        "Home country profile is a saved one-tap setup that connects you back to your home country.",
        "Network warning alerts you before you join a network that looks risky.",
      ],
      tip: "Proton VPN is built to work with hotel, airport, and café captive portals, which normally require a login step before granting internet access.",
    },
    streaming: {
      enabled: [
        "WireGuard UDP is the fastest connection method, built for smooth 4K and live video.",
        "Standard Kill Switch automatically disconnects your internet if the VPN connection is ever lost.",
      ],
      paid: [
        "Streaming servers are chosen to work with services like US Netflix and UK Prime from other countries.",
        "VPN Accelerator improves connection performance, which helps with high-quality and live video.",
      ],
      tip: "Streaming sites check your location when a page loads — connect first, then open the app or site, so it sees the right location from the start.",
    },
    downloading: {
      enabled: [
        "Smart Protocol automatically picks the fastest way to connect for your network.",
        "Advanced Kill Switch only allows internet access while you're connected to Proton VPN — even after a restart.",
      ],
      paid: [
        "Port Forwarding opens specific connection paths so file-sharing works up to 10x faster on Plus.",
        "P2P servers are designed for file-sharing and chosen automatically when you need them.",
      ],
      tip: "P2P servers are optimized for file-sharing — connect to one first (part of Plus) before you start.",
    },
  },
};

/** Tone-voiced outcome sentence for one enabled/paid feature slot, with
 * graceful fallback to `straightforward` if a tone is somehow missing (e.g.
 * a future tone added here without full JTBD coverage yet). */
export function toneOutcome(tone: ToneOfVoice, jtbdId: JtbdId, kind: "enabled" | "paid", index: number): string {
  const set = JTBD_TONE_OUTCOMES[tone]?.[jtbdId] ?? JTBD_TONE_OUTCOMES.straightforward[jtbdId];
  return kind === "enabled" ? set.enabled[index] : set.paid[index];
}

/** Tone-voiced tip for a JTBD (may be `null` — not every JTBD has one, same
 * as the base data), with the same fallback behavior as `toneOutcome`. */
export function toneTip(tone: ToneOfVoice, jtbdId: JtbdId): string | null {
  const set = JTBD_TONE_OUTCOMES[tone]?.[jtbdId] ?? JTBD_TONE_OUTCOMES.straightforward[jtbdId];
  return set.tip;
}
