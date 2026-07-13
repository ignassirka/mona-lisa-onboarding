import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useProgressiveMask } from "../lib/useProgressiveMask";

export interface InfoRow {
  key: string;
  label: ReactNode;
  value: ReactNode;
  /** Optional leading icon rendered before the label (used by the activity-row variant). */
  icon?: ReactNode;
  /** When the card is `loading`, render a skeleton bar of this width instead. */
  skeletonWidth?: number;
}

export function MaskedValue({ text, active, className }: { text: string; active: boolean; className?: string }) {
  const display = useProgressiveMask(text, active);
  return <span className={className}>{display}</span>;
}

export function FlagValue({ countryCode, country }: { countryCode: string; country: string }) {
  return (
    <span className="flex items-center gap-[8px]">
      <img
        src={`https://flagcdn.com/${countryCode}.svg`}
        alt=""
        className="h-[14px] w-[20px] shrink-0 rounded-[3px] object-cover"
      />
      <span>{country}</span>
    </span>
  );
}

interface InfoCardProps {
  rows: InfoRow[];
  /** Show skeleton bars for rows with `skeletonWidth` until real data arrives. */
  loading?: boolean;
  /** Entrance delay for the card container (seconds). */
  containerDelay?: number;
  /** Absolute delay (from mount) before the first row animates in (seconds). */
  rowBaseDelay?: number;
  /** Stagger between rows (seconds). */
  rowStagger?: number;
  width?: number;
  /** Optional muted heading rendered above the rows. */
  heading?: ReactNode;
  /** Optional muted footnote rendered below the rows. */
  footnote?: ReactNode;
}

export default function InfoCard({
  rows,
  loading = false,
  containerDelay = 0,
  rowBaseDelay = 0,
  rowStagger = 0.15,
  width = 420,
  heading,
  footnote,
}: InfoCardProps) {
  const rowsBase = heading ? rowBaseDelay + rowStagger * 0.5 : rowBaseDelay;
  return (
    <motion.div
      className="rounded-[20px] bg-[rgba(0,0,0,0.3)] p-[16px] backdrop-blur-[2px]"
      style={{ width }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: containerDelay }}
    >
      {heading && (
        <motion.p
          className="mb-[12px] font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[18px] text-[rgba(255,255,255,0.5)]"
          style={{ fontFeatureSettings: '"rclt" 0' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: rowBaseDelay }}
        >
          {heading}
        </motion.p>
      )}
      <div className="flex flex-col gap-[10px]">
        {rows.map((row, i) => (
          <motion.div
            key={row.key}
            className="flex items-center justify-between gap-[24px]"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: rowsBase + i * rowStagger }}
          >
            <span
              className="flex min-w-0 items-center gap-[10px] whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]"
              style={{ fontFeatureSettings: '"rclt" 0' }}
            >
              {row.icon && <span className="flex shrink-0 items-center">{row.icon}</span>}
              {row.label}
            </span>
            <span
              className="flex shrink-0 justify-end whitespace-nowrap text-right font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white"
              style={{ fontVariationSettings: "'opsz' 12", fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {loading && row.skeletonWidth ? (
                  <motion.span
                    key="sk"
                    className="block h-[14px] animate-pulse rounded-[4px] bg-[rgba(255,255,255,0.18)]"
                    style={{ width: row.skeletonWidth }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                ) : (
                  <motion.span
                    key="val"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {row.value}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.div>
        ))}
      </div>
      {footnote && (
        <motion.p
          className="mt-[12px] font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.5)]"
          style={{ fontFeatureSettings: '"rclt" 0' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: rowsBase + rows.length * rowStagger }}
        >
          {footnote}
        </motion.p>
      )}
    </motion.div>
  );
}
