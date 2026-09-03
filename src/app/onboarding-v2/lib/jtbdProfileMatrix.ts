import type { JtbdId, ProfileId } from "./jtbdData";
import { JTBD_TUNING_RESULT } from "./jtbdTuningResult";
import { OFF_TOOLTIP } from "./jtbdProfileConfig";
// Per-profile card artwork for the "Profiles carousel v2" concept and every
// consumer that shares its full-bleed portrait cards (upsell, welcome, …).
// Portrait branded illustrations (941×1672), deliberately NOT the
// `profile-photo-*.jpg` photography v1 and Profile-first use: v2's card is
// the artwork edge to edge at nearly twice the height, which needs a
// composed, vertical, brand-coloured image rather than a landscape photo.
import photoStreaming from "../assets/profile-card-streaming.png";
import photoDownloading from "../assets/profile-card-downloading.png";
import photoGaming from "../assets/profile-card-gaming.png";
import photoTravel from "../assets/profile-card-travel.png";
import photoBypass from "../assets/profile-card-bypass.png";
import photoPrivacyDaily from "../assets/profile-card-privacy-daily.png";
import photoPrivacyAdvanced from "../assets/profile-card-privacy-advanced.png";

/** **Authored prototype data, owned by Profiles carousel v2 alone.**
 *
 * The full per-profile configuration matrix product supplied for v2. It is
 * deliberately a SECOND table rather than an edit to v1's `CONFIG_VALUES`
 * in `jtbdProfileConfig.ts`, and it disagrees with the rest of the
 * prototype in four places. Every divergence is intentional and listed here
 * so nobody "fixes" one by making the two agree:
 *
 * - **NetShield** is On for all six profiles here; v1's table leaves it off
 *   for Streaming, Gaming and Bypass.
 * - **Port forwarding** is on only for Downloading here; v1 also turns it on
 *   for Gaming.
 * - **NAT type** is Moderate for Gaming AND Travel here; v1 only for Gaming.
 * - **Protocol** is authored here, whereas v1 DERIVES it from
 *   `JTBD_TUNING_RESULT[jtbd].enabled[0]`. For Gaming, Streaming and Travel
 *   the two disagree (this matrix: Smart, Smart, Stealth — the tuning step:
 *   WireGuard UDP, WireGuard UDP, Smart). See `PROTOCOL_TOOLTIP` below for
 *   how the explanation stays correct despite that.
 * - **Destinations** differ from `JTBD_PROFILES`' own `country` for Daily
 *   privacy (fastest country here, Switzerland there) and for two other
 *   intents: Downloading (fastest P2P country / Netherlands) and Travel
 *   (United Kingdom / fastest country). Gaming's own `countryLabel` was
 *   updated to match this table's `COUNTRY_RULE.fastestP2p`, and Advanced
 *   privacy's to match `COUNTRY_RULE.fastestSecureCore`, rather than left to
 *   diverge. Only Streaming's United States agrees outright.
 *
 * `customDns` and `connectAndGo` are recorded so this file is the complete
 * matrix, but nothing renders them: Custom DNS is Off for all six, so a row
 * for it would differentiate nothing, and Connect & Go is a behaviour ("open
 * netflix.com after connecting") rather than a value a settings row can
 * state. */
export interface ProfileMatrixEntry {
  connectionType: "Standard" | "Secure Core" | "P2P";
  protocol: "Smart" | "Stealth";
  netShield: "On" | "Off";
  portForwarding: "On" | "Off";
  customDns: "On" | "Off";
  allowLan: "On" | "Off";
  natType: "Strict" | "Moderate";
  /** The country dropdown's starting value — either a `COUNTRY_RULE` id or a
   * country name present in `countryMarkers`. */
  country: string;
  /** What the profile would open after connecting, or `null`. Not rendered. */
  connectAndGo: string | null;
}

/** Rule-based destinations — behaviours rather than places, so they can't be
 * expressed as a country name. Namespaced so a rule id can never collide
 * with one of `countryMarkers`' 93 names. */
