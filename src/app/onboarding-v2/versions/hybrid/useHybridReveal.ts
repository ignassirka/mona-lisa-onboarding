import { useEffect, useRef, useState } from "react";
import { ACTIVITY_ENTRIES } from "../v4-in-plain-sight/data/activityEntries";
import type { ConnectionPhase } from "../types";
import { HYBRID_TIMING } from "./timing";

// Same 3 (of the 5) illustrative "Browsing experience" entries, unchanged —
// no invented content. Shared by both Hybrid layouts.
export const HYBRID_CARDS = ACTIVITY_ENTRIES.slice(0, 3);

/** Card reveal/redact sequencing + the connecting-hold safety net, shared by
 * both Hybrid layouts (Centered and Split) — layout-independent, so it's
 * centralized here rather than duplicated. Timing is `HYBRID_TIMING`'s, kept
 * identical across layouts (same content, same pacing, different arrangement). */
export function useHybridReveal(phase: ConnectionPhase, reduced: boolean) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [redactCount, setRedactCount] = useState(0);
  const [showConnectHelp, setShowConnectHelp] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ── Act 1: reveal the 3 cards on a stagger, once the chip has settled ──
  useEffect(() => {
    if (phase !== "unprotected") return;
    const start = reduced ? 0 : HYBRID_TIMING.cardsStart;
    const stagger = reduced ? 0 : HYBRID_TIMING.cardStagger;
    HYBRID_CARDS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setRevealedCount((r) => Math.max(r, i + 1)), start + i * stagger));
    });
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Act 2: redact all 3 cards oldest-first — together with the chip's own
  // scramble (LocationChip) and the map's flyTo (driven one level up by the
  // same `phase`), so the whole screen visibly "goes dark" at once. ──
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

  // ── Safety net (HYBRID_TIMING.connectTimeoutMs): the connect simulation in
  // OnboardingV2 is a fixed ~3.2s delay today, so this can't actually fire —
  // kept as a forward-looking hold + shimmer in case that ever changes. No
  // "Retry" action is wired since there's no real failure to retry from. ──
  useEffect(() => {
    if (phase !== "connecting") {
      setShowConnectHelp(false);
      return;
    }
    const id = window.setTimeout(() => setShowConnectHelp(true), HYBRID_TIMING.connectTimeoutMs);
    return () => window.clearTimeout(id);
  }, [phase]);

  return { revealedCount, redactCount, showConnectHelp, sealed: phase === "protected" };
}
