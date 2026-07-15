import { createRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import ActivityEntry from "./ActivityEntry";
import FeedScanline from "./FeedScanline";
import { ACTIVITY_ENTRIES } from "./data/activityEntries";
import { V4_TIMING } from "./timing";
import type { ConnectionPhase } from "../types";

interface ActivityFeedProps {
  phase: ConnectionPhase;
  visibleLabel: string;
  /** Per-entry lock label while redacting (tone-specific). */
  redactingLabel: string;
  /** Per-entry lock label once sealed (tone-specific). */
  sealedLabel: string;
  reduced: boolean;
  /** Delay (ms) before the first entry appears — lets the header (padlock,
   * title, subtitle) settle first, per the entrance order. */
  startDelay?: number;
  /** Fill the parent's height instead of capping at 440px — used by the split
   * layout, where the feed occupies its own full-height column. */
  fillHeight?: boolean;
  onRevealedCountChange: (n: number) => void;
}

const TOTAL = ACTIVITY_ENTRIES.length;

/** The diary column: reveals entries one at a time (typewriter), then on connect
 * redacts them oldest-first with a synchronized scanline. The protected "sealed"
 * confirmation is shown as subtext under the main title (see InPlainSight), not
 * as a card here. */
export default function ActivityFeed({ phase, visibleLabel, redactingLabel, sealedLabel, reduced, startDelay = 0, fillHeight = false, onRevealedCountChange }: ActivityFeedProps) {
  const [revealed, setRevealed] = useState(0);
  const [redactCount, setRedactCount] = useState(0); // entries (oldest-first) currently redacting/redacted
  const [scanlineTop, setScanlineTop] = useState(0);
  const timers = useRef<number[]>([]);

  const entryRefs = useRef(ACTIVITY_ENTRIES.map(() => createRef<HTMLDivElement>()));
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => onRevealedCountChange(revealed), [revealed, onRevealedCountChange]);

  // ── Act 1: reveal entries on a slowing cadence, after the header settles ──
  useEffect(() => {
    if (phase !== "unprotected") return;
    for (let i = 0; i < TOTAL; i++) {
      const delay =
        startDelay +
        (i <= 4 ? i * V4_TIMING.entryInterval : 4 * V4_TIMING.entryInterval + (i - 4) * V4_TIMING.entrySlowInterval);
      timers.current.push(window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), delay));
    }
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Act 2: redact oldest-first once connecting ──
  useEffect(() => {
    if (phase === "unprotected") return;
    const count = revealed || TOTAL;
    for (let i = 0; i < count; i++) {
      timers.current.push(
        window.setTimeout(() => setRedactCount((c) => Math.max(c, i + 1)), i * V4_TIMING.redactionStagger),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Scanline follows the entry currently redacting ──
  useLayoutEffect(() => {
    if (redactCount <= 0) return;
    const node = entryRefs.current[redactCount - 1]?.current;
    if (node) setScanlineTop(node.offsetTop - 6);
  }, [redactCount]);

  const sealed = phase === "protected";
  const paused = phase !== "unprotected"; // freeze typewriters on connect
  const scanlineVisible = !reduced && phase === "connecting" && redactCount > 0 && redactCount < (revealed || TOTAL);

  return (
    <div
      ref={listRef}
      className={`ob2v4-scroll relative mx-auto flex w-full max-w-[440px] flex-col gap-[10px] overflow-y-auto pr-[4px] ${fillHeight ? "h-full" : "max-h-[440px]"}`}
    >
      {!reduced && <FeedScanline top={scanlineTop} visible={scanlineVisible} />}

      {ACTIVITY_ENTRIES.slice(0, revealed).map((entry, i) => (
        <ActivityEntry
          key={entry.id}
          ref={entryRefs.current[i]}
          entry={entry}
          visibleLabel={visibleLabel}
          redactingLabel={redactingLabel}
          sealedLabel={sealedLabel}
          paused={paused}
          redact={i < redactCount}
          sealed={sealed}
          reduced={reduced}
        />
      ))}
    </div>
  );
}
