import type { JtbdId } from "../lib/jtbdData";

/** Content for the Free path of the "Minimal list" tuning concept
 * (`TunedResult` with `layout="stacked"`, `userPlan="free"`) — and ONLY that
 * path. Every other concept, layout and the Plus path keep reading
 * `JTBD_TUNING_RESULT` unchanged.
 *
 * Two things make this a separate source rather than a filter over the shared
 * data:
 *
 * 1. The Free minimal list shows **Protocol and Auto Connect**, not Protocol
 *    and Kill Switch. Protocol is always **Smart** on this path — the same
 *    default every free user gets — with a single static outcome sentence;
 *    Auto Connect is a real Proton VPN setting that the shared data never
 *    modelled, so its copy lives here.
 * 2. Below the two settings sit the **value claims** — things that are
 *    already true of the plan, not settings anything just changed. They
 *    deliberately carry no settings chip, because there is no setting
 *    behind them to name.
 *
 * See docs/features/onboarding-v2.md → "Free minimal list content". */

/** One real, tunable setting row — resolves to a green check, an outcome
 * sentence, and a `{settingsName}: {value}` chip. */
export interface FreeMinimalSetting {
  settingsName: string;
  value: string;
  outcome: string;
  tooltip: string;
  /** Phase-1 narration ("Selecting protocol…") for this row. */
  narration: string;
}

/** One value claim — a green check and a sentence, no chip. */
export interface FreeMinimalClaim {
  text: string;
  narration: string;
}

export interface FreeMinimalContent {
  settings: FreeMinimalSetting[];
  claims: FreeMinimalClaim[];
}

/** Protocol on the Free minimal list — always Smart, regardless of which
 * intents were selected. Free tuning doesn't expose Stealth/WireGuard UDP
 * as the applied protocol here; the row states the default connection mode. */
const PROTOCOL_VALUE = "Smart";
const PROTOCOL_OUTCOME = "Auto-selects the best protocol for your connection";
const PROTOCOL_TOOLTIP =
  "A VPN protocol determines how data moves between a VPN server and your device.";

/** Auto Connect on this path is a single on/off toggle — the chip always
 * reads `"On"`. Unlike Protocol (and unlike this same setting's earlier,
 * per-intent-outcome version), the sentence beside it is tone-constant and
 * intent-constant: what the setting DOES doesn't change with what you use
 * the VPN for, so there's no honest per-intent nuance to write here the way
 * Kill Switch's `Advanced`/`Standard` split has one. */
const AUTO_CONNECT_OUTCOME = "Auto-connect every time your computer launches";

const AUTO_CONNECT_TOOLTIP =
  "Proton VPN starts when your computer launches and connects automatically — no need to open the app yourself.";

/** The one value claim shown regardless of selection — first in the list,
 * before any intent-specific claims. Unlimited data/no time limits is true
 * of Proton VPN Free for every intent equally (never a Plus-only capability
 * quietly implied as free), so it doesn't need an intent to attach to. */
const STATIC_CLAIM: FreeMinimalClaim = {
  text: "No data limits or time caps — stay connected 24/7",
  narration: "Checking data limits…",
};

/** Exactly one value claim per intent — shown for every selected intent,
 * uncapped (1 selected \u2192 1 claim, 6 selected \u2192 all 6). Honesty rules apply
 * as strictly here as anywhere else on this screen: every one of these is
 * true of Proton VPN Free specifically, none of them quietly describes a
 * Plus capability, and none is tied to a setting, which is why none of them
 * gets a chip. */
const VALUE_CLAIMS: Record<JtbdId, FreeMinimalClaim> = {
  privacy: {
    text: "Keep your browsing activity private",
    narration: "Checking privacy protection…",
  },
  gaming: {
    text: "Protect your online identity from other players",
    narration: "Checking IP protection…",
  },
  bypass: {
    text: "Reach sites and apps blocked in your region",
    narration: "Checking network restrictions…",
  },
  travel: {
    text: "Protect your device on hotel, airport, and café Wi-Fi",
    narration: "Checking Wi-Fi protection…",
  },
  streaming: {
    text: "Enjoy privately YouTube, Twitch, social media, news, and more",
    narration: "Checking site access…",
  },
  downloading: {
    text: "Keep your download activity private",
    narration: "Checking IP protection…",
  },
};

/** Builds the Free minimal list for a selection of 1–6 intents. No `tone`
 * parameter anymore `[UPDATED]` — Protocol, Auto Connect, and every claim on
 * this path are now static/generic rather than tone-voiced, so there's
 * nothing left here for a tone to vary.
 *
 * Protocol is always Smart with a static outcome (see `PROTOCOL_OUTCOME`).
 * Auto Connect is likewise intent-constant (see `AUTO_CONNECT_OUTCOME`'s
 * own doc).
 *
 * Claims are `[STATIC_CLAIM, ...one claim per selected intent, in selection
 * order]` — deliberately uncapped, unlike every other capped/ranked list on
 * this screen (`freeRowCap`, `FEATURES_RANK`, etc.): 1 intent selected shows
 * 2 claims total (the static one + that intent's), 6 selected shows 7. The
 * shared materialization schedule's `pacingGuardRowThreshold` already
 * compresses pacing once the row count gets large, so a long list at 6
 * intents doesn't run the intro any longer than the screen's ~12s budget. */
export function buildFreeMinimalContent(selected: JtbdId[]): FreeMinimalContent {
  const settings: FreeMinimalSetting[] = [
    {
      settingsName: "Protocol",
      value: PROTOCOL_VALUE,
      outcome: PROTOCOL_OUTCOME,
      tooltip: PROTOCOL_TOOLTIP,
      narration: "Selecting protocol…",
    },
    {
      settingsName: "Auto Connect",
      value: "On",
      outcome: AUTO_CONNECT_OUTCOME,
      tooltip: AUTO_CONNECT_TOOLTIP,
      narration: "Setting up Auto Connect…",
    },
  ];

  const claims: FreeMinimalClaim[] = [STATIC_CLAIM, ...selected.map((jtbd) => VALUE_CLAIMS[jtbd])];

  return { settings, claims };
}
