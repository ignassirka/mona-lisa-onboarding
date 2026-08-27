import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import GenerationDotGrid from "../profiles-carousel-v2/GenerationDotGrid";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";

const C = TUNING_CONCEPTS_COPY.profilesCarousel;

/** Phase-1 placeholder for one profile card — same footprint as
 * `CarouselCard`'s own outer shape (`h-[312px] w-[280px]`, same radius,
 * border and fill) so the spinner→resolved crossfade never jumps. Narrates
 * THIS profile by name rather than a generic "Creating your profile…",
 * since several of these sit in the carousel at once (one resolved, one
 * spinning, several not yet mounted) and a generic line wouldn't say which
 * is which. */
export default function CarouselCardPlaceholder({ profileName }: { profileName: string }) {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex h-[312px] w-[280px] items-center justify-center overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[14px]">
      <GenerationDotGrid reduced={reduced} />
      <div className="relative z-[1] flex size-full items-center justify-center">
        <PhaseOnePlaceholder narration={C.cardNarration(profileName)} arrangement="block" spinnerSize={22} />
      </div>
    </div>
  );
}
