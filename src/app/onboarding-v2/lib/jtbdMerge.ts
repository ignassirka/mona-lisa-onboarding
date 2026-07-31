import { JTBD_TUNING_RESULT, SETTINGS_RANK, FEATURES_RANK, type EnabledFeature, type PaidFeature, type JTBDKey } from "./jtbdTuningResult";
import { JTBD_ICONS } from "../versions/lib/jtbdIcons";
import { JTBD_PROFILE_LABEL, type JtbdId } from "./jtbdData";
import { toneOutcome } from "./jtbdTuningToneCopy";
import type { ToneOfVoice } from "./toneOfVoice";

/**
 * Multiple-mode's merge engine — combines the free (`enabled`) settings of
 * every selected JTBD into one deduplicated list, and derives the
 * profile-preview items for the paid section. See
 * docs/features/onboarding-v2.md → "Multiple-mode tuning" for the full
 * design writeup and the confirmed conflict-resolution checkpoint.
 *
 * CONFLICT RESOLUTION: since the only 2 free settings (`"Protocol"` /
 * `"Kill Switch"`, see `JTBD_TUNING_RESULT`'s `enabled` doc comment) each
 * take a genuinely different value per JTBD, selecting 2+ JTBDs whose values
 * differ is the COMMON case here (unlike the old, effectively-never-hit LAN
 * setting conflict this replaced). Resolved by "strictest wins" — the value
 * that's a superset of what any weaker value also does, so the merged
 * result is never a downgrade for any contributing JTBD's actual need:
 * Kill Switch's Advanced (blocks all non-VPN traffic, even before
 * connecting) fully covers what Standard promises (only cuts internet after
 * a drop), and Protocol's Stealth (works even where VPNs are actively
 * blocked) and WireGuard UDP (fastest, low-latency) both cover what Smart
 * (network-appropriate default) already does. Order is index-based, lower
 * = stricter/wins. */
export const SETTING_VALUE_PRIORITY: Record<string, readonly string[]> = {
  "Kill Switch": ["Advanced", "Standard"],
  Protocol: ["Stealth", "WireGuard UDP", "Smart"],
};

/** Looks up `value`'s priority index within `settingsName`'s order in
 * `SETTING_VALUE_PRIORITY` — lower is stricter/wins. Unranked settings/values
 * (shouldn't happen — every current value is covered) sort last so an
 * unexpected new value never silently overrides a known one. */
function strictnessIndex(settingsName: string, value: string): number {
  const order = SETTING_VALUE_PRIORITY[settingsName];
  const index = order?.indexOf(value) ?? -1;
  return index === -1 ? Infinity : index;
}

export interface MergedEnabledFeature extends EnabledFeature {
  /** Which selected JTBDs contribute this settings name, in selection order. */
  sourceJtbds: JtbdId[];
  /** The earliest-selected contributor — whose `outcome` text this row uses
   * (and whose tone-voiced outcome `toneOutcome` should look up). */
  primarySourceJtbd: JtbdId;
  /** This feature's index within `primarySourceJtbd`'s own `enabled` array —
   * needed to look up the tone-voiced outcome for the right sentence. */
  primarySourceIndex: number;
}

/** UNION of the selected JTBDs' free settings, deduplicated by
 * `settingsName`, in "first-selected JTBD's rows (its own data order), then
 * new unique rows from the second-selected, and so on" order — a `Map`
 * preserves insertion order, and each settings name is only ever INSERTED
 * once (on its first encounter), so later JTBDs contributing an
 * already-seen setting can only affect that entry's `value` (via the
 * conflict table below), never its position or its `outcome` text — which
 * is exactly the "earliest-selected contributor's outcome wins" rule. */
export function mergeFreeSettings(selectedJtbds: JtbdId[]): MergedEnabledFeature[] {
  const bySettingsName = new Map<string, MergedEnabledFeature>();

  for (const jtbd of selectedJtbds) {
    const { enabled } = JTBD_TUNING_RESULT[jtbd as JTBDKey];
    enabled.forEach((feature, index) => {
      const existing = bySettingsName.get(feature.settingsName);
      if (!existing) {
        bySettingsName.set(feature.settingsName, {
          ...feature,
          sourceJtbds: [jtbd],
          primarySourceJtbd: jtbd,
          primarySourceIndex: index,
        });
        return;
      }
      existing.sourceJtbds.push(jtbd);
      if (strictnessIndex(feature.settingsName, feature.value) < strictnessIndex(feature.settingsName, existing.value)) {
        existing.value = feature.value;
      }
    });
  }

  return Array.from(bySettingsName.values());
}

/** Sorts the merged FREE union by the editorial `SETTINGS_RANK` (lower
 * number = higher priority; anything unranked — should never happen, every
 * unique `settingsName` is covered — sorts last). Does not mutate its input;
 * pair with `capList` to get the "top `freeRowCap` by rank" the Multiple-mode
 * result screen actually displays. See docs/features/onboarding-v2.md →
 * "Multiple-mode result curation" for the confirmed rank order. */
export function rankFreeSettings(merged: MergedEnabledFeature[]): MergedEnabledFeature[] {
  return [...merged].sort((a, b) => (SETTINGS_RANK[a.settingsName] ?? Infinity) - (SETTINGS_RANK[b.settingsName] ?? Infinity));
}

