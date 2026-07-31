import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useReducedMotion } from "../onboarding-v2/versions/lib/useReducedMotion";
import {
  DEFERRED_ONBOARDING_RESUME_BANNER,
  DEFERRED_ONBOARDING_RETRY_BANNER,
} from "../onboarding-v2/lib/connectionFailureConfig";

interface DeferredOnboardingBannerProps {
  /** Whether to show at all — `App.tsx` only renders this while onboarding
   * was deferred (Tier 3 of the connection-failure path) and the user
   * hasn't dismissed it. */
  visible: boolean;
  /** Which of the two situations this is: still disconnected (offer a
   * retry) or connected but personalization was never finished (offer to
   * continue it). Distinct copy + action for each — see
   * `lib/connectionFailureConfig.ts`. */
  mode: "retry" | "resume";
  onAction: () => void;
  onDismiss: () => void;
}

/** Tier 3's dismissible landing banner — the one thing on the "graceful exit
 * to the app" landing state that acknowledges anything happened at all.
 * Deliberately understated (no icon flourish, no auto-dismiss — unlike
 * `WelcomeBanner`, this ISN'T a success acknowledgment, so it stays until
 * the user dismisses it or resolves it) and, unlike `WelcomeBanner`, has
 * real actions, so it isn't `pointer-events-none`. */
export default function DeferredOnboardingBanner({ visible, mode, onAction, onDismiss }: DeferredOnboardingBannerProps) {
  const reduced = useReducedMotion();
  const copy = mode === "retry" ? DEFERRED_ONBOARDING_RETRY_BANNER : DEFERRED_ONBOARDING_RESUME_BANNER;

  return (
    <div className="flex justify-center">
      <AnimatePresence>
        {visible && (
          <motion.div
            role="status"
            aria-live="polite"
            className="mt-[16px] flex items-center gap-[12px] rounded-full bg-[rgba(22,20,28,0.92)] px-[16px] py-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-[12px]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.25, ease: "easeOut" } }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeOut" } }}
          >
            <span
              className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {copy.message}
            </span>
            <button
              type="button"
              onClick={onAction}
              className="whitespace-nowrap rounded-full bg-[#6d4aff] px-[14px] py-[5px] font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[16px] text-white transition-colors duration-150 hover:bg-[#7c5cff] active:scale-[0.97]"
            >
              {copy.action}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[rgba(255,255,255,0.5)] outline-none transition-colors hover:text-white focus-visible:text-white"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
