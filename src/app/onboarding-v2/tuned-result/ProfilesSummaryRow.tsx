import type { ProfilePreview } from "../lib/jtbdMerge";
import type { FeatureRowLayout } from "../components/EnabledFeatureRow";
import CircleSlashIcon from "./CircleSlashIcon";
import { PROFILES_INTRO_TEXT, PROFILES_READY_TEXT } from "./copy";
import checkmarkUrl from "../assets/checkmark-circle-filled.svg";

interface ProfilesSummaryRowProps {
  profiles: ProfilePreview[];
  /** Stage 3 ("Upgrade to Plus" welcome) only — renders the row's active/
   * unlocked visual (green check glyph, full-opacity/white pills) instead
   * of the locked "unavailable" treatment. Defaults to `false`, which is
   * the result screen's entire existing behavior, byte-for-byte — the
   * result screen never passes this prop. */
  unlocked?: boolean;
  layout?: FeatureRowLayout;
  /** Plus plan's stage-2 tuning result ONLY (`StackedLayout` passes
   * `paidUnlocked && !unlockTransition`) — swaps the intro text to the
   * "ready" framing (`PROFILES_READY_TEXT`) instead of the Free path's
   * "one-click potential" framing (`PROFILES_INTRO_TEXT`), since these
   * profiles are genuinely already created and live in the sidebar, not
   * just previewed. Defaults to `false`, which is every OTHER call site's
   * existing behavior, byte-for-byte — including stage 3's Plus Welcome,
   * which keeps its own unchanged copy even while `unlocked` is `true`
   * mid-animation there. */
  readyCopy?: boolean;
}

/** One tangible profile pill — intent icon + name — matching the exact
 * "asset + label" pill convention the sibling paid-feature rows use for
 * their right-side featureName pill, in either its LOCKED (dimmed icon,
 * muted text — the same "needs Plus"/disabled treatment as every other
 * locked row on this screen) or UNLOCKED (full-opacity icon, white text —
 * matching `PaidFeatureRow`/`TransformingPaidCell`'s own locked→unlocked
 * color convention) state. */
function ProfilePill({ profile, unlocked = false, size = 20 }: { profile: ProfilePreview; unlocked?: boolean; size?: number }) {
  return (
    <span className="flex shrink-0 items-end justify-center gap-[8px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px]">
      <img
        src={profile.icon}
        alt=""
        className={`shrink-0 object-contain transition-opacity duration-500 ${unlocked ? "opacity-100" : "opacity-50"}`}
        style={{ width: size, height: size }}
      />
      <span
        className={`font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] transition-colors duration-500 ${unlocked ? "text-white" : "text-[rgba(255,255,255,0.5)]"}`}
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {profile.label}
      </span>
    </span>
  );
}

/** Multiple-mode Plus section's profiles row — same left "unavailable"
 * glyph (locked) or green check (unlocked, stage 3 only) + intro text as
 * every sibling locked/paid row on this screen, and ONE tangible pill per
 * selected interest on the right (intent icon + name — `ProfilePill`),
 * instead of a single "{M} profiles" count. Replaces the earlier one-line
 * "{M} profiles" count-pill design (see docs/features/onboarding-v2.md →
 * "Multiple-mode result curation" for the full history). */
export default function ProfilesSummaryRow({ profiles, unlocked = false, layout = "row", readyCopy = false }: ProfilesSummaryRowProps) {
  const introText = readyCopy ? PROFILES_READY_TEXT : PROFILES_INTRO_TEXT;
  const introTextClass = `transition-colors duration-500 ${unlocked ? "text-white" : "text-[rgba(255,255,255,0.5)]"}`;
  const leadIcon = unlocked ? (
    <img src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
  ) : (
    <CircleSlashIcon size={20} />
  );

  if (layout === "card") {
    return (
      <div className="relative flex h-full flex-col items-center justify-center gap-[8px] rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-[14px] text-center">
        {unlocked ? <img src={checkmarkUrl} alt="" className="size-[20px] shrink-0" /> : <CircleSlashIcon size={20} />}
        <span className={`font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] ${introTextClass}`}>{introText}</span>
        <div className="flex flex-wrap items-center justify-center gap-[6px]">
          {profiles.map((profile) => (
            <ProfilePill key={profile.jtbd} profile={profile} unlocked={unlocked} size={16} />
          ))}
        </div>
      </div>
    );
  }

  if (layout === "stacked") {
    return (
      <div className="relative flex w-full flex-col gap-[8px] rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-[12px] py-[10px]">
        <div className="flex items-center gap-[8px]">
          {unlocked ? <img src={checkmarkUrl} alt="" className="size-[18px] shrink-0" /> : <CircleSlashIcon size={18} />}
          <span className={`min-w-0 flex-1 font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] ${introTextClass}`}>{introText}</span>
        </div>
        <div className="flex flex-wrap items-center gap-[6px]">
          {profiles.map((profile) => (
            <ProfilePill key={profile.jtbd} profile={profile} unlocked={unlocked} size={16} />
          ))}
        </div>
      </div>
    );
  }

  // layout === "row" (default) — Stacked/Compact List. No outer box: matches
  // Stacked's own boxless free/paid rows (rows sit directly on the
  // gradient), confirmed at checkpoint. Icon+text is `shrink-0` +
  // `whitespace-nowrap` so it keeps its natural width no matter how many
  // pills there are (never squeezed/wrapped itself); the pills sit in the
  // remaining space on the right (`flex-1`, `justify-end`) and wrap onto
  // additional lines — each staying right-aligned, since `justify-content`
  // on a wrapping flex container applies per line — once they no longer fit
  // on one.
  return (
    <div className="flex w-full max-w-[800px] items-start gap-[16px]">
      <div className="flex shrink-0 items-center gap-[8px] whitespace-nowrap">
        {leadIcon}
        <span className={`font-['Segoe_UI_Variable',sans-serif] font-semibold ${introTextClass}`} style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
          {introText}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-[8px]">
        {profiles.map((profile) => (
          <ProfilePill key={profile.jtbd} profile={profile} unlocked={unlocked} />
        ))}
      </div>
    </div>
  );
}
