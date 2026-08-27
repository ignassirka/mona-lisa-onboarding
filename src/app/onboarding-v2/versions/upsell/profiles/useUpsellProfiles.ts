import { JTBD_TUNING_RESULT, type JTBDKey } from "../../../lib/jtbdTuningResult";
import { JTBD_UPSELL, UPSELL_MULTIPLE_HIGHLIGHT_CAP } from "../../../lib/jtbdUpsell";
import { mergePaidFeatures, rankPaidFeatures, capList } from "../../../lib/jtbdMerge";
import { profilesForSelection, type TunedProfile } from "../../../lib/jtbdProfiles";
import type { JtbdId, SelectionMode } from "../../../lib/jtbdData";
import type { UpsellBenefitView } from "../useUpsellContent";
import sparkleUrl from "../../../assets/upsell-sparkle.svg";

export interface UpsellProfilePair {
  profile: TunedProfile;
  /** The displayed Plus features this profile is the reason for — often one,
   * sometimes two, and legitimately zero (see the note on the hook). */
  benefits: UpsellBenefitView[];
}

export interface UpsellProfilesData {
  /** One profile per selected intent, in selection order. */
  profiles: TunedProfile[];
  /** The same profiles, each carrying the features it contributed. */
  pairs: UpsellProfilePair[];
  /** Displayed features whose contributor somehow isn't among the profiles on
   * screen. Should always be empty — every ranked feature is sourced from a
   * selected intent, and every selected intent gets a profile — but a layout
   * that silently dropped a feature it was told to show would be worse than
   * one with a defensive fallback list. */
  orphanBenefits: UpsellBenefitView[];
}

/** Pairs the upsell's ranked Plus features with the profiles that caused them.
 *
 * Why this re-derives the feature list instead of reading `useUpsellContent`'s
 * `benefits`: that hook flattens each `MergedPaidFeature` down to an outcome, a
 * name and an icon, which discards `primarySourceJtbd` — the only field that
 * says WHICH of the user's intents put a feature on the list. Pairing without
 * it would mean pairing by array position, i.e. captioning the Gaming card
 * with a file-sharing benefit whenever the two lists happened to be ordered
 * differently. So the ranking itself is still the shared
 * `mergePaidFeatures → rankPaidFeatures → capList` pipeline at the same
 * `UPSELL_MULTIPLE_HIGHLIGHT_CAP` — no second ranking, no second cap — and
 * only the flattening is done later, here.
 *
 * **A profile can honestly have no feature.** Each intent contributes two paid
 * features to the union, the union is deduplicated by name, and the displayed
 * list is capped at 3. So three picks can easily produce three features all
 * sourced from two of them, leaving the third profile unpaired. That's not a
 * bug to paper over: the profile is still real, still built from that pick, and
 * still locked, so layouts show it carrying its own settings rather than
 * inventing a benefit line for it or hiding it.
 *
 * Single mode needs none of this — there's exactly one profile, so all three of
 * that intent's hand-curated `JTBD_UPSELL` benefits belong to it by
 * construction. */
export function useUpsellProfiles(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode = "single",
  selectedJtbds?: JTBDKey[],
): UpsellProfilesData {
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;
  const effectiveSelection: JtbdId[] = isMultipleActive ? selectedJtbds! : [jtbdKey];

  const profiles = profilesForSelection(effectiveSelection);

  // `[jtbd, benefits]` in selection order, so downstream layouts never have to
  // sort or look anything up themselves.
  const byJtbd = new Map<JtbdId, UpsellBenefitView[]>(effectiveSelection.map((jtbd) => [jtbd, []]));
  const orphanBenefits: UpsellBenefitView[] = [];

  if (isMultipleActive) {
    const displayed = capList(rankPaidFeatures(mergePaidFeatures(effectiveSelection)), UPSELL_MULTIPLE_HIGHLIGHT_CAP).displayed;
    for (const feature of displayed) {
      const view: UpsellBenefitView = {
        outcome: feature.outcome,
        featureName: feature.featureName,
        learnMore: true,
        tooltip: feature.tooltip,
        icon: feature.asset,
      };
      const bucket = byJtbd.get(feature.primarySourceJtbd);
      if (bucket) bucket.push(view);
      else orphanBenefits.push(view);
    }
  } else {
    // Same icon resolution the default screen uses: the matching Plus
    // feature's own asset when the curated name lines up with one, else the
    // shared sparkle. Not a new fallback — `useUpsellContent` does exactly
    // this, because `JTBD_UPSELL`'s names are marketing copy and don't always
    // match `JTBD_TUNING_RESULT`'s feature names.
    const paid = JTBD_TUNING_RESULT[jtbdKey].paid;
    byJtbd.set(
      jtbdKey,
      JTBD_UPSELL[jtbdKey].benefits.map((b) => ({
        ...b,
        icon: paid.find((p) => p.featureName === b.featureName)?.asset ?? sparkleUrl,
      })),
    );
  }

  const pairs: UpsellProfilePair[] = profiles.map((profile) => ({
    profile,
    benefits: byJtbd.get(profile.jtbd) ?? [],
  }));

  return { profiles, pairs, orphanBenefits };
}
