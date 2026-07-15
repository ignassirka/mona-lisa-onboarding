import { motion, AnimatePresence } from "motion/react";
import EnabledFeatureRow from "../../components/EnabledFeatureRow";
import PaidFeatureRow from "../../components/PaidFeatureRow";
import MaterializingSlot from "../MaterializingSlot";
import PhaseOnePlaceholder from "../PhaseOnePlaceholder";
import ProfilesSummaryRow from "../ProfilesSummaryRow";
import TransformingPaidCell from "../TransformingPaidCell";
import { TUNED_RESULT_COPY, narrateEnabling, narrateChecking, narratePreparingPlusPreview } from "../copy";
import { TUNED_RESULT_TIMING as T, sec } from "../timing";
import { toneOutcome } from "../../lib/jtbdTuningToneCopy";
import { outcomeForEnabled, outcomeForPaid, type TuningResultLike, type ProfilePreview, type MergedPaidFeature } from "../../lib/jtbdMerge";
import type { ToneOfVoice } from "../../lib/toneOfVoice";
import type { RowStage } from "../useTunedMaterialization";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import vpnPlusBadgeUrl from "../../assets/vpn-plus-badge.svg";

interface SplitByStatusLayoutProps {
  result: TuningResultLike;
  /** Multiple mode only — renders in the right column instead of the 2
   * locked paid rows. See `StackedLayout`'s doc for the exact contract. */
  profiles?: ProfilePreview[] | null;
  /** Multiple mode only — see `StackedLayout`'s doc for the exact contract. */
  paidFeatures?: MergedPaidFeature[] | null;
  paidUnlocked: boolean;
  rowStages: RowStage[];
  rowMounted: boolean[];
  boundaryVisible: boolean;
  reduced: boolean;
  /** Tone of voice for the outcome sentences — settings names/values/feature
   * names/asset stay unchanged regardless of tone. */
  tone: ToneOfVoice;
  /** Stage 3 only — see `StackedLayout`'s doc for the exact contract. The
   * right column's "With Plus"/"Also active" header also tracks
   * `unlockTransition.unlocked` live (rather than the settled `paidUnlocked`)
   * so it updates in sync with the 2 tiles' own transition. */
  unlockTransition?: { unlocked: boolean; showChip: boolean };
}

// Matches `EnabledFeatureRow`/`PaidFeatureRow`'s own `layout="stacked"`
// outer classes exactly, so the Phase-1 placeholder is the same shape as the
// Phase-2 resolved tile it crossfades into.
const FREE_TILE_CLASS = "relative flex w-full flex-col gap-[6px] rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[14px] py-[10px]";
const PAID_TILE_CLASS = "relative flex w-full flex-col gap-[6px] rounded-[8px] border border-[rgba(255,255,255,0.1)] px-[14px] py-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]";

/** "Split by Status" — the free/paid boundary is spatial (two columns)
 * rather than sequential (one stacked list): left "Active now" (the 3
 * applied items), right "With Plus" (the 2 locked items). The 5 items still
 * materialize in the SAME underlying order the shared hook drives (0..2 then
 * 3..4) — "one by one" here means each item resolves into its own column
 * slot rather than a different sequence; the left column header appears
 * with the first item (materialization start), the right column header at
 * the shared boundary beat (matching where Stacked/Compact List's divider
 * would land). Resolved visuals reuse `EnabledFeatureRow`/`PaidFeatureRow`'s
 * existing `layout="stacked"` mode verbatim. */
