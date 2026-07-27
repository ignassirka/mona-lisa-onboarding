/** Centralized entrance timing (seconds, Framer Motion's own unit) shared by
 * all 5 alternative upsell layouts — so switching between them never
 * changes pacing, only arrangement/pattern, matching the convention
 * `tuned-result/timing.ts` and the connection-stage `timing.ts` files
 * already establish elsewhere in this codebase. */
export const UPSELL_VERSION_TIMING = {
  /** Root container stagger — each direct child fades/slides in this far
   * apart, mirroring `VPNPlusUpsell`'s own `leftVariants`. */
  staggerChildren: 0.07,
  delayChildren: 0.12,
  /** Duration for a single child's own fade/slide-in. */
  itemDuration: 0.4,
  /** Secondary panel (hero image, right rail, price cards) entrance delay. */
  secondaryDelay: 0.1,
} as const;
