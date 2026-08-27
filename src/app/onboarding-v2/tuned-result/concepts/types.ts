import type { JTBDKey } from "../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../lib/jtbdData";
import type { ToneOfVoice } from "../../lib/toneOfVoice";
import type { SessionPlan } from "../../../lib/sessionPlan";

/** Shared contract every alternative tuning concept implements — mirrors
 * `TunedResult`'s own props minus `layout` (each concept IS its own single
 * arrangement, not a `layout` choice within itself). */
export interface TuningConceptProps {
  jtbdKey: JTBDKey;
  selectionMode?: SelectionMode;
  selectedJtbds?: JTBDKey[];
  tone?: ToneOfVoice;
  /** Defaults to `"free"` — the behaviour the three original concepts
   * (progress-ring / checklist / receipt) have always had, unchanged: they
   * never pass this. The profiles concepts branch on it, since each has a
   * distinct Free and Plus state. */
  userPlan?: SessionPlan;
  onContinue: () => void;
  onBack: () => void;
}

/** The only fields `ConceptFrame` actually consumes. Extracted so both
 * concept data hooks — `useTuningConceptData` (the original three) and
 * `useProfilesConceptData` (the profiles family, which needs a different row
 * schedule) — can drive the same frame without either knowing about the
 * other, and without widening the frame's prop to a union. */
export interface ConceptFrameData {
  introDone: boolean;
  rowsComplete: boolean;
  appliedSoFar: number;
  totalRows: number;
  isMultipleActive: boolean;
  continueDelayMs: number;
  selectionCount: number;
  titleDuringText: string;
  titleCompleteText: string;
  introText: string;
  summaryText: string;
  counterText: (applied: number, total: number) => string;
}
