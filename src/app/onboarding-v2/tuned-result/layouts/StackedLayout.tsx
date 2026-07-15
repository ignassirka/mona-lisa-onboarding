import { motion, AnimatePresence, type Variants } from "motion/react";
import MaterializingSlot from "../MaterializingSlot";
import PhaseOnePlaceholder from "../PhaseOnePlaceholder";
import BoundaryDivider from "../BoundaryDivider";
import ProfilesSummaryRow from "../ProfilesSummaryRow";
import CircleSlashIcon from "../CircleSlashIcon";
import { UnlockedChip } from "../TransformingPaidCell";
import { narrateEnabling, narrateChecking, narratePreparingPlusPreview } from "../copy";
import { toneOutcome } from "../../lib/jtbdTuningToneCopy";
import { outcomeForEnabled, outcomeForPaid, type TuningResultLike, type ProfilePreview, type MergedPaidFeature } from "../../lib/jtbdMerge";
import { TUNED_RESULT_TIMING as T, sec } from "../timing";
import type { ToneOfVoice } from "../../lib/toneOfVoice";
import type { RowStage } from "../useTunedMaterialization";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import vpnPlusBadgeUrl from "../../assets/vpn-plus-badge.svg";

// Reused verbatim from `EnabledFeatureRow`/`PaidFeatureRow`'s existing
// check-pop spring config — same primitive, same feel.
const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 14 } },
};

// Locked rows "settle" rather than pop — no overshoot, reads as calm/neutral
// ("needs Plus"), never an error.
const settleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

interface StackedLayoutProps {
  result: TuningResultLike;
  /** Multiple mode only (`null`/`undefined` in single mode, its default) —
   * feeds the Plus section's one-line profiles summary (`ProfilesSummaryRow`)
   * INSTEAD of `result.paid` (which is always `[]` in Multiple mode, so the
   * existing paid-row rendering below simply no-ops). See
   * docs/features/onboarding-v2.md → "Multiple-mode result curation". */
  profiles?: ProfilePreview[] | null;
  /** Multiple mode only — the capped/ranked union of the selected JTBDs' paid
   * features (top `paidFeatureCap` by `FEATURES_RANK`), rendered below the
   * profiles summary. `undefined` in single mode. */
  paidFeatures?: MergedPaidFeature[] | null;
  paidUnlocked: boolean;
  rowStages: RowStage[];
  rowMounted: boolean[];
  boundaryVisible: boolean;
  reduced: boolean;
  /** Tone of voice for the outcome sentences (`toneOutcome`) — settings
   * names/values/feature names/asset stay unchanged regardless of tone. */
  tone: ToneOfVoice;
  /** Stage 3 ("Upgrade to Plus" welcome) only: animates the 2 paid rows
   * from locked to unlocked in place instead of rendering the fixed final
   * state `paidUnlocked` would otherwise pick. Omit for stage 2's normal
   * materialization behavior (unchanged). When present, `paidUnlocked`
   * should be `true` (the settled/eventual state — Plus is always active by
   * the time stage 3 renders); `unlockTransition.unlocked` is the LIVE,
   * animated value that starts `false` and flips partway through. */
  unlockTransition?: { unlocked: boolean; showChip: boolean };
}

const ROW_CLASS = "flex w-full max-w-[800px] items-center gap-[16px] py-[12px]";

/** "Stacked" (default layout) — full-width rows, each a green check + benefit
 * sentence + a single merged "{settingsName}: {value}" pill; no per-row card
 * background (rows sit directly on the gradient, matching the Figma
 * reference this layout was originally built from). This is the exact
 * visual the former "Visual Tuning" version rendered — now just one of 4
 * selectable layouts for the single, consolidated result step. */
