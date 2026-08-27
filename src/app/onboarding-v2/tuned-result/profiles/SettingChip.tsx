import InfoTooltip from "../../versions/upsell/lib/InfoTooltip";
import type { ProfileSetting } from "../../lib/jtbdProfiles";

interface SettingChipProps {
  setting: ProfileSetting;
  muted?: boolean;
  /** `"sm"` for tiles and dense grids, `"md"` to match the default
   * concept's own row pills. */
  size?: "sm" | "md";
}

/** The `{label}: {value}` pill. Visual language matches `SettingLabelPill`
 * in `layouts/StackedLayout.tsx` so a setting looks the same wherever it
 * appears; that component keeps its own copy deliberately, since the default
 * concept must stay untouched.
 *
 * Values passed here should come from `effectiveProfileSettings`, never a
 * profile's raw settings — see `jtbdProfiles.ts`. */
export default function SettingChip({ setting, muted = false, size = "md" }: SettingChipProps) {
  const labelColor = muted ? "text-[rgba(255,255,255,0.5)]" : "text-[rgba(255,255,255,0.7)]";
  const valueColor = muted ? "text-[rgba(255,255,255,0.5)]" : "text-white";
  const text = size === "sm" ? "text-[12px] leading-[16px]" : "text-[14px] leading-[20px]";
  const pad = size === "sm" ? "px-[8px] pb-[4px] pt-[3px]" : "px-[12px] pb-[7px] pt-[5px]";

  return (
    <span className={`flex shrink-0 items-center gap-[4px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] ${pad}`}>
      <span className={`font-['Segoe_UI_Variable',sans-serif] ${text} ${labelColor}`} style={{ fontFeatureSettings: '"rclt" 0' }}>
        {setting.label}
      </span>
      <span className={`font-['Segoe_UI_Variable',sans-serif] ${text} ${labelColor}`}>:</span>
      <span
        className={`font-['Segoe_UI_Variable',sans-serif] ${text} font-semibold ${valueColor}`}
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {setting.value}
      </span>
      {setting.tooltip ? <InfoTooltip content={setting.tooltip} /> : null}
    </span>
  );
}
