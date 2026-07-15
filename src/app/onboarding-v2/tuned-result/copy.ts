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
  plusHeader: "Available with VPN Plus",
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
 * precedent as `TUNED_RESULT_COPY.plusHeader`. */
export const PROFILES_INTRO_TEXT = "One-click profiles for your interest";

/** The JTBD word used in "Tuning for {jtbd}…" / "Tuned for {jtbd}" — the
 * existing `jtbdLabel` (from `JTBD_TUNING_RESULT`) lowercased. For "bypass",
 * `jtbdLabel` is already the project's agreed gerund short form
 * ("Bypassing restrictions") rather than the picker's noun form ("Bypass
 * restrictions"), which reads more naturally after "for" — no separate
 * lookup table needed. */
export function jtbdWord(jtbdLabel: string): string {
  return jtbdLabel.toLowerCase();
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
  "LAN setting": "Configuring LAN setting…",
  "NAT type": "Configuring NAT type…",
  "Hidden IP": "Hiding your IP…",
  "Smart Protocol": "Selecting protocol…",
  "Stealth protocol": "Selecting protocol…",
  "Alternative Routing": "Setting up alternative routing…",
  "Encrypted connection": "Turning on encrypted connection…",
  "Device support": "Setting up device support…",
  "WireGuard Kernel": "Enabling WireGuard Kernel…",
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
