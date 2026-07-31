import { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Eye } from "lucide-react";
import type { ActivityEntryData } from "./data/activityEntries";
import { V4_TIMING } from "./timing";
import { useScramble } from "../lib/scramble";

/** Crossed-out eye — the "hidden" counterpart to the `Eye` ("Visible") icon
 * above, shown once an entry redacts/seals. Custom mark (not a Lucide icon),
 * so it's a small local SVG rather than the shared icon set. */
export function EyeHiddenIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.68306 2.68306C2.43898 2.92714 2.43898 3.32286 2.68306 3.56694L16.4331 17.3169C16.6771 17.561 17.0729 17.561 17.3169 17.3169C17.561 17.0729 17.561 16.6771 17.3169 16.4331L15.3175 14.4337C16.5767 13.498 17.7078 12.2009 18.6121 10.5423C18.796 10.2052 18.796 9.7948 18.6121 9.45768C15.6175 3.96529 10.1353 2.43689 5.75606 4.87218L3.56694 2.68306C3.32287 2.43898 2.92714 2.43898 2.68306 2.68306ZM6.68453 5.80065L9.65387 8.76998C9.8738 8.39779 10 7.96363 10 7.5C10 7.05042 9.88133 6.62855 9.67359 6.26401C9.78116 6.25474 9.89003 6.25 10 6.25C12.0711 6.25 13.75 7.92894 13.75 10C13.75 10.8099 13.4933 11.5598 13.0567 12.1728L14.418 13.5341C15.5631 12.7174 16.6133 11.5484 17.466 10C15.5758 6.56757 12.7155 4.99998 10 5.00001C8.89378 5.00002 7.76348 5.2602 6.68453 5.80065ZM7.84142 9.97689C7.72979 9.99213 7.61582 10 7.50001 10C7.05042 10 6.62855 9.88133 6.26401 9.67359C6.25474 9.78116 6.25001 9.89003 6.25001 10C6.25001 12.0711 7.92894 13.75 10 13.75C10.4794 13.75 10.9378 13.6601 11.3592 13.4961L7.84142 9.97689ZM1.38786 9.45767C2.1107 8.13198 2.97847 7.03722 3.94068 6.17339L4.8394 7.058C3.9833 7.81672 3.19869 8.79308 2.53403 10C4.42422 13.4323 7.28458 15 10 15C10.8188 15 11.6508 14.8575 12.4654 14.5643L13.4413 15.5249C9.21321 17.3646 4.20207 15.7037 1.38786 10.5423C1.20405 10.2052 1.20405 9.79479 1.38786 9.45767Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface ActivityEntryProps {
  entry: ActivityEntryData;
  visibleLabel: string;
  /** Lock label while this entry is redacting (tone-specific). */
  redactingLabel: string;
  /** Lock label once this entry is sealed (tone-specific). */
  sealedLabel: string;
  /** Stop the typewriter where it is (act interrupted). */
  paused: boolean;
  /** Begin redacting this entry's text to asterisks. */
  redact: boolean;
  /** Protected act — locks tint teal. */
  sealed: boolean;
  reduced: boolean;
  /** When false, `redact` still drives the eye/label state but main text stays readable. */
  scrambleText?: boolean;
}

/** A single diary line: category icon + typed text on the left; an eye
 * (→ crossed-out eye) "Visible" → "Hidden" indicator on the right. */
const ActivityEntry = forwardRef<HTMLDivElement, ActivityEntryProps>(function ActivityEntry(
  { entry, visibleLabel, redactingLabel, sealedLabel, paused, redact, sealed, reduced, scrambleText = true },
  ref,
) {
  const Icon = entry.icon;
  const full = entry.text;

  // ── Typewriter (act 1) ──
  const [count, setCount] = useState(reduced ? full.length : 0);
  useEffect(() => {
    if (reduced) {
      setCount(full.length);
      return;
    }
    if (paused || redact) return;
    if (count >= full.length) return;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= full.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, V4_TIMING.typeSpeedMsPerChar);
    return () => window.clearInterval(id);
  }, [reduced, paused, redact, count, full.length]);

  const typed = full.slice(0, count);
  const typing = !reduced && !redact && !paused && count < full.length;

  const maskText = redact && scrambleText;

  // Freeze whatever text is on screen the moment redaction starts, then scramble it.
  const [redactBase, setRedactBase] = useState<string | null>(null);
  const prevRedact = useRef(false);
  useEffect(() => {
    if (maskText && redact && !prevRedact.current) setRedactBase(typed || full);
    prevRedact.current = redact;
  }, [maskText, redact, typed, full]);

  const scrambled = useScramble(redactBase ?? "", maskText, {
    durationMs: V4_TIMING.redactionPerEntry,
    reduced,
  });

  const displayText = maskText ? scrambled : typed;

  // Hover-to-decrypt (only when text is actually masked).
  const [hovered, setHovered] = useState(false);
  const revealing = maskText && redact && hovered;

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-start gap-[12px] rounded-[12px] border bg-[rgba(0,0,0,0.28)] px-[14px] py-[12px] transition-colors duration-300"
      style={{
        borderColor: revealing ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
        backgroundColor: revealing ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.28)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <span className="mt-[1px] shrink-0 text-[rgba(255,255,255,0.55)]">
        <Icon size={18} strokeWidth={2} />
      </span>

      <span className="min-w-0 flex-1 font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.92)]">
        {maskText ? (
          // Both states occupy the same grid cell so the crossfade dissolves
          // in place (same-length strings — `useScramble` never changes
          // character count) instead of a hard content swap.
          <span className="inline-grid">
            <motion.span
              className="col-start-1 row-start-1 tracking-[0.08em] text-[rgba(255,255,255,0.6)]"
              animate={{ opacity: revealing ? 0 : 1, filter: reduced ? "none" : revealing ? "blur(3px)" : "blur(0px)" }}
              transition={{ duration: reduced ? 0.15 : 0.45, ease: "easeInOut" }}
            >
              {displayText}
            </motion.span>
            <motion.span
              className="col-start-1 row-start-1"
              animate={{ opacity: revealing ? 1 : 0, filter: reduced ? "none" : revealing ? "blur(0px)" : "blur(3px)" }}
              transition={{ duration: reduced ? 0.15 : 0.45, ease: "easeInOut" }}
            >
              {full}
            </motion.span>
          </span>
        ) : (
          <>
            <span>{redact ? full : typed}</span>
            {typing && <span className="ob2v4-caret" aria-hidden />}
          </>
        )}
      </span>

      <span className="ml-[8px] flex shrink-0 self-center items-center gap-[6px] whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[11px] leading-[14px]">
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
});

export default ActivityEntry;
