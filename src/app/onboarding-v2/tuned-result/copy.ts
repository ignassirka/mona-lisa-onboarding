import { TUNING_COPY, type ToneOfVoice } from "../lib/toneOfVoice";

/** Centralized, i18n-ready copy for the "Personalized JTBD tuning" result
 * step (no i18n framework exists in the repo yet, so strings are
 * centralized here per the project's established precedent). Shared by all
 * 4 layouts. Kept CONSTANT across tones (confirmed via checkpoint) — the
 * "Available with VPN Plus" badge, the Split by Status column headers, and
 * the neutral "Continue" label. The tone-VARYING structural strings
 * (picker title/subtitle, intro subtext, title/summary builders) live in
 * `TUNING_COPY` (`lib/toneOfVoice.tsx`) instead — see the tone-aware
 * wrappers below, which delegate there. */
export const TUNED_RESULT_COPY = {
  continue: "Continue",
  /** Split by Status column headers. */
  activeNowHeader: "Active now",
  withPlusHeader: "With Plus",
  alsoActiveWithPlusHeader: "Also active with Plus",
} as const;

/** Multiple mode only — the Plus section's profiles row intro text
 * (`ProfilesSummaryRow`). Fixed/tone-constant: each selected interest's own
 * pill (icon + name) on the row's right side carries the per-interest
 * detail, so this line stays a plain, unparameterized label — same
 * precedent as `plusSectionHeader`. */
export const PROFILES_INTRO_TEXT = "One-click profiles for your interest";

/** Plus plan only (`readyCopy` on `ProfilesSummaryRow`) — profiles are
 * genuinely created and already live in the sidebar, so the Free path's
 * "one-click"/potential framing above would be inaccurate here (honesty
 * rule: don't undersell what's already true). Tone-CONSTANT, same precedent
 * as `PROFILES_INTRO_TEXT` and `plusSectionHeader` (confirmed at checkpoint). */
export const PROFILES_READY_TEXT = "Profiles ready for your interest";

/** The JTBD word used in "Setting up for {jtbd}…" / "Set up for {jtbd}" — the
 * existing `jtbdLabel` (from `JTBD_TUNING_RESULT`) lowercased. For "bypass",
 * `jtbdLabel` is already the project's agreed gerund short form
 * ("Bypassing restrictions") rather than the picker's noun form ("Bypass
 * restrictions"), which reads more naturally after "for" — no separate
 * lookup table needed. */
export function jtbdWord(jtbdLabel: string): string {
  return jtbdLabel.toLowerCase();
}

/** Plus-section boundary heading (Stacked / Compact List) — intent-aware.
 * Single mode / 1 selected: "More benefits for {intent} available with VPN Plus".
 * Multiple mode (2+): generic "your interests" wording so one line covers every
 * combination without picking a single contributor's label. */
export function plusSectionHeader(jtbdLabel: string, selectionCount = 1): string {
  if (selectionCount >= 2) {
    return "More benefits for your interests available with VPN Plus";
  }
  return `More benefits for ${jtbdWord(jtbdLabel)} available with VPN Plus`;
}

/** Header intro subtext, Phase 1/3 ("during") — tone-varying, delegates to
 * `TUNING_COPY`. */
export function introSubtext(tone: ToneOfVoice): string {
  return (TUNING_COPY[tone] ?? TUNING_COPY.straightforward).introSubtext;
}

/** Header title, Phases 1 & 3 ("during"): "{verb} for {jtbd}…" — the verb
 * varies by tone (`TUNING_COPY[tone].titleDuring`), falling back to
 * `straightforward` if a tone is somehow missing. */
export function titleDuring(tone: ToneOfVoice, jtbdLabel: string): string {
  return (TUNING_COPY[tone] ?? TUNING_COPY.straightforward).titleDuring(jtbdWord(jtbdLabel));
}

/** Header title, Phase 4 ("complete") — same structure as `titleDuring`
 * (verb + "for" + the same word), just the verb changes, so the crossfade
 * always reads as a simple word swap regardless of tone. */
export function titleComplete(tone: ToneOfVoice, jtbdLabel: string): string {
  return (TUNING_COPY[tone] ?? TUNING_COPY.straightforward).titleComplete(jtbdWord(jtbdLabel));
}

/** Header subtext, Phase 3 (materializing): the live "Applying X of N
 * settings" counter. Kept CONSTANT across tones (confirmed via checkpoint —
 * same precedent as the settings names/values it counts); both numbers are
 * derived from row progression / data by the caller, never hardcoded here. */
export function counterSubtext(applied: number, total: number): string {
  return `Applying ${applied} of ${total} settings`;
}

/** Free path of the "Minimal list" concept only — header subtext for Phases
 * 1–3 (intro, settings materializing, claims arriving). Deliberately generic
 * rather than `counterSubtext`'s "Applying {X} of {Y} settings" — the row
 * list mixes real settings with value claims, and a literal count either
 * undercounts (ignoring the claims) or miscounts a claim as a setting.
 * Tone-constant. */
export const FREE_MINIMAL_DURING_SUBTEXT =
  "Applying the settings to optimize the experience for you.";

/** Free path of the "Minimal list" concept only — header subtext for Phase 4
 * (complete). Same count-free rationale as `FREE_MINIMAL_DURING_SUBTEXT`. */
export const FREE_MINIMAL_COMPLETE_SUBTEXT =
  "Settings applied to optimize the experience for you.";

// ── Multiple mode (Selection: Multiple) — additive; Single mode's functions
// above are all untouched. ──────────────────────────────────────────────

/** Header title, 2+ selected, Phases 1 & 3 — tone-varying, falls back to
 * `straightforward` (same pattern as `titleDuring`). */
