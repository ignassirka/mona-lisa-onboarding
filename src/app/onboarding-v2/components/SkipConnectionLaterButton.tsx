import { motion } from "motion/react";
import { ENTRANCE_TIMING, sec } from "../lib/entranceTiming";

export const SKIP_CONNECTION_LATER_LABEL = "I'll do it later";

interface SkipConnectionLaterButtonProps {
  onClick: () => void;
  className?: string;
  /** Entrance delay in ms — defaults to just after the primary CTA. */
  delayMs?: number;
}

export default function SkipConnectionLaterButton({
  onClick,
  className = "",
  delayMs = ENTRANCE_TIMING.totalSequence + 200,
}: SkipConnectionLaterButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`${SKIP_CONNECTION_LATER_LABEL} — skip to job selection`}
      className={`flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30 ${className}`}
      style={{ fontVariationSettings: "'opsz' 10.5", fontFeatureSettings: "'fina', 'init'" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sec(delayMs), duration: 0.4, ease: "easeOut" }}
    >
      {SKIP_CONNECTION_LATER_LABEL}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );
}
