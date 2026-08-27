import { useEffect, useState } from "react";
import { motion } from "motion/react";
import InfoTooltip from "../../../versions/upsell/lib/InfoTooltip";
import { TUNING_CONCEPT_TIMING as CT } from "../../timing";
import type { GlobalSetting } from "./globalSettings";

/** Thumb travel: track width (40) − horizontal padding (2×3) − thumb (16). */
const THUMB_TRAVEL = 18;

interface GlobalSettingRowProps {
  setting: GlobalSetting;
  reduced: boolean;
}

/** One app-wide setting with a live toggle.
 *
 * The row arrives OFF and flips itself on a beat later, rather than appearing
 * already on. That pause is the entire point of the treatment: an on switch
 * is a fact, whereas watching it move is something being done for you — the
 * same reason the setting rows elsewhere resolve rather than simply existing.
 *
 * It stays genuinely interactive afterwards. Nothing about the flip is a
 * decoration over a fixed value: the toggle is the real control, and turning
 * it back off is a legitimate outcome of this screen.
 *
 * Under reduced motion the row starts on and the flip is skipped entirely —
 * there's no way to express "this just moved" without motion, and a switch
 * that silently changes value is worse than one that was always right. */
export default function GlobalSettingRow({ setting, reduced }: GlobalSettingRowProps) {
  const [on, setOn] = useState(reduced);
  const { Icon } = setting;

  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setOn(true), CT.carouselToggleFlipMs);
    return () => window.clearTimeout(id);
  }, [reduced]);

  return (
    <div className="flex w-full items-center gap-[14px]">
      <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.06)]">
        <Icon className="size-[17px] text-[rgba(255,255,255,0.85)]" strokeWidth={1.75} aria-hidden="true" />
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-[4px]">
        <span
          className="font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-white"
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {setting.label}
        </span>
        <InfoTooltip content={setting.tooltip} />
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={setting.settingName}
        onClick={() => setOn((prev) => !prev)}
        className={`relative flex h-[22px] w-[40px] shrink-0 items-center rounded-full px-[3px] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-white/50 ${
          on ? "bg-[#6d4aff]" : "bg-[rgba(255,255,255,0.18)]"
        }`}
      >
        <motion.span
          className="size-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
          animate={{ x: on ? THUMB_TRAVEL : 0 }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30 }}
        />
      </button>
    </div>
  );
}
