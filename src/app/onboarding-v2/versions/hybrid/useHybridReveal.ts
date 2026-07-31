import { useEffect, useRef, useState } from "react";
import type { ConnectionPhase } from "../types";
import { HYBRID_TIMING } from "./timing";
import { HYBRID_ACTIVITY_ENTRIES } from "./data/hybridActivityEntries";

/** Hybrid Act 1 cards — broader category copy, separate from v4's diary entries. */
export const HYBRID_CARDS = HYBRID_ACTIVITY_ENTRIES;

/** Card reveal/redact label sequencing, shared by both Hybrid layouts
 * (Centered and Split) — layout-independent, so it's centralized here rather
 * than duplicated. Timing is `HYBRID_TIMING`'s, kept identical across layouts.
 * Act 2 text scrambling is owned solely by `LocationChip`; the cards still
 * transition their eye/label state (Visible → Hiding… → Hidden). */
export function useHybridReveal(phase: ConnectionPhase, reduced: boolean) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [redactCount, setRedactCount] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ── Act 1: chip settles → beat → cards cascade ──
  useEffect(() => {
    if (phase !== "unprotected") return;
    setRevealedCount(0);
    setRedactCount(0);
    const cardsAt = reduced ? 0 : HYBRID_TIMING.cardsStart;
    const stagger = reduced ? 50 : HYBRID_TIMING.cardStagger;

    HYBRID_CARDS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setRevealedCount((r) => Math.max(r, i + 1)), cardsAt + i * stagger));
    });
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced]);

  // ── Act 2: redact labels oldest-first — together with the chip's scramble
  // and the map's flyTo, so the screen visibly "goes dark" at once. ──
  useEffect(() => {
    if (phase === "unprotected") return;
    const start = reduced ? 0 : HYBRID_TIMING.cardsRedactDelay;
    const stagger = reduced ? 0 : HYBRID_TIMING.cardRedactStagger;
    const count = revealedCount || HYBRID_CARDS.length;
    for (let i = 0; i < count; i++) {
      timers.current.push(window.setTimeout(() => setRedactCount((c) => Math.max(c, i + 1)), start + i * stagger));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return { revealedCount, redactCount, sealed: phase === "protected" };
}
