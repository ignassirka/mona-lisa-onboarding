import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useUpsellProfiles } from "./profiles/useUpsellProfiles";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellSubtitle from "./lib/UpsellSubtitle";
import StreamingLogos from "./lib/StreamingLogos";
import UpsellBenefitRow from "./profiles/UpsellBenefitRow";
import UpsellProfileBoxThumb from "./profiles/UpsellProfileBoxThumb";
import UpsellHeroMark from "./profiles/UpsellHeroMark";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const FEATURES_LED_BAND_VERSION = "features-led-band";

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

/** Features-led #1 — "Profile filmstrip".
 *
 * The first of three layouts built to answer a specific problem with
 * `profiles-fan`: there, the profiles own a 48% column of full-height artwork
 * while the features are three unbordered lines of text, so the screen's
 * centre of gravity lands on the right and the features read as a caption to
 * the cards. These three keep the profiles — they're real, they're the user's
 * picks, and they're desirable — but return the features to being the thing
 * the screen is about. Each one demotes the profiles a different distance.
 *
 * **This one gives the features the whole stage and the profiles one row.**
 * A single centred column carries the ranked features as full bordered cards
 * — the default upsell's own `"card"` register, each with its own feature icon
 * and its `via {featureName}` subline restored, both of which `profiles-fan`
 * had to strip so its list wouldn't compete with the deck. Nothing is beside
 * them, so there's nothing to compete with. Above them the personalization is
 * stated in words (`UpsellSubtitle`, also dropped by `profiles-fan` as
 * redundant next to the cards) as a header shared with the 3D mark, both
 * centred rather than left-set — with nothing beside this column, a centred
 * mark-title-subtitle block reads as the screen's own header rather than the
 * top of a form.
 *
 * **The profiles sit in one bordered box between the features and the CTA**
 * — a caption sentence beside a row of small [image, name-below] thumbnails
 * (`UpsellProfileBoxThumb`), rather than a strip pinned to the panel's bottom
 * edge. The box itself carries the "this is part of the deal" framing (the
 * same treatment `ValueStack`'s price panel and the inline avatar row's
 * violet panel already use), which is what lets each thumbnail drop the
 * per-card Plus signal every OTHER profile presentation in this codebase
 * carries — see `UpsellProfileBoxThumb`'s own note. The demotion is
 * positional and proportional, not a downgrade in quality: full-strength
 * artwork, every name still legible, just one bordered row rather than the
 * default screen's full column.
 *
 * **Why thumbnails with the name below rather than burnt into the artwork:**
 * the box already states "these are profiles" once, in the caption sentence
 * right beside them — a scrim + overlaid name on each one would restate that
 * per thumbnail. Dropping the scrim also lets the artwork play at its own
 * brightness instead of being dimmed for legibility under text that no
 * longer needs to sit on top of it.
 *
 * **Trust signals and the "everything else" line are deliberately absent
 * here**, unlike most other layouts (`PlanSelector` is the one other
 * precedent for omitting the "everything else" line; `profiles-fan` is the
 * precedent for omitting trust signals) — with the header, the benefit list
 * AND the profile box all on one page, a fourth block of secondary text
 * pushed the screen past what one clean read could hold without either
 * feeling crowded or needing a scroll neither block earns.
 *
 * Scales flat with selection count: at `BOX_THUMB_W` 88px, 6 thumbnails still
 * fit the box's width beside the caption, and the caption always states the
 * real count. */
export default function FeaturesLedBand({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, benefits } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const { profiles } = useUpsellProfiles(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(FEATURES_LED_BAND_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[24px] @container">
      <UpsellBackButton version={FEATURES_LED_BAND_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[560px] flex-col gap-[14px]"
        >
          <UpsellHeroMark width={110} variants={itemVariants} className="self-center" />

          <motion.div variants={itemVariants} className="flex flex-col items-center gap-[5px] text-center">
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

          {/* THE BOX — replaces both the old bottom-pinned filmstrip and the
              trust row: one bordered container between the features and the
              CTA, doing the "this is part of the deal" framing itself. Wraps
              to a stacked layout below ~460px, where a 6-pick thumbnail row
              can no longer share a line with the caption. */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-[18px] rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-[18px] py-[14px] @max-[460px]:flex-col @max-[460px]:items-start @max-[460px]:gap-[12px]"
          >
            <p className="w-[160px] shrink-0 text-pretty font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[19px] text-white @max-[460px]:w-auto">
              {C.profilesBoxCaption(profiles.length)}
            </p>
            <div role="group" aria-label={C.groupLabel} className="flex min-w-0 flex-1 flex-wrap gap-[10px]">
              {profiles.map((profile) => (
                <UpsellProfileBoxThumb key={profile.id} profile={profile} />
              ))}
            </div>
          </motion.div>

          <UpsellCtaBlock
            version={FEATURES_LED_BAND_VERSION}
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
