/** Centralized timing for the simulated web-checkout (ms unless noted). */
export const CHECKOUT_TIMING = {
  /** Browser window scale+fade entrance, and its mirrored exit on return-to-app. */
  windowEntranceDuration: 250,
  windowExitDuration: 250,
  /** How long the browser shows a plain page-loading spinner before the
   * "Review subscription and pay" content appears — simulates the page
   * actually loading, same beat as a real browser navigation. */
  pageLoadDuration: 2000,
  /** "Pay" → processing spinner → success swap. */
  payProcessingDuration: 2000,
  /** Success content fade-in inside the browser. */
  successFadeDuration: 300,
} as const;

export const sec = (ms: number): number => ms / 1000;