export const COUNTRY_RULE = {
  fastest: "rule:fastest",
  fastestP2p: "rule:fastest-p2p",
  fastestOutside: "rule:fastest-outside",
  fastestSecureCore: "rule:fastest-secure-core",
} as const;

/** The rule entries every v2 card's dropdown offers, above the country list.
 * Same four on every card — only the DEFAULT differs per profile, so a user
 * who wants "fastest P2P" on the Streaming card (or "Fastest Secure Core" on
 * any other) can still pick it. */
export const COUNTRY_RULE_OPTIONS: readonly { id: string; label: string }[] = [
  { id: COUNTRY_RULE.fastest, label: "Fastest country" },
  { id: COUNTRY_RULE.fastestP2p, label: "Fastest P2P country" },
  { id: COUNTRY_RULE.fastestOutside, label: "Fastest (excluding my country)" },
  { id: COUNTRY_RULE.fastestSecureCore, label: "Fastest Secure Core" },
];

export const PROFILE_MATRIX: Record<ProfileId, ProfileMatrixEntry> = {
  /** The lighter of the two privacy profiles: a standard (not Secure Core)
   * connection, so it costs nothing extra in speed, with NetShield on for
   * everyday ad/tracker/malware blocking and Allow LAN on so local devices
   * (printers, a NAS, casting) stay reachable while it's active — the
   * profile for "protect my everyday browsing without giving anything up". */
  "privacy-daily": {
    connectionType: "Standard",
    protocol: "Smart",
    netShield: "On",
    portForwarding: "Off",
    customDns: "Off",
    allowLan: "On",
    natType: "Strict",
    country: COUNTRY_RULE.fastest,
    connectAndGo: null,
  },
  /** The stricter of the two: Secure Core's second-hop routing, NetShield,
   * and Allow LAN OFF — this profile's whole pitch is refusing local
   * network access too, not just outside traffic — so it's the one that
   * spotlights "Block LAN" as a feature rather than an inherited default;
   * see `BLOCK_LAN_SPOTLIGHT` below. Byte-for-byte the original single
   * `privacy` entry's values, since Advanced is what that profile always
   * was before Daily existed alongside it — except its country, which now
   * follows its own Secure Core connection type rather than plain
   * "fastest" (`COUNTRY_RULE.fastestSecureCore`, matching
   * `JTBD_PROFILES["privacy-advanced"]`'s `countryLabel`). */
  "privacy-advanced": {
    connectionType: "Secure Core",
    protocol: "Smart",
    netShield: "On",
    portForwarding: "Off",
    customDns: "Off",
    allowLan: "Off",
    natType: "Strict",
    country: COUNTRY_RULE.fastestSecureCore,
    connectAndGo: null,
  },
  streaming: {
    connectionType: "Standard",
    protocol: "Smart",
    netShield: "On",
    portForwarding: "Off",
    customDns: "Off",
    allowLan: "On",
    natType: "Strict",
    country: "United States",
    connectAndGo: "netflix.com",
  },
  downloading: {
    connectionType: "P2P",
    protocol: "Smart",
    netShield: "On",
    portForwarding: "On",
    customDns: "Off",
    allowLan: "Off",
    natType: "Strict",
    country: COUNTRY_RULE.fastestP2p,
    connectAndGo: "your torrent app",
  },
  gaming: {
    connectionType: "P2P",
    protocol: "Smart",
    netShield: "On",
    portForwarding: "Off",
    customDns: "Off",
    allowLan: "On",
    natType: "Moderate",
    // Fastest P2P country, not plain "fastest" — see `JTBD_PROFILES.gaming`'s
    // `countryLabel` comment (`jtbdProfiles.ts`) for why the two must agree.
    country: COUNTRY_RULE.fastestP2p,
    connectAndGo: "your game",
  },
  travel: {
    connectionType: "Standard",
    protocol: "Stealth",
    netShield: "On",
    portForwarding: "Off",
    customDns: "Off",
    allowLan: "Off",
    natType: "Moderate",
    // "Home country" in the matrix. Fixed rather than read from IP
    // detection: the prototype's detected country is whatever the reviewer's
    // network says, and a Travel profile that silently retargets itself per
    // reviewer makes the concept impossible to demo consistently.
    country: "United Kingdom",
    connectAndGo: null,
  },
  bypass: {
    connectionType: "Standard",
    protocol: "Stealth",
    netShield: "On",
    portForwarding: "Off",
    customDns: "Off",
    allowLan: "On",
    natType: "Strict",
    country: COUNTRY_RULE.fastestOutside,
    connectAndGo: "a blocked site",
  },
};

