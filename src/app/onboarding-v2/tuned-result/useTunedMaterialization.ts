import { useEffect, useRef, useState } from "react";
import { TUNED_RESULT_TIMING as T } from "./timing";

export type RowStage = "spinner" | "resolved";

interface UseTunedMaterializationParams {
  /** Re-keys the whole sequence (used as the effect's dep) — a new JTBD
   * (or a layout switch, since the caller is remounted via `key={layout}`)
   * restarts the intro + materialization from scratch. */
  jtbdKey: string;
  totalRows: number;
  /** Index at which the free/paid boundary sits (today always
   * `result.enabled.length`, i.e. 3) — items before this index are "free",
   * from this index on are "paid"/locked (or Plus-active). Passed in rather
   * than hardcoded so the schedule stays correct if the data's counts ever
   * change. */
  boundaryIndex: number;
  reduced: boolean;
}

/** Shared row-by-row materialization schedule for the tuned-result step —
 * identical for every layout (Stacked / Split by Status / Card Grid /
 * Compact List): the header's centered-intro → move-to-top timing, then each
 * of the `totalRows` items runs a two-phase "spinner → resolved" reveal, one
 * at a time, with an extra pause at `boundaryIndex` for the free/paid
 * boundary widget (whether or not a given layout actually renders a visible
 * widget there — the pacing itself stays in sync across all layouts, which
 * is the point of centralizing this). Only the RENDERING of each item/the
 * boundary differs per layout; this hook owns none of that, only timing and
 * state. */
export function useTunedMaterialization({ jtbdKey, totalRows, boundaryIndex, reduced }: UseTunedMaterializationParams) {
  const [introDone, setIntroDone] = useState(false);
  const [rowStages, setRowStages] = useState<RowStage[]>(() => Array(totalRows).fill(undefined) as RowStage[]);
  const [rowMounted, setRowMounted] = useState<boolean[]>(() => Array(totalRows).fill(false));
  const [boundaryVisible, setBoundaryVisible] = useState(false);
  const timers = useRef<number[]>([]);

  const reducedCadence = 500;
  const introToRowsDelayMs = reduced ? T.reducedIntroHold : T.centerHold + T.moveToTop;
  const introDoneDelayMs = reduced ? T.reducedIntroHold : T.centerHold;
  const hasBoundary = boundaryIndex > 0 && boundaryIndex < totalRows;

  useEffect(() => {
    const id = window.setTimeout(() => setIntroDone(true), introDoneDelayMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jtbdKey, reduced]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRowStages(Array(totalRows).fill(undefined) as RowStage[]);
    setRowMounted(Array(totalRows).fill(false));
    setBoundaryVisible(false);

    const schedule = (fn: () => void, delay: number) => timers.current.push(window.setTimeout(fn, delay));
    const setStage = (i: number, stage: RowStage) =>
      setRowStages((prev) => {
        const next = [...prev];
        next[i] = stage;
        return next;
      });
    const mountRow = (i: number) => setRowMounted((prev) => (prev[i] ? prev : prev.map((v, idx) => (idx === i ? true : v))));

    // Rows only start once the header block has landed at the top.
    let t = introToRowsDelayMs;

    if (reduced) {
      // Sequential fade, resolved state only — no spinner phase, no pops,
      // no slides, faster cadence.
      for (let i = 0; i < totalRows; i++) {
        if (i === boundaryIndex && hasBoundary) {
          schedule(() => setBoundaryVisible(true), t);
          t += reducedCadence;
        }
        schedule(() => {
          mountRow(i);
          setStage(i, "resolved");
        }, t);
        t += reducedCadence;
      }
    } else {
      for (let i = 0; i < totalRows; i++) {
        if (i === boundaryIndex && hasBoundary) {
          schedule(() => setBoundaryVisible(true), t);
          t += T.boundaryIn + T.rowGap;
        }
        schedule(() => {
          mountRow(i);
          setStage(i, "spinner");
        }, t);
        t += T.spinnerHold;
        schedule(() => setStage(i, "resolved"), t);
        t += T.resolveDuration + T.rowGap;
      }
    }

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jtbdKey, reduced, totalRows, boundaryIndex]);

  const appliedSoFar = rowMounted.filter(Boolean).length;
  const rowsComplete = totalRows > 0 && rowStages[totalRows - 1] === "resolved";

  const rowsEndMs =
    introToRowsDelayMs +
    (reduced
      ? totalRows * reducedCadence + (hasBoundary ? reducedCadence : 0)
      : totalRows * (T.spinnerHold + T.resolveDuration + T.rowGap) + (hasBoundary ? T.boundaryIn + T.rowGap : 0));
  // No tip anywhere in the tuned-result step (removed across all layouts) —
  // Continue fades in directly after the last item resolves.
  const continueDelayMs = rowsEndMs + (reduced ? reducedCadence : T.continueGapAfterTip);

  return { introDone, rowStages, rowMounted, boundaryVisible, appliedSoFar, rowsComplete, continueDelayMs };
}