export function titleDuringMultiple(tone: ToneOfVoice, count: number): string {
  const t = TUNING_COPY[tone] ?? TUNING_COPY.straightforward;
  return (t.titleDuringMultiple ?? TUNING_COPY.straightforward.titleDuringMultiple!)(count);
}

/** Header title, 2+ selected, Phase 4 (complete). */
export function titleCompleteMultiple(tone: ToneOfVoice, count: number): string {
  const t = TUNING_COPY[tone] ?? TUNING_COPY.straightforward;
  return (t.titleCompleteMultiple ?? TUNING_COPY.straightforward.titleCompleteMultiple!)(count);
}

/** Header subtext, Phase 4, Multiple mode — "{free} settings applied ·
 * {paid} features with VPN Plus". Both counts are the TRUE merged totals
 * (never the capped/displayed row counts) — confirmed at checkpoint
 * alongside the curated-list caps themselves; see
 * docs/features/onboarding-v2.md → "Multiple-mode result curation". The
 * profiles count was dropped from this sentence (confirmed at a later
 * checkpoint) — profiles are still shown in the Plus section itself
 * (`ProfilesSummaryRow`), just no longer tallied in this summary line. */
export function summarySubtextMultiple(tone: ToneOfVoice, applied: number, features: number): string {
  const t = TUNING_COPY[tone] ?? TUNING_COPY.straightforward;
  return (t.summarySubtextMultiple ?? TUNING_COPY.straightforward.summarySubtextMultiple!)(applied, features);
}

/** Plus plan, Multiple mode — the flat-list completion subtext: applied
 * count only, no "· N available/features with VPN Plus" clause (there's
 * nothing locked to report). `applied` is the TRUE merged total (never the
 * capped/displayed row count — see `TunedResult`'s `truePlusAppliedTotal`),
 * consistent with single mode's own `summarySubtext(tone, applied, 0)`
 * branch. Same optional-field/straightforward-fallback precedent as
 * `summarySubtextMultiple` (full per-tone variants for Multiple-mode extras
 * confirmed out of scope at an earlier checkpoint). */
export function summarySubtextMultiplePlus(tone: ToneOfVoice, applied: number): string {
  const t = TUNING_COPY[tone] ?? TUNING_COPY.straightforward;
  return (t.summarySubtextMultiplePlus ?? TUNING_COPY.straightforward.summarySubtextMultiplePlus!)(applied);
}

/** Plus plan, Multiple mode only — the display-cap overflow footnote. `count`
 * is the TRUE overflow beyond what's shown (`TunedResult`'s
 * `plusOverflowCount`, itself the sum of the existing free/paid caps' own
 * `overflow` fields — no new cap introduced, confirmed at checkpoint).
 * Tone-constant (matches `plusSectionHeader`'s precedent for structural,
 * non-benefit copy on this screen). */
export function moreSettingsTuned(count: number): string {
  return `+${count} more setting${count === 1 ? "" : "s"} tuned for you`;
}

/** Phase-1 narration for the Multiple-mode Plus section's one-line
 * profiles-summary row (`ProfilesSummaryRow`) — tone-CONSTANT, same
 * precedent as `narrateChecking`/`narrateEnabling`. */
export function narratePreparingPlusPreview(): string {
  return "Preparing your Plus preview\u2026";
}

/** Header subtext, Phase 4 (complete): the summary line — tone-varying
 * wording around the counts (`TUNING_COPY[tone].summarySubtext`); the counts
 * themselves (derived by the caller) and the underlying free/paid split are
 * identical across tones, only the phrasing wrapping them changes. Falls
 * back to `straightforward` if a tone is somehow missing. */
export function summarySubtext(tone: ToneOfVoice, applied: number, locked: number): string {
  return (TUNING_COPY[tone] ?? TUNING_COPY.straightforward).summarySubtext(applied, locked);
}

/** Present-tense narration verbs for the Phase-1 "Enabling {name}…" line
 * (free settings, and paid features when a Plus user already owns them — see
 * "Plan awareness"). Keyed by the exact `settingsName`/`featureName` string
 * from `JTBD_TUNING_RESULT`. Anything not listed here falls back to the
 * generic "Enabling {name}…" pattern (never hardcoded per-JTBD, so new
 * settings/features added to the data source automatically get a sensible
 * default without touching this file). */
const ENABLING_NARRATION: Record<string, string> = {
  "Kill Switch": "Enabling Kill Switch…",
  Protocol: "Selecting protocol…",
  "Auto Connect": "Setting up Auto Connect…",
  NetShield: "Enabling NetShield…",
  "Secure Core": "Routing through Secure Core…",
  "Moderate NAT": "Easing NAT restrictions…",
  "Server breadth": "Expanding server access…",
  "Fastest outside-country": "Finding the fastest server…",
  "Bypass profile": "Setting up bypass profile…",
  "Home country profile": "Setting up home profile…",
  "Network warning": "Enabling network warnings…",
  "Streaming servers": "Unlocking streaming servers…",
  "VPN Accelerator": "Enabling VPN Accelerator…",
  "Port Forwarding": "Opening ports…",
  "P2P servers": "Connecting to P2P servers…",
};

/** Phase-1 narration for a free (or Plus-unlocked) item: "Enabling {name}…",
 * falling back to the setting/feature name itself when not in the map above. */
export function narrateEnabling(name: string): string {
  return ENABLING_NARRATION[name] ?? `Enabling ${name}…`;
}

/** Phase-1 narration for a locked item: "Checking {name}…" — always this
 * exact pattern per the spec (no per-feature overrides needed). */
export function narrateChecking(name: string): string {
  return `Checking ${name}…`;
}
