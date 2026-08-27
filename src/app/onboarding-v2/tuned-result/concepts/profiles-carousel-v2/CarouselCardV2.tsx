import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import CountrySelect from "../../../components/CountrySelect";
import StreamingLogos from "../../../versions/upsell/lib/StreamingLogos";
import ProfileIconTile from "./ProfileIconTile";
import CardShimmer from "./CardShimmer";
import {
  COUNTRY_RULE_OPTIONS,
  PROFILE_BENEFITS,
  PROFILE_CARD_PHOTO,
  PROFILE_COUNTRY_DEFAULT,
  profileChips,
} from "../../../lib/jtbdProfileMatrix";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { TUNING_CONCEPT_TIMING as CT, sec } from "../../timing";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

/** v2 shares v1's screen vocabulary and adds only the hover subtitle — see
 * `conceptsCopy.ts`'s `profilesCarouselV2` block for why that split exists. */
const C2 = TUNING_CONCEPTS_COPY.profilesCarouselV2;

/** Decelerating ease — shared with v1's card and the concept's entrance, so
 * every motion on this screen reads as the same object moving. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** The card's fixed footer height, in px: the country dropdown (38) + the
 * bottom padding (14). Declared because the scrim that guarantees the
 * footer's legibility has to be positioned against it from the OUTSIDE, and
 * a magic number in two places would drift. */
const FOOTER_H = 52;

/** How far the opaque footer reaches ABOVE the footer's own content, so the
 * dropdown isn't sitting on the artwork's hard edge. */
const FOOTER_OVERSHOOT = 8;

/** Card height, in px, and the tightest number on this screen.
 *
 * `ConceptFrame` spends 328px of the 768px window on chrome (Back, the
 * 128px header block, its 30px gap, the 24px gap to Continue, Continue
 * itself, and 40px of bottom padding), and `CarouselTrack` adds 2px, which
 * caps a card at 438. The 430 spent here leaves the disclosure region 250px:
 * 52 of footer, 120 of identity block, 8 of footer overshoot. The tallest
 * state that can occupy it is Streaming's (subtitle 18, logo row 28, rule 1,
 * three 2-line benefit rows at `gap-[6px]` = 114, plus 16 of margins = 177),
 * leaving 73px in hand. `PROFILE_BENEFITS` is fixed at exactly 3 lines per
 * profile. Growing the card any further starts scrolling the frame. */
const CARD_H = 430;

interface CarouselCardV2Props {
  profile: TunedProfile;
  reduced: boolean;
}

/** One profile as a full-height card, and the entire tuning outcome — v2 has
 * nothing below the carousel for a card to be a summary of.
 *
 * The differences from v1's card are all consequences of that. It's 420px
 * instead of 312 (the removed global-settings rows paid for the height), it
 * states its own destination in a real control rather than a caption, and
 * the identity block sits at the TOP where a taller card puts it in the eye's
 * path rather than floating in the middle of the artwork.
 *
 * The disclosure is a CROSSFADE INSIDE A FIXED REGION, not v1's height
 * growth: chips out, settings in, card height untouched. With six cards
 * potentially side by side, a card that grew on hover would shove its
 * neighbours around, and the neighbours are what a user is comparing it
 * against.
 *
 * Opens on focus as well as hover — a hover-only disclosure would put the
 * whole configuration out of reach of anyone tabbing through, and the
 * country dropdown underneath is focusable, so the panel is open exactly
 * when a keyboard user is working inside the card anyway.
 *
 * Hover is scoped to the identity/disclosure region only, NOT the whole
 * card — the country dropdown in the footer is its own separate control, and
 * hovering it (or its own open popover, which portals outside the card
 * entirely) shouldn't be read as "hovering the card". Keyboard focus stays
 * card-wide, since tabbing from the disclosure into the dropdown is a single
 * continuous interaction with the card that a mouse hover over an unrelated
 * sibling control isn't.
 *
 * What the panel discloses is a BENEFIT list, not the configuration: three
 * checked lines from `PROFILE_BENEFITS` saying what this profile does for
 * you, where an earlier revision listed the six matrix settings and their
 * values. The settings list made six cards comparable field by field, but
 * only for a reader who already knew what a NAT type was — and comparing is
 * not what someone picking a profile is doing. It also carried (i) tooltips
 * per row, which the benefit lines don't need: a line that has to be
 * explained isn't a benefit line yet. */
