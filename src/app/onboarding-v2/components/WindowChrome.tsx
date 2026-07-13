import { Minus, Square, X } from "lucide-react";
import protonVpnLogoUrl from "../assets/proton-vpn-logo.png";

export default function WindowChrome() {
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
        <X size={16} strokeWidth={1.5} />
      </div>
    </div>
  );
}
