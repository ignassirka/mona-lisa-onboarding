import EnabledFeatureRow from "../../components/EnabledFeatureRow";
import PaidFeatureRow from "../../components/PaidFeatureRow";
import MaterializingSlot from "../MaterializingSlot";
import PhaseOnePlaceholder from "../PhaseOnePlaceholder";
import BoundaryDivider from "../BoundaryDivider";
import ProfilesSummaryRow from "../ProfilesSummaryRow";
import TransformingPaidCell from "../TransformingPaidCell";
import { narrateEnabling, narrateChecking, narratePreparingPlusPreview } from "../copy";
import { toneOutcome } from "../../lib/jtbdTuningToneCopy";
import { outcomeForEnabled, outcomeForPaid, type TuningResultLike, type ProfilePreview, type MergedPaidFeature } from "../../lib/jtbdMerge";
import type { ToneOfVoice } from "../../lib/toneOfVoice";
import type { RowStage } from "../useTunedMaterialization";

interface CompactListLayoutProps {
  result: TuningResultLike;
  /** Multiple mode only — see `StackedLayout`'s doc for the exact contract. */
  profiles?: ProfilePreview[] | null;
  /** Multiple mode only — see `StackedLayout`'s doc for the exact contract. */
  paidFeatures?: MergedPaidFeature[] | null;
  paidUnlocked: boolean;
  rowStages: RowStage[];
  rowMounted: boolean[];
  boundaryVisible: boolean;
  reduced: boolean;
  /** Tone of voice for the outcome sentences — settings names/values/feature
   * names/asset (the rest of `feature`, passed through to `EnabledFeatureRow`/
   * `PaidFeatureRow` unmodified) stay unchanged regardless of tone. */
  tone: ToneOfVoice;
  /** Stage 3 only — see `StackedLayout`'s doc for the exact contract. */
  unlockTransition?: { unlocked: boolean; showChip: boolean };
}

// Matches `EnabledFeatureRow`/`PaidFeatureRow`'s own `layout="row"` outer
// classes exactly, so the Phase-1 placeholder is the same shape as the
// Phase-2 resolved row it crossfades into.
const FREE_ROW_CLASS = "flex w-full max-w-[800px] items-center gap-[16px] rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[16px] py-[12px]";
const PAID_ROW_CLASS = "flex w-full max-w-[800px] items-center gap-[16px] rounded-[8px] border border-[rgba(255,255,255,0.1)] px-[16px] py-[12px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]";

/** "Compact List" — the original "Default" version's simpler row style:
 * `EnabledFeatureRow`/`PaidFeatureRow`'s existing `layout="row"` mode
 * (separate settings-name label + value pill, unlike Stacked's merged
 * pill), reused verbatim and unmodified for the resolved visual — only the
 * Phase-1 "spinner + narration" placeholder is new here, shaped to match. */