/** The country dropdown's starting value per profile — the matrix's
 * Server/Country column, derived rather than restated. */
export const PROFILE_COUNTRY_DEFAULT: Record<ProfileId, string> = Object.fromEntries(
  Object.entries(PROFILE_MATRIX).map(([id, m]) => [id, m.country]),
) as Record<ProfileId, string>;

/** A dropdown value as the app's exit needs it: a country NAME, or `null`
 * when the pick is a rule. The distinction matters at the exit — pinning
 * "fastest P2P country" to one country would misdescribe what the user just
 * clicked, the same rule `sidebarSubtitle` already follows. */
export function resolveCountryChoice(value: string | null): string | null {
  if (value === null) return null;
  return value.startsWith("rule:") ? null : value;
}

/** One row of the card's hover disclosure. */
export interface ProfileMatrixRow {
  label: string;
  value: string;
  /** Plain-language explanation of the label AT THIS VALUE. */
  tooltip: string;
}

/** The six labels every v2 card shows, in order.
 *
 * Fixed rather than per-intent, and identical on all six cards, so moving
 * between cards changes VALUES IN PLACE instead of reflowing the list —
 * which is what makes the cards comparable at a glance.
 *
 * The matrix's other three fields are deliberately absent: Custom DNS (Off
 * everywhere), Connect & Go (a behaviour, not a value) and Server/Country
 * (the card's own dropdown already states it, in a control you can change). */
export const PROFILE_MATRIX_LABELS = [
  "Connection type",
  "Protocol",
  "NetShield",
  "Port forwarding",
  "Allow LAN",
  "NAT type",
] as const;

/** Existing plain-language explanations, looked up from the tuning data by
 * feature name rather than re-typed — same technique (and the same reason)
 * as `jtbdProfileConfig.ts`'s lookup: a row's tooltip can then never drift
 * from the one the tuning rows already showed for the same feature. */
const PAID_TOOLTIP: Record<string, string> = Object.fromEntries(
  Object.values(JTBD_TUNING_RESULT).flatMap((result) => result.paid.map((f) => [f.featureName, f.tooltip ?? ""])),
);

/** Protocol explanations keyed by VALUE, never by intent.
 *
 * This keying is load-bearing. The matrix gives Gaming and Streaming
 * "Smart" where the tuning step applies WireGuard UDP, so looking a
 * tooltip up by intent (as v1 can safely do, since v1 derives the value
 * from that same intent) would explain a protocol this card isn't showing. */
const PROTOCOL_TOOLTIP: Record<string, string> = Object.fromEntries(
  Object.values(JTBD_TUNING_RESULT).map((result) => [result.enabled[0].value, result.enabled[0].tooltip ?? ""]),
);

/** Explanations for the three states nothing in the prototype describes yet
 * — the two Allow LAN states, and a plain (non-Secure-Core, non-P2P)
 * connection. Everything else on a v2 card reuses reviewed copy. */
const MATRIX_TOOLTIP = {
  standardConnection: "A direct connection to a standard Proton VPN server — the fastest route for everyday use.",
  allowLanOn: "Lets you reach printers, consoles and other devices on your own network while the VPN is connected.",
  allowLanOff: "Blocks devices on your local network while connected, so nothing outside the tunnel can reach you.",
} as const;

