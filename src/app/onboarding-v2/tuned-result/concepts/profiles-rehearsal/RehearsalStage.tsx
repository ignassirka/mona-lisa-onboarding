import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck } from "lucide-react";
import Spinner from "../../../components/Spinner";
import SettingChip from "../../profiles/SettingChip";
import DestinationChip from "../../profiles/DestinationChip";
import { BASELINE_NAME, baselineCoverage } from "../../profiles/profilesCopy";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { TUNING_CONCEPT_TIMING as CT, sec } from "../../timing";
import { effectiveProfileSettings } from "../../../lib/jtbdProfiles";
import type { ProfileSetting, TunedProfile } from "../../../lib/jtbdProfiles";
import type { StagePhase } from "./useRehearsal";

const C = TUNING_CONCEPTS_COPY.profilesRehearsal;

interface RehearsalStageProps {
  /** Null → the stage rests on the protected baseline. */
  rehearsing: TunedProfile | null;
  phase: StagePhase;
  narrationShown: string[];
  baselineSettings: ProfileSetting[];
  intentNames: string[];
  /** True once the baseline's own settings have all materialized. */
  settled: boolean;
  /** `!paidUnlocked` — a Free rehearsal of a Plus destination gets the
   * free-location note rather than being blocked. */
  planAware: boolean;
  reduced: boolean;
}

/** The single always-present element every rehearsal plays out on. One
 * persistent stage rather than per-card animation is the whole idea: it's
 * what makes "you always come back here" a thing the user watches happen
 * repeatedly instead of a promise in the copy.
 *
 * At rest the stage shows the tuned baseline as a named, owned object. That
 * resting state is the answer to "what if I want travel but also privacy?" —
 * the thing you return to is the thing that covers everything. */
export default function RehearsalStage({
  rehearsing,
  phase,
  narrationShown,
  baselineSettings,
  intentNames,
  settled,
  planAware,
  reduced,
}: RehearsalStageProps) {
  const active = rehearsing !== null && phase !== "returning";
  const travelDuration = reduced ? 0.2 : sec(CT.rehearseTravelMs);
  const returnDuration = reduced ? 0.2 : sec(CT.rehearseReturnMs);

  return (
    <div
      className={`relative flex min-h-[188px] w-full flex-col justify-center overflow-hidden rounded-[14px] border p-[20px] transition-colors ${
        active
          ? "border-[rgba(109,74,255,0.5)] bg-[rgba(109,74,255,0.08)]"
          : "border-[rgba(44,255,204,0.25)] bg-[rgba(44,255,204,0.06)]"
      }`}
      style={{ transitionDuration: `${active ? travelDuration : returnDuration}s` }}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        {rehearsing && phase !== "returning" ? (
          <motion.div
            key={`rehearsing-${rehearsing.jtbd}`}
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: travelDuration }}
            className="flex flex-col gap-[12px]"
          >
            <div className="flex items-center gap-[10px]">
              <img src={rehearsing.icon} alt="" className="size-[24px] shrink-0 opacity-90" />
              <span
                className="font-['Segoe_UI_Variable',sans-serif] text-[18px] font-semibold leading-[24px] text-white"
                style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
              >
                {C.rehearsingLabel} · {rehearsing.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-[6px]">
              <DestinationChip profile={rehearsing} planAware={planAware} />
              {effectiveProfileSettings(rehearsing.jtbd, baselineSettings).map((s) => (
                <SettingChip key={s.label} setting={s} size="sm" />
              ))}
            </div>

            <div className="flex flex-col gap-[4px]">
              {narrationShown.map((line, i) => (
                <motion.span
                  key={line}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduced ? 0.25 : 0.2 }}
                  className="flex items-center gap-[8px] font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.75)]"
                >
                  {i === narrationShown.length - 1 && i < 2 ? (
                    <Spinner size={14} />
                  ) : (
                    <span className="flex size-[14px] shrink-0 items-center justify-center text-[rgba(44,255,204,0.8)]">·</span>
                  )}
                  {line}
                </motion.span>
              ))}
            </div>

            <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.45)]">
              {/* Never lets a demonstration read as a real connection. */}
              {planAware && !rehearsing.freeRunnable ? C.freeLocationNote : C.demonstrationNote}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="baseline"
            initial={{ opacity: 0, y: reduced ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: returnDuration }}
            className="flex flex-col gap-[12px]"
          >
            <div className="flex items-center gap-[10px]">
              <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-[rgba(44,255,204,0.15)]">
                {settled ? (
                  <ShieldCheck size={17} strokeWidth={2} className="text-[rgba(44,255,204,0.9)]" />
                ) : (
                  <Spinner size={15} />
                )}
              </span>
              <span
                className="font-['Segoe_UI_Variable',sans-serif] text-[18px] font-semibold leading-[24px] text-white"
                style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
              >
                {settled ? BASELINE_NAME : C.stageBaselineDuring}
              </span>
            </div>

            {settled ? (
              <>
                <p className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.75)]">
                  {C.stageBaselineRest}
                </p>
                <div className="flex flex-wrap items-center gap-[6px]">
                  {baselineSettings.map((s) => (
                    <SettingChip key={s.label} setting={s} size="sm" />
                  ))}
                </div>
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.45)]">
                  {baselineCoverage(intentNames)}
                </span>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
