import * as Tooltip from "@radix-ui/react-tooltip";
import ConceptFrame from "../ConceptFrame";
import MaterializingSlot from "../../MaterializingSlot";
import CarouselTrack from "../profiles-carousel/CarouselTrack";
import CarouselCardV2 from "./CarouselCardV2";
import CarouselCardV2Placeholder from "./CarouselCardV2Placeholder";
import { useProfilesCarouselV2Data } from "./useProfilesCarouselV2Data";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import checkmarkUrl from "../../../assets/checkmark-circle-filled.svg";
import type { TuningConceptProps } from "../types";

export const PROFILES_CAROUSEL_V2_CONCEPT = "profiles-carousel-v2";

/** "Profiles carousel v2" — the third Plus-only tuning concept, and v1's
 * carousel taken to its conclusion.
 *
 * v1 hedges: it shows the profiles as cards, then puts two app-wide setting
 * rows underneath, so the screen still says "here is what we changed" in
 * parallel with "here is what you can use". v2 drops the rows entirely. The
 * profiles ARE the outcome, there is nothing else on the screen, and every
 * settings claim now lives inside the card it belongs to — reachable by
 * hovering the profile it describes rather than listed separately from it.
 *
 * What that buys, concretely: 108px of card height (used for a top-anchored
 * identity block, three feature chips and a real country dropdown), and a
 * single answer to "what did you change" instead of two competing ones.
 *
 * Being Plus-only (`PLUS_ONLY_TUNING_CONCEPTS`) means nothing on a card is
 * locked — every value it states is a value this run actually has. Continue
 * below the carousel is the one exit; per-card Connect was removed so picking
 * a profile isn't presented as a mandatory action beside it.
 *
 * The reveal choreography is v1's, unchanged — each card runs its own
 * narrated spinner, strictly one at a time, and the track follows whichever
 * is building. See `useProfilesCarouselV2Data` for the one thing that did
 * change: with no rows to rise in afterwards, completion hangs directly off
 * the last card. */
export default function ProfilesCarouselV2Concept({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  tone = "straightforward",
  onContinue,
  onBack,
}: TuningConceptProps) {
  const reduced = useReducedMotion();
  const data = useProfilesCarouselV2Data(jtbdKey, selectionMode, selectedJtbds, tone, reduced);
  const { profiles, carouselMounted, cardStages, cardMounted } = data;

  // The one card whose spinner is currently showing — cards resolve strictly
  // one at a time, so at most one index ever matches. `-1` between cards
  // (one just resolved, the next hasn't started) intentionally maps to
  // `undefined`, so the track doesn't snap anywhere during that gap.
  const generatingIndex = cardStages.indexOf("spinner");

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILES_CAROUSEL_V2_CONCEPT}
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
          <CarouselTrack reduced={reduced} focusIndex={generatingIndex >= 0 ? generatingIndex : undefined}>
            {profiles.map((profile, i) =>
              cardMounted[i] ? (
                <MaterializingSlot
                  key={profile.jtbd}
                  stage={cardStages[i]}
                  reduced={reduced}
                  className="shrink-0 snap-start"
                  enterFrom="right"
                  layoutAnimate
                  phase1Content={<CarouselCardV2Placeholder profileName={profile.name} reduced={reduced} />}
                  resolvedContent={
                    <CarouselCardV2 profile={profile} reduced={reduced} />
                  }
                />
              ) : null,
            )}
          </CarouselTrack>
        ) : null}
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
