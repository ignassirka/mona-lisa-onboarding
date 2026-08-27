import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PROFILE_PHOTO, profileConfigRows } from "../../../lib/jtbdProfileConfig";
import { sidebarSubtitle, type TunedProfile } from "../../../lib/jtbdProfiles";
import { TUNING_CONCEPT_TIMING as CT, sec } from "../../timing";

/** Decelerating ease — fast out of the gate, long settle. The whole reason
 * the disclosure reads as expensive rather than as a CSS transition. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface CarouselCardProps {
  profile: TunedProfile;
  /** The Plus country pick, when there is one. Overrides the destination
   * label for profiles targeting a fixed country — see `sidebarSubtitle`,
   * which owns that rule so tuning and the sidebar can't disagree. */
  selectedCountry: string | null;
  reduced: boolean;
}

/** One profile as a full-bleed card: its photograph IS the card, with the
 * identity resting on top of it and the configuration hidden until you look.
 *
 * The disclosure is a single motion, not two: the settings opening BENEATH
 * the identity block is what pushes that block upward, so the name travels
 * because the details arrived rather than as a separate animation that has
 * to be kept in sync with them.
 *
 * Opens on focus as well as hover. A hover-only disclosure would put this
 * card's entire configuration out of reach of anyone tabbing through.
 *
 * Row labels here carry no (i) tooltips, unlike the Profile-first preview
 * card's identical rows. This panel is already a progressive-disclosure
 * layer; a second one nested inside it, on a surface that closes the moment
 * the pointer leaves, would be a trap rather than an affordance. */
export default function CarouselCard({ profile, selectedCountry, reduced }: CarouselCardProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = hovered || focused;

  const rows = profileConfigRows(profile.jtbd);
  const disclosure = reduced ? { duration: 0.15 } : { duration: sec(CT.carouselHoverMs), ease: EASE_OUT };

  return (
    <div
      className="group relative h-[312px] w-[280px] overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <motion.img
        src={PROFILE_PHOTO[profile.jtbd]}
        alt=""
        className="absolute inset-0 size-full object-cover"
        animate={{ scale: open && !reduced ? 1.06 : 1 }}
        transition={{ duration: reduced ? 0 : 0.6, ease: EASE_OUT }}
      />
      {/* Scrim. Deepens on open because the settings list needs a legible
          floor across all six photographs, not just the darkest ones. */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-[rgba(8,6,14,0.97)] via-[rgba(8,6,14,0.6)] to-[rgba(8,6,14,0.05)]"
        animate={{ opacity: open ? 1 : 0.82 }}
        transition={disclosure}
      />

      <div className="absolute inset-0 flex flex-col p-[14px]">
        {/* Absorbs the disclosure: as the settings grow, this shrinks, and
            the identity block rides upward with it. */}
        <div className="min-h-0 flex-1" />

        <div className="flex shrink-0 items-center gap-[10px]">
          <img src={profile.icon} alt="" className="size-[28px] shrink-0" />
          <div className="min-w-0">
            <p
              className="truncate font-['Segoe_UI_Variable',sans-serif] text-[17px] font-semibold leading-[22px] text-white"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {profile.name}
            </p>
            <p className="truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.72)]">
              {sidebarSubtitle(profile, selectedCountry)}
            </p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="details"
              className="shrink-0 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={disclosure}
            >
              <div className="flex flex-col gap-[7px] pt-[12px]">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-[12px]">
                    <span className="truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.62)]">
                      {row.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-[6px]">
                      {row.asset ? <img src={row.asset} alt="" className="size-[16px] shrink-0 object-contain" /> : null}
                      <span
                        className="font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-white"
                        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                      >
                        {row.value}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
