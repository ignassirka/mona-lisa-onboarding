import InfoTooltip from "../../../versions/upsell/lib/InfoTooltip";
import { PROFILE_PHOTO, profileConfigRows } from "../../../lib/jtbdProfileConfig";
import { sidebarSubtitle, type TunedProfile } from "../../../lib/jtbdProfiles";

interface ProfilePreviewCardProps {
  profile: TunedProfile;
  /** The Plus country pick, when there is one. Overrides the destination
   * label for profiles that target a fixed country — see `sidebarSubtitle`,
   * which owns that rule so tuning and the sidebar can't disagree. */
  selectedCountry: string | null;
}

/** The focused preview of one profile: photograph on the left carrying the
 * profile's identity, configuration on the right.
 *
 * The identity block sits ON the image rather than beside it so the name and
 * destination are unmistakably attached to that image — with six tabs sharing
 * one card frame, a caption underneath would read as a card title instead of
 * as this profile's name.
 *
 * Row labels carry the (i) explanation, not the values: the value column stays
 * a clean right-aligned scan of what changed, which is what makes switching
 * tabs legible as a comparison. */
export default function ProfilePreviewCard({ profile, selectedCountry }: ProfilePreviewCardProps) {
  const rows = profileConfigRows(profile.jtbd);

  return (
    <div className="flex w-full flex-col gap-[14px] rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-[14px] @[720px]:flex-row @[720px]:gap-[24px]">
      <div className="relative h-[204px] shrink-0 overflow-hidden rounded-[12px] @[720px]:w-[340px]">
        <img src={PROFILE_PHOTO[profile.jtbd]} alt="" className="absolute inset-0 size-full object-cover" />
        {/* Scrim — the photographs are already dark, but their bottom-left
            corners vary enough that the name needs a guaranteed floor. */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[rgba(8,6,14,0.92)] via-[rgba(8,6,14,0.55)] to-transparent" />
        <div className="absolute inset-x-[14px] bottom-[12px] flex items-center gap-[10px]">
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
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-[14px] @[720px]:pr-[10px]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-[16px]">
            <span className="flex min-w-0 items-center gap-[4px]">
              <span className="truncate font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.7)]">
                {row.label}
              </span>
              <InfoTooltip content={row.tooltip} />
            </span>
            <span className="flex shrink-0 items-center gap-[8px]">
              {row.asset ? <img src={row.asset} alt="" className="size-[20px] shrink-0 object-contain" /> : null}
              <span
                className="font-['Segoe_UI_Variable',sans-serif] text-[15px] font-semibold leading-[20px] text-white"
                style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
              >
                {row.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
