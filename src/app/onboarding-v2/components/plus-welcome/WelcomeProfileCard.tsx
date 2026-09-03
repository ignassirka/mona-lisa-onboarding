import { motion, type Variants } from "motion/react";
import ProfileIconTile from "../../tuned-result/concepts/profiles-carousel-v2/ProfileIconTile";
import { PROFILE_CARD_PHOTO, profileChips } from "../../lib/jtbdProfileMatrix";
import { TUNING_CONCEPTS_COPY } from "../../tuned-result/conceptsCopy";
import { PLUS_WELCOME_PROFILES_COPY } from "../../lib/plusWelcomeCopy";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import type { TunedProfile } from "../../lib/jtbdProfiles";

export const WELCOME_PROFILE_CARD_W = 280;

/** Standard showcase height — tall enough to feel like the hero object on
 * screen, shorter than the tuning carousel's 430 because there's no country
 * control eating the footer. */
export const WELCOME_PROFILE_CARD_H = 400;

/** Soft teal rim + glow — the unlocked counterpart to the upsell card's
 * Plus-violet "behind a gate" treatment. Full-strength artwork either way;
 * only the signal changes from "could be yours" to "yours now". */
const RIM = "inset 0 0 0 1px rgba(44,255,204,0.38)";
const GLOW = "0 10px 32px rgba(44,255,204,0.14)";

const C2 = TUNING_CONCEPTS_COPY.profilesCarouselV2;

interface WelcomeProfileCardProps {
  profile: TunedProfile;
  variants?: Variants;
  className?: string;
}

/** One **unlocked** profile on the Plus Welcome screen — recognisably the
 * same card the user saw while tuning (artwork, icon tile, name, chips), but
 * with a welcoming unlocked treatment instead of the upsell's locked rim. */
export default function WelcomeProfileCard({ profile, variants, className = "" }: WelcomeProfileCardProps) {
  const chips = profileChips(profile.id);

  return (
    <motion.div
      variants={variants}
      className={`relative shrink-0 overflow-hidden rounded-[16px] bg-[#0b0912] ${className}`}
      style={{ width: WELCOME_PROFILE_CARD_W, height: WELCOME_PROFILE_CARD_H, boxShadow: `${RIM}, ${GLOW}` }}
    >
      <img src={PROFILE_CARD_PHOTO[profile.id]} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,6,14,0.92)] via-[rgba(8,6,14,0.25)] to-[rgba(8,6,14,0.5)]" />

      <div className="absolute inset-0 flex flex-col px-[16px] pt-[16px] pb-[14px]">
        <ProfileIconTile profileId={profile.id} />

        <p
          className="mt-[8px] min-w-0 truncate font-['Segoe_UI_Variable',sans-serif] text-[26px] font-semibold leading-[32px] text-white"
          style={{ fontVariationSettings: "'opsz' 24", fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {profile.name}
        </p>

        <p className="mt-[6px] truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.72)]">
          {C2.hoverSubtitle[profile.id]}
        </p>

        {chips.length > 0 && (
          <div className="mt-[10px] flex flex-wrap gap-[6px]">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-[4px] border border-[rgba(255,255,255,0.16)] bg-[rgba(12,10,18,0.55)] px-[8px] py-[3px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-medium leading-[16px] text-white backdrop-blur-[2px]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <img src={checkmarkUrl} alt="" aria-hidden className="absolute right-[12px] top-[12px] size-[22px]" />
      <span className="sr-only">{`${profile.name} — ${PLUS_WELCOME_PROFILES_COPY.profileReadyLabel}`}</span>
    </motion.div>
  );
}
