/** Copy shared by two or more of the 5 profiles-first tuning concepts.
 * Per-concept structural labels live in `TUNING_CONCEPTS_COPY`
 * (`conceptsCopy.ts`) instead; intent-driven titles/subtitles/summaries stay
 * in `copy.ts` / `TUNING_COPY`, untouched. Everything here is
 * tone-CONSTANT, matching the existing convention for structural copy. */

/** The aspiration label on anything a Free user can't yet use. Never an
 * error, never a warning colour — see the honesty rules in
 * docs/features/onboarding-v2.md. */
export const PLUS_AVAILABILITY_LABEL = "Available with VPN Plus";

/** The name for the merged tuned baseline when a concept presents it as a
 * first-class object rather than a list of applied settings. This rename is
 * the entire free-tier answer for several concepts: "2 settings applied" is
 * a receipt, "Everyday protection — on now" is a possession. */
export const BASELINE_NAME = "Everyday protection";

/** The R3 (persistence) caption. The "or none at all" is deliberate: it
 * grants permission to ignore profiles entirely, which is exactly what a
 * user afraid of choosing wrongly needs to hear. */
export const PERSISTENCE_CAPTION = "These stay in your sidebar. Use one any time, or none at all.";

/** The R2 (hierarchy) line, for concepts that state it in words as well as
 * structurally. */
export const NOT_A_CHOICE_LINE = "You're protected either way. These are shortcuts, not choices.";

/** "Covers streaming, gaming and travel." — built from the selected intents'
 * own profile names, so it can never disagree with what's on screen. Handles
 * 1 through 6 with correct comma/"and" joining. */
export function baselineCoverage(intentNames: string[]): string {
  if (intentNames.length === 0) return "Covers everything you picked.";

  const lower = intentNames.map((n) => n.toLowerCase());
  if (lower.length === 1) return `Covers ${lower[0]}.`;
  const last = lower[lower.length - 1];
  return `Covers ${lower.slice(0, -1).join(", ")} and ${last}.`;
}

/** The composition line — "1 country · 2 settings". Both numbers are
 * derived by the caller from real data, never literals. */
export function compositionLine(settingCount: number): string {
  return `1 country · ${settingCount} setting${settingCount === 1 ? "" : "s"}`;
}
