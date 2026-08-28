import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye } from "lucide-react";
import { EyeHiddenIcon } from "../v4-in-plain-sight/ActivityEntry";
import type { ActivityEntryData } from "../v4-in-plain-sight/data/activityEntries";

const CYCLE_INTERVAL_MS = 3000;
/** Slot-reel travel distance and easing — a quick, snappy roll rather than a
 * soft crossfade, so it reads as "casino machine" cycling. */
const SLOT_TRAVEL_PX = 22;
const SLOT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface CyclingActivityCardProps {
  /** Pool of entries to cycle through — only the icon + text roll; the
   * eye/label indicator on the right reflects this single card's own
   * redact/seal state, not any per-entry property. */
  entries: ActivityEntryData[];
  visibleLabel: string;
  redactingLabel: string;
  sealedLabel: string;
  /** This card has started redacting (Act 2 — connecting). */
  redact: boolean;
  /** Protected act — locks tint teal. */
  sealed: boolean;
  reduced: boolean;
  /** Freezes the reel on whatever entry is showing — only during the brief
   * "connecting" transition (so the reel doesn't visibly roll while the
   * eye/label is mid-transition to "Hiding…"); resumes cycling once
   * `sealed` (protected) rather than staying frozen. */
  paused?: boolean;
}

/** The Hybrid layouts' Act 1 activity indicator, for both Free and Plus: a
 * single card whose icon + text roll through the entry pool like a slot
 * machine reel every 3s, rather than 3 separate stacked cards. Keeps exactly
 * one card through connecting/protected too (rather than reverting to 3) —
 * the reel pauses only for the "connecting" transition, then keeps spinning
 * once protected, with the eye/label staying on "Hidden" throughout.
 * Originally gated behind the Plus country selector being shown; now the
 * only Act 1 activity treatment either plan sees. */
export default function CyclingActivityCard({
  entries,
  visibleLabel,
  redactingLabel,
  sealedLabel,
  redact,
  sealed,
  reduced,
  paused = false,
}: CyclingActivityCardProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || paused || entries.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % entries.length);
    }, CYCLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused, entries.length]);

  const entry = entries[index % entries.length];
  const Icon = entry.icon;

  return (
    <motion.div
      className="relative flex items-center gap-[12px] rounded-[12px] border bg-[rgba(0,0,0,0.28)] px-[14px] py-[12px] transition-colors duration-300"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="relative h-[20px] w-[18px] shrink-0 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={entry.id}
            className="absolute inset-0 flex items-center justify-center text-[rgba(255,255,255,0.55)]"
            initial={reduced ? false : { y: SLOT_TRAVEL_PX, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: -SLOT_TRAVEL_PX, opacity: 0 }}
            transition={{ duration: 0.4, ease: SLOT_EASE }}
          >
            <Icon size={18} strokeWidth={2} />
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative h-[20px] min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={entry.id}
            className="absolute inset-0 flex items-center whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.92)]"
            initial={reduced ? false : { y: SLOT_TRAVEL_PX, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: -SLOT_TRAVEL_PX, opacity: 0 }}
            transition={{ duration: 0.4, ease: SLOT_EASE }}
          >
            {entry.text}
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="ml-[8px] flex shrink-0 items-center gap-[6px] whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[11px] leading-[14px]">
        {redact ? (
          <EyeHiddenIcon
            size={13}
            className={`transition-colors duration-300 ${sealed ? "text-[#2cffcc]" : "text-[rgba(255,255,255,0.45)]"} ${sealed ? "" : "ob2v4-lock-shimmer"}`}
          />
        ) : (
          <Eye size={13} strokeWidth={2} className="text-[rgba(255,255,255,0.4)]" />
        )}
        <span className={`transition-colors duration-300 ${sealed ? "text-[rgba(44,255,204,0.7)]" : "text-[rgba(255,255,255,0.4)]"}`}>
          {redact ? (sealed ? sealedLabel : redactingLabel) : visibleLabel}
        </span>
      </span>
    </motion.div>
  );
}
