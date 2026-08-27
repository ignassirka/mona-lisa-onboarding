import { motion, AnimatePresence, type Variants } from "motion/react";
import Spinner from "../../../components/Spinner";
import SettingChip from "../../profiles/SettingChip";
import { BASELINE_NAME, baselineCoverage } from "../../profiles/profilesCopy";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import checkmarkUrl from "../../../assets/checkmark-circle-filled.svg";
import type { ProfileCardSize } from "../../profiles/ProfileCard";
import type { SettingRow } from "../../profiles/useProfilesConceptData";
import type { RowStage } from "../../useTunedMaterialization";

const C = TUNING_CONCEPTS_COPY.profilesShelf;

const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 14 } },
};

interface BaselineCardProps {
  settingRows: SettingRow[];
  rowStages: RowStage[];
  rowMounted: boolean[];
  intentNames: string[];
  /** True once every `settingRow` has resolved. */
  settled: boolean;
  size: ProfileCardSize;
  reduced: boolean;
}

// Must match `ProfileCard`'s outer geometry at the same size — the shelf only
// reads as a collection of peers if the grid is even, so padding, radius and
// min-height are kept deliberately in lockstep with that component. The
// TREATMENT differs (filled and lit vs outlined and muted); the box does not.
const PAD: Record<ProfileCardSize, string> = { tile: "p-[14px]", card: "p-[16px]", hero: "p-[20px]" };
const MIN_H: Record<ProfileCardSize, string> = { tile: "min-h-[132px]", card: "min-h-[168px]", hero: "min-h-[200px]" };
const NAME_TEXT: Record<ProfileCardSize, string> = {
  tile: "text-[15px] leading-[20px]",
  card: "text-[16px] leading-[22px]",
  hero: "text-[20px] leading-[26px]",
};

/** The shelf's leading cell: the user's own protection, already on, sitting
 * in the same visual language as the profiles beside it.
 *
 * Deliberately a separate component rather than a `ProfileCard` variant,
 * because it represents something categorically different — an always-on
 * state, not an optional shortcut — and conflating the two would let them
 * drift toward each other visually, which is the one thing that would break
 * this concept. The cost is that the two must be kept geometrically
 * identical by hand (see the constants above). */
export default function BaselineCard({
  settingRows,
  rowStages,
  rowMounted,
  intentNames,
  settled,
  size,
  reduced,
}: BaselineCardProps) {
  const resolved = settingRows.filter((r) => rowMounted[r.index] && rowStages[r.index] === "resolved");

  return (
    <div
      className={`flex w-full flex-col gap-[10px] rounded-[12px] border border-[rgba(44,255,204,0.3)] bg-[rgba(44,255,204,0.07)] ${PAD[size]} ${MIN_H[size]}`}
    >
      <div className="flex items-center gap-[10px]">
        <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-[rgba(44,255,204,0.15)]">
          <AnimatePresence mode="wait" initial={false}>
            {settled ? (
              <motion.img
                key="check"
                src={checkmarkUrl}
                alt=""
                className="size-[17px]"
                variants={reduced ? undefined : popVariants}
                initial={reduced ? { opacity: 0 } : "hidden"}
                animate={reduced ? { opacity: 1 } : "show"}
                transition={reduced ? { duration: 0.3 } : undefined}
              />
            ) : (
              <motion.span key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Spinner size={14} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        <span
          className={`min-w-0 flex-1 truncate font-['Segoe_UI_Variable',sans-serif] font-semibold text-white ${NAME_TEXT[size]}`}
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {settled ? BASELINE_NAME : C.baselineDuring}
        </span>
      </div>

      {settled ? (
        <>
          <p
            className={`font-['Segoe_UI_Variable',sans-serif] font-semibold ${
              size === "tile" ? "text-[13px] leading-[18px]" : "text-[14px] leading-[20px]"
            } text-[rgba(44,255,204,0.9)]`}
          >
            {C.baselineStatus}
          </p>
          <p
            className={`font-['Segoe_UI_Variable',sans-serif] ${
              size === "tile" ? "text-[12px] leading-[16px]" : "text-[13px] leading-[18px]"
            } text-[rgba(255,255,255,0.7)]`}
          >
            {baselineCoverage(intentNames)}
          </p>
        </>
      ) : null}

      {/* The one card that keeps its settings chips at every size — here the
          settings are the substance rather than the detail. */}
      <div className="mt-auto flex flex-wrap gap-[6px]">
        {resolved.map((row) => (
          <SettingChip key={row.setting.label} setting={row.setting} size="sm" />
        ))}
      </div>
    </div>
  );
}
