import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useUpsellProfiles } from "./profiles/useUpsellProfiles";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import StreamingLogos from "./lib/StreamingLogos";
import UpsellProfileCard, { UPSELL_CARD_W, UPSELL_CARD_TALL_H } from "./profiles/UpsellProfileCard";
import UpsellBenefitRow from "./profiles/UpsellBenefitRow";
import UpsellHeroMark from "./profiles/UpsellHeroMark";
import AutoplayCarousel from "./profiles/AutoplayCarousel";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const PROFILES_FAN_VERSION = "profiles-fan";

const C = UPSELL_VERSIONS_COPY.profilesCombined;

/** Reuses `UPSELL_CARD_TALL_H` (400) — the same height `profiles-hero-tabs`
 * gives its single dominant card — rather than a third bespoke number.
 * Started at 260, then 320; both read as too short once seen rendered next to
 * the left column's now-taller, unbordered benefit list. This deck is the
 * entire right panel rather than one element sharing it, so there's no other
 * layout to stay proportionate to. */
const CARD_H = UPSELL_CARD_TALL_H;

const leftVariants: Variants = {
  hidden: { opacity: 0, x: -48 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: UPSELL_VERSION_TIMING.staggerChildren,
      delayChildren: UPSELL_VERSION_TIMING.delayChildren,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -18 },
  show: { opacity: 1, x: 0, transition: { duration: UPSELL_VERSION_TIMING.itemDuration, ease: [0.22, 1, 0.36, 1] } },
};

/** Combined upsell — "Fanned deck".
 *
 * The left column keeps the default screen's shape — headline, three benefit
 * rows, the "everything else" line, the CTA pair — with departures made after
 * seeing earlier revisions rendered:
 *
 * - **No subtitle.** With the deck on the right doing the personalization
 *   work, repeating "based on your picks" in text on the left stated the same
 *   thing the cards already show.
 * - **No `via {featureName}` subline** (`showFeatureName={false}`), **no
 *   border/fill/padding on the rows** (`bordered={false}`), and the shared
 *   **sparkle icon** (`useSparkleIcon`) instead of each feature's own asset —
 *   byte-for-byte what `VPNPlusUpsell` uses, so the list reads as one unified
 *   "things Plus unlocks" block rather than six different product icons
 *   competing with the JTBD badges on the profile deck. The
 *   rows also sit **20px apart** rather than the other layouts' 8px: with the
 *   border gone, spacing is the only thing left separating one claim from the
 *   next, and 8px let them read as one loose block instead of three. The list
 *   block itself carries **`my-[18px]`** on top of the column's 18px gap,
 *   doubling the space above (icon row → first feature) and below (last
 *   feature → "everything else") without inflating every other sibling.
 * - **A 3D-render mark above the headline** (`UpsellHeroMark`, 150px — grown
 *   twice from an initial 56px, after feedback each time that the previous
 *   size read as too small to register as the product itself).
 *
 * **The right 48% is a dot-paged, auto-advancing carousel** (`AutoplayCarousel`),
 * not the downward cascade the very first sketch used, with a standing fade on
 * its right edge signalling there's more to scroll to. Cards reuse
 * `UPSELL_CARD_TALL_H` (400) — the same height `profiles-hero-tabs` gives its
 * single dominant card — after 260 and then 320 both read as too short once
 * seen next to the now-taller, unbordered left column; this deck is the
 * entire right panel rather than one element sharing it, so there's no other
 * layout here to stay proportionate to.
 *
 * `AutoplayCarousel` (`profiles/AutoplayCarousel.tsx`) is a distinct primitive
 * from `CarouselTrack` (used by `profiles-band`), not a configuration of it:
 * `CarouselTrack` is for a row that MIGHT overflow and should show no chrome
 * at all when it doesn't; this is for a row that always wants to be read as
 * "N things, here's where you are" — dots plus a fixed-interval advance —
 * whether or not everything fits. Requiring `CarouselTrack` to grow dots and
 * autoplay behind extra props would have made every layout that reuses it pay
 * for behaviour only one of them wants.
 *
 * A `deckIntro` line above the carousel states the deck IS an unlock ("You'll
 * also be able to use these N personalized profiles…") rather than leaving it
 * to read as decoration standing in for the render it replaced.
 *
 * It still doesn't try to resolve the overlap between the chips and the
 * feature rows the way the band layout does: the two live in separate
 * columns, and a card corroborating a claim beside it is a different thing
 * from a card repeating a claim beneath it. */
export default function ProfilesFan({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, benefits, everythingElse } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const { profiles } = useUpsellProfiles(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(PROFILES_FAN_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex bg-[#16141c] @container">
      <UpsellBackButton version={PROFILES_FAN_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      {/* LEFT — the default screen's conversion column, unchanged in substance */}
      <div className="flex w-[52%] items-center overflow-y-auto px-[48px] py-[24px] @max-[900px]:w-full @max-[900px]:px-[32px]">
        <Tooltip.Provider delayDuration={200}>
          <motion.div
            initial={reduced ? undefined : "hidden"}
            animate={reduced ? undefined : "show"}
            variants={leftVariants}
            className="flex w-full max-w-[520px] flex-col gap-[18px]"
          >
            <UpsellHeroMark width={150} variants={itemVariants} />

            <motion.h1
              variants={itemVariants}
              className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              {UPSELL_VERSIONS_COPY.headline}
            </motion.h1>

            {isStreaming && <StreamingLogos variants={itemVariants} />}

            {/* `my-[18px]` on top of the column's own 18px gap — doubles the
                breathing room above and below the list specifically, without
                inflating every other sibling (hero mark, headline, CTAs). */}
            <div className="my-[18px] flex flex-col gap-[20px]">
              {benefits.map((benefit, i) => (
                <UpsellBenefitRow
                  key={`benefit-${i}`}
                  benefit={benefit}
                  showFeatureName={false}
                  useSparkleIcon
                  bordered={false}
                  variants={itemVariants}
                />
              ))}
            </div>

            <motion.p
              variants={itemVariants}
              className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
              style={{ fontFeatureSettings: '"rclt" 0' }}
            >
              {everythingElse}
            </motion.p>

            <UpsellCtaBlock
              version={PROFILES_FAN_VERSION}
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

      {/* RIGHT — the slider, in the slot the 3D render used to occupy. Hidden
          below ~900px for the same reason the render was: the CTAs win. */}
      <div className="relative flex w-[48%] flex-col items-center justify-center gap-[18px] overflow-hidden bg-[#100e18] px-[24px] @max-[900px]:hidden">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, x: 64 }}
          animate={reduced ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: UPSELL_VERSION_TIMING.secondaryDelay, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-[440px] flex-col gap-[16px]"
        >
          <p className="text-center font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.75)]">
            {C.deckIntro(profiles.length)}
          </p>

          <AutoplayCarousel
            items={profiles}
            itemWidth={UPSELL_CARD_W}
            ariaLabel={C.groupLabel}
            dotLabel={(profile) => `Show ${profile.name} profile`}
            reduced={reduced}
            renderItem={(profile) => <UpsellProfileCard profile={profile} height={CARD_H} />}
          />
        </motion.div>
      </div>
    </div>
  );
}
