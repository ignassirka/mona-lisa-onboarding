import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "motion/react";
import ConceptFrame from "./ConceptFrame";
import { useTuningConceptData, type TuningRow } from "./useTuningConceptData";
import { useReducedMotion } from "../../versions/lib/useReducedMotion";
import { narrateEnabling, narrateChecking, narratePreparingPlusPreview, plusSectionHeader } from "../copy";
import { TUNING_CONCEPTS_COPY } from "../conceptsCopy";
import { TUNING_CONCEPT_TIMING } from "../timing";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import vpnPlusBadgeUrl from "../../assets/vpn-plus-badge.svg";
import type { TuningConceptProps } from "./types";

export const PROGRESS_RING_CONCEPT = "progress-ring";

const RING_SIZE = 140;
const RING_RADIUS = 60;
const RING_STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function narrationFor(row: TuningRow): string {
  if (row.kind === "profiles") return narratePreparingPlusPreview();
  if (row.kind === "paid") return narrateChecking(row.label);
  return narrateEnabling(row.label);
}

function FreeRow({ row }: { row: TuningRow }) {
  return (
    <div className="flex w-full items-center gap-[16px]">
      <div className="flex min-w-0 flex-1 items-start gap-[8px]">
        <img src={checkmarkUrl} alt="" className="size-[18px] shrink-0" />
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
          {row.outcome}
        </span>
      </div>
      <span className="flex shrink-0 items-end justify-center gap-[4px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[10px] pb-[6px] pt-[4px] text-[13px] leading-[18px]">
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[rgba(255,255,255,0.6)]">{row.label}:</span>
        <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white">{row.value}</span>
      </span>
    </div>
  );
}

function LockedRow({ row }: { row: TuningRow }) {
  if (row.kind === "profiles" && row.profiles) {
    return (
      <div className="flex w-full flex-wrap items-center gap-[8px]">
        {row.profiles.map((p) => (
          <span key={p.jtbd} className="flex items-center gap-[6px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[10px] py-[5px]">
            <img src={p.icon} alt="" className="size-[14px] shrink-0 opacity-50" />
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold text-[rgba(255,255,255,0.5)]">{p.label}</span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex w-full items-center gap-[16px]">
      <div className="flex min-w-0 flex-1 items-start gap-[8px]">
        {row.asset && <img src={row.asset} alt="" className="size-[18px] shrink-0 object-contain opacity-50" />}
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold text-[rgba(255,255,255,0.5)]" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
          {row.outcome}
        </span>
      </div>
      <span className="shrink-0 whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold text-[rgba(255,255,255,0.4)]">{row.label}</span>
    </div>
  );
}

/** Alternative tuning concept #1 — "Progress-ring completion". Applying: a
 * circular ring fills toward 100% (driven by the SAME `appliedSoFar/
 * totalRows` the shared materialization schedule already tracks) while a
 * caption narrates whichever setting is currently being applied/checked.
 * Resolved: the ring becomes a checkmark, and the applied free settings +
 * a gated "Available with VPN Plus" panel appear below — the World App /
 * Citizen / eBay "completing your account" pattern. */
export default function ProgressRingConcept({ jtbdKey, selectionMode = "single", selectedJtbds, tone = "straightforward", onContinue, onBack }: TuningConceptProps) {
  const reduced = useReducedMotion();
  const data = useTuningConceptData(jtbdKey, selectionMode, selectedJtbds, tone, reduced);
  const { rows, rowStages, rowMounted, rowsComplete, appliedSoFar, totalRows } = data;

  const activeRow = [...rows].reverse().find((r) => rowMounted[r.index]);
  const narration = rowsComplete ? TUNING_CONCEPTS_COPY.progressRing.completeLabel : activeRow ? narrationFor(activeRow) : "";
  const progress = totalRows > 0 ? appliedSoFar / totalRows : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const freeRows = rows.filter((r) => r.kind === "free");
  const lockedRows = rows.filter((r) => r.kind !== "free");

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame concept={PROGRESS_RING_CONCEPT} jtbdKey={jtbdKey} selectionMode={selectionMode} selectedJtbds={selectedJtbds} data={data} reduced={reduced} onBack={onBack} onContinue={onContinue}>
        <div className="flex flex-col items-center gap-[10px]">
          <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
            <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
              <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={RING_STROKE} />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke={rowsComplete ? "#2cffcc" : "#6d4aff"}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={reduced ? CIRCUMFERENCE * (1 - progress) : dashOffset}
                style={{ transition: reduced ? "none" : `stroke-dashoffset ${TUNING_CONCEPT_TIMING.ringFillMs}ms ease, stroke 300ms ease` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {rowsComplete ? (
                  <motion.img
                    key="check"
                    src={checkmarkUrl}
                    alt=""
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 16 }}
                    className="size-[44px]"
                  />
                ) : (
                  <motion.span
                    key="pct"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold text-white"
                  >
                    {Math.round(progress * 100)}%
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={narration}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="min-h-[18px] font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.6)]"
            >
              {narration}
            </motion.p>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {rowsComplete && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex w-full flex-col gap-[16px]"
            >
              <div className="flex flex-col gap-[8px]">
                {freeRows.map((row) => (
                  <FreeRow key={row.index} row={row} />
                ))}
              </div>

              {lockedRows.length > 0 && (
                <div className="rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[14px]">
                  <div className="mb-[10px] flex items-center gap-[8px]">
                    <img src={vpnPlusBadgeUrl} alt="Proton VPN Plus" className="h-[18px] w-[30px]" />
                    <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold text-white">
                      {plusSectionHeader(data.jtbdLabel, data.selectionCount)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    {lockedRows.map((row) => (
                      <LockedRow key={row.index} row={row} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
