import { Minus, Square, X } from "lucide-react";
import protonVpnLogoUrl from "../assets/proton-vpn-logo.png";

interface WindowChromeProps {
  /** Fired by the "X" close control — returns to the prototype's initial
   * start screen (the 3-button screen), same as closing the real app
   * window would exit the onboarding entirely. Minus/Square (minimize/
   * maximize) stay decorative — no real window to minimize/maximize in a
   * browser tab, and nothing in the prototype spec asked for them. */
  onClose?: () => void;
}

export default function WindowChrome({ onClose }: WindowChromeProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1200] flex h-[40px] items-center justify-between px-[16px]">
      <div className="flex items-center gap-[10px]">
        <img src={protonVpnLogoUrl} alt="" className="size-[16px] shrink-0 object-contain" />
        <span
          className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.85)]"
        >
          Proton VPN
        </span>
      </div>
      <div className="flex items-center gap-[6px] text-[rgba(255,255,255,0.7)]">
        <Minus size={16} strokeWidth={1.5} />
        <Square size={12} strokeWidth={1.5} className="mx-[6px]" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="pointer-events-auto flex items-center justify-center rounded-[3px] p-[2px] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.1)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
