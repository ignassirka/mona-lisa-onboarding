/** Distinguishes free vs. paid (VPN Plus) landing after onboarding completes. */
export type SessionPlan = "free" | "plus";

/** Optional flags on the onboarding → main-app handoff. */
export type OnboardingExitOptions = {
  /** When false, the main app opens with VPN disconnected. Default true. */
  vpnConnected?: boolean;
  /** True only when this exit came off the connection-failure path (Tier 2's
   * "Go to the app", or Tier 3's automatic exit after the one allowed retry
   * also fails) — see docs/features/onboarding-v2.md → "Connection failure
   * path". Marks onboarding as RESUMABLE rather than completed: no "You're
   * all set" banner, no Profiles banner, no confetti, and the main app shows
   * a dismissible banner offering to pick up where things stopped. Distinct
   * from a deliberate `vpnConnected: false` skip (e.g. JTBD "Go to app
   * directly"), which is an intentional choice, not a failure to recover
   * from. */
  deferredDueToConnectionFailure?: boolean;
};
