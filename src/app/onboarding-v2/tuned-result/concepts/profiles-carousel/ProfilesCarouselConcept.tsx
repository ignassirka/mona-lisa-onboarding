import * as Tooltip from "@radix-ui/react-tooltip";
import { motion } from "motion/react";
import ConceptFrame from "../ConceptFrame";
import MaterializingSlot from "../../MaterializingSlot";
import CarouselTrack from "./CarouselTrack";
import CarouselCard from "./CarouselCard";
import CarouselCardPlaceholder from "./CarouselCardPlaceholder";
import GlobalSettingRow from "./GlobalSettingRow";
import { useProfilesCarouselData } from "./useProfilesCarouselData";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { TUNING_CONCEPT_TIMING as CT, sec } from "../../timing";
import checkmarkUrl from "../../../assets/checkmark-circle-filled.svg";
import type { TuningConceptProps } from "../types";

export const PROFILES_CAROUSEL_CONCEPT = "profiles-carousel";

const C = TUNING_CONCEPTS_COPY.profilesCarousel;

/** Decelerating ease — shared with the card's own disclosure so the entrance
 * and the hover feel like the same object moving. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface ProfilesCarouselConceptProps extends TuningConceptProps {
  /** The Plus country pick, when there is one — threaded to each card's
   * destination line, same as the Deck and Profile-first concepts. */
  selectedCountry?: string | null;
}

/** "Profiles carousel" — the second Plus-only tuning concept.
 *
 * Where Profile-first shows ONE profile in full and uses tabs to compare
 * them, this one commits to all of them at once: every profile is a full
 * card, photograph-first, and the settings that justify it are hidden until
 * you look. That inversion is the concept. The other profiles concepts ask
 * "what did we change for you"; this one asks "which of these do you want",
 * and answers the first question only on demand.
 *
 * Being Plus-only (`PLUS_ONLY_TUNING_CONCEPTS`) means nothing on a card is
 * locked and the two settings below the cards are live toggles rather than
 * claims. Continue below the carousel is the one exit; per-card Connect was
 * removed so picking a profile isn't presented as a mandatory action beside
 * it.
 *
 * Every card runs its OWN narrated spinner → resolve reveal, same
 * `MaterializingSlot` primitive every settings row elsewhere uses, just
 * shaped as a card — see `useProfilesCarouselData` for why that means this
 * concept can't delegate to the shared `useTunedMaterialization`. */
export default function ProfilesCarouselConcept({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  tone = "straightforward",
  selectedCountry = null,
  onContinue,
  onBack,
}: ProfilesCarouselConceptProps) {
  const reduced = useReducedMotion();
  const data = useProfilesCarouselData(jtbdKey, selectionMode, selectedJtbds, tone, reduced);
  const { profiles, globalSettings, carouselMounted, cardStages, cardMounted, globalRowMounted } = data;

  // The one card whose spinner is currently showing — cards resolve
  // strictly one at a time, so at most one index ever matches. `-1` between
  // cards (one just resolved, the next hasn't started yet) intentionally
  // maps to `undefined`, so the track doesn't snap anywhere during that gap.
  const generatingIndex = cardStages.indexOf("spinner");

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILES_CAROUSEL_CONCEPT}
        jtbdKey={jtbdKey}
        selectionMode={selectionMode}
        selectedJtbds={selectedJtbds}
        data={data}
        reduced={reduced}
        onBack={onBack}
        onContinue={onContinue}
        resolvedGlyph={<img src={checkmarkUrl} alt="" className="size-[40px]" />}
        bodyMaxWidthClassName="max-w-[900px]"
      >
        {carouselMounted ? (
          <div className="w-full pb-[14px]">
            <CarouselTrack reduced={reduced} focusIndex={generatingIndex >= 0 ? generatingIndex : undefined}>
              {profiles.map((profile, i) =>
                cardMounted[i] ? (
                  <MaterializingSlot
                    key={profile.id}
                    stage={cardStages[i]}
                    reduced={reduced}
                    className="shrink-0 snap-start"
                    enterFrom="right"
                    layoutAnimate
                    phase1Content={<CarouselCardPlaceholder profileName={profile.name} />}
                    resolvedContent={
                      <CarouselCard
                        profile={profile}
                        selectedCountry={selectedCountry}
                        reduced={reduced}
                      />
                    }
                  />
                ) : null,
              )}
            </CarouselTrack>
          </div>
        ) : null}

        {/* The app-wide settings no card accounts for — see
            `globalSettingsFor`, which is what guarantees that. Mounts only
            once every card above has resolved. */}
        <div className="flex w-full flex-col gap-[16px]" role="group" aria-label={C.globalSettingsLabel}>
          {globalSettings.map((setting, i) =>
            globalRowMounted[i] ? (
              <motion.div
                key={setting.id}
                initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.2 : sec(CT.carouselRowRiseMs), ease: EASE_OUT }}
              >
                <GlobalSettingRow setting={setting} reduced={reduced} />
              </motion.div>
            ) : null,
          )}
        </div>
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
