import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import ConceptFrame from "./ConceptFrame";
import { useTuningConceptData, type TuningRow } from "./useTuningConceptData";
import { useReducedMotion } from "../../versions/lib/useReducedMotion";
import MaterializingSlot from "../MaterializingSlot";
import PhaseOnePlaceholder from "../PhaseOnePlaceholder";
import CircleSlashIcon from "../CircleSlashIcon";
import { narrateEnabling, narrateChecking, narratePreparingPlusPreview } from "../copy";
import { TUNING_CONCEPTS_COPY } from "../conceptsCopy";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import vpnPlusBadgeUrl from "../../assets/vpn-plus-badge.svg";
import type { TuningConceptProps } from "./types";

export const CHECKLIST_CONCEPT = "checklist";

// Applied by the row content itself (both Phase 1 and resolved), never by
// `MaterializingSlot`'s own `className` — that stays a plain `w-full`
// sizing wrapper so Phase 1 and resolved share the exact same box shape
// (no size "pop" on crossfade).
const ROW_BOX_CLASS = "flex w-full items-center gap-[12px] rounded-[8px] bg-[rgba(255,255,255,0.03)] px-[14px] py-[12px]";

const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 14 } },
};

function narrationFor(row: TuningRow): string {
  if (row.kind === "profiles") return narratePreparingPlusPreview();
  if (row.kind === "paid") return narrateChecking(row.label);
  return narrateEnabling(row.label);
}

function ChecklistRow({ row }: { row: TuningRow }) {
  const locked = row.kind !== "free";

  if (row.kind === "profiles" && row.profiles) {
    return (
      <div className={`${ROW_BOX_CLASS} items-start`}>
        <span className="mt-[1px] flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)]">
          <CircleSlashIcon size={13} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold text-[rgba(255,255,255,0.5)]" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
            {row.outcome}
          </span>
          <div className="flex flex-wrap gap-[6px]">
            {row.profiles.map((p) => (
              <span key={p.jtbd} className="flex items-center gap-[5px] whitespace-nowrap rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[8px] py-[3px]">
                <img src={p.icon} alt="" className="size-[13px] shrink-0 opacity-50" />
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold text-[rgba(255,255,255,0.5)]">{p.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ROW_BOX_CLASS}>
      <span
        className={`flex size-[22px] shrink-0 items-center justify-center rounded-full ${locked ? "bg-[rgba(255,255,255,0.08)]" : "bg-[rgba(44,255,204,0.15)]"}`}
      >
        {locked ? (
          <img src={vpnPlusBadgeUrl} alt="Requires VPN Plus" className="h-[12px] w-[20px]" />
        ) : (
          <motion.img variants={popVariants} initial="hidden" animate="show" src={checkmarkUrl} alt="" className="size-[16px]" />
        )}
      </span>
      <span
        className={`min-w-0 flex-1 font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold ${locked ? "text-[rgba(255,255,255,0.5)]" : "text-white"}`}
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {row.outcome}
      </span>
      {row.kind === "free" ? (
        <span className="flex shrink-0 items-end justify-center gap-[4px] whitespace-nowrap rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[10px] pb-[5px] pt-[3px] text-[12px] leading-[16px]">
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[rgba(255,255,255,0.6)]">{row.label}:</span>
          <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white">{row.value}</span>
        </span>
      ) : (
        <span className="shrink-0 whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold text-[rgba(255,255,255,0.4)]">
          {row.label}
        </span>
      )}
    </div>
  );
}

/** Alternative tuning concept #2 — "Setup checklist build-up". Applying: a
 * vertical checklist where each item ticks from a ghost circle (spinner +
 * narration) to a green check, one at a time, with an "X of N complete"
 * progress bar up top. Resolved: the completed checklist — free settings
 * checked green, paid features shown as locked checklist items (Plus
 * badge). The Acorns / Rocket Money / Clubhouse "getting started" pattern. */
export default function ChecklistConcept({ jtbdKey, selectionMode = "single", selectedJtbds, tone = "straightforward", onContinue, onBack }: TuningConceptProps) {
  const reduced = useReducedMotion();
  const data = useTuningConceptData(jtbdKey, selectionMode, selectedJtbds, tone, reduced);
  const { rows, rowStages, rowMounted, appliedSoFar, totalRows } = data;
  const progress = totalRows > 0 ? appliedSoFar / totalRows : 0;

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame concept={CHECKLIST_CONCEPT} jtbdKey={jtbdKey} selectionMode={selectionMode} selectedJtbds={selectedJtbds} data={data} reduced={reduced} onBack={onBack} onContinue={onContinue}>
        <div className="flex w-full flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
              {TUNING_CONCEPTS_COPY.checklist.progressLabel(appliedSoFar, totalRows)}
            </span>
          </div>
          <div className="h-[6px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div
              className="h-full rounded-full bg-[#6d4aff]"
              style={{ width: `${progress * 100}%`, transition: reduced ? "none" : "width 400ms ease" }}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-[8px]">
          {rows.map((row) => {
            const stage = rowStages[row.index];
            if (!rowMounted[row.index] || !stage) return null;
            return (
              <MaterializingSlot
                key={row.index}
                stage={stage}
                reduced={reduced}
                className="w-full"
                phase1Content={<div className={ROW_BOX_CLASS}><PhaseOnePlaceholder narration={narrationFor(row)} /></div>}
                resolvedContent={<ChecklistRow row={row} />}
              />
            );
          })}
        </div>
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
