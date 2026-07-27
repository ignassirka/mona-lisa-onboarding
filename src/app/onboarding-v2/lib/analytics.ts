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
  console.info(`[analytics] ${event}`, payload);
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
  console.info(`[analytics] ${event}`, payload);
}
