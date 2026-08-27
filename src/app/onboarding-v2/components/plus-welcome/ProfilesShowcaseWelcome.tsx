import { motion, type Variants } from "motion/react";
import AutoplayCarousel from "../../versions/upsell/profiles/AutoplayCarousel";
import WelcomeProfileCard, { WELCOME_PROFILE_CARD_W } from "./WelcomeProfileCard";
import { useUpsellProfiles } from "../../versions/upsell/profiles/useUpsellProfiles";
import { PLUS_WELCOME_PROFILES_COPY } from "../../lib/plusWelcomeCopy";
import type { JTBDKey } from "../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../lib/jtbdData";

const EASE = [0.22, 1, 0.36, 1] as const;

const bodyVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

interface ProfilesShowcaseWelcomeProps {
  jtbdKey: JTBDKey;
  selectionMode?: SelectionMode;
  selectedJtbds?: JTBDKey[];
  reduced: boolean;
}

/** Plus Welcome — **Profiles showcase** layout. The carousel is the entire
 * body — unlocked profile cards front and centre, nothing beneath them. */
export default function ProfilesShowcaseWelcome({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  reduced,
}: ProfilesShowcaseWelcomeProps) {
  const { profiles } = useUpsellProfiles(jtbdKey, selectionMode, selectedJtbds);

  return (
    <motion.div
      initial={reduced ? undefined : "hidden"}
      animate={reduced ? undefined : "show"}
      variants={bodyVariants}
      className="flex w-full max-w-[720px] flex-col items-center"
    >
      <motion.div variants={itemVariants} className="w-full">
        <AutoplayCarousel
          items={profiles}
          itemWidth={WELCOME_PROFILE_CARD_W}
          ariaLabel={PLUS_WELCOME_PROFILES_COPY.carouselLabel(profiles.length)}
          dotLabel={(profile) => `Show ${profile.name} profile`}
          reduced={reduced}
          autoAdvanceMs={4500}
          rightEdgeFade={profiles.length > 1}
          renderItem={(profile) => <WelcomeProfileCard profile={profile} />}
        />
      </motion.div>
    </motion.div>
  );
}
