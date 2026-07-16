/** Distinguishes free vs. paid (VPN Plus) landing after onboarding completes. */
export type SessionPlan = "free" | "plus";

/** Optional flags on the onboarding → main-app handoff. */
export type OnboardingExitOptions = {
  /** When false, the main app opens with VPN disconnected. Default true. */
  vpnConnected?: boolean;
};
