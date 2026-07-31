import { useCallback, useEffect, useRef, useState } from "react";
import { CONNECTION_FAILURE_TIMING, CONNECTION_RETRY_NARRATION, HAPPY_PATH_CONNECT_MS, type FailureCause } from "./connectionFailureConfig";
import { sequenceLengthFor, willSucceedAtSlot, type FailureSimConfig } from "./connectionSimulator";

export type ResolvedAt = "initial" | "remedy1" | "remedy2" | "tier2-retry";

export interface ConnectionAttemptRenderState {
  /** Overrides the version's own default "connecting" headline for this
   * attempt — `null` means "show the version's normal headline" (used for
   * the very first attempt of any sequence, and for the single attempt of a
   * user-required-cause sequence). Never names a protocol/setting. */
  narration: string | null;
  /** Calm reassurance line, additive — shown once the CURRENT attempt has
   * run for `stillTryingThresholdMs` without resolving. */
  stillTrying: boolean;
  /** True only while the Tier 2 "Try again" retry sequence is in flight —
   * lets the failure screen show its own small inline loading state instead
   * of bouncing back to the full connecting UI underneath. */
  retrying: boolean;
}

interface UseConnectionAttemptOptions {
  simConfig: FailureSimConfig;
  /** True when the user made an explicit Plus-plan country choice
   * (`CountrySelect`) rather than leaving "Fastest country" selected. The
   * Tier 1 "different country" auto-remedy (`remedy1`) never actually
   * changes the destination in this simulation either way, but its
   * narration ("Trying a different location…") would misleadingly imply it
   * does while an explicit choice is in effect — so that specific slot's
   * narration falls back to `remedy2`'s copy instead (confirmed at
   * checkpoint: an explicit choice must never be silently overridden, even
   * cosmetically). Defaults to `false`, this hook's entire prior behavior,
   * byte-for-byte. */
  hasExplicitCountry?: boolean;
  /** Fired once any attempt succeeds — resume the normal happy path,
   * undegraded, from whichever slot/pass actually resolved it. */
  onSucceed: (info: { resolvedAt: ResolvedAt; attempts: number }) => void;
  /** Fired once the INITIAL sequence exhausts every attempt without success
   * — show the Tier 2 failure screen for this cause. */
  onTier1Exhausted: (info: { cause: FailureCause; attempts: number }) => void;
  /** Fired once the Tier 2 "Try again" retry ALSO exhausts — Tier 3: exit to
   * the app automatically (no second failure screen). */
  onTier2RetryFailed: (info: { attempts: number }) => void;
}

/** Owns the entire simulated connection-attempt lifecycle: the untouched
 * happy-path timing when no failure is simulated, and the full Tier-1
 * auto-remedy sequence (+ the single Tier-2 user retry) when one is. See
 * checkpoint 0 (docs/features/onboarding-v2.md) for why detection is fully
 * simulated rather than derived from a real connection service. */
export function useConnectionAttempt({ simConfig, hasExplicitCountry = false, onSucceed, onTier1Exhausted, onTier2RetryFailed }: UseConnectionAttemptOptions) {
  const [render, setRender] = useState<ConnectionAttemptRenderState>({ narration: null, stillTrying: false, retrying: false });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const attemptCountRef = useRef(0);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const slotResolvedAt = (slotIndex: number): ResolvedAt =>
    slotIndex === 0 ? "initial" : slotIndex === 1 ? "remedy1" : "remedy2";

  const runPass = useCallback(
    (pass: "initial" | "tier2-retry") => {
      const cause = simConfig.cause as FailureCause; // only called when cause is non-null
      const length = sequenceLengthFor(cause);

      const runSlot = (slotIndex: number) => {
        attemptCountRef.current += 1;
        setRender({
          narration:
            length === 3 && slotIndex === 1
              ? hasExplicitCountry
                ? CONNECTION_RETRY_NARRATION.remedy2
                : CONNECTION_RETRY_NARRATION.remedy1
              : length === 3 && slotIndex === 2
                ? CONNECTION_RETRY_NARRATION.remedy2
                : null,
          stillTrying: false,
          retrying: pass === "tier2-retry",
        });

        const stillTryingTimer = setTimeout(() => {
          setRender((r) => ({ ...r, stillTrying: true }));
        }, CONNECTION_FAILURE_TIMING.stillTryingThresholdMs);
        timers.current.push(stillTryingTimer);

        const resultTimer = setTimeout(() => {
          if (willSucceedAtSlot(simConfig, pass, slotIndex)) {
            clearTimers();
            onSucceed({
              resolvedAt: pass === "tier2-retry" ? "tier2-retry" : slotResolvedAt(slotIndex),
              attempts: attemptCountRef.current,
            });
            return;
          }
          if (slotIndex + 1 < length) {
            runSlot(slotIndex + 1);
            return;
          }
          clearTimers();
          if (pass === "initial") {
            onTier1Exhausted({ cause, attempts: attemptCountRef.current });
          } else {
            onTier2RetryFailed({ attempts: attemptCountRef.current });
          }
        }, CONNECTION_FAILURE_TIMING.attemptTimeoutMs);
        timers.current.push(resultTimer);
      };

      runSlot(0);
    },
    [simConfig, hasExplicitCountry, onSucceed, onTier1Exhausted, onTier2RetryFailed, clearTimers],
  );

  /** Begin the initial attempt. When no failure is being simulated, this is
   * BYTE-FOR-BYTE the original behavior: a single `HAPPY_PATH_CONNECT_MS`
   * timer, no narration, no "Still trying…" (it resolves well before that
   * threshold), guaranteeing the happy path is entirely untouched. */
  const start = useCallback(() => {
    clearTimers();
    attemptCountRef.current = 0;
    setRender({ narration: null, stillTrying: false, retrying: false });
    if (!simConfig.cause) {
      attemptCountRef.current = 1;
      const t = setTimeout(() => {
        onSucceed({ resolvedAt: "initial", attempts: 1 });
      }, HAPPY_PATH_CONNECT_MS);
      timers.current.push(t);
      return;
    }
    runPass("initial");
  }, [simConfig, onSucceed, runPass, clearTimers]);

  /** Tier 2's single user-initiated "Try again" — reruns the same sequence
   * shape as a fresh pass; per spec, a user retry may itself run the Tier 1
   * remedy sequence. */
  const retry = useCallback(() => {
    clearTimers();
    setRender({ narration: null, stillTrying: false, retrying: true });
    runPass("tier2-retry");
  }, [runPass, clearTimers]);

  return { render, start, retry };
}
