# Concept 5 — The Rehearsal

**Concept id:** `profiles-rehearsal`
**Dropdown label:** `Profiles — Rehearsal stage`
**Build order:** second. Designed to compose with [04-baseline.md](04-baseline.md) rather than compete with it.

> Prerequisite: [_foundation.md](_foundation.md). Registration follows [_foundation.md](_foundation.md) §7.

## 1. Essence

Profiles you can watch run before you own them. Selecting one rehearses it live on a stage that occupies most of the screen, then returns to the protected baseline — so "what happens if I click" is answered by clicking, at no cost and with no commitment.

This is the only concept whose clarity mechanism is behavioural rather than textual, which makes it the direct answer to the usability finding that motivated this work.

## 2. What the user sees

Body slot at `bodyMaxWidthClassName="max-w-[840px]"`, split vertically:

**Upper two thirds — the stage.** A single bordered panel. At rest it shows the protected baseline state: a lit status glyph, the line "This is you now — protected, set up for everything you picked", and the tuned settings named as two short chips. During a rehearsal the panel's content is replaced: the destination's flag and country name animate in at the top, and a narration column writes two or three lines one at a time as each step "happens". When the rehearsal finishes the panel settles back to the baseline state.

**Lower third — the tiles.** A compact horizontal row of profile tiles, one per selected intent, each with the intent glyph, the profile name, and a destination chip. Tiles are small and calm on purpose: they are triggers, not explanations, because the stage carries the explanatory burden. Above the row sits a heading and a "Rehearse everything" control.

Beneath: the persistence caption and, when present, the muted Plus feature line.

## 3. Component tree

New folder `src/app/onboarding-v2/tuned-result/concepts/profiles-rehearsal/`.

**`ProfilesRehearsalConcept.tsx`**

```tsx
export const PROFILES_REHEARSAL_CONCEPT = "profiles-rehearsal";

export default function ProfilesRehearsalConcept({
  jtbdKey, selectionMode = "single", selectedJtbds,
  tone = "straightforward", userPlan = "free", onContinue, onBack,
}: TuningConceptProps)
```

Owns the rehearsal state machine (§5) and renders `RehearsalStage` plus the tile row inside `ConceptFrame`.

**`RehearsalStage.tsx`**

```tsx
type StagePhase = "baseline" | "travelling" | "narrating" | "returning";

interface RehearsalStageProps {
  /** Null when idle — the stage shows the baseline. */
  rehearsing: TunedProfile | null;
  phase: StagePhase;
  /** Narration lines revealed so far, in order. */
  narrationShown: string[];
  /** Baseline settings for the resting state's chips. */
  settings: ProfileSetting[];
  /** True when the rehearsing profile is not reachable on this plan, so the
   * stage must label itself a demonstration. See §9. */
  demonstrationOnly: boolean;
  reduced: boolean;
}
```

Flags come from the app's existing flag layer — `getIsoCode(countryName)` from [src/app/components/flagComponents](../../../src/app/components/flagComponents.tsx), the same resolver [lib/server.ts](../../../src/app/onboarding-v2/lib/server.ts) uses. For a profile with `country: null` (Gaming, Travel, Access) there is no flag; the stage shows the intent glyph and the `countryLabel` text instead. No invented flag, no placeholder country.

**`RehearsalTile.tsx`**

```tsx
interface RehearsalTileProps {
  profile: TunedProfile;
  unlocked: boolean;
  /** Disabled until the applying sequence finishes. */
  enabled: boolean;
  active: boolean;
  onRehearse: () => void;
  /** Shown after this profile has been rehearsed at least once. */
  showKeepAction: boolean;
}
```

Wraps the shared `ProfileCard` at `size="tile"` with `sentence="none"` — the stage says what the tile would have said — and supplies its own `footer` for the keep action.

**`useRehearsal.ts`** — the state machine, extracted so the concept component stays readable and the timing is testable in isolation.

```ts
interface UseRehearsalResult {
  rehearsing: TunedProfile | null;
  phase: StagePhase;
  narrationShown: string[];
  rehearsedIds: Set<JtbdId>;
  start: (profile: TunedProfile) => void;
  startAll: () => void;
  cancel: () => void;
}

export function useRehearsal(reduced: boolean): UseRehearsalResult
```

