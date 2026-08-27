# Concept 3 — The Draft

**Concept id:** `profiles-draft`
**Dropdown label:** `Profiles — Editable drafts`
**Build order:** fifth. Blocked on a free-tier quota decision (§9) and introduces text input, which is new to this screen.

> Prerequisite: [_foundation.md](_foundation.md). Registration follows [_foundation.md](_foundation.md) §7. Depends on `effectiveProfileSettings` ([_foundation.md](_foundation.md) §2.2b) and the `DockEntry` shape of `SidebarDockIllustration` ([_foundation.md](_foundation.md) §5.2).

## 1. Essence

The tuning screen produces a *proposal*, not a verdict. The user sees the setups the app drafted for them, renames them, drops the ones they don't want, combines the ones they'd rather have as one, and watches their sidebar assemble itself as they go.

The only concept that hands the user authorship, and the only one where "why not one profile with all of them?" is answered by letting them do it.

## 2. What the user sees

Body slot at `bodyMaxWidthClassName="max-w-[920px]"`, two columns.

**Left column, roughly three fifths — the drafts.** At the top, a **pinned protection block**: "Everyday protection", the intents it covers, its settings as chips, and no checkbox, because it cannot be removed. It is visually distinct from everything below it.

Beneath the pinned block, the drafts. Each row has an include checkbox (checked by default), the intent glyph, an editable name, and a destination line. Selecting two or more rows reveals a **"Combine into one"** action.

**Right column, roughly two fifths — the sidebar preview.** A live representation of the app's Profiles list, updating as the user includes, excludes, renames and combines. Its caption states that this is what they'll find in the app.

Beneath both columns: the muted Plus feature line when the data has one.

## 3. Component tree

New folder `src/app/onboarding-v2/tuned-result/concepts/profiles-draft/`.

**`ProfilesDraftConcept.tsx`**

```tsx
export const PROFILES_DRAFT_CONCEPT = "profiles-draft";

export default function ProfilesDraftConcept({
  jtbdKey, selectionMode = "single", selectedJtbds,
  tone = "straightforward", userPlan = "free", onContinue, onBack,
}: TuningConceptProps)
```

**`useDrafts.ts`** — the editing model. The most stateful thing in this family, so it lives in its own hook.

```ts
export interface DraftProfile {
  /** Stable across edits. Source intents joined for single-source drafts,
   * or a generated id for combinations. */
  id: string;
  /** Source intents. Length > 1 once combined. */
  jtbds: JtbdId[];
  /** User-editable. Seeded from TunedProfile.name, or from the combination
   * naming rule for merged drafts. */
  name: string;
  included: boolean;
  /** Resolved per §4. */
  country: string | null;
  countryLabel: string;
  icon: string;
  /** Union of the source intents' settings, never weaker than the
   * baseline — effectiveProfileSettings applied per source, merged. */
  settings: ProfileSetting[];
  /** True for combinations, so the UI can label them and allow splitting. */
  combined: boolean;
}

interface UseDraftsResult {
  drafts: DraftProfile[];
  selectedIds: Set<string>;
  toggleIncluded: (id: string) => void;
  toggleSelected: (id: string) => void;
  rename: (id: string, name: string) => void;
  combine: (ids: string[]) => void;
  split: (id: string) => void;
  /** Free-tier quota, when one applies. See §9. */
  keptCount: number;
  quota: number | null;
}

export function useDrafts(
  profiles: TunedProfile[],
  baselineSettings: ProfileSetting[],
  quota: number | null,
): UseDraftsResult
```

Initialised once from `profileRows`, all included. Must not reset when the materialization state changes — seed with a `useState` initialiser keyed on the selection, not a `useEffect` on every render.

**`ProtectionBlock.tsx`** — the pinned, non-removable block. Same content contract as `04-baseline.md`'s `ProtectionAnchor` (settings chips, coverage line, settle state). If both concepts are built, share one component; if only this one, build it here.

**`DraftRow.tsx`**

