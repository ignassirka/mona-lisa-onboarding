import { useEffect } from "react";
import { trackUpsellEvent } from "../../../lib/analytics";
import type { JTBDKey } from "../../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../../lib/jtbdData";

/** Fires `upsell_view` once per mount, tagged with the active layout's
 * `version` id — every alternative calls this so view analytics are
 * automatic and consistent, without each layout re-implementing the
 * effect. */
export function useTrackUpsellView(version: string, jtbdKey: JTBDKey, selectionMode: SelectionMode, selectionCount: number): void {
  useEffect(() => {
    trackUpsellEvent("upsell_view", { version, jtbdKey, selectionMode, selectionCount });
    // Fire once per mount only — intentionally not re-firing on content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
