import { useEffect, useRef, useState } from "react";
import { type JTBDKey } from "../../../lib/jtbdTuningResult";
import { profilesForSelection, type TunedProfile } from "../../../lib/jtbdProfiles";
import { TUNED_RESULT_TIMING as T, TUNING_CONCEPT_TIMING as CT } from "../../timing";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { introSubtext } from "../../copy";
import { globalSettingsFor, type GlobalSetting } from "./globalSettings";
import type { RowStage } from "../../useTunedMaterialization";
import type { JtbdId, SelectionMode } from "../../../lib/jtbdData";
import type { ToneOfVoice } from "../../../lib/toneOfVoice";
import type { ConceptFrameData } from "../types";

const C = TUNING_CONCEPTS_COPY.profilesCarousel;

/** One profile's full spinner→resolve cycle, in ms — see `timing.ts`. */
const CARD_CYCLE_MS = CT.carouselCardSpinnerMs + CT.carouselCardResolveMs + CT.carouselCardGapMs;
/** Reduced-motion cadence for both cards and global rows — no spinner
 * phase, just a faster sequential fade, matching the `reducedCadence` every
 * other concept's schedule already uses. */
const REDUCED_CADENCE = 500;

export interface ProfilesCarouselData extends ConceptFrameData {
  /** One per selected intent, in selection order — the carousel. Always at
   * least 1. */
  profiles: TunedProfile[];
  /** The app-wide settings below the carousel — see `globalSettingsFor`. */
  globalSettings: GlobalSetting[];
  /** True once the carousel section itself should mount (right when the
   * header lands at the top) — cards individually gate on `cardMounted`
   * below, but the surrounding track/label can appear immediately. */
  carouselMounted: boolean;
  /** Per-profile reveal stage — `undefined` until that profile's turn
   * arrives, then `"spinner"` (narrating that specific profile being
   * built) then `"resolved"`. Cards resolve strictly ONE AT A TIME, never
   * in parallel — see `timing.ts`'s `carouselCard*` constants — so the
   * reveal reads as labor happening rather than as a single sweep. */
  cardStages: RowStage[];
  /** Parallel to `cardStages` — whether a card has been mounted at all
   * (distinct from resolved, so its own materializing slot exists before
   * its spinner phase starts). */
  cardMounted: boolean[];
  /** Parallel to `globalSettings` — mounts only once every card has
   * resolved. */
  globalRowMounted: boolean[];
}

/** Content resolution for the "Profiles carousel" concept.
 *
 * A sibling of `useProfileFirstData` for the same structural reason: there
 * are no baseline setting rows to emit. The cards carry their own
 * configuration (`profileConfigRows`), and the only settings shown
 * separately are the two app-wide ones no card accounts for.
 *
 * This hook does NOT delegate to the shared `useTunedMaterialization` —
 * deliberately, and for one reason: that hook assumes every "row" takes the
 * SAME fixed duration, whereas this concept's first "row" is the whole
 * carousel, whose duration is `profiles.length * CARD_CYCLE_MS` and
 * therefore genuinely variable (a 6-intent run's carousel legitimately
 * takes 6× as long to finish as a 1-intent run's). Forcing that into the
 * shared hook's fixed-per-row formula would either make a single profile
 * take as long as six, or make six profiles resolve as fast as one — both
 * wrong. What's still shared, deliberately, is every CONSTANT that governs
 * feel: the same header-intro timing (`T.centerHold`/`T.moveToTop`/
 * `T.reducedIntroHold`), the same `T.rowGap`/`T.continueGapAfterTip`, and
 * the same reduced-motion cadence, so switching between this concept and
 * any other never feels like a pacing regression on the parts they do
 * share.
 *
 * Sequencing: the header lands, then EVERY card resolves one at a time
 * (never in parallel — the whole point of the per-card spinner is to read
 * as labor, and six simultaneous spinners wouldn't), then the two global
 * setting rows rise in, then Continue appears. */
export function useProfilesCarouselData(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode,
  selectedJtbds: JTBDKey[] | undefined,
  tone: ToneOfVoice,
  reduced: boolean,
): ProfilesCarouselData {
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;
  const effectiveSelection: JtbdId[] = isMultipleActive ? selectedJtbds! : [jtbdKey];

  const profiles = profilesForSelection(effectiveSelection);
  const globalSettings = globalSettingsFor(effectiveSelection, tone);

  const cardCount = profiles.length;
  const globalCount = globalSettings.length;
  const scheduleKey = effectiveSelection.join(",");

  const [introDone, setIntroDone] = useState(false);
  const [carouselMounted, setCarouselMounted] = useState(false);
  const [cardStages, setCardStages] = useState<RowStage[]>(() => Array(cardCount).fill(undefined) as RowStage[]);
  const [cardMounted, setCardMounted] = useState<boolean[]>(() => Array(cardCount).fill(false));
  const [globalRowMounted, setGlobalRowMounted] = useState<boolean[]>(() => Array(globalCount).fill(false));
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
    setGlobalRowMounted(Array(globalCount).fill(false));
    setRowsComplete(false);

    const schedule = (fn: () => void, delay: number) => timers.current.push(window.setTimeout(fn, delay));
    const setCardStage = (i: number, stage: RowStage) =>
      setCardStages((prev) => {
        const next = [...prev];
        next[i] = stage;
        return next;
      });
    const mountCard = (i: number) => setCardMounted((prev) => (prev[i] ? prev : prev.map((v, idx) => (idx === i ? true : v))));
    const mountGlobalRow = (i: number) =>
      setGlobalRowMounted((prev) => (prev[i] ? prev : prev.map((v, idx) => (idx === i ? true : v))));

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

    const rowRiseMs = reduced ? REDUCED_CADENCE : CT.carouselRowRiseMs;
    const rowGap = reduced ? 0 : T.rowGap;
    for (let i = 0; i < globalCount; i++) {
      schedule(() => mountGlobalRow(i), t);
      t += rowRiseMs + rowGap;
    }

    schedule(() => setRowsComplete(true), t);

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleKey, reduced, cardCount, globalCount]);

  // The same formula the effect above schedules against, computed
  // synchronously so `continueDelayMs` (a framer-motion transition delay,
  // not a state value) is correct on the very first render.
  const cardsTotalMs = reduced ? cardCount * REDUCED_CADENCE : cardCount * CARD_CYCLE_MS;
  const rowRiseMs = reduced ? REDUCED_CADENCE : CT.carouselRowRiseMs;
  const rowGap = reduced ? 0 : T.rowGap;
  const rowsEndMs = introToRowsDelayMs + cardsTotalMs + globalCount * (rowRiseMs + rowGap);
  const continueDelayMs = rowsEndMs + (reduced ? REDUCED_CADENCE : T.continueGapAfterTip);

  const appliedSoFar = cardMounted.filter(Boolean).length + globalRowMounted.filter(Boolean).length;
  const totalRows = cardCount + globalCount;

  return {
    profiles,
    globalSettings,
    carouselMounted,
    cardStages,
    cardMounted,
    globalRowMounted,

    introDone,
    rowsComplete,
    appliedSoFar,
    totalRows,
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
