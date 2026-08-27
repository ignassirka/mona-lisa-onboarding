import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import CardShimmer from "../profiles-carousel-v2/CardShimmer";
import CardHalo from "../profiles-carousel-v2/CardHalo";
import { FREE_CARD_H } from "./FreeProfileCard";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";

const C = TUNING_CONCEPTS_COPY.profilesCarouselV2Free;

/** Phase-1 placeholder for this concept's whole card row.
 *
 * The row reserves the cards' exact height so the group crossfade doesn't jump,
 * but the SPINNER sits inside a single card-shaped box at v2's own 280px width
 * rather than floating in the middle of a full-width empty band. That shape is
 * what both loading effects need: a halo hugging an edge and a gradient masked
 * inside a card outline read as a card being made, while the same two across a
 * borderless region read as the page flashing.
 *
 * One box, not one per profile, because this concept resolves its cards as a
 * group — a row of skeletons would imply each is being built separately, which
 * is exactly the per-card beat the Plus carousel has and this one deliberately
 * doesn't. So the box is a stand-in for "your profiles", matching
 * `blockNarration`'s single line, and the real cards fan out from it. */
export default function FreeCardsPlaceholder({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex w-full items-center justify-center" style={{ height: FREE_CARD_H }}>
      <div
        className="relative flex w-[280px] items-center justify-center overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[14px]"
        style={{ height: FREE_CARD_H }}
      >
        <CardHalo reduced={reduced} />
        <PhaseOnePlaceholder narration={C.blockNarration} arrangement="block" spinnerSize={22} />
        <CardShimmer mode="loop" reduced={reduced} />
      </div>
    </div>
  );
}