export default function SplitByStatusLayout({
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
}: SplitByStatusLayoutProps) {
  const leftHeaderVisible = rowMounted[0];
  // The right-column header tracks the LIVE unlock value during stage 3's
  // transition, not the settled final state — see prop doc above. In stage
  // 2 (no `unlockTransition`), Multiple mode's header always reads as the
  // Plus-preview caption (never the "active" checkmark header) since
  // nothing has unlocked yet there; in stage 3 (`unlockTransition` present),
  // it tracks the live unlock value regardless of mode, so the header
  // flips to "Also active with Plus" in sync with the profiles/feature
  // rows below it.
  const rightHeaderUnlocked = unlockTransition ? unlockTransition.unlocked : profiles ? false : paidUnlocked;

  const renderEnabledRow = (i: number) => {
    const feature = result.enabled[i];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    const toneFeature = { ...feature, outcome: outcomeForEnabled(tone, result, i, feature) };
    return (
      <MaterializingSlot
        key={`enabled-${i}`}
        stage={stage}
        reduced={reduced}
        className="w-full"
        phase1Content={<div className={FREE_TILE_CLASS}><PhaseOnePlaceholder narration={narrateEnabling(feature.settingsName)} /></div>}
        resolvedContent={<EnabledFeatureRow feature={toneFeature} layout="stacked" />}
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
          className="w-full"
          phase1Content={null}
          resolvedContent={
            <TransformingPaidCell
              feature={toneFeature}
              unlocked={unlockTransition.unlocked}
              showChip={unlockTransition.showChip}
              index={pIdx}
              layout="stacked"
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
        className="w-full"
        phase1Content={<div className={PAID_TILE_CLASS}><PhaseOnePlaceholder narration={narration} /></div>}
        resolvedContent={<PaidFeatureRow feature={toneFeature} unlocked={paidUnlocked} layout="stacked" />}
      />
    );
  };

  // Multiple mode: the Plus section's one-line profiles summary — same
  // contract as `StackedLayout`'s version, rendered in the right column.
  // In stage 3 (`unlockTransition` present), tracks the live unlock value —
  // see `rightHeaderUnlocked`'s doc above for the same rule.
  const renderProfilesSummaryRow = () => {
    const i = result.enabled.length;
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    return (
      <MaterializingSlot
        key="profiles-summary"
        stage={stage}
        reduced={reduced}
        className="w-full"
        phase1Content={<div className={PAID_TILE_CLASS}><PhaseOnePlaceholder narration={narratePreparingPlusPreview()} /></div>}
        resolvedContent={<ProfilesSummaryRow profiles={profiles!} unlocked={unlockTransition?.unlocked ?? paidUnlocked} layout="stacked" />}
      />
    );
  };

  // Multiple mode: the capped/ranked Plus feature rows — reuses the same
  // `PaidFeatureRow`/`TransformingPaidCell` components `renderPaidRow`
  // above already uses (including the stage-3 locked→unlocked transition).
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
          className="w-full"
          phase1Content={null}
          resolvedContent={
            <TransformingPaidCell
              feature={toneFeature}
              unlocked={unlockTransition.unlocked}
              showChip={unlockTransition.showChip}
              index={pIdx}
              layout="stacked"
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
        className="w-full"
        phase1Content={<div className={PAID_TILE_CLASS}><PhaseOnePlaceholder narration={narration} /></div>}
        resolvedContent={<PaidFeatureRow feature={toneFeature} unlocked={paidUnlocked} layout="stacked" />}
      />
    );
  };

  return (
    <div className="flex w-full max-w-[704px] gap-[24px] @max-[900px]:flex-col @max-[900px]:gap-[16px]">
      <div className="flex w-[58%] flex-col gap-[10px] @max-[900px]:w-full">
        <AnimatePresence>
          {leftHeaderVisible && (
            <motion.div
              className="flex items-center gap-[6px]"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.2 : sec(T.boundaryIn) }}
            >
              <img src={checkmarkUrl} alt="" className="size-[14px] shrink-0" />
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase leading-[16px] tracking-wide text-[rgba(255,255,255,0.45)]">
                {TUNED_RESULT_COPY.activeNowHeader}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {result.enabled.map((_, i) => renderEnabledRow(i))}
      </div>

      {/* Right column deliberately ends after its rows — the empty space
          below is deliberate negative space, not filled. */}
      <div className="flex w-[42%] flex-col gap-[10px] @max-[900px]:w-full">
        <AnimatePresence>
          {boundaryVisible && (
            <motion.div
              className="flex items-center gap-[6px]"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.2 : sec(T.boundaryIn) }}
            >
              {rightHeaderUnlocked ? (
                <img src={checkmarkUrl} alt="" className="size-[14px] shrink-0" />
              ) : (
                <img src={vpnPlusBadgeUrl} alt="" className="h-[12px] w-[20px] shrink-0" />
              )}
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase leading-[16px] tracking-wide text-[rgba(255,255,255,0.45)]">
                {rightHeaderUnlocked ? TUNED_RESULT_COPY.alsoActiveWithPlusHeader : TUNED_RESULT_COPY.withPlusHeader}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
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
