# Concept 2 — The Deck

**Concept id:** `profiles-deck`
**Dropdown label:** `Profiles — Focused deck`
**Build order:** fourth. Blocked on one product decision and one technical confirmation (§9).

> Prerequisite: [_foundation.md](_foundation.md). Registration follows [_foundation.md](_foundation.md) §7. This concept depends specifically on `effectiveProfileSettings` ([_foundation.md](_foundation.md) §2.2b).

## 1. Essence

One setup at a time, big enough to be understood completely, with a before-and-after of exactly what it changes — and a free path to try it once.

Depth-first, where [01-shelf.md](01-shelf.md) is breadth-first. The user meets one profile at a time and cannot mistake what it is, because the screen is doing nothing else.

## 2. What the user sees

Body slot at `bodyMaxWidthClassName="max-w-[900px]"`.

A single large card centered at a fixed 560px, with the adjacent cards peeking in from the left and right edges, clipped. Beneath it a pager: one small intent glyph per card, the current one marked.

The focused card is a complete detail view in two halves. The upper half is a visual: the destination's flag and name, or for rule-based destinations the intent glyph and the destination's plain label. The lower half is the **before-and-after strip** — two columns headed "Now" and "With this setup", with three rows:

- Where you appear to be
- How your connection is made
- If your protection drops

Two actions at the foot of the card: **"Try it now"** and **"Keep it in my sidebar"**.

The last card in the deck is always **"Everything at once"**, which shows the merged baseline in the same before-and-after format and explains that it is already running.

## 3. Component tree

New folder `src/app/onboarding-v2/tuned-result/concepts/profiles-deck/`.

**`ProfilesDeckConcept.tsx`**

```tsx
export const PROFILES_DECK_CONCEPT = "profiles-deck";

export default function ProfilesDeckConcept({
  jtbdKey, selectionMode = "single", selectedJtbds,
  tone = "straightforward", userPlan = "free", onContinue, onBack,
}: TuningConceptProps)
```

Owns the current-index state and the "tried" set.

**`DeckCard.tsx`**

```tsx
interface DeckCardProps {
  /** Null for the trailing "Everything at once" card. */
  profile: TunedProfile | null;
  rows: ComparisonRow[];
  unlocked: boolean;
  tried: boolean;
  /** False while the applying sequence is still running. */
  interactive: boolean;
  onTry: () => void;
  onKeep: () => void;
  reduced: boolean;
}
```

**`ComparisonStrip.tsx`**

```tsx
export interface ComparisonRow {
  /** Plain-language question, never a settings name. */
  question: string;
  now: string;
  withProfile: string;
  /** False when the two are identical — see §8. */
  changed: boolean;
  /** The winning value's explanation, for the row's info affordance. */
  tooltip?: string;
}

interface ComparisonStripProps {
  rows: ComparisonRow[];
  reduced: boolean;
}
```

**`comparisonRows.ts`** — the builder, so no card authors its own comparison:

```ts
export function comparisonRows(
  profile: TunedProfile | null,
  baselineSettings: ProfileSetting[],
  baselineDestinationLabel: string,
): ComparisonRow[]
```

Row 1 is the destination: `now` is `baselineDestinationLabel`, `withProfile` is `profile.countryLabel`. Rows 2 and 3 pair `baselineSettings` against `effectiveProfileSettings(profile.jtbd, baselineSettings)` by setting name, using a fixed plain-language question per name:

- `"Protocol"` → "How your connection is made"
- `"Kill Switch"` → "If your protection drops"

For the trailing card (`profile: null`) every row is `changed: false` and `withProfile` equals `now`, because the baseline is already what is running.

`baselineDestinationLabel` is `"Fastest country"` on Free, or the Plus country pick when there is one. This is the one piece of state the concept reads from outside `useProfilesConceptData`; pass the existing `selectedCountry` down from `OnboardingV2` as an optional prop, defaulting to `null`.

**`DeckPager.tsx`** — glyph-per-card pager, with `onSelect(index)`. Keyboard: left and right arrows move between cards when the deck has focus; the pager items are real buttons with `aria-current`.

### Single-selection behaviour

With one intent selected the deck holds two cards: that profile, then "Everything at once". The pager renders with two items rather than being hidden, since navigation is still meaningful. There are no peeking neighbours when only two cards exist and the second is off-screen — the peek is a hint, not a requirement.

## 4. States

**Intro / applying.** `ConceptFrame` owns the intro. The Deck maps the shared row schedule onto building the first card:

