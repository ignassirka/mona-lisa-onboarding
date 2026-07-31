/** Timing + copy for the three-tier connection-failure path (see
 * docs/features/onboarding-v2.md → "Connection failure path"). Centralized
 * here per this codebase's existing i18n-ready convention (no i18n
 * framework exists — see `lib/toneOfVoice.tsx`, `lib/jtbdData.ts`, etc.).
 * `HAPPY_PATH_CONNECT_MS` is the ORIGINAL, untouched connect duration
 * (previously `OnboardingV2.tsx`'s inline `CONNECT_MS`) — the happy path
 * (no simulated failure) uses this exact value, unchanged, so this feature
 * never alters success-path timing. */
export const HAPPY_PATH_CONNECT_MS = 3200;

export const CONNECTION_FAILURE_TIMING = {
  /** Per-attempt timeout for a SIMULATED failure/retry sequence (Tier 1
   * auto-remedies + the Tier 2 user-initiated retry). Only used once a
   * failure is being simulated — the happy path never reads this. */
  attemptTimeoutMs: 8000,
  /** How long into ANY single attempt before the calm "Still trying…"
   * reassurance line appears. */
  stillTryingThresholdMs: 5500,
  /** Number of Tier 1 auto-remedies after the initial attempt (different
   * country, then Stealth + Alternative Routing) — 2, per spec. Informational
   * here; the actual sequence length is derived per-cause in
   * `connectionSimulator.ts` (`sequenceLengthFor`). */
  maxAutoRemedies: 2,
} as const;

/** Plain-language narration shown DURING Tier 1's auto-remedies — replaces
 * the connecting-state headline for that attempt. The very first attempt
 * shows the version's own normal "connecting" headline (no override); only
 * once a remedy kicks in does the narration take over. Never names a
 * protocol or setting (Stealth/Alternative Routing stay internal). */
export const CONNECTION_RETRY_NARRATION = {
  remedy1: "Trying a different location\u2026",
  remedy2: "Trying a different way to connect\u2026",
  /** Calm reassurance line, additive (shown alongside whatever headline is
   * already displayed), appearing after `stillTryingThresholdMs` of any
   * single attempt so silence doesn't read as frozen. */
  stillTrying: "Still trying\u2026",
} as const;

export type FailureCause = "no-internet" | "vpn-conflict" | "permission" | "network-blocks-vpn" | "generic";

export interface FailureCopy {
  title: string;
  body: string;
  primary: string;
}

/** Tier 2 failure-screen copy per cause. Only a cause Phase 0 confirmed as
 * (simulated-)detectable gets its own variant — "generic" is the honest
 * fallback for an unknown/undetectable cause, and is also what
 * "network-blocks-vpn" degrades to if that specific copy is ever removed.
 * Uses "yet" framing throughout (never "Connection failed" or "Something
 * went wrong") and hedges the one inferential diagnosis ("may be blocking"). */
export const CONNECTION_FAILURE_COPY: Record<FailureCause, FailureCopy> = {
  "no-internet": {
    title: "You're not online",
    body: "Check your internet connection and we'll try again.",
    primary: "Try again",
  },
  "vpn-conflict": {
    title: "Another VPN is running",
    body: "Disconnect it and we'll try again.",
    primary: "Try again",
  },
  permission: {
    title: "Proton VPN needs permission to connect",
    body: "Your computer may be blocking Proton VPN from setting up a secure connection. Check your system's network or security settings, then try again.",
    primary: "Try again",
  },
  "network-blocks-vpn": {
    title: "We couldn't connect you yet",
    body: "This network may be blocking VPN connections. You can try again, or head into the app and try from a different network later.",
    primary: "Try again",
  },
  generic: {
    title: "We couldn't connect you yet",
    body: "We're not sure why. You can try again, or head into the app and connect whenever you're ready.",
    primary: "Try again",
  },
};

/** The always-present secondary action on the Tier 2 failure screen —
 * available from the FIRST failure screen, never gated. */
export const CONNECTION_FAILURE_GO_TO_APP_LABEL = "Go to the app";

/** Tier 3 — the dismissible in-app banner offering to pick up where things
 * stopped, shown while the user is still disconnected. */
export const DEFERRED_ONBOARDING_RETRY_BANNER = {
  message: "We couldn't connect earlier. Try again?",
  action: "Try again",
} as const;

/** Tier 3 — once the user connects later on their own (from the main app,
 * not via the retry action above), a second, still-dismissible banner offers
 * to finish the deferred personalization (intent picker + tuning) they
 * skipped. Distinct copy from the retry banner since the situation changed
 * (connected, just unfinished). */
export const DEFERRED_ONBOARDING_RESUME_BANNER = {
  message: "Want to finish personalizing your VPN?",
  action: "Continue",
} as const;
