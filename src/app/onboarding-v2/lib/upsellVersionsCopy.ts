/** Copy for the 5 alternative "Upgrade to Plus" upsell layouts
 * (`versions/upsell/*`). The intent-driven benefit/subtitle/pricing copy
 * itself stays in `jtbdUpsell.ts` (untouched, shared by every layout
 * including the default `VPNPlusUpsell`) — this file only holds the NEW
 * static structural labels each alternative pattern needs (column headers,
 * section headings, plan-card labels), matching this codebase's existing
 * centralized-copy convention (no i18n framework; see `jtbdUpsell.ts`,
 * `checkoutCopy.ts`, `toneOfVoice.tsx`). No pricing, stats, or claims live
 * here — only structural labels; all numbers still come from
 * `UPSELL_PRICING` in `jtbdUpsell.ts`. */
export const UPSELL_VERSIONS_COPY = {
  /** Shared headline every alternative (except Hero Spotlight, which uses
   * the top benefit's own outcome as its headline) shows verbatim,
   * matching the default screen's own headline. */
  headline: "What VPN Plus unlocks for you",
  comparisonTable: {
    freeColumn: "Free",
    plusColumn: "Plus",
  },
  valueStack: {
    includedHeading: "Everything VPN Plus turns on for you",
    trustHeading: "Also included on every plan",
  },
  cardGrid: {
    sectionHeading: "Built around your picks",
  },
  planSelector: {
    annualLabel: "Annual",
    annualNote: "billed yearly",
    monthlyLabel: "Monthly",
    bestValueBadge: "Best value",
    includedHeading: "What's included",
  },
  heroSpotlight: {
    eyebrow: "Your top unlock",
    restHeading: "Plus, also unlocked",
  },
} as const;
