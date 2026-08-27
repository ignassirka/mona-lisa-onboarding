import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

/** How long the spotlight holds before dismissing itself. */
export const PROFILES_SPOTLIGHT_DURATION_MS = 5000;

/** Everything outside the cutout. Dark enough that the profiles list is the
 * only thing left to look at, light enough that the app is still legible
 * behind it — this is a nudge, not a blocking coach mark. */
const DIM = "rgba(0,0,0,0.66)";

/** Breathing room between the profiles list's own bounds and the ring. */
const PADDING = 6;
const RADIUS = 12;

/** White rim + two bloom layers. Separate element from the dim layer rather
 * than extra entries in the same `box-shadow` stack, so the glow always paints
 * over the dim instead of depending on shadow ordering. */
const RING_SHADOW = [
  "0 0 0 1.5px rgba(255,255,255,0.92)",
  "0 0 18px 2px rgba(255,255,255,0.45)",
  "0 0 48px 10px rgba(255,255,255,0.18)",
].join(", ");

/** The highlighted region, in pixels relative to the app window container. */
export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type ProfilesSpotlightProps = {
  rect: SpotlightRect;
  /** Fires on the 5s timeout or on any click/keypress, so the caller can
   * unmount. */
  onDone: () => void;
};

/**
 * Dims the whole app window except the profiles list, ringed in a glowing
 * white border — shown once, right after onboarding hands off to the main app,
 * to point at the profiles it just built and nudge a first connection.
 *
 * The cutout is a single element sized to the measured list, carrying an
 * enormous `box-shadow` spread: everything outside the element's border box
 * gets the dim, the box itself stays clear. That keeps the hole and the dim in
 * one layer that can't drift apart, and it works regardless of what's
 * underneath (the panel, the map, the connection card).
 */
export function ProfilesSpotlight({ rect, onDone }: ProfilesSpotlightProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onDone, PROFILES_SPOTLIGHT_DURATION_MS);
    // Capture phase, so a click dismisses even when the target stops
    // propagation — and `pointerdown` rather than `click`, so it clears out of
    // the way on press instead of release.
    window.addEventListener("pointerdown", onDone, true);
    window.addEventListener("keydown", onDone, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", onDone, true);
      window.removeEventListener("keydown", onDone, true);
    };
  }, [onDone]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-[2000]"
      style={{
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
        borderRadius: RADIUS,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="absolute inset-0" style={{ borderRadius: RADIUS, boxShadow: `0 0 0 9999px ${DIM}` }} />
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius: RADIUS, boxShadow: RING_SHADOW }}
        animate={reducedMotion ? undefined : { opacity: [0.72, 1, 0.72] }}
        transition={reducedMotion ? undefined : { duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

export default ProfilesSpotlight;
