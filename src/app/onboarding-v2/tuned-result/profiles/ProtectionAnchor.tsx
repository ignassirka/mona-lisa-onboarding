import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import Spinner from "../../components/Spinner";
import SettingChip from "./SettingChip";
import { BASELINE_NAME, baselineCoverage } from "./profilesCopy";
import { TUNING_CONCEPTS_COPY } from "../conceptsCopy";
import checkmarkUrl from "../../assets/checkmark-circle-filled.svg";
import { ChevronDown } from "lucide-react";
import type { SettingRow } from "./useProfilesConceptData";
import type { RowStage } from "../useTunedMaterialization";

const C = TUNING_CONCEPTS_COPY.profilesBaseline;

const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 14 } },
};

interface ProtectionAnchorProps {
  settingRows: SettingRow[];
  rowStages: RowStage[];
  rowMounted: boolean[];
  intentNames: string[];
  /** True once every setting row has resolved. */
  settled: boolean;
  reduced: boolean;
  /** Extra line under the coverage text. The Draft concept uses it to say
   * the block is pinned and can't be removed, which is what stops its
   * missing checkbox reading as an oversight. */
  note?: string;
  /** Renders the settings chips permanently instead of behind the "What we
   * changed" disclosure. The Draft concept wants them open, since it's the
   * one place settings appear on that screen at all. */
  alwaysShowSettings?: boolean;
}

/** The user's actual free outcome, presented as a named thing they own
 * rather than as a list of applied settings. Shared by the Baseline concept
 * (where it's the upper register the shortcuts sit under) and the Draft
 * concept (where it's the pinned, non-removable block above the drafts) —
 * both need the same content contract, so it lives here rather than being
 * built twice and drifting.
 *
 * The settings sit behind a disclosure by default, because on these screens
 * they have exactly one remaining job: making this block credible.
 * Credibility should be available on demand rather than displayed
 * permanently — but removing it entirely would leave an unfalsifiable claim,
 * which a privacy product can't afford. */
export default function ProtectionAnchor({
  settingRows,
  rowStages,
  rowMounted,
  intentNames,
  settled,
  reduced,
  note,
  alwaysShowSettings = false,
}: ProtectionAnchorProps) {
  const [expanded, setExpanded] = useState(false);

  const resolved = settingRows.filter((r) => rowMounted[r.index] && rowStages[r.index] === "resolved");

  return (
    <div className="w-full rounded-[12px] border border-[rgba(44,255,204,0.25)] bg-[rgba(44,255,204,0.06)] p-[16px]">
      <div className="flex items-center gap-[12px]">
        <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-[rgba(44,255,204,0.15)]">
          <AnimatePresence mode="wait" initial={false}>
            {settled ? (
              <motion.img
                key="check"
                src={checkmarkUrl}
                alt=""
                className="size-[20px]"
                variants={reduced ? undefined : popVariants}
                initial={reduced ? { opacity: 0 } : "hidden"}
                animate={reduced ? { opacity: 1 } : "show"}
                transition={reduced ? { duration: 0.3 } : undefined}
              />
            ) : (
              <motion.span key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Spinner size={16} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span
            className="font-['Segoe_UI_Variable',sans-serif] text-[17px] font-semibold leading-[22px] text-white"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {settled ? C.anchorTitleComplete : C.anchorTitleDuring}
          </span>
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.7)]">
            {settled ? `${BASELINE_NAME} · ${baselineCoverage(intentNames)}` : baselineCoverage(intentNames)}
          </span>
        </div>

        {resolved.length > 0 && !alwaysShowSettings ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex shrink-0 items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-[rgba(255,255,255,0.65)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
          >
            {C.anchorDisclosureLabel}
            <span className="font-normal text-[rgba(255,255,255,0.45)]">{C.anchorSettingsCount(resolved.length)}</span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className="shrink-0 transition-transform duration-150"
              style={{ transform: expanded ? "rotate(180deg)" : "none" }}
            />
          </button>
        ) : null}
      </div>

      {(expanded || alwaysShowSettings) && resolved.length > 0 ? (
        <div className="mt-[12px] flex flex-wrap gap-[6px] border-t border-[rgba(255,255,255,0.08)] pt-[12px]">
          {resolved.map((row) => (
            <SettingChip key={row.setting.label} setting={row.setting} size={alwaysShowSettings ? "sm" : "md"} />
          ))}
        </div>
      ) : null}

      {note ? (
        <p className="mt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]">
          {note}
        </p>
      ) : null}
    </div>
  );
}
