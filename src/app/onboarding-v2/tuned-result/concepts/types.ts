import type { JTBDKey } from "../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../lib/jtbdData";
import type { ToneOfVoice } from "../../lib/toneOfVoice";

/** Shared contract every alternative tuning concept implements — mirrors
 * `TunedResult`'s own props minus `userPlan`/`layout` (this screen's only
 * caller, `OnboardingV2`, always renders it with `userPlan="free"`; each
 * concept IS its own single arrangement, not a `layout` choice within
 * itself). */
export interface TuningConceptProps {
  jtbdKey: JTBDKey;
  selectionMode?: SelectionMode;
  selectedJtbds?: JTBDKey[];
  tone?: ToneOfVoice;
  onContinue: () => void;
  onBack: () => void;
}
