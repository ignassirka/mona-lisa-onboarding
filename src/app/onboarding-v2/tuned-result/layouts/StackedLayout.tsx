import { motion, AnimatePresence, type Variants } from "motion/react";
import MaterializingSlot from "../MaterializingSlot";
import PhaseOnePlaceholder from "../PhaseOnePlaceholder";
import BoundaryDivider from "../BoundaryDivider";
import ProfilesSummaryRow from "../ProfilesSummaryRow";
import CircleSlashIcon from "../CircleSlashIcon";
import { UnlockedChip } from "../TransformingPaidCell";
import { STACKED_ROW_CLASS, SettingLabelPill, checkPopVariants as popVariants } from "../stackedRow";
import InfoTooltip from "../../versions/upsell/lib/InfoTooltip";
import { narrateEnabling, narrateChecking, narratePreparingPlusPreview, moreSettingsTuned } from "../copy";
import { toneOutcome } from "../../lib/jtbdTuningToneCopy";
import { outcomeForEnabled, outcomeForPaid, type TuningResultLike, type ProfilePreview, type MergedPaidFeature } from "../../lib/jtbdMerge";
import { TUNED_RESULT_TIMING as T, sec } from "../timing";
import type { ToneOfVoice } from "../../lib/toneOfVoice";
import type { RowStage } from "../useTunedMaterialization";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import vpnPlusBadgeUrl from "../../assets/vpn-plus-badge.svg";

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
  /** Intent-aware Plus-section heading — see `plusSectionHeader` in
   * `tuned-result/copy.ts`. */
  plusSectionHeader: string;
  /** Plus plan, Multiple mode only — the true overflow beyond the display
   * caps (`TunedResult`'s `plusOverflowCount`). `0`/`undefined` everywhere
   * else (Free plan, Single mode, or stage 3), which renders nothing —
   * byte-for-byte unchanged for every existing call site. */
  moreCount?: number;
  /** Stage 3 ("Upgrade to Plus" welcome) only: animates the 2 paid rows
   * from locked to unlocked in place instead of rendering the fixed final
   * state `paidUnlocked` would otherwise pick. Omit for stage 2's normal
   * materialization behavior (unchanged). When present, `paidUnlocked`
   * should be `true` (the settled/eventual state — Plus is always active by
   * the time stage 3 renders); `unlockTransition.unlocked` is the LIVE,
   * animated value that starts `false` and flips partway through. */
  unlockTransition?: { unlocked: boolean; showChip: boolean };
}

const ROW_CLASS = STACKED_ROW_CLASS;

function FeatureLabel({
  name,
  tooltip,
  muted = false,
}: {
  name: string;
  tooltip?: string;
  muted?: boolean;
}) {
  const color = muted ? "text-[rgba(255,255,255,0.5)]" : "text-white";
  return (
    <span className={`flex items-center gap-[4px] whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] ${color}`} style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
      {name}
      <InfoTooltip content={tooltip} />
    </span>
  );
}

/** Paid-feature chip — mirrors `SettingLabelPill`'s container for free rows
 * (rounded pill, same padding/bg) but holds asset + feature name instead of
 * "label: value". Used for locked, unlocking, and unlocked Plus rows in
 * Stacked so the bottom features read like the free chips above them. */
