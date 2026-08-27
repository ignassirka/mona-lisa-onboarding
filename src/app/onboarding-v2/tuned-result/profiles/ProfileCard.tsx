import type { ReactNode } from "react";
import DestinationChip from "./DestinationChip";
import SettingChip from "./SettingChip";
import { PLUS_AVAILABILITY_LABEL, compositionLine } from "./profilesCopy";
import type { ProfileSetting, TunedProfile } from "../../lib/jtbdProfiles";

export type ProfileCardSize = "tile" | "card" | "hero";
export type ProfileCardState = "locked" | "active" | "running";

interface ProfileCardProps {
  profile: TunedProfile;
  size: ProfileCardSize;
  state: ProfileCardState;
  /** Which sentence to show. Concepts framing profiles as additions to a
   * visible baseline pass `"delta"` ("Everything above, plus…"); concepts
   * presenting them standalone pass `"effect"`. */
  sentence?: "effect" | "delta" | "none";
  /** The derived "1 country · N settings" line. */
  showComposition?: boolean;
  /** The destination and setting chips. */
  showContents?: boolean;
  /** REQUIRED when `showContents` is true. Must be the output of
   * `effectiveProfileSettings` — the card deliberately does NOT derive
   * settings from `profile` itself, because that would let a caller render a
   * value weaker than the applied baseline. Keeping it a prop puts the rule
   * at the component boundary instead of trusting every call site. */
  settings?: ProfileSetting[];
  /** Marks the destination Plus-only when this plan can't reach it. */
  planAware?: boolean;
  onClick?: () => void;
  /** Per-concept actions (Try, Keep, Rehearse), rendered under the body. */
  footer?: ReactNode;
  className?: string;
}

const PAD: Record<ProfileCardSize, string> = {
  tile: "p-[14px]",
  card: "p-[16px]",
  hero: "p-[20px]",
};

const NAME_TEXT: Record<ProfileCardSize, string> = {
  tile: "text-[15px] leading-[20px]",
  card: "text-[16px] leading-[22px]",
  hero: "text-[20px] leading-[26px]",
};

const ICON_SIZE: Record<ProfileCardSize, string> = {
  tile: "size-[20px]",
  card: "size-[24px]",
  hero: "size-[28px]",
};

/** One profile, presented as an object with parts. Three sizes so the
 * Baseline's tile grid, the Shelf's gallery and the Deck's focused card
 * share one implementation and can't drift apart visually.
 *
 * `state="locked"` uses the same aspiration treatment as the existing locked
 * rows — dimmed glyph, muted text, "Available with VPN Plus" — and never an
 * error style, since a Plus feature isn't a failure. */
export default function ProfileCard({
  profile,
  size,
  state,
  sentence = "none",
  showComposition = false,
  showContents = false,
  settings,
  planAware = false,
  onClick,
  footer,
  className = "",
}: ProfileCardProps) {
  const locked = state === "locked";
  const running = state === "running";

  const sentenceText =
    sentence === "effect" ? profile.effectSentence : sentence === "delta" ? profile.deltaSentence : null;

  const border = running
    ? "border-[rgba(109,74,255,0.6)]"
    : locked
      ? "border-[rgba(255,255,255,0.08)]"
      : "border-[rgba(255,255,255,0.14)]";
  const bg = running ? "bg-[rgba(109,74,255,0.08)]" : "bg-[rgba(255,255,255,0.03)]";

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`flex w-full flex-col gap-[10px] rounded-[12px] border text-left ${border} ${bg} ${PAD[size]} ${
        onClick ? "cursor-pointer transition-colors duration-150 hover:border-[rgba(255,255,255,0.24)]" : ""
      } ${className}`}
    >
      {/* Identity — glyph and name. Identity is carried by these two, never
          by colour, so the card stays readable at a single accent. */}
      <div className="flex items-center gap-[10px]">
        <img src={profile.icon} alt="" className={`${ICON_SIZE[size]} shrink-0 ${locked ? "opacity-45" : "opacity-90"}`} />
        <span
          className={`min-w-0 flex-1 truncate font-['Segoe_UI_Variable',sans-serif] font-semibold ${NAME_TEXT[size]} ${
            locked ? "text-[rgba(255,255,255,0.6)]" : "text-white"
          }`}
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {profile.name}
        </span>
      </div>

      {showContents ? (
        <div className="flex flex-wrap items-center gap-[6px]">
          <DestinationChip profile={profile} planAware={planAware} size={size === "tile" ? "sm" : "md"} />
          {settings?.map((setting) => (
            <SettingChip key={setting.label} setting={setting} muted={locked} size="sm" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-[6px]">
          <DestinationChip profile={profile} planAware={planAware} size={size === "tile" ? "sm" : "md"} />
        </div>
      )}

      {sentenceText ? (
        <p
          className={`font-['Segoe_UI_Variable',sans-serif] ${
            size === "tile" ? "text-[13px] leading-[18px]" : "text-[14px] leading-[20px]"
          } ${locked ? "text-[rgba(255,255,255,0.5)]" : "text-[rgba(255,255,255,0.75)]"}`}
        >
          {sentenceText}
        </p>
      ) : null}

      {showComposition && settings ? (
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.4)]">
          {compositionLine(settings.length)}
        </span>
      ) : null}

      {locked ? (
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-[rgba(255,255,255,0.45)]">
          {PLUS_AVAILABILITY_LABEL}
        </span>
      ) : null}

      {footer}
    </Wrapper>
  );
}
