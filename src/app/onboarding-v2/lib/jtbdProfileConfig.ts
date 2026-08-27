import type { JtbdId } from "./jtbdData";
import { JTBD_TUNING_RESULT } from "./jtbdTuningResult";
import iconNetShield from "../assets/feature-netshield.svg";
import iconPortForwarding from "../assets/feature-port-forwarding.svg";
// Per-intent card photography for the "Profile-first" concept. Generated for
// this prototype (there was no per-intent imagery in the repo before), and
// deliberately uniform: night-time, desaturated, cool shadows with a violet
// cast, no faces, no legible screens. That uniformity is what lets the tabs
// read as one family of profiles rather than six unrelated stock photos.
import photoStreaming from "../assets/profile-photo-streaming.jpg";
import photoDownloading from "../assets/profile-photo-downloading.jpg";
import photoGaming from "../assets/profile-photo-gaming.jpg";
import photoPrivacy from "../assets/profile-photo-privacy.jpg";
import photoTravel from "../assets/profile-photo-travel.jpg";
import photoBypass from "../assets/profile-photo-bypass.jpg";

/** One row in a profile's configuration list — the right-hand column of the
 * "Profile-first" preview card. */
export interface ProfileConfigRow {
  label: string;
  value: string;
  /** Plain-language explanation of the label AT THIS VALUE. Kept per-value
   * rather than per-label because "NetShield: Off" and "NetShield: On" need
   * genuinely different explanations. */
  tooltip: string;
  /** Optional glyph shown beside the value, for the two rows that are
   * on/off FEATURES with an existing icon in the design system. The two
   * plain-value rows (Protocol, NAT type) deliberately have none. */
  asset?: string;
}

/** The four labels every profile shows, in order, on every tab.
 *
 * Fixed rather than per-intent on purpose: switching tabs then changes
 * VALUES IN PLACE instead of reflowing the list, so the tabs read as one
 * comparable set of profiles. Two of the four are new to this prototype's
 * vocabulary — see `CONFIG_VALUES` below. */
export const PROFILE_CONFIG_LABELS = ["NetShield", "Port forwarding", "Protocol", "NAT type"] as const;

/** Existing plain-language explanations, looked up from the tuning data by
 * feature name rather than re-typed, so a config row's tooltip can never
 * drift from the one the tuning rows already show for the same feature. */
const PAID_TOOLTIP: Record<string, string> = Object.fromEntries(
  Object.values(JTBD_TUNING_RESULT).flatMap((result) => result.paid.map((f) => [f.featureName, f.tooltip ?? ""])),
);

/** Explanations for the states the tuning data has no feature row for — a
 * feature deliberately left OFF, and the strict NAT default. Written here
 * because nothing else in the prototype describes these states.
 *
 * Exported for `jtbdProfileMatrix.ts` (the Profiles-carousel-v2 matrix),
 * which shows the same three states and must not re-word them. */
export const OFF_TOOLTIP = {
  netShield: "Left off for this profile, so its filtering can't interfere with how this traffic loads.",
  portForwarding: "Left off for this profile — nothing needs to reach you from the outside.",
  strictNat: "Keeps connection rules tight. This is the safer default whenever you're not gaming.",
} as const;

/** **Authored prototype data, not derived.** The three non-Protocol values
 * per profile.
 *
 * Everything else on the Profile-first card comes from existing data:
 * Protocol is read from `JTBD_TUNING_RESULT[jtbd].enabled[0]`, the name and
 * destination from `JTBD_PROFILES`. These three had nowhere to come from —
 * the tuning data models NetShield, Port Forwarding and Moderate NAT as
 * unvalued PLUS FEATURES (a name and a benefit sentence, no On/Off), and has
 * no NAT-type vocabulary at all.
 *
 * The values encode a defensible per-intent rationale rather than a plausible
 * shuffle, so a reviewer can argue with each one:
 *
 * - **NetShield** is off wherever DNS filtering plausibly gets in the way —
 *   streaming (ad-funded players), gaming (an extra resolution hop), and
 *   bypassing restrictions (filtering is one more thing to fingerprint) —
 *   and on for the three where blocking is the point.
 * - **Port forwarding** is on only where something needs to reach you:
 *   downloading (seeding — this is the Plus feature that intent already
 *   carries) and gaming (peer and host connections).
 * - **NAT type** is Moderate only for gaming, matching the real "Moderate
 *   NAT" Plus feature that intent already carries; Strict everywhere else.
 *
 * Change these here, in one table, if product disagrees. */
const CONFIG_VALUES: Record<JtbdId, { netShield: "On" | "Off"; portForwarding: "On" | "Off"; natType: "Moderate" | "Strict" }> = {
  streaming: { netShield: "Off", portForwarding: "Off", natType: "Strict" },
  downloading: { netShield: "On", portForwarding: "On", natType: "Strict" },
  gaming: { netShield: "Off", portForwarding: "On", natType: "Moderate" },
  privacy: { netShield: "On", portForwarding: "Off", natType: "Strict" },
  travel: { netShield: "On", portForwarding: "Off", natType: "Strict" },
  bypass: { netShield: "Off", portForwarding: "Off", natType: "Strict" },
};

/** The four configuration rows for one profile, in `PROFILE_CONFIG_LABELS`
 * order. Protocol is DERIVED from the tuning data, so the card can never
 * claim a protocol the tuning step didn't actually apply. */
export function profileConfigRows(jtbd: JtbdId): ProfileConfigRow[] {
  const v = CONFIG_VALUES[jtbd];
  const protocol = JTBD_TUNING_RESULT[jtbd].enabled[0];

  return [
    {
      label: "NetShield",
      value: v.netShield,
      tooltip: v.netShield === "On" ? PAID_TOOLTIP.NetShield! : OFF_TOOLTIP.netShield,
      asset: iconNetShield,
    },
    {
      label: "Port forwarding",
      value: v.portForwarding,
      tooltip: v.portForwarding === "On" ? PAID_TOOLTIP["Port Forwarding"]! : OFF_TOOLTIP.portForwarding,
      asset: iconPortForwarding,
    },
    {
      label: "Protocol",
      value: protocol.value,
      tooltip: protocol.tooltip ?? "",
    },
    {
      label: "NAT type",
      value: v.natType,
      tooltip: v.natType === "Moderate" ? PAID_TOOLTIP["Moderate NAT"]! : OFF_TOOLTIP.strictNat,
    },
  ];
}

/** Plus-feature names the preview card ALREADY accounts for, and which the
 * concept's two standalone Plus rows must therefore exclude.
 *
 * The rule this enforces: a feature never appears in both places. Without
 * it, a card reading "NetShield: Off" would sit directly above a row reading
 * "NetShield — On", which reads as a bug rather than as a profile override.
 * See `useProfileFirstData`. */
export const CONFIGURED_FEATURE_NAMES: readonly string[] = ["NetShield", "Port Forwarding", "Moderate NAT"];

export const PROFILE_PHOTO: Record<JtbdId, string> = {
  streaming: photoStreaming,
  downloading: photoDownloading,
  gaming: photoGaming,
  privacy: photoPrivacy,
  travel: photoTravel,
  bypass: photoBypass,
};
