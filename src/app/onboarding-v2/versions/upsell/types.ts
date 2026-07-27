import type { JTBDKey } from "../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../lib/jtbdData";

/** Shared contract every alternative upsell layout implements — mirrors
 * `VPNPlusUpsell`'s own props exactly (that component is untouched and
 * stays the default option), so the parent (`OnboardingV2`) can render
 * whichever layout is selected without any per-layout special-casing
 * beyond the switch itself. */
export interface UpsellVersionProps {
  jtbdKey: JTBDKey;
  /** "Selection" prototype control — defaults to `"single"`. `"multiple"`
   * only changes anything once `selectedJtbds.length >= 2` (same gate the
   * default upsell and Tuned Result already use). */
  selectionMode?: SelectionMode;
  /** Multiple mode only — the full ordered selection (first-selected
   * first). Ignored in single mode. */
  selectedJtbds?: JTBDKey[];
  /** Get VPN Plus → the existing web-checkout flow (unchanged). */
  onUpgrade: () => void;
  /** Continue free → the existing free-tier landing (unchanged). */
  onContinueFree: () => void;
  /** Back → return to the Tuned Result screen. */
  onBack: () => void;
}
