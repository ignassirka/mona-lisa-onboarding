import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import type { PaidFeature } from "../lib/jtbdTuningResult";
import type { FeatureRowLayout } from "./EnabledFeatureRow";
import vpnPlusBadgeUrl from "../assets/vpn-plus-badge.svg";
import checkmarkUrl from "../assets/checkmark-circle-filled.svg";
import infoCircleUrl from "../assets/info-circle.svg";

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const markVariants: Variants = {
  hidden: { scale: 0 },
  show: { scale: 1, transition: { delay: 0.2, type: "spring", stiffness: 500, damping: 14 } },
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

interface PaidFeatureRowProps {
  feature: PaidFeature;
  /** Plus users own these features, so the row reads as enabled rather than an upsell. */
  unlocked?: boolean;
  /** Container arrangement, backward-compatible: `"row"` (default) is the
   * original full-width horizontal row, pixel-for-pixel unchanged. See
   * `EnabledFeatureRow`'s `FeatureRowLayout` doc for `"stacked"` / `"card"`. */
  layout?: FeatureRowLayout;
}

export default function PaidFeatureRow({ feature, unlocked = false, layout = "row" }: PaidFeatureRowProps) {
  const outcomeColor = unlocked ? "text-white" : "text-[rgba(255,255,255,0.5)]";
  const featureNameColor = unlocked ? "text-white" : "text-[rgba(255,255,255,0.5)]";

  if (layout === "row") {
    return (
      <motion.div
        variants={rowVariants}
        className="flex w-full max-w-[800px] items-center gap-[16px] rounded-[8px] border border-[rgba(255,255,255,0.1)] px-[16px] py-[12px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-[8px]">
          {unlocked ? (
            <motion.img variants={markVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
          ) : (
            <img src={vpnPlusBadgeUrl} alt="Proton VPN Plus" className="h-[20px] w-[33px] shrink-0" />
          )}
          <span
            className={`font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] ${outcomeColor}`}
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {feature.outcome}
          </span>
        </div>
        <div className="flex h-[32px] shrink-0 items-center gap-[8px]">
          <div className="flex items-center justify-center gap-[8px]">
            <img
              src={feature.asset}
              alt=""
              className={`size-[30px] shrink-0 object-contain ${unlocked ? "" : "opacity-50"}`}
            />
            <span
              className={`whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] ${featureNameColor}`}
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {feature.featureName}
            </span>
          </div>
          <InfoTooltip content={feature.tooltip} />
        </div>
      </motion.div>
    );
  }

  if (layout === "stacked") {
    // No own entrance `variants` — the ancestor column wrapper owns the
    // directional slide-in; the checkmark/badge below inherits the ambient
    // "hidden"/"show" label via Framer's variant propagation when unlocked.
    return (
      <div
        className="relative flex w-full flex-col gap-[6px] rounded-[8px] border border-[rgba(255,255,255,0.1)] px-[14px] py-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
      >
        <div className="absolute right-[10px] top-[10px]">
          <InfoTooltip content={feature.tooltip} />
        </div>
        <div className="flex items-center gap-[8px] pr-[22px]">
          {unlocked ? (
            <motion.img variants={markVariants} src={checkmarkUrl} alt="" className="size-[18px] shrink-0" />
          ) : (
            <img src={vpnPlusBadgeUrl} alt="Proton VPN Plus" className="h-[18px] w-[30px] shrink-0" />
          )}
          <span
            className={`min-w-0 font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] ${outcomeColor}`}
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {feature.outcome}
          </span>
        </div>
        <div className="flex items-center gap-[8px] pl-[26px]">
          <img
            src={feature.asset}
            alt=""
            className={`size-[22px] shrink-0 object-contain ${unlocked ? "" : "opacity-50"}`}
          />
          <span
            className={`whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] ${featureNameColor}`}
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {feature.featureName}
          </span>
        </div>
      </div>
    );
  }

  // layout === "card" — vertical card face; entrance owned by the ancestor
  // (Card Grid's reading-order stagger), same propagation approach as "stacked".
  return (
    <div className="relative flex h-full flex-col rounded-[12px] border border-[rgba(255,255,255,0.1)] p-[14px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between gap-[8px]">
        {unlocked ? (
          <motion.img variants={markVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
        ) : (
          <img src={vpnPlusBadgeUrl} alt="Proton VPN Plus" className="h-[20px] w-[33px] shrink-0" />
        )}
        <InfoTooltip content={feature.tooltip} />
      </div>
      <p
        className={`mt-[10px] line-clamp-3 flex-1 font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] ${outcomeColor}`}
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {feature.outcome}
      </p>
      <div className="mt-[10px] flex items-center gap-[8px]">
        <img
          src={feature.asset}
          alt=""
          className={`size-[24px] shrink-0 object-contain ${unlocked ? "" : "opacity-50"}`}
        />
        <span
          className={`min-w-0 flex-1 truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] ${featureNameColor}`}
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {feature.featureName}
        </span>
      </div>
    </div>
  );
}
