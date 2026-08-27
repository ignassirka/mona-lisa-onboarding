import ProfileCard, { type ProfileCardSize } from "../../profiles/ProfileCard";
import type { ProfileSetting, TunedProfile } from "../../../lib/jtbdProfiles";

const MIN_H: Record<ProfileCardSize, string> = { tile: "min-h-[132px]", card: "min-h-[168px]", hero: "min-h-[200px]" };

interface ShelfCardProps {
  profile: TunedProfile;
  /** Must be `effectiveProfileSettings` output — a shelf shows every card at
   * once, so a raw value weaker than the baseline card's would put the
   * contradiction side by side in a single glance. */
  settings: ProfileSetting[];
  unlocked: boolean;
  size: ProfileCardSize;
}

/** One shelf cell. `sentence="effect"` rather than `"delta"`: on this shelf
 * cards stand alone as descriptions of themselves, so they use the
 * "Use this and Proton VPN connects you…" phrasing. The "Everything above,
 * plus…" delta phrasing belongs to the concepts that frame profiles relative
 * to a baseline bar sitting directly above them.
 *
 * At `size="tile"` (five or more cells) the per-card settings chips drop and
 * only the destination remains. That's a real information trade at exactly
 * the selection counts where a user picked the most, accepted to keep the
 * shelf's height stable. */
export default function ShelfCard({ profile, settings, unlocked, size }: ShelfCardProps) {
  const dense = size === "tile";

  return (
    <ProfileCard
      profile={profile}
      size={size}
      state={unlocked ? "active" : "locked"}
      sentence="effect"
      showContents={!dense}
      showComposition={!dense}
      settings={settings}
      planAware={!unlocked}
      className={MIN_H[size]}
    />
  );
}
