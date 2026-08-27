# Concept 4 — Baseline + Shortcuts

**Concept id:** `profiles-baseline`
**Dropdown label:** `Profiles — Baseline + shortcuts`
**Build order:** first. Requires no product decision and no new entitlement.

> Prerequisite: [_foundation.md](_foundation.md). This spec uses `TunedProfile`, `JTBD_PROFILES`, `useProfilesConceptData`, `ProfileCard`, `DestinationChip`, `SettingChip`, and the copy constants defined there. Registration follows [_foundation.md](_foundation.md) §7 verbatim.

## 1. Essence

Two visually distinct registers on one screen: a compact, bright, already-on protection anchor, and beneath it a majority-of-the-screen tier of optional shortcuts. The layout itself says "you're covered either way", so the reassurances are carried by information architecture rather than by copy a user might skip.

## 2. What the user sees

Inside `ConceptFrame`'s body slot, at `bodyMaxWidthClassName="max-w-[880px]"` — wider than the 704px default because the shortcut grid needs three columns:

**Upper register — the anchor.** One full-width bar, visually the loudest element on the screen: a lit status glyph, the line "Your protection is on.", a second line naming every selected intent, and a right-aligned disclosure control labelled "What we changed". Expanding it reveals the tuned settings as chips. Collapsed by default.

**Lower register — the shortcuts.** A section heading, one line of reassurance beneath it, then the profile tiles in a grid occupying the remaining roughly three quarters of the body. Each tile carries the intent glyph, the profile name, a destination chip, a one-line delta sentence, and a small composition line. Tiles are rendered in a deliberately *lighter* register than the anchor — outlined rather than filled, lower contrast — because they are extras, not replacements.

Beneath the grid: the persistence caption, and if the data has one, a single muted line naming the top-ranked Plus feature.

## 3. Component tree

New folder `src/app/onboarding-v2/tuned-result/concepts/profiles-baseline/`.

**`ProfilesBaselineConcept.tsx`** — the concept entry point, implementing `TuningConceptProps`.

```tsx
export const PROFILES_BASELINE_CONCEPT = "profiles-baseline";

export default function ProfilesBaselineConcept({
  jtbdKey, selectionMode = "single", selectedJtbds,
  tone = "straightforward", userPlan = "free", onContinue, onBack,
}: TuningConceptProps)
```

Body: `useReducedMotion()`, then `useProfilesConceptData(...)`, then a `Tooltip.Provider` wrapping `ConceptFrame` — the same shape [ChecklistConcept.tsx](../../../src/app/onboarding-v2/tuned-result/concepts/ChecklistConcept.tsx) uses, so it reads as a sibling of the existing concepts.

**`ProtectionAnchor.tsx`**

```tsx
interface ProtectionAnchorProps {
  /** Baseline settings with their materialization index. */
  settingRows: SettingRow[];
  rowStages: RowStage[];
  rowMounted: boolean[];
  /** Intent names, for the coverage line. */
  intentNames: string[];
  /** True once every settingRow has resolved. */
  settled: boolean;
  reduced: boolean;
}
```

Renders the bar, owns its own expand/collapse state (`useState<boolean>(false)`), and renders one `SettingChip` per resolved setting row inside the expanded panel. The collapsed state shows only the count, derived as `settingRows.length` — never a literal.

**`ShortcutTile.tsx`** — a thin wrapper over the shared `ProfileCard`, fixing the props this concept always passes so the grid cannot drift row to row:

```tsx
interface ShortcutTileProps {
  profile: TunedProfile;
  unlocked: boolean;
}
// renders <ProfileCard size="tile" sentence="delta" showComposition
//           state={unlocked ? "active" : "locked"} ... />
```

Grid columns by profile count: one profile renders a single tile at half body width and left-aligned rather than stretched; two renders `grid-cols-2`; three or more renders `grid-cols-3` and wraps. Six intents produce two rows of three.

## 4. States

**Intro.** `ConceptFrame` handles this entirely — centered header, spinner, body hidden via its own `invisible absolute` treatment. The concept contributes nothing.

**Applying.** The anchor bar mounts immediately when `introDone` flips, in its unsettled state: the status line reads "Turning on your protection…" with the shared `Spinner` at 16px in place of the lit glyph. Each setting row resolving adds its chip to the anchor's expanded panel and increments the collapsed count. Profile tiles mount one at a time through `MaterializingSlot`, each with a `PhaseOnePlaceholder` in `arrangement="block"` for its Phase 1.

**Resolved, Free.** Anchor settles: glyph swaps to `assets/checkmark-circle-filled.svg`, status line becomes "Your protection is on.", coverage line reads `baselineCoverage(intentNames)`. Tiles render `state="locked"` — dimmed glyph, muted text, and a `DestinationChip` with `planAware` so non-free-runnable destinations carry the Plus badge. The Plus availability label appears once per tile.