1. Setting rows (indices `0..s-1`) fill the **"Now"** column, one row at a time, through `MaterializingSlot`.
2. The first profile row resolves the **"With this setup"** column, the destination visual, and the actions.
3. Remaining profile rows add cards to the deck — visible as pager items appearing and the peek edges arriving.
4. `plusFeatureRows` render as one muted line beneath the deck, or nothing when empty.

**Idle.** Actions become interactive only once `rowsComplete` is true. A user cannot try a profile while the app is still applying settings.

**Tried.** A tried card shows a quiet confirmation in place of "Try it now" — "You tried this" — and the keep action becomes the primary. The tried set persists for the life of the screen.

**Resolved, Free.** "Try it now" is live on every card (subject to §9). "Keep it in my sidebar" is locked, carrying `PLUS_AVAILABILITY_LABEL`. Destination chips use `planAware`.

**Resolved, Plus.** Both actions live, no badges, no availability label. `paidUnlocked` is true.

**Reduced motion.** Card transitions become instant swaps rather than slides. The comparison rows appear without stagger. `ConceptFrame` skips the header travel. Everything remains reachable.

## 5. Motion

Existing keys for the applying phase, via the shared schedule: `spinnerHold`, `resolveDuration`, `rowGap`, plus the `ConceptFrame` intro keys.

One new key in `TUNING_CONCEPT_TIMING` in [timing.ts](../../../src/app/onboarding-v2/tuned-result/timing.ts):

```ts
deckSlideMs: 350,   // card-to-card travel
```

Card changes slide horizontally and re-animate the comparison rows with a short stagger derived from `resolveDuration`, so the *differences between* profiles are legible: the same three rows change while the frame stays put, which is how a user learns the shape of the concept.

## 6. Copy

New key in `TUNING_CONCEPTS_COPY` in [conceptsCopy.ts](../../../src/app/onboarding-v2/tuned-result/conceptsCopy.ts):

```ts
profilesDeck: {
  nowHeader: "Now",
  withHeader: "With this setup",
  noChange: "No change",
  tryLabel: "Try it now",
  triedLabel: "You tried this",
  keepLabel: "Keep it in my sidebar",
  everythingCardName: "Everything at once",
  everythingCardBody: "This is what's running already. It covers every interest you picked, and it stays on whether or not you use a shortcut.",
  freeLocationSubstitution: "We'll use a free location for this. The setup is the same.",
},
```

From `profilesCopy.ts`: `PLUS_AVAILABILITY_LABEL`, `PERSISTENCE_CAPTION`.

Comparison questions are fixed strings in `comparisonRows.ts` (§3). Neither `effectSentence` nor `deltaSentence` is used — the comparison replaces both, which is this concept's whole proposition.

Header strings come from `useProfilesConceptData` unchanged; all four tones work.

## 7. Data requirements

From `useProfilesConceptData`: `settingRows` for the "Now" column, `profileRows` for the deck, `plusFeatureRows`, `paidUnlocked`, materialization state.

From `TunedProfile`: `name`, `icon`, `country`, `countryLabel`, `freeRunnable`. Settings via `effectiveProfileSettings` — never `profileSettings` values directly ([_foundation.md](_foundation.md) §2.2b).

New external input: `selectedCountry` from `OnboardingV2`, for `baselineDestinationLabel`.

`getIsoCode` from [flagComponents](../../../src/app/components/flagComponents.tsx) for profiles with a non-null country.

## 8. Settings tuning: goes

**Removed as an outcome in its own right. Reframed as the "Now" column.**

The tuned baseline is no longer presented as a result; it is the starting state every card compares itself against. This gives the settings a job rather than a slot, and it means every card silently restates that the baseline exists and is applied.

### The "No change" rows are the feature, not a bug

This needs stating clearly, because it looks like a defect on first read.

In Single mode a profile's settings are *identical* to the baseline's, since both read the same `JTBD_TUNING_RESULT[jtbd].enabled`. In Multiple mode `effectiveProfileSettings` guarantees a profile is never weaker than the baseline. So rows 2 and 3 will very often read "No change", and only row 1, the destination, differs.

That is the truthful and reassuring answer: **using a shortcut changes where you connect, not how protected you are.** Render "No change" in a calm muted treatment, never as an error or an empty state, and let it do the reassurance work. A design that hid these rows because they look repetitive would be throwing away the concept's strongest evidence for R2.

## 9. What a Free user gets

**"Try it now" is free on every card.** A Free user can apply any setup once, in the moment. What VPN Plus adds is *keeping* it: saved to the sidebar, one tap, permanently.

