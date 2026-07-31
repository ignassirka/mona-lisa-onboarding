import { WifiOff } from "lucide-react";
import { motion } from "motion/react";
import Spinner from "./Spinner";
import { PadlockNeutral } from "./Padlocks";
import { CONNECTION_FAILURE_COPY, CONNECTION_FAILURE_GO_TO_APP_LABEL, type FailureCause } from "../lib/connectionFailureConfig";

const FAILURE_ICON_COLOR = "#8882A0";

function FailureIcon({ cause }: { cause: FailureCause }) {
  if (cause === "no-internet") {
    return <WifiOff size={34} strokeWidth={1.75} color={FAILURE_ICON_COLOR} aria-hidden />;
  }

  return <PadlockNeutral />;
}

interface ConnectionFailedOverlayProps {
  cause: FailureCause;
  /** True while the single Tier 2 "Try again" retry is in flight — disables
   * both actions and shows a small inline spinner instead of re-entering
   * the full connecting UI underneath (which would replay motion this
   * screen deliberately avoids — "no fake progress and no re-scrambling"). */
  retrying: boolean;
  onRetry: () => void;
  onGoToApp: () => void;
  reduced: boolean;
}

/** Tier 2 — the calm, cause-specific failure screen. Deliberately reuses
 * NONE of the "unprotected" reveal's danger styling: no coral gradient, no
 * targeting reticle, no red pin (the map/backdrop underneath already holds
 * at the neutral "connecting" visual — see `OnboardingV2.tsx`'s `"failed"`
 * phase, which maps to `visualPhase: "connecting"` for every underlying
 * element). This overlay is purely the calm title/body/actions card on top;
 * everything else (chip, cards, map, reticle) is frozen by the phase
 * mapping alone, not by anything in this component. Version-agnostic — one
 * implementation shared by every connection-stage version (see
 * `OnboardingV2.tsx`'s render, outside the per-variant switch). */
export default function ConnectionFailedOverlay({ cause, retrying, onRetry, onGoToApp, reduced }: ConnectionFailedOverlayProps) {
  const copy = CONNECTION_FAILURE_COPY[cause];

  return (
    <motion.div
      role="alertdialog"
      aria-labelledby="connection-failed-title"
      aria-describedby="connection-failed-body"
      className="absolute inset-0 z-[1100] flex items-center justify-center bg-[rgba(10,10,15,0.55)] px-[24px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
    >
      <motion.div
        className="flex w-full max-w-[420px] flex-col items-center rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(22,20,28,0.92)] px-[32px] py-[36px] text-center backdrop-blur-[24px] shadow-[0px_16px_48px_rgba(0,0,0,0.4)]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut", delay: reduced ? 0 : 0.05 }}
      >
        <div className="mb-[16px] flex h-[40px] items-center justify-center">
          <FailureIcon cause={cause} />
        </div>

        <h1
          id="connection-failed-title"
          className="font-['Segoe_UI_Variable',sans-serif] text-[22px] font-semibold leading-[28px] text-white"
          style={{ fontVariationSettings: "'opsz' 20" }}
        >
          {copy.title}
        </h1>

        <p
          id="connection-failed-body"
          className="mt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.7)]"
        >
          {copy.body}
        </p>

        <div className="mt-[24px] flex w-full flex-col items-center gap-[10px]">
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="flex w-full items-center justify-center gap-[8px] rounded-[6px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98] disabled:cursor-default disabled:opacity-70"
            style={{ fontVariationSettings: "'opsz' 12" }}
          >
            {retrying && <Spinner size={16} />}
            {retrying ? "Trying again\u2026" : copy.primary}
          </button>
          <button
            type="button"
            onClick={onGoToApp}
            disabled={retrying}
            className="w-full rounded-[6px] border border-[rgba(255,255,255,0.2)] bg-transparent px-[24px] pb-[11px] pt-[9px] font-['Segoe_UI_Variable',sans-serif] text-[15px] font-semibold leading-[20px] text-[rgba(255,255,255,0.85)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white disabled:cursor-default disabled:opacity-50"
            style={{ fontVariationSettings: "'opsz' 12" }}
          >
            {CONNECTION_FAILURE_GO_TO_APP_LABEL}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