export default function CompactListLayout({
  result,
  profiles,
  paidFeatures,
  paidUnlocked,
  rowStages,
  rowMounted,
  boundaryVisible,
  reduced,
  tone,
  unlockTransition,
}: CompactListLayoutProps) {
  const showBoundary = !paidUnlocked || !!profiles;

  const renderEnabledRow = (i: number) => {
    const feature = result.enabled[i];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    // Only `outcome` is swapped for the tone-voiced sentence — spreading the
    // rest of `feature` (settingsName/value/tooltip) through unmodified into
    // the shared, unmodified `EnabledFeatureRow`.
    const toneFeature = { ...feature, outcome: outcomeForEnabled(tone, result, i, feature) };
    return (
      <MaterializingSlot
        key={`enabled-${i}`}
        stage={stage}
        reduced={reduced}
        // Plain block `w-full` (no `flex`/`justify-center`) — a block
        // element's width is always exactly 100% of its parent, with no
        // dependency on flex main-axis distribution, so the loading
        // (Phase 1) placeholder and the resolved row are guaranteed the
        // same width as every other row, never shrinking to fit content.
        className="w-full max-w-[800px]"
        phase1Content={<div className={FREE_ROW_CLASS}><PhaseOnePlaceholder narration={narrateEnabling(feature.settingsName)} /></div>}
        resolvedContent={<EnabledFeatureRow feature={toneFeature} layout="row" />}
      />
    );
  };

  const renderPaidRow = (pIdx: number) => {
    const i = result.enabled.length + pIdx;
    const feature = result.paid[pIdx];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    const narration = paidUnlocked ? narrateEnabling(feature.featureName) : narrateChecking(feature.featureName);
    const toneFeature = { ...feature, outcome: toneOutcome(tone, result.jtbdKey, "paid", pIdx) };

    if (unlockTransition) {
      return (
        <MaterializingSlot
          key={`paid-${i}`}
          stage={stage}
          reduced={reduced}
          className="w-full max-w-[800px]"
          phase1Content={null}
          resolvedContent={
            <TransformingPaidCell
              feature={toneFeature}
              unlocked={unlockTransition.unlocked}
              showChip={unlockTransition.showChip}
              index={pIdx}
              layout="row"
            />
          }
        />
      );
    }

    return (
      <MaterializingSlot
        key={`paid-${i}`}
        stage={stage}
        reduced={reduced}
        className="w-full max-w-[800px]"
        phase1Content={<div className={PAID_ROW_CLASS}><PhaseOnePlaceholder narration={narration} /></div>}
        resolvedContent={<PaidFeatureRow feature={toneFeature} unlocked={paidUnlocked} layout="row" />}
      />
    );
  };

  // Multiple mode: the Plus section's one-line profiles summary — same
  // contract as `StackedLayout`'s version. In stage 3 (`unlockTransition`
  // present), the profiles row switches to its `unlocked` visual in sync
  // with the paid feature row(s) below it — profiles "unlock" alongside
  // everything else VPN Plus turns on.
  const renderProfilesSummaryRow = () => {
    const i = result.enabled.length;
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    return (
      <MaterializingSlot
        key="profiles-summary"
        stage={stage}
        reduced={reduced}
        className="w-full max-w-[800px]"
        phase1Content={<div className={FREE_ROW_CLASS}><PhaseOnePlaceholder narration={narratePreparingPlusPreview()} /></div>}
        resolvedContent={<ProfilesSummaryRow profiles={profiles!} unlocked={unlockTransition?.unlocked ?? paidUnlocked} layout="row" />}
      />
    );
  };

  // Multiple mode: the capped/ranked Plus feature rows — reuses the same
  // `PaidFeatureRow`/`TransformingPaidCell` components `renderPaidRow`
  // above already uses (including the stage-3 locked→unlocked transition),
  // just sourced from the merged union instead of a single JTBD's 2
  // features.
  const renderPlusFeatureRow = (pIdx: number) => {
    const i = result.enabled.length + 1 + pIdx;
    const feature = paidFeatures![pIdx];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    const narration = paidUnlocked ? narrateEnabling(feature.featureName) : narrateChecking(feature.featureName);
    const toneFeature = { ...feature, outcome: outcomeForPaid(tone, feature) };

    if (unlockTransition) {
      return (
        <MaterializingSlot
          key={`plus-feature-${feature.featureName}`}
          stage={stage}
          reduced={reduced}
          className="w-full max-w-[800px]"
          phase1Content={null}
          resolvedContent={
            <TransformingPaidCell
              feature={toneFeature}
              unlocked={unlockTransition.unlocked}
              showChip={unlockTransition.showChip}
              index={pIdx}
              layout="row"
            />
          }
        />
      );
    }

    return (
      <MaterializingSlot
        key={`plus-feature-${feature.featureName}`}
        stage={stage}
        reduced={reduced}
        className="w-full max-w-[800px]"
        phase1Content={<div className={PAID_ROW_CLASS}><PhaseOnePlaceholder narration={narration} /></div>}
        resolvedContent={<PaidFeatureRow feature={toneFeature} unlocked={paidUnlocked} layout="row" />}
      />
    );
  };

  return (
    <div className="flex w-full max-w-[704px] flex-col items-center gap-[12px]">
      <div className="flex w-full flex-col items-center gap-[12px]">{result.enabled.map((_, i) => renderEnabledRow(i))}</div>

      <div className="flex w-full flex-col items-center gap-[12px]">
        {showBoundary && <BoundaryDivider visible={boundaryVisible} reduced={reduced} />}
        {profiles ? (
          <>
            {renderProfilesSummaryRow()}
            {paidFeatures?.map((_, i) => renderPlusFeatureRow(i))}
          </>
        ) : (
          result.paid.map((_, i) => renderPaidRow(i))
        )}
      </div>
    </div>
  );
}
