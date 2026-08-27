import { JTBD_TUNING_RESULT, FEATURES_RANK, type JTBDKey } from "../../lib/jtbdTuningResult";
import {
  mergeFreeSettings,
  rankFreeSettings,
  mergePaidFeatures,
  rankPaidFeatures,
  capList,
  outcomeForEnabled,
  outcomeForPaid,
  type TuningResultLike,
} from "../../lib/jtbdMerge";
import { profilesForSelection, type ProfileSetting, type TunedProfile } from "../../lib/jtbdProfiles";
import { toneOutcome } from "../../lib/jtbdTuningToneCopy";
import { useTunedMaterialization, type RowStage } from "../useTunedMaterialization";
import { TUNED_RESULT_TIMING as T } from "../timing";
import {
  titleDuring,
  titleComplete,
  introSubtext,
  counterSubtext,
  summarySubtext,
  titleDuringMultiple,
  titleCompleteMultiple,
  summarySubtextMultiple,
} from "../copy";
import type { SelectionMode } from "../../lib/jtbdData";
import type { ToneOfVoice } from "../../lib/toneOfVoice";
import type { SessionPlan } from "../../../lib/sessionPlan";
import type { ConceptFrameData } from "../concepts/types";

export interface SettingRow {
  index: number;
  setting: ProfileSetting;
  /** Tone-voiced outcome sentence for this setting. */
  outcome: string;
}

export interface ProfileRow {
  index: number;
  profile: TunedProfile;
}

export interface PlusFeatureRow {
  index: number;
  featureName: string;
  outcome: string;
  tooltip?: string;
  asset: string;
}

/** Extends `ConceptFrameData` (see `concepts/types.ts`), which supplies the
 * header strings and the frame-facing materialization fields. */
export interface ProfilesConceptData extends ConceptFrameData {
  /** The tuned baseline — free settings covering every selected intent.
   * Single mode: that intent's own 2. Multiple: the merged, ranked, capped
   * union, so a merged value is always the STRICTEST of its contributors. */
  settingRows: SettingRow[];
  /** One per selected intent, in selection order. Always at least 1 — this
   * is the whole reason this hook exists rather than reusing
   * `useTuningConceptData`, which emits no profiles row in single mode. */
  profileRows: ProfileRow[];
  /** Top-ranked Plus feature(s), capped at `paidFeatureCap` in BOTH modes.
   * At most 1 today, rendered by every concept as a single muted line. */
  plusFeatureRows: PlusFeatureRow[];
  /** `userPlan === "plus"` — profiles and Plus features render as active. */
  paidUnlocked: boolean;

  /** Per-row materialization state, same shape/semantics as
   * `useTuningConceptData`'s. Every `index` above addresses these arrays. */
  rowStages: RowStage[];
  rowMounted: boolean[];
  boundaryVisible: boolean;

  jtbdLabel: string;
  /** Profile names in selection order — for `baselineCoverage()`. */
  intentNames: string[];
  /** The baseline settings as a plain list, for `effectiveProfileSettings`. */
  baselineSettings: ProfileSetting[];
}

/** Shared content-resolution hook for the 5 PROFILES-first tuning concepts.
 *
 * Deliberately a sibling of `useTuningConceptData` rather than a
 * parameterization of it, for two reasons. First, that hook's row schedule
 * is load-bearing for the three existing concepts and shouldn't grow a
 * second mode. Second — and decisively — it only emits a profiles row when
 * Multiple mode is active, so a single-intent run produces no profile at
 * all, which is unusable for concepts whose entire subject is profiles.
 *
 * Everything that governs FEEL is still shared, not reimplemented: the same
 * merge → rank → cap engine, the same `useTunedMaterialization` schedule
 * (called exactly once here), and the same tone copy helpers. So switching
 * between any concept and the default never reads as a pacing change.
 *
 * Row schedule, in reveal order: `settingRows` (0..s-1), then `profileRows`
 * (s..s+p-1), then `plusFeatureRows`. See
 * docs/specs/profiles-tuning/_foundation.md §5.3. */
