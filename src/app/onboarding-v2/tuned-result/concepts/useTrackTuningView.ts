import { useEffect } from "react";
import { trackTuningEvent } from "../../lib/analytics";
import type { JTBDKey } from "../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../lib/jtbdData";

/** Fires `tuning_view` once per mount, tagged with the active concept's
 * `concept` id — every alternative calls this (via `ConceptFrame`) so view
 * analytics are automatic and consistent, without each concept
 * re-implementing the effect. Mirrors `useTrackUpsellView`. */
export function useTrackTuningView(concept: string, jtbdKey: JTBDKey, selectionMode: SelectionMode, selectionCount: number): void {
  useEffect(() => {
    trackTuningEvent("tuning_view", { concept, jtbdKey, selectionMode, selectionCount });
    // Fire once per mount only — intentionally not re-firing on content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
