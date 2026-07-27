import { JTBD_TUNING_RESULT, type JTBDKey } from "../../lib/jtbdTuningResult";
import {
  mergeFreeSettings,
  rankFreeSettings,
  mergePaidFeatures,
  rankPaidFeatures,
  capList,
  buildProfilePreviews,
  outcomeForEnabled,
  outcomeForPaid,
  type TuningResultLike,
  type ProfilePreview,
} from "../../lib/jtbdMerge";
import { toneOutcome } from "../../lib/jtbdTuningToneCopy";
import { useTunedMaterialization, type RowStage } from "../useTunedMaterialization";
import { TUNED_RESULT_TIMING as T } from "../timing";
import {
  PROFILES_INTRO_TEXT,
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

/** One row's worth of ready-to-render content — assembled once by this hook
 * so every concept just maps over `rows` instead of re-deriving free vs.
 * profiles vs. paid content, tone-voiced outcomes, and row-index math 5
 * times over. `index` is the row's position in the shared `rowStages`/
 * `rowMounted` arrays (see `useTunedMaterialization`) — concepts read
 * `data.rowStages[row.index]`/`data.rowMounted[row.index]` to know whether
 * (and how) to render it. */
export interface TuningRow {
  index: number;
  kind: "free" | "profiles" | "paid";
  /** Settings/feature name (free/paid), or the profiles row's own intro
   * label (multiple mode only). */
  label: string;
  /** Free rows only — the applied value (e.g. "On", "Strict"). */
  value?: string;
  /** Tone-voiced outcome sentence. For the profiles row this is just
   * `PROFILES_INTRO_TEXT` (tone-constant, matching `ProfilesSummaryRow`). */
  outcome: string;
  tooltip?: string;
  /** Paid rows only — the feature's own decorative icon. */
  asset?: string;
  /** Profiles row only — one pill per selected JTBD. */
  profiles?: ProfilePreview[];
}

export interface TuningConceptData {
  isMultipleActive: boolean;
  rows: TuningRow[];
  totalRows: number;
  boundaryIndex: number;
  rowStages: RowStage[];
  rowMounted: boolean[];
  boundaryVisible: boolean;
  appliedSoFar: number;
  rowsComplete: boolean;
  continueDelayMs: number;
  introDone: boolean;
  /** Honest, derived counts — never hardcoded. Single mode: true totals.
   * Multiple mode: counts against the DISPLAYED/capped rows, matching
   * `TunedResult.tsx`'s own convention (the summary sentence must match
   * what's actually on screen). */
  appliedCount: number;
  lockedCount: number;
  truePaidFeatureCount: number;
  selectionCount: number;
  /** Precomputed header strings (tone-voiced) — pick the right one for the
   * current phase (`!introDone` → `introText`; `rowsComplete` →
   * `titleCompleteText`/`summaryText`; else → `titleDuringText`/
   * `counterText(appliedSoFar, totalRows)`), exactly mirroring
   * `TunedResult.tsx`'s own header logic. */
  titleDuringText: string;
  titleCompleteText: string;
  introText: string;
  summaryText: string;
  counterText: (applied: number, total: number) => string;
  jtbdLabel: string;
}

/** Shared content-resolution hook for the 5 alternative tuning concepts.
 * Mirrors `TunedResult.tsx`'s own data derivation (single vs. Multiple
 * mode, the merge → rank → cap engine, the shared materialization
 * schedule, and the honest derived counts) byte-for-byte — that component
 * is left fully untouched as the default option — so every alternative
 * draws from the EXACT same tuning data/engine, timing, and tone copy as
 * the original. Always called with `paidUnlocked = false` (stage 2's only
 * caller, `OnboardingV2`, always renders it with `userPlan="free"`), so
 * unlike `TunedResult` there is no Plus-user/`unlockTransition` branch to
 * carry here — every paid row is always the locked/aspiration state. */
export function useTuningConceptData(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode,
  selectedJtbds: JTBDKey[] | undefined,
  tone: ToneOfVoice,
  reduced: boolean,
): TuningConceptData {
  const single = JTBD_TUNING_RESULT[jtbdKey];
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;

  const mergedEnabledFull = isMultipleActive ? mergeFreeSettings(selectedJtbds!) : null;
  const mergedPaidFull = isMultipleActive ? mergePaidFeatures(selectedJtbds!) : null;
  const profiles = isMultipleActive ? buildProfilePreviews(selectedJtbds!) : null;

  const freeCapped = isMultipleActive ? capList(rankFreeSettings(mergedEnabledFull!), T.freeRowCap) : null;
  const paidCapped = isMultipleActive ? capList(rankPaidFeatures(mergedPaidFull!), T.paidFeatureCap) : null;

  const result: TuningResultLike = isMultipleActive
    ? { jtbdKey: single.jtbdKey, jtbdLabel: single.jtbdLabel, enabled: freeCapped!.displayed, paid: [], tip: null }
    : single;

  const totalRows = isMultipleActive
    ? freeCapped!.displayed.length + 1 + paidCapped!.displayed.length
    : result.enabled.length + result.paid.length;
  const boundaryIndex = isMultipleActive ? freeCapped!.displayed.length : result.enabled.length;

  const { introDone, rowStages, rowMounted, boundaryVisible, appliedSoFar, rowsComplete, continueDelayMs } = useTunedMaterialization({
    jtbdKey: isMultipleActive ? selectedJtbds!.join(",") : jtbdKey,
    totalRows,
    boundaryIndex,
    reduced,
  });

  const rows: TuningRow[] = [];
  result.enabled.forEach((feature, i) => {
    rows.push({
      index: i,
      kind: "free",
      label: feature.settingsName,
      value: feature.value,
      outcome: outcomeForEnabled(tone, result, i, feature),
      tooltip: feature.tooltip,
    });
  });
  if (isMultipleActive) {
    rows.push({
      index: result.enabled.length,
      kind: "profiles",
      label: PROFILES_INTRO_TEXT,
      outcome: PROFILES_INTRO_TEXT,
      profiles: profiles!,
    });
    paidCapped!.displayed.forEach((feature, pIdx) => {
      rows.push({
        index: result.enabled.length + 1 + pIdx,
        kind: "paid",
        label: feature.featureName,
        outcome: outcomeForPaid(tone, feature),
        tooltip: feature.tooltip,
        asset: feature.asset,
      });
    });
  } else {
    result.paid.forEach((feature, pIdx) => {
      rows.push({
        index: result.enabled.length + pIdx,
        kind: "paid",
        label: feature.featureName,
        outcome: toneOutcome(tone, jtbdKey, "paid", pIdx),
        tooltip: feature.tooltip,
        asset: feature.asset,
      });
    });
  }

  const appliedCount = isMultipleActive ? freeCapped!.displayed.length : result.enabled.length;
  const lockedCount = isMultipleActive ? profiles!.length : result.paid.length;
  const truePaidFeatureCount = isMultipleActive ? paidCapped!.displayed.length + 1 : 0;
  const selectionCount = selectedJtbds?.length ?? 1;

  return {
    isMultipleActive,
    rows,
    totalRows,
    boundaryIndex,
    rowStages,
    rowMounted,
    boundaryVisible,
    appliedSoFar,
    rowsComplete,
    continueDelayMs,
    introDone,
    appliedCount,
    lockedCount,
    truePaidFeatureCount,
    selectionCount,
    titleDuringText: isMultipleActive ? titleDuringMultiple(tone, selectionCount) : titleDuring(tone, result.jtbdLabel),
    titleCompleteText: isMultipleActive ? titleCompleteMultiple(tone, selectionCount) : titleComplete(tone, result.jtbdLabel),
    introText: introSubtext(tone),
    summaryText: isMultipleActive
      ? summarySubtextMultiple(tone, appliedCount, truePaidFeatureCount)
      : summarySubtext(tone, appliedCount, lockedCount),
    counterText: counterSubtext,
    jtbdLabel: result.jtbdLabel,
  };
}
