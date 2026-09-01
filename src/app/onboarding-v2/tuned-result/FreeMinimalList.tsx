import { motion } from "motion/react";
import MaterializingSlot from "./MaterializingSlot";
import PhaseOnePlaceholder from "./PhaseOnePlaceholder";
import { STACKED_ROW_CLASS, SettingLabelPill, SettingTogglePill, checkPopVariants } from "./stackedRow";
import type { FreeMinimalContent } from "./freeMinimalContent";
import type { RowStage } from "./useTunedMaterialization";
import checkmarkUrl from "../assets/checkmark-circle-filled.svg";

interface FreeMinimalListProps extends FreeMinimalContent {
  rowStages: RowStage[];
  rowMounted: boolean[];
  reduced: boolean;
}

/** The Free path's body for the "Minimal list" concept — the two real settings
 * this screen genuinely tuned (Protocol, Auto Connect), then the value claims
 * that are already true for the selected intents.
 *
 * There is no Plus section and no boundary divider: on this path the screen's
 * whole job is what the user already has, and the upsell it used to preview
 * inline is the very next step anyway.
 *
 * A claim row is a settings row minus its chip. Same check, same type, same
 * rhythm — the missing chip is the entire signal that nothing was configured
 * to make the sentence true, which is exactly what a claim is.
 *
 * One exception to "chip": the Auto Connect row renders `SettingTogglePill`
 * instead of `SettingLabelPill` — a real, later-toggleable on/off switch
 * rather than a static `{label}: {value}` chip, since Auto Connect is the
 * one setting here a user would plausibly want to flip back off right on
 * this screen. See `SettingTogglePill`'s own doc for why plain `mount →
 * flip on` is enough (no extra wiring from this component). */
export default function FreeMinimalList({ settings, claims, rowStages, rowMounted, reduced }: FreeMinimalListProps) {
  const renderRow = (
    index: number,
    narration: string,
    text: string,
    chip?: { label: string; value: string; tooltip: string; toggle?: boolean },
  ) => {
    const stage = rowStages[index];
    if (!rowMounted[index] || !stage) return null;
    return (
      <MaterializingSlot
        key={`free-minimal-${index}`}
        stage={stage}
        reduced={reduced}
        className={STACKED_ROW_CLASS}
        phase1Content={<PhaseOnePlaceholder narration={narration} />}
        resolvedContent={
          <div className="flex w-full items-start gap-[16px]">
            <div className="flex min-w-0 flex-1 items-start gap-[8px]">
              <motion.img variants={checkPopVariants} src={checkmarkUrl} alt="" className="size-[20px] shrink-0" />
              <span className="font-['Segoe_UI_Variable',sans-serif] font-semibold text-white" style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
                {text}
              </span>
            </div>
            {chip &&
              (chip.toggle ? (
                <SettingTogglePill label={chip.label} />
              ) : (
                <SettingLabelPill label={chip.label} value={chip.value} tooltip={chip.tooltip} />
              ))}
          </div>
        }
      />
    );
  };

  return (
    <div className="flex w-full max-w-[704px] flex-col items-center">
      {settings.map((setting, i) =>
        renderRow(i, setting.narration, setting.outcome, {
          label: setting.settingsName,
          value: setting.value,
          tooltip: setting.tooltip,
          toggle: setting.settingsName === "Auto Connect",
        }),
      )}
      {/* One extra beat between the settings and the claims. Small enough
          that the two still read as one list, big enough that the point at
          which the chips stop doesn't look like a rendering slip. */}
      <div className="mt-[8px] flex w-full flex-col items-center">
        {claims.map((claim, i) => renderRow(settings.length + i, claim.narration, claim.text))}
      </div>
    </div>
  );
}