**Resolved, Plus.** Identical layout. `paidUnlocked` is true, so tiles render `state="active"` — full-opacity glyph, white text, no Plus badge on any destination chip, and the Plus availability label is absent. The anchor is unchanged, because the baseline is the same thing on both plans.

**Reduced motion.** `useReducedMotion()` result is passed to `ConceptFrame` (which skips the centered-to-top travel) and to every `MaterializingSlot` (which skips Phase 1 and fades resolved content in directly). The anchor renders settled immediately with no spinner. The expand panel uses a plain show/hide with no height transition. No concept-specific reduced-motion branches beyond passing the flag.

## 5. Motion

Everything is driven by existing keys in [timing.ts](../../../src/app/onboarding-v2/tuned-result/timing.ts) via `useProfilesConceptData`. No new timing constants.

- Intro and header travel: `centerHold`, `moveToTop`, `iconCrossfade` — owned by `ConceptFrame`.
- Per-row cadence: `spinnerHold`, `resolveDuration`, `rowGap`, with `spinnerHoldCompressed` engaging automatically past `pacingGuardRowThreshold`.
- Anchor settle: fires on the same tick the last setting row resolves. Glyph crossfade at 300ms, matching `resolveDuration`.
- Continue: `continueDelayMs` from the hook, applied by `ConceptFrame`.
- Anchor expand/collapse: CSS transition, 150ms, matching the hover transitions used throughout this screen. Not a Framer animation and not a timing-table entry, because it is user-initiated rather than part of the choreography.

The anchor deliberately does **not** animate in after the tiles. It is the first thing present and the last thing to change state, which is what makes it read as the foundation rather than as a result.

## 6. Copy

New key in `TUNING_CONCEPTS_COPY` in [conceptsCopy.ts](../../../src/app/onboarding-v2/tuned-result/conceptsCopy.ts), alongside the existing three:

```ts
profilesBaseline: {
  anchorTitleDuring: "Turning on your protection…",
  anchorTitleComplete: "Your protection is on.",
  anchorDisclosureLabel: "What we changed",
  anchorSettingsCount: (n: number) => `${n} ${n === 1 ? "setting" : "settings"}`,
  shortcutsHeader: "One-tap shortcuts, built for what you picked",
  plusFeatureLine: (featureName: string) => `Also with VPN Plus: ${featureName}`,
},
```

From `profilesCopy.ts` ([_foundation.md](_foundation.md) §6): `baselineCoverage(intentNames)` for the anchor's second line, `NOT_A_CHOICE_LINE` under the shortcuts header, `PERSISTENCE_CAPTION` beneath the grid, `PLUS_AVAILABILITY_LABEL` on locked tiles.

Tile sentences come from `TunedProfile.deltaSentence`. Header title, subtitle and summary come from the hook, unchanged, so all four tones still work.

**The delta pattern is load-bearing.** Every tile's sentence opens "Everything above, plus…", referring to the anchor directly above it. A user cannot read a tile without being reminded the baseline exists. This is the mechanism that makes the mutually-exclusive misreading unavailable, so it is a hard constraint on future copy edits, not a stylistic preference. It is also the concept's main copywriting cost — six tiles opening with the same four words gets repetitive, and any variation must preserve the relative framing.

## 7. Data requirements

Everything from `useProfilesConceptData`:

- `settingRows` → the anchor's chips and its count
- `intentNames` → `baselineCoverage()`
- `profileRows` → the tile grid, one tile per entry, selection order preserved
- `plusFeatureRows` → the single muted line; if empty, the line is omitted entirely rather than rendered blank
- `paidUnlocked` → tile state
- `rowStages` / `rowMounted` / `introDone` / `rowsComplete` → what is on screen when

Per tile, from `TunedProfile`: `name`, `icon`, `countryLabel`, `freeRunnable`, `deltaSentence`, and `profileSettings(jtbd).length` for the composition line.

No data this concept needs is missing from the foundation.

## 8. Settings tuning: stays

**Stays, compressed into the anchor as collapsible evidence.** Not a list, not rows, not its own section — one summary line with a disclosure control.

Rationale: on this screen the settings have exactly one remaining job, which is making the anchor bar credible. Credibility should be available on demand rather than displayed permanently. Collapsed by default respects a first-time user who is put off by technical detail; expandable satisfies the minority who want proof. Removing them entirely would leave the anchor as an unfalsifiable claim, which is the one thing a privacy product cannot afford.

The chips keep the existing `{label}: {value}` treatment and the existing tooltips, so a user who expands the panel sees exactly what the default concept would have shown them, in the same words.

## 9. The mandated behaviours

