import type { JtbdId } from "./jtbdData";
import type { ToneOfVoice } from "./toneOfVoice";
import { JTBD_TUNING_RESULT } from "./jtbdTuningResult";

/** Per-JTBD, tone-voiced outcome sentences + tip — a sibling of the base
 * `JTBD_TUNING_RESULT` (`lib/jtbdTuningResult.ts`), which stays completely
 * unmodified: `settingsName`/`value`/`featureName`/`asset` (product
 * nomenclature and facts) are NEVER re-voiced and are read straight from the
 * base data everywhere; only the plain-language `outcome` sentences and the
 * `tip` change wording per tone here. Same tuple shape/order as the base
 * data's `enabled`/`paid` arrays, so callers can index them identically. */
export interface JtbdToneOutcomes {
  enabled: [string, string, string];
  paid: [string, string];
  tip: string | null;
}

/** All tuning-stage per-JTBD outcome/tip copy, keyed by tone then JTBD.
 * `straightforward` reproduces `JTBD_TUNING_RESULT`'s existing `outcome`/
 * `tip` strings verbatim (same precedent as `CONNECTION_COPY.straightforward`
 * and `TUNING_COPY.straightforward`) — built from that data rather than
 * hand-copied, so the two can never drift out of sync. The other three tones
 * re-voice the same facts (same settings, same free/paid split, same real
 * numbers) in each tone's register; nothing is invented. */
