import type { JtbdId } from "./jtbdData";
import { JTBD_PROFILE_LABEL } from "./jtbdData";
import { JTBD_TUNING_RESULT } from "./jtbdTuningResult";
import { SETTING_VALUE_PRIORITY } from "./jtbdMerge";
import { VPN_SERVER } from "./server";
// The same six profile glyphs the main app's country browser already uses
// (`CountryBrowser.tsx` → `profilesList`), so the icon a user sees while
// tuning is literally the icon in their sidebar afterwards.
import iconStreaming from "../../../imports/profile-icons/profile-icon-streaming.svg";
import iconGaming from "../../../imports/profile-icons/profile-icon-gaming.svg";
import iconP2p from "../../../imports/profile-icons/profile-icon-p2p.svg";
import iconAnticensorship from "../../../imports/profile-icons/profile-icon-anticensorship.svg";
import iconSecurity from "../../../imports/profile-icons/profile-icon-security.svg";
import iconBusiness from "../../../imports/profile-icons/profile-icon-business.svg";

/** One setting a profile carries. Always DERIVED from `JTBD_TUNING_RESULT`,
 * never authored here, so a profile can't claim a setting value the tuning
 * screen doesn't actually apply. */
export interface ProfileSetting {
  /** `"Protocol"` or `"Kill Switch"` — the only two that exist. */
  label: string;
  /** e.g. `"Smart"`, `"WireGuard UDP"`, `"Stealth"`, `"Advanced"`, `"Standard"`. */
  value: string;
  /** The same plain-language explanation the tuning rows already show. */
  tooltip?: string;
}

/** A profile as the profiles-first tuning concepts need it: a named,
 * destination-bearing, describable object — unlike `ProfilePreview` in
 * `jtbdMerge.ts`, which is only a label plus an icon and therefore can't
 * answer "what happens if I click this". See
 * docs/specs/profiles-tuning/_foundation.md §2. */
export interface TunedProfile {
  jtbd: JtbdId;
  /** Card and sidebar name — reuses `JTBD_PROFILE_LABEL`, no new naming. */
  name: string;
  /** Concrete destination, or `null` when the profile targets a RULE
   * ("fastest nearby", "fastest outside your country") rather than a fixed
   * place. Non-null values are all present in `countryMarkers`, so
   * `resolveVpnDestination` can resolve them. */
  country: string | null;
  /** What the user reads as the destination. Matches the subtitle strings
   * `CountryBrowser`'s `profilesList` already uses, so tuning and the
   * sidebar say the same thing. */
  countryLabel: string;
  /** Whether a Free-plan run can actually reach this destination — see
   * `isFreeRunnable`. Drives the "Available with VPN Plus" treatment. */
  freeRunnable: boolean;
  /** Future-tense "what happens if you use this", for concepts that present
   * profiles as standalone objects. Tone-CONSTANT. */
  effectSentence: string;
  /** The same effect phrased as an ADDITION to the tuned baseline, for
   * concepts that frame profiles as shortcuts on top of protection. The
   * shared "Everything above, plus…" opening is load-bearing: it's what
   * makes a profile structurally unable to read as a trade-off. */
  deltaSentence: string;
  /** Card accent. All six are currently the primary purple — a per-intent
   * categorical palette needs design sign-off, and no concept may depend on
   * colour to carry meaning (identity comes from the icon and the name). */
  accent: string;
  icon: string;
}

const ACCENT = "#6d4aff";

/** The two settings a profile carries, read straight from the tuning data.
 * Always exactly 2 (Protocol then Kill Switch) since `enabled` is a 2-tuple,
 * so counts shown on screen derive from this rather than a literal. */
export function profileSettings(jtbd: JtbdId): ProfileSetting[] {
  return JTBD_TUNING_RESULT[jtbd].enabled.map((f) => ({
    label: f.settingsName,
    value: f.value,
    tooltip: f.tooltip,
  }));
}

/** A profile's settings as the user would actually experience them: the
 * STRICTER of the profile's own value and the current merged baseline, per
 * `SETTING_VALUE_PRIORITY` (index 0 = strictest).
 *
 * This exists because in Multiple mode the baseline is the merged union, so
 * one intent's own value can be WEAKER than what's already applied —
 * selecting Gaming + Privacy merges Kill Switch to "Advanced", while
 * Gaming's own value is "Standard". Rendering Gaming's raw "Standard" would
 * tell the user that using the Gaming shortcut lowers their protection,
 * which is both untrue and the opposite of what these concepts promise.
 * In single mode the two inputs are identical and this is a no-op. */
export function effectiveProfileSettings(jtbd: JtbdId, baselineSettings: ProfileSetting[]): ProfileSetting[] {
  return strictestOf(profileSettings(jtbd), baselineSettings);
}

/** Per setting name, whichever of the two lists holds the stricter value,
 * per `SETTING_VALUE_PRIORITY` (index 0 = strictest). `primary` decides both
 * the output order and the fallback: a name absent from `other`, or a pair
 * where either value is unranked, keeps the primary value rather than
 * guessing which of two unknowns is stronger. The winning value's tooltip
 * travels with it, so the explanation always matches the value shown.
 *
 * Exported because combined drafts need the same guarantee for a MERGED
 * settings list, which `effectiveProfileSettings` can't express — it starts
 * from a single intent. */
