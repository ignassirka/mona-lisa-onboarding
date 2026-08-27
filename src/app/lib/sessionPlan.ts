import type { JtbdId } from "../onboarding-v2/lib/jtbdData";

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
  /** The country the user picked on the Plus-only country selector during
   * onboarding, or null/undefined for "Fastest country" — the default, and
   * the entire Free-plan behaviour. Personalizes the destination line on
   * onboarding-generated sidebar profiles, so what the tuning screen said
   * and what the sidebar says agree. Absent on the connection-failure and
   * "Go to app directly" exits, which never reached a country selection. */
  selectedCountry?: string | null;
  /** Set only when the user exited by pressing Connect on a SPECIFIC
   * profile card (Profiles carousel v1/v2's per-card Connect) rather than
   * the screen's own Continue, or a plain country/"Fastest" connect. Drives
   * the main app's connection card into its profile variant — profile icon
   * and name in place of the flag and country — for exactly that one
   * profile, until the user connects to something else by any other means
   * (a manual country pick, "Fastest", or disconnecting). Absent on every
   * other exit path, which have no single profile to attribute the
   * connection to. */
  connectedProfileJtbd?: JtbdId | null;
};
