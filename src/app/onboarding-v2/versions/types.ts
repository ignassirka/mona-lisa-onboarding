import type { GeoInfo } from "../lib/useIpDetection";
import type { BrowsingCopy } from "../lib/toneOfVoice";

/** The three acts of the "Establishing VPN connection" stage. */
export type ConnectionPhase = "unprotected" | "connecting" | "protected";

/** Shared contract every stage-1 content version implements.
 *
 * NOTE: In this codebase the act state machine (unprotected → connecting →
 * protected) and the VPN connect simulation live in the parent `OnboardingV2`.
 * Versions are driven by the `phase` prop and call `onProtect` / `onContinue`
 * — matching how v1–v3 overlays already work. The parent guarantees the ≥2.5s
 * connecting hold on the untouched happy path (`HAPPY_PATH_CONNECT_MS`,
 * `lib/connectionFailureConfig.ts`). The parent's own `"failed"` phase (Tier
 * 2's failure screen) is deliberately NOT part of this union — it's mapped
 * to `"connecting"` before being passed down here (`visualPhase` in
 * `OnboardingV2.tsx`), so every version's rendering stays frozen at its
 * "connecting" visual for the duration of the failure screen, which is
 * layered on top separately (`ConnectionFailedOverlay`). */
export interface StageOneVersionProps {
  phase: ConnectionPhase;
  geo: GeoInfo;
  /** True once (fallback) IP data has resolved; CTA stays disabled until then. */
  isLive: boolean;
  onProtect: () => void;
  onContinue: () => void;
  /** Tone-selected copy for the "Browsing experience" (diary) versions. */
  copy: BrowsingCopy;
  /** Tier 1's plain-language narration for the current auto-remedy attempt
   * (e.g. "Trying a different location…") — `null`/omitted means "show this
   * version's own default connecting headline". Never names a protocol or
   * setting. See `ConnectingNarration`. */
  connectingNarration?: string | null;
  /** True once the current attempt has run past the "Still trying…"
   * threshold — an additive reassurance line, shown alongside whatever
   * headline is already displayed. */
  stillTrying?: boolean;
}
