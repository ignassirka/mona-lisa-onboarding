import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import type { EnabledFeature } from "../lib/jtbdTuningResult";
import checkmarkUrl from "../assets/checkmark-circle-filled.svg";
import infoCircleUrl from "../assets/info-circle.svg";

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Green checkmark scale-pop (0 → overshoot → 1) once the row has settled,
// reinforcing "this setting was just applied".
const checkVariants: Variants = {
  hidden: { scale: 0 },
  show: { scale: 1, transition: { delay: 0.2, type: "spring", stiffness: 500, damping: 14 } },
};

/** (i) info icon wired to a Radix tooltip. Content is pending from the content team. */
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

export type FeatureRowLayout = "row" | "stacked" | "card";

interface EnabledFeatureRowProps {
  feature: EnabledFeature;
  /** Container arrangement, backward-compatible: `"row"` (default) is the
   * original full-width horizontal row, pixel-for-pixel unchanged. `"stacked"`
   * is a narrower column adaptation (outcome on top, meta below, info icon in
   * the top-right corner) used by "Split by Status". `"card"` is a vertical
   * card face (glyph top-left, info top-right, clamped outcome, meta bottom)
   * used by "Card Grid". Existing call sites omit this prop and are untouched. */
  layout?: FeatureRowLayout;
}

export default function EnabledFeatureRow({ feature, layout = "row" }: EnabledFeatureRowProps) {
  if (layout === "row") {
    return (
      <motion.div
        variants={rowVariants}
        className="flex w-full max-w-[800px] items-center gap-[16px] rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[16px] py-[12px]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-[8px]">
          <motion.img variants={checkVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
          <span
            className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {feature.outcome}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <span
            className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.7)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {feature.settingsName}
          </span>
          <div className="flex items-center gap-[8px]">
            <span
              className="flex items-end justify-center whitespace-nowrap rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {feature.value}
            </span>
            <InfoTooltip content={feature.tooltip} />
          </div>
        </div>
      </motion.div>
    );
  }

  if (layout === "stacked") {
    // No own entrance `variants` — the ancestor column wrapper (in the
    // consuming version) owns the directional slide-in; the checkmark below
    // still inherits the ambient "hidden"/"show" label via Framer's variant
    // propagation, so its pop timing matches the row layout exactly.
    return (
      <div className="relative flex w-full flex-col gap-[6px] rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[14px] py-[10px]">
        <div className="absolute right-[10px] top-[10px]">
          <InfoTooltip content={feature.tooltip} />
        </div>
        <div className="flex items-center gap-[8px] pr-[22px]">
          <motion.img variants={checkVariants} src={checkmarkUrl} alt="" className="size-[18px] shrink-0" />
          <span
            className="min-w-0 font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-white"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {feature.outcome}
          </span>
        </div>
        <div className="flex items-center gap-[8px] pl-[26px]">
          <span
            className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.7)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {feature.settingsName}
          </span>
          <span
            className="flex items-end justify-center whitespace-nowrap rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[10px] pb-[5px] pt-[3px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-white"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {feature.value}
          </span>
        </div>
      </div>
    );
  }

  // layout === "card" — vertical card face; entrance owned by the ancestor
  // (Card Grid's reading-order stagger), same propagation approach as "stacked".
  return (
    <div className="relative flex h-full flex-col rounded-[12px] bg-[rgba(255,255,255,0.05)] p-[14px]">
      <div className="flex items-start justify-between gap-[8px]">
        <motion.img variants={checkVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
        <InfoTooltip content={feature.tooltip} />
      </div>
      <p
        className="mt-[10px] line-clamp-3 flex-1 font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-white"
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {feature.outcome}
      </p>
      <div className="mt-[10px] flex items-center gap-[8px]">
        <span
          className="min-w-0 flex-1 truncate font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.7)]"
          style={{ fontFeatureSettings: '"rclt" 0' }}
        >
          {feature.settingsName}
        </span>
        <span
          className="flex shrink-0 items-end justify-center whitespace-nowrap rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[10px] pb-[5px] pt-[3px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-white"
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {feature.value}
        </span>
      </div>
    </div>
  );
}
