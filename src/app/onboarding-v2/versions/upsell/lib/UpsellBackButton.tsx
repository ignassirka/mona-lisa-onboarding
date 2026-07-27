import { motion } from "motion/react";
import { trackUpsellEvent } from "../../../lib/analytics";
import type { JTBDKey } from "../../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../../lib/jtbdData";

interface UpsellBackButtonProps {
  version: string;
  jtbdKey: JTBDKey;
  selectionMode: SelectionMode;
  selectionCount: number;
  onBack: () => void;
  className?: string;
}

/** Back-to-Tuned-Result button — same position/style as the default
 * upsell's own, now firing the `upsell_back` analytics event tagged with
 * the active layout's `version` id before calling through. */
export default function UpsellBackButton({ version, jtbdKey, selectionMode, selectionCount, onBack, className = "" }: UpsellBackButtonProps) {
  const handleBack = () => {
    trackUpsellEvent("upsell_back", { version, jtbdKey, selectionMode, selectionCount });
    onBack();
  };

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onClick={handleBack}
      aria-label="Back to tuned result"
      className={`absolute left-[20px] top-[52px] z-20 flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30 ${className}`}
      style={{ fontVariationSettings: "'opsz' 11" }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </motion.button>
  );
}