Must clear all pending timers on unmount and on `cancel`, and starting a new rehearsal while one is running cancels the first cleanly rather than interleaving. Follow the `setTimeout` accumulation and cleanup pattern in [useTunedMaterialization.ts](../../../src/app/onboarding-v2/tuned-result/useTunedMaterialization.ts).

## 4. States

**Intro / applying.** Unchanged from every other concept: `ConceptFrame` owns the centered header and hides the body. The stage mounts at `introDone` in its baseline state with the status line reading "Turning on your protection…". Setting rows and profile tiles materialize through `MaterializingSlot` on the shared schedule.

**Idle, rehearsable.** Once `rowsComplete` is true, tiles become interactive (`enabled`) and the stage settles into its baseline resting state. **Rehearsal is gated on `rowsComplete`** — a user cannot rehearse while the app is still applying settings, because the stage would be describing two things at once.

**Rehearsing.** See §5.

**Rehearsed at least once.** The tile that was rehearsed gains a keep action in its footer: "Keep this in my sidebar", locked on Free with the Plus availability label. This is the highest-intent moment available, because the user has just understood what the thing does.

**Resolved, Free.** Tiles locked for keeping, unlocked for rehearsing. Every rehearsal is available.

**Resolved, Plus.** Tiles active; the keep action is live; destination chips carry no Plus badge; `demonstrationOnly` is false for every profile, so no stage carries the demonstration label.

**Reduced motion.** The stage does not animate. A rehearsal becomes a single state swap: the destination and all narration lines appear at once, hold for `rehearseHoldMs`, then return. The user gets the same information in one step instead of three. This is a genuine static fallback, not a faster animation — this concept's value lives in motion, so the fallback has to stand on its own.

## 5. Motion and the rehearsal sequence

Three new keys in `TUNING_CONCEPT_TIMING` in [timing.ts](../../../src/app/onboarding-v2/tuned-result/timing.ts), which already exists for exactly this purpose (it currently holds `ringFillMs` and `lineDropMs`):

```ts
rehearseTravelMs: 700,   // destination animates in
rehearseStepMs: 900,     // gap between narration lines
rehearseHoldMs: 1200,    // pause on the completed state
rehearseReturnMs: 500,   // settle back to baseline
```

Sequence for a rehearsal of profile P with narration lines L1..Ln (n is two or three, see §6):

1. `phase: "travelling"` — destination flag and name animate in over `rehearseTravelMs`. Tile shows an active state.
2. `phase: "narrating"` — L1 appears, then each subsequent line after `rehearseStepMs`. Total `n * rehearseStepMs`.
3. Hold for `rehearseHoldMs` on the completed state, with the final line reading as a completion.
4. `phase: "returning"` — over `rehearseReturnMs`, the destination fades and the baseline state fades back in.
5. `phase: "baseline"`, `rehearsing: null`.

Total for three lines: roughly 5.1 seconds. Interruptible at any point by starting another rehearsal or by Continue.

**The return is as important as the rehearsal.** It is what makes experimentation feel free rather than consequential, and it is the structural mechanism for R2 (§9). It must never be skipped, even under reduced motion, where it becomes an instant swap.

`startAll` chains every selected profile's rehearsal in selection order, then ends on the baseline with the combination note (§9, R1).

## 6. Copy

New key in `TUNING_CONCEPTS_COPY` in [conceptsCopy.ts](../../../src/app/onboarding-v2/tuned-result/conceptsCopy.ts):

```ts
profilesRehearsal: {
  stageBaselineDuring: "Turning on your protection…",
  stageBaselineRest: "This is you now — protected, set up for everything you picked.",
  stageReturnLine: "Back to your everyday protection.",
  tilesHeader: "Try any of these — nothing changes until you choose to keep it",
  rehearseAllLabel: "Rehearse everything",
  keepLabel: "Keep this in my sidebar",
  demonstrationNote: "This is a preview of what this shortcut does.",
  freeLocationNote: "On the free plan this would use a free location. The settings are the same.",
  combinationNote: "Both of these sit on top of the protection you already have.",
},
```

**Narration lines** are built per profile, not authored per profile, so they cannot drift from the data. A builder in the concept folder:

```ts
function narrationFor(profile: TunedProfile): string[]
```

