import { MapPin } from "lucide-react";
import vpnPlusBadgeUrl from "../../assets/vpn-plus-badge.svg";
import type { TunedProfile } from "../../lib/jtbdProfiles";

interface DestinationChipProps {
  profile: TunedProfile;
  /** When true, a destination the current plan can't reach carries the Plus
   * badge. Concepts pass `!paidUnlocked`. */
  planAware?: boolean;
  size?: "sm" | "md";
}

/** Where a profile puts you — `countryLabel`, plus the Plus badge when the
 * destination isn't reachable on this plan.
 *
 * The single place the "show the destination, always, by name" rule is
 * enforced: the country is never hidden or blurred, and the unavailable
 * state reads as aspiration rather than as an error. Centralized so no
 * concept can get this wrong independently. */
export default function DestinationChip({ profile, planAware = false, size = "md" }: DestinationChipProps) {
  const plusOnly = planAware && !profile.freeRunnable;
  const text = size === "sm" ? "text-[12px] leading-[16px]" : "text-[13px] leading-[18px]";
  const pad = size === "sm" ? "px-[8px] pb-[4px] pt-[3px]" : "px-[10px] pb-[5px] pt-[4px]";

  return (
    <span
      className={`flex min-w-0 items-center gap-[5px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] ${pad}`}
    >
      <MapPin
        size={size === "sm" ? 11 : 12}
        strokeWidth={2}
        className={`shrink-0 ${plusOnly ? "text-[rgba(255,255,255,0.4)]" : "text-[rgba(255,255,255,0.55)]"}`}
      />
      <span
        className={`truncate font-['Segoe_UI_Variable',sans-serif] ${text} ${plusOnly ? "text-[rgba(255,255,255,0.5)]" : "text-[rgba(255,255,255,0.8)]"}`}
      >
        {profile.countryLabel}
      </span>
      {plusOnly ? <img src={vpnPlusBadgeUrl} alt="Available with VPN Plus" className="h-[12px] w-[20px] shrink-0" /> : null}
    </span>
  );
}