/** The six configuration rows for one profile, in `PROFILE_MATRIX_LABELS`
 * order.
 *
 * **Currently rendered nowhere.** The Plus v2 card, its only caller, now
 * discloses `PROFILE_BENEFITS` instead. Kept because it's the matrix in the
 * form a settings list needs it, tooltips and all, and the Free card's own
 * disclosure is the next thing due the same rework — rebuilding the
 * value-and-tooltip derivation from scratch then would be the waste. */
export function profileMatrixRows(id: ProfileId): ProfileMatrixRow[] {
  const m = PROFILE_MATRIX[id];

  const connectionTooltip =
    m.connectionType === "Secure Core"
      ? PAID_TOOLTIP["Secure Core"]!
      : m.connectionType === "P2P"
        ? PAID_TOOLTIP["P2P servers"]!
        : MATRIX_TOOLTIP.standardConnection;

  return [
    { label: "Connection type", value: m.connectionType, tooltip: connectionTooltip },
    { label: "Protocol", value: m.protocol, tooltip: PROTOCOL_TOOLTIP[m.protocol] ?? "" },
    {
      label: "NetShield",
      value: m.netShield,
      tooltip: m.netShield === "On" ? PAID_TOOLTIP.NetShield! : OFF_TOOLTIP.netShield,
    },
    {
      label: "Port forwarding",
      value: m.portForwarding,
      tooltip: m.portForwarding === "On" ? PAID_TOOLTIP["Port Forwarding"]! : OFF_TOOLTIP.portForwarding,
    },
    {
      label: "Allow LAN",
      value: m.allowLan,
      tooltip: m.allowLan === "On" ? MATRIX_TOOLTIP.allowLanOn : MATRIX_TOOLTIP.allowLanOff,
    },
    {
      label: "NAT type",
      value: m.natType,
      tooltip: m.natType === "Moderate" ? PAID_TOOLTIP["Moderate NAT"]! : OFF_TOOLTIP.strictNat,
    },
  ];
}

/** What each profile's configuration is FOR, as up to 3 benefit lines — the
 * Plus v2 card's hover disclosure, in place of the `profileMatrixRows`
 * value list. Seven entries now (five unchanged intents plus the two
 * `privacy` splits), not six.
 *
 * The settings list said what changed; these say why it matters. A reviewer
 * hovering a card is deciding between profiles, and "NAT type: Moderate"
 * only distinguishes them for someone who already knows what NAT is.
 *
 * **Every line is backed by a real `PROFILE_MATRIX` field**, noted after it.
 * That's the rule keeping this authored copy honest: no claim may rest on a
 * setting the matrix doesn't actually carry for that profile, and a matrix
 * edit means revisiting the lines that cite the field. NetShield is On for
 * every profile, so where it made the cut its line is phrased per-intent
 * rather than repeated verbatim; on profiles with three stronger, more
 * distinguishing settings it's the one dropped, since a value every profile
 * shares is the least useful thing a benefit line can say. `privacy-daily`
 * is the one exception to "exactly 3": it spotlights only 2 settings
 * (NetShield, Allow LAN), and a 3rd invented line would break the "backed by
 * a real field" rule rather than serve it — see its own note below.
 *
 * **Length is structural, not editorial.** The card's text column is 228px
 * next to the check glyph, so ~34 characters per line: keep every entry
 * under ~50 so it can't exceed two lines. Three two-line entries, the divider
 * and Streaming's logo row are what the 202px disclosure region affords —
 * see `CARD_H` in `CarouselCardV2.tsx`. */
