import { motion, type Variants } from "motion/react";
import { UPSELL_PRICING } from "../../../lib/jtbdUpsell";
import { trackUpsellEvent } from "../../../lib/analytics";
import type { JTBDKey } from "../../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../../lib/jtbdData";

interface UpsellCtaBlockProps {
  version: string;
  jtbdKey: JTBDKey;
  selectionMode: SelectionMode;
  selectionCount: number;
  onUpgrade: () => void;
  onContinueFree: () => void;
  /** Hides the "$X/mo, billed yearly · save Y%" subline — used by layouts
   * (e.g. the plan-selector) that already surface the chosen price on its
   * own card, so the button doesn't repeat it. Pricing itself is always
   * `UPSELL_PRICING` — never invented per layout. */
  showPricingSubline?: boolean;
  className?: string;
  variants?: Variants;
}

/** Shared "Get VPN Plus" / "Continue free" CTA pair — same copy, same
 * pricing subline, same handlers (`onUpgrade`/`onContinueFree` — routing to
 * the existing checkout / free-tier landing, unchanged) as the default
 * upsell screen, now also firing analytics tagged with the active layout's
 * `version` id. Centralized so all 5 alternatives can never drift from the
 * original CTA copy or pricing. */
export default function UpsellCtaBlock({
  version,
  jtbdKey,
  selectionMode,
  selectionCount,
  onUpgrade,
  onContinueFree,
  showPricingSubline = true,
  className = "",
  variants,
}: UpsellCtaBlockProps) {
  const payload = { version, jtbdKey, selectionMode, selectionCount };

  const handleUpgrade = () => {
    trackUpsellEvent("upsell_get_plus", payload);
    onUpgrade();
  };

  const handleContinueFree = () => {
    trackUpsellEvent("upsell_continue_free", payload);
    onContinueFree();
  };

  return (
    <motion.div variants={variants} className={`flex flex-col gap-[7px] ${className}`}>
      <button
        onClick={handleUpgrade}
        className="flex w-full flex-col items-center justify-center gap-[1px] rounded-[6px] bg-[#6d4aff] px-[24px] py-[9px] font-['Segoe_UI_Variable',sans-serif] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98]"
        style={{ fontVariationSettings: "'opsz' 12" }}
      >
        <span className="text-[16px] font-semibold leading-[20px]">Get VPN Plus</span>
        {showPricingSubline && (
          <span className="text-[12px] leading-[16px] text-[rgba(255,255,255,0.8)]">
            {UPSELL_PRICING.yearlyMonthlyPrice}/mo, {UPSELL_PRICING.billingNote} · save {UPSELL_PRICING.savingsPercent}
          </span>
        )}
      </button>
      <button
        onClick={handleContinueFree}
        className="flex h-[38px] w-full items-center justify-center whitespace-nowrap rounded-[6px] border border-[rgba(255,255,255,0.2)] bg-transparent font-['Segoe_UI_Variable',sans-serif] text-[15px] font-semibold leading-[20px] text-[rgba(255,255,255,0.85)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white active:scale-[0.98]"
        style={{ fontVariationSettings: "'opsz' 12" }}
      >
        Continue free
      </button>
    </motion.div>
  );
}
