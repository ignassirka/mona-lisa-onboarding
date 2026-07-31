import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence, type Variants } from "motion/react";
import type { PaidFeature } from "../lib/jtbdTuningResult";
import { TUNED_RESULT_TIMING as T, sec } from "./timing";
import vpnPlusBadgeUrl from "../assets/vpn-plus-badge.svg";
import checkmarkUrl from "../assets/checkmark-circle-filled.svg";
import infoCircleUrl from "../assets/info-circle.svg";

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function InfoTooltip({ content }: { content?: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="flex size-[16px] shrink-0 items-center justify-center opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <img src={infoCircleUrl} alt="" className="size-[16px]" />
        </button>
      </Tooltip.Trigger>
      {content ? (
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-[1300] max-w-[280px] rounded-[6px] bg-[#0a0a0f] px-[10px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.9)] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            {content}
            <Tooltip.Arrow className="fill-[#0a0a0f]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      ) : null}
    </Tooltip.Root>
  );
}

interface TransformingPaidCellProps {
  feature: PaidFeature;
  /** The live, animated unlock state — starts `false` (locked visual) and
   * flips to `true` partway through stage 3's entrance (see
   * `useUnlockTransition`), unlike stage 2's `paidUnlocked`, which is a
   * static final value chosen once at mount. */
  unlocked: boolean;
  /** Index among the 2 Plus items — staggers each one's transform start,
   * same as the original `TransformingPaidRow`. */
  index: number;
  showChip: boolean;
  /** Which of the 3 tuned-result layouts' own resolved shape to match —
   * `EnabledFeatureRow`/`PaidFeatureRow`'s existing `"row"`/`"stacked"`/
   * `"card"` modes. Stacked's own layout uses a bespoke merged-pill shape
   * (not one of these 3), so it gets its own sibling component instead —
   * see `StackedLayout.tsx`. */
  layout: "row" | "stacked" | "card";
}

/** "Just unlocked" chip — identical across all 3 variants, just repositioned
 * to each shape's own top corner. Exported for `StackedLayout`'s own
 * transform (its resolved shape is bespoke — see that file — but reuses
 * this exact chip). */
export function UnlockedChip({ show, stagger, className }: { show: boolean; stagger: number; className: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          key="chip"
          className={`absolute rounded-[8px] bg-[rgba(44,255,204,0.15)] px-[6px] py-[1px] font-['Segoe_UI_Variable',sans-serif] text-[11px] font-semibold leading-[16px] text-[#2cffcc] ${className}`}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: stagger + 0.2 }}
        >
          Just unlocked
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** The reused locked→unlocked transition for a stage-3 ("VPN Plus Welcome")
 * Plus item — generalized from the original `PlusWelcomeState`'s bespoke
 * `TransformingPaidRow` (row shape only) into all 3 `EnabledFeatureRow`/
 * `PaidFeatureRow` container shapes, so every tuned-result layout that
 * reuses one of those shapes for its resolved Plus rows/tiles/cards can
 * reuse this same choreography — badge↔check crossfade, dim→full color/
 * opacity, a "Just unlocked" chip, and (row shape only, since `stacked`/
 * `card` never show a value pill for paid features even in their own
 * already-established resolved design — nothing to fabricate here, this
 * naturally follows what already exists) the "Available" pill flying in.
 * Same durations/delays/stagger as the original, just parameterized by
 * shape. The outer container's own border/shadow styling is left static
 * per each shape's existing convention (`stacked`/`card` never varied it by
 * lock state; only the original row-shape transition dropped it on unlock,
 * which is preserved here for the `"row"` variant specifically, matching
 * "reuse the existing transition" rather than a new design decision). */
export default function TransformingPaidCell({ feature, unlocked, index, showChip, layout }: TransformingPaidCellProps) {
  const stagger = index * sec(T.unlockTransformStagger);
  const outcomeColor = unlocked ? "text-white" : "text-[rgba(255,255,255,0.5)]";
  const featureNameColor = unlocked ? "text-white" : "text-[rgba(255,255,255,0.5)]";

  if (layout === "row") {
    return (
      <motion.div
        variants={rowVariants}
        className="relative flex w-full max-w-[800px] items-start gap-[16px] rounded-[8px] px-[16px] py-[12px]"
        animate={
          unlocked
            ? { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)", boxShadow: "none" }
            : { backgroundColor: "rgba(0,0,0,0)", borderColor: "rgba(255,255,255,0.1)", boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.25)" }
        }
        style={{ border: "1px solid" }}
        transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
      >
        <UnlockedChip show={unlocked && showChip} stagger={stagger} className="-top-[9px] left-[12px]" />

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
            className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px]"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
            transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
          >
            {feature.outcome}
          </motion.span>
        </div>

        <div className="flex h-[32px] shrink-0 items-center gap-[8px]">
          <div className="flex items-center justify-center gap-[8px]">
            <motion.img
              src={feature.asset}
              alt=""
              className="size-[30px] shrink-0 object-contain"
              animate={{ opacity: unlocked ? 1 : 0.5 }}
              transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
            />
            <motion.span
              className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px]"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
              animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
              transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
            >
              {feature.featureName}
            </motion.span>
          </div>

          <AnimatePresence>
            {unlocked && (
              <motion.span
                key="pill"
                className="flex items-end justify-center whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white"
                style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: stagger + 0.15 }}
              >
                Available
              </motion.span>
            )}
          </AnimatePresence>

          <InfoTooltip content={feature.tooltip} />
        </div>
      </motion.div>
    );
  }

  if (layout === "stacked") {
    // Matches `PaidFeatureRow`'s own `layout="stacked"` container exactly
    // (border/shadow always present, unaffected by lock state in that
    // mode's own existing design) — only the content transforms.
    return (
      <div className="relative flex w-full flex-col gap-[6px] rounded-[8px] border border-[rgba(255,255,255,0.1)] px-[14px] py-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <UnlockedChip show={unlocked && showChip} stagger={stagger} className="-top-[8px] left-[10px]" />
        <div className="absolute right-[10px] top-[10px]">
          <InfoTooltip content={feature.tooltip} />
        </div>

        <div className="flex items-start gap-[8px] pr-[22px]">
          <div className="relative size-[18px] shrink-0">
            <AnimatePresence mode="wait" initial={false}>
              {unlocked ? (
                <motion.img
                  key="check"
                  src={checkmarkUrl}
                  alt=""
                  className="absolute inset-0 size-[18px]"
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
                  className="absolute top-0 h-[18px] w-[30px]"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: stagger }}
                />
              )}
            </AnimatePresence>
          </div>
          <motion.span
            className={`min-w-0 font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] ${outcomeColor}`}
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
            transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
          >
            {feature.outcome}
          </motion.span>
        </div>
        <div className="flex items-center gap-[8px] pl-[26px]">
          <motion.img
            src={feature.asset}
            alt=""
            className="size-[22px] shrink-0 object-contain"
            animate={{ opacity: unlocked ? 1 : 0.5 }}
            transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
          />
          <motion.span
            className={`whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] ${featureNameColor}`}
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
            transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
          >
            {feature.featureName}
          </motion.span>
        </div>
      </div>
    );
  }

  // layout === "card" — matches `PaidFeatureRow`'s own `layout="card"`
  // container exactly (border/shadow static); only content transforms.
  return (
    <div className="relative flex h-full flex-col rounded-[12px] border border-[rgba(255,255,255,0.1)] p-[14px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <UnlockedChip show={unlocked && showChip} stagger={stagger} className="-top-[8px] left-[10px]" />

      <div className="flex items-start justify-between gap-[8px]">
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
        <InfoTooltip content={feature.tooltip} />
      </div>
      <motion.p
        className="mt-[10px] line-clamp-3 flex-1 font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px]"
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
        transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
      >
        {feature.outcome}
      </motion.p>
      <div className="mt-[10px] flex items-center gap-[8px]">
        <motion.img
          src={feature.asset}
          alt=""
          className="size-[24px] shrink-0 object-contain"
          animate={{ opacity: unlocked ? 1 : 0.5 }}
          transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
        />
        <motion.span
          className="min-w-0 flex-1 truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px]"
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          animate={{ color: unlocked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }}
          transition={{ duration: 0.5, ease: "easeInOut", delay: stagger }}
        >
          {feature.featureName}
        </motion.span>
      </div>
    </div>
  );
}
