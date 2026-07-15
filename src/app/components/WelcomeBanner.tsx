import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { useReducedMotion } from "../onboarding-v2/versions/lib/useReducedMotion";

/** Centralized copy (no i18n framework exists in this codebase — same
 * precedent as the onboarding stages' own centralized copy objects). */
export const WELCOME_BANNER_COPY = {
  message: "You're all set — Proton VPN is protecting you.",
} as const;

/** Centralized timing (ms). */
export const WELCOME_BANNER_TIMING = {
  entranceDuration: 250,
  /** How long the banner stays visible before auto-dismissing. */
  dwellMs: 4000,
  exitDuration: 250,
} as const;

const sec = (ms: number): number => ms / 1000;

interface WelcomeBannerProps {
  /** Flips from `false` to `true` exactly once — right after the "Set it up
   * your way" modal closes — to start the entrance → dwell → auto-exit
   * sequence. The caller should never toggle it back to `false`; this
   * component owns its own exit timing entirely. */
  trigger: boolean;
}

/** A calm, auto-dismissing acknowledgment of the onboarding→main-app
 * handoff — fires once, immediately after the "Set it up your way" modal
 * closes (`App.tsx`). Deliberately understated (no confetti/sound/CTA) —
 * the Plus-welcome screen during onboarding already owns the celebratory
 * moment; this is just a soft "you're set" confirmation, matching that
 * modal's own calm register.
 *
 * Fully non-blocking by construction: the positioning wrapper is
 * `pointer-events-none` (so it never traps clicks — the app underneath is
 * immediately usable) and the banner has no dismiss control at all; it
 * simply fades/slides in, dwells `WELCOME_BANNER_TIMING.dwellMs`, then
 * fades/slides out on its own. No purpose-built toast/banner component
 * existed anywhere in the app to reuse (the `sonner` scaffold in
 * `components/ui/sonner.tsx` is dead code, tied to `next-themes`, which
 * isn't set up in this codebase — confirmed at checkpoint), so this is a
 * small, self-contained component built for this one purpose. */
export default function WelcomeBanner({ trigger }: WelcomeBannerProps) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    const dwellTimer = window.setTimeout(() => setVisible(false), WELCOME_BANNER_TIMING.dwellMs);
    return () => window.clearTimeout(dwellTimer);
    // Only the rising edge of `trigger` (false → true) should (re)start the
    // sequence — this fires once per mount, matching the "shows once" spec.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  // No self-positioning here — the caller (`WorldMap.tsx`) wraps this in a
  // container matching the connection card's own horizontal bounds, so the
  // banner reads as centered directly below it, not centered on the whole
  // map area (which is off-center due to the right-side feature rail).
  return (
    <div className="pointer-events-none flex justify-center">
      <AnimatePresence>
        {visible && (
          <motion.div
            role="status"
            aria-live="polite"
            className="mt-[16px] flex items-center gap-[8px] rounded-full bg-[rgba(22,20,28,0.92)] px-[16px] py-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-[12px]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: sec(WELCOME_BANNER_TIMING.entranceDuration), ease: "easeOut" },
            }}
            exit={
              reduced
                ? { opacity: 0, transition: { duration: sec(WELCOME_BANNER_TIMING.exitDuration) } }
                : { opacity: 0, y: -12, transition: { duration: sec(WELCOME_BANNER_TIMING.exitDuration), ease: "easeOut" } }
            }
          >
            <ShieldCheck size={16} strokeWidth={2} className="shrink-0 text-[#2cffcc]" aria-hidden="true" />
            <span
              className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {WELCOME_BANNER_COPY.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
