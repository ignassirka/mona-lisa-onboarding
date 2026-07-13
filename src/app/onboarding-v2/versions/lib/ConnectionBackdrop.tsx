import StatusGradient from "../../../../imports/StatusGradient";
import type { ConnectionPhase } from "../types";

/** Full-bleed opaque backdrop for the map-less versions (v4–v6). Reuses the
 * family `StatusGradient` (danger coral → neutral slate → protected teal) as a
 * top "sky" tint over the window base color, so these versions read as siblings
 * of v1–v3. The gradient colour crossfades on `phase` change (700ms, built into
 * StatusGradient). Flipped vertically (`scaleY(-1)`) to match the main app's
 * usage (`OnboardingMapV2`) so the tint reads strongest at the top, fading
 * downward. */
export default function ConnectionBackdrop({ phase }: { phase: ConnectionPhase }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a0f]">
      <div className="absolute inset-x-0 top-0 h-[300px]" style={{ transform: "scaleY(-1)" }}>
        <StatusGradient vpnStatus={phase} />
      </div>
    </div>
  );
}
