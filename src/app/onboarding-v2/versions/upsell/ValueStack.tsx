import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellSubtitle from "./lib/UpsellSubtitle";
import InfoTooltip from "./lib/InfoTooltip";
import StreamingLogos from "./lib/StreamingLogos";
import { USP_ICONS } from "./lib/UpsellTrustRow";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import type { UpsellVersionProps } from "./types";

export const VALUE_STACK_VERSION = "value-stack";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: UPSELL_VERSION_TIMING.staggerChildren, delayChildren: UPSELL_VERSION_TIMING.delayChildren },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: UPSELL_VERSION_TIMING.itemDuration, ease: [0.22, 1, 0.36, 1] } },
};

/** Alternative upsell #2 — "Value-stack checklist". One centered column: a
 * flowing checklist of every ranked intent benefit, followed by Proton's
 * own real trust facts (open-source, Swiss-based, no-logs — never
 * fabricated stats), then a single price block foregrounding the
 * per-day framing. The Reddit Premium / ChatGPT / Givingli style
 * single-list paywall. */
export default function ValueStack({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, benefits, everythingElse, trustSignals, pricing } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(VALUE_STACK_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[48px]">
      <UpsellBackButton version={VALUE_STACK_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[460px] flex-col gap-[16px]"
        >
          <motion.div variants={itemVariants} className="flex flex-col gap-[5px] text-center">
            <h1
              className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              {UPSELL_VERSIONS_COPY.headline}
            </h1>
            <UpsellSubtitle subtitle={subtitle} className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]" />
          </motion.div>

          {isStreaming && <StreamingLogos variants={itemVariants} className="justify-center" />}

          <motion.p
            variants={itemVariants}
            className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]"
          >
            {UPSELL_VERSIONS_COPY.valueStack.includedHeading}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col gap-[10px]">
            {benefits.map((benefit, i) => (
              <div key={`benefit-${i}`} className="flex items-start gap-[10px]">
                <img src={checkmarkUrl} alt="" className="mt-[2px] size-[18px] shrink-0" />
                <div className="flex min-w-0 flex-1 items-start justify-between gap-[8px]">
                  <div className="flex min-w-0 flex-col gap-[1px]">
                    <span
                      className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white"
                      style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                    >
                      {benefit.outcome}
                    </span>
                    <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px]">
                      <span className="text-[rgba(255,255,255,0.5)]">via </span>
                      <span className="text-[rgba(255,255,255,0.8)]">{benefit.featureName}</span>
                    </span>
                  </div>
                  <InfoTooltip content={benefit.tooltip} />
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="border-t border-[rgba(255,255,255,0.1)] pt-[14px]">
            <p className="mb-[10px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
              {UPSELL_VERSIONS_COPY.valueStack.trustHeading}
            </p>
            <div className="flex flex-col gap-[8px]">
              {trustSignals.map((signal) => (
                <div key={signal.asset} className="flex items-center gap-[10px]">
                  <img src={USP_ICONS[signal.asset]} alt="" className="size-[18px] shrink-0" />
                  <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px] text-[rgba(255,255,255,0.8)]">{signal.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {everythingElse}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between rounded-[10px] border border-[rgba(109,74,255,0.35)] bg-[rgba(109,74,255,0.08)] px-[16px] py-[12px]"
          >
            <div className="flex flex-col">
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[20px] font-semibold leading-[24px] text-white">{pricing.perDay}/day</span>
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.6)]">
                {pricing.yearlyMonthlyPrice}/mo, {pricing.billingNote} · save {pricing.savingsPercent}
              </span>
            </div>
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]">{pricing.guaranteeTerms}</span>
          </motion.div>

          <UpsellCtaBlock
            version={VALUE_STACK_VERSION}
            jtbdKey={jtbdKey}
            selectionMode={selectionMode}
            selectionCount={selectionCount}
            onUpgrade={onUpgrade}
            onContinueFree={onContinueFree}
            showPricingSubline={false}
            variants={itemVariants}
          />
        </motion.div>
      </Tooltip.Provider>
    </div>
  );
}