```tsx
interface DraftRowProps {
  draft: DraftProfile;
  selected: boolean;
  /** False while the applying sequence is still running. */
  interactive: boolean;
  /** True when including this draft would exceed the free quota. */
  quotaBlocked: boolean;
  onToggleIncluded: () => void;
  onToggleSelected: () => void;
  onRename: (name: string) => void;
  onSplit: () => void;
}
```

**`DraftNameInput.tsx`** — the one genuinely new interaction pattern on this screen.

Click-to-edit rather than a permanently open field, so the default state reads as a list rather than a form. Enter and blur commit; Escape reverts. Max length 32, matching what a sidebar row can display without truncation. Empty or whitespace-only reverts to the previous name rather than showing a validation error — the gentlest possible failure for a cosmetic field. Duplicate names are allowed; the real app permits them and inventing a uniqueness rule here would be fabricating product behaviour. Styling follows the search field in [CountrySelect.tsx](../../../src/app/onboarding-v2/components/CountrySelect.tsx) — this flow's only existing text input — so it looks native rather than borrowed from the main app.

The input must expose an accessible label ("Rename this profile") and the row must remain fully keyboard operable: tab to the checkbox, tab to the name, Enter to edit.

**Sidebar preview** — the shared `SidebarDockIllustration` with `live` on, fed from the included drafts:

```ts
const entries: DockEntry[] = drafts
  .filter((d) => d.included)
  .map((d) => ({ id: d.id, name: d.name, icon: d.icon, locked: !paidUnlocked }));
```

## 4. Combining — the rules

Combination is this concept's whole reason for existing, so its rules are explicit rather than left to implementation.

**Settings.** The union of the source intents' settings, resolved strictest-wins through `mergeFreeSettings(jtbds)` — the existing engine in [lib/jtbdMerge.ts](../../../src/app/onboarding-v2/lib/jtbdMerge.ts) — then passed through `effectiveProfileSettings` against the baseline. A combination is therefore never weaker than any of its parts, which is the property that lets the UI describe it as "everything both of these do".

**Destination.** If every source shares the same `countryLabel`, keep it. Otherwise the combination falls back to the fastest-country rule, `country: null` and `countryLabel: "Fastest country"`, and the row says so with `combinedDestinationNote`. This is the honest answer: a single connection cannot be in two countries, and silently picking one source's country would misdescribe the result.

**Name.** Seeded by joining the source names with "and" — "Travel and Privacy" — up to two sources; three or more seeds as "My setup". Always immediately editable, and the naming affordance should be obvious right after combining, since that is when the user most wants to name the thing they just made.

**Icon.** The first source intent's icon. No new artwork.

**Splitting.** A combination can be split back into its sources, restoring their original names. This makes combining safe to try, which matters because it is the one destructive-feeling action on the screen.

## 5. States

**Intro / applying.** `ConceptFrame` owns the intro. Setting rows fill the pinned protection block's chips. Profile rows then materialize as draft rows through `MaterializingSlot`, and each one appearing also inserts its entry into the live sidebar preview — so the preview assembles itself in front of the user before they touch anything, which teaches the mechanic without instruction.

**Idle, editable.** All editing is gated on `rowsComplete`. Checkboxes, names and the combine action are inert until the app has finished applying, both because editing a moving list is unpleasant and because the drafts are not final until the schedule completes.

**Selection.** Two or more rows selected reveals "Combine into one". One or zero hides it.

**Quota reached (Free, if a quota applies).** Rows beyond the quota render `quotaBlocked`: the checkbox is disabled with the Plus availability label, and the row explains that keeping more is a Plus feature. Never an error treatment.

**Resolved, Plus.** No quota. Every draft can be kept, renamed and combined. The preview shows every included draft unmuted.

**Reduced motion.** Preview entries appear and disappear without layout animation. Draft rows do not animate on reorder. Everything else is identical, since the concept's value is control rather than motion.

## 6. Motion

No new timing keys.