export function strictestOf(primary: ProfileSetting[], other: ProfileSetting[]): ProfileSetting[] {
  const otherByLabel = new Map(other.map((s) => [s.label, s]));

  return primary.map((own) => {
    const rival = otherByLabel.get(own.label);
    if (!rival || rival.value === own.value) return own;

    const order = SETTING_VALUE_PRIORITY[own.label];
    const ownIndex = order?.indexOf(own.value) ?? -1;
    const rivalIndex = order?.indexOf(rival.value) ?? -1;
    if (ownIndex === -1 || rivalIndex === -1) return own;

    return rivalIndex < ownIndex ? rival : own;
  });
}

export const JTBD_PROFILES: Record<JtbdId, TunedProfile> = {
  streaming: {
    jtbd: "streaming",
    name: JTBD_PROFILE_LABEL.streaming,
    country: "United States",
    countryLabel: "United States",
    freeRunnable: false,
    effectSentence:
      "Use this and Proton VPN connects you through the United States and applies the settings that keep video playing smoothly.",
    deltaSentence: "Everything above, plus a United States connection tuned for smooth video.",
    accent: ACCENT,
    icon: iconStreaming,
  },

  gaming: {
    jtbd: "gaming",
    name: JTBD_PROFILE_LABEL.gaming,
    country: null,
    countryLabel: "Fastest country",
    freeRunnable: true,
    effectSentence:
      "Use this and Proton VPN connects you to the fastest nearby country and applies the settings built to keep your game responsive.",
    deltaSentence: "Everything above, plus the fastest nearby connection tuned to stay responsive.",
    accent: ACCENT,
    icon: iconGaming,
  },

  downloading: {
    jtbd: "downloading",
    name: JTBD_PROFILE_LABEL.downloading,
    country: "Netherlands",
    countryLabel: "Netherlands",
    freeRunnable: true,
    effectSentence:
      "Use this and Proton VPN connects you through the Netherlands and applies the settings that keep a download protected from start to finish.",
    deltaSentence: "Everything above, plus a Netherlands connection tuned to keep downloads protected.",
    accent: ACCENT,
    icon: iconP2p,
  },

  travel: {
    jtbd: "travel",
    name: JTBD_PROFILE_LABEL.travel,
    country: null,
    countryLabel: "Fastest country",
    freeRunnable: true,
    effectSentence:
      "Use this and Proton VPN connects you to the fastest nearby country and applies the settings that keep you safe on Wi-Fi you don't control.",
    deltaSentence: "Everything above, plus the fastest nearby connection tuned for Wi-Fi you don't control.",
    accent: ACCENT,
    icon: iconBusiness,
  },

  privacy: {
    jtbd: "privacy",
    name: JTBD_PROFILE_LABEL.privacy,
    country: "Switzerland",
    countryLabel: "Switzerland",
    freeRunnable: false,
    effectSentence:
      "Use this and Proton VPN connects you through Switzerland and applies the strictest protection settings.",
    deltaSentence: "Everything above, plus a Switzerland connection on the strictest settings.",
    accent: ACCENT,
    icon: iconSecurity,
  },

  bypass: {
    jtbd: "bypass",
    name: JTBD_PROFILE_LABEL.bypass,
    country: null,
    countryLabel: "Fastest outside your country",
    freeRunnable: false,
    effectSentence:
      "Use this and Proton VPN connects you to the fastest country outside your own and applies the settings that let your connection through networks that block VPNs.",
    deltaSentence: "Everything above, plus a connection outside your country that gets through networks that block VPNs.",
    accent: ACCENT,
    icon: iconAnticensorship,
  },
};

/** Destinations a Free-plan run can actually reach. Mirrors what
 * `lib/server.ts` already does — Free resolves every connection to
 * `VPN_SERVER` — rather than describing the real product's free country
 * list, which this prototype has no data for. Nothing may state a COUNT of
 * free countries off the back of this. */
export const FREE_TIER_COUNTRIES: readonly string[] = [VPN_SERVER.country];

/** True when a Free user can genuinely run this profile's destination.
 * `bypass` is the deliberate exception: its rule targets the fastest server
 * OUTSIDE your own country, which is the Plus "Fastest outside-country"
 * feature, so a null country doesn't make it free here. */
export function isFreeRunnable(profile: TunedProfile): boolean {
  if (profile.jtbd === "bypass") return false;
  if (profile.country === null) return true;
  return FREE_TIER_COUNTRIES.includes(profile.country);
}

/** One `TunedProfile` per selected intent, in selection order — the same
 * ordering contract `buildProfilePreviews` follows. */
export function profilesForSelection(selectedJtbds: JtbdId[]): TunedProfile[] {
  return selectedJtbds.map((jtbd) => JTBD_PROFILES[jtbd]);
}

/** The destination line for a generated sidebar profile. A Plus user's own
 * country pick wins over the profile's default destination, but only for
 * profiles targeting a FIXED country — the rule-based ones ("fastest
 * nearby", "fastest outside your country") describe a behaviour rather than
 * a place, and overriding those would misdescribe what they do. */
export function sidebarSubtitle(profile: TunedProfile, onboardingCountry: string | null): string {
  if (profile.country && onboardingCountry) return onboardingCountry;
  return profile.countryLabel;
}
