import { motion, AnimatePresence, type Variants } from "motion/react";
import MaterializingSlot from "../MaterializingSlot";
import PhaseOnePlaceholder from "../PhaseOnePlaceholder";
import BoundaryDivider from "../BoundaryDivider";
import { UnlockedChip } from "../TransformingPaidCell";
import { narrateEnabling, narrateChecking } from "../copy";
import { toneOutcome } from "../../lib/jtbdTuningToneCopy";
import { TUNED_RESULT_TIMING as T, sec } from "../timing";
import type { ToneOfVoice } from "../../lib/toneOfVoice";
import type { RowStage } from "../useTunedMaterialization";
import type { JTBDTuningResult } from "../../lib/jtbdTuningResult";
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

/** Locked-row "unavailable" glyph — a plain filled SVG (not a `lucide-react`
 * icon; its opacity is baked into the fill, not `currentColor`-driven) since
 * no icon in the existing set matched the requested "needs Plus" mark. */
function CircleSlashIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.27309 5.15697C3.16697 6.46365 2.5 8.15394 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5C11.8461 17.5 13.5363 16.833 14.843 15.7269L4.27309 5.15697ZM15.7269 14.843L5.15697 4.27309C6.46365 3.16697 8.15394 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10C17.5 11.8461 16.833 13.5363 15.7269 14.843ZM10 18.75C14.8325 18.75 18.75 14.8325 18.75 10C18.75 5.16751 14.8325 1.25 10 1.25C5.16751 1.25 1.25 5.16751 1.25 10C1.25 14.8325 5.16751 18.75 10 18.75Z"
        fill="white"
        fillOpacity="0.7"
      />
    </svg>
  );
}

interface StackedLayoutProps {
  result: JTBDTuningResult;
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
export default function StackedLayout({ result, paidUnlocked, rowStages, rowMounted, boundaryVisible, reduced, tone, unlockTransition }: StackedLayoutProps) {
  const showBoundary = !paidUnlocked;

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
                {toneOutcome(tone, result.jtbdKey, "enabled", i)}
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

  return (
    <div className="flex w-full max-w-[704px] flex-col items-center gap-[16px]">
      <div className="flex w-full flex-col items-center">{result.enabled.map((_, i) => renderEnabledRow(i))}</div>

      {/* Divider + locked rows share a tighter internal gap than the 16px
          between the free-rows block and this one — otherwise the 16px
          wrapper gap stacks on top of the header row's own padding and the
          first locked row's own top padding, reading as an oversized gap
          under "Available with VPN Plus". */}
      <div className="flex w-full flex-col items-center gap-[2px]">
        {showBoundary && <BoundaryDivider visible={boundaryVisible} reduced={reduced} />}
        <div className="flex w-full flex-col items-center">{result.paid.map((_, i) => renderPaidRow(i))}</div>
      </div>
    </div>
  );
}
