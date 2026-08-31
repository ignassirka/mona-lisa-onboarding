import { mergeFreeSettings } from "../lib/jtbdMerge";
import { toneOutcome } from "../lib/jtbdTuningToneCopy";
import type { JtbdId } from "../lib/jtbdData";
import type { ToneOfVoice } from "../lib/toneOfVoice";

/** Content for the Free path of the "Minimal list" tuning concept
 * (`TunedResult` with `layout="stacked"`, `userPlan="free"`) — and ONLY that
 * path. Every other concept, layout and the Plus path keep reading
 * `JTBD_TUNING_RESULT` unchanged.
 *
 * Two things make this a separate source rather than a filter over the shared
 * data:
 *
 * 1. The Free minimal list shows **Protocol and Auto Connect**, not Protocol
 *    and Kill Switch. Protocol still comes from `JTBD_TUNING_RESULT` (via
 *    `mergeFreeSettings`, so its per-intent value, conflict resolution and
 *    tone-voiced sentence are all the shared ones); Auto Connect is a real
 *    Proton VPN setting that the shared data never modelled, so its
 *    per-intent copy lives here.
 * 2. Below the two settings sit 2 **value claims** — things that are
 *    already true of the plan for that intent, not settings anything just
 *    changed. They deliberately carry no settings chip, because there is no
 *    setting behind them to name.
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

/** Auto Connect on this path is a single on/off toggle — the chip always
 * reads `"On"`. What varies by intent is only the sentence beside it; the
 * tooltip is shared, per the `PROTOCOL_TOOLTIP`/`KILL_SWITCH_TOOLTIP`
 * precedent in `lib/jtbdTuningResult.ts`. */
const AUTO_CONNECT_TOOLTIP =
  "Proton VPN starts when your computer launches and connects automatically — no need to open the app yourself.";

/** Auto Connect, per intent. The value is always `"On"` — auto-connect here
 * means the VPN app starts with your computer and connects right away. The
 * per-intent nuance lives entirely in the outcome sentence, the way Kill
 * Switch's `Advanced`/`Standard` split lives in the sentence while the
 * setting name stays the same. */
const AUTO_CONNECT: Record<JtbdId, Pick<FreeMinimalSetting, "outcome">> = {
  privacy: {
    outcome: "Proton VPN starts with your computer and connects right away, so you're never online unprotected",
  },
  gaming: {
    outcome: "You're protected before you launch a game — the VPN starts and connects as soon as your computer does",
  },
  bypass: {
    outcome: "Proton VPN is already connected by the time you open a browser — it starts and connects with your computer",
  },
  travel: {
    outcome: "The VPN starts and connects as soon as your computer boots, so hotel or airport Wi-Fi never sees you unprotected",
  },
  streaming: {
    outcome: "You're already connected when you sit down to watch — Proton VPN starts and connects with your computer",
  },
  downloading: {
    outcome: "The VPN is on before anything starts transferring — it starts and connects as soon as your computer launches",
  },
};

/** Three value claims per intent, most-relevant first. Honesty rules apply as
 * strictly here as anywhere else on this screen: every one of these is true
 * of Proton VPN Free specifically (no-logs and independently audited, Swiss
 * jurisdiction, open-source apps, unlimited data, no ads) — none of them
 * quietly describes a Plus capability, and none is tied to a setting, which
 * is why none of them gets a chip. */
