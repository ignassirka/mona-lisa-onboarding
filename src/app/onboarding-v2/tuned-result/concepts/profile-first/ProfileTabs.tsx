import { motion } from "motion/react";
import { JTBD_ICONS } from "../../../versions/lib/jtbdIcons";
import type { ProfileId } from "../../../lib/jtbdData";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

interface ProfileTabsProps {
  profiles: TunedProfile[];
  activeProfileId: ProfileId;
  onSelect: (profileId: ProfileId) => void;
  /** Ties each tab to the panel it controls, for assistive tech. */
  panelId: string;
  reduced: boolean;
  label: string;
}

/** Above this many tabs, equal-width tabs would squeeze each label to the
 * point of truncation, so the strip switches to natural-width tabs that
 * scroll horizontally instead. */
const SCROLL_THRESHOLD = 4;

/** The profile switcher. Shown even for a single profile: the tab is what
 * tells the user that a profile is a THING with a name, and hiding it for
 * one-intent runs would make that run look like a different concept.
 *
 * The active pill travels between tabs via a shared `layoutId` rather than
 * fading in place, so the eye follows the selection instead of re-finding it. */
export default function ProfileTabs({ profiles, activeProfileId, onSelect, panelId, reduced, label }: ProfileTabsProps) {
  const scrolls = profiles.length > SCROLL_THRESHOLD;

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex w-full items-stretch gap-[4px] ${scrolls ? "overflow-x-auto pb-[4px]" : ""}`}
    >
      {profiles.map((profile) => {
        const active = profile.id === activeProfileId;
        return (
          <button
            key={profile.id}
            type="button"
            role="tab"
            id={`${panelId}-tab-${profile.id}`}
            aria-selected={active}
            aria-controls={panelId}
            onClick={() => onSelect(profile.id)}
            className={`relative flex min-w-0 items-center justify-center gap-[8px] rounded-[8px] px-[14px] pb-[9px] pt-[8px] outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-white/40 ${
              scrolls ? "shrink-0" : "flex-1"
            } ${active ? "" : "hover:bg-[rgba(255,255,255,0.05)]"}`}
          >
            {active && (
              <motion.span
                layoutId={reduced ? undefined : "profile-first-tab-pill"}
                className="absolute inset-0 rounded-[8px] bg-[rgba(255,255,255,0.10)]"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              />
            )}
            <img src={JTBD_ICONS[profile.jtbd]} alt="" className="relative h-[18px] w-[27px] shrink-0 object-contain" />
            <span
              className={`relative min-w-0 truncate font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] ${
                active ? "font-semibold text-white" : "text-[rgba(255,255,255,0.65)]"
              }`}
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {profile.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
