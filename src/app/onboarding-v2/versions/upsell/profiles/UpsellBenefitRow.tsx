import { motion, type Variants } from "motion/react";
import InfoTooltip from "../lib/InfoTooltip";
import checkmarkUrl from "../../../assets/checkmark-circle-filled.svg";
import sparkleUrl from "../../../assets/upsell-sparkle.svg";
import type { UpsellBenefitView } from "../useUpsellContent";

/** One ranked Plus feature, in the two registers the profile layouts need.
 *
 * `"card"` is the default upsell's own benefit card, unchanged in substance —
 * bordered, the feature's own icon, the outcome in semibold, and (unless
 * `showFeatureName={false}`) the `via {featureName}` subline. Used by the
 * layouts where the features still carry the screen.
 *
 * `showFeatureName={false}` drops that subline entirely — no relocation into
 * the tooltip, unlike `"line"` below — for the fanned-deck layout, where the
 * feature name is a mechanism-level detail competing with the profile deck
 * for the same "this is personal, not generic" claim; the outcome sentence
 * alone already carries that.
 *
 * `"line"` is a single checked line with no border and no `via` subline. It
 * exists for one reason: on the layouts that lead with the profile cards, the
 * cards already spend a lot of visual weight saying "personalized", and three
 * bordered cards underneath them turn one screen into two competing lists. The
 * feature name moves into the tooltip rather than being dropped, so nothing
 * factual is lost — only the box. */
export default function UpsellBenefitRow({
  benefit,
  variant = "card",
  showFeatureName = true,
  iconSize = 16,
  bordered = true,
  useSparkleIcon = false,
  variants,
}: {
  benefit: UpsellBenefitView;
  variant?: "card" | "line";
  /** `"card"` only — `"line"` always keeps the feature name (as trailing
   * text, with no "via"), since it has nowhere else to put it. */
  showFeatureName?: boolean;
  /** `"card"` only — the feature's own icon, in px. Default 16 matches the
   * default upsell's own `BenefitCard`. */
  iconSize?: number;
  /** `"card"` only — drops the border, fill and padding, leaving just the
   * icon/outcome/tooltip flush against the page. `profiles-fan` uses this: it
   * already has the deck on the right carrying visual weight, the 3D mark and
   * a headline above these rows — three bordered boxes stacked under all of
   * that read as a fourth competing block rather than a supporting list. */
  bordered?: boolean;
  /** `"card"` only — uses the shared `upsell-sparkle.svg` for every row,
   * byte-for-byte what `VPNPlusUpsell`'s own `BenefitCard` already does,
   * instead of each feature's own decorative asset. `profiles-fan` uses this:
   * the per-feature icons read as a second icon language next to the profile
   * deck's JTBD badges on the right, and the sparkle keeps the list visually
   * unified as "things Plus unlocks" rather than six different products. */
  useSparkleIcon?: boolean;
  variants?: Variants;
}) {
  if (variant === "line") {
    return (
      <motion.div variants={variants} className="flex items-center gap-[8px]">
        <img src={checkmarkUrl} alt="" className="size-[16px] shrink-0" />
        <span
          className="min-w-0 flex-1 font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.85)]"
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {benefit.outcome}
        </span>
        <span className="shrink-0 font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.45)]">
          {benefit.featureName}
        </span>
        <InfoTooltip content={benefit.tooltip} />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={variants}
      className={`flex items-start gap-[10px] ${
        bordered ? "rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-[14px] py-[10px]" : ""
      }`}
    >
      <img
        src={useSparkleIcon ? sparkleUrl : benefit.icon}
        alt=""
        className="mt-[1px] shrink-0 object-contain"
        style={{ width: iconSize, height: iconSize }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex items-start justify-between gap-[12px]">
          <p
            className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {benefit.outcome}
          </p>
          <InfoTooltip content={benefit.tooltip} />
        </div>
        {showFeatureName && (
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px]">
            <span className="text-[rgba(255,255,255,0.5)]">via </span>
            <span className="text-[rgba(255,255,255,0.8)]">{benefit.featureName}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
