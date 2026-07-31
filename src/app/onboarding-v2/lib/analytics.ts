import type { SessionPlan } from "../../lib/sessionPlan";

/** The active "Plan" controller value (Sign In screen, `App.tsx`) — set once
 * per onboarding mount via `setAnalyticsPlan` (`OnboardingV2`) and
 * auto-injected into every event logged below, so no existing payload type
 * or call site needs to change shape (confirmed at checkpoint: this is the
 * single, centralized place a real analytics SDK swap would also do this). */
let currentPlan: SessionPlan = "free";

export function setAnalyticsPlan(plan: SessionPlan): void {
  currentPlan = plan;
}

/** Minimal, swappable analytics utility. No analytics infrastructure exists
 * anywhere else in this prototype (confirmed via a full-repo search) — this
 * intentionally logs to the console rather than wiring a real provider.
 * Centralizing the event shape here means swapping in a real SDK later only
 * touches this one file; every upsell layout (including the untouched
 * default `VPNPlusUpsell`) fires through the same shape, tagged with its
 * own `version` id, so funnel comparisons across the 6 layouts are
 * apples-to-apples. */
export type UpsellAnalyticsEvent =
  | "upsell_view"
  | "upsell_get_plus"
  | "upsell_continue_free"
  | "upsell_back";

export interface UpsellAnalyticsPayload {
  /** The upsell layout id — one of `UPSELL_VERSIONS`' `value`s (see
   * `OnboardingV2.tsx`), so events can be sliced per version. */
  version: string;
  jtbdKey: string;
  selectionMode: string;
  /** How many JTBDs were actually selected (1 in Single mode). */
  selectionCount: number;
}

export function trackUpsellEvent(event: UpsellAnalyticsEvent, payload: UpsellAnalyticsPayload): void {
  // eslint-disable-next-line no-console
  console.info(`[analytics] ${event}`, { ...payload, plan: currentPlan });
}

/** Same pattern as `trackUpsellEvent`, for the stage-2 "tuning" screen's 5
 * alternative concepts (plus the untouched default `TunedResult`, which is
 * not instrumented today — same convention as the upsell's own default). */
export type TuningAnalyticsEvent = "tuning_view" | "tuning_continue" | "tuning_back";

export interface TuningAnalyticsPayload {
  /** The tuning concept id — one of `TUNING_CONCEPTS`' `value`s (see
   * `OnboardingV2.tsx`), so events can be sliced per concept. */
  concept: string;
  jtbdKey: string;
  selectionMode: string;
  selectionCount: number;
}

export function trackTuningEvent(event: TuningAnalyticsEvent, payload: TuningAnalyticsPayload): void {
  // eslint-disable-next-line no-console
  console.info(`[analytics] ${event}`, { ...payload, plan: currentPlan });
}

/** Same pattern, for the connection-stage three-tier failure path (see
 * docs/features/onboarding-v2.md → "Connection failure path"). This is the
 * one path in this prototype deliberately instrumented to test the
 * hypothesis "you can't convert an unhappy user" — so every field the task
 * asked for is captured: cause (or "undetectable" when no failure was even
 * simulated to compare against — practically unused today since detection
 * is fully simulated, kept for shape-completeness), which tier resolved it,
 * which auto-remedy succeeded (if any), attempt count, whether the user
 * retried at Tier 2, which exit they took, and (fired later, from the main
 * app) whether they connected/completed the deferred onboarding afterward. */
export type ConnectionFailureAnalyticsEvent =
  | "connection_attempt_start"
  | "connection_resolved"
  | "connection_tier1_exhausted"
  | "connection_tier2_view"
  | "connection_tier2_retry"
  | "connection_tier2_exit"
  | "connection_deferred_connected_later"
  | "connection_deferred_onboarding_completed";

export interface ConnectionFailureAnalyticsPayload {
  cause?: import("./connectionFailureConfig").FailureCause | "undetectable" | null;
  /** Which tier/remedy resolved the connection, when it succeeded. */
  resolvedAt?: "initial" | "remedy1" | "remedy2" | "tier2-retry" | null;
  attempts?: number;
  tier2Retried?: boolean;
  /** Which exit the user took off the failure path. */
  exit?: "go_to_app" | "auto_after_retry_fail";
  variant?: string;
  /** Plus-only country selection (`CountrySelect`) — `null`/omitted means
   * "Fastest country" (the default, and the entire Free-plan value). Fired
   * on `connection_attempt_start` (what the user chose) and
   * `connection_resolved` (`resolvedCountry` — what actually connected,
   * always a real country name, never the literal "Fastest country"). */
  selectedCountry?: string | null;
  resolvedCountry?: string;
}

export function trackConnectionFailureEvent(
  event: ConnectionFailureAnalyticsEvent,
  payload: ConnectionFailureAnalyticsPayload,
): void {
  // eslint-disable-next-line no-console
  console.info(`[analytics] ${event}`, { ...payload, plan: currentPlan });
}
