import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useUpsellProfiles } from "./profiles/useUpsellProfiles";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellSubtitle from "./lib/UpsellSubtitle";
import UpsellTrustRow from "./lib/UpsellTrustRow";
import StreamingLogos from "./lib/StreamingLogos";
import UpsellBenefitRow from "./profiles/UpsellBenefitRow";
import UpsellProfileAvatars from "./profiles/UpsellProfileAvatars";
import UpsellHeroMark from "./profiles/UpsellHeroMark";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const FEATURES_LED_INLINE_VERSION = "features-led-inline";

const C = UPSELL_VERSIONS_COPY.featuresLed;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: UPSELL_VERSION_TIMING.staggerChildren,
      delayChildren: UPSELL_VERSION_TIMING.delayChildren,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: UPSELL_VERSION_TIMING.itemDuration, ease: [0.22, 1, 0.36, 1] } },
};

/** Features-led #3 — "Inline profile row".
 *
 * The furthest demotion of the three, and the one that treats the profiles as
 * a *line item in the offer* rather than as a panel of the screen. One narrow
 * centred column — headline, the personalization sentence, the ranked
 * features as full bordered cards, Proton's three real trust facts, the
 * everything-else line, the CTA pair — and the profiles collapsed into a
 * single row directly above the CTA: a stack of overlapping 36px artwork
 * crops (`UpsellProfileAvatars`), their real count, and one line saying what
 * they are.
 *
 * **What this buys:** the profiles stop being a place the eye has to go and
 * become the last thing read before the button, in the same register as
 * everything else being offered — the position a bundled extra actually
 * occupies in a purchase decision. It's also the only one of the three that
 * survives a narrow window unchanged: there's no panel to hide below 900px,
 * because there's no panel.
 *
 * **What it costs, stated plainly:** at 36px the artwork can't carry a name,
 * so the names move to an `sr-only` list and the row leans on the caption for
 * its claim. The profiles are no longer *shown* in any real sense — they're
 * *referenced*. Someone who hasn't just come from the tuning screen (which
 * every user of this flow has, one step earlier) would learn less about them
 * here than on either sibling layout — and the row can't be hovered for more,
 * since spreading the overlapped faces would slide the caption beside them
 * (see `UpsellProfileAvatars`). What this layout gives up in disclosure it
 * buys back in the CTA being the only thing below the profiles.
 *
 * The violet-tinted panel around it is the same treatment `ValueStack` gives
 * its price block — the codebase's existing way of marking one row in a
 * column as "this is part of the deal", rather than a new accent invented
 * here. */
export default function FeaturesLedInline({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, benefits, everythingElse, trustSignals } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const { profiles } = useUpsellProfiles(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(FEATURES_LED_INLINE_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[24px]">
      <UpsellBackButton version={FEATURES_LED_INLINE_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[470px] flex-col gap-[14px]"
        >
          <UpsellHeroMark width={104} variants={itemVariants} className="self-center" />

          <motion.div variants={itemVariants} className="flex flex-col gap-[5px] text-center">
            <h1
              className="text-balance font-['Segoe_UI_Variable',sans-serif] text-[26px] font-semibold leading-[32px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              {UPSELL_VERSIONS_COPY.headline}
            </h1>
            <UpsellSubtitle
              subtitle={subtitle}
              className="text-pretty font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]"
            />
          </motion.div>

          {isStreaming && <StreamingLogos variants={itemVariants} className="justify-center" />}

          <div className="flex flex-col gap-[10px]">
            {benefits.map((benefit, i) => (
              <UpsellBenefitRow key={`benefit-${i}`} benefit={benefit} iconSize={18} variants={itemVariants} />
            ))}
          </div>

          <UpsellTrustRow signals={trustSignals} variants={itemVariants} className="justify-center" />

          <motion.p
            variants={itemVariants}
            className="text-pretty font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {everythingElse}
          </motion.p>

          {/* The profiles, as one line of the offer */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-[12px] rounded-[10px] border border-[rgba(147,116,255,0.3)] bg-[rgba(109,74,255,0.08)] px-[12px] py-[10px]"
          >
            <UpsellProfileAvatars profiles={profiles} reduced={reduced} />
            <div className="flex min-w-0 flex-col">
              <span
                className="font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[17px] text-white"
                style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
              >
                {C.profilesInline(profiles.length)}
              </span>
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.58)]">
                {C.profilesInlineNote}
              </span>
            </div>
          </motion.div>

          <UpsellCtaBlock
            version={FEATURES_LED_INLINE_VERSION}
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
