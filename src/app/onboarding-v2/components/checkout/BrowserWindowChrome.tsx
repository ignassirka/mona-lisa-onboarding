import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Lock, ArrowLeft, ArrowRight, RotateCw, Minus, Square, X } from "lucide-react";
import protonVpnLogoUrl from "../../assets/proton-vpn-logo.png";
import { CHECKOUT_COPY } from "../../lib/checkoutCopy";
import { CHECKOUT_TIMING, sec } from "./checkoutTiming";

interface BrowserWindowChromeProps {
  reduced: boolean;
  children: ReactNode;
}

/** Decorative Chrome-style window control (minimize/maximize/close) — the
 * happy path never needs these to do anything (see Forbidden Actions), so
 * they're rendered inert on purpose. */
function WindowControlButton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span
      aria-hidden="true"
      title={label}
      className="flex h-[28px] w-[36px] cursor-default items-center justify-center text-[#5f6368] transition-colors hover:bg-[rgba(0,0,0,0.06)]"
    >
      {children}
    </span>
  );
}

/** A simulated Chrome browser window — tab bar + address bar (both
 * decorative prototype chrome) wrapping the real checkout content. Sized to
 * leave the app visibly behind it (see `SimulatedWebCheckout`, which
 * positions this). Entrance: scale 0.96→1 + fade (~250ms); reduced motion
 * drops the scale for a plain fade. */
export default function BrowserWindowChrome({ reduced, children }: BrowserWindowChromeProps) {
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: sec(CHECKOUT_TIMING.windowEntranceDuration), ease: "easeOut" }}
      className="absolute inset-[6%] z-20 flex origin-center flex-col overflow-hidden rounded-[10px] bg-white font-['Inter',sans-serif] shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
    >
      {/* Tab bar */}
      <div className="flex h-[36px] shrink-0 items-center gap-[6px] bg-[#dee1e6] pl-[10px] pt-[6px]">
        <div className="flex h-[30px] max-w-[240px] items-center gap-[6px] rounded-t-[8px] bg-white px-[12px]">
          <img src={protonVpnLogoUrl} alt="" className="h-[14px] w-[14px] shrink-0 object-contain" aria-hidden="true" />
          <span className="truncate whitespace-nowrap text-[12px] leading-[16px] text-[#3c4043]">
            {CHECKOUT_COPY.browser.tabTitle}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center">
          <WindowControlButton label="Minimize">
            <Minus size={14} strokeWidth={2} />
          </WindowControlButton>
          <WindowControlButton label="Maximize">
            <Square size={11} strokeWidth={2} />
          </WindowControlButton>
          <WindowControlButton label="Close">
            <X size={14} strokeWidth={2} />
          </WindowControlButton>
        </div>
      </div>

      {/* Address bar */}
      <div className="flex h-[44px] shrink-0 items-center gap-[10px] border-b border-[rgba(0,0,0,0.08)] bg-white px-[12px]">
        <div className="flex items-center gap-[6px] text-[#5f6368]">
          <ArrowLeft size={16} strokeWidth={2} className="opacity-40" aria-hidden="true" />
          <ArrowRight size={16} strokeWidth={2} className="opacity-40" aria-hidden="true" />
          <RotateCw size={14} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="flex h-[28px] flex-1 items-center gap-[6px] rounded-full bg-[#f1f3f4] px-[12px]">
          <Lock size={12} strokeWidth={2} className="shrink-0 text-[#188038]" aria-hidden="true" />
          <span className="truncate text-[13px] leading-[16px] text-[#3c4043]">
            {CHECKOUT_COPY.browser.url}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f5f9]">{children}</div>
    </motion.div>
  );
}
