import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import UpsellProfileCard, { UPSELL_CARD_W } from "./UpsellProfileCard";
import { PROFILE_CARD_PHOTO } from "../../../lib/jtbdProfileMatrix";
import { PLUS_AVAILABILITY_LABEL } from "../../../tuned-result/profiles/profilesCopy";
import { UPSELL_VERSIONS_COPY } from "../../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "../timing";
import vpnPlusMarkUrl from "../../../assets/vpn-plus-mark.svg";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

const C = UPSELL_VERSIONS_COPY.featuresLed;

/** Height for this deck. Between `UPSELL_CARD_H` (240) and
 * `UPSELL_CARD_TALL_H` (400): 400 is what a layout gives a card that IS the
 * screen's subject, which is exactly the claim this deck is not making, and
 * 240 in a full-height panel leaves the card floating in the middle of an
 * empty column. */
const DECK_H = 320;

/** How many cards the deck renders AT ONCE. A fourth card lands almost
 * entirely outside the panel — it would cost a render and show a violet
 * sliver. Rotating the deck (see below) still cycles through every profile
 * when there are more than this many; the cap only bounds how deep the STACK
 * is, never how many profiles the deck can show over time. The caption
 * beside the deck always states the REAL profile count, so a 6-pick run
 * never has this cap speaking for it. */
const DECK_CAP = 3;

/** How long the front card holds before the deck auto-advances. */
const AUTO_ADVANCE_MS = 3000;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Per-depth placement. `i = 0` is the front card; each one behind steps
 * right (so the deck runs OFF the panel's right edge rather than fanning
 * symmetrically into empty space), rises slightly, tilts, shrinks and dims.
 * `hovered` widens the step so the deck opens a little under the pointer —
 * enough to read as a stack of separate objects, not enough to become the
 * thing the screen is about. */
const step = (i: number, hovered: boolean) => ({
  x: i * (hovered ? 66 : 46),
  y: i * -12,
  rotate: i * 2.4,
  scale: 1 - i * 0.04,
  opacity: 1 - i * 0.22,
});

/** Where a card comes FROM when it rotates into the back of the stack —
 * one step further back than any visible slot, so it reads as sliding OUT of
 * the panel's edge rather than popping into existence. Reused for the
 * layout's very first mount too (`i` there is each card's own resting
 * depth), which is why this needs `hovered` the same way `step` does. */
const enterFrom = (hovered: boolean) => ({ ...step(DECK_CAP, hovered), opacity: 0 });

/** Where the front card goes when it rotates OUT — forward and down, past
 * the front-most placement, the direction a card leaves a hand of cards
 * being dealt through. Fixed rather than depth-relative: only ever the front
 * card exits this way. */
const EXIT_PLACEMENT = { x: -34, y: 22, rotate: -7, scale: 1.04, opacity: 0 };

/** The back of the deck — artwork, name, rim and Plus mark, and nothing else.
 *
 * Deliberately NOT `UpsellProfileCard` at reduced opacity: that card is
 * interactive (focusable, with a hover disclosure of its benefit lines), and
 * three of them stacked would put two mostly-cropped hover targets and two
 * extra tab stops behind the one card a person can actually see. What a card
 * cropped by the panel edge at 78% opacity can genuinely show is its artwork,
 * its name and its lock — so that's all this renders, and the front card
 * stays the only thing here you can interact with. */
