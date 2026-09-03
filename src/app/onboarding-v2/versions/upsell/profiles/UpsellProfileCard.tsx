import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import ProfileIconTile from "../../../tuned-result/concepts/profiles-carousel-v2/ProfileIconTile";
import { PROFILE_BENEFITS, PROFILE_CARD_PHOTO, profileChips } from "../../../lib/jtbdProfileMatrix";
import { TUNING_CONCEPTS_COPY } from "../../../tuned-result/conceptsCopy";
import { TUNING_CONCEPT_TIMING as CT, sec } from "../../../tuned-result/timing";
import { PLUS_AVAILABILITY_LABEL } from "../../../tuned-result/profiles/profilesCopy";
import StreamingLogos from "../lib/StreamingLogos";
import { useReducedMotion } from "../../lib/useReducedMotion";
import vpnPlusMarkUrl from "../../../assets/vpn-plus-mark.svg";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

/** The card's width, shared by every layout that uses it so the four
 * variations can't drift into four different profile cards. */
export const UPSELL_CARD_W = 280;

/** Standard height — the same 240 the tuning screen's Free card uses, so a
 * user who just saw these cards one screen ago recognises them. */
export const UPSELL_CARD_H = 240;

/** Tall height, for the layouts that show ONE card as the hero. Shorter than
 * the Plus carousel's own 430 because that card spent its extra height on a
 * country dropdown and a Connect button, neither of which exists here. */
export const UPSELL_CARD_TALL_H = 400;

/** The premium treatment, and the one real departure from the tuning screen's
 * version of this card.
 *
 * On the tuning screen a locked profile is dimmed to 45%, because that screen
 * is stating a fact: this isn't yours. Here the job is the opposite — this
 * screen has to make the same object desirable enough to pay for — and a faded
 * card sells nothing. So the lock signal is ADDITIVE rather than subtractive:
 * full-strength artwork, a Plus-violet rim and outer glow, and the Plus badge
 * (`vpn-plus-mark.svg`). The card reads as the most premium thing on screen
 * while still being visibly behind a gate.
 *
 * Getting this wrong in the other direction is the risk worth naming: a
 * full-strength card with NO Plus signal reads as already owned, and nobody
 * pays for what they think they have. The rim and the badge are two independent
 * signals precisely so removing the dimming can't leave the gating resting on
 * copy alone. */
const RIM = "inset 0 0 0 1px rgba(147,116,255,0.5)";
const GLOW = "0 10px 30px rgba(109,74,255,0.26)";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const C2 = TUNING_CONCEPTS_COPY.profilesCarouselV2;

interface UpsellProfileCardProps {
  profile: TunedProfile;
  /** Defaults to `UPSELL_CARD_H`; pass `UPSELL_CARD_TALL_H` for a hero card. */
  height?: number;
  /** The derived `profileChips` row. Off for layouts that state the same
   * settings elsewhere on the screen — hover still discloses benefits. */
  showChips?: boolean;
  /** Larger title for a hero card. */
  emphasis?: boolean;
  className?: string;
}

/** One profile as a full-strength, locked, desirable card — the upsell's
 * counterpart to the tuning screen's `FreeProfileCard`.
 *
 * Deliberately a separate component rather than a prop on that one. The two
 * cards disagree on the thing that matters most about them: `FreeProfileCard`
 * is a statement ("not yours", hence the dimming and the flat `sr-only`
 * availability line), and this is an offer ("could be yours", hence the rim
 * and the glow). Folding both into one component would mean a `variant` prop
 * that inverts the card's entire meaning, which is exactly the kind of flag
 * this codebase keeps out of its concepts.
 *
 * What IS shared is everything factual: the same artwork asset at the same
 * width, the same `ProfileIconTile`, the same name, the same derived
 * `profileChips`, and the same hover benefit disclosure the Plus tuning
 * carousel uses (`PROFILE_BENEFITS` + `hoverSubtitle`). So the card a user
 * saw on the tuning screen is recognisably the same object here — just gated
 * and selling rather than stating. */
export default function UpsellProfileCard({
  profile,
  height = UPSELL_CARD_H,
  showChips = true,
  emphasis = false,
  className = "",
}: UpsellProfileCardProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = hovered || focused;

  const chips = showChips ? profileChips(profile.id) : [];
  const benefits = PROFILE_BENEFITS[profile.id];
  const disclosure = reduced ? { duration: 0.15 } : { duration: sec(CT.carouselHoverMs), ease: EASE_OUT };

  return (
    <div
      tabIndex={0}
      className={`group relative shrink-0 overflow-hidden rounded-[16px] bg-[#0b0912] outline-none focus-visible:ring-2 focus-visible:ring-[rgba(147,116,255,0.55)] ${className}`}
      style={{ width: UPSELL_CARD_W, height, boxShadow: `${RIM}, ${GLOW}` }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <motion.img
        src={PROFILE_CARD_PHOTO[profile.id]}
        alt=""
        className="absolute inset-0 size-full object-cover"
        animate={{ scale: open && !reduced ? 1.05 : 1 }}
        transition={{ duration: reduced ? 0 : 0.6, ease: EASE_OUT }}
      />

      {/* Same top-weighted scrim the tuning screen's cards use — this artwork
          is bright, and the icon and name sit over its lightest region. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,6,14,0.92)] via-[rgba(8,6,14,0.25)] to-[rgba(8,6,14,0.5)]" />

      <motion.div
        className="absolute inset-0 bg-[rgba(8,6,14,0.72)]"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={disclosure}
      />

      <div className="absolute inset-0 flex flex-col px-[16px] pt-[16px] pb-[14px]">
        <ProfileIconTile profileId={profile.id} />

        <p
          className={`mt-[8px] min-w-0 truncate font-['Segoe_UI_Variable',sans-serif] font-semibold text-white ${
            emphasis ? "text-[30px] leading-[36px]" : "text-[26px] leading-[32px]"
          }`}
          style={{ fontVariationSettings: "'opsz' 24", fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {profile.name}
        </p>

        {/* Chips on the default face; benefit lines on hover/focus — same
            crossfade the Plus tuning carousel uses so Free users get the same
            "what this profile does for you" read without paying first. */}
        <div className="relative mt-[10px] min-h-0 flex-1">
          <AnimatePresence initial={false} mode="wait">
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
                <p className="truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.72)]">
                  {C2.hoverSubtitle[profile.id]}
                </p>

                {profile.jtbd === "streaming" ? <StreamingLogos compact className="mt-[6px]" /> : null}

                <div className="mt-[8px] h-px bg-[rgba(255,255,255,0.14)]" />

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
            ) : chips.length > 0 ? (
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
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <img
        src={vpnPlusMarkUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[12px] top-[12px] z-[1] h-[24px] w-[39px]"
      />

      {/* The rim and the badge are both visual — neither says anything to a
          screen reader. */}
      <span className="sr-only">{`${profile.name} — ${PLUS_AVAILABILITY_LABEL}`}</span>
    </div>
  );
}
