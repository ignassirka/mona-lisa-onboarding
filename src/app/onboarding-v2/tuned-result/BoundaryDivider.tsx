import { motion, AnimatePresence } from "motion/react";
import { TUNED_RESULT_TIMING as T, sec } from "./timing";
import vpnPlusBadgeUrl from "../assets/vpn-plus-badge.svg";

interface BoundaryDividerProps {
  visible: boolean;
  reduced: boolean;
  header: string;
}

/** The free/paid boundary widget shared by the Stacked and Compact List
 * layouts: a thin rule + the VPN Plus badge + intent-aware heading
 * (`plusSectionHeader`), fading/expanding in at the materialization's
 * boundary beat. Not shown at all for Plus users (no tier boundary to mark
 * when every row is active) — callers simply don't render this when
 * `paidUnlocked`. */
export default function BoundaryDivider({ visible, reduced, header }: BoundaryDividerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="flex w-full flex-col items-start gap-[9px]"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scaleX: 0.92 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: reduced ? 0.3 : sec(T.boundaryIn), ease: "easeOut" }}
        >
          <div className="w-full py-[12px]">
            <div className="h-px w-full bg-[rgba(255,255,255,0.12)]" />
          </div>
          <div className="flex items-center gap-[8px] py-[9px]">
            <img src={vpnPlusBadgeUrl} alt="Proton VPN Plus" className="h-[20px] w-[33px] shrink-0" />
            <span
              className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {header}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