export function useProfilesConceptData(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode,
  selectedJtbds: JTBDKey[] | undefined,
  tone: ToneOfVoice,
  reduced: boolean,
  userPlan: SessionPlan,
): ProfilesConceptData {
  const single = JTBD_TUNING_RESULT[jtbdKey];
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;
  const paidUnlocked = userPlan === "plus";

  // The effective selection: Multiple mode's full ordered list, or the one
  // pick. Single mode and "Multiple with exactly one selected" resolve
  // identically, matching every other multi-select surface here.
  const effectiveSelection: JTBDKey[] = isMultipleActive ? selectedJtbds! : [jtbdKey];

  // ── Baseline (free) settings ───────────────────────────────────────────
  const freeCapped = isMultipleActive
    ? capList(rankFreeSettings(mergeFreeSettings(selectedJtbds!)), T.freeRowCap).displayed
    : single.enabled.slice();

  // `outcomeForEnabled` needs a result-shaped object for the single-mode
  // tone lookup (it keys off `jtbdKey` + row index there).
  const result: TuningResultLike = { jtbdKey: single.jtbdKey, jtbdLabel: single.jtbdLabel, enabled: freeCapped, paid: [], tip: null };

  const settingRows: SettingRow[] = freeCapped.map((feature, i) => ({
    index: i,
    setting: { label: feature.settingsName, value: feature.value, tooltip: feature.tooltip },
    outcome: outcomeForEnabled(tone, result, i, feature),
  }));

  const baselineSettings: ProfileSetting[] = settingRows.map((r) => r.setting);

  // ── Profiles — always at least one ─────────────────────────────────────
  const profiles = profilesForSelection(effectiveSelection);
  const profileRows: ProfileRow[] = profiles.map((profile, i) => ({
    index: settingRows.length + i,
    profile,
  }));

  // ── Plus features, capped in BOTH modes ────────────────────────────────
  // `useTuningConceptData` shows both of an intent's paid features in single
  // mode; here the cap applies either way. Profiles are the subject of these
  // concepts, and two competing Plus feature rows would bury a lone profile.
  const plusOffset = settingRows.length + profileRows.length;
  const plusFeatureRows: PlusFeatureRow[] = isMultipleActive
    ? capList(rankPaidFeatures(mergePaidFeatures(selectedJtbds!)), T.paidFeatureCap).displayed.map((feature, i) => ({
        index: plusOffset + i,
        featureName: feature.featureName,
        outcome: outcomeForPaid(tone, feature),
        tooltip: feature.tooltip,
        asset: feature.asset,
      }))
    : capList(
        [...single.paid].sort((a, b) => (FEATURES_RANK[a.featureName] ?? Infinity) - (FEATURES_RANK[b.featureName] ?? Infinity)),
        T.paidFeatureCap,
      ).displayed.map((feature, i) => ({
        index: plusOffset + i,
        featureName: feature.featureName,
        outcome: toneOutcome(tone, jtbdKey, "paid", single.paid.indexOf(feature)),
        tooltip: feature.tooltip,
        asset: feature.asset,
      }));

  const totalRows = settingRows.length + profileRows.length + plusFeatureRows.length;
  // Profiles are the first Plus-only thing revealed, so the free/Plus
  // boundary falls exactly between the baseline and the profiles. On Plus
  // there's nothing locked, so push it past the end — `useTunedMaterialization`
  // skips the boundary pause entirely when it isn't inside the range.
  const boundaryIndex = paidUnlocked ? totalRows : settingRows.length;

  const { introDone, rowStages, rowMounted, boundaryVisible, appliedSoFar, rowsComplete, continueDelayMs } = useTunedMaterialization({
    jtbdKey: effectiveSelection.join(","),
    totalRows,
    boundaryIndex,
    reduced,
  });

  const selectionCount = effectiveSelection.length;
  const appliedCount = settingRows.length;
  const plusSideCount = profileRows.length + plusFeatureRows.length;

  return {
    settingRows,
    profileRows,
    plusFeatureRows,
    paidUnlocked,

    rowStages,
    rowMounted,
    boundaryVisible,

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
    // Counts describe what's actually on screen, never a literal.
    summaryText: isMultipleActive
      ? summarySubtextMultiple(tone, appliedCount, plusSideCount)
      : summarySubtext(tone, appliedCount, plusSideCount),
    counterText: counterSubtext,

    jtbdLabel: single.jtbdLabel,
    intentNames: profiles.map((p) => p.name),
    baselineSettings,
  };
}
