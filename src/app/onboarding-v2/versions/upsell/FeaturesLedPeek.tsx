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
import UpsellProfileDeckPeek from "./profiles/UpsellProfileDeckPeek";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const FEATURES_LED_PEEK_VERSION = "features-led-peek";

const C = UPSELL_VERSIONS_COPY.featuresLed;

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

/** Features-led #2 — "Peeking deck".
 *
 * Keeps `profiles-fan`'s two-column shape, since a split screen is what the
 * default upsell already is and the least disruptive of the three to swap in,
 * and changes the two things that made the right side win: its **share of the
 * width** (48% → 38%) and, more importantly, **what kind of object lives
 * there**. A dot-paged, auto-advancing carousel is a gallery, and a gallery
 * beside a list of text is not a fair fight regardless of how the pixels are
 * divided — it moves on a timer, it invites clicking, and it announces "N
 * things, here's where you are". `UpsellProfileDeckPeek` has no dots, no
 * timer and no pagination: one card you can look into and two behind it,
 * cropped by the panel edge and fading into it. Still life, not gallery.
 *
 * **The left column gets everything `profiles-fan` took away from it** to
 * stop it competing with that carousel: the `UpsellSubtitle` sentence, the
 * benefit rows' borders and fills, each feature's own icon at 18px, and the
 * `via {featureName}` subline — plus a section heading over the list and
 * Proton's three real trust facts under it. At 62% with a 28px headline
 * that's the screen's subject by every available measure: position, area,
 * type size and reading order.
 *
 * **The deck stays desirable** — its front card is the full
 * `UpsellProfileCard`, artwork, Plus rim and glow, badge and hover benefit
 * disclosure intact (see `UpsellProfileDeckPeek` for why the cards behind it
 * deliberately aren't). Demoting the profiles is a question of billing, not
 * of making them look cheap; a shabby right panel would just make the offer
 * look smaller. */
export default function FeaturesLedPeek({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, benefits, everythingElse, trustSignals } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const { profiles } = useUpsellProfiles(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(FEATURES_LED_PEEK_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex bg-[#16141c] @container">
      <UpsellBackButton version={FEATURES_LED_PEEK_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      {/* LEFT — 62%, and the screen's subject. `pt-[92px]` clears the Back
          button (absolute, `top-[52px]`, 32px tall): unlike the centred
          layouts, this column starts at x=52 and would otherwise be free to
          centre itself right underneath it. */}
      <div className="flex w-[62%] items-center overflow-y-auto px-[52px] pb-[24px] pt-[92px] @max-[900px]:w-full @max-[900px]:px-[32px]">
        <Tooltip.Provider delayDuration={200}>
          <motion.div
            initial={reduced ? undefined : "hidden"}
            animate={reduced ? undefined : "show"}
            variants={leftVariants}
            className="flex w-full max-w-[520px] flex-col gap-[16px]"
          >
            {/* No `UpsellHeroMark` here, for the same reason
                `profiles-hero-tabs` has none: the panel on the right is
                already carrying the product artwork, and two competing
                product images on one screen would spend the height this
                layout needs for its feature cards. */}
            <motion.div variants={itemVariants} className="flex flex-col gap-[5px]">
              <h1
                className="text-balance font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[34px] text-white"
                style={{ fontVariationSettings: "'opsz' 28" }}
              >
                {UPSELL_VERSIONS_COPY.headline}
              </h1>
              <UpsellSubtitle
                subtitle={subtitle}
                className="text-pretty font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]"
              />
            </motion.div>

            {isStreaming && <StreamingLogos variants={itemVariants} />}

            <div className="flex flex-col gap-[10px]">
              {benefits.map((benefit, i) => (
                <UpsellBenefitRow key={`benefit-${i}`} benefit={benefit} iconSize={18} variants={itemVariants} />
              ))}
            </div>

            <UpsellTrustRow signals={trustSignals} variants={itemVariants} />

            <motion.p
              variants={itemVariants}
              className="text-pretty font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
              style={{ fontFeatureSettings: '"rclt" 0' }}
            >
              {everythingElse}
            </motion.p>

            <UpsellCtaBlock
              version={FEATURES_LED_PEEK_VERSION}
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

      {/* RIGHT — 38%, a still life of what's behind the paywall */}
      <div className="relative w-[38%] overflow-hidden bg-[#100e18] @max-[900px]:hidden">
        <UpsellProfileDeckPeek profiles={profiles} reduced={reduced} className="size-full" />

        {/* `bottom-[24px]`, clearing the deck's own dot row (`bottom-[62px]`,
            6px tall) with room to spare — the two are laid out in separate
            components but at fixed, known offsets from the same panel edge. */}
        <motion.p
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: UPSELL_VERSION_TIMING.secondaryDelay + 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-[40px] bottom-[24px] text-pretty font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.62)]"
        >
          {C.profilesCaption(profiles.length)}
        </motion.p>
      </div>
    </div>
  );
}
