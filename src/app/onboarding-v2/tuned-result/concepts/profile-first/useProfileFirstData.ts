import { JTBD_TUNING_RESULT, type JTBDKey } from "../../../lib/jtbdTuningResult";
import { mergePaidFeatures, rankPaidFeatures, outcomeForPaid, type MergedPaidFeature } from "../../../lib/jtbdMerge";
import { CONFIGURED_FEATURE_NAMES } from "../../../lib/jtbdProfileConfig";
import { profilesForSelection, type TunedProfile } from "../../../lib/jtbdProfiles";
import { useTunedMaterialization, type RowStage } from "../../useTunedMaterialization";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { introSubtext, titleDuring, titleComplete, titleDuringMultiple, titleCompleteMultiple } from "../../copy";
import type { JtbdId, SelectionMode } from "../../../lib/jtbdData";
import type { ToneOfVoice } from "../../../lib/toneOfVoice";
import type { ConceptFrameData } from "../types";
import type { PlusFeatureRow } from "../../profiles/useProfilesConceptData";

const C = TUNING_CONCEPTS_COPY.profileFirst;

/** How many standalone Plus features sit below the profiles block.
 *
 * Deliberately NOT `TUNED_RESULT_TIMING.paidFeatureCap` (which is 1): that
 * cap exists so a single Plus feature row can't bury the profiles SUMMARY row
 * on the other concepts. Here the profiles block is a full-width card that
 * nothing can bury, and the design calls for a pair. Local so changing it
 * can't alter any other concept's pacing. */
const PLUS_FEATURE_COUNT = 2;

/** Every intent, for the fallback pool below. Order is irrelevant —
 * `FEATURES_RANK` assigns all 12 feature names a unique rank, so the ranked
 * result is fully deterministic regardless of insertion order. */
const ALL_JTBDS = Object.keys(JTBD_TUNING_RESULT) as JtbdId[];

/** The two Plus features shown BELOW the profiles, ranked by `FEATURES_RANK`.
 *
 * Two rules, in order:
 *
 * 1. Never a feature the preview card already configures
 *    (`CONFIGURED_FEATURE_NAMES`). A card reading "NetShield: Off" above a row
 *    reading "NetShield — On" reads as a bug, not as a profile override.
 * 2. Prefer the user's own selection. Only if that leaves fewer than
 *    `PLUS_FEATURE_COUNT` does it top up from the full 12-feature union.
 *
 * The top-up is needed for real cases, not hypothetical ones: a single-intent
 * run on streaming, gaming or downloading contributes only 2 features, one of
 * which the card already covers. And it doesn't misdescribe anything — these
 * rows are explicitly the Plus features that are NOT part of a profile's
 * configuration, so they were never claiming to be intent-derived. Every
 * candidate still comes from `JTBD_TUNING_RESULT` with its own real benefit
 * sentence; nothing is invented. */
function plusFeaturesFor(selection: JtbdId[]): MergedPaidFeature[] {
  const eligible = (f: MergedPaidFeature) => !CONFIGURED_FEATURE_NAMES.includes(f.featureName);

  const fromSelection = rankPaidFeatures(mergePaidFeatures(selection)).filter(eligible);
  if (fromSelection.length >= PLUS_FEATURE_COUNT) return fromSelection.slice(0, PLUS_FEATURE_COUNT);

  const taken = new Set(fromSelection.map((f) => f.featureName));
  const topUp = rankPaidFeatures(mergePaidFeatures(ALL_JTBDS)).filter((f) => eligible(f) && !taken.has(f.featureName));

  return [...fromSelection, ...topUp].slice(0, PLUS_FEATURE_COUNT);
}

export interface ProfileFirstData extends ConceptFrameData {
  /** One per selected intent, in selection order — the tab set. Always at
   * least 1. */
  profiles: TunedProfile[];
  /** Exactly `PLUS_FEATURE_COUNT`, none of which the preview card configures. */
  plusFeatureRows: PlusFeatureRow[];
  /** The profiles block's own row index — always 0, since it's the first
   * thing to materialize. Named rather than inlined so the component never
   * hardcodes the schedule. */
  profilesRowIndex: number;
  profilesRowLabel: string;

  rowStages: RowStage[];
  rowMounted: boolean[];
}

/** Content resolution for the "Profile-first" concept.
 *
 * A third sibling of `useTuningConceptData` and `useProfilesConceptData`
 * rather than a mode on either, for one structural reason: this concept has
 * NO baseline settings rows. The profiles absorb the settings entirely (they
 * carry Protocol themselves — see `profileConfigRows`), so the row schedule
 * is just the profiles block followed by two Plus features. Both existing
 * hooks emit per-setting rows that this layout has nowhere to put.
 *
 * What stays shared is everything that governs FEEL: the same
 * `useTunedMaterialization` schedule, called exactly once, and the same
 * merge/rank engine for the Plus features. Switching to this concept changes
 * the arrangement, never the pacing.
 *
 * Row schedule, in reveal order: the profiles block (0), then the two Plus
 * features (1, 2). There is no free/Plus boundary — the concept is Plus-only,
 * so nothing on screen is ever locked. */
export function useProfileFirstData(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode,
  selectedJtbds: JTBDKey[] | undefined,
  tone: ToneOfVoice,
  reduced: boolean,
): ProfileFirstData {
  const single = JTBD_TUNING_RESULT[jtbdKey];
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;
  const effectiveSelection: JtbdId[] = isMultipleActive ? selectedJtbds! : [jtbdKey];

  const profiles = profilesForSelection(effectiveSelection);

  const plusFeatureRows: PlusFeatureRow[] = plusFeaturesFor(effectiveSelection).map((feature, i) => ({
    index: 1 + i,
    featureName: feature.featureName,
    outcome: outcomeForPaid(tone, feature),
    tooltip: feature.tooltip,
    asset: feature.asset,
  }));

  const totalRows = 1 + plusFeatureRows.length;

  const { introDone, rowStages, rowMounted, appliedSoFar, rowsComplete, continueDelayMs } = useTunedMaterialization({
    jtbdKey: effectiveSelection.join(","),
    totalRows,
    // Past the end — nothing here is ever locked, so the boundary pause is
    // skipped entirely rather than inserting a beat with no visible cause.
    boundaryIndex: totalRows,
    reduced,
  });

  const selectionCount = effectiveSelection.length;

  return {
    profiles,
    plusFeatureRows,
    profilesRowIndex: 0,
    profilesRowLabel: C.profilesRowLabel(profiles.length),

    rowStages,
    rowMounted,

    introDone,
    rowsComplete,
    appliedSoFar,
    totalRows,
    isMultipleActive,
    continueDelayMs,
    selectionCount,

    titleDuringText: isMultipleActive ? titleDuringMultiple(tone, selectionCount) : titleDuring(tone, single.jtbdLabel),
    titleCompleteText: isMultipleActive ? titleCompleteMultiple(tone, selectionCount) : titleComplete(tone, single.jtbdLabel),
    introText: introSubtext(tone),
    summaryText: C.summary(profiles.length, plusFeatureRows.length),
    counterText: C.counter,
  };
}
