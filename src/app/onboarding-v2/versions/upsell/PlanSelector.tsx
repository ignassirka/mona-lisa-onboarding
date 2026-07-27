import { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import { Check } from "lucide-react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellSubtitle from "./lib/UpsellSubtitle";
import StreamingLogos from "./lib/StreamingLogos";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import type { UpsellVersionProps } from "./types";

export const PLAN_SELECTOR_VERSION = "plan-selector";

type Plan = "annual" | "monthly";

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

/** Alternative upsell #4 — "Plan-selector toggle". Foregrounds the pricing
 * decision itself (Public / Bevel / ChatGPT style annual-vs-monthly price
 * cards) above a compact intent-driven benefit list. Selecting a card is
 * cosmetic only — both always route through the SAME "Get VPN Plus" CTA to
 * the existing checkout flow (checkout amounts are out of scope and
 * unchanged); this only decides which of the two REAL, existing prices is
 * shown highlighted. */
export default function PlanSelector({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, benefits, pricing } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const [plan, setPlan] = useState<Plan>("annual");
  const reduced = useReducedMotion();

  useTrackUpsellView(PLAN_SELECTOR_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[48px]">
      <UpsellBackButton version={PLAN_SELECTOR_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

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

          <motion.div variants={itemVariants} className="flex flex-col gap-[8px]">
            <button
              type="button"
              onClick={() => setPlan("annual")}
              aria-pressed={plan === "annual"}
              className={`flex items-center justify-between rounded-[10px] border px-[16px] py-[12px] text-left transition-colors duration-150 ${
                plan === "annual" ? "border-[#6d4aff] bg-[rgba(109,74,255,0.1)]" : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)]"
              }`}
            >
              <div className="flex items-center gap-[10px]">
                <span
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border ${
                    plan === "annual" ? "border-[#6d4aff] bg-[#6d4aff]" : "border-[rgba(255,255,255,0.3)]"
                  }`}
                >
                  {plan === "annual" && <Check size={11} strokeWidth={3} className="text-white" />}
                </span>
                <div className="flex flex-col">
                  <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white">
                    {UPSELL_VERSIONS_COPY.planSelector.annualLabel}
                  </span>
                  <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.6)]">
                    {pricing.yearlyMonthlyPrice}/mo · {UPSELL_VERSIONS_COPY.planSelector.annualNote}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#6d4aff] px-[8px] py-[3px] font-['Segoe_UI_Variable',sans-serif] text-[11px] font-semibold text-white">
                {UPSELL_VERSIONS_COPY.planSelector.bestValueBadge} · save {pricing.savingsPercent}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPlan("monthly")}
              aria-pressed={plan === "monthly"}
              className={`flex items-center justify-between rounded-[10px] border px-[16px] py-[12px] text-left transition-colors duration-150 ${
                plan === "monthly" ? "border-[#6d4aff] bg-[rgba(109,74,255,0.1)]" : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)]"
              }`}
            >
              <div className="flex items-center gap-[10px]">
                <span
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border ${
                    plan === "monthly" ? "border-[#6d4aff] bg-[#6d4aff]" : "border-[rgba(255,255,255,0.3)]"
                  }`}
                >
                  {plan === "monthly" && <Check size={11} strokeWidth={3} className="text-white" />}
                </span>
                <div className="flex flex-col">
                  <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white">
                    {UPSELL_VERSIONS_COPY.planSelector.monthlyLabel}
                  </span>
                  <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.6)]">
                    {pricing.anchorMonthlyPrice}/mo
                  </span>
                </div>
              </div>
            </button>
            <p className="font-['Segoe_UI_Variable',sans-serif] text-[11px] leading-[15px] text-[rgba(255,255,255,0.4)]">{pricing.guaranteeTerms}</p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-[8px] border-t border-[rgba(255,255,255,0.1)] pt-[14px]">
            <p className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
              {UPSELL_VERSIONS_COPY.planSelector.includedHeading}
            </p>
            {benefits.map((benefit, i) => (
              <div key={`benefit-${i}`} className="flex items-center gap-[8px]">
                <img src={checkmarkUrl} alt="" className="size-[16px] shrink-0" />
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px] text-[rgba(255,255,255,0.85)]">{benefit.outcome}</span>
              </div>
            ))}
          </motion.div>

          <UpsellCtaBlock
            version={PLAN_SELECTOR_VERSION}
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
