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
import UpsellProfileCard from "./profiles/UpsellProfileCard";
import UpsellBenefitRow from "./profiles/UpsellBenefitRow";
import UpsellHeroMark from "./profiles/UpsellHeroMark";
import CarouselTrack from "../../tuned-result/concepts/profiles-carousel/CarouselTrack";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const PROFILES_BAND_VERSION = "profiles-band";

const C = UPSELL_VERSIONS_COPY.profilesCombined;

/** Shorter than the tuning screen's 240, and only because the chips are off
 * here (see the component note) — a card carrying just artwork, an icon and a
 * name doesn't need the extra 20px, and this is the one layout where the
 * profiles and the features stack in the same vertical run and so compete for
 * it directly. */
const CARD_H = 220;

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

/** Combined upsell — "Carousel band".
 *
 * Inverts the default screen's hierarchy. The profile cards run full-width
 * directly under the headline as the first thing seen, and the ranked Plus
 * features drop beneath them as a checked list under a line that names the
 * quantity being unlocked.
 *
 * The argument for this order: the cards are concrete and personal ("Gaming",
 * with the user's own settings baked in), the features are abstract and
 * general ("Play on servers in other regions"). Leading with the concrete
 * object and following with the mechanism is the order that reads as one
 * argument. The default screen's order — mechanism first, aspiration as
 * decoration on the right — reads as two.
 *
 * **The chips are off, and that's this layout's whole answer to redundancy.**
 * A Downloading card's chips say "P2P server · Port forwarding · NetShield",
 * and the feature list ten pixels below says "Connect to servers set up for
 * file-sharing / via P2P servers". Those are the same fact in two registers,
 * and stacked vertically the repetition is impossible to miss. So the cards
 * keep the artwork, the name and the lock, and the list beneath them carries
 * every settings-level claim exactly once. The features also use the compact
 * `"line"` register rather than bordered cards, for the same reason: the cards
 * above already spend the screen's visual weight.
 *
 * Its known weakness is the one-pick run — a single card as a "band" is thin,
 * where the hero-and-tabs layout treats one card as the intended case. */
export default function ProfilesBand({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, benefits, everythingElse } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const { profiles } = useUpsellProfiles(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(PROFILES_BAND_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[40px]">
      <UpsellBackButton version={PROFILES_BAND_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[720px] flex-col gap-[12px]"
        >
          <UpsellHeroMark width={136} className="mx-auto" variants={itemVariants} />

          <motion.div variants={itemVariants} className="flex flex-col gap-[4px] text-center">
            <h1
              className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              {C.profilesHeadline(profiles.length)}
            </h1>
            <UpsellSubtitle
              subtitle={subtitle}
              className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]"
            />
          </motion.div>

          {/* Reused from the tuning carousel, which already grows arrows and
              edge fades only when the row actually overflows — so a 1–2 pick
              run gets a plain centred row with no carousel chrome at all, and
              a 6-pick run gets the affordances it needs. `focusIndex` is not
              passed: nothing here loads one card at a time. */}
          <motion.div variants={itemVariants}>
            <CarouselTrack reduced={reduced} label={C.groupLabel}>
              {profiles.map((profile) => (
                <UpsellProfileCard key={profile.id} profile={profile} height={CARD_H} showChips={false} className="snap-start" />
              ))}
            </CarouselTrack>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-[2px] flex items-center gap-[10px]">
            <span
              className="shrink-0 font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-white"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {C.unlockLine(profiles.length)}
            </span>
            <span className="h-px min-w-0 flex-1 bg-[rgba(255,255,255,0.12)]" />
          </motion.div>

          <div className="flex flex-col gap-[7px]">
            {benefits.map((benefit, i) => (
              <UpsellBenefitRow key={`benefit-${i}`} benefit={benefit} variant="line" variants={itemVariants} />
            ))}
          </div>

          {/* `compact` here and not on the other three layouts: this is the
              only one where the profiles and the features share a single
              vertical run, so it's the only one where the logo row's full
              height competes with something. */}
          {isStreaming && <StreamingLogos variants={itemVariants} compact />}

          <motion.p
            variants={itemVariants}
            className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {everythingElse}
          </motion.p>

          <UpsellCtaBlock
            version={PROFILES_BAND_VERSION}
            jtbdKey={jtbdKey}
            selectionMode={selectionMode}
            selectionCount={selectionCount}
            onUpgrade={onUpgrade}
            onContinueFree={onContinueFree}
            className="mx-auto w-full max-w-[420px]"
            variants={itemVariants}
          />
        </motion.div>
      </Tooltip.Provider>
    </div>
  );
}