export default function StackedLayout({
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
}: StackedLayoutProps) {
  const showBoundary = !paidUnlocked || !!profiles;

  const renderEnabledRow = (i: number) => {
    const feature = result.enabled[i];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    return (
      <MaterializingSlot
        key={`enabled-${i}`}
        stage={stage}
        reduced={reduced}
        className={ROW_CLASS}
        phase1Content={<PhaseOnePlaceholder narration={narrateEnabling(feature.settingsName)} />}
        resolvedContent={
          <div className="flex w-full items-center gap-[16px]">
            <div className="flex min-w-0 flex-1 items-center gap-[8px]">
              <motion.img variants={popVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
              <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {outcomeForEnabled(tone, result, i, feature)}
              </span>
            </div>
            <span className="flex shrink-0 items-end justify-center gap-[4px] whitespace-nowrap rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px] text-[14px] leading-[20px]">
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[rgba(255,255,255,0.7)]" style={{ fontFeatureSettings: '"rclt" 0' }}>
                {feature.settingsName}:
              </span>
              <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {feature.value}
              </span>
            </span>
          </div>
        }
      />
    );
  };

  const renderPaidRow = (pIdx: number) => {
    const i = result.enabled.length + pIdx;
    const feature = result.paid[pIdx];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;

    if (unlockTransition) {
      const { unlocked, showChip } = unlockTransition;
      const stagger = pIdx * sec(T.unlockTransformStagger);
      return (
        <MaterializingSlot
          key={`paid-${i}`}
          stage={stage}
          reduced={reduced}
          className={ROW_CLASS}
          phase1Content={null}
          resolvedContent={
            <div className="relative flex w-full items-center gap-[16px]">
              <UnlockedChip show={unlocked && showChip} stagger={stagger} className="-top-[9px] left-0" />
              <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                <div className="relative size-[20px] shrink-0">
                  <AnimatePresence mode="wait" initial={false}>
                    {unlocked ? (
                      <motion.img
                        key="check"
                        src={checkmarkUrl}
                        alt=""
                        className="absolute inset-0 size-[20px]"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
                      />
                    ) : (
                      <motion.img
                        key="badge"
                        src={vpnPlusBadgeUrl}
                        alt="Proton VPN Plus"
                        className="absolute top-0 h-[20px] w-[33px]"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: stagger }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <motion.span
                  className="font-['Segoe_UI_Variable',sans-serif] font-semibold"
                  style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                  animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
                >
                  {toneOutcome(tone, result.jtbdKey, "paid", pIdx)}
                </motion.span>
              </div>
              <span className="flex shrink-0 items-center gap-[8px]">
                <motion.img
                  src={feature.asset}
                  alt=""
                  className="size-[20px] shrink-0 object-contain"
                  animate={{ opacity: unlocked ? 1 : 0.5 }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
                />
                <motion.span
                  className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px]"
                  style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                  animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
                >
                  {feature.featureName}
                </motion.span>
              </span>
            </div>
          }
        />
      );
    }

    if (paidUnlocked) {
      // Plus users: resolves as a free-style row. No value exists for paid
      // features, so the resolved pill matches the existing plan-active
      // convention (plain asset + name, no "label: value" pill) rather than
      // fabricating one.
      return (
        <MaterializingSlot
          key={`paid-${i}`}
          stage={stage}
          reduced={reduced}
          className={ROW_CLASS}
          phase1Content={<PhaseOnePlaceholder narration={narrateEnabling(feature.featureName)} />}
          resolvedContent={
            <div className="flex w-full items-center gap-[16px]">
              <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                <motion.img variants={popVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
                <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                  {toneOutcome(tone, result.jtbdKey, "paid", pIdx)}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-[8px]">
                <img src={feature.asset} alt="" className="size-[20px] shrink-0 object-contain" />
                <span className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                  {feature.featureName}
                </span>
              </span>
            </div>
          }
        />
      );
    }

    return (
      <MaterializingSlot
        key={`paid-${i}`}
        stage={stage}
        reduced={reduced}
        className={ROW_CLASS}
        phase1Content={<PhaseOnePlaceholder narration={narrateChecking(feature.featureName)} />}
        resolvedContent={
          <div className="flex w-full items-center gap-[16px]">
            <div className="flex min-w-0 flex-1 items-center gap-[8px]">
              <motion.span variants={settleVariants} className="flex size-[20px] shrink-0 items-center justify-center">
                <CircleSlashIcon size={20} />
              </motion.span>
              <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-[rgba(255,255,255,0.5)]" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {toneOutcome(tone, result.jtbdKey, "paid", pIdx)}
              </span>
            </div>
            <span className="flex shrink-0 items-end justify-center gap-[8px] whitespace-nowrap rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px]">
              <img src={feature.asset} alt="" className="size-[20px] shrink-0 object-contain opacity-50" />
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.5)]" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {feature.featureName}
              </span>
            </span>
          </div>
        }
      />
    );
  };

  // Multiple mode: the Plus section's one-line profiles summary — sits at
  // the boundary index (right after the capped free rows), materializing via
  // the same two-phase reveal as every other row. In stage 3
  // (`unlockTransition` present), switches to its `unlocked` visual in sync
  // with the paid feature row(s) below it.
  const renderProfilesSummaryRow = () => {
    const i = result.enabled.length;
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    return (
      <MaterializingSlot
        key="profiles-summary"
        stage={stage}
        reduced={reduced}
        className={ROW_CLASS}
        phase1Content={<PhaseOnePlaceholder narration={narratePreparingPlusPreview()} />}
        resolvedContent={<ProfilesSummaryRow profiles={profiles!} unlocked={unlockTransition?.unlocked ?? paidUnlocked} layout="row" />}
      />
    );
  };

  // Multiple mode: the capped/ranked Plus feature rows — same "locked
  // vs. Plus-active" visual language as `renderPaidRow` above (Stacked's own
  // established look for this section, including the stage-3 locked→
  // unlocked transition), just sourced from the merged union instead of a
  // single JTBD's 2 paid features.
  const renderPlusFeatureRow = (pIdx: number) => {
    const i = result.enabled.length + 1 + pIdx;
    const feature = paidFeatures![pIdx];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;

    if (unlockTransition) {
      const { unlocked, showChip } = unlockTransition;
      const stagger = pIdx * sec(T.unlockTransformStagger);
      return (
        <MaterializingSlot
          key={`plus-feature-${feature.featureName}`}
          stage={stage}
          reduced={reduced}
          className={ROW_CLASS}
          phase1Content={null}
          resolvedContent={
            <div className="relative flex w-full items-center gap-[16px]">
              <UnlockedChip show={unlocked && showChip} stagger={stagger} className="-top-[9px] left-0" />
              <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                <div className="relative size-[20px] shrink-0">
                  <AnimatePresence mode="wait" initial={false}>
                    {unlocked ? (
                      <motion.img
                        key="check"
                        src={checkmarkUrl}
                        alt=""
                        className="absolute inset-0 size-[20px]"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
                      />
                    ) : (
                      <motion.img
                        key="badge"
                        src={vpnPlusBadgeUrl}
                        alt="Proton VPN Plus"
                        className="absolute top-0 h-[20px] w-[33px]"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: stagger }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <motion.span
                  className="font-['Segoe_UI_Variable',sans-serif] font-semibold"
                  style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                  animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
                >
                  {outcomeForPaid(tone, feature)}
                </motion.span>
              </div>
              <span className="flex shrink-0 items-center gap-[8px]">
                <motion.img
                  src={feature.asset}
                  alt=""
                  className="size-[20px] shrink-0 object-contain"
                  animate={{ opacity: unlocked ? 1 : 0.5 }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
                />
                <motion.span
                  className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px]"
                  style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                  animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
                >
                  {feature.featureName}
                </motion.span>
              </span>
            </div>
          }
        />
      );
    }

    if (paidUnlocked) {
      return (
        <MaterializingSlot
          key={`plus-feature-${feature.featureName}`}
          stage={stage}
          reduced={reduced}
          className={ROW_CLASS}
          phase1Content={<PhaseOnePlaceholder narration={narrateEnabling(feature.featureName)} />}
          resolvedContent={
            <div className="flex w-full items-center gap-[16px]">
              <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                <motion.img variants={popVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
                <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                  {outcomeForPaid(tone, feature)}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-[8px]">
                <img src={feature.asset} alt="" className="size-[20px] shrink-0 object-contain" />
                <span className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                  {feature.featureName}
                </span>
              </span>
            </div>
          }
        />
      );
    }

    return (
      <MaterializingSlot
        key={`plus-feature-${feature.featureName}`}
        stage={stage}
        reduced={reduced}
        className={ROW_CLASS}
        phase1Content={<PhaseOnePlaceholder narration={narrateChecking(feature.featureName)} />}
        resolvedContent={
          <div className="flex w-full items-center gap-[16px]">
            <div className="flex min-w-0 flex-1 items-center gap-[8px]">
              <motion.span variants={settleVariants} className="flex size-[20px] shrink-0 items-center justify-center">
                <CircleSlashIcon size={20} />
              </motion.span>
              <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-[rgba(255,255,255,0.5)]" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {outcomeForPaid(tone, feature)}
              </span>
            </div>
            <span className="flex shrink-0 items-end justify-center gap-[8px] whitespace-nowrap rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px]">
              <img src={feature.asset} alt="" className="size-[20px] shrink-0 object-contain opacity-50" />
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.5)]" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {feature.featureName}
              </span>
            </span>
          </div>
        }
      />
    );
  };

  return (
    <div className="flex w-full max-w-[704px] flex-col items-center gap-[16px]">
      <div className="flex w-full flex-col items-center">{result.enabled.map((_, i) => renderEnabledRow(i))}</div>

      {/* Divider + locked rows/profile previews share a tighter internal gap
          than the 16px between the free-rows block and this one — otherwise
          the 16px wrapper gap stacks on top of the header row's own padding
          and the first row's own top padding, reading as an oversized gap
          under "Available with VPN Plus". */}
      <div className="flex w-full flex-col items-center gap-[2px]">
        {showBoundary && <BoundaryDivider visible={boundaryVisible} reduced={reduced} />}
        <div className="flex w-full flex-col items-center gap-[8px]">
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
    </div>
  );
}