The applying phase uses the shared schedule (`spinnerHold`, `resolveDuration`, `rowGap`) and `ConceptFrame`'s intro keys. Preview insertions and removals use Framer's `layout` with `resolveDuration`, so the sidebar's response to an edit is quick and legible rather than decorative. Combining animates the source rows collapsing into one using the same duration.

## 7. Copy

New key in `TUNING_CONCEPTS_COPY` in [conceptsCopy.ts](../../../src/app/onboarding-v2/tuned-result/conceptsCopy.ts):

```ts
profilesDraft: {
  draftsHeader: "We drafted these for you — keep what's useful",
  protectionPinnedNote: "Always on. This one isn't optional.",
  combineLabel: "Combine into one",
  splitLabel: "Split back apart",
  combinedBadge: "Combined",
  combinedDestinationNote: "These use different locations, so this one connects to the fastest country.",
  renameHint: "Rename this profile",
  previewCaption: "This is what you'll find in your app.",
  quotaNote: (n: number) => `Keep ${n} on the free plan. VPN Plus keeps as many as you like.`,
  emptyPreview: "No shortcuts kept. Your protection stays on either way.",
},
```

From `profilesCopy.ts`: `BASELINE_NAME` and `baselineCoverage(intentNames)` for the pinned block, `PLUS_AVAILABILITY_LABEL`, `PERSISTENCE_CAPTION`.

`emptyPreview` matters more than its size suggests: a user who unchecks everything must be told they are still protected, not shown an empty state that implies they broke something.

Header strings come from `useProfilesConceptData` unchanged; all four tones work.

## 8. Settings tuning: stays, in one place only

**Stays, but only inside the pinned protection block.** Draft rows show a destination line and no settings chips.

Rationale: this screen already asks the user to make several decisions, and settings are not among them — they are not editable here and offering them per row would imply otherwise. Keeping them in the pinned block preserves the evidence that the baseline is real while keeping the draft rows scannable enough to actually edit. A combined draft's merged settings are computed and carried in the model (§4) but not displayed, so the data stays correct even where it is not shown.

## 9. What a Free user gets

Two candidate answers. **This must be decided before building**, because they produce materially different screens.

**Primary proposal — a one-profile free quota.** A Free user keeps one profile of their choosing, fully working, that they named themselves. VPN Plus removes the limit. `quota` is `1` on Free and `null` on Plus.

This is the strongest free payoff of the five concepts: not a demonstration, not a description, but one real, usable, personally named artifact. It also creates a genuinely motivated upgrade moment — a user who wants their second one has already understood the value, and the ask arrives from their own intent rather than from a pitch.

**It is a product decision, not a design one.** [_sidebar-handoff.md](_sidebar-handoff.md) §6 describes today's behaviour, where generated profiles are disabled on Free, and this concept contradicts that deliberately. Nothing in this spec grants the entitlement, and the concept must not be built as though the question is settled.

**Fallback if the quota is rejected.** `quota` is `null` on Free too, every draft is kept, and the kept rows land in the sidebar disabled exactly as they do today. The free payoff shrinks to the pinned protection block plus the authorship itself — naming and organising things they cannot yet use.

That is a weaker proposition and worth being blunt about: editing something you can't use is a strange experience, and it is close to the "shown things I can't have" trap the brief warns against. If the quota is rejected, [04-baseline.md](04-baseline.md) is the better use of the effort.

## 10. The remaining mandated behaviours

**Clarity about what a profile does.** Weaker than the Deck's comparison and the Rehearsal's demonstration, and differently sourced: understanding comes from *editing*. Renaming a thing, deciding whether to keep it, and watching it appear in a preview of your own sidebar teaches what it is more durably than a sentence does — but it demands engagement, and a user who wants to click Continue and leave learns less here than in any other concept.

**R1 — "Why not one profile with all of them?"** The strongest answer of the five, because the user simply does it. Select two drafts, combine, name the result. The instinct is not explained away or redirected to a card someone else authored; it is granted. Everything in §4 exists to make that grant honest.