export default function CarouselCardV2({ profile, reduced }: CarouselCardV2Props) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Per-card, and deliberately not lifted: each card is its own destination,
  // and one card's country has no business retargeting the other five.
  const [country, setCountry] = useState<string | null>(PROFILE_COUNTRY_DEFAULT[profile.jtbd]);
  const open = hovered || focused;

  const benefits = PROFILE_BENEFITS[profile.jtbd];
  const chips = profileChips(profile.jtbd);
  const disclosure = reduced ? { duration: 0.15 } : { duration: sec(CT.carouselHoverMs), ease: EASE_OUT };

  return (
    <div
      className="group relative w-[280px] overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[#0b0912]"
      style={{ height: CARD_H }}
      onFocus={() => setFocused(true)}
      // Only close when focus leaves the CARD, not when it moves into the
      // dropdown's own options. A bare `setFocused(false)` would flicker the
      // panel shut and open again on every tab step inside the card.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <motion.img
        src={PROFILE_CARD_PHOTO[profile.jtbd]}
        alt=""
        className="absolute inset-0 size-full object-cover"
        animate={{ scale: open && !reduced ? 1.05 : 1 }}
        transition={{ duration: reduced ? 0 : 0.6, ease: EASE_OUT }}
      />

      {/* Identity scrim — top-weighted, since this artwork is far brighter
          than v1's photography and the icon and name sit over its lightest
          region. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,6,14,0.92)] via-[rgba(8,6,14,0.2)] to-[rgba(8,6,14,0.4)]" />

      {/* Disclosure scrim. The settings list needs a legible floor across all
          six illustrations, not just the darkest ones, so it deepens only
          while open rather than dimming the artwork permanently. */}
      <motion.div
        className="absolute inset-0 bg-[rgba(8,6,14,0.72)]"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={disclosure}
      />

      {/* The footer is opaque rather than translucent: a country name can't
          be left to compete with whatever happens to be behind it in six
          different images. */}
      <div className="absolute inset-x-0 bottom-0 bg-[#0b0912]" style={{ height: FOOTER_H + FOOTER_OVERSHOOT }} />
      <div
        className="absolute inset-x-0 h-[36px] bg-gradient-to-t from-[#0b0912] to-transparent"
        style={{ bottom: FOOTER_H + FOOTER_OVERSHOOT }}
      />

      <div className="absolute inset-0 flex flex-col">
        <div
          className="flex min-h-0 flex-1 flex-col px-[16px] pt-[16px]"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <ProfileIconTile jtbd={profile.jtbd} />

          <p
            className="mt-[10px] truncate font-['Segoe_UI_Variable',sans-serif] text-[26px] font-semibold leading-[32px] text-white"
            style={{ fontVariationSettings: "'opsz' 24", fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {profile.name}
          </p>

          {/* Both faces are absolutely positioned in this one region, so they
              cross-fade in place — the title above them never moves. */}
          <div className="relative mt-[10px] min-h-0 flex-1">
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  key="details"
                  className="absolute inset-x-0 top-0"
                  role="group"
                  aria-label={C2.settingsLabel}
                  initial={{ opacity: 0, y: reduced ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={disclosure}
                >
                  {/* One line, enforced: a wrapped subtitle would push this
                      card's rows out of alignment with its neighbours' — see
                      `hoverSubtitle`'s length constraint. */}
                  <p className="truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.72)]">
                    {C2.hoverSubtitle[profile.jtbd]}
                  </p>

                  {/* Only Streaming has a set of named services this profile
                      is recognisably FOR. The other five have no equivalent
                      row, and inventing one would be decoration. */}
                  {profile.jtbd === "streaming" ? <StreamingLogos compact className="mt-[6px]" /> : null}

                  <div className="mt-[8px] h-px bg-[rgba(255,255,255,0.14)]" />

                  {/* Benefits, not settings — see `PROFILE_BENEFITS`. Each
                      line wraps freely rather than truncating: a clipped
                      half-sentence says less than a settings row did, which
                      would defeat the point of replacing them. */}
                  <ul className="mt-[8px] flex flex-col gap-[6px]">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-[6px]">
                        <Check
                          size={13}
                          strokeWidth={3}
                          className="mt-[2px] shrink-0 text-[rgba(44,255,204,0.9)]"
                        />
                        <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px] text-[rgba(255,255,255,0.86)]">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div
                  key="chips"
                  className="absolute inset-x-0 top-0 flex flex-wrap gap-[6px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={disclosure}
                >
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-[4px] border border-[rgba(255,255,255,0.16)] bg-[rgba(12,10,18,0.55)] px-[8px] py-[3px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-medium leading-[16px] text-white backdrop-blur-[2px]"
                    >
                      {chip}
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="shrink-0 px-[14px] pb-[14px]">
          {/* Opens UPWARD (`bottom-full`) and is short enough to land inside
              the card, which is what lets the card keep `overflow-hidden`
              for its own rounded corners. */}
          <CountrySelect value={country} onChange={setCountry} ruleOptions={COUNTRY_RULE_OPTIONS} />
        </div>
      </div>

      {/* The freshness pass. Last child, so it travels over the artwork AND the
          footer — the band belongs to the whole card, and stopping it at the
          footer's edge would give away that the card is layers rather than an
          object. Fires on mount, which IS the resolve moment: `MaterializingSlot`
          mounts this card fresh when its stage flips, so no explicit trigger is
          needed and the pass can never replay on a re-render. */}
      <CardShimmer mode="sweep" reduced={reduced} />
    </div>
  );
}
