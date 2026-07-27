import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellSubtitle from "./lib/UpsellSubtitle";
import InfoTooltip from "./lib/InfoTooltip";
import StreamingLogos from "./lib/StreamingLogos";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import vpnPlusBadgeUrl from "../../assets/vpn-plus-badge.svg";
import type { UpsellVersionProps } from "./types";

export const COMPARISON_TABLE_VERSION = "comparison-table";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: UPSELL_VERSION_TIMING.staggerChildren, delayChildren: UPSELL_VERSION_TIMING.delayChildren },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: UPSELL_VERSION_TIMING.itemDuration, ease: [0.22, 1, 0.36, 1] } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/** Row cell — a checkmark (this tier already has it) or the Plus badge
 * (locked on this tier, matching `PaidFeatureRow`'s own locked visual). */
function TierCell({ state }: { state: "check" | "locked" }) {
  return (
    <div className="flex items-center justify-center">
      {state === "check" ? (
        <img src={checkmarkUrl} alt="Included" className="size-[18px]" />
      ) : (
        <img src={vpnPlusBadgeUrl} alt="Requires VPN Plus" className="h-[16px] w-[26px] opacity-50" />
      )}
    </div>
  );
}

function TableRow({
  label,
  outcome,
  tooltip,
  freeState,
}: {
  label: string;
  outcome: string;
  tooltip?: string;
  freeState: "check" | "locked";
}) {
  return (
    <motion.div
      variants={rowVariants}
      className="grid grid-cols-[1fr_72px_72px] items-center gap-[8px] border-b border-[rgba(255,255,255,0.06)] px-[16px] py-[10px] last:border-b-0"
    >
      <div className="flex min-w-0 items-start gap-[6px] pr-[8px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
          <span
            className="font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[17px] text-white"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {label}
          </span>
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]">{outcome}</span>
        </div>
        <InfoTooltip content={tooltip} />
      </div>
      <TierCell state={freeState} />
      <TierCell state="check" />
    </motion.div>
  );
}

/** Alternative upsell #1 — "Feature comparison table". A two-column Free
 * vs Plus table: free settings already active on both tiers, paid
 * features locked on Free / checked on Plus — the classic
 * Duolingo/Brilliant/Monzo comparison-table paywall pattern, populated
 * entirely from the SAME intent-driven ranked feature engine every other
 * upsell layout uses. */
export default function ComparisonTable({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, freeItems, paidItems, everythingElse } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(COMPARISON_TABLE_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[56px]">
      <UpsellBackButton version={COMPARISON_TABLE_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[600px] flex-col gap-[18px]"
        >
          <motion.div variants={itemVariants} className="flex flex-col gap-[5px] text-center">
            <h1
              className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              {UPSELL_VERSIONS_COPY.headline}
            </h1>
            <UpsellSubtitle subtitle={subtitle} className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]" />
          </motion.div>

          {isStreaming && <StreamingLogos variants={itemVariants} className="justify-center" />}

          <motion.div variants={itemVariants} className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
            <div className="grid grid-cols-[1fr_72px_72px] items-center gap-[8px] border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-[16px] py-[9px]">
              <span />
              <span className="text-center font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.5)]">
                {UPSELL_VERSIONS_COPY.comparisonTable.freeColumn}
              </span>
              <span className="text-center font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[#b09fff]">
                {UPSELL_VERSIONS_COPY.comparisonTable.plusColumn}
              </span>
            </div>

            {freeItems.map((item, i) => (
              <TableRow key={`free-${i}`} label={item.settingsName} outcome={item.outcome} tooltip={item.tooltip} freeState="check" />
            ))}
            {paidItems.map((item, i) => (
              <TableRow key={`paid-${i}`} label={item.featureName} outcome={item.outcome} tooltip={item.tooltip} freeState="locked" />
            ))}
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {everythingElse}
          </motion.p>

          <UpsellCtaBlock
            version={COMPARISON_TABLE_VERSION}
            jtbdKey={jtbdKey}
            selectionMode={selectionMode}
            selectionCount={selectionCount}
            onUpgrade={onUpgrade}
            onContinueFree={onContinueFree}
            variants={itemVariants}
          />
        </motion.div>
      </Tooltip.Provider>
    </div>
  );
}