The justification is that this gates convenience rather than capability. A determined free user could already reach most of a profile's state by hand through settings, so selling permanence and one-tap access is a cleaner proposition than selling access to a state they could reach anyway. It also means the free payoff is an experience rather than a description.

**This concept has two hard external dependencies, and must not be built as though either is settled:**

1. **Product decision** — whether one-time application of a profile is offered on the free tier at all. If the answer is no, this concept degrades to a deck of locked cards with a "Now" column, which by the brief's own standard is not a valid outcome for a free user. Resolve this before building.
2. **Technical confirmation** — whether settings can be applied and cleanly reverted within a session. Nothing in the current prototype does this; the connection lifecycle in `useConnectionAttempt` has no notion of a temporary settings change.

Where a profile is not free-runnable, the try action offers the nearest free location and says so with `freeLocationSubstitution`. Never a silent substitution, and never a failure state.

## 10. The remaining mandated behaviours

**Clarity about what a profile does.** The strongest textual mechanism of the five: the user sees the change staged before committing, in three plain-language rows, with a visible "before". This is the pattern borrowed from Opal's before-and-after — comparing states of a system rather than an image.

**R1 — "Why not one profile with all of them?"** The trailing "Everything at once" card is exactly that, in the same format as every other card. Users who ask this question tend to navigate looking for it, so putting it in the deck rewards the instinct rather than correcting it.

**R2 — "Travel but also privacy?"** Structural and doubly reinforced. Every card's "Now" column *is* the protected baseline, so on every card the user sees the starting state is already safe; the card is incapable of implying that choosing it is a trade. And the "No change" rows (§8) prove that protection is not what a shortcut changes.

**R3 — persistence.** Carried by the action label: "Keep it in my sidebar" names the destination as part of the verb, so there is nothing to forget. `PERSISTENCE_CAPTION` sits beneath the deck. Backed by [_sidebar-handoff.md](_sidebar-handoff.md).

## 11. Wiring

Per [_foundation.md](_foundation.md) §7, with `PROFILES_DECK_CONCEPT` as the analytics id. One addition to the standard render block: pass `selectedCountry={selectedCountry}` from `OnboardingV2`'s existing state (§7).

Worth tracking beyond the standard events: which card index the user reached, and whether any profile was tried. How far into a deck people navigate is the clearest signal of whether depth-first was the right call.

## 12. Trade-offs, risks, verification

**Risks.**

- **A deck hides its own contents.** A user who selected five intents sees one card and must discover the rest. The breadth of what was built for them — arguably the point of asking about intents at all — is no longer visible at a glance. The pager mitigates this but does not solve it.
- **Highest authoring cost of the five.** Every intent needs a three-row comparison in plain language that stays honest when intents merge. The builder approach (§3) keeps this derived rather than authored, but the plain-language questions and the "No change" treatment need careful review.
- **Two external dependencies** (§9), either of which can collapse the free story.
- **"No change" may read as broken** to a reviewer who has not read §8. Worth flagging explicitly in design review.
- Peeking cards at 560px inside a 900px body leaves narrow slivers. If that reads as clutter rather than as a hint, the fallback is a plain pager with no peek, which costs the deck affordance but not the concept.

**Verification.**

- `npx tsc --noEmit` clean; `npm run build` succeeds.
- Single mode, each of the six intents: two cards, correct order, pager with two items, the trailing card showing all rows unchanged.
- Multiple mode at three and six intents: card count is `n + 1`, order matches selection order, pager glyphs match the intents.
- **The downgrade check.** Select Gaming then Privacy. Open Gaming's card. Row 3 reads Kill Switch `"Advanced"` in both columns and `changed: false` — never `"Standard"` in the "With this setup" column. Repeat for Gaming plus Bypass on row 2 with `"Stealth"`.
- Row 1 shows the correct destination on both sides, and on Plus with a country picked, the "Now" side reflects that pick.
- Free plan: try action live, keep action locked with the availability label, and the free-location substitution message appears for Streaming, Privacy and Access but not for Gaming, Travel or Downloading.
- Plus plan: both actions live, no badges, Continue exits to the app rather than the upsell.
- Actions are inert until the applying sequence completes.
- Keyboard: arrow keys move between cards; pager items are focusable and expose `aria-current`.
- All four tones render without layout breakage.
- `prefers-reduced-motion`: instant card swaps, no staggered rows, no spinner phases, everything reachable.
- The default `TunedResult` and the three existing concepts are unchanged.
