import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import InfoTooltip from "../versions/upsell/lib/InfoTooltip";

/** The row primitives the Stacked ("Minimal list") arrangement is made of,
 * extracted so the Free path's own body (`FreeMinimalList`) renders rows that
 * are the same object as `StackedLayout`'s, not a lookalike that can drift
 * from it. `StackedLayout` keeps everything only it uses — the locked-row
 * settle variants, the paid `FeatureNamePill` — locally. */

/** One row's outer shape: full width, top-aligned so a two-line sentence
 * keeps its chip level with the first line. */
export const STACKED_ROW_CLASS = "flex w-full max-w-[800px] items-start gap-[16px] py-[12px]";

/** Reused verbatim from `EnabledFeatureRow`/`PaidFeatureRow`'s existing
 * check-pop spring config — same primitive, same feel. */
export const checkPopVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 14 } },
};

/** The right-hand `{label}: {value}` chip for a row backed by a real,
 * tunable setting. Rows with no setting behind them (the Free path's value
 * claims) render no chip at all rather than an empty one. */
export function SettingLabelPill({
  label,
  value,
  tooltip,
  muted = false,
}: {
  label: string;
  value?: string;
  tooltip?: string;
  muted?: boolean;
}) {
  const labelColor = muted ? "text-[rgba(255,255,255,0.5)]" : "text-[rgba(255,255,255,0.7)]";
  const valueColor = muted ? "text-[rgba(255,255,255,0.5)]" : "text-white";
  return (
    <span className="flex shrink-0 items-center gap-[4px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px]">
      <span className={`font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] ${labelColor}`} style={{ fontFeatureSettings: '"rclt" 0' }}>
        {label}
      </span>
      {value ? (
        <>
          <span className={`font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] ${labelColor}`}>:</span>
          <span className={`font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] ${valueColor}`} style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}>
            {value}
          </span>
        </>
      ) : null}
      <InfoTooltip content={tooltip} />
    </span>
  );
}

/** The Free minimal list's Auto Connect row renders THIS instead of
 * `SettingLabelPill` — a bare, standalone on/off switch, no label text, no
 * pill container, no tooltip — since Auto Connect is the one setting on
 * this screen a user would plausibly want to flip back off right here
 * (every other row is either informational or a claim, with no obvious
 * "undo" action worth exposing this directly), and the row's own outcome
 * sentence to its left already says what the setting is.
 *
 * Starts OFF and flips itself ON shortly after mounting — this component is
 * only ever mounted once its row's `MaterializingSlot` resolves (see
 * `FreeMinimalList`), so "just mounted" already means "just resolved";
 * riding that same moment for the off→on flip means the switch settling
 * into place reads as part of the row resolving, not a separate effect
 * bolted onto it. Once flipped on, it's a fully interactive toggle — the
 * user can turn it back off (and on again) freely; nothing else on this row
 * (the checkmark, the outcome sentence) reacts to that, since those
 * describe the row having been TUNED, not the switch's live position. */
export function SettingTogglePill({
  label,
  autoOnDelayMs = 350,
}: {
  label: string;
  autoOnDelayMs?: number;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setOn(true), autoOnDelayMs);
    return () => window.clearTimeout(id);
  }, [autoOnDelayMs]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label}: ${on ? "On" : "Off"}`}
      onClick={() => setOn((v) => !v)}
      className="relative h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full outline-none transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-white/40"
      style={{ backgroundColor: on ? "#6d4aff" : "rgba(255,255,255,0.15)" }}
    >
      <motion.span
        className="absolute top-[2px] size-[16px] rounded-full bg-white"
        animate={{ left: on ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