const VALUE_CLAIMS: Record<JtbdId, FreeMinimalClaim[]> = {
  privacy: [
    {
      text: "What you do online stays yours — Proton VPN keeps no logs of your activity",
      narration: "Checking the no-logs policy…",
    },
    {
      text: "Swiss privacy law governs your data, outside EU and US surveillance agreements",
      narration: "Checking jurisdiction…",
    },
    {
      text: "Every Proton VPN app is open source and independently audited",
      narration: "Checking audit status…",
    },
  ],
  gaming: [
    {
      text: "Your real IP address stays hidden, so nobody can aim traffic at your connection",
      narration: "Checking IP protection…",
    },
    {
      text: "Unlimited data on every plan, so a long session is never throttled or cut short",
      narration: "Checking data limits…",
    },
    {
      text: "No ads and no trackers — Proton VPN is funded by subscriptions, not your data",
      narration: "Checking the funding model…",
    },
  ],
  bypass: [
    {
      text: "Proton VPN is open source and independently audited, so nothing is hidden in the app",
      narration: "Checking audit status…",
    },
    {
      text: "Swiss privacy law governs your data, outside EU and US surveillance agreements",
      narration: "Checking jurisdiction…",
    },
    {
      text: "Unlimited data on every plan, so you're never cut off part-way through",
      narration: "Checking data limits…",
    },
  ],
  travel: [
    {
      text: "Your traffic is encrypted end to end, so shared Wi-Fi can't read any of it",
      narration: "Checking encryption…",
    },
    {
      text: "No logs are kept, so where you connected from isn't recorded anywhere",
      narration: "Checking the no-logs policy…",
    },
    {
      text: "Unlimited data on every plan, however long the trip runs",
      narration: "Checking data limits…",
    },
  ],
  streaming: [
    {
      text: "Unlimited data on every plan, so nothing gets throttled part-way through an episode",
      narration: "Checking data limits…",
    },
    {
      text: "Your internet provider can't see what you're watching",
      narration: "Checking what your ISP can see…",
    },
    {
      text: "No ads and no trackers — Proton VPN is funded by subscriptions, not your data",
      narration: "Checking the funding model…",
    },
  ],
  downloading: [
    {
      text: "Your real IP address stays hidden from everyone else in the transfer",
      narration: "Checking IP protection…",
    },
    {
      text: "No logs are kept, so what you transferred isn't recorded anywhere",
      narration: "Checking the no-logs policy…",
    },
    {
      text: "Unlimited data on every plan, however large the file",
      narration: "Checking data limits…",
    },
  ],
};

/** How many claims are ever shown, however many intents are selected. Two
 * claims plus the two settings is a four-row list, which still clears the
 * screen's row budget at every selection size. */
export const FREE_MINIMAL_CLAIM_CAP = 2;

/** Builds the Free minimal list for a selection of 1–6 intents.
 *
 * Protocol keeps the shared merge behaviour verbatim — `mergeFreeSettings`
 * resolves the per-intent value conflict ("strictest wins") and hands back
 * the earliest-selected contributor, whose tone-voiced sentence this uses.
 *
 * Auto Connect resolves as "first-selected intent wins, outright" for its
 * sentence — the chip is always `"On"`, so there's no value/sentence pair
 * to keep in sync, but the outcome still needs to match the user's primary
 * intent.
 *
 * Claims are gathered round-robin across the selection — first claim of each
 * selected intent, then second, and so on — deduplicated by text and capped.
 * Round-robin rather than intent-by-intent so that with 3 intents selected
 * the user sees one claim per intent instead of all three from whichever they
 * happened to pick first. */
export function buildFreeMinimalContent(selected: JtbdId[], tone: ToneOfVoice): FreeMinimalContent {
  const protocol = mergeFreeSettings(selected).find((f) => f.settingsName === "Protocol")!;
  const autoConnect = AUTO_CONNECT[selected[0]!];

  const settings: FreeMinimalSetting[] = [
    {
      settingsName: protocol.settingsName,
      value: protocol.value,
      outcome: toneOutcome(tone, protocol.primarySourceJtbd, "enabled", protocol.primarySourceIndex),
      tooltip: protocol.tooltip ?? "",
      narration: "Selecting protocol…",
    },
    {
      settingsName: "Auto Connect",
      value: "On",
      // Auto Connect exists only on this path, so it has no entry in
      // `JTBD_TONE_OUTCOMES` and reads the same in every tone. Same
      // fallback-to-straightforward precedent the Multiple-mode strings in
      // `lib/toneOfVoice.tsx` already set.
      outcome: autoConnect.outcome,
      tooltip: AUTO_CONNECT_TOOLTIP,
      narration: "Setting up Auto Connect…",
    },
  ];

  const claims: FreeMinimalClaim[] = [];
  const seen = new Set<string>();
  const deepest = Math.max(...selected.map((jtbd) => VALUE_CLAIMS[jtbd].length));
  for (let round = 0; round < deepest && claims.length < FREE_MINIMAL_CLAIM_CAP; round++) {
    for (const jtbd of selected) {
      if (claims.length >= FREE_MINIMAL_CLAIM_CAP) break;
      const claim = VALUE_CLAIMS[jtbd][round];
      if (!claim || seen.has(claim.text)) continue;
      seen.add(claim.text);
      claims.push(claim);
    }
  }

  return { settings, claims };
}