**R2 — "Travel but also privacy?"** Two mechanisms. The pinned, non-removable protection block makes it structurally impossible to read the drafts as protection choices — one thing on the screen cannot be turned off, and it is the one that protects you. And a user with this exact worry can combine Travel and Privacy into a single profile, which resolves the question by construction.

**R3 — persistence.** The live sidebar preview is the most literal answer available: the user watches the destination fill up as they edit, so persistence is demonstrated rather than promised. Backed by [_sidebar-handoff.md](_sidebar-handoff.md), which is a hard dependency here in a way it is not elsewhere — a preview that turns out to be wrong is worse than no preview.

## 11. Wiring

Per [_foundation.md](_foundation.md) §7, with `PROFILES_DRAFT_CONCEPT` as the analytics id.

One further consideration, and a real one: the user's edits are currently discarded at Continue, because the handoff carries only `selectedJtbds` and (per [_sidebar-handoff.md](_sidebar-handoff.md)) `selectedCountry`. To honour custom names and combinations in the sidebar, the handoff would need to carry the drafts themselves — a larger change than that spec covers, since `CountryBrowser` derives its rows from `JTBD_PROFILES` rather than from an arbitrary list.

For a prototype demonstrating the interaction, discarding the edits is acceptable. **It must be recorded as a known gap**, because this is the one concept where the promise made on screen — a live preview of your sidebar — is contradicted by the next screen unless the handoff is extended. Of all five concepts this is the largest gap between what the design claims and what the plumbing delivers.

Worth tracking: how many users rename anything, how many combine, and how many uncheck a draft. Whether people actually want authorship is the core hypothesis of this concept and it is cheap to measure.

## 12. Trade-offs, risks, verification

**Risks.**

- **Work at the wrong moment.** Onboarding is where users are least willing to configure things. This concept asks for editing at the exact point most users want to be finished. Sensible defaults with everything included mean Continue is always a valid answer, but the screen still *looks* like a form, and looking like work is enough to lose people.
- **Most state of the five, by a wide margin.** Names, inclusion, selection, combinations, splits, quota, plus the preview derived from all of it.
- **Blocked on the quota decision** (§9), and materially weaker without it.
- **The handoff gap** (§11) — the concept's central promise is the one most exposed to plumbing that does not exist.
- Combination rules (§4) are the kind of thing that looks simple until three intents with three different countries are combined. The fallback-to-fastest rule is honest but may surprise; the note is essential.
- Text input introduces an input-method surface — IME, autofill, long strings, non-Latin scripts — that this screen has never had.

**Verification.**

- `npx tsc --noEmit` clean; `npm run build` succeeds.
- Single mode: one draft row plus the pinned block; the combine action never appears; the preview shows one entry.
- Multiple mode at three and six intents: one row per intent in selection order, all included by default, preview matching.
- Editing is inert until the applying sequence completes, then becomes available.
- Rename: Enter commits, blur commits, Escape reverts, empty reverts, 32-char cap enforced, and the preview updates immediately on commit.
- Uncheck a draft: it leaves the preview. Uncheck all: `emptyPreview` shows and the pinned block is untouched.
- The pinned protection block has no checkbox and cannot be removed in any state.
- Combine two drafts with the same destination: the destination is preserved. Combine two with different destinations: falls back to "Fastest country" with `combinedDestinationNote`. Combine three or more: name seeds as "My setup".
- Combined settings are the strictest union — select Gaming and Privacy, combine, and the merged settings carry Kill Switch `"Advanced"`.
- Split a combination: sources return with their original names and inclusion state.
- Free with quota `1`: exactly one draft can be included; further rows are `quotaBlocked` with the availability label and no error styling. `quotaNote` renders with the real number.
- Plus: no quota anywhere, preview entries unmuted, Continue exits to the app rather than the upsell.
- Full keyboard operability: checkbox, name edit, combine, split, all reachable and labelled.
- All four tones render without layout breakage.
- `prefers-reduced-motion`: no layout animation on preview changes or combining; all editing still works.
- The default `TunedResult` and the three existing concepts are unchanged.
