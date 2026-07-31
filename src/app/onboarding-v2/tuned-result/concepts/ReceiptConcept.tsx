import * as Tooltip from "@radix-ui/react-tooltip";
import { motion } from "motion/react";
import ConceptFrame from "./ConceptFrame";
import { useTuningConceptData, type TuningRow } from "./useTuningConceptData";
import { useReducedMotion } from "../../versions/lib/useReducedMotion";
import MaterializingSlot from "../MaterializingSlot";
import PhaseOnePlaceholder from "../PhaseOnePlaceholder";
import { narrateEnabling, narrateChecking, narratePreparingPlusPreview } from "../copy";
import { TUNING_CONCEPTS_COPY } from "../conceptsCopy";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import vpnPlusBadgeUrl from "../../assets/vpn-plus-badge.svg";
import type { TuningConceptProps } from "./types";

export const RECEIPT_CONCEPT = "receipt";

const LINE_CLASS = "flex w-full items-start justify-between gap-[12px] border-b border-[rgba(255,255,255,0.08)] py-[11px] last:border-b-0";

function ReceiptLine({ row }: { row: TuningRow }) {
  if (row.kind === "profiles" && row.profiles) {
    return (
      <div className={`${LINE_CLASS} flex-col gap-[8px]`}>
        <div className="flex items-center gap-[8px]">
          <img src={vpnPlusBadgeUrl} alt="Requires VPN Plus" className="h-[16px] w-[26px] shrink-0" />
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold text-[rgba(255,255,255,0.5)]">{row.outcome}</span>
        </div>
        <div className="flex flex-wrap gap-[6px] pl-[34px]">
          {row.profiles.map((p) => (
            <span key={p.jtbd} className="flex items-center gap-[5px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[8px] py-[3px]">
              <img src={p.icon} alt="" className="size-[13px] shrink-0 opacity-50" />
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold text-[rgba(255,255,255,0.5)]">{p.label}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  const locked = row.kind === "paid";
  return (
    <div className={LINE_CLASS}>
      <div className="flex min-w-0 flex-1 items-start gap-[10px]">
        {locked ? (
          <img src={vpnPlusBadgeUrl} alt="Requires VPN Plus" className="mt-[2px] h-[16px] w-[26px] shrink-0" />
        ) : (
          <img src={checkmarkUrl} alt="" className="mt-[2px] size-[18px] shrink-0" />
        )}
        <div className="flex min-w-0 flex-col">
          <span
            className={`font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold ${locked ? "text-[rgba(255,255,255,0.5)]" : "text-white"}`}
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {row.outcome}
          </span>
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] text-[rgba(255,255,255,0.4)]">{row.label}</span>
        </div>
      </div>
      {row.kind === "free" ? (
        <span className="shrink-0 whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold text-white">{row.value}</span>
      ) : (
        row.asset && <img src={row.asset} alt="" className="mt-[2px] size-[18px] shrink-0 object-contain opacity-50" />
      )}
    </div>
  );
}

/** Alternative tuning concept #3 — "Setup summary / receipt of changes". A
 * narrator narrates each change while it's applied (Phase 1), and each
 * finished change drops as its own line into a growing itemized card
 * (Phase 2) — resolving into a tidy "Here's your setup" receipt: free
 * settings as name → value lines with checks, a divider, then a
 * "Recommended with VPN Plus" section listing the locked features as line
 * items. The Apple Health "Sweet Dreams" / Gusto "Review your information"
 * pattern. */
export default function ReceiptConcept({ jtbdKey, selectionMode = "single", selectedJtbds, tone = "straightforward", onContinue, onBack }: TuningConceptProps) {
  const reduced = useReducedMotion();
  const data = useTuningConceptData(jtbdKey, selectionMode, selectedJtbds, tone, reduced);
  const { rows, rowStages, rowMounted, boundaryVisible, boundaryIndex } = data;

  const freeRows = rows.filter((r) => r.index < boundaryIndex);
  const lockedRows = rows.filter((r) => r.index >= boundaryIndex);

  const renderLine = (row: TuningRow) => {
    const stage = rowStages[row.index];
    if (!rowMounted[row.index] || !stage) return null;
    const narration = row.kind === "profiles" ? narratePreparingPlusPreview() : row.kind === "paid" ? narrateChecking(row.label) : narrateEnabling(row.label);
    return (
      <MaterializingSlot
        key={row.index}
        stage={stage}
        reduced={reduced}
        className="w-full"
        phase1Content={<div className={LINE_CLASS}><PhaseOnePlaceholder narration={narration} /></div>}
        resolvedContent={<ReceiptLine row={row} />}
      />
    );
  };

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame concept={RECEIPT_CONCEPT} jtbdKey={jtbdKey} selectionMode={selectionMode} selectedJtbds={selectedJtbds} data={data} reduced={reduced} onBack={onBack} onContinue={onContinue}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-[20px]"
        >
          <p className="mb-[6px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold text-white">{TUNING_CONCEPTS_COPY.receipt.heading}</p>

          <div className="flex w-full flex-col">{freeRows.map(renderLine)}</div>

          {lockedRows.length > 0 && boundaryVisible && (
            <div className="mt-[4px] flex items-center gap-[8px] border-t border-[rgba(255,255,255,0.1)] pt-[14px]">
              <img src={vpnPlusBadgeUrl} alt="Proton VPN Plus" className="h-[16px] w-[26px]" />
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.5)]">
                {TUNING_CONCEPTS_COPY.receipt.recommendedHeading}
              </span>
            </div>
          )}

          <div className="flex w-full flex-col">{lockedRows.map(renderLine)}</div>
        </motion.div>
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