**What a Free user gets.** The anchor bar — the brightest, highest-contrast, first-present element on the screen — as a real, active, complete outcome, plus fully readable shortcut tiles marked "Available with VPN Plus".

This concept's answer is architectural, which is its main advantage: the free outcome owns the visual hierarchy while the Plus outcome owns the square footage. A Free user's eye lands on something that is theirs and is working, not on a screen of locked content with a consolation line. **No new entitlement is required**, so this is buildable today without waiting on a product decision.

**Clarity about what a profile does.** Three layers per tile, in decreasing brevity: the destination chip answers "where does this put me", the composition line answers "how many things is this" (borrowed from Google Home's "1 starter · 2 actions"), and the delta sentence answers "what changes". None of them requires understanding a technical term.

This is the concept's weakest dimension, and worth stating plainly: the clarity mechanism is reading. The usability finding that motivated this work — one participant saying "I don't know what will happen if I click" — came from a screen that already had words on it. `05-rehearsal.md` exists to fix exactly this, and is designed to layer onto this concept's tiles without restructuring them.

**R1 — "Why not one profile with all of them?"** The anchor *is* that profile, and its coverage line names every selected intent explicitly. The honest framing follows: the combined setup is what is already running; the shortcuts exist because sometimes you want to lean into one thing, not because your protection is divided. With a single intent selected the coverage line names one thing and the answer still holds.

**R2 — "Travel but also privacy?"** Answered twice over, structurally. The two registers establish that one thing is protection and the other is shortcuts; the delta sentence pattern makes every tile describe itself as an addition. `NOT_A_CHOICE_LINE` under the shortcuts header states it once in words for anyone who wants it said. There is no state of this screen in which a shortcut looks like a choice against another need.

**R3 — persistence.** `PERSISTENCE_CAPTION` beneath the grid: "These stay in your sidebar. Use one any time, or none at all." The second clause is deliberate — it grants permission to ignore profiles entirely, which is what a user afraid of choosing wrongly needs to hear. Backed by [_sidebar-handoff.md](_sidebar-handoff.md) actually making the sidebar match. `SidebarDockIllustration` is available but **not** used here: this concept already has two registers competing for attention and a third visual element would blunt the anchor.

## 10. Wiring

Follow [_foundation.md](_foundation.md) §7. Specifics for this concept:

- Concept id constant: `PROFILES_BASELINE_CONCEPT = "profiles-baseline"`, passed to `ConceptFrame`'s `concept` prop. Analytics (`useTrackTuningView`, `trackTuningEvent` for back and continue) then works with no further wiring.
- Registry entry: `{ value: "profiles-baseline", label: "Profiles — Baseline + shortcuts" }`.
- Render block passes `userPlan={plan}` and the plan-aware `onContinue` from [_foundation.md](_foundation.md) §4.4.
- No `App.tsx` change.

## 11. Trade-offs, risks, verification

**Risks.**

- The screen has two subjects, one more than ideal. Some users will read the anchor as a page header and skip it, which loses the entire reassurance mechanism. This is the single assumption the concept rests on, and it is cheap to test with a static mock before building.
- It is the least novel of the five. A summary bar over a tile grid is a familiar shape and may not feel like the step-change in ambition the brief reaches for.
- The tiles' deliberately lighter register sits in tension with the ask for profiles to be visually engaging. If the tiles are pushed toward more visual richness, the register contrast that carries R2 weakens. That trade is the core tuning dial of this design and should be resolved with a designer rather than in code.
- The delta pattern constrains copy permanently (§6).

**Verification.**

- `npx tsc --noEmit` clean; `npm run build` succeeds.
- Select the concept from the HUD "Concept:" dropdown on the tuning stage. Switching to and from it remounts cleanly via `key={tuningConcept}`.
- Single mode, each of the six intents in turn: exactly one tile, correct name, correct destination, delta sentence present, anchor coverage line naming that one intent.
- Multiple mode at two, three and six intents: tile count matches selection, order matches selection order, grid columns behave per §3, and the screen does not scroll at six on the default window size.
- Free plan: every tile locked with the Plus availability label; non-free-runnable destinations (Streaming, Privacy, Access) show the Plus badge on the destination chip; free-runnable ones (Gaming, Travel, Downloading) do not.
- Plus plan: no tile shows a Plus badge or availability label, and Continue exits straight to the app rather than the upsell.
- Anchor: reads "Turning on your protection…" during, "Your protection is on." after; the disclosure reveals exactly `settingRows.length` chips with values matching `JTBD_TUNING_RESULT`.
- All four tones render without layout breakage; the anchor and tile copy are identical across tones by design.
- `prefers-reduced-motion`: no spinners, no centered-to-top travel, everything present immediately, Continue still appears.
- The three existing concepts and the default `TunedResult` are unchanged.
