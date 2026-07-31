/** Structural-only copy for the 3 alternative "tuning" concepts
 * (`tuned-result/concepts/*`). The intent-driven title/subtitle/summary
 * copy itself stays in `copy.ts` / `toneOfVoice.tsx`'s `TUNING_COPY`
 * (untouched, shared by every concept including the default) — this file
 * only holds the NEW static labels each alternative pattern's own
 * structure needs (section headings, status labels), matching this
 * codebase's existing centralized-copy convention (no i18n framework; see
 * `copy.ts`, `jtbdUpsell.ts`, `checkoutCopy.ts`). No counts or settings
 * content live here — those are always derived. */
export const TUNING_CONCEPTS_COPY = {
  progressRing: {
    completeLabel: "Setup complete",
  },
  checklist: {
    progressLabel: (applied: number, total: number) => `${applied} of ${total} complete`,
  },
  receipt: {
    heading: "Here's your setup",
    recommendedHeading: "Recommended with VPN Plus",
  },
} as const;
