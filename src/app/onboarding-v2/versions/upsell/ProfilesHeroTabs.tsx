import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import ProfileIconTile from "../../tuned-result/concepts/profiles-carousel-v2/ProfileIconTile";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellProfiles } from "./profiles/useUpsellProfiles";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellProfileCard, { UPSELL_CARD_TALL_H, UPSELL_CARD_W } from "./profiles/UpsellProfileCard";
import UpsellStaticFeatureRow, { PROFILES_HERO_TABS_FEATURE_COUNT } from "./profiles/UpsellStaticFeatureRow";
import UpsellHeroMark from "./profiles/UpsellHeroMark";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const PROFILES_HERO_TABS_VERSION = "profiles-hero-tabs";

const C = UPSELL_VERSIONS_COPY.profilesCombined;

/** Wider than `UPSELL_CARD_W` (280) so a 6–7 pick tab strip fits in at
 * most three rows beneath the card — the card stays 280; the tab row gains
 * a little extra room without the panel reading as an empty margin beside it. */
const PANEL_W = 360;

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
 * Static Plus features on the LEFT, one profile at full height as the
 * screen's dominant object on the RIGHT, with a tab strip beneath it to switch
 * between the rest. (Swapped from this layout's first version, which put the
 * hero on the left — reading order then put the personal object before the
 * offer it's illustrating; features-first matches every other layout in this
 * family, none of which lead with the profile column on the left.)
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
 * **The tabs sit below the card, not above it.** Reading order goes
 * count-and-claim → the hero object → the switcher beneath it, so a person
 * sees the profile first and picks another from the strip under what they're
 * already looking at. A one-line intro (`tabsIntro`) stays above the card
 * stating the count, the Plus unlock, and the personalization claim once —
 * `You'll also be able to use n personalized profile(s) with Plus features,
 * built around what you do online`.
 *
 * The features on the left are a **static** four-item list (countries,
 * speeds, devices, NetShield) with illustration assets — not the intent-ranked benefits
 * other layouts pull from `useUpsellContent`. No borders, fills, or tooltips:
 * the profile hero on the right already carries the visual weight.
 *
 * The 3D product render sits above the left-column headline — same mark and
 * width as `profiles-band` — rather than beside the profile card, so the offer
 * column carries a product anchor without competing with the profile hero. */
export default function ProfilesHeroTabs({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
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
    <div className="absolute inset-0 z-[1000] flex justify-center bg-[#16141c] px-[40px] py-[44px]">
      <UpsellBackButton version={PROFILES_HERO_TABS_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[940px] items-stretch gap-[32px]"
        >
          {/* LEFT — the conversion rail, vertically centred in the app view. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-[14px] overflow-y-auto">
            <UpsellHeroMark width={136} variants={itemVariants} />

            <motion.div variants={itemVariants}>
              <h1
                className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
                style={{ fontVariationSettings: "'opsz' 24" }}
              >
                {UPSELL_VERSIONS_COPY.headline}
              </h1>
            </motion.div>

            <div className="my-[16px] flex flex-col gap-[12px]">
              {Array.from({ length: PROFILES_HERO_TABS_FEATURE_COUNT }, (_, i) => (
                <UpsellStaticFeatureRow key={`static-feature-${i}`} index={i} variants={itemVariants} />
              ))}
            </div>

            <UpsellCtaBlock
              version={PROFILES_HERO_TABS_VERSION}
              jtbdKey={jtbdKey}
              selectionMode={selectionMode}
              selectionCount={selectionCount}
              onUpgrade={onUpgrade}
              onContinueFree={onContinueFree}
              showPricingSubline={false}
              continueLabel="Continue with free"
              variants={itemVariants}
            />
          </div>

          <div className="w-px shrink-0 bg-[rgba(255,255,255,0.12)]" aria-hidden="true" />

          {/* RIGHT — count-and-claim, the hero profile, then the tab strip
              beneath it — object first, switcher second; centred vertically. */}
          <motion.div variants={itemVariants} className="flex min-h-0 shrink-0 flex-col justify-center gap-[10px] overflow-y-auto" style={{ width: PANEL_W }}>
            <p className="text-pretty font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.65)]">
              {C.tabsIntro(profiles.length)}
            </p>

            {activeProfile && (
              // `mode="wait"` would leave a hole the height of the card while
              // the outgoing one leaves; the cards are stacked in a fixed-height
              // box instead so the swap is a crossfade in place.
              <div className="relative" style={{ width: UPSELL_CARD_W, height: UPSELL_CARD_TALL_H }}>
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeProfile.id}
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
                  const selected = profile.id === activeProfile?.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActive(i)}
                      className={`flex items-center gap-[5px] rounded-[8px] border px-[8px] py-[5px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/40 ${
                        selected
                          ? "border-white bg-white/12 text-white"
                          : "border-[rgba(255,255,255,0.12)] bg-transparent text-[rgba(255,255,255,0.65)] hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <ProfileIconTile profileId={profile.id} className="h-[18px] w-[27px]" />
                      {profile.name}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
    </div>
  );
}