function FeatureNamePill({
  asset,
  name,
  tooltip,
  muted = false,
}: {
  asset: string;
  name: string;
  tooltip?: string;
  muted?: boolean;
}) {
  return (
    <span className="flex shrink-0 items-center gap-[8px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px]">
      <img src={asset} alt="" className={`size-[20px] shrink-0 object-contain ${muted ? "opacity-50" : ""}`} />
      <FeatureLabel name={name} tooltip={tooltip} muted={muted} />
    </span>
  );
}

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
  plusSectionHeader,
  unlockTransition,
  moreCount,
}: StackedLayoutProps) {
  // Stage 3 (`unlockTransition` present — VPN Plus Welcome, Free-path-only,
  // untouched): unchanged formula, still shows the boundary while
  // Multiple-mode profiles are present even once `paidUnlocked` flips true
  // mid-animation. Stage 2 (`unlockTransition` absent — both plans): the
  // boundary/"Available with VPN Plus" header only ever belongs to a locked
  // state, so a Plus-plan run (`paidUnlocked` true) never shows it, single
  // or multiple mode, regardless of `profiles`.
  const showBoundary = unlockTransition ? !paidUnlocked || !!profiles : !paidUnlocked;

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
          <div className="flex w-full items-start gap-[16px]">
            <div className="flex min-w-0 flex-1 items-start gap-[8px]">
              <motion.img variants={popVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
              <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {outcomeForEnabled(tone, result, i, feature)}
              </span>
            </div>
            <SettingLabelPill label={feature.settingsName} value={feature.value} tooltip={feature.tooltip} />
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
            <div className="relative flex w-full items-start gap-[16px]">
              <UnlockedChip show={unlocked && showChip} stagger={stagger} className="-top-[9px] left-0" />
              <div className="flex min-w-0 flex-1 items-start gap-[8px]">
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
              <motion.span
                className="flex shrink-0"
                animate={{ opacity: unlocked ? 1 : 0.85 }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
              >
                <FeatureNamePill asset={feature.asset} name={feature.featureName} tooltip={feature.tooltip} muted={!unlocked} />
              </motion.span>
            </div>
          }
        />
      );
    }

    if (paidUnlocked) {
      // Plus users: same chip treatment as free rows (`FeatureNamePill`).
      return (
        <MaterializingSlot
          key={`paid-${i}`}
          stage={stage}
          reduced={reduced}
          className={ROW_CLASS}
          phase1Content={<PhaseOnePlaceholder narration={narrateEnabling(feature.featureName)} />}
          resolvedContent={
            <div className="flex w-full items-start gap-[16px]">
              <div className="flex min-w-0 flex-1 items-start gap-[8px]">
                <motion.img variants={popVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
                <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                  {toneOutcome(tone, result.jtbdKey, "paid", pIdx)}
                </span>
              </div>
              <FeatureNamePill asset={feature.asset} name={feature.featureName} tooltip={feature.tooltip} />
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
          <div className="flex w-full items-start gap-[16px]">
            <div className="flex min-w-0 flex-1 items-start gap-[8px]">
              <motion.span variants={settleVariants} className="flex size-[20px] shrink-0 items-center justify-center">
                <CircleSlashIcon size={20} />
              </motion.span>
              <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-[rgba(255,255,255,0.5)]" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {toneOutcome(tone, result.jtbdKey, "paid", pIdx)}
              </span>
            </div>
            <FeatureNamePill asset={feature.asset} name={feature.featureName} tooltip={feature.tooltip} muted />
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
        resolvedContent={
          <ProfilesSummaryRow
            profiles={profiles!}
            unlocked={unlockTransition?.unlocked ?? paidUnlocked}
            layout="row"
            readyCopy={paidUnlocked && !unlockTransition}
          />
        }
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
            <div className="relative flex w-full items-start gap-[16px]">
              <UnlockedChip show={unlocked && showChip} stagger={stagger} className="-top-[9px] left-0" />
              <div className="flex min-w-0 flex-1 items-start gap-[8px]">
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
              <motion.span
                className="flex shrink-0"
                animate={{ opacity: unlocked ? 1 : 0.85 }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
              >
                <FeatureNamePill asset={feature.asset} name={feature.featureName} tooltip={feature.tooltip} muted={!unlocked} />
              </motion.span>
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
            <div className="flex w-full items-start gap-[16px]">
              <div className="flex min-w-0 flex-1 items-start gap-[8px]">
                <motion.img variants={popVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
                <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                  {outcomeForPaid(tone, feature)}
                </span>
              </div>
              <FeatureNamePill asset={feature.asset} name={feature.featureName} tooltip={feature.tooltip} />
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
          <div className="flex w-full items-start gap-[16px]">
            <div className="flex min-w-0 flex-1 items-start gap-[8px]">
              <motion.span variants={settleVariants} className="flex size-[20px] shrink-0 items-center justify-center">
                <CircleSlashIcon size={20} />
              </motion.span>
              <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-[rgba(255,255,255,0.5)]" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {outcomeForPaid(tone, feature)}
              </span>
            </div>
            <FeatureNamePill asset={feature.asset} name={feature.featureName} tooltip={feature.tooltip} muted />
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
        {showBoundary && <BoundaryDivider visible={boundaryVisible} reduced={reduced} header={plusSectionHeader} />}
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

      {/* Plus plan, Multiple mode only — static footnote for whatever's
          beyond the display caps (never rendered on the Free path — its own
          overflow was always silently dropped, unchanged). */}
      {!!moreCount && moreCount > 0 && (
        <p className="w-full max-w-[800px] text-left font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.5)]">
          {moreSettingsTuned(moreCount)}
        </p>
      )}
    </div>
  );
}
