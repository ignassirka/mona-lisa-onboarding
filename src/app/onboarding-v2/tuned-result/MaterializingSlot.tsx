import type { ReactNode } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import type { RowStage } from "./useTunedMaterialization";

// A base fade+slide for the resolved visual's OUTER shape. Layouts whose
// resolved content is `EnabledFeatureRow`/`PaidFeatureRow`'s `layout="row"`
// mode already have their own matching `rowVariants` on their own outer
// element, so this compounds harmlessly (both start/end at the same
// opacity/y, synchronized); layouts using `"stacked"`/`"card"` mode have NO
// entrance of their own on the outer tile (only their inner checkmark pops),
// so this is what gives THOSE their whole-tile fade+slide-up on resolve.
const resolvedVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// Reduced motion: opacity-only, no slide, per the spec.
const resolvedVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

interface MaterializingSlotProps {
  /** `undefined` rows aren't rendered at all by the caller — this component
   * only ever receives `"spinner"` or `"resolved"`. */
  stage: RowStage;
  reduced: boolean;
  /** The Phase-1 placeholder — a spinner + narration line, pre-shaped by the
   * caller to roughly match `resolvedContent`'s footprint (row/stacked-tile/
   * card outer classes) so the Phase-1→Phase-2 crossfade doesn't jump. */
  phase1Content: ReactNode;
  /** The Phase-2 finished visual — often literally the existing, unmodified
   * `EnabledFeatureRow`/`PaidFeatureRow` (any `layout` mode), mounted fresh
   * at resolve time so their own internal `variants` (check-pop, etc.) fire
   * naturally from this slot's own `initial="hidden" animate="show"`
   * ambient context — no separate glyph/pop wiring needed here. */
  resolvedContent: ReactNode;
  /** Wrapper className — sizing/width for the outer entrance element. */
  className?: string;
  /** Direction the outer entrance slides in from. `"bottom"` (default,
   * `y: 8`) is every stacked/row/card layout's existing feel. `"right"`
   * (`x: 24`) is for horizontal carousels, where a new card visibly joining
   * from the direction the track reads in is what makes it feel like the
   * next item in a row rather than a row appearing out of nowhere. */
  enterFrom?: "bottom" | "right";
  /** Animates the slot's own position via Framer's `layout` prop — needed
   * only in a horizontal carousel that re-centers (`justify-center`) as
   * cards are added: a new card growing the row's total width shifts every
   * existing card's on-screen position, and without `layout` that shift is
   * an instant jump rather than part of the same slide. Off by default;
   * every other `MaterializingSlot` caller never has this problem (its
   * siblings' positions don't move when it mounts). */
  layoutAnimate?: boolean;
}

/** A single materializing item — Phase 1 (narrated spinner) then Phase 2
 * (resolves into the finished visual) — generalized across all 4
 * tuned-result layouts (Stacked/Compact List rows, Split by Status tiles,
 * Card Grid cards). The outer entrance (fade + slide) plays once, on mount,
 * at the start of Phase 1; Phase 1↔Phase 2 crossfade sequentially
 * (`AnimatePresence mode="wait"`, matching the narration→outcome text-swap
 * feel the original "Visual Tuning" row already used) via `stage`. Reduced
 * motion skips Phase 1 entirely (the caller never passes `stage="spinner"`
 * in that case) and renders `resolvedContent` directly via a simple,
 * non-popping fade. */
export default function MaterializingSlot({
  stage,
  reduced,
  phase1Content,
  resolvedContent,
  className,
  enterFrom = "bottom",
  layoutAnimate = false,
}: MaterializingSlotProps) {
  const enterOffset = enterFrom === "right" ? { x: 24 } : { y: 8 };
  return (
    <motion.div
      layout={layoutAnimate && !reduced ? "position" : undefined}
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, ...enterOffset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: reduced ? 0.3 : 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {reduced ? (
        <motion.div className="w-full" variants={resolvedVariantsReduced} initial="hidden" animate="show">
          {resolvedContent}
        </motion.div>
      ) : (
        // `w-full` on both AnimatePresence children matters: `className`
        // above (the ROW_CLASS the caller passes in) is a flex row, and
        // without an explicit width these children — being the row's only
        // flex item — shrink-to-fit their content instead of stretching to
        // fill it. That starves any `flex-1` element inside `resolvedContent`
        // (e.g. the outcome sentence pushing a pill to the row's far right)
        // of the space it needs to actually grow into, so the pill ends up
        // sitting immediately next to the text instead of at the true right
        // edge.
        <AnimatePresence mode="wait" initial={false}>
          {stage === "spinner" ? (
            <motion.div
              key="spinner"
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2 }}
            >
              {phase1Content}
            </motion.div>
          ) : (
            <motion.div key="resolved" className="w-full" variants={resolvedVariants} initial="hidden" animate="show">
              {resolvedContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
