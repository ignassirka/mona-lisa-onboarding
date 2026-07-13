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
 * connecting hold (CONNECT_MS = 3200). */
export interface StageOneVersionProps {
  phase: ConnectionPhase;
  geo: GeoInfo;
  /** True once (fallback) IP data has resolved; CTA stays disabled until then. */
  isLive: boolean;
  onProtect: () => void;
  onContinue: () => void;
  /** Tone-selected copy for the "Browsing experience" (diary) versions. */
  copy: BrowsingCopy;
}