Line 1 — the destination: `Connecting through ${profile.countryLabel}…`, or for rule-based destinations `Finding the fastest nearby country…` / `Finding the fastest country outside yours…`.
Line 2 — the settings, in plain language, derived from `profileSettings(profile.jtbd)`: `Setting up your connection the way ${profile.name.toLowerCase()} needs it…`. Do not enumerate protocol or kill-switch values here; the chips already carry them and the constraint is no jargon.
Line 3 — completion: `Done — that's what this shortcut does.`

Header title, subtitle and summary come from `useProfilesConceptData` unchanged, so all four tones work.

### This concept's own shared-code change: `ConceptFrame.subtextSlot`

This is the second change to `ConceptFrame` in this family — the first is the `ConceptFrameData` extraction in [_foundation.md](_foundation.md) §5.4, which every concept needs. The two are independent and compatible.

During a rehearsal the header's derived subtext ("2 settings applied · 3 features with VPN Plus") is stale and competes with the stage. Rather than fork the frame, add one optional prop to [ConceptFrame.tsx](../../../src/app/onboarding-v2/tuned-result/concepts/ConceptFrame.tsx):

```tsx
/** Replaces the derived subtext while non-null. Undefined (the default)
 * keeps the existing intro / counter / summary behaviour exactly. */
subtextSlot?: ReactNode;
```

In the subtext `AnimatePresence`, prefer `subtextSlot` when defined, keying on a stable string so the crossfade still works. Three lines of change, backwards-compatible, and no existing concept passes it. This concept passes the rehearsing profile's name while a rehearsal is running and `undefined` otherwise.

If this change is rejected in review, the fallback is to leave the header alone and rely on the stage's own caption. The concept still works; the header is just briefly stale.

## 7. Data requirements

From `useProfilesConceptData`: `settingRows` for the stage's resting chips, `profileRows` for the tile row, `plusFeatureRows` for the muted line, `paidUnlocked`, and the materialization state to gate interactivity on `rowsComplete`.

From `TunedProfile`: `name`, `icon`, `country`, `countryLabel`, `freeRunnable`. `deltaSentence` and `effectSentence` are unused here — the stage replaces them, which is the point.

This concept never renders a *profile's* settings values. The stage's resting chips are the baseline's, straight from `settingRows`, and narration line 2 references the settings without printing values (§6). So `effectiveProfileSettings` ([_foundation.md](_foundation.md) §2.2b) is not needed here — but if a future revision adds per-profile settings chips to the tiles, it becomes mandatory.

`getIsoCode` from the existing flag layer for profiles with a non-null country.

## 8. Settings tuning: goes

**Removed as a list. Survives only as narration and as two resting chips on the stage.**

Rationale: settings are most comprehensible as *events*. "Setting up your connection the way streaming needs it" lands when a user watches it happen, and reads as noise in a static list. A user who rehearses two profiles will have seen the baseline settings referenced in context twice, which produces better comprehension than a list they skipped.

The two chips on the resting stage are the honesty floor — the specific values remain visible and tooltipped via `SettingChip`, so nothing is hidden. What is removed is the dedicated settings section, not the information.

## 9. The mandated behaviours

**What a Free user gets.** Every rehearsal, for every profile, as many times as they like — plus the tuned baseline genuinely applied and active when they leave. What VPN Plus adds is keeping a rehearsed setup as a one-tap sidebar item.

The free/Plus line here is the cleanest of the five: understanding is free, convenience is paid. It is also the most vulnerable to feeling thin, since a user who watched five demonstrations and kept none may feel toyed with. Two mitigations, both required rather than optional:

- The stage's resting state must be unmistakably *theirs and active* — the baseline is not a backdrop, it is the thing they now own, and the copy says so.
- If this concept ships alongside [04-baseline.md](04-baseline.md), reuse that concept's anchor treatment for the resting state so the free outcome reads as a possession. The two concepts are designed to compose.

**Honesty about what a rehearsal is.** This is the concept's main hazard and the spec is strict about it. A rehearsal is a **demonstration on a self-contained stage**, not a real connection. It must never be mistaken for one:

