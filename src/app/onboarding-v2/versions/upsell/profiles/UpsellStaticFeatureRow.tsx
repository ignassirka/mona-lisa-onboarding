import { motion, type Variants } from "motion/react";
import worldwideCoverageUrl from "../../../assets/upsell-feature-worldwide-coverage.png";
import speedUrl from "../../../assets/upsell-feature-speed.png";
import multipleDevicesUrl from "../../../assets/upsell-feature-multiple-devices.png";
import netshieldUrl from "../../../assets/upsell-feature-netshield.png";
import { UPSELL_VERSIONS_COPY } from "../../../lib/upsellVersionsCopy";

const FEATURE_ICONS = [worldwideCoverageUrl, speedUrl, multipleDevicesUrl, netshieldUrl] as const;

/** One static Plus feature on `profiles-hero-tabs` — illustration, title,
 * subtitle. No border, fill, or tooltip: the profile hero on the right
 * already carries the visual weight, so these read as a plain list. */
export default function UpsellStaticFeatureRow({
  index,
  variants,
}: {
  index: number;
  variants?: Variants;
}) {
  const feature = UPSELL_VERSIONS_COPY.profilesCombined.staticFeatures[index];
  const icon = FEATURE_ICONS[index];
  if (!feature || !icon) return null;

  return (
    <motion.div variants={variants} className="flex items-center gap-[12px]">
      <img src={icon} alt="" className="size-[48px] shrink-0 object-contain" />
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p
          className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white"
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {feature.title}
        </p>
        <p className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px] text-[rgba(255,255,255,0.65)]">
          {feature.subtitle}
        </p>
      </div>
    </motion.div>
  );
}

export const PROFILES_HERO_TABS_FEATURE_COUNT = UPSELL_VERSIONS_COPY.profilesCombined.staticFeatures.length;
