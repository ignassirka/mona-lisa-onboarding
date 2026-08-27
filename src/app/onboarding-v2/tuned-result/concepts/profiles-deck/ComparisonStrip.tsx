import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import InfoTooltip from "../../../versions/upsell/lib/InfoTooltip";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { TUNED_RESULT_TIMING as T, sec } from "../../timing";
import type { ComparisonRow } from "./comparisonRows";

const C = TUNING_CONCEPTS_COPY.profilesDeck;

interface ComparisonStripProps {
  rows: ComparisonRow[];
  reduced: boolean;
  /** Rows past this count are still building via the shared materialization
   * schedule. `undefined` shows all of them. */
  visibleCount?: number;
}

/** The before-and-after: two columns, three rows, same three questions on
 * every card. Keeping the questions and their order fixed is what lets a
 * user learn the shape once and then read each subsequent card as a diff.
 *
 * Unchanged rows get a calm muted "No change" rather than being hidden or
 * flagged — see `comparisonRows.ts` for why those rows carry most of this
 * concept's reassurance. */
export default function ComparisonStrip({ rows, reduced, visibleCount }: ComparisonStripProps) {
  const shown = visibleCount === undefined ? rows : rows.slice(0, visibleCount);
  const stagger = sec(T.resolveDuration) / 2;

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center gap-[12px] border-b border-[rgba(255,255,255,0.08)] pb-[8px]">
        <span className="flex-[1.2] font-['Segoe_UI_Variable',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.35)]" />
        <span className="flex-1 font-['Segoe_UI_Variable',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.4)]">
          {C.nowHeader}
        </span>
        <span className="w-[16px] shrink-0" />
        <span className="flex-1 font-['Segoe_UI_Variable',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.6)]">
          {C.withHeader}
        </span>
      </div>

      {shown.map((row, i) => (
        <motion.div
          key={row.question}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: sec(T.resolveDuration), delay: reduced ? 0 : i * stagger }}
          className="flex items-center gap-[12px] border-b border-[rgba(255,255,255,0.05)] py-[10px] last:border-b-0"
        >
          <span className="flex flex-[1.2] items-center gap-[4px] font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.6)]">
            {row.question}
            {row.tooltip ? <InfoTooltip content={row.tooltip} /> : null}
          </span>

          <span className="flex-1 truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.5)]">
            {row.now}
          </span>

          <span className="flex w-[16px] shrink-0 items-center justify-center">
            {row.changed ? <ArrowRight size={13} strokeWidth={2} className="text-[rgba(255,255,255,0.35)]" /> : null}
          </span>

          {row.changed ? (
            <span
              className="flex-1 truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-white"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {row.withProfile}
            </span>
          ) : (
            <span className="flex-1 truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.35)]">
              {C.noChange}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
