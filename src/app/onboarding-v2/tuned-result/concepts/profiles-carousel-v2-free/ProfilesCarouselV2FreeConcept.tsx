import * as Tooltip from "@radix-ui/react-tooltip";
import ConceptFrame from "../ConceptFrame";
import MaterializingSlot from "../../MaterializingSlot";
import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import BoundaryDivider from "../../BoundaryDivider";
import SettingChip from "../../profiles/SettingChip";
import CarouselTrack from "../profiles-carousel/CarouselTrack";
import FreeProfileCard from "./FreeProfileCard";
import FreeCardsPlaceholder from "./FreeCardsPlaceholder";
import { useProfilesCarouselV2FreeData } from "./useProfilesCarouselV2FreeData";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { narrateEnabling } from "../../copy";
import { TUNING_CONCEPT_TIMING as CT } from "../../timing";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import checkmarkUrl from "../../../assets/checkmark-circle-filled.svg";
import type { TuningConceptProps } from "../types";

export const PROFILES_CAROUSEL_V2_FREE_CONCEPT = "profiles-carousel-v2-free";

const C = TUNING_CONCEPTS_COPY.profilesCarouselV2Free;

/** One setting row's outer shape. Tighter vertically than `StackedLayout`'s
 * own `py-[12px]` rows, which is the concept's one layout compromise: this
 * screen has to fit two rows, a boundary band and a 240px card row inside
 * `ConceptFrame`'s 440px body, and 4px per row is the cheapest place to find
 * it. */
const ROW_CLASS = "flex w-full items-start gap-[16px] py-[10px]";

/** "Profiles carousel v2" for Free runs — the thirteenth concept, and the
 * first gated to Free rather than to Plus (`FREE_ONLY_TUNING_CONCEPTS`).
 *
 * v2 is Plus-only for a reason that isn't cosmetic: its per-card Connect
 * leaves onboarding connected to that profile, its per-card dropdown offers
 * any Plus country, and not one of its six profiles is fully deliverable on
 * Free — every one needs at least one Plus thing. Rendering it to a Free user
 * wouldn't be a degraded version of the concept, it would be a false one.
 *
 * So this is not v2 with things disabled. It inverts v2's hierarchy. v2's
 * claim is that the profiles ARE the outcome and there's nothing else on the
 * screen; here the outcome is **the two settings that were genuinely
 * applied**, stated first, in the same applied-row treatment the default
 * concept uses — and the profiles sit below a boundary, dimmed and badged, as
 * a preview of what the upsell that follows is actually selling.
 *
 * Which means the two halves of this screen are doing two different jobs, and
 * both are honest: the settings are the personalization illusion (they really
 * did happen, and they're the only two free settings the data models), and
 * the profiles are the upsell bridge (real objects, correctly named, built
 * from this user's own picks, and not yet theirs). Those are the two
 * non-negotiables every Free-capable concept in this codebase has to satisfy;
 * v2 satisfies neither, which is why it needed a sibling rather than a flag.
 *
 * Continue has one destination — the upsell — because a Plus run can never
 * select this concept, exactly mirroring how the Plus-only concepts have one
 * destination and take no `userPlan`. */
export default function ProfilesCarouselV2FreeConcept({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  tone = "straightforward",
  onContinue,
  onBack,
}: TuningConceptProps) {
  const reduced = useReducedMotion();
  const data = useProfilesCarouselV2FreeData(jtbdKey, selectionMode, selectedJtbds, tone, reduced);
  const { settingRows, profiles, profilesIndex, rowStages, rowMounted, boundaryVisible } = data;

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILES_CAROUSEL_V2_FREE_CONCEPT}
        jtbdKey={jtbdKey}
        selectionMode={selectionMode}
        selectedJtbds={selectedJtbds}
        data={data}
        reduced={reduced}
        onBack={onBack}
        onContinue={onContinue}
        bodyMaxWidthClassName="max-w-[900px]"
      >
        {/* The applied settings. Deliberately the same shape as the default
            concept's own resolved rows — check, tone-voiced outcome, then the
            `{label}: {value}` pill with its explanation — because this is the
            one part of the screen that is a plain statement of what happened,
            and it should look like every other place this product states
            that. */}
        <div className="flex w-full flex-col">
          {settingRows.map((row) =>
            rowMounted[row.index] ? (
              <MaterializingSlot
                key={row.setting.label}
                stage={rowStages[row.index]}
                reduced={reduced}
                className={ROW_CLASS}
                phase1Content={<PhaseOnePlaceholder narration={narrateEnabling(row.setting.label)} spinnerSize={20} />}
                resolvedContent={
                  <div className="flex w-full items-start gap-[16px]">
                    <div className="flex min-w-0 flex-1 items-start gap-[8px]">
                      <img src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
                      <span
                        className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white"
                        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
                      >
                        {row.outcome}
                      </span>
                    </div>
                    <SettingChip setting={row.setting} />
                  </div>
                }
              />
            ) : null,
          )}
        </div>

        {/* The shared free/Plus boundary widget, carrying this concept's own
            heading instead of `plusSectionHeader`'s. It states the count and
            the reason the cards below are dim in one line, so the dimming is
            never left for the user to interpret. */}
        <BoundaryDivider visible={boundaryVisible} reduced={reduced} header={C.profilesBandHeader(profiles.length)} />

        {rowMounted[profilesIndex] ? (
          <MaterializingSlot
            stage={rowStages[profilesIndex]}
            reduced={reduced}
            // `w-full` is load-bearing, not decoration: `ConceptFrame`'s body
            // column is `items-center`, so a slot without an explicit width
            // shrinks to its content — and `CarouselTrack` sizes itself from
            // its parent, so the two would size each other in a circle and
            // the track's overflow and centring logic would never see the
            // real available width.
            className="w-full"
            phase1Content={<FreeCardsPlaceholder reduced={reduced} />}
            resolvedContent={
              // v2's track, reused unchanged apart from the accessible name:
              // a 1–3 intent run gets a plain centred row with no carousel
              // affordances, and a 5–6 intent run grows arrows and edge fades
              // because it needs them. `focusIndex` is deliberately not
              // passed — nothing here builds one card at a time, so there's no
              // loading card to keep in view.
              <CarouselTrack reduced={reduced} label={C.carouselLabel}>
                {profiles.map((profile, i) => (
                  <FreeProfileCard
                    key={profile.id}
                    profile={profile}
                    reduced={reduced}
                    // Left to right, so the group's one freshness sweep reads
                    // as the cards arriving in order rather than as a single
                    // flash across the whole row.
                    sweepDelayMs={i * CT.carouselFreshnessStaggerMs}
                  />
                ))}
              </CarouselTrack>
            }
          />
        ) : null}
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
