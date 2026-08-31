import CardShimmer from "./CardShimmer";
import CardHalo from "./CardHalo";
import GenerationDotGrid from "./GenerationDotGrid";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";

const C = TUNING_CONCEPTS_COPY.profilesCarousel;

/** Phase-1 placeholder for one v2 profile card — same footprint as
 * `CarouselCardV2`'s outer shape (430x280, same radius, border and fill) so
 * the spinner→resolved crossfade never jumps. Narrates THIS profile by name
 * rather than a generic "Creating your profile…", since several of these sit
 * in the carousel at once (one resolved, one spinning, several not yet
 * mounted) and a generic line wouldn't say which is which.
 *
 * Three layers make the box read as a card being built rather than an empty
 * slot: `GenerationDotGrid` (a scanning dot field — the reference's
 * "assembly" texture), `CardHalo` (light from within), and the looping
 * `CardShimmer` (a band passing over). The per-profile narration sits
 * centered with no spinner — the dot grid and shimmer carry the loading
 * feel. All three decorative layers run entirely inside
 * `carouselCardSpinnerMs` and stop when this placeholder unmounts. */
export default function CarouselCardV2Placeholder({
  profileName,
  reduced,
}: {
  profileName: string;
  reduced: boolean;
}) {
  return (
    <div className="relative flex h-[430px] w-[280px] items-center justify-center overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[14px]">
      <GenerationDotGrid reduced={reduced} />
      {/* Behind the narration, because it's the card's own lighting rather than
          something laid over its contents. The band that follows stays on top —
          it's a pass over the whole card, footer and all. */}
      <CardHalo reduced={reduced} />
      <div className="relative z-[1] flex size-full items-center justify-center px-[12px] text-center">
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.6)]">
          {C.cardNarration(profileName)}
        </span>
      </div>
      <CardShimmer mode="loop" reduced={reduced} />
    </div>
  );
}
