import { useEffect, useRef, useState } from "react";
import { type JTBDKey } from "../../../lib/jtbdTuningResult";
import { profilesForSelection, type TunedProfile } from "../../../lib/jtbdProfiles";
import { TUNED_RESULT_TIMING as T, TUNING_CONCEPT_TIMING as CT } from "../../timing";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { introSubtext } from "../../copy";
import type { RowStage } from "../../useTunedMaterialization";
import type { JtbdId, SelectionMode } from "../../../lib/jtbdData";
import type { ToneOfVoice } from "../../../lib/toneOfVoice";
import type { ConceptFrameData } from "../types";

const C = TUNING_CONCEPTS_COPY.profilesCarousel;

/** One profile's full spinner→resolve cycle, in ms — see `timing.ts`. */
const CARD_CYCLE_MS = CT.carouselCardSpinnerMs + CT.carouselCardResolveMs + CT.carouselCardGapMs;
/** Reduced-motion cadence — no spinner phase, just a faster sequential fade,
 * matching the `reducedCadence` every other concept's schedule uses. */
const REDUCED_CADENCE = 500;

export interface ProfilesCarouselV2Data extends ConceptFrameData {
  /** One per selected intent, in selection order — the carousel. Always at
   * least 1. */
  profiles: TunedProfile[];
  /** True once the carousel section itself should mount (right when the
   * header lands at the top) — cards individually gate on `cardMounted`
   * below, but the surrounding track can appear immediately. */
  carouselMounted: boolean;
  /** Per-profile reveal stage — `undefined` until that profile's turn
   * arrives, then `"spinner"` then `"resolved"`. Cards resolve strictly ONE
   * AT A TIME, never in parallel, so the reveal reads as labor happening
   * rather than as a single sweep. */
  cardStages: RowStage[];
  /** Parallel to `cardStages` — whether a card has been mounted at all
   * (distinct from resolved, so its materializing slot exists before its
   * spinner phase starts). */
  cardMounted: boolean[];
}

/** Content resolution for "Profiles carousel v2".
 *
 * A fork of `useProfilesCarouselData` rather than a parameterization of it,
 * for one structural reason: v1's schedule ends with two app-wide setting
 * rows rising in after the last card, and v2 HAS no rows — the cards are the
 * entire outcome. That isn't a flag, it's a different shape of schedule:
 * here `rowsComplete` (and so the header's checkmark, the summary line and
 * Continue) hangs directly off the last card resolving.
 *
 * Everything that governs FEEL is still shared, deliberately: the same
 * header-intro timing (`T.centerHold`/`T.moveToTop`/`T.reducedIntroHold`),
 * the same per-card `CT.carouselCard*` constants, the same
 * `T.continueGapAfterTip` and the same reduced-motion cadence — so switching
 * between v1 and v2 never feels like a pacing change on the parts they share.
 *
 * Like v1, this does NOT delegate to the shared `useTunedMaterialization`:
 * that hook assumes every row takes the same fixed duration, whereas the
 * carousel's duration is `profiles.length * CARD_CYCLE_MS` and therefore
 * genuinely variable (a 6-intent run legitimately takes 6x as long as a
 * 1-intent one). */
export function useProfilesCarouselV2Data(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode,
  selectedJtbds: JTBDKey[] | undefined,
  tone: ToneOfVoice,
  reduced: boolean,
): ProfilesCarouselV2Data {
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;
  const effectiveSelection: JtbdId[] = isMultipleActive ? selectedJtbds! : [jtbdKey];

  const profiles = profilesForSelection(effectiveSelection);

  const cardCount = profiles.length;
  const scheduleKey = effectiveSelection.join(",");

  const [introDone, setIntroDone] = useState(false);
  const [carouselMounted, setCarouselMounted] = useState(false);
  const [cardStages, setCardStages] = useState<RowStage[]>(() => Array(cardCount).fill(undefined) as RowStage[]);
  const [cardMounted, setCardMounted] = useState<boolean[]>(() => Array(cardCount).fill(false));
  const [rowsComplete, setRowsComplete] = useState(false);
  const timers = useRef<number[]>([]);

  const introToRowsDelayMs = reduced ? T.reducedIntroHold : T.centerHold + T.moveToTop;
  const introDoneDelayMs = reduced ? T.reducedIntroHold : T.centerHold;

  useEffect(() => {
    const id = window.setTimeout(() => setIntroDone(true), introDoneDelayMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleKey, reduced]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setCarouselMounted(false);
    setCardStages(Array(cardCount).fill(undefined) as RowStage[]);
    setCardMounted(Array(cardCount).fill(false));
    setRowsComplete(false);

    const schedule = (fn: () => void, delay: number) => timers.current.push(window.setTimeout(fn, delay));
    const setCardStage = (i: number, stage: RowStage) =>
      setCardStages((prev) => {
        const next = [...prev];
        next[i] = stage;
        return next;
      });
    const mountCard = (i: number) => setCardMounted((prev) => (prev[i] ? prev : prev.map((v, idx) => (idx === i ? true : v))));

    let t = introToRowsDelayMs;
    schedule(() => setCarouselMounted(true), t);

    if (reduced) {
      // No spinner phase, resolved state only — faster, sequential fade.
      for (let i = 0; i < cardCount; i++) {
        schedule(() => {
          mountCard(i);
          setCardStage(i, "resolved");
        }, t);
        t += REDUCED_CADENCE;
      }
    } else {
      // Strictly sequential — one card's spinner starts only after the
      // PREVIOUS card has resolved, never in parallel, so the reveal reads
      // as one profile being built after another rather than a batch job.
      for (let i = 0; i < cardCount; i++) {
        schedule(() => {
          mountCard(i);
          setCardStage(i, "spinner");
        }, t);
        t += CT.carouselCardSpinnerMs;
        schedule(() => setCardStage(i, "resolved"), t);
        t += CT.carouselCardResolveMs + CT.carouselCardGapMs;
      }
    }

    schedule(() => setRowsComplete(true), t);

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleKey, reduced, cardCount]);

  // The same formula the effect above schedules against, computed
  // synchronously so `continueDelayMs` (a framer-motion transition delay,
  // not a state value) is correct on the very first render.
  const cardsTotalMs = reduced ? cardCount * REDUCED_CADENCE : cardCount * CARD_CYCLE_MS;
  const rowsEndMs = introToRowsDelayMs + cardsTotalMs;
  const continueDelayMs = rowsEndMs + (reduced ? REDUCED_CADENCE : T.continueGapAfterTip);

  const appliedSoFar = cardMounted.filter(Boolean).length;

  return {
    profiles,
    carouselMounted,
    cardStages,
    cardMounted,

    introDone,
    rowsComplete,
    appliedSoFar,
    totalRows: cardCount,
    isMultipleActive,
    continueDelayMs,
    selectionCount: effectiveSelection.length,

    titleDuringText: C.titleDuring,
    titleCompleteText: C.titleComplete(profiles.length),
    introText: introSubtext(tone),
    summaryText: C.summary,
    counterText: () => C.loadingSubtitle,
  };
}
