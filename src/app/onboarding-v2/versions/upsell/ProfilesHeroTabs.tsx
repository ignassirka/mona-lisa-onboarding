import { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useUpsellProfiles } from "./profiles/useUpsellProfiles";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellSubtitle from "./lib/UpsellSubtitle";
import StreamingLogos from "./lib/StreamingLogos";
import UpsellProfileCard, { UPSELL_CARD_TALL_H, UPSELL_CARD_W } from "./profiles/UpsellProfileCard";
import UpsellBenefitRow from "./profiles/UpsellBenefitRow";
import { JTBD_ICONS } from "../lib/jtbdIcons";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const PROFILES_HERO_TABS_VERSION = "profiles-hero-tabs";

const C = UPSELL_VERSIONS_COPY.profilesCombined;

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

/** Combined upsell — "Hero card & tabs".
 *
 * One profile at full height as the screen's dominant object, the rest as a tab
 * strip beneath it, and the ranked Plus features in a column beside it.
 *
 * The reason this layout exists rather than showing all the profiles at once:
 * every "show them all" arrangement degrades at one end of the selection range
 * or the other — a row of six 280px cards has to shrink or scroll, and a single
 * card in a layout built for three looks like something failed to load. Tabs
 * are flat in both directions. One pick drops the strip entirely and loses
 * nothing (there was never a second profile to switch to); six adds six tabs,
 * which is a strip, not a crowd. Focus is the second reason: one card at full
 * size is a more desirable object than three at 60%.
 *
 * The features keep their bordered `"card"` register here, because the profile
 * and the features occupy separate columns rather than stacking — nothing is
 * competing for the same vertical run, so there's no need to demote them.
 *
 * The 3D product render is deliberately absent. This layout already has a large
 * personal hero, and adding the generic one beside it would put two competing
 * heroes on one screen. The band and paired layouts keep it, where the top edge
 * is free. */
export default function ProfilesHeroTabs({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, benefits, everythingElse } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const { profiles } = useUpsellProfiles(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useTrackUpsellView(PROFILES_HERO_TABS_VERSION, jtbdKey, selectionMode, selectionCount);

  // Guarded rather than assumed: `profiles` is never empty in practice (every
  // run has at least one pick), but indexing a hero off state would be the
  // wrong place to find that out.
  const activeProfile = profiles[Math.min(active, profiles.length - 1)];

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[44px]">
      <UpsellBackButton version={PROFILES_HERO_TABS_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[900px] items-center gap-[40px]"
        >
          {/* LEFT — the hero profile and its tab strip */}
          <motion.div variants={itemVariants} className="flex shrink-0 flex-col gap-[12px]" style={{ width: UPSELL_CARD_W }}>
            {activeProfile && (
              // `mode="wait"` would leave a hole the height of the card while
              // the outgoing one leaves; the cards are stacked in a fixed-height
              // box instead so the swap is a crossfade in place.
              <div className="relative" style={{ height: UPSELL_CARD_TALL_H }}>
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeProfile.jtbd}
                    className="absolute inset-0"
                    initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                    animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <UpsellProfileCard profile={activeProfile} height={UPSELL_CARD_TALL_H} emphasis />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Only when there's actually something to switch between. */}
            {profiles.length > 1 && (
              <div role="tablist" aria-label={C.tabsLabel} className="flex flex-wrap gap-[6px]">
                {profiles.map((profile, i) => {
                  const selected = profile.jtbd === activeProfile?.jtbd;
                  return (
                    <button
                      key={profile.jtbd}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActive(i)}
                      className={`flex items-center gap-[5px] rounded-[8px] border px-[8px] py-[5px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/40 ${
                        selected
                          ? "border-[rgba(147,116,255,0.55)] bg-[rgba(109,74,255,0.18)] text-white"
                          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.65)] hover:border-[rgba(255,255,255,0.22)] hover:text-white"
                      }`}
                    >
                      {/* The picker's own badge asset, scaled on its native
                          2:3 ratio rather than reused via `ProfileIconTile` —
                          that component is fixed at 36×54 for a card, and
                          clipping it to tab size would show a corner of the
                          badge instead of the badge. */}
                      <img src={JTBD_ICONS[profile.jtbd]} alt="" aria-hidden="true" className="h-[14px] w-[21px] shrink-0 object-contain" />
                      {profile.name}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* RIGHT — the conversion rail */}
          <div className="flex min-w-0 flex-1 flex-col gap-[14px]">
            <motion.div variants={itemVariants} className="flex flex-col gap-[4px]">
              <h1
                className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
                style={{ fontVariationSettings: "'opsz' 24" }}
              >
                {UPSELL_VERSIONS_COPY.headline}
              </h1>
              <UpsellSubtitle
                subtitle={subtitle}
                className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]"
              />
            </motion.div>

            {isStreaming && <StreamingLogos variants={itemVariants} />}

            <div className="flex flex-col gap-[8px]">
              {benefits.map((benefit, i) => (
                <UpsellBenefitRow key={`benefit-${i}`} benefit={benefit} variants={itemVariants} />
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
              version={PROFILES_HERO_TABS_VERSION}
              jtbdKey={jtbdKey}
              selectionMode={selectionMode}
              selectionCount={selectionCount}
              onUpgrade={onUpgrade}
              onContinueFree={onContinueFree}
              variants={itemVariants}
            />
          </div>
        </motion.div>
      </Tooltip.Provider>
    </div>
  );
}