- The stage is a bordered panel inside the body. It deliberately does **not** drive the real world map behind the onboarding overlay. Hijacking the real map would imply a real connection and is out of scope — see §11.
- When `demonstrationOnly` is true, the stage carries `demonstrationNote` for the whole rehearsal, not just a frame of it. `demonstrationOnly` is `!profile.freeRunnable && userPlan === "free"`.
- Where a profile is not free-runnable, `freeLocationNote` explains the substitution in plain words. No silent fallback.
- Nothing in the narration says "connected". Line 1 is "Connecting through…" as an in-progress description of the demonstration, and line 3 is "that's what this shortcut does" — a description, not a claim.

**Clarity about what a profile does.** The strongest of the five, and it works by removing the cost of finding out rather than by describing better. The user clicks, watches, and returns. There is no commitment to fear and therefore no question to hesitate over.

**R1 — "Why not one profile with all of them?"** The "Rehearse everything" control plays each selected profile in turn and ends on the baseline. The user *sees* that the combined thing already exists rather than being told the question is misplaced. With a single intent selected the control is hidden, since there is nothing to combine.

**R2 — "Travel but also privacy?"** Structural, via the return. Every rehearsal ends by coming home to protection, so the user watches — repeatedly — that using a shortcut is temporary and the protected state is the resting state. After a second distinct profile has been rehearsed, `combinationNote` appears once beneath the stage.

**R3 — persistence.** The keep action names the destination inside the label ("Keep this in my sidebar"), offered at the moment the user has just understood the value. Backed by [_sidebar-handoff.md](_sidebar-handoff.md). `PERSISTENCE_CAPTION` sits beneath the tile row.

## 10. Wiring

Per [_foundation.md](_foundation.md) §7, with `PROFILES_REHEARSAL_CONCEPT` as the analytics id.

Worth adding beyond the standard events: fire `trackTuningEvent` on each rehearsal start with the profile's `jtbd` and whether it was a single rehearsal or part of "Rehearse everything". Which profiles people choose to rehearse, and how many they try, is the most useful signal this concept can produce, and `trackTuningEvent` already accepts an arbitrary payload.

## 11. Trade-offs, risks, verification

**Risks.**

- Heaviest of the five to build: a timed state machine, a new stage component, and a genuine static fallback.
- Highest honesty hazard. A demonstration that reads as a connection would damage trust in a privacy product more than a dull screen ever could. The §9 rules are not negotiable.
- Adds time to a flow that already has a materialization sequence. A user who rehearses five profiles spends well over half a minute on this screen. Acceptable for an opt-in exploration; worth watching in testing.
- If free users can keep nothing, the "shown things I can't have" risk is highest here of all five concepts.
- **Driving the real map is out of scope but tempting.** It would be more impressive and would require threading a rehearsal callback from the concept up through `OnboardingV2` to `App.tsx`'s `WorldMap`, plus a way to distinguish a rehearsal from a real connection in the map's own state. That is a larger change than this whole concept and it worsens the honesty problem. Recorded here so it is a deliberate decision rather than an oversight.
- The sidebar rows a kept profile lands on are descriptive, not clickable-to-connect (see [_sidebar-handoff.md](_sidebar-handoff.md) §9). This concept's "one tap" language is the most exposed to that gap of any of the five.

**Verification.**

- `npx tsc --noEmit` clean; `npm run build` succeeds.
- Tiles are non-interactive until the applying sequence completes, then become interactive.
- Rehearse each of the six profiles in Single mode: destination correct, flag present for United States, Netherlands and Switzerland, absent with a text label for the three rule-based destinations, three narration lines, return to baseline.
- Start a rehearsal and immediately start another: the first cancels cleanly with no interleaved narration and no orphaned timers.
- Start a rehearsal and press Continue mid-sequence: navigation happens, no state update after unmount, no console warning.
- Free plan: Streaming, Privacy and Access rehearsals show `demonstrationNote` throughout, and the free-location note where a substitution is described. Gaming, Travel and Downloading do not.
- Plus plan: no demonstration note anywhere, keep action live, Continue exits to the app rather than the upsell.
- "Rehearse everything" with three intents plays all three in selection order and ends on the baseline. Hidden with one intent selected.
- `combinationNote` appears only after two *distinct* profiles have been rehearsed, and does not reappear or duplicate.
- `prefers-reduced-motion`: a rehearsal is one swap, holds, returns. No spinner phases anywhere. The whole concept remains usable.
- With `subtextSlot` implemented, the three existing concepts and their header behaviour are unchanged.
