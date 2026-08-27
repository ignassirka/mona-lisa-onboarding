import { useCallback, useEffect, useRef, useState } from "react";
import { TUNING_CONCEPT_TIMING as CT } from "../../timing";
import type { JtbdId } from "../../../lib/jtbdData";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

export type StagePhase = "baseline" | "travelling" | "narrating" | "returning";

interface UseRehearsalResult {
  /** Null when idle — the stage shows the protected baseline. */
  rehearsing: TunedProfile | null;
  phase: StagePhase;
  /** Narration lines revealed so far, in order. */
  narrationShown: string[];
  /** Which profiles have been rehearsed at least once this session. */
  rehearsedIds: Set<JtbdId>;
  start: (profile: TunedProfile) => void;
  startAll: (profiles: TunedProfile[]) => void;
  cancel: () => void;
}

/** Builds a rehearsal's narration from the profile's own data rather than
 * authoring six scripts, so the lines can't drift from what the profile
 * actually is. Deliberately says nothing about protocols or kill switches —
 * the chips on the resting stage already carry the specifics, and the
 * constraint on this screen is no jargon.
 *
 * Nothing here says "connected": line 1 describes the demonstration in
 * progress and line 3 describes what the shortcut does. A rehearsal must
 * never read as a real connection. */
export function narrationFor(profile: TunedProfile): string[] {
  const destination =
    profile.country !== null
      ? `Connecting through ${profile.countryLabel}…`
      : profile.jtbd === "bypass"
        ? "Finding the fastest country outside yours…"
        : "Finding the fastest nearby country…";

  return [
    destination,
    `Setting up your connection the way ${profile.name.toLowerCase()} needs it…`,
    "Done — that's what this shortcut does.",
  ];
}

/** The rehearsal state machine, extracted from the concept so the timing is
 * readable in one place and the cleanup is easy to audit.
 *
 * Interruption is a first-class case: starting a rehearsal while one is
 * running cancels the first cleanly rather than interleaving narration, and
 * every pending timer is cleared on unmount. Follows the timer-accumulation
 * pattern in `useTunedMaterialization`. */
export function useRehearsal(reduced: boolean): UseRehearsalResult {
  const [rehearsing, setRehearsing] = useState<TunedProfile | null>(null);
  const [phase, setPhase] = useState<StagePhase>("baseline");
  const [narrationShown, setNarrationShown] = useState<string[]>([]);
  const [rehearsedIds, setRehearsedIds] = useState<Set<JtbdId>>(() => new Set());
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const cancel = useCallback(() => {
    clearTimers();
    setRehearsing(null);
    setPhase("baseline");
    setNarrationShown([]);
  }, [clearTimers]);

  /** Queues one profile's rehearsal starting at `offset` ms, returning the
   * offset at which it will be fully finished (baseline restored). */
  const queue = useCallback((profile: TunedProfile, offset: number): number => {
    const schedule = (fn: () => void, delay: number) => timers.current.push(window.setTimeout(fn, delay));
    const lines = narrationFor(profile);
    let t = offset;

    if (reduced) {
      // Reduced motion is a genuine static fallback, not a faster animation:
      // destination and every line appear at once, hold, then return. The
      // user gets the same information in one step instead of three.
      schedule(() => {
        setRehearsing(profile);
        setPhase("narrating");
        setNarrationShown(lines);
      }, t);
      t += CT.rehearseHoldMs;
      schedule(() => {
        setPhase("returning");
      }, t);
      t += CT.rehearseReturnMs;
    } else {
      schedule(() => {
        setRehearsing(profile);
        setPhase("travelling");
        setNarrationShown([]);
      }, t);
      t += CT.rehearseTravelMs;

      schedule(() => setPhase("narrating"), t);
      lines.forEach((_, i) => {
        schedule(() => setNarrationShown(lines.slice(0, i + 1)), t + i * CT.rehearseStepMs);
      });
      t += lines.length * CT.rehearseStepMs;

      t += CT.rehearseHoldMs;
      schedule(() => setPhase("returning"), t);
      t += CT.rehearseReturnMs;
    }

    schedule(() => {
      setRehearsedIds((prev) => {
        if (prev.has(profile.jtbd)) return prev;
        const next = new Set(prev);
        next.add(profile.jtbd);
        return next;
      });
      setRehearsing(null);
      setPhase("baseline");
      setNarrationShown([]);
    }, t);

    return t;
  }, [reduced]);

  const start = useCallback((profile: TunedProfile) => {
    clearTimers();
    queue(profile, 0);
  }, [clearTimers, queue]);

  /** Plays every selected profile in turn, ending on the baseline — so the
   * user SEES that the combined setup already exists, rather than being told
   * the "why not one profile with all of them?" question is misplaced. */
  const startAll = useCallback((profiles: TunedProfile[]) => {
    clearTimers();
    let offset = 0;
    for (const profile of profiles) offset = queue(profile, offset);
  }, [clearTimers, queue]);

  return { rehearsing, phase, narrationShown, rehearsedIds, start, startAll, cancel };
}