export const PROFILE_BENEFITS: Record<ProfileId, readonly string[]> = {
  /** Only 2 lines, not the usual 3 — Daily spotlights exactly 2 settings
   * (NetShield, Allow LAN), and inventing a third to hit the usual count
   * would be authoring a claim with no matrix field behind it, which is the
   * one thing this list may never do. The disclosure region simply shows
   * less, same as it would for any profile whose configuration doesn't
   * stretch to a third distinguishing line. */
  "privacy-daily": [
    "Ads, trackers and malware blocked as you browse", // netShield: On
    "Devices on your network stay reachable", // allowLan: On
  ],
  "privacy-advanced": [
    "Routed through a second server in a safe country", // connectionType: Secure Core
    "Ads, trackers and malware blocked as you browse", // netShield: On
    "Your local network stays out of reach", // allowLan: Off
  ],
  streaming: [
    "Fast, buffer-free streaming in 4K", // protocol: Smart
    "Ad and tracker blocking on every stream", // netShield: On
    "Casting to your TV keeps working", // allowLan: On
  ],
  downloading: [
    "P2P servers optimized to handle large transfers", // connectionType: P2P
    "Port forwarding for faster peer connections", // portForwarding: On
    "Block invasive ads, trackers and malware", // netShield: On
  ],
  gaming: [
    "Moderate NAT for hosting parties and voice chat", // natType: Moderate
    "P2P servers optimized for gaming", // connectionType: P2P
    "Devices on your network stay reachable", // allowLan: On
  ],
  travel: [
    "Keep browsing safely on restricted Wi-Fi networks", // protocol: Stealth
    "Moderate NAT keeps video calls clear and stable", // natType: Moderate
    "Other devices on shared Wi-Fi can't reach you", // allowLan: Off
  ],
  bypass: [
    "Disguises traffic to bypass VPN restrictions", // protocol: Stealth
    "Unblocks apps and sites you can't normally reach", // country: fastest-outside
    "Freedom to reach any site or service, anywhere", // protocol: Stealth + country: fastest-outside
  ],
};

/** How many chips a card shows at most. Three is the layout's ceiling at
 * 280px wide (two rows of chips would push the title into the artwork). */
const CHIP_CAP = 3;

/** Profiles where an OFF `allowLan` is itself the point rather than merely
 * the inherited untuned default — Advanced privacy's whole pitch is
 * refusing local network access too, so it earns its own "Block LAN" chip.
 * Every other profile with `allowLan: "Off"` (Downloading, Travel) is Off
 * because that's what an untuned client already does, not because blocking
 * it is a claim worth making — see `profileChips`'s own "DERIVED, never
 * authored" rule, which this is the one deliberate, explicit exception to,
 * scoped to a single named id rather than a blanket rule that would also
 * start surfacing "Block LAN" on those two profiles' cards. */
const BLOCK_LAN_SPOTLIGHT: ReadonlySet<ProfileId> = new Set(["privacy-advanced"]);

/** The 2-3 chips on a card's default (un-hovered) face.
 *
 * DERIVED, never authored: a chip is any matrix value that differs from an
 * untuned client (Standard / Smart / Off / Off / Off / Strict), capped at
 * `CHIP_CAP` in descending order of how much it distinguishes one profile
 * from another. Deriving them is what guarantees a chip can never contradict
 * the hover list underneath it — the failure mode a hand-authored chip list
 * walked straight into.
 *
 * NetShield ranks last precisely because the matrix has it On for every
 * profile: a value every profile shares is the least useful thing a chip
 * can say, so it's the first to be dropped when a profile has four
 * differences (Gaming). */
export function profileChips(id: ProfileId): string[] {
  const m = PROFILE_MATRIX[id];

  const candidates: (string | null)[] = [
    m.connectionType === "Secure Core" ? "Secure Core" : m.connectionType === "P2P" ? "P2P server" : null,
    m.protocol === "Stealth" ? "Stealth protocol" : null,
    m.portForwarding === "On" ? "Port forwarding" : null,
    m.natType === "Moderate" ? "Moderate NAT" : null,
    m.allowLan === "On" ? "Allow LAN" : m.allowLan === "Off" && BLOCK_LAN_SPOTLIGHT.has(id) ? "Block LAN" : null,
    m.netShield === "On" ? "NetShield" : null,
  ];

  return candidates.filter((c): c is string => c !== null).slice(0, CHIP_CAP);
}

export const PROFILE_CARD_PHOTO: Record<ProfileId, string> = {
  streaming: photoStreaming,
  downloading: photoDownloading,
  gaming: photoGaming,
  travel: photoTravel,
  bypass: photoBypass,
  "privacy-daily": photoPrivacyDaily,
  "privacy-advanced": photoPrivacyAdvanced,
};
