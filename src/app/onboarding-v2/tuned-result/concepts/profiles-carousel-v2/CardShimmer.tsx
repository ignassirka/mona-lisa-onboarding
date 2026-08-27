import { motion } from "motion/react";
import { TUNING_CONCEPT_TIMING as CT, sec } from "../../timing";

/** The band's width as a fraction of the card's, and the two X positions it
 * travels between. Both offsets are percentages of the BAND's own width (how
 * CSS translate percentages work), so at a 60%-wide band, -120% puts its right
 * edge just off the card's left side and 220% puts its left edge just off the
 * right — a clean entrance and exit at any card width, with no per-card
 * arithmetic. */
const BAND_W = "60%";
const FROM_X = "-120%";
const TO_X = "220%";

/** How far the band is tilted off vertical. Matches the diagonal in the
 * reference: a purely vertical wipe reads as a scanline, and a shallower angle
 * would spend most of the pass hidden behind the card's own corners. */
const TILT_DEG = 18;

interface CardShimmerProps {
  /** `"loop"` — the "being generated" pass, repeating with a gap for as long
   *  as the placeholder is mounted. `"sweep"` — a single brighter pass,
   *  starting on mount. */
  mode: "loop" | "sweep";
  reduced: boolean;
  /** Delay before a `"sweep"` begins. Ignored by `"loop"`. */
  delayMs?: number;
}

/** A soft light band travelling diagonally through a profile card, clipped to
 * the card's own rounded shape.
 *
 * It does two jobs with one visual, which is the point of it being one
 * component. While a card is still a placeholder the band LOOPS, and a surface
 * with light moving across it reads as a surface something is happening to —
 * the spinner says "wait", the shimmer says "this is being made". Once the card
 * resolves the same band makes exactly one pass over the finished artwork, so
 * the thing that was being made and the thing that arrived are visibly the same
 * object rather than a spinner that got replaced by a picture.
 *
 * Kept subtle on purpose: at 10% white the loop is a shift in the card's own
 * lighting rather than a graphic laid on top of it, and it deliberately carries
 * NO information — it doesn't indicate progress, position or how long is left,
 * so nothing is lost when it's switched off.
 *
 * Which is why reduced motion gets nothing at all rather than a static
 * gradient: this is decoration with no content in it, and the placeholder's
 * narration already states what's happening in words.
 *
 * Both modes are `pointer-events-none` and sit above the whole card, including
 * v2's footer. Passing over the country dropdown is intended — the band
 * belongs to the card, not to its artwork — and it can't intercept a hover
 * or a click on the way through. */
export default function CardShimmer({ mode, reduced, delayMs = 0 }: CardShimmerProps) {
  if (reduced) return null;

  const loop = mode === "loop";

  return (
    // Self-clipping rather than relying on the parent's `overflow-hidden`, so
    // this can be dropped into any card-shaped box without the band escaping
    // past its corners.
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        // Taller than the card and hung above it so the tilted band still
        // covers the corners it's sweeping through. The blur is what makes it
        // a soft gradient rather than a hard-edged stripe.
        className="absolute -top-1/2 h-[200%] blur-[16px]"
        style={{
          width: BAND_W,
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${loop ? 0.1 : 0.16}) 50%, transparent 100%)`,
        }}
        initial={{ x: FROM_X, rotate: TILT_DEG }}
        animate={{ x: TO_X, rotate: TILT_DEG }}
        transition={
          loop
            ? {
                duration: sec(CT.carouselShimmerLoopMs),
                // Linear, and the only linear ease on this screen: an eased
                // pass has a fast middle that reads as a flash, whereas the
                // loop needs to read as a steady sweep.
                ease: "linear",
                repeat: Infinity,
                repeatDelay: sec(CT.carouselShimmerGapMs),
              }
            : {
                duration: sec(CT.carouselFreshnessSweepMs),
                // Eased at both ends so the single pass arrives and leaves
                // rather than cutting on and off at the card's edges.
                ease: "easeInOut",
                delay: sec(delayMs),
              }
        }
      />
    </div>
  );
}