export const JTBD_TONE_OUTCOMES: Record<ToneOfVoice, Record<JtbdId, JtbdToneOutcomes>> = {
  straightforward: {
    privacy: {
      enabled: [
        JTBD_TUNING_RESULT.privacy.enabled[0].outcome,
        JTBD_TUNING_RESULT.privacy.enabled[1].outcome,
        JTBD_TUNING_RESULT.privacy.enabled[2].outcome,
      ],
      paid: [JTBD_TUNING_RESULT.privacy.paid[0].outcome, JTBD_TUNING_RESULT.privacy.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.privacy.tip,
    },
    gaming: {
      enabled: [
        JTBD_TUNING_RESULT.gaming.enabled[0].outcome,
        JTBD_TUNING_RESULT.gaming.enabled[1].outcome,
        JTBD_TUNING_RESULT.gaming.enabled[2].outcome,
      ],
      paid: [JTBD_TUNING_RESULT.gaming.paid[0].outcome, JTBD_TUNING_RESULT.gaming.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.gaming.tip,
    },
    bypass: {
      enabled: [
        JTBD_TUNING_RESULT.bypass.enabled[0].outcome,
        JTBD_TUNING_RESULT.bypass.enabled[1].outcome,
        JTBD_TUNING_RESULT.bypass.enabled[2].outcome,
      ],
      paid: [JTBD_TUNING_RESULT.bypass.paid[0].outcome, JTBD_TUNING_RESULT.bypass.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.bypass.tip,
    },
    travel: {
      enabled: [
        JTBD_TUNING_RESULT.travel.enabled[0].outcome,
        JTBD_TUNING_RESULT.travel.enabled[1].outcome,
        JTBD_TUNING_RESULT.travel.enabled[2].outcome,
      ],
      paid: [JTBD_TUNING_RESULT.travel.paid[0].outcome, JTBD_TUNING_RESULT.travel.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.travel.tip,
    },
    streaming: {
      enabled: [
        JTBD_TUNING_RESULT.streaming.enabled[0].outcome,
        JTBD_TUNING_RESULT.streaming.enabled[1].outcome,
        JTBD_TUNING_RESULT.streaming.enabled[2].outcome,
      ],
      paid: [JTBD_TUNING_RESULT.streaming.paid[0].outcome, JTBD_TUNING_RESULT.streaming.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.streaming.tip,
    },
    downloading: {
      enabled: [
        JTBD_TUNING_RESULT.downloading.enabled[0].outcome,
        JTBD_TUNING_RESULT.downloading.enabled[1].outcome,
        JTBD_TUNING_RESULT.downloading.enabled[2].outcome,
      ],
      paid: [JTBD_TUNING_RESULT.downloading.paid[0].outcome, JTBD_TUNING_RESULT.downloading.paid[1].outcome],
      tip: JTBD_TUNING_RESULT.downloading.tip,
    },
  },

  reassuring: {
    privacy: {
      enabled: [
        "If the VPN ever drops, we cut your connection instantly \u2014 your real IP stays hidden.",
        "Devices on your local network can't reach you \u2014 you're isolated and safe.",
        "Unwanted incoming connections are blocked automatically, so you don't have to worry.",
      ],
      paid: [
        "Ads, trackers, and malware are stopped before they ever reach you.",
        "Your traffic is routed through extra-secure servers in privacy-friendly countries.",
      ],
      tip: null,
    },
    gaming: {
      enabled: [
        "Other players can't see your real IP \u2014 you're covered against being targeted.",
        "Even if the connection drops mid-match, your real IP stays hidden.",
        "You can play on Wi-Fi that usually blocks games \u2014 school, work, or dorm networks \u2014 without a hitch.",
      ],
      paid: [
        "Matchmaking is smoother, with fewer peer-connection problems to deal with.",
        "You can reach games and lobbies in other regions, on servers across 148 countries.",
      ],
      tip: "A VPN won't lower your ping below your normal connection \u2014 that's just how it works. With more locations on Plus, you can pick a server that keeps the difference small.",
    },
    bypass: {
      enabled: [
        "The right protocol for your network is chosen automatically \u2014 one less thing to think about.",
        "Even if DNS or normal IPs are blocked, you can still reach Proton.",
        "Your VPN traffic is disguised so it gets through even aggressive blockers.",
      ],
      paid: [
        "You're automatically connected to the fastest server outside your network.",
        "Your preferred bypass setup is saved, ready whenever you need it.",
      ],
      tip: "If Smart Protocol doesn't catch a block, you can switch to Stealth protocol yourself, any time.",
    },
    travel: {
      enabled: [
        "Other devices on local Wi-Fi can't reach you \u2014 public networks feel safer.",
        "You can still connect even on networks that block other VPN protocols.",
        "Unwanted incoming connections on public Wi-Fi are blocked, automatically.",
      ],
      paid: [
        "A saved profile lets you connect back to your home country's IP whenever you like.",
        "You'll be warned before connecting to risky Wi-Fi, so you can decide with confidence.",
      ],
      tip: "Proton VPN plays nicely with hotel, airport, and caf\u00e9 captive portals \u2014 no extra steps needed.",
    },
    streaming: {
      enabled: [
        "Your traffic is encrypted, so you can watch YouTube, Twitch, and whatever's available privately.",
        "Watch on your phone, computer, or browser \u2014 one device at a time, comfortably, on Free.",
        "If the VPN ever drops mid-watch, your real IP stays covered \u2014 no leaks.",
      ],
      paid: [
        "You can watch shows from other countries \u2014 US Netflix, UK Prime, and more.",
        "4K and live video play smoother, with less buffering to worry about.",
      ],
      tip: "Just connect first, then open the app or site you want to watch \u2014 that's all it takes.",
    },
    downloading: {
      enabled: [
        "Your downloads from direct links and other non-torrent sources stay private, automatically.",
        "If the connection drops, the download stops and your real address stays hidden.",
        "Downloads feel faster, with less strain on your computer.",
      ],
      paid: [
        "Torrenting and file-sharing run up to 10x faster.",
        "Servers are built and auto-picked for file-sharing, so you don't have to choose.",
      ],
      tip: "For torrenting and file-sharing, just connect to a P2P server first \u2014 that's part of Plus.",
    },
  },

  empowering: {
    privacy: {
      enabled: [
        "You're covered even if the VPN drops \u2014 your real IP never leaks.",
        "You control who reaches your device \u2014 local network access is locked down.",
        "You decide what gets in \u2014 unsolicited connections are blocked.",
      ],
      paid: [
        "You browse ad-, tracker-, and malware-free, automatically.",
        "You route through high-security servers in safe jurisdictions, on your terms.",
      ],
      tip: null,
    },
    gaming: {
      enabled: [
        "Your real IP stays hidden from other players \u2014 nobody can use it against you.",
        "You stay protected mid-match \u2014 your real IP stays hidden even if the connection drops.",
        "You play through networks that block games \u2014 school, work, or dorm \u2014 on your terms.",
      ],
      paid: [
        "You get better matchmaking and fewer peer-connection problems.",
        "You reach games and lobbies in other regions, on servers in 148 countries.",
      ],
      tip: "A VPN won't lower your ping below your normal connection. With more locations on Plus, you choose a server that keeps the difference small.",
    },
    bypass: {
      enabled: [
        "You always connect with the protocol that works on your network \u2014 chosen for you, automatically.",
        "You reach Proton even when DNS or normal IPs are blocked.",
        "You get through aggressive blockers \u2014 your VPN traffic is disguised.",
      ],
      paid: [
        "You connect to the fastest non-local server, automatically.",
        "You keep a saved profile for your preferred bypass setup, ready when you need it.",
      ],
      tip: "Switch to Stealth protocol yourself if Smart Protocol doesn't catch the block \u2014 you're always in control.",
    },
    travel: {
      enabled: [
        "You stay off-limits to other devices on local Wi-Fi \u2014 public networks, on your terms.",
        "You connect even on networks that try to block other VPN protocols.",
        "You control what reaches you \u2014 unsolicited connections on public Wi-Fi are blocked.",
      ],
      paid: [
        "You keep a saved profile to connect back to your home country's IP, anytime.",
        "You get warned before connecting to risky Wi-Fi \u2014 you decide what to trust.",
      ],
      tip: "Proton VPN works right through hotel, airport, and caf\u00e9 captive portals \u2014 no workaround needed.",
    },
    streaming: {
      enabled: [
        "You watch YouTube, Twitch, and whatever's available where you are \u2014 privately, on your terms.",
        "You watch on your phone, computer, or browser \u2014 one device at a time on Free.",
        "You stay covered \u2014 no IP leaks, even if the VPN drops while you're watching.",
      ],
      paid: [
        "You watch shows from other countries \u2014 US Netflix, UK Prime, and more.",
        "You get smoother 4K and live video, on demand.",
      ],
      tip: "Connect first, then open the app or site you want to watch \u2014 you're in control of the order.",
    },
    downloading: {
      enabled: [
        "You download privately from direct links and other non-torrent sources, on your terms.",
        "You stay covered \u2014 a dropped connection stops the download and hides your real address.",
        "You get faster downloads with less strain on your computer.",
      ],
      paid: [
        "You torrent and file-share up to 10x faster.",
        "You connect to servers built and auto-picked for file-sharing.",
      ],
      tip: "For torrenting and file-sharing, connect to a P2P server first \u2014 that's part of Plus, and it's your call.",
    },
  },

  educational: {
    privacy: {
      enabled: [
        "Kill Switch cuts your connection the instant the VPN drops, so your real IP can't leak out.",
        "Blocking local network access stops other devices on your network from reaching you \u2014 a stricter isolation setting.",
        "A strict NAT type rejects incoming connections you didn't request, tightening your security profile.",
      ],
      paid: [
        "NetShield filters ads, trackers, and malware at the network level, before they reach your device.",
        "Secure Core routes your traffic through hardened servers in privacy-friendly countries first, adding a layer of protection.",
      ],
      tip: null,
    },
    gaming: {
      enabled: [
        "Hidden IP masks your real address from other players, so it can't be used to target or attack you.",
        "Kill Switch cuts your connection if the VPN drops, keeping your real IP hidden mid-match.",
        "Smart Protocol automatically picks a protocol that gets through networks \u2014 school, work, dorm \u2014 that block games.",
      ],
      paid: [
        "Moderate NAT eases NAT restrictions, improving matchmaking and reducing peer-connection issues.",
        "Server breadth gives you game servers and lobbies across 148 countries to connect through.",
      ],
      tip: "A VPN can't lower your ping below your normal connection \u2014 routing adds distance. With more locations on Plus, you can pick a server that keeps that difference small.",
    },
    bypass: {
      enabled: [
        "Smart Protocol automatically selects the connection protocol that works on your specific network.",
        "Alternative Routing reaches Proton through alternate paths when DNS or normal IPs are blocked.",
        "Stealth protocol disguises VPN traffic as regular traffic, so it slips past aggressive blockers.",
      ],
      paid: [
        "Fastest outside-country auto-connects to the fastest server outside your country to avoid local blocks.",
        "Bypass profile saves your preferred bypass setup for one-tap reconnection.",
      ],
      tip: "Smart Protocol usually detects blocks automatically \u2014 if it doesn't, switching to Stealth protocol manually disguises your traffic further.",
    },
    travel: {
      enabled: [
        "Turning off the LAN setting blocks local Wi-Fi devices from reaching you, for safer public networks.",
        "Stealth protocol lets you connect on restrictive networks that block standard VPN protocols.",
        "A strict NAT type rejects unrequested incoming connections on untrusted public networks.",
      ],
      paid: [
        "Home country profile saves a profile to quickly connect back to your home country's IP.",
        "Network warning alerts you before connecting to risky or unsecured Wi-Fi.",
      ],
      tip: "Proton VPN is built to work with hotel, airport, and caf\u00e9 captive portals, which normally require a login step before granting internet access.",
    },
    streaming: {
      enabled: [
        "Encrypting your connection keeps your activity private while you watch YouTube, Twitch, or whatever's available where you are.",
        "The Free plan supports one connected device at a time \u2014 your phone, computer, or browser.",
        "Kill Switch stops traffic the moment the VPN drops, preventing IP leaks while streaming.",
      ],
      paid: [
        "Streaming servers are optimized for accessing libraries like US Netflix and UK Prime from other countries.",
        "VPN Accelerator boosts connection speeds for smoother 4K and live video.",
      ],
      tip: "Streaming sites check your location when a page loads \u2014 connect first, then open the app or site, so it sees the right location from the start.",
    },
    downloading: {
      enabled: [
        "Encrypting your connection keeps downloads from direct links and other non-torrent sources private.",
        "Kill Switch halts downloads and hides your real IP the moment the connection drops.",
        "WireGuard Kernel runs at the kernel level for faster, lighter downloads with less strain on your computer.",
      ],
      paid: [
        "Port Forwarding opens ports for faster torrenting and file-sharing \u2014 up to 10x.",
        "P2P servers are tuned and auto-selected specifically for file-sharing traffic.",
      ],
      tip: "P2P servers are optimized for torrenting and file-sharing traffic \u2014 connect to one first (part of Plus) before you start.",
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
