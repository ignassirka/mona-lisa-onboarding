import { motion } from "motion/react";
import { TUNING_CONCEPT_TIMING as CT, sec } from "../../timing";

/** The glow itself: white, low alpha, and blurred far enough that it reads as
 * light inside the card rather than as a second border just inside the first.
 * The 8px spread is what pushes the falloff inward past the corner radius, so
 * the halo hugs the whole rounded shape instead of pooling in the corners. */
const HALO = "inset 0 0 48px 8px rgba(255,255,255,0.14)";

/** The bottom of the breath. Not 0: the halo dropping out completely each
 * cycle would read as a blink — something switching on and off — where the
 * point is a surface that stays lit and varies in how brightly. */
const DIM = 0.35;

/** A soft white halo pulsating just inside a placeholder card's edge.
 *
 * Its job is to make the card look POWERED while it's empty. `CardShimmer`'s
 * band says something is passing over the card; this says something is going on
 * inside it — which is the half of "being generated" a travelling highlight
 * can't carry on its own, because a single band leaves the card completely inert
 * between passes.
 *
 * Placeholder-only, by design and not just by current usage: a resolved card
 * already has artwork of its own to be lit by, and a permanent glow on it would
 * turn a loading cue into decoration that never ends. That's also why this is a
 * separate component from `CardShimmer` rather than a `mode="loop"` branch
 * inside it — the shimmer's sweep mode is used on resolved cards, so folding the
 * halo in would mean gating it against the very mode it can never appear in.
 *
 * It animates OPACITY rather than the shadow itself: interpolating a
 * `box-shadow` string re-rasterizes a 48px blur every frame, on six cards at
 * once, while opacity on an already-composited layer doesn't. */
export default function CardHalo({ reduced }: { reduced: boolean }) {
  // Unlike the shimmer, this degrades rather than disappearing — a steady glow
  // is a perfectly good static visual, and only the pulsing is the part
  // reduced motion is asking us to drop. (In practice the placeholder itself
  // never mounts under reduced motion, since the concepts skip phase 1
  // entirely; this is so the component is correct on its own terms rather than
  // correct only because of how it happens to be called.)
  if (reduced) {
    return <div className="pointer-events-none absolute inset-0 rounded-[16px]" style={{ boxShadow: HALO }} />;
  }

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 rounded-[16px]"
      style={{ boxShadow: HALO }}
      initial={{ opacity: DIM }}
      animate={{ opacity: [DIM, 1, DIM] }}
      transition={{ duration: sec(CT.carouselHaloPulseMs), ease: "easeInOut", repeat: Infinity }}
    />
  );
}