function DeckBack({ profile }: { profile: TunedProfile }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[16px] bg-[#0b0912]"
      style={{ boxShadow: "inset 0 0 0 1px rgba(147,116,255,0.5)" }}
    >
      <img src={PROFILE_CARD_PHOTO[profile.id]} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,6,14,0.9)] via-[rgba(8,6,14,0.35)] to-[rgba(8,6,14,0.6)]" />

      <p
        className="absolute inset-x-[16px] top-[16px] truncate font-['Segoe_UI_Variable',sans-serif] text-[22px] font-semibold leading-[28px] text-white"
        style={{ fontVariationSettings: "'opsz' 24", fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {profile.name}
      </p>

      <img
        src={vpnPlusMarkUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[12px] top-[52px] h-[24px] w-[39px]"
      />
    </div>
  );
}

/** The profiles as a receding deck that runs off the panel's right edge —
 * present, premium, and unmistakably NOT the screen's subject.
 *
 * The distinction from `AutoplayCarousel` (`profiles-fan`) was never "no
 * motion" — it's "no gallery". A dot-paged, endlessly-looping carousel asks
 * to be read as "N things, here's where you are", which wins against a
 * feature list beside it regardless of the pixels each gets. This still
 * rotates and still takes dot input, but it STOPS: the auto-advance runs
 * exactly one lap through the selection and then holds on whichever card it
 * lands on, so the deck settles into being a still life rather than staying
 * a standing animation for as long as the screen is open. Dots remain live
 * after that — the deck stops moving on its own, not moving at all.
 *
 * Kept desirable rather than merely small: the front card is the full
 * `UpsellProfileCard` with its artwork, name, Plus rim/glow, badge and hover
 * benefit disclosure intact. Only its chips come off (`showChips={false}`) —
 * on a features-led layout every setting the chips would name is already
 * stated in full, with its feature name, in the list this deck is supporting.
 * Same position `profiles-band` takes, for the same reason. */
export default function UpsellProfileDeckPeek({
  profiles,
  reduced,
  className = "",
}: {
  profiles: TunedProfile[];
  reduced: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [frontIndex, setFrontIndex] = useState(0);
  const spread = hovered && !reduced;

  const visibleCount = Math.min(DECK_CAP, profiles.length);
  // The stack, front-to-back, starting from whichever profile is current —
  // never a fixed slice, so a step forward reveals a genuinely new profile
  // once there are more than `DECK_CAP` of them, not just a shuffle of the
  // same three.
  const stack = Array.from({ length: visibleCount }, (_, i) => profiles[(frontIndex + i) % profiles.length]);

  const goTo = (index: number) => {
    setFrontIndex(((index % profiles.length) + profiles.length) % profiles.length);
  };

  // Auto-advance, capped at exactly one full lap. `autoAdvancesRef` counts
  // only the steps THIS effect makes — a manual dot click also changes
  // `frontIndex` (and, same as `AutoplayCarousel`, re-arms this effect's
  // timer with a fresh interval, so an interaction always buys a full pause
  // before the next auto-step) but never touches the counter, so clicking
  // around can't shorten or extend the one lap the timer is allowed to run.
  // `profiles.length` steps land back on the index the deck started at,
  // which is what "one loop" means here. Suspended entirely under reduced
  // motion, same as every other auto-advancing element in this codebase.
  const autoAdvancesRef = useRef(0);
  const [autoDone, setAutoDone] = useState(profiles.length <= 1);

  useEffect(() => {
    if (reduced || autoDone) return;
    const t = window.setTimeout(() => {
      autoAdvancesRef.current += 1;
      setFrontIndex((i) => (i + 1) % profiles.length);
      if (autoAdvancesRef.current >= profiles.length) setAutoDone(true);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontIndex, reduced, autoDone, profiles.length]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Front card sits at a fixed left inset and is vertically centred; the
          cards behind it step rightwards from there, past this container's
          clip edge. */}
      <div className="absolute inset-y-0 left-[40px] flex items-center">
        <div className="relative" style={{ width: UPSELL_CARD_W, height: DECK_H }}>
          {/* `popLayout` lets the exiting front card and the newly-entering
              back card animate at the same time as the surviving middle card
              simply slides forward — without it, AnimatePresence's default
              layout mode holds every sibling in place until the exiting one
              finishes, which reads as a stall before the shift. Back-to-front
              render order, so the front card paints last without every card
              needing a z-index. */}
          <AnimatePresence initial={false} mode="popLayout">
            {stack
              .map((profile, i) => ({ profile, i }))
              .reverse()
              .map(({ profile, i }) => {
                const placement = step(i, spread);
                return (
                  <motion.div
                    key={profile.id}
                    className="absolute inset-0"
                    aria-hidden={i > 0 ? "true" : undefined}
                    initial={reduced ? false : { ...enterFrom(spread), x: placement.x + 56 }}
                    animate={placement}
                    exit={reduced ? undefined : EXIT_PLACEMENT}
                    transition={{
                      duration: reduced ? 0 : 0.55,
                      delay: reduced ? 0 : UPSELL_VERSION_TIMING.secondaryDelay + i * 0.06,
                      ease: EASE_OUT,
                    }}
                  >
                    {i === 0 ? (
                      <UpsellProfileCard profile={profile} height={DECK_H} showChips={false} />
                    ) : (
                      <DeckBack profile={profile} />
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      </div>

      {/* Manual control — a dot per profile, same visual language
          `AutoplayCarousel`'s own dots use, so a person who has already
          learned that pattern on `profiles-fan` recognises it here. Clicking
          jumps straight to that profile rather than stepping through the
          ones between it and the front, since a person picking a specific
          card from a list of names has no reason to sit through the others. */}
      {profiles.length > 1 && (
        <div
          role="tablist"
          aria-label={C.groupLabel}
          className="absolute inset-x-0 bottom-[62px] flex items-center justify-center gap-[6px]"
        >
          {profiles.map((profile, i) => {
            const active = i === frontIndex;
            return (
              <button
                key={profile.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Show ${profile.name} profile`}
                onClick={() => goTo(i)}
                className={`h-[6px] shrink-0 rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/40 ${
                  active ? "w-[20px] bg-white" : "w-[6px] bg-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.5)]"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Fades the deck into the panel on the right and bottom, so it reads as
          continuing past the edge rather than being chopped by it. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#100e18]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[96px] bg-gradient-to-t from-[#100e18] to-transparent" />

      {/* The names on the cropped cards, which are `aria-hidden` above so the
          deck presents as one object rather than three tab-adjacent ones. */}
      <span className="sr-only">
        {`${C.groupLabel}: ${profiles.map((p) => p.name).join(", ")} — ${PLUS_AVAILABILITY_LABEL}`}
      </span>
    </div>
  );
}