export interface MergedPaidFeature extends PaidFeature {
  /** Which selected JTBDs contribute this feature name, in selection order. */
  sourceJtbds: JtbdId[];
  /** The earliest-selected contributor — whose `outcome` text (and tone
   * lookup) this row uses, same "first-selected wins" rule as
   * `MergedEnabledFeature`. Paid features never have a genuine value
   * conflict to resolve (there's no `value` field on a `PaidFeature`), so
   * unlike `mergeFreeSettings` there's no conflict-resolution step here —
   * purely a name-deduplicated union. */
  primarySourceJtbd: JtbdId;
  /** This feature's index (0 or 1) within `primarySourceJtbd`'s own `paid`
   * tuple — needed to look up the tone-voiced outcome for the right
   * sentence, mirroring `MergedEnabledFeature.primarySourceIndex`. */
  primarySourceIndex: number;
}

/** UNION of the selected JTBDs' 2 paid features each, deduplicated by
 * `featureName`, same insertion-order convention as `mergeFreeSettings`.
 * Feeds the Multiple-mode Plus section's capped/ranked feature list (see
 * `rankPaidFeatures`) — a broader hook than the previous profiles-only
 * design (docs/features/onboarding-v2.md → "Multiple-mode result
 * curation"). */
export function mergePaidFeatures(selectedJtbds: JtbdId[]): MergedPaidFeature[] {
  const byFeatureName = new Map<string, MergedPaidFeature>();

  for (const jtbd of selectedJtbds) {
    const { paid } = JTBD_TUNING_RESULT[jtbd as JTBDKey];
    paid.forEach((feature, index) => {
      const existing = byFeatureName.get(feature.featureName);
      if (!existing) {
        byFeatureName.set(feature.featureName, {
          ...feature,
          sourceJtbds: [jtbd],
          primarySourceJtbd: jtbd,
          primarySourceIndex: index,
        });
        return;
      }
      existing.sourceJtbds.push(jtbd);
    });
  }

  return Array.from(byFeatureName.values());
}

/** Sorts the merged PAID union by the editorial `FEATURES_RANK` — same
 * contract as `rankFreeSettings`, for the Plus section's capped feature
 * list. */
export function rankPaidFeatures(merged: MergedPaidFeature[]): MergedPaidFeature[] {
  return [...merged].sort((a, b) => (FEATURES_RANK[a.featureName] ?? Infinity) - (FEATURES_RANK[b.featureName] ?? Infinity));
}

/** Tone-voiced outcome sentence for a merged paid feature — same
 * "primarySourceJtbd/primarySourceIndex" lookup pattern as
 * `outcomeForEnabled`'s Multiple-mode branch, just for the `paid` tuple
 * instead of `enabled`. */
export function outcomeForPaid(tone: ToneOfVoice, feature: MergedPaidFeature): string {
  return toneOutcome(tone, feature.primarySourceJtbd, "paid", feature.primarySourceIndex);
}

export interface CappedList<T> {
  displayed: T[];
  /** How many items beyond `displayed` exist in the full (uncapped) list —
   * 0 when the full list already fits within the cap. Completion counts
   * must always be derived from the FULL list, never from `displayed.length`
   * — this field exists so callers never need to re-derive it by hand. */
  overflow: number;
}

/** Takes the top `cap` items from an already-ranked list, plus how many were
 * left out — the single, shared truncation step for both the Multiple-mode
 * free-settings and Plus-features lists, so "cap the display, keep the true
 * count" is enforced identically for both. */
export function capList<T>(ranked: T[], cap: number): CappedList<T> {
  return { displayed: ranked.slice(0, cap), overflow: Math.max(0, ranked.length - cap) };
}

/** A relaxed, structurally-compatible view of `JTBDTuningResult` that the 4
 * layout components accept — `enabled`/`paid` as plain arrays instead of
 * fixed 3-/2-tuples, so the SAME layout props type works for both single
 * mode's real per-JTBD data (tuples are assignable to arrays, no change
 * needed there) and Multiple mode's variable-length merged data. */
export interface TuningResultLike {
  jtbdKey: JtbdId;
  jtbdLabel: string;
  enabled: EnabledFeature[];
  paid: PaidFeature[];
  tip: string | null;
}

/** Tone-voiced outcome sentence for an "enabled" row, working for BOTH a
 * plain per-JTBD `EnabledFeature` (single mode — falls back to the existing
 * `result.jtbdKey` + row index lookup, byte-for-byte the same as before)
 * and a Multiple-mode `MergedEnabledFeature` (looks up the tone sentence
 * from its `primarySourceJtbd`/`primarySourceIndex` instead, since a merged
 * row's row-index in the MERGED array is meaningless for tone lookup — only
 * its position within its earliest-selected contributor's own data is). */
export function outcomeForEnabled(
  tone: ToneOfVoice,
  result: TuningResultLike,
  index: number,
  feature: EnabledFeature | MergedEnabledFeature,
): string {
  if ("primarySourceJtbd" in feature) {
    return toneOutcome(tone, feature.primarySourceJtbd, "enabled", feature.primarySourceIndex);
  }
  return toneOutcome(tone, result.jtbdKey, "enabled", index);
}

export interface ProfilePreview {
  jtbd: JtbdId;
  /** Short capitalized preview label — "Streaming", "Access", etc. */
  label: string;
  icon: string;
}

/** One profile-preview item per selected JTBD, in selection order — the
 * "Available with VPN Plus" section's Multiple-mode content (a preview of a
 * one-tap profile per intent, never a real created profile — see the
 * Honesty rules in docs/features/onboarding-v2.md). */
export function buildProfilePreviews(selectedJtbds: JtbdId[]): ProfilePreview[] {
  return selectedJtbds.map((jtbd) => ({
    jtbd,
    label: JTBD_PROFILE_LABEL[jtbd],
    icon: JTBD_ICONS[jtbd],
  }));
}
