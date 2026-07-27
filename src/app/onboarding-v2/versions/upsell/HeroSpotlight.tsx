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
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import heroUrl from "../../assets/upsell-hero.jpg";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import type { UpsellVersionProps } from "./types";

export const HERO_SPOTLIGHT_VERSION = "hero-spotlight";

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

/** Alternative upsell #5 — "Single hero-benefit spotlight". Unlike every
 * other layout (which give 2-3 benefits equal billing), this leads with
 * ONE dominant benefit — the highest-ranked feature for the user's
 * selection — as a large hero (reusing the existing 3D hero art + that
 * feature's own icon), MyFitnessPal/Duolingo-MAX/Cleo style. The required
 * "Based on your ___ pick" sentence still appears verbatim, just as a
 * smaller supporting caption rather than the dominant headline. */
export default function HeroSpotlight({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, benefits, everythingElse } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const [topBenefit, ...restBenefits] = benefits;
  const reduced = useReducedMotion();

  useTrackUpsellView(HERO_SPOTLIGHT_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[48px]">
      <UpsellBackButton version={HERO_SPOTLIGHT_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[440px] flex-col gap-[14px]"
        >
          <UpsellSubtitle
            subtitle={subtitle}
            className="text-center font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px] text-[rgba(255,255,255,0.55)]"
            boldClassName="font-semibold text-[rgba(255,255,255,0.8)]"
          />

          <motion.div variants={itemVariants} className="relative h-[160px] w-full overflow-hidden rounded-[14px]">
            <img src={heroUrl} alt="Proton VPN Plus" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            {topBenefit && (
              <img
                src={topBenefit.icon}
                alt=""
                className="absolute bottom-[10px] left-[10px] size-[36px] rounded-[8px] bg-[rgba(22,20,28,0.75)] p-[6px] object-contain"
              />
            )}
          </motion.div>

          {topBenefit && (
            <motion.div variants={itemVariants} className="flex flex-col gap-[3px] text-center">
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[#b09fff]">
                {UPSELL_VERSIONS_COPY.heroSpotlight.eyebrow}
              </span>
              <div className="flex items-center justify-center gap-[6px]">
                <h1
                  className="font-['Segoe_UI_Variable',sans-serif] text-[22px] font-semibold leading-[27px] text-white"
                  style={{ fontVariationSettings: "'opsz' 20" }}
                >
                  {topBenefit.outcome}
                </h1>
                <InfoTooltip content={topBenefit.tooltip} />
              </div>
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px] text-[rgba(255,255,255,0.6)]">
                via {topBenefit.featureName}
              </span>
            </motion.div>
          )}

          {isStreaming && <StreamingLogos variants={itemVariants} className="justify-center" />}

          {restBenefits.length > 0 && (
            <motion.div variants={itemVariants} className="flex flex-col gap-[8px] border-t border-[rgba(255,255,255,0.1)] pt-[12px]">
              <p className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
                {UPSELL_VERSIONS_COPY.heroSpotlight.restHeading}
              </p>
              {restBenefits.map((benefit, i) => (
                <div key={`rest-${i}`} className="flex items-center gap-[8px]">
                  <img src={checkmarkUrl} alt="" className="size-[16px] shrink-0" />
                  <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px] text-[rgba(255,255,255,0.85)]">{benefit.outcome}</span>
                </div>
              ))}
            </motion.div>
          )}

          <motion.p
            variants={itemVariants}
            className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {everythingElse}
          </motion.p>

          <UpsellCtaBlock
            version={HERO_SPOTLIGHT_VERSION}
            jtbdKey={jtbdKey}
            selectionMode={selectionMode}
            selectionCount={selectionCount}
            onUpgrade={onUpgrade}
            onContinueFree={onContinueFree}
            variants={itemVariants}
          />
        </motion.div>
      </Tooltip.Provider>
    </div>
  );
}
